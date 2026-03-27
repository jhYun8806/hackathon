import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { supabase } from '@/lib/supabase'
import { isSubsidyTimingQuery } from '@/lib/utils'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const SYSTEM_PROMPT = `당신은 내일배움캠프 행정 문의 전담 어시스턴트입니다.
아래 [유사 문의 사례]는 실제 행정 담당자가 수강생 문의에 답변한 내용입니다.
이 사례들을 참고해 수강생의 질문에 친근하고 전문적인 말투로 답변해주세요.

답변 규칙:
- 첫 번째 질문([첫 번째 질문] 태그가 있는 경우)에만 "안녕하세요! 😊" 같은 짧은 인사로 시작, 이후 대화([이어지는 질문] 태그)에서는 인사 없이 바로 답변
- 행정 담당자의 실제 말투와 용어를 그대로 사용하지 않음
- 불확실하거나 사례에 없는 내용은 "담당 매니저에게 직접 문의 부탁드립니다" 안내
- 문맥에 따라 자연스럽게 줄바꿈 사용 (단락 구분 \\n\\n, 짧은 줄바꿈 \\n)
- 마크다운 없이 일반 텍스트로 작성
- 아래 [참고 링크]에서 관련 URL이 있으면 반드시 답변에 포함.

[참고 링크 - 질문 맥락에 맞는 링크를 답변에 자연스럽게 포함]
• 문의/접수 페이지: https://nbcamp.spartacodingclub.kr/mypage/support
• KDT 훈련생 유의사항 및 제도: https://teamsparta.notion.site/KDT-dd9b2fac3ff0428f899f23155b07233b
• 훈련생 제적 기준: https://teamsparta.notion.site/2e62dc3ef514809197e3d25276b6a8f5
• KDT 자부담금 환불(반환) 규정: https://teamsparta.notion.site/KDT-3032dc3ef51480c189c5eb732b3718c6
• QR코드 출석 가이드: https://teamsparta.notion.site/QR-1592dc3ef51480df8b7ae96eb0055539
• 출석 및 공가 신청 가이드(QR): https://teamsparta.notion.site/QR-15f2dc3ef514803395b7e3875fd03199
• 국비 지원 FAQ: https://docs.channel.io/nbcampwiki/ko/categories/-%EA%B5%AD%EB%B9%84%EC%A7%80%EC%9B%90-FAQ-10c94cec
• 취업 지원 FAQ: https://docs.channel.io/nbcampwiki/ko/categories/-%EC%B7%A8%EC%97%85%EC%A7%80%EC%9B%90-FAQ-24721f28
• 고객센터(채팅 상담): https://support.spartacodingclub.kr/
• KDT 신문고: https://nbcamp.spartacodingclub.kr/petition

[채널톡 워크플로 안내 - 아래 상황에서 해당 안내를 활용]
• 학습 및 진로 상담 → 학습 방향, 진로, 소통/협업 고민 등은 문의 페이지에서 '학습 및 진로 상담' 선택
• 수강환경 제보 → 강의 및 노션 자료 오류는 문의 페이지에서 '수강환경 제보' 선택
• 행정 문의/요청 → 수강신청, 훈련장려금, 실업급여, 국취제 등은 문의 페이지에서 '행정 문의/요청' 선택
• 기기대여 요청 → 노트북, 웹캠, 마이크 등은 문의 페이지에서 '기기대여 요청' 선택
• 서류 발급(수기출석부, 훈련참여확인서, 훈련 과정 탐색 결과표) → 문의 페이지 '서류 발급' 섹션 이용
• 고객센터 채팅 상담 운영시간: 월 14:00-17:30, 화~금 10:30-17:30 (점심 12:30-14:00 제외, 주말/공휴일 휴무)

[출력 형식 - 반드시 JSON만 출력, 앞뒤 설명 텍스트 절대 금지]
{"answer":"답변 내용","followUps":["후속 질문 1","후속 질문 2","후속 질문 3"]}

followUps: 이 답변을 받은 수강생이 자연스럽게 이어서 물어볼 만한 질문 3개 (수강생 입장에서 작성)`


type UnitPeriod = { startDate: string; endDate: string }

async function getExpectedPaymentDate(roundId: string): Promise<string | null> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 5000)
  try {
    const res = await fetch(
      `https://api.nbc.spartacodingclub.kr/training-subsidy/unit-periods?roundId=${roundId}`,
      { next: { revalidate: 0 }, signal: controller.signal }
    )
    clearTimeout(timeoutId)
    if (!res.ok) return null

    const periods: UnitPeriod[] = await res.json()
    if (!periods.length) return null

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
  } catch {
    clearTimeout(timeoutId)
    return null
  }
}

export async function POST(req: NextRequest) {
  const { query, history } = await req.json()
  if (!query?.trim()) {
    return new Response(JSON.stringify({ error: 'query required' }), { status: 400 })
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      try {
        ensureCacheFresh()

        const keywords = query.trim().split(/\s+/).slice(0, 5)
        const orFilter = keywords
          .map((k: string) => `question.ilike.%${k}%,answer.ilike.%${k}%,kind.ilike.%${k}%`)
          .join(',')
        const noticeFilter = keywords
          .map((k: string) => `title.ilike.%${k}%,summary.ilike.%${k}%`)
          .join(',')

        // Supabase 쿼리 병렬 실행
        const [{ data: matches }, { data: notices }] = await Promise.all([
          supabase
            .from('inquiry_cache')
            .select('question, answer, kind, round_id')
            .or(orFilter)
            .limit(5),
          supabase
            .from('notices')
            .select('title, summary')
            .or(noticeFilter)
            .limit(2),
        ])

        // 공지 먼저 전송 (클라이언트가 즉시 사용 가능)
        send({ type: 'meta', notices: notices ?? [] })

        // 훈련장려금 지급일 조회
        let subsidyContext = ''
        if (isSubsidyTimingQuery(query)) {
          let roundId = matches?.find(m => m.round_id)?.round_id
          if (!roundId) {
            const { data: anyWithRound } = await supabase
              .from('inquiry_cache')
              .select('round_id')
              .not('round_id', 'is', null)
              .limit(1)
              .single()
            roundId = anyWithRound?.round_id
          }
          const FALLBACK_ROUND_ID = '67d0f95f735b66a72ad03cfe'
          const paymentDate = await getExpectedPaymentDate(roundId ?? FALLBACK_ROUND_ID)
          if (paymentDate) {
            subsidyContext = `\n\n[훈련장려금 지급 예상일 정보]\n이전 단위기간 종료일 기준 +1개월 계산 결과: ${paymentDate} 예정`
          }
        }

        const context = (matches ?? [])
          .map((m, i) => `[사례 ${i + 1}]\n질문: ${m.question}\n답변: ${m.answer}`)
          .join('\n\n')

        const systemContext = matches && matches.length > 0
          ? `[과거 유사 문의 사례]\n${context}`
          : `(유사 사례 없음 - 일반적인 내배캠 행정 지식으로 답변)`

        const isFirstMessage = !history || history.length === 0
        const greetingTag = isFirstMessage ? '[첫 번째 질문]\n' : '[이어지는 질문]\n'

        const messages: Anthropic.MessageParam[] = [
          ...(history ?? []),
          { role: 'user', content: `${greetingTag}${systemContext}${subsidyContext}\n\n[수강생 질문]\n${query}` },
        ]

        // Claude 스트리밍
        let fullText = ''
        const aiStream = anthropic.messages.stream({
          model: 'claude-sonnet-4-6',
          max_tokens: 1024,
          system: SYSTEM_PROMPT,
          messages,
        })

        for await (const event of aiStream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            fullText += event.delta.text
            send({ type: 'chunk', text: event.delta.text })
          }
        }

        // 완성된 JSON에서 followUps 파싱 후 전송
        let followUps: string[] = []
        try {
          const parsed = JSON.parse(fullText.match(/\{[\s\S]*\}/)?.[0] ?? '{}')
          followUps = Array.isArray(parsed.followUps) ? parsed.followUps.slice(0, 3) : []
        } catch { /* ignore */ }

        send({ type: 'done', followUps })
      } catch (e) {
        console.error('[chat]', e)
        send({ type: 'error', message: e instanceof Error ? e.message : 'AI 응답 생성 실패' })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}

async function ensureCacheFresh() {
  const { data: meta } = await supabase
    .from('sync_meta')
    .select('last_synced_at')
    .eq('id', 'inquiry')
    .single()

  const lastSync = meta?.last_synced_at ? new Date(meta.last_synced_at).getTime() : 0
  const isStale = Date.now() - lastSync > 60 * 60 * 1000

  if (isStale) {
    fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/api/sync`, {
      method: 'POST',
    }).catch(() => {})
  }
}
