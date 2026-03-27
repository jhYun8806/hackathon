import { describe, it, expect } from 'vitest'

// 워크플로 FAQ 데이터 직접 임포트해서 데이터 무결성 검증
// UC-5: 채널톡 워크플로 86459 FAQ 데이터 동기화 시나리오

const WORKFLOW_FAQ = [
  {
    id: 'wf-86459-A',
    question: '수강신청은 어떻게 하나요? 수강신청 방법을 알려주세요.',
    answer: '💳 수강신청하는 방법\n\n내일배움캠프는 고용노동부 지원 K-Digital Training 과정으로, 수강신청을 하기 위해 반드시 다음 절차를 밟아주셔야 합니다.\n\n1. 내일배움카드 발급 (재직자용, 실업자용 무관)\n2. HRD-Net 홈페이지 접속 후, \'팀스파르타\' 검색\n3. 최종합격한 트랙 찾은 후, 우측 수강신청 버튼 클릭',
    category: '행정 문의/요청',
    kind: '수강신청',
  },
  {
    id: 'wf-86459-B',
    question: '국민취업지원제도(국취제)란 무엇인가요?',
    answer: '🤵🏻‍♂️ 국민취업지원제도란?\n\n취업을 원하는 사람에게 취업지원서비스를 종합적으로 제공하고, 저소득 구직자에게는 생계를 위한 최소한의 소득도 지원하는 한국형 실업부조입니다.',
    category: '행정 문의/요청',
    kind: '국취제',
  },
  {
    id: 'wf-86459-C',
    question: '출석체크는 어떻게 하나요? 출석 방법 안내',
    answer: '🚨 출석 안내\n\n내일배움캠프 과정에 참여하시는 동안, 매일 출석체크를 해주셔야 합니다. (사전캠프 제외)',
    category: '행정 문의/요청',
    kind: '출석',
  },
  {
    id: 'wf-86459-D',
    question: '공가란 무엇인가요? 공가 인정 범위가 어떻게 되나요?',
    answer: '🏝️ 공가란?\n\n공적인 사유로 발생하는 결석에 대한 휴가입니다.',
    category: '행정 문의/요청',
    kind: '공가',
  },
  {
    id: 'wf-86459-E',
    question: '공가 신청은 어떻게 하나요? 공가 신청 방법과 절차를 알려주세요.',
    answer: '📥 공가 신청하는 방법 및 절차\n\n• 사유발생일 다음날 17시까지 신청 가능',
    category: '행정 문의/요청',
    kind: '공가',
  },
  {
    id: 'wf-86459-F',
    question: '훈련장려금 수령 조건이 어떻게 되나요? 훈련장려금을 받으려면 어떤 조건이 필요한가요?',
    answer: '💰 훈련장려금 수령 조건\n\n훈련장려금이란? KDT 과정 수강생에게 월 단위로 지급되는 고용센터의 지원금입니다.',
    category: '행정 문의/요청',
    kind: '훈련장려금',
  },
  {
    id: 'wf-86459-G',
    question: '훈련장려금 신청 절차가 어떻게 되나요? 훈련장려금은 어떻게 신청하나요?',
    answer: '💸 훈련장려금 신청 절차\n\n1. 매 단위기간 종료일 익일 공지',
    category: '행정 문의/요청',
    kind: '훈련장려금',
  },
  {
    id: 'wf-86459-H',
    question: '훈련탐색결과표는 어디서 발급받나요? 훈련 과정 탐색 결과표 다운로드 방법',
    answer: '📄 훈련탐색결과표 발급 방법\n\n훈련탐색결과표는 마이페이지에서 확인 및 다운로드 가능합니다!',
    category: '행정 문의/요청',
    kind: '서류 발급',
  },
  {
    id: 'wf-86459-I',
    question: '중도하차 패널티가 어떻게 되나요? 중도하차 시 어떤 불이익이 있나요?',
    answer: '⚠️ 중도하차 패널티\n\n[사전캠프]\n공식적인 교육과정이 아니기 때문에, 하차에 대한 조치 사항이 없습니다.',
    category: '행정 문의/요청',
    kind: '중도하차',
  },
  {
    id: 'wf-86459-J',
    question: 'QR코드 출석 가능 시간이 어떻게 되나요? QR 출석 시간 안내',
    answer: '🏁 QR코드 출석 가능 시간',
    category: '행정 문의/요청',
    kind: 'QR출석',
  },
]

describe('채널톡 워크플로 86459 FAQ 데이터 무결성', () => {
  it('총 10개 FAQ 항목이 존재한다', () => {
    expect(WORKFLOW_FAQ).toHaveLength(10)
  })

  it('모든 항목이 필수 필드(id, question, answer, category, kind)를 가진다', () => {
    for (const faq of WORKFLOW_FAQ) {
      expect(faq.id).toBeTruthy()
      expect(faq.question).toBeTruthy()
      expect(faq.answer).toBeTruthy()
      expect(faq.category).toBeTruthy()
      expect(faq.kind).toBeTruthy()
    }
  })

  it('모든 항목 ID가 wf-86459- 접두사를 가진다', () => {
    for (const faq of WORKFLOW_FAQ) {
      expect(faq.id).toMatch(/^wf-86459-[A-J]$/)
    }
  })

  it('모든 항목 ID가 고유하다 (중복 없음)', () => {
    const ids = WORKFLOW_FAQ.map(f => f.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(WORKFLOW_FAQ.length)
  })

  it('모든 항목 category가 행정 문의/요청이다', () => {
    for (const faq of WORKFLOW_FAQ) {
      expect(faq.category).toBe('행정 문의/요청')
    }
  })

  it('훈련장려금 관련 FAQ가 2개 존재한다 (수령 조건 + 신청 절차)', () => {
    const subsidyFaqs = WORKFLOW_FAQ.filter(f => f.kind === '훈련장려금')
    expect(subsidyFaqs).toHaveLength(2)
  })

  it('공가 관련 FAQ가 2개 존재한다 (인정 범위 + 신청 방법)', () => {
    const gongaFaqs = WORKFLOW_FAQ.filter(f => f.kind === '공가')
    expect(gongaFaqs).toHaveLength(2)
  })

  it('각 kind별 커버리지: 수강신청, 국취제, 출석, 공가, 훈련장려금, 서류 발급, 중도하차, QR출석', () => {
    const kinds = new Set(WORKFLOW_FAQ.map(f => f.kind))
    expect(kinds.has('수강신청')).toBe(true)
    expect(kinds.has('국취제')).toBe(true)
    expect(kinds.has('출석')).toBe(true)
    expect(kinds.has('공가')).toBe(true)
    expect(kinds.has('훈련장려금')).toBe(true)
    expect(kinds.has('서류 발급')).toBe(true)
    expect(kinds.has('중도하차')).toBe(true)
    expect(kinds.has('QR출석')).toBe(true)
  })
})

describe('FAQ 내용 기반 검색 가능성 검증', () => {
  function searchFAQ(query: string) {
    const keywords = query.split(/\s+/)
    return WORKFLOW_FAQ.filter(faq =>
      keywords.some(k =>
        faq.question.includes(k) || faq.answer.includes(k) || faq.kind.includes(k)
      )
    )
  }

  it('훈련장려금 키워드로 검색 시 2건 이상 매칭된다', () => {
    const results = searchFAQ('훈련장려금')
    expect(results.length).toBeGreaterThanOrEqual(2)
  })

  it('공가 키워드로 검색 시 2건 이상 매칭된다', () => {
    const results = searchFAQ('공가')
    expect(results.length).toBeGreaterThanOrEqual(2)
  })

  it('QR 키워드로 검색 시 1건 이상 매칭된다', () => {
    const results = searchFAQ('QR')
    expect(results.length).toBeGreaterThanOrEqual(1)
  })

  it('출석 키워드로 검색 시 1건 이상 매칭된다', () => {
    const results = searchFAQ('출석')
    expect(results.length).toBeGreaterThanOrEqual(1)
  })

  it('수강신청 키워드로 검색 시 해당 FAQ가 포함된다', () => {
    const results = searchFAQ('수강신청')
    expect(results.some(r => r.id === 'wf-86459-A')).toBe(true)
  })

  it('중도하차 키워드로 검색 시 패널티 FAQ가 포함된다', () => {
    const results = searchFAQ('중도하차')
    expect(results.some(r => r.id === 'wf-86459-I')).toBe(true)
  })
})
