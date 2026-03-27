import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { query } = await req.json()
  if (!query?.trim()) return NextResponse.json({ error: 'query required' }, { status: 400 })

  const keywords = query.trim().split(/\s+/)

  // 유사 질문 검색 (키워드 OR 검색)
  const orFilter = keywords.map((k: string) => `question.ilike.%${k}%,answer.ilike.%${k}%`).join(',')

  const { data: answers } = await supabase
    .from('answers')
    .select('*')
    .eq('active', true)
    .or(orFilter)
    .order('used_count', { ascending: false })
    .limit(3)

  // 관련 공지 검색
  const noticeFilter = keywords.map((k: string) => `title.ilike.%${k}%,summary.ilike.%${k}%`).join(',')
  const { data: notices } = await supabase
    .from('notices')
    .select('*')
    .or(noticeFilter)
    .limit(2)

  // 검색된 답변 used_count 증가
  if (answers && answers.length > 0) {
    for (const a of answers) {
      await supabase.from('answers').update({ used_count: a.used_count + 1 }).eq('id', a.id)
    }
  }

  // 결과 없으면 카테고리 기반 fallback
  let finalAnswers = answers ?? []
  if (finalAnswers.length === 0) {
    const { data: fallback } = await supabase
      .from('answers')
      .select('*')
      .eq('active', true)
      .order('used_count', { ascending: false })
      .limit(3)
    finalAnswers = fallback ?? []
  }

  return NextResponse.json({ answers: finalAnswers, notices: notices ?? [] })
}
