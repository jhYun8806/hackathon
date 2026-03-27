import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// 2024년도 내일배움캠프 행정봇 (채널톡 워크플로 86459) FAQ 데이터
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
    answer: '🤵🏻‍♂️ 국민취업지원제도란?\n\n취업을 원하는 사람에게 취업지원서비스를 종합적으로 제공하고, 저소득 구직자에게는 생계를 위한 최소한의 소득도 지원하는 한국형 실업부조입니다.\n\n국민취업지원제도 참여 자격요건을 갖춘 사람에게 고용복지플러스센터에서 관련 취업지원서비스와 수당(비용)을 지원합니다.',
    category: '행정 문의/요청',
    kind: '국취제',
  },
  {
    id: 'wf-86459-C',
    question: '출석체크는 어떻게 하나요? 출석 방법 안내',
    answer: '🚨 출석 안내\n\n내일배움캠프 과정에 참여하시는 동안, 매일 출석체크를 해주셔야 합니다. (사전캠프 제외)\n\n출석 일수에 따라 훈련장려금 금액이 달라지고, 수료 가능 여부가 결정되니 반드시 꼼꼼히 챙겨주시길 바랍니다.',
    category: '행정 문의/요청',
    kind: '출석',
  },
  {
    id: 'wf-86459-D',
    question: '공가란 무엇인가요? 공가 인정 범위가 어떻게 되나요?',
    answer: '🏝️ 공가란?\n\n공적인 사유로 발생하는 결석에 대한 휴가입니다. 공가가 인정되는 날은 공식 출석 처리됩니다.\n\n아래가 대표적인 공가 인정 가능 사유이며, 이외의 사유 인정 가능 여부에 대해선 별도 문의 바랍니다.\n\n• 예비군/민방위 훈련\n• 국가시험 응시\n• 본인 또는 직계가족 경조사\n• 입원치료(진단서 필요)\n• 코로나19 등 법정 감염병 격리',
    category: '행정 문의/요청',
    kind: '공가',
  },
  {
    id: 'wf-86459-E',
    question: '공가 신청은 어떻게 하나요? 공가 신청 방법과 절차를 알려주세요.',
    answer: '📥 공가 신청하는 방법 및 절차\n\n• 사유발생일 다음날 17시까지 신청 가능\n• 일 포함 3일 이내 증빙자료 미회신 시 신청 취소\n\n신청 절차:\n1. 출결 페이지 하단의 \'공가 신청\' 버튼 클릭\n2. 행정 매니저의 DM 수신\n3. 이메일로 발송된 서류 확인\n4. 증빙자료 첨부 후 서명하여 회신',
    category: '행정 문의/요청',
    kind: '공가',
  },
  {
    id: 'wf-86459-F',
    question: '훈련장려금 수령 조건이 어떻게 되나요? 훈련장려금을 받으려면 어떤 조건이 필요한가요?',
    answer: '💰 훈련장려금 수령 조건\n\n훈련장려금이란? KDT 과정 수강생에게 월 단위로 지급되는 고용센터의 지원금입니다. 사전캠프 기간 중에는 지급되지 않으며, 본캠프 시작 후 훈련 단위기간에 따라 지급됩니다.\n\n수령 조건:\n1. 근로형태가 실업자 또는 주 15시간 미만 피보험 근로자 또는 피보험 영세자영업자\n2. 단위기간 별 출석률 80% 이상 (일반 월 훈련일수 20일)\n3. 실업급여, 구직활동지원금, 전직지원금, 지역청년수당 미수급\n4. 단위기간 마지막 날 기준 직전 2개월 동안 어느 연속된 1개월 구간에서도 일용근로내역일수가 10일 미만',
    category: '행정 문의/요청',
    kind: '훈련장려금',
  },
  {
    id: 'wf-86459-G',
    question: '훈련장려금 신청 절차가 어떻게 되나요? 훈련장려금은 어떻게 신청하나요?',
    answer: '💸 훈련장려금 신청 절차\n\n1. 매 단위기간 종료일 익일 공지\n2. 출결페이지 팝업 내 출석부 확인 후 설문조사 응답\n3. 고용센터에 대표로 훈련기관이 신청\n4. 훈련장려금 지급\n\n※ 신청은 수강생이 직접 하는 것이 아니라, 출결페이지에서 설문 응답 후 훈련기관(팀스파르타)이 대표로 신청합니다.',
    category: '행정 문의/요청',
    kind: '훈련장려금',
  },
  {
    id: 'wf-86459-H',
    question: '훈련탐색결과표는 어디서 발급받나요? 훈련 과정 탐색 결과표 다운로드 방법',
    answer: '📄 훈련탐색결과표 발급 방법\n\n훈련탐색결과표는 마이페이지에서 확인 및 다운로드 가능합니다!\n\n• 개강 전: 마이페이지 → 지원한 캠프 → 훈련 과정 탐색 결과표\n• 개강 후: 마이페이지 → 공지/문의 → 훈련',
    category: '행정 문의/요청',
    kind: '서류 발급',
  },
  {
    id: 'wf-86459-I',
    question: '중도하차 패널티가 어떻게 되나요? 중도하차 시 어떤 불이익이 있나요?',
    answer: '⚠️ 중도하차 패널티\n\n[사전캠프]\n공식적인 교육과정이 아니기 때문에, 하차에 대한 조치 사항이 없습니다.\n\n[본캠프]\n개강 첫 주 하차 시 적용되지 않습니다. (개강 첫 주 3일차까지 통보 필요)\n\n이후 하차 시, 국민내일배움카드 운영 규정에 따라 아래와 같이 조치됩니다.\n1. 내일배움카드 잔액 20만원 차감 (상병, 조기취업 사유는 미해당)\n2. 내일배움카드 참여 훈련 일수 만큼의 잔액 차감\n3. 새로운 내일배움카드 발급까지 KDT 수강 불가 (최대 5년)',
    category: '행정 문의/요청',
    kind: '중도하차',
  },
  {
    id: 'wf-86459-J',
    question: 'QR코드 출석 가능 시간이 어떻게 되나요? QR 출석 시간 안내',
    answer: '🏁 QR코드 출석 가능 시간\n\n(Spring 단기심화)\n• 입실: 06:00~10:10\n• 퇴실: 15:50~23:59\n\n(UXUI, 데이터분석, Spring&Kotlin)\n• 입실: 06:00~09:10\n• 퇴실: 20:50~23:59\n\n※ QR코드 출석은 마이페이지 출결 페이지에서 가능합니다.',
    category: '행정 문의/요청',
    kind: 'QR출석',
  },
]

export async function POST() {
  return syncWorkflow()
}

export async function GET() {
  return syncWorkflow()
}

async function syncWorkflow() {
  try {
    const records = WORKFLOW_FAQ.map(faq => ({
      id: faq.id,
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      kind: faq.kind,
      track_name: '내일배움캠프',
      round_id: null,
      created_at: null,
    }))

    const { error } = await supabase
      .from('inquiry_cache')
      .upsert(records, { onConflict: 'id' })

    if (error) throw error

    return NextResponse.json({
      synced: true,
      count: records.length,
      message: '채널톡 워크플로 86459 FAQ 동기화 완료',
    })
  } catch (e) {
    console.error('[sync/workflow]', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : '동기화 실패' },
      { status: 500 }
    )
  }
}
