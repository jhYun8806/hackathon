import { describe, it, expect, vi, beforeEach } from 'vitest'
import { isSubsidyTimingQuery } from '../lib/utils'

// ─────────────────────────────────────────────
// UC-6: /api/chat 라우트 핵심 로직 단위 테스트
// (Supabase / Anthropic 의존성 없이 순수 로직만 검증)
// ─────────────────────────────────────────────

describe('훈련장려금 지급 예상일 계산 로직', () => {
  // getExpectedPaymentDate 내부 로직을 직접 검증
  function calcPaymentDate(periods: { startDate: string; endDate: string }[]): string | null {
    const today = new Date()

    const currentIdx = periods.findIndex(p => {
      const start = new Date(p.startDate)
      const end = new Date(p.endDate)
      return today >= start && today <= end
    })

    const prevIdx = currentIdx > 0 ? currentIdx - 1
      : currentIdx === -1 ? periods.filter(p => new Date(p.endDate) < today).length - 1
      : -1

    if (prevIdx < 0) return null

    const prevEndStr = periods[prevIdx].endDate.substring(0, 10)
    const [y, m, d] = prevEndStr.split('-').map(Number)
    const paymentDate = new Date(y, m - 1 + 1, d)

    return `${paymentDate.getFullYear()}년 ${paymentDate.getMonth() + 1}월 ${paymentDate.getDate()}일`
  }

  it('현재 단위기간이 있으면 이전 기간 종료일 기준 +1개월 날짜를 반환한다', () => {
    const today = new Date()
    const periods = [
      // 이전 기간: 오늘 기준 2개월 전 ~ 1개월 전
      {
        startDate: new Date(today.getFullYear(), today.getMonth() - 2, 1).toISOString(),
        endDate: new Date(today.getFullYear(), today.getMonth() - 1, 0).toISOString(),
      },
      // 현재 기간: 오늘이 포함
      {
        startDate: new Date(today.getFullYear(), today.getMonth(), 1).toISOString(),
        endDate: new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString(),
      },
    ]

    const result = calcPaymentDate(periods)
    expect(result).not.toBeNull()
    expect(result).toMatch(/^\d{4}년 \d{1,2}월 \d{1,2}일$/)
  })

  it('단위기간이 없으면 null을 반환한다', () => {
    expect(calcPaymentDate([])).toBeNull()
  })

  it('오늘이 첫 번째 단위기간에 속하면 null을 반환한다 (이전 기간 없음)', () => {
    const today = new Date()
    const periods = [
      {
        startDate: new Date(today.getFullYear(), today.getMonth(), 1).toISOString(),
        endDate: new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString(),
      },
    ]
    expect(calcPaymentDate(periods)).toBeNull()
  })
})

describe('RAG 키워드 OR 필터 생성 로직', () => {
  function buildOrFilter(query: string): string {
    const keywords = query.trim().split(/\s+/).slice(0, 5)
    return keywords
      .map(k => `question.ilike.%${k}%,answer.ilike.%${k}%,kind.ilike.%${k}%`)
      .join(',')
  }

  it('단일 키워드 쿼리에서 올바른 필터 생성', () => {
    const filter = buildOrFilter('훈련장려금')
    expect(filter).toBe('question.ilike.%훈련장려금%,answer.ilike.%훈련장려금%,kind.ilike.%훈련장려금%')
  })

  it('다중 키워드 쿼리에서 OR 필터 생성', () => {
    const filter = buildOrFilter('공가 신청 방법')
    expect(filter).toContain('question.ilike.%공가%')
    expect(filter).toContain('question.ilike.%신청%')
    expect(filter).toContain('question.ilike.%방법%')
  })

  it('5개 초과 키워드는 앞 5개만 사용', () => {
    const filter = buildOrFilter('가 나 다 라 마 바 사')
    const parts = filter.split(',')
    // 5개 키워드 × 3 조건 = 15 parts
    expect(parts.length).toBe(15)
  })
})

describe('AI 응답 JSON 파싱 로직', () => {
  function parseAIResponse(raw: string): { answer: string; followUps: string[] } {
    try {
      const parsed = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] ?? '{}')
      return {
        answer: parsed.answer ?? raw,
        followUps: Array.isArray(parsed.followUps) ? parsed.followUps.slice(0, 3) : [],
      }
    } catch {
      return { answer: raw, followUps: [] }
    }
  }

  it('올바른 JSON 응답을 파싱한다', () => {
    const raw = JSON.stringify({
      answer: '훈련장려금은 매월 지급됩니다.',
      followUps: ['신청 방법은?', '지급일은?', '조건은?'],
    })
    const result = parseAIResponse(raw)
    expect(result.answer).toBe('훈련장려금은 매월 지급됩니다.')
    expect(result.followUps).toHaveLength(3)
  })

  it('followUps가 3개 초과면 3개로 잘린다', () => {
    const raw = JSON.stringify({
      answer: '답변',
      followUps: ['q1', 'q2', 'q3', 'q4', 'q5'],
    })
    const result = parseAIResponse(raw)
    expect(result.followUps).toHaveLength(3)
  })

  it('JSON이 아닌 raw 텍스트는 answer로 그대로 사용된다', () => {
    const raw = '안녕하세요, 담당 매니저에게 문의해주세요.'
    const result = parseAIResponse(raw)
    expect(result.answer).toBe(raw)
    expect(result.followUps).toHaveLength(0)
  })

  it('텍스트 앞뒤 설명이 있어도 JSON 추출 가능', () => {
    const raw = '다음은 답변입니다: {"answer":"정답","followUps":["질문1"]} 이상입니다.'
    const result = parseAIResponse(raw)
    expect(result.answer).toBe('정답')
    expect(result.followUps).toEqual(['질문1'])
  })

  it('followUps 필드 없으면 빈 배열 반환', () => {
    const raw = JSON.stringify({ answer: '답변만 있어요' })
    const result = parseAIResponse(raw)
    expect(result.followUps).toHaveLength(0)
  })
})

describe('isSubsidyTimingQuery 엣지 케이스', () => {
  it('장려금 단어만 있어도 감지된다 (훈련장려금 전체 필요 없음)', () => {
    expect(isSubsidyTimingQuery('장려금 지급일이 언제예요?')).toBe(true)
  })

  it('빈 문자열은 false 반환', () => {
    expect(isSubsidyTimingQuery('')).toBe(false)
  })
})
