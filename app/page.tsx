'use client'
import { useState } from 'react'
import dynamic from 'next/dynamic'

const ChatBot = dynamic(() => import('@/components/ChatBot'), { ssr: false })
const InquiryModal = dynamic(() => import('@/components/InquiryModal'), { ssr: false })

const LNB_TABS = ['출결/학습 관리', '강의 목록', '학습 자료', '과제/프로젝트', '선물함', '공지/문의']
const SUPPORT_TAB_IDX = 5

const INQUIRY_CARDS = [
  { icon: '📚', bg: 'bg-[#FFF4D6]', title: '학습 및 진로 상담', desc: '학습 방향, 진로, 소통/협업 고민 등', type: '학습 및 진로 상담' },
  { icon: '🚨', bg: 'bg-[#FFECF0]', title: '수강환경 제보', desc: '강의 및 노션 자료 오류 제보 등', type: '수강환경 제보' },
  { icon: '📋', bg: 'bg-[#E8F0FF]', title: '행정 문의/요청', desc: '수강신청, 훈련장려금, 실업급여, 국취제 등', type: '행정 문의/요청' },
  { icon: '💻', bg: 'bg-[#E5FAE5]', title: '기기대여 요청', desc: '노트북, 웹캠, 마이크 등', type: '기기대여 요청' },
]

const NOTICES = [
  { badge: '필독', text: 'KDT 훈련생 유의사항 및 제도' },
  { badge: '필독', text: '훈련생 제적 기준' },
  { badge: '필독', text: 'QR코드 출석 가이드' },
  { badge: '필독', text: '출석 및 공가 신청 가이드(QR)' },
]

const DOC_ITEMS = ['수기출석부 발급', '훈련참여확인서 발급', '훈련 과정 탐색 결과표']

export default function Page() {
  const [activeTab, setActiveTab] = useState(SUPPORT_TAB_IDX)
  const [inquiryType, setInquiryType] = useState<string | null>(null)

  function openInquiry(type: string) { setInquiryType(type) }
  function closeInquiry() { setInquiryType(null) }

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Pretendard Variable', 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", fontSize: '14px', color: '#0D0E11' }}>

      {/* GNB */}
      <header style={{ height: 56, background: '#fff', borderBottom: '1px solid #E8E9EC', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#FA0030', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 16, fontWeight: 900, letterSpacing: -1, flexShrink: 0 }}>
              S
            </div>
            <span style={{ fontSize: 17, fontWeight: 800, color: '#0D0E11', letterSpacing: -0.5 }}>내일배움캠프</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', fontSize: 13, color: '#6B6E7A', gap: 6 }}>
            <span>마이페이지</span>
            <span style={{ color: '#E8E9EC' }}>|</span>
            <button style={{ background: 'none', border: 'none', fontSize: 13, color: '#A4A7B0', fontFamily: 'inherit', cursor: 'pointer' }}>로그아웃</button>
          </div>
        </div>
      </header>

      {/* LNB */}
      <nav style={{ background: '#fff', borderBottom: '1px solid #E8E9EC', position: 'sticky', top: 56, zIndex: 99 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 28px', display: 'flex' }}>
          {LNB_TABS.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              style={{
                position: 'relative',
                padding: '14px 12px',
                fontSize: 15,
                fontWeight: 700,
                color: activeTab === i ? '#40414B' : '#A4A7B0',
                background: 'none',
                border: 'none',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'color .15s',
              }}
            >
              {tab}
              {activeTab === i && (
                <span style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: '#FA0030', borderRadius: '2px 2px 0 0' }} />
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* 콘텐츠 */}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px 80px' }}>
        {activeTab === SUPPORT_TAB_IDX ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 40, paddingTop: 40, alignItems: 'start' }}>

            {/* 왼쪽 */}
            <div>
              <span style={{ display: 'inline-block', fontSize: 12, fontWeight: 700, color: '#FA0030', marginBottom: 10 }}>내배캠119</span>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0D0E11', letterSpacing: -0.5, marginBottom: 6 }}>도움이 필요하신가요?</h1>
              <p style={{ fontSize: 14, color: '#A4A7B0', marginBottom: 24 }}>학습과 행정 도움이 필요한 경우, 문의를 남겨주세요. (영업일 1~2일 내 답변)</p>

              {/* 2×2 카드 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 40 }}>
                {INQUIRY_CARDS.map(card => (
                  <button
                    key={card.title}
                    onClick={() => openInquiry(card.type)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      background: '#fff', border: 'none', borderRadius: 12,
                      padding: '18px 16px', textAlign: 'left', width: '100%',
                      cursor: 'pointer', fontFamily: 'inherit',
                      boxShadow: '0 8px 24px rgba(0,0,0,.08), 0 0 4px rgba(0,0,0,.12)',
                      transition: 'box-shadow .15s, transform .1s',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,.12), 0 0 6px rgba(0,0,0,.16)'
                      e.currentTarget.style.transform = 'translateY(-1px)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,.08), 0 0 4px rgba(0,0,0,.12)'
                      e.currentTarget.style.transform = 'translateY(0)'
                    }}
                  >
                    <div className={`${card.bg}`} style={{ width: 46, height: 46, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                      {card.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#0D0E11', marginBottom: 3 }}>{card.title}</p>
                      <p style={{ fontSize: 12, color: '#A4A7B0' }}>{card.desc}</p>
                    </div>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ color: '#A4A7B0', flexShrink: 0 }}>
                      <path d="M14.987 10L7.917 17.07 6.679 15.834l5.833-5.833L6.679 4.167 7.917 2.93 14.987 10z" fill="currentColor"/>
                    </svg>
                  </button>
                ))}
              </div>

              {/* 문의 내역 */}
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0D0E11', marginBottom: 16 }}>문의 내역</h2>
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#A4A7B0', fontSize: 14 }}>
                문의 내역이 없어요.
              </div>
            </div>

            {/* 오른쪽 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

              {/* 공지 및 가이드 */}
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0D0E11', marginBottom: 12 }}>공지 및 가이드</h3>
                <hr style={{ border: 'none', borderTop: '1px solid rgba(0,0,0,.08)', marginBottom: 4 }} />
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {NOTICES.map((n, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 8px', borderBottom: i < NOTICES.length - 1 ? '1px solid #E8E9EC' : 'none', cursor: 'pointer' }}>
                      <span style={{ background: '#FFECF0', color: '#FA0030', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {n.badge}
                      </span>
                      <span style={{ flex: 1, fontSize: 14, color: '#0D0E11' }}>{n.text}</span>
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" style={{ color: '#E8E9EC', flexShrink: 0 }}>
                        <path d="M14.987 10L7.917 17.07 6.679 15.834l5.833-5.833L6.679 4.167 7.917 2.93 14.987 10z" fill="currentColor"/>
                      </svg>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 서류 발급 */}
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0D0E11', marginBottom: 4 }}>서류 발급</h3>
                <p style={{ fontSize: 13, color: '#6B6E7A', marginBottom: 10 }}>실업급여, 국취제 증빙 등을 위한 서류 발급</p>
                <hr style={{ border: 'none', borderTop: '1px solid rgba(0,0,0,.08)', marginBottom: 4 }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {DOC_ITEMS.map((doc, i) => (
                    <button key={doc}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '12px 8px', fontSize: 14, color: '#0D0E11',
                        background: 'none', border: 'none', borderBottom: i < DOC_ITEMS.length - 1 ? '1px solid #E8E9EC' : 'none',
                        width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
                      }}>
                      <span>{doc}</span>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: '#A4A7B0', flexShrink: 0 }}>
                        <path d="M3.417 12.583h9.167v-2h1.5v3.5H1.917v-3.5h1.5v2zm5.333-3.729 1.386-1.385.53-.53 1.061 1.06-.53.53-2.666 2.667-.53.53-3.728-3.727 1.061-1.06 1.916 1.916V2.667h1.5v6.187z" fill="currentColor"/>
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ padding: '80px 0', textAlign: 'center', color: '#A4A7B0', fontSize: 14 }}>
            {LNB_TABS[activeTab]} 페이지는 준비 중입니다.
          </div>
        )}
      </main>

      {/* 푸터 */}
      <footer style={{ background: '#fff', borderTop: '1px solid #E8E9EC', marginTop: 60 }}>
        {/* 상단: 고객센터 + 링크 컬럼 */}
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 40px 0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 40, paddingBottom: 32 }}>
            {/* 고객센터 */}
            <div>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: '#0D0E11', marginBottom: 12 }}>고객센터</h2>
              <p style={{ fontSize: 13, color: '#6B6E7A', lineHeight: 1.8, marginBottom: 6 }}>모든 상담은 채팅 상담을 통해 우선 접수됩니다.</p>
              <p style={{ fontSize: 13, color: '#6B6E7A', lineHeight: 1.8, marginBottom: 6 }}>
                채팅 상담 운영시간 :<br />
                월요일 14:00-17:30<br />
                화~금요일 10:30-17:30
              </p>
              <p style={{ fontSize: 13, color: '#6B6E7A', lineHeight: 1.8, marginBottom: 6 }}>(점심시간 12:30-14:00 / 주말, 공휴일 휴무)</p>
              <p style={{ fontSize: 13, color: '#6B6E7A', lineHeight: 1.8 }}>전화 상담 희망 시,<br />채팅 상담을 통해 신청 부탁드립니다.</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 14, cursor: 'pointer' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ color: '#6B6E7A' }}>
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0D0E11' }}>채팅 상담 바로가기</span>
              </div>
            </div>
            {/* 링크 컬럼 4개 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
              {[
                { title: '부트캠프', items: ['단기심화 Java', '제조업 품질 관리', 'PM', '언리얼 게임 개발', '백엔드 개발', '마케터', 'AI 디자이너'] },
                { title: '취업 지원', items: ['취업 지원', '취업 사례', 'FAQ'] },
                { title: 'FAQ', items: ['취업 지원 FAQ', '국비 지원 FAQ', '내일배움캠프 블로그'] },
                { title: 'ETC', items: ['튜터 지원', '팀스파르타 채용', '협력사 지원'] },
              ].map(col => (
                <div key={col.title}>
                  <h2 style={{ fontSize: 14, fontWeight: 700, color: '#0D0E11', marginBottom: 12 }}>{col.title}</h2>
                  {col.items.map(item => (
                    <a key={item} href="#" style={{ display: 'block', fontSize: 13, color: '#6B6E7A', marginBottom: 8, textDecoration: 'none' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#0D0E11')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#6B6E7A')}>
                      {item}
                    </a>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 구분선 */}
        <hr style={{ border: 'none', borderTop: '1px solid #E8E9EC', margin: '0 40px' }} />

        {/* 하단 바: 정책 링크 + 소셜 + 수상 */}
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 40px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 16 }}>
            {['개인정보처리방침', '서비스 이용약관', '고객센터', 'KDT신문고'].map((link, i) => (
              <a key={link} href="#" style={{ fontSize: 13, color: i === 0 ? '#0D0E11' : '#6B6E7A', fontWeight: i === 0 ? 700 : 400, textDecoration: 'none' }}>{link}</a>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {['💬', '📝', '📸', '▶️'].map((icon, i) => (
                <a key={i} href="#" style={{ width: 32, height: 32, borderRadius: '50%', background: '#F7F8FA', border: '1px solid #E8E9EC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, textDecoration: 'none' }}>
                  {icon}
                </a>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: '#F7F8FA', borderRadius: 8 }}>
              <div style={{ width: 36, height: 36, background: '#F7F8FA', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🏆</div>
              <div style={{ fontSize: 11, color: '#6B6E7A', lineHeight: 1.5 }}>2022-23 올해의 브랜드 대상<br />코딩교육 부문 2년 연속 1위</div>
            </div>
          </div>
        </div>

        {/* 사업자 정보 */}
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px 28px', borderTop: '1px solid #E8E9EC' }}>
          <p style={{ fontSize: 12, color: '#A4A7B0', lineHeight: 1.8, marginTop: 14 }}>팀스파르타(주) 사업자 정보</p>
          <p style={{ fontSize: 12, color: '#A4A7B0', lineHeight: 1.8, marginTop: 14 }}>
            대표자 : 이범규ㅣ사업자 등록번호 : 783-86-01715ㅣ통신판매업 신고번호 : 2020-서울강남-02300ㅣ평생교육시설 신고번호 : 제 661호<br />
            주소 : 서울특별시 강남구 테헤란로 311 3층ㅣ이메일 : contact@teamsparta.coㅣ전화 : 1522-8016
          </p>
          <p style={{ fontSize: 12, color: '#A4A7B0', marginTop: 6 }}>Copyright ©2024 TEAMSPARTA. All rights reserved.</p>
        </div>
      </footer>

      {/* ChatBot FAB */}
      <ChatBot onInquiry={openInquiry} />

      {/* 문의 등록 모달 */}
      {inquiryType && (
        <InquiryModal defaultType={inquiryType} onClose={closeInquiry} />
      )}
    </div>
  )
}
