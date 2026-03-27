import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Answer = {
  id: string
  question: string
  answer: string
  category: '출결' | '환불' | '수료' | '기타'
  used_count: number
  active: boolean
  created_at: string
  updated_at: string
}

export type Notice = {
  id: string
  title: string
  summary: string
  created_at: string
}
