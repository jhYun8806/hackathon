'use client'
import { useState } from 'react'

type Props = {
  defaultType?: string
  onClose: () => void
}

const INQUIRY_TYPES = ['학습 및 진로 상담', '수강환경 제보', '행정 문의/요청', '기기대여 요청', '서류 발급', '기타']

export default function InquiryModal({ defaultType = '행정 문의/요청', onClose }: Props) {
  const [type, setType] = useState(defaultType)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return
    setSubmitting(true)
    // 실제 문의 저장은 추후 연동 — 현재는 UX 시연용
    await new Promise(r => setTimeout(r, 800))
    setSubmitting(false)
    setDone(true)
  }

  return (
    <div
      className="fixed inset-0 z-[400] bg-black/40 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl w-[480px] max-h-[85vh] overflow-y-auto p-7 shadow-2xl animate-fadeUp" onClick={e => e.stopPropagation()}>
        {done ? (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center text-2xl">✓</div>
            <p className="text-lg font-extrabold text-gray-900">문의가 접수되었어요!</p>
            <p className="text-sm text-gray-400 leading-relaxed">
              담당자 확인 후 빠르게 답변 드릴게요.<br />문의 내역은 마이페이지에서 확인하실 수 있어요.
            </p>
            <button
              onClick={onClose}
              className="mt-2 w-full py-3 rounded-xl bg-[#FA0030] hover:bg-[#D80028] text-white font-bold text-sm transition-colors"
            >
              확인
            </button>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-extrabold text-gray-900">문의 등록</h2>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center text-sm transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={submit} className="flex flex-col gap-4">
              {/* 문의 유형 */}
              <div>
                <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">문의 유형</label>
                <select
                  value={type}
                  onChange={e => setType(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-900 outline-none focus:border-[#FA0030] transition-colors bg-white"
                >
                  {INQUIRY_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* 제목 */}
              <div>
                <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">제목</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="문의 제목을 입력해주세요"
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-[#FA0030] transition-colors"
                />
              </div>

              {/* 내용 */}
              <div>
                <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">내용</label>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="문의 내용을 자세히 입력해주세요"
                  required
                  rows={5}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-[#FA0030] transition-colors resize-none leading-relaxed"
                />
              </div>

              {/* 안내 */}
              <p className="text-[12px] text-gray-400 leading-relaxed bg-gray-50 rounded-lg px-3 py-2.5">
                📌 평일 기준 1~2 영업일 내 답변드립니다.<br />
                긴급한 사항은 카카오톡 채널로 문의해주세요.
              </p>

              {/* 버튼 */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:border-gray-400 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={submitting || !title.trim() || !content.trim()}
                  className="flex-1 py-3 rounded-xl bg-[#FA0030] hover:bg-[#D80028] disabled:opacity-50 text-white text-sm font-bold transition-colors"
                >
                  {submitting ? '제출 중...' : '문의 등록'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
