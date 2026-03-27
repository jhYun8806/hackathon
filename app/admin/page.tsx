'use client'
import { useState, useEffect, useCallback } from 'react'
import type { Answer } from '@/lib/supabase'

type FormState = {
  question: string
  answer: string
  category: Answer['category']
  active: boolean
}

const EMPTY_FORM: FormState = { question: '', answer: '', category: '기타', active: true }
const CATEGORIES: Answer['category'][] = ['출결', '환불', '수료', '기타']

const categoryColor: Record<string, string> = {
  '출결': 'bg-yellow-100 text-yellow-800',
  '환불': 'bg-pink-100 text-pink-800',
  '수료': 'bg-green-100 text-green-800',
  '기타': 'bg-gray-100 text-gray-600',
}

export default function AdminPage() {
  const [answers, setAnswers] = useState<Answer[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const fetchAnswers = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/answers')
    const data = await res.json()
    setAnswers(data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchAnswers() }, [fetchAnswers])

  function startNew() {
    setEditId(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  function startEdit(a: Answer) {
    setEditId(a.id)
    setForm({ question: a.question, answer: a.answer, category: a.category, active: a.active })
    setShowForm(true)
  }

  function cancelForm() {
    setShowForm(false)
    setEditId(null)
    setForm(EMPTY_FORM)
  }

  async function save() {
    if (!form.question.trim() || !form.answer.trim()) return
    setSaving(true)
    if (editId) {
      await fetch(`/api/answers/${editId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
    } else {
      await fetch('/api/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, used_count: 0 }),
      })
    }
    setSaving(false)
    cancelForm()
    fetchAnswers()
  }

  function remove(id: string) {
    setDeleteTarget(id)
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    await fetch(`/api/answers/${deleteTarget}`, { method: 'DELETE' })
    setDeleteTarget(null)
    fetchAnswers()
  }

  const filtered = answers.filter(a =>
    a.question.includes(search) || a.answer.includes(search) || a.category.includes(search)
  )

  return (
    <div className="min-h-screen bg-[#F7F8FA]" style={{ fontFamily: "'Pretendard Variable', 'Pretendard', -apple-system, sans-serif" }}>

      {/* 삭제 확인 다이얼로그 */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[500] bg-black/40 flex items-center justify-center p-4" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white rounded-2xl w-[360px] p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <p className="text-base font-extrabold text-[#0D0E11] mb-1">답변을 삭제할까요?</p>
            <p className="text-sm text-[#6B6E7A] mb-5">삭제된 항목은 복구할 수 없습니다.</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 border border-[#E8E9EC] rounded-xl text-sm font-semibold text-[#6B6E7A] hover:border-gray-400 transition-colors">
                취소
              </button>
              <button type="button" onClick={confirmDelete}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded-xl transition-colors">
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 헤더 */}
      <header className="bg-white border-b border-[#E8E9EC] h-14 flex items-center px-8 sticky top-0 z-50">
        <div className="flex items-center gap-2 mr-auto">
          <div className="w-7 h-7 rounded-md bg-[#FA0030] flex items-center justify-center text-white text-sm font-black">N</div>
          <span className="font-extrabold text-[#0D0E11]">Admin CMS</span>
          <span className="text-[#A4A7B0] text-sm ml-1">— 문의 답변 관리</span>
        </div>
        <a href="/" className="text-sm text-[#6B6E7A] hover:text-[#FA0030] transition-colors">← 메인으로</a>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* 상단 툴바 */}
        <div className="flex items-center gap-3 mb-6">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="질문·답변·카테고리 검색..."
            className="flex-1 border border-[#E8E9EC] rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#FA0030] bg-white transition-colors"
          />
          <button
            onClick={startNew}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[#FA0030] hover:bg-[#D80028] text-white text-sm font-bold rounded-lg transition-colors whitespace-nowrap"
          >
            + 새 답변 등록
          </button>
        </div>

        {/* 등록/수정 폼 */}
        {showForm && (
          <div className="bg-white rounded-xl border border-[#E8E9EC] p-6 mb-6 shadow-sm">
            <h2 className="text-base font-extrabold text-[#0D0E11] mb-4">
              {editId ? '답변 수정' : '새 답변 등록'}
            </h2>
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-[13px] font-semibold text-[#40414B] mb-1">카테고리</label>
                <select
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value as Answer['category'] }))}
                  className="border border-[#E8E9EC] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#FA0030] bg-white transition-colors"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-[#40414B] mb-1">질문</label>
                <input
                  value={form.question}
                  onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
                  placeholder="자주 묻는 질문을 입력해주세요"
                  className="w-full border border-[#E8E9EC] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#FA0030] transition-colors"
                />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-[#40414B] mb-1">답변</label>
                <textarea
                  value={form.answer}
                  onChange={e => setForm(f => ({ ...f, answer: e.target.value }))}
                  placeholder="답변 내용을 입력해주세요"
                  rows={4}
                  className="w-full border border-[#E8E9EC] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#FA0030] resize-none transition-colors leading-relaxed"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={form.active}
                  onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
                  className="accent-[#FA0030]"
                />
                <label htmlFor="active" className="text-[13px] text-[#40414B] cursor-pointer">활성화 (챗봇 검색에 노출)</label>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={cancelForm}
                  className="px-5 py-2.5 border border-[#E8E9EC] rounded-lg text-sm font-semibold text-[#6B6E7A] hover:border-gray-400 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={save}
                  disabled={saving || !form.question.trim() || !form.answer.trim()}
                  className="px-5 py-2.5 bg-[#FA0030] hover:bg-[#D80028] disabled:opacity-50 text-white text-sm font-bold rounded-lg transition-colors"
                >
                  {saving ? '저장 중...' : '저장'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 테이블 */}
        <div className="bg-white rounded-xl border border-[#E8E9EC] overflow-hidden shadow-sm">
          <div className="px-5 py-3.5 border-b border-[#E8E9EC] flex items-center justify-between">
            <span className="text-sm font-bold text-[#0D0E11]">등록된 답변</span>
            <span className="text-xs text-[#A4A7B0]">{filtered.length}건</span>
          </div>

          {loading ? (
            <div className="py-16 text-center text-sm text-[#A4A7B0]">불러오는 중...</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-sm text-[#A4A7B0]">등록된 답변이 없습니다.</div>
          ) : (
            <div className="divide-y divide-[#E8E9EC]">
              {filtered.map(a => (
                <div key={a.id} className={`px-5 py-4 flex gap-4 items-start hover:bg-[#F7F8FA] transition-colors ${!a.active ? 'opacity-50' : ''}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${categoryColor[a.category]}`}>
                        {a.category}
                      </span>
                      {!a.active && (
                        <span className="text-[11px] text-[#A4A7B0] bg-gray-100 px-2 py-0.5 rounded-full">비활성</span>
                      )}
                      <span className="text-[11px] text-[#A4A7B0]">조회 {a.used_count}회</span>
                    </div>
                    <p className="text-[14px] font-semibold text-[#0D0E11] mb-1 truncate">{a.question}</p>
                    <p className="text-[13px] text-[#6B6E7A] line-clamp-2 leading-relaxed">{a.answer}</p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => startEdit(a)}
                      className="px-3 py-1.5 text-[12px] font-semibold text-[#40414B] border border-[#E8E9EC] rounded-md hover:border-[#FA0030] hover:text-[#FA0030] transition-colors"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => remove(a.id)}
                      className="px-3 py-1.5 text-[12px] font-semibold text-[#A4A7B0] border border-[#E8E9EC] rounded-md hover:border-red-300 hover:text-red-500 transition-colors"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
