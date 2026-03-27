// Pure utility functions extracted for testability

// URL → 친근한 라벨 매핑
export const URL_LABELS: [string, string][] = [
  ['nbcamp.spartacodingclub.kr/mypage/support', '문의 접수 페이지'],
  ['teamsparta.notion.site/KDT-dd9b2fac3ff0428f899f23155b07233b', 'KDT 훈련생 유의사항'],
  ['teamsparta.notion.site/2e62dc3ef514809197e3d25276b6a8f5', '훈련생 제적 기준'],
  ['teamsparta.notion.site/KDT-3032dc3ef51480c189c5eb732b3718c6', 'KDT 자부담금 환불 규정'],
  ['teamsparta.notion.site/QR-1592dc3ef51480df8b7ae96eb0055539', 'QR코드 출석 가이드'],
  ['teamsparta.notion.site/QR-15f2dc3ef514803395b7e3875fd03199', '출석 및 공가 신청 가이드'],
  ['docs.channel.io/nbcampwiki/ko/categories/-%EA%B5%AD%EB%B9%84%EC%A7%80%EC%9B%90-FAQ', '국비 지원 FAQ'],
  ['docs.channel.io/nbcampwiki/ko/categories/-%EC%B7%A8%EC%97%85%EC%A7%80%EC%9B%90-FAQ', '취업 지원 FAQ'],
  ['support.spartacodingclub.kr', '고객센터 채팅 상담'],
  ['nbcamp.spartacodingclub.kr/petition', 'KDT 신문고'],
]

export function getFriendlyLabel(url: string): string {
  for (const [pattern, label] of URL_LABELS) {
    if (url.includes(pattern)) return label
  }
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch {
    return url
  }
}

// 인라인 액션 버튼으로 변환할 메뉴 항목
export const INQUIRY_ACTION_ITEMS = [
  '학습 및 진로 상담',
  '수강환경 제보',
  '행정 문의/요청',
  '기기대여 요청',
  '수기출석부 발급',
  '훈련참여확인서 발급',
  '훈련 과정 탐색 결과표',
]

export const DOC_ITEMS = new Set(['수기출석부 발급', '훈련참여확인서 발급', '훈련 과정 탐색 결과표'])

type HistoryItem = { role: 'user' | 'assistant'; content: string }

export function inferInquiryType(history: HistoryItem[]): string {
  const text = history.map(h => h.content).join(' ')
  if (/기기|노트북|웹캠|마이크|대여/.test(text)) return '기기대여 요청'
  if (/강의|노션|자료|오류|오타|링크|수강환경/.test(text)) return '수강환경 제보'
  if (/진로|학습|소통|협업|멘토|커리어/.test(text)) return '학습 및 진로 상담'
  return '행정 문의/요청'
}

// 훈련장려금 지급일 관련 질문 감지
export const SUBSIDY_TIMING_KEYWORDS = ['언제', '날짜', '지급일', '입금', '나와', '나오', '받을', '지급', '얼마나', '며칠']

export function isSubsidyTimingQuery(query: string): boolean {
  const hasSubsidy = query.includes('훈련장려금') || query.includes('장려금')
  const hasTiming = SUBSIDY_TIMING_KEYWORDS.some(k => query.includes(k))
  return hasSubsidy && hasTiming
}
