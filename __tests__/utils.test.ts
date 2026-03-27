import { describe, it, expect } from 'vitest'
import {
  getFriendlyLabel,
  inferInquiryType,
  isSubsidyTimingQuery,
  INQUIRY_ACTION_ITEMS,
  DOC_ITEMS,
} from '../lib/utils'

// ─────────────────────────────────────────────
// UC-1: URL → 친근한 라벨 변환 (getFriendlyLabel)
// ─────────────────────────────────────────────
describe('getFriendlyLabel', () => {
  it('문의 접수 페이지 URL을 올바른 라벨로 변환한다', () => {
    expect(getFriendlyLabel('https://nbcamp.spartacodingclub.kr/mypage/support')).toBe('문의 접수 페이지')
  })

  it('QR코드 출석 가이드 URL을 올바른 라벨로 변환한다', () => {
    expect(getFriendlyLabel('https://teamsparta.notion.site/QR-1592dc3ef51480df8b7ae96eb0055539')).toBe('QR코드 출석 가이드')
  })

  it('출석 및 공가 신청 가이드 URL을 올바른 라벨로 변환한다', () => {
    expect(getFriendlyLabel('https://teamsparta.notion.site/QR-15f2dc3ef514803395b7e3875fd03199')).toBe('출석 및 공가 신청 가이드')
  })

  it('KDT 훈련생 유의사항 URL을 올바른 라벨로 변환한다', () => {
    expect(getFriendlyLabel('https://teamsparta.notion.site/KDT-dd9b2fac3ff0428f899f23155b07233b')).toBe('KDT 훈련생 유의사항')
  })

  it('고객센터 URL을 올바른 라벨로 변환한다', () => {
    expect(getFriendlyLabel('https://support.spartacodingclub.kr/')).toBe('고객센터 채팅 상담')
  })

  it('KDT 신문고 URL을 올바른 라벨로 변환한다', () => {
    expect(getFriendlyLabel('https://nbcamp.spartacodingclub.kr/petition')).toBe('KDT 신문고')
  })

  it('국비 지원 FAQ URL을 올바른 라벨로 변환한다', () => {
    expect(getFriendlyLabel('https://docs.channel.io/nbcampwiki/ko/categories/-%EA%B5%AD%EB%B9%84%EC%A7%80%EC%9B%90-FAQ')).toBe('국비 지원 FAQ')
  })

  it('매핑 없는 URL은 hostname을 반환한다', () => {
    expect(getFriendlyLabel('https://unknown-domain.com/some/path')).toBe('unknown-domain.com')
  })

  it('www. prefix를 제거한다', () => {
    expect(getFriendlyLabel('https://www.example.com/page')).toBe('example.com')
  })

  it('잘못된 URL 형식은 원본 문자열을 반환한다', () => {
    expect(getFriendlyLabel('not-a-valid-url')).toBe('not-a-valid-url')
  })
})

// ─────────────────────────────────────────────
// UC-2: 훈련장려금 타이밍 질문 감지 (isSubsidyTimingQuery)
// ─────────────────────────────────────────────
describe('isSubsidyTimingQuery', () => {
  it('훈련장려금 지급 시점 질문 감지한다', () => {
    expect(isSubsidyTimingQuery('훈련장려금은 언제 나오나요?')).toBe(true)
  })

  it('장려금 지급일 질문 감지한다', () => {
    expect(isSubsidyTimingQuery('장려금 지급일이 언제예요?')).toBe(true)
  })

  it('훈련장려금 입금일 질문 감지한다', () => {
    expect(isSubsidyTimingQuery('훈련장려금 입금 언제 되나요?')).toBe(true)
  })

  it('훈련장려금 받을 수 있는 날짜 질문 감지한다', () => {
    expect(isSubsidyTimingQuery('훈련장려금 받을 수 있는 날짜가 언제예요?')).toBe(true)
  })

  it('훈련장려금이 있지만 타이밍 키워드 없으면 false 반환한다', () => {
    expect(isSubsidyTimingQuery('훈련장려금 신청 방법 알려주세요')).toBe(false)
  })

  it('타이밍 키워드가 있지만 훈련장려금이 없으면 false 반환한다', () => {
    expect(isSubsidyTimingQuery('출석 공가 신청은 언제까지 하나요?')).toBe(false)
  })

  it('관련 없는 질문은 false 반환한다', () => {
    expect(isSubsidyTimingQuery('수강신청은 어떻게 하나요?')).toBe(false)
  })
})

// ─────────────────────────────────────────────
// UC-3: 문의 유형 추론 (inferInquiryType)
// ─────────────────────────────────────────────
describe('inferInquiryType', () => {
  it('기기/노트북 언급 → 기기대여 요청', () => {
    expect(inferInquiryType([
      { role: 'user', content: '노트북 대여 신청하고 싶어요' },
    ])).toBe('기기대여 요청')
  })

  it('웹캠/마이크 언급 → 기기대여 요청', () => {
    expect(inferInquiryType([
      { role: 'user', content: '웹캠이 필요한데 어떻게 신청하나요?' },
    ])).toBe('기기대여 요청')
  })

  it('강의 오류 언급 → 수강환경 제보', () => {
    expect(inferInquiryType([
      { role: 'user', content: '강의에 오타가 있어요' },
    ])).toBe('수강환경 제보')
  })

  it('노션 자료 링크 언급 → 수강환경 제보', () => {
    expect(inferInquiryType([
      { role: 'user', content: '노션 링크가 깨졌어요' },
    ])).toBe('수강환경 제보')
  })

  it('진로 상담 언급 → 학습 및 진로 상담', () => {
    expect(inferInquiryType([
      { role: 'user', content: '진로 방향이 고민돼요' },
    ])).toBe('학습 및 진로 상담')
  })

  it('멘토 커리어 언급 → 학습 및 진로 상담', () => {
    expect(inferInquiryType([
      { role: 'user', content: '멘토 커리어 상담 받고 싶어요' },
    ])).toBe('학습 및 진로 상담')
  })

  it('기타 행정 문의 → 행정 문의/요청 (기본값)', () => {
    expect(inferInquiryType([
      { role: 'user', content: '훈련장려금 신청 방법이 궁금해요' },
    ])).toBe('행정 문의/요청')
  })

  it('빈 히스토리 → 행정 문의/요청 (기본값)', () => {
    expect(inferInquiryType([])).toBe('행정 문의/요청')
  })

  it('멀티 턴 대화에서 전체 내용 기반으로 추론한다', () => {
    expect(inferInquiryType([
      { role: 'user', content: '안녕하세요' },
      { role: 'assistant', content: '안녕하세요! 무엇을 도와드릴까요?' },
      { role: 'user', content: '기기 대여 문의요' },
    ])).toBe('기기대여 요청')
  })
})

// ─────────────────────────────────────────────
// UC-4: 액션 아이템 및 문서 아이템 상수 검증
// ─────────────────────────────────────────────
describe('INQUIRY_ACTION_ITEMS', () => {
  it('7개 메뉴 항목이 존재한다', () => {
    expect(INQUIRY_ACTION_ITEMS).toHaveLength(7)
  })

  it('필수 메뉴 항목들이 포함되어 있다', () => {
    expect(INQUIRY_ACTION_ITEMS).toContain('학습 및 진로 상담')
    expect(INQUIRY_ACTION_ITEMS).toContain('수강환경 제보')
    expect(INQUIRY_ACTION_ITEMS).toContain('행정 문의/요청')
    expect(INQUIRY_ACTION_ITEMS).toContain('기기대여 요청')
    expect(INQUIRY_ACTION_ITEMS).toContain('수기출석부 발급')
    expect(INQUIRY_ACTION_ITEMS).toContain('훈련참여확인서 발급')
    expect(INQUIRY_ACTION_ITEMS).toContain('훈련 과정 탐색 결과표')
  })
})

describe('DOC_ITEMS', () => {
  it('서류 발급 3종이 DOC_ITEMS에 포함된다', () => {
    expect(DOC_ITEMS.has('수기출석부 발급')).toBe(true)
    expect(DOC_ITEMS.has('훈련참여확인서 발급')).toBe(true)
    expect(DOC_ITEMS.has('훈련 과정 탐색 결과표')).toBe(true)
  })

  it('일반 문의 항목은 DOC_ITEMS에 없다', () => {
    expect(DOC_ITEMS.has('행정 문의/요청')).toBe(false)
    expect(DOC_ITEMS.has('기기대여 요청')).toBe(false)
    expect(DOC_ITEMS.has('학습 및 진로 상담')).toBe(false)
  })
})
