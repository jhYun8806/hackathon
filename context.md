# 프로젝트 전체 컨텍스트 — LMS Inquiry Assistant

> 2026 제품실 AI 해커톤 출품작 | 작성일: 2026-03-27

---

## 프로젝트 개요

내일배움캠프 수강생의 반복적인 행정 문의(출석·훈련장려금·기기대여 등)를 Claude AI가 24시간 자동 답변하는 챗봇.
실제 담당자가 답변 완료한 4,324건의 문의 이력을 RAG로 활용.

**배포 URL:** https://lms-inquiry-assistant-app.vercel.app
**Vercel scope:** `jhyun-teamspartacs-projects`

---

## 기술 스택

| 분류 | 기술 |
|------|------|
| Framework | Next.js 16.2.1 (App Router, TypeScript) |
| Styling | Tailwind CSS v4 |
| Database | Supabase (PostgreSQL) |
| AI | Anthropic Claude API `claude-sonnet-4-6` |
| Testing | Vitest 4.x (57개 테스트) |
| 배포 | Vercel |

---

## 파일 구조

```
lms-inquiry-assistant-app/
├── app/
│   ├── page.tsx                  # 메인 페이지 (ChatBot 컴포넌트 포함)
│   ├── admin/page.tsx            # 관리자 페이지 (문의 이력 조회)
│   ├── globals.css               # 전역 CSS + 커스텀 애니메이션 keyframes
│   └── api/
│       ├── chat/route.ts         # SSE 스트리밍 채팅 API (핵심)
│       ├── sync/route.ts         # Redash → Supabase 동기화 (TTL 1h)
│       ├── sync/workflow/route.ts# 채널톡 워크플로 FAQ 10건 동기화
│       ├── search/route.ts       # inquiry_cache 검색 API
│       └── answers/route.ts      # 답변 이력 CRUD
├── components/
│   └── ChatBot.tsx               # 전체 UI 컴포넌트 (FAB, 모달, 채팅뷰)
├── lib/
│   └── utils.ts                  # 순수 함수 모음 (테스트 대상)
├── __tests__/
│   ├── utils.test.ts             # 26개 테스트
│   ├── workflow-faq.test.ts      # 14개 테스트
│   └── api-chat.test.ts          # 17개 테스트
├── public/rtani/                 # 르탄이 PNG 이미지 에셋
│   ├── Group 11.png              # FAB 캐릭터용 (head/body 레이어 분리)
│   └── ...
├── README.md                     # 제출용 (배포 URL, 기능, 기술 스택)
├── PRINCIPLES.md                 # 제작 원칙 (해커톤 중 결정 기록)
├── SETUP.md                      # 로컬 실행 + 환경 변수 (비공개용)
└── context.md                    # 이 파일: 전체 프로젝트 컨텍스트
```

---

## Supabase 테이블

| 테이블 | 역할 |
|--------|------|
| `inquiry_cache` | Redash + 워크플로 FAQ 통합 캐시. RAG 소스. |
| `notices` | 공지/가이드 문서 (제목, 요약, URL) |
| `sync_meta` | 마지막 동기화 시각 추적 (TTL 체크용) |

> RLS는 해커톤 범위에서 전체 비활성화. 프로덕션 전 설정 필요.

---

## 핵심 API — `/api/chat/route.ts`

### 흐름

```
POST /api/chat
  body: { question, history, rtaniImg }
  ↓
Promise.all([
  inquiry_cache 키워드 OR 검색 (limit 5),
  notices 관련 공지 검색 (limit 2)
])
  ↓
훈련장려금 지급일 질문 감지 시 → NBC API unit-periods 호출
  ↓
Anthropic claude-sonnet-4-6 (streaming)
  ↓
SSE 이벤트 순서:
  { type: 'meta', notices: [...] }
  { type: 'chunk', text: '...' }  ← 반복
  { type: 'done', followUps: [...] }
```

### SSE 클라이언트 처리 (`ChatBot.tsx` `send()`)

1. 빈 슬롯 추가 `{ answer: '', complete: false }`
2. `answer === ''`이면 렌더링 스킵 (빈 버블 방지)
3. `chunk` 이벤트 → 정규식으로 부분 JSON에서 answer 추출
4. `done` 이벤트 → 완전한 JSON 파싱 + `complete: true` 설정
5. `complete === true`일 때만 "해결됐어요 / 문의 등록하기" 버튼 노출

### JSON 포맷 (Claude 출력)

```json
{ "answer": "...", "followUps": ["...", "..."] }
```

파싱 실패 시 raw 텍스트로 폴백.

---

## ChatBot.tsx 주요 컴포넌트

### `FabRtani()`
- `Group 11.png`를 CSS `clip-path: inset()` 로 두 레이어로 분리
  - **body 레이어**: `clip-path: inset(62% 0 0 0)` — 고정
  - **head 레이어**: `clip-path: inset(0 0 38% 0)` + `animation: headNod 1.3s infinite`
  - `transformOrigin: '50% 62%'` (목 위치 기준 회전)
- SVG `?` 마크 우상단 오버레이

### `RtaniAvatar({ src })`
- 채팅 AI 메시지 아바타
- `rtani-float` 애니메이션 (위아래 2.8s)
- `src`는 질문별 랜덤 PNG (`RTANI_IMAGES` 배열에서 선택)

### `StudentAvatar()`
- 사용자 메시지 아바타
- 르탄이 스타일의 픽셀 캐릭터 (SVG): 검정 머리, #FFCDB8 피부, 인디고 모자+몸통

### FAB 단일 래퍼
```tsx
<div
  className="fixed z-50 flex flex-col items-end"
  style={{ bottom: '20px', right: '1.7rem', gap: '30px' }}
>
  {/* 말풍선 */}
  {/* FabRtani 캐릭터 */}
  {/* FAB 버튼 (transform: translateX(-21px) translateY(-9px)) */}
</div>
```

---

## 애니메이션 (globals.css)

| 클래스/keyframe | 용도 |
|----------------|------|
| `rtani-float` | 채팅 아바타 위아래 부유 (2.8s) |
| `headNod` | FAB 캐릭터 머리 까딱 (1.3s) |
| `animate-msgIn` | 메시지 등장 (translateY 10px → 0) |
| `animate-buttonReveal` | 답변 완료 버튼 슬라이드업 (0.45s) |
| `animate-slideUp` | 모달 슬라이드업 (0.32s) |
| `fab-ring::before` | FAB 버튼 생동감 링 확산 (2.2s) |
| `badge-required` | shimmer 그라데이션 배지 (3s) |
| `typing-dot` | 타이핑 인디케이터 점 3개 (1.2s) |

---

## 데이터 파이프라인

```
Redash 쿼리 6832 (MongoDB 행정 답변 DB)
  └── POST /api/sync (TTL 1h, 백그라운드 fire-and-forget)
          └── inquiry_cache upsert (500건 배치, status='답변 완료')

채널톡 워크플로 86459
  └── POST /api/sync/workflow (최초 1회 수동 실행)
          └── inquiry_cache upsert (id: wf-86459-A ~ wf-86459-J)
            ※ 채널톡 Open API가 워크플로 미지원 → CDP(Chrome DevTools Protocol)로 DOM 파싱 수집
```

---

## 자주 묻는 질문 TOP3 (데이터 분석 기반)

| 순위 | 유형 | 건수 | 선정 이유 |
|------|------|------|-----------|
| 🥇 1위 | 훈련장려금 | 826건 | 금전적 이해관계, 질문 빈도 최고 |
| 🥈 2위 | 출석/공가 | 713건 | 제적 위험과 직결, 긴급성 높음 |
| 🥉 3위 | 기기대여 요청 | 511건 | 학습 환경 문제, 즉각 해결 필요 |

---

## 환경 변수 (Vercel + .env.local)

| 변수 | 설명 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon 키 |
| `ANTHROPIC_API_KEY` | Claude API 키 |
| `NEXT_PUBLIC_SITE_URL` | 배포 URL (로컬: localhost:3000) |
| `REDASH_URL` | https://redash-v2.spartacodingclub.kr |
| `REDASH_QUERY_ID` | 6832 |
| `REDASH_API_KEY` | Redash API 키 |

---

## 주요 UI/UX 결정사항

- **모달 height 800px 고정**: 홈↔채팅 전환 시 레이아웃 점프 방지
- **채팅 이력 모달 닫아도 유지**: `msgs`/`history` state 보존, "이전 대화 이어보기" 버튼
- **헤더 르탄이**: float 애니메이션 없음 (브랜딩용)
- **후속 질문 버튼**: 회색 계열 + `Q.` 접두사 (빨간색은 링크로 오인)
- **답변 완료 버튼**: 모달 전체 width 기준 중앙 배치 (`ml-11` 없음)
- **스트리밍 중 빈 버블 방지**: `answer === ''` 이면 렌더링 null 반환

---

## 테스트

```bash
npm test  # 57개 테스트 통과
```

| 파일 | 테스트 수 | 커버 범위 |
|------|-----------|-----------|
| `__tests__/utils.test.ts` | 26 | getFriendlyLabel, isSubsidyTimingQuery, inferInquiryType |
| `__tests__/workflow-faq.test.ts` | 14 | 워크플로 FAQ 데이터 무결성 |
| `__tests__/api-chat.test.ts` | 17 | 지급일 계산, RAG 필터 생성, JSON 파싱 |
