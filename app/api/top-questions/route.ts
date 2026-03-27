import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const MEDALS = ['🥇', '🥈', '🥉']

// 카테고리 키워드 → 수강생 말투 질문 매핑
const CATEGORY_QUESTION_MAP: { keywords: string[]; question: string }[] = [
  { keywords: ['훈련장려금', '장려금'], question: '훈련장려금이 언제 지급되는지 알 수 있을까요?' },
  { keywords: ['출석', '공가'], question: '공가 신청은 어떻게 하면 될까요?' },
  { keywords: ['기기', '노트북', '대여'], question: '노트북 대여 신청은 어떻게 진행하나요?' },
  { keywords: ['실업급여', '실업'], question: '실업급여 신청하려면 어떻게 해야 하나요?' },
  { keywords: ['수강신청', '수강'], question: '수강 신청 관련해서 궁금한 게 있어요.' },
  { keywords: ['환불', '자부담'], question: '자부담금 환불은 어떤 절차로 진행되나요?' },
  { keywords: ['취업', '진로', '커리어'], question: '취업 준비를 어떻게 시작하면 좋을까요?' },
  { keywords: ['제적', '수료'], question: '제적 기준이 어떻게 되는지 알고 싶어요.' },
  { keywords: ['수기출석', '출석부'], question: '수기출석부 발급은 어떻게 신청하나요?' },
  { keywords: ['행정'], question: '행정 문의는 어디에 하면 되나요?' },
]

function categoryToQuestion(category: string): string {
  const lower = category.toLowerCase()
  for (const { keywords, question } of CATEGORY_QUESTION_MAP) {
    if (keywords.some(k => lower.includes(k.toLowerCase()))) return question
  }
  return `${category} 관련해서 궁금한 게 있어요.`
}

export async function GET() {
  const { data, error } = await supabase
    .from('inquiry_cache')
    .select('kind, category')
    .limit(10000)

  if (error || !data) {
    return NextResponse.json({ top3: [] })
  }

  const counts: Record<string, number> = {}
  for (const row of data) {
    // kind가 있으면 우선, 없으면 category로 폴백
    const cat = ((row.kind as string) || (row.category as string) || '').trim()
    if (cat) counts[cat] = (counts[cat] ?? 0) + 1
  }

  const top3 = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([category, count], i) => ({
      medal: MEDALS[i],
      category,
      count,
      question: categoryToQuestion(category),
    }))

  return NextResponse.json({ top3 })
}
