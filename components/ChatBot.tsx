'use client'
import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { getFriendlyLabel, inferInquiryType, INQUIRY_ACTION_ITEMS, DOC_ITEMS } from '@/lib/utils'

type Notice = { title: string; summary: string }

type Msg =
  | { type: 'system'; text: string }
  | { type: 'user'; text: string }
  | { type: 'ai'; answer: string; followUps: string[]; notices: Notice[]; rtaniImg: string; complete: boolean }

type HistoryItem = { role: 'user' | 'assistant'; content: string }

const NOTICE_URL_MAP: Record<string, string> = {
  'KDT 훈련생 유의사항 및 제도': 'https://teamsparta.notion.site/KDT-dd9b2fac3ff0428f899f23155b07233b',
  '훈련생 제적 기준': 'https://teamsparta.notion.site/2e62dc3ef514809197e3d25276b6a8f5',
  'QR코드 출석 가이드': 'https://teamsparta.notion.site/QR-1592dc3ef51480df8b7ae96eb0055539',
  '출석 및 공가 신청 가이드(QR)': 'https://teamsparta.notion.site/QR-15f2dc3ef514803395b7e3875fd03199',
}

const RTANI_IMAGES = [
  '/rtani/Basic Motion.png',
  '/rtani/Group 104.png',
  '/rtani/Group 109.png',
  '/rtani/Group 11.png',
  '/rtani/Group 14.png',
  '/rtani/Group 24.png',
  '/rtani/Group 25.png',
  '/rtani/Group 46.png',
]

function randomRtani() {
  return RTANI_IMAGES[Math.floor(Math.random() * RTANI_IMAGES.length)]
}

function parseAnswer(text: string, onAction: (type: string) => void): React.ReactNode {
  const COMBINED = new RegExp(
    `(https?:\\/\\/[^\\s]+)|(${INQUIRY_ACTION_ITEMS.map(a => a.replace(/[/]/g, '\\/')).join('|')})`,
    'g'
  )
  const nodes: React.ReactNode[] = []
  let last = 0
  let key = 0
  let match: RegExpExecArray | null

  while ((match = COMBINED.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index))

    if (match[1]) {
      nodes.push(
        <a key={key++} href={match[1]} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-0.5 text-[#FA0030] font-semibold underline underline-offset-2 decoration-[#FFCCD5] hover:decoration-[#FA0030] transition-colors">
          {getFriendlyLabel(match[1])} ↗
        </a>
      )
    } else if (match[2]) {
      const label = match[2]
      const type = DOC_ITEMS.has(label) ? '서류 발급' : label
      nodes.push(
        <button key={key++} onClick={() => onAction(type)}
          className="inline-flex items-center gap-0.5 text-[#FA0030] font-bold bg-gradient-to-r from-[#FFF5F7] to-[#FFECF0] hover:from-[#FFECF0] hover:to-[#FFD6DD] border border-[#FFCCD5] rounded-lg px-2 py-0.5 text-[12px] transition-all align-middle mx-0.5 cursor-pointer shadow-[0_1px_3px_rgba(250,0,48,0.1)] hover:-translate-y-px">
          {label} <span className="opacity-60">→</span>
        </button>
      )
    }
    last = match.index + match[0].length
  }

  if (last < text.length) nodes.push(text.slice(last))
  return <>{nodes}</>
}

// FAB 위 르탄이 캐릭터 — 머리/몸통 분리 레이어, 물음표 포함, 70% 크기
function FabRtani() {
  // Group 11.png 기준: 머리(모자~턱)가 상단 62%, 몸통이 하단 55% (어깨에서 살짝 겹침)
  const src = '/rtani/Group 11.png'
  const W = 63   // 90 * 0.7
  const H = 77   // 110 * 0.7
  const neckPct = 62  // 목/어깨 경계 %

  return (
    // 물음표 공간 확보를 위해 오른쪽 여유 추가
    <div style={{ position: 'relative', width: W + 22, height: H }}>
      {/* 몸통 레이어 — 정적 */}
      <Image
        src={src} alt="" width={W} height={H}
        style={{
          position: 'absolute', top: 0, left: 0,
          clipPath: `inset(${neckPct - 4}% 0 0 0)`,
          objectFit: 'contain',
        }}
      />
      {/* 머리 레이어 — 목 기준 까딱 (물음표 포함) */}
      <div
        style={{
          position: 'absolute', top: 0, left: 0, width: W, height: H,
          transformOrigin: `50% ${neckPct}%`,
          animation: 'headNod 1.3s ease-in-out infinite',
        }}
      >
        <Image
          src={src} alt="르탄이" width={W} height={H}
          style={{
            clipPath: `inset(0 0 ${100 - neckPct}% 0)`,
            objectFit: 'contain',
          }}
        />
        {/* 물음표 — 참고 이미지 기준 머리 오른쪽 상단 */}
        <svg
          style={{ position: 'absolute', top: '4%', right: '-20px' }}
          width="22" height="28" viewBox="0 0 22 28" fill="none"
        >
          <text x="1" y="20" fontSize="24" fontWeight="900" fill="#FA0030"
            fontFamily="'Arial Black', Arial, sans-serif" letterSpacing="-1">?</text>
        </svg>
      </div>
    </div>
  )
}

// 르탄이 스타일 학생 캐릭터 — 블록형 flat 디자인, 인디고 계열
function StudentAvatar() {
  return (
    <div className="w-8 h-8 rounded-full shrink-0 overflow-hidden"
      style={{ border: '1.5px solid #C7D7F4', boxShadow: '0 2px 8px rgba(79,70,229,0.18)' }}>
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* 배경 */}
        <rect width="32" height="32" fill="#EEF2FF"/>
        {/* 졸업 모자 (인디고) */}
        <rect x="11" y="3" width="10" height="7" rx="1.5" fill="#4338CA"/>
        {/* 머리 (검정 — 르탄이와 동일한 둥근사각형) */}
        <rect x="5" y="8" width="22" height="17" rx="7" fill="#1A1A1A"/>
        {/* 얼굴 (르탄이와 동일한 살색) */}
        <rect x="9" y="11" width="14" height="12" rx="3" fill="#FFCDB8"/>
        {/* 왼쪽 눈 (블록형) */}
        <rect x="10.5" y="14" width="4" height="4.5" rx="1" fill="#1A1A1A"/>
        {/* 오른쪽 눈 (블록형) */}
        <rect x="17.5" y="14" width="4" height="4.5" rx="1" fill="#1A1A1A"/>
        {/* 머리카락 왼쪽 */}
        <rect x="5" y="13" width="4" height="7" rx="2" fill="#1A1A1A"/>
        {/* 머리카락 오른쪽 */}
        <rect x="23" y="13" width="4" height="7" rx="2" fill="#1A1A1A"/>
        {/* 몸통 (인디고) */}
        <rect x="9" y="25" width="14" height="7" rx="2" fill="#4338CA"/>
      </svg>
    </div>
  )
}

function RtaniAvatar({ src }: { src: string }) {
  return (
    <div className="w-9 h-9 rounded-full shrink-0 overflow-hidden flex items-center justify-center rtani-float"
      style={{
        background: 'linear-gradient(135deg, #FFF5F7 0%, #FFECF0 100%)',
        border: '1.5px solid #FFD6DD',
        boxShadow: '0 2px 8px rgba(250,0,48,0.12)',
      }}>
      <Image src={src} alt="르탄이" width={36} height={36} className="object-contain scale-125" />
    </div>
  )
}


export default function ChatBot({ onInquiry }: { onInquiry: (type: string) => void }) {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<'home' | 'chat'>('home')
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [fabBottom, setFabBottom] = useState('2rem')
  const [top3, setTop3] = useState<{ medal: string; category: string; count: number; question: string }[]>([])
  const bodyRef = useRef<HTMLDivElement>(null)

  const [sessionRtani, setSessionRtani] = useState(() => randomRtani())
  const hasChatHistory = msgs.length > 0

  useEffect(() => {
    if (open) setSessionRtani(randomRtani())
  }, [open])

  useEffect(() => {
    const footer = document.querySelector('footer')
    if (!footer) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setFabBottom(`${Math.round(entry.intersectionRect.height) + 20}px`)
      } else {
        setFabBottom('2rem')
      }
    }, { threshold: Array.from({ length: 21 }, (_, i) => i / 20) })
    observer.observe(footer)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    fetch('/api/top-questions')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d.top3)) setTop3(d.top3) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight
  }, [msgs, loading])

  async function send(query?: string) {
    const q = (query ?? input).trim()
    if (!q || loading) return
    setInput('')
    setView('chat')
    setMsgs(m => [...m, { type: 'user', text: q }])
    setLoading(true)

    // 스트리밍 메시지 슬롯 미리 추가
    setMsgs(m => [...m, { type: 'ai', answer: '', followUps: [], notices: [], rtaniImg: sessionRtani, complete: false }])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, history }),
      })
      if (!res.ok || !res.body) throw new Error('응답 오류')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let rawAccum = ''
      let notices: { title: string; summary: string }[] = []

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const parts = buffer.split('\n\n')
        buffer = parts.pop() ?? ''

        for (const part of parts) {
          if (!part.startsWith('data: ')) continue
          let event: Record<string, unknown>
          try { event = JSON.parse(part.slice(6)) } catch { continue }

          if (event.type === 'meta') {
            notices = (event.notices as { title: string; summary: string }[]) ?? []
            setMsgs(m => {
              const updated = [...m]
              const last = updated[updated.length - 1]
              if (last.type === 'ai') updated[updated.length - 1] = { ...last, notices }
              return updated
            })
          } else if (event.type === 'chunk') {
            rawAccum += event.text as string
            setLoading(false)
            // JSON answer 값을 점진적으로 추출해 표시
            const match = rawAccum.match(/"answer"\s*:\s*"((?:[^"\\]|\\.)*)/)
            if (match) {
              const partial = match[1]
                .replace(/\\n/g, '\n')
                .replace(/\\"/g, '"')
                .replace(/\\\\/g, '\\')
              setMsgs(m => {
                const updated = [...m]
                const last = updated[updated.length - 1]
                if (last.type === 'ai') updated[updated.length - 1] = { ...last, answer: partial }
                return updated
              })
            }
          } else if (event.type === 'done') {
            const followUps = (event.followUps as string[]) ?? []
            // 최종 answer를 전체 JSON에서 파싱
            let finalAnswer = ''
            try {
              const parsed = JSON.parse(rawAccum.match(/\{[\s\S]*\}/)?.[0] ?? '{}')
              finalAnswer = parsed.answer ?? ''
            } catch { /* ignore */ }

            setMsgs(m => {
              const updated = [...m]
              const last = updated[updated.length - 1]
              if (last.type === 'ai') {
                updated[updated.length - 1] = {
                  ...last,
                  answer: finalAnswer || last.answer,
                  followUps,
                  complete: true,
                }
              }
              return updated
            })
            setHistory(h => [
              ...h,
              { role: 'user', content: q },
              { role: 'assistant', content: finalAnswer },
            ])
          } else if (event.type === 'error') {
            throw new Error(event.message as string)
          }
        }
      }
    } catch {
      setMsgs(m => {
        // 비어있는 스트리밍 슬롯 제거 후 에러 메시지 추가
        const filtered = m.filter(msg => !(msg.type === 'ai' && msg.answer === ''))
        return [...filtered, { type: 'system', text: '응답 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' }]
      })
    } finally {
      setLoading(false)
    }
  }

  const lastAiIdx = msgs.reduceRight((acc, m, i) => acc === -1 && m.type === 'ai' ? i : acc, -1)

  function handleInquiryAction(type: string) {
    setOpen(false)
    onInquiry(type)
  }

  return (
    <>
      {/* ── 말풍선 + 캐릭터 + FAB 단일 래퍼 ── */}
      <div
        className="fixed z-50 flex flex-col items-end"
        style={{ bottom: '20px', right: '1.7rem', gap: '30px' }}
      >
        {/* 말풍선 + 꼬리 */}
        <div className="pointer-events-none flex flex-col items-end">
          <div
            className="text-[12px] font-semibold text-[#2D2D3A] px-3.5 py-2 rounded-2xl whitespace-nowrap"
            style={{
              background: '#FFFFFF',
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              border: '1px solid #EBEBEB',
            }}
          >
            대화형 자동 응답 어시스턴트 &apos;르탄이&apos;가 대답해드려요!
          </div>
          <div className="flex justify-end pr-8">
            <div style={{
              width: 0, height: 0,
              borderLeft: '7px solid transparent',
              borderRight: '7px solid transparent',
              borderTop: '7px solid #FFFFFF',
              filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.08))',
            }} />
          </div>
        </div>

        {/* 르탄이 캐릭터 */}
        <div className="pointer-events-none">
          <FabRtani />
        </div>

        {/* 문의하기 FAB 버튼 */}
        <button
          onClick={() => setOpen(true)}
          className="flex items-center justify-center text-white font-bold text-[13px] leading-snug rounded-full fab-ring"
          style={{
            width: '64px',
            height: '64px',
            background: 'linear-gradient(135deg, #FA0030 0%, #C8002A 100%)',
            boxShadow: '0 6px 24px rgba(250,0,48,0.45), 0 2px 8px rgba(0,0,0,0.15)',
            transform: 'translateX(-21px) translateY(-9px)',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateX(-21px) translateY(-12px)'
            e.currentTarget.style.boxShadow = '0 10px 32px rgba(250,0,48,0.55), 0 4px 12px rgba(0,0,0,0.18)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateX(-21px) translateY(-9px)'
            e.currentTarget.style.boxShadow = '0 6px 24px rgba(250,0,48,0.45), 0 2px 8px rgba(0,0,0,0.15)'
          }}
        >
          문의<br />하기
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center p-4"
          style={{ background: 'rgba(10,10,20,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          {/* 모달 고정 높이 800px */}
          <div
            className="w-[430px] flex flex-col animate-slideUp"
            style={{
              height: '800px',
              maxHeight: 'calc(100vh - 2rem)',
              background: '#FFFFFF',
              borderRadius: '20px',
              boxShadow: '0 24px 64px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)',
            }}
          >
            {/* ── 헤더 ── */}
            <div
              className="px-5 py-4 flex items-center gap-3 shrink-0 relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #FA0030 0%, #C8002A 60%, #A50024 100%)',
                borderRadius: '20px 20px 0 0',
              }}
            >
              <div className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: 'radial-gradient(circle at 80% 50%, white 1px, transparent 1px)',
                  backgroundSize: '18px 18px',
                }} />

              {view === 'chat' && (
                <button
                  onClick={() => setView('home')}
                  className="relative z-10 w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all text-white/70 hover:text-white hover:bg-white/20"
                  title="홈으로"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M19 12H5M5 12l7-7M5 12l7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              )}

              <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 overflow-hidden relative z-10"
                style={{ backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.3)' }}>
                <Image src={sessionRtani} alt="르탄이" width={44} height={44} className="object-contain scale-125" />
              </div>

              <div className="flex-1 relative z-10">
                <div className="text-white font-black text-[15px] tracking-tight">르탄이</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                  <span className="text-white/70 text-[11px] font-medium">실제 답변 받은 기록을 기반으로 르탄이가 답변해요!</span>
                </div>
              </div>

              <button
                onClick={() => setOpen(false)}
                className="relative z-10 w-7 h-7 rounded-full flex items-center justify-center transition-all text-white/70 hover:text-white hover:bg-white/20 text-[13px]"
              >✕</button>
            </div>

            {/* ── 홈 화면 ── */}
            {view === 'home' ? (
              <div className="flex-1 overflow-y-auto" style={{ background: '#FAF9F7' }}>
                <div className="px-4 pt-5 pb-3">
                  <div className="flex items-start gap-3">
                    <RtaniAvatar src={sessionRtani} />
                    <div
                      className="rounded-2xl rounded-tl-sm px-4 py-3 text-[13px] leading-[1.7] animate-msgIn"
                      style={{
                        background: 'linear-gradient(135deg, #FFF5F7 0%, #fff 100%)',
                        border: '1px solid #FFD6DD',
                        color: '#2D2D3A',
                        boxShadow: '0 2px 8px rgba(250,0,48,0.07)',
                      }}
                    >
                      안녕하세요! 👋<br />
                      궁금한 내용을 입력하거나 아래 질문을 선택해 주세요.<br />
                      <span className="text-[#FA0030] font-semibold">실제 문의 사례</span>를 바탕으로 바로 답변드릴게요.
                    </div>
                  </div>
                </div>

                {hasChatHistory && (
                  <div className="px-4 pb-2">
                    <button
                      onClick={() => setView('chat')}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all"
                      style={{ background: 'linear-gradient(135deg, #FFF5F7, #FFECF0)', border: '1px solid #FFCCD5' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(135deg, #FFECF0, #FFD6DD)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, #FFF5F7, #FFECF0)' }}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-[16px]">💬</span>
                        <div className="text-left">
                          <p className="text-[13px] font-bold text-[#FA0030]">이전 대화 이어보기</p>
                          <p className="text-[11px] text-[#FA0030]/60 mt-0.5">
                            {msgs.filter(m => m.type === 'user').length}개의 질문이 있어요
                          </p>
                        </div>
                      </div>
                      <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                        <path d="M14.987 10L7.917 17.07 6.679 15.834l5.833-5.833L6.679 4.167 7.917 2.93 14.987 10z" fill="#FA0030"/>
                      </svg>
                    </button>
                  </div>
                )}

                <div className="px-4 pb-5">
                  <p className="text-[10px] font-black text-gray-400 mb-2.5 tracking-widest uppercase">자주 묻는 질문 TOP 3</p>
                  <div className="flex flex-col gap-1.5">
                    {top3.map(({ medal, question }) => (
                      <button
                        key={question}
                        onClick={() => send(question)}
                        className="group text-left text-[13px] font-medium rounded-xl px-4 py-2.5 transition-all"
                        style={{ background: '#FFFFFF', border: '1px solid #EBEBEB', color: '#2D2D3A', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = '#FFD6DD'
                          e.currentTarget.style.color = '#FA0030'
                          e.currentTarget.style.background = '#FFF5F7'
                          e.currentTarget.style.transform = 'translateX(3px)'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = '#EBEBEB'
                          e.currentTarget.style.color = '#2D2D3A'
                          e.currentTarget.style.background = '#FFFFFF'
                          e.currentTarget.style.transform = 'translateX(0)'
                        }}
                      >
                        <span className="inline-flex items-center gap-2">
                          <span className="text-[16px] leading-none">{medal}</span>
                          {question}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

            ) : (
              /* ── 채팅 화면 ── */
              <div ref={bodyRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-3" style={{ background: '#FAF9F7' }}>
                {msgs.map((m, i) => {
                  if (m.type === 'user') return (
                    <div key={i} className="flex items-end justify-end gap-2 animate-msgIn">
                      <div
                        className="text-white text-[13px] rounded-2xl rounded-br-sm px-4 py-2.5 max-w-[75%] leading-relaxed font-medium"
                        style={{ background: 'linear-gradient(135deg, #FA0030 0%, #D80028 100%)', boxShadow: '0 3px 12px rgba(250,0,48,0.3)' }}
                      >
                        {m.text}
                      </div>
                      <StudentAvatar />
                    </div>
                  )

                  if (m.type === 'system') return (
                    <div key={i} className="flex items-start gap-2 animate-msgIn">
                      <RtaniAvatar src={sessionRtani} />
                      <div
                        className="text-[13px] rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%] leading-relaxed whitespace-pre-line font-medium"
                        style={{ background: '#FFFFFF', color: '#2D2D3A', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', border: '1px solid #F0F0F0' }}
                      >
                        {m.text}
                      </div>
                    </div>
                  )

                  const isLast = i === lastAiIdx

                  if (m.answer === '') return null

                  return (
                    <div key={i} className="flex flex-col gap-2 animate-msgIn">
                      <div className="flex items-start gap-2">
                        <RtaniAvatar src={sessionRtani} />
                        <div className="flex flex-col gap-1 flex-1">
                          <span className="text-[11px] font-black text-[#FA0030] px-1 tracking-wide">르탄이</span>

                          {/* 답변 + 관련 공지를 하나의 버블 안에 */}
                          <div
                            className="text-[13px] rounded-2xl rounded-tl-sm max-w-[90%] overflow-hidden"
                            style={{
                              background: '#FFFFFF',
                              color: '#2D2D3A',
                              boxShadow: '0 2px 12px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.04)',
                              border: '1px solid #F0F0F0',
                            }}
                          >
                            {/* 답변 본문 */}
                            <div className="px-4 py-3 leading-[1.8] whitespace-pre-line">
                              {parseAnswer(m.answer, handleInquiryAction)}
                            </div>

                            {/* 관련 공지 — 버블 내부 하단에 구분선 후 표시 */}
                            {m.notices.length > 0 && (
                              <div style={{ borderTop: '1px solid #F0F0F0' }}>
                                {m.notices.map((n, j) => {
                                  const url = NOTICE_URL_MAP[n.title]
                                  const inner = (
                                    <div className="flex items-center gap-2.5 px-4 py-2.5">
                                      <span className="text-[10px] font-black bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap">공지</span>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-[12px] font-semibold text-blue-700 truncate">{n.title}</p>
                                        <p className="text-[11px] text-blue-400/80 leading-tight mt-0.5 line-clamp-1">{n.summary}</p>
                                      </div>
                                      {url && (
                                        <svg width="12" height="12" viewBox="0 0 20 20" fill="none" className="shrink-0 text-blue-300">
                                          <path d="M14.987 10L7.917 17.07 6.679 15.834l5.833-5.833L6.679 4.167 7.917 2.93 14.987 10z" fill="currentColor"/>
                                        </svg>
                                      )}
                                    </div>
                                  )
                                  return url ? (
                                    <a
                                      key={j}
                                      href={url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="block transition-colors border-t first:border-0"
                                      style={{ borderColor: '#EEF6FF' }}
                                      onMouseEnter={e => { e.currentTarget.style.background = '#EEF6FF' }}
                                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                                    >
                                      {inner}
                                    </a>
                                  ) : (
                                    <div key={j} className="border-t first:border-0" style={{ borderColor: '#EEF6FF' }}>
                                      {inner}
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 후속 질문 — 회색 계열로 링크(빨간)와 명확히 구분 */}
                      {isLast && m.followUps.length > 0 && (
                        <div className="flex flex-col gap-1.5 max-w-[90%] ml-11">
                          <p className="text-[10px] text-gray-400 font-bold px-1 tracking-wide">이런 것도 궁금하신가요?</p>
                          {m.followUps.map((q, j) => (
                            <button
                              key={j}
                              onClick={() => send(q)}
                              disabled={loading}
                              className="text-left text-[12px] font-medium rounded-xl px-3.5 py-2.5 leading-relaxed transition-all disabled:opacity-50"
                              style={{ background: '#FFFFFF', border: '1px solid #E5E5E5', color: '#444' }}
                              onMouseEnter={e => {
                                e.currentTarget.style.background = '#F5F5F5'
                                e.currentTarget.style.borderColor = '#CCC'
                                e.currentTarget.style.transform = 'translateX(2px)'
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.background = '#FFFFFF'
                                e.currentTarget.style.borderColor = '#E5E5E5'
                                e.currentTarget.style.transform = 'translateX(0)'
                              }}
                            >
                              <span className="text-gray-300 mr-1.5 text-[10px]">Q.</span>{q}
                            </button>
                          ))}
                        </div>
                      )}

                      {isLast && m.complete && (
                        <div className="flex gap-2 mt-2 animate-buttonReveal">
                          <button
                            className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold transition-all"
                            style={{ border: '1px solid #E5E5E5', color: '#555', background: '#FAFAFA' }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#CCC'; e.currentTarget.style.background = '#F5F5F5' }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E5E5'; e.currentTarget.style.background = '#FAFAFA' }}
                            onClick={() => setMsgs(p => [...p, { type: 'system', text: '도움이 되셨다니 다행이에요! 😊\n추가로 궁금한 점이 있으면 언제든 이용해주세요.' }])}
                          >
                            해결됐어요 👍
                          </button>
                          <button
                            className="flex-1 py-2.5 rounded-xl text-[13px] font-black text-white transition-all"
                            style={{ background: 'linear-gradient(135deg, #FA0030, #C8002A)', boxShadow: '0 3px 10px rgba(250,0,48,0.3)' }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 5px 16px rgba(250,0,48,0.4)' }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 3px 10px rgba(250,0,48,0.3)' }}
                            onClick={() => { setOpen(false); onInquiry(inferInquiryType(history)) }}
                          >
                            문의 등록하기
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}

                {/* 타이핑 인디케이터 — 스트리밍 시작 전(loading) 또는 첫 chunk 대기 중(빈 answer 슬롯) */}
                {(loading || msgs.some(m => m.type === 'ai' && m.answer === '')) && (
                  <div className="flex items-start gap-2 animate-msgIn">
                    <RtaniAvatar src={sessionRtani} />
                    <div
                      className="flex items-center gap-1 px-4 py-3.5 rounded-2xl rounded-tl-sm"
                      style={{ background: '#FFFFFF', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', border: '1px solid #F0F0F0' }}
                    >
                      <span className="typing-dot w-2 h-2 rounded-full" style={{ background: '#FA0030', opacity: 0.4 }} />
                      <span className="typing-dot w-2 h-2 rounded-full" style={{ background: '#FA0030', opacity: 0.4 }} />
                      <span className="typing-dot w-2 h-2 rounded-full" style={{ background: '#FA0030', opacity: 0.4 }} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── 입력 영역 ── */}
            <div
              className={`px-3 py-3 flex gap-2 shrink-0 transition-opacity ${loading ? 'opacity-60' : 'opacity-100'}`}
              style={{ borderTop: '1px solid #F0F0F0', background: '#FFFFFF', borderRadius: '0 0 20px 20px' }}
            >
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.nativeEvent.isComposing && send()}
                disabled={loading}
                placeholder="예: 훈련장려금 언제 받을 수 있나요?"
                className="flex-1 text-sm outline-none transition-all disabled:cursor-not-allowed"
                style={{
                  background: '#F7F6F4',
                  border: '1.5px solid #EBEBEB',
                  borderRadius: '14px',
                  padding: '10px 16px',
                  color: '#2D2D3A',
                  fontSize: '13px',
                }}
                onFocus={e => { e.target.style.borderColor = '#FA0030'; e.target.style.background = '#FFFFFF' }}
                onBlur={e => { e.target.style.borderColor = '#EBEBEB'; e.target.style.background = '#F7F6F4' }}
              />
              <button
                onClick={() => send()}
                disabled={loading || !input.trim()}
                className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-all disabled:opacity-40"
                style={{
                  background: input.trim() ? 'linear-gradient(135deg, #FA0030, #C8002A)' : '#E5E5E5',
                  boxShadow: input.trim() ? '0 3px 10px rgba(250,0,48,0.3)' : 'none',
                }}
                onMouseEnter={e => { if (!loading && input.trim()) e.currentTarget.style.transform = 'scale(1.05)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M22 2L11 13M22 2l-7 20-4-9M11 13L2 9l20-7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
