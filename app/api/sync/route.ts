import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const REDASH_URL = process.env.REDASH_URL!        // https://redash-v2.spartacodingclub.kr
const REDASH_API_KEY = process.env.REDASH_API_KEY!
const REDASH_QUERY_ID = process.env.REDASH_QUERY_ID! // 6832
const CACHE_TTL_MS = 60 * 60 * 1000               // 1시간

export async function GET() {
  return syncHandler()
}

export async function POST() {
  return syncHandler()
}

async function syncHandler() {
  try {
    // 1. 마지막 동기화 시간 확인
    const { data: meta } = await supabase
      .from('sync_meta')
      .select('last_synced_at, row_count')
      .eq('id', 'inquiry')
      .single()

    const lastSync = meta?.last_synced_at ? new Date(meta.last_synced_at).getTime() : 0
    const isStale = Date.now() - lastSync > CACHE_TTL_MS

    if (!isStale) {
      return NextResponse.json({
        synced: false,
        message: '캐시가 최신 상태입니다.',
        last_synced_at: meta?.last_synced_at,
        row_count: meta?.row_count,
      })
    }

    // 2. Redash API에서 최신 결과 가져오기
    const redashRes = await fetch(
      `${REDASH_URL}/api/queries/${REDASH_QUERY_ID}/results.json?api_key=${REDASH_API_KEY}`,
      { next: { revalidate: 0 } }
    )

    if (!redashRes.ok) {
      throw new Error(`Redash API 오류: ${redashRes.status}`)
    }

    const redashData = await redashRes.json()
    const rows: Record<string, string>[] = redashData?.query_result?.data?.rows ?? []

    // 3. 답변 완료된 항목만 필터링 후 변환
    const records = rows
      .filter(r => r.status === '답변 완료' && r.answer?.trim() && r.content)
      .map(r => {
        let question = ''
        let kind = ''
        try {
          const c = typeof r.content === 'string' ? JSON.parse(r.content) : r.content
          question = c?.desc ?? ''
          kind = c?.kind ?? ''
        } catch { /* content 파싱 실패 시 무시 */ }

        return {
          id: r._id as string,
          question: question.trim(),
          answer: r.answer?.trim() ?? '',
          category: r.category ?? '',
          kind,
          track_name: r.marketingroundtitle ?? '',
          round_id: r.roundid ?? r.roundId ?? null,
          created_at: r.createdat ?? null,
        }
      })
      .filter(r => r.id && r.question && r.answer) // 필수값 누락 제거

    // 4. Supabase에 upsert (배치 500건씩)
    const BATCH = 500
    for (let i = 0; i < records.length; i += BATCH) {
      const { error } = await supabase
        .from('inquiry_cache')
        .upsert(records.slice(i, i + BATCH), { onConflict: 'id' })
      if (error) throw error
    }

    // 5. sync_meta 업데이트
    await supabase.from('sync_meta').upsert({
      id: 'inquiry',
      last_synced_at: new Date().toISOString(),
      row_count: records.length,
    })

    return NextResponse.json({
      synced: true,
      row_count: records.length,
      last_synced_at: new Date().toISOString(),
    })
  } catch (e) {
    console.error('[sync]', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : '동기화 실패' },
      { status: 500 }
    )
  }
}
