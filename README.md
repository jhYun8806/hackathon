# 내일배움캠프 문의 도우미 — LMS Inquiry Assistant

> 2026 제품실 AI 해커톤 출품작
> 실제 행정 담당자 답변 사례를 기반으로 수강생 문의를 자동 응답하는 AI 어시스턴트

---

## 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [기술 스택](#2-기술-스택)
3. [아키텍처](#3-아키텍처)
4. [데이터베이스 스키마](#4-데이터베이스-스키마)
5. [API 라우트](#5-api-라우트)
6. [주요 컴포넌트](#6-주요-컴포넌트)
7. [핵심 기능 설명](#7-핵심-기능-설명)
8. [환경 변수](#8-환경-변수)
9. [로컬 실행](#9-로컬-실행)
10. [테스트](#10-테스트)
11. [배포](#11-배포)
12. [미완성/보완 필요 항목](#12-미완성보완-필요-항목)

---

## 1. 프로젝트 개요

내일배움캠프 LMS 수강생이 출결, 훈련장려금, 공가, 서류 발급 등 행정 관련 문의를 하면 **실제 과거 행정 담당자 답변 데이터(RAG)** 를 기반으로 AI가 즉각 답변하는 챗봇 시스템.

### 해결하는 문제

- 반복적인 행정 문의 → 담당자 응답 부담 감소
- 운영시간 외 문의 → 24시간 즉각 응답
- 채널톡 워크플로 FAQ 데이터 → AI 답변에 통합

### 주요 화면

| 화면 | 경로 | 설명 |
|------|------|------|
| LMS 메인 | `/` | 공지/문의 탭, 문의 카드 4종, 서류 발급, 공지 목록 |
| 문의 도우미 | FAB (우하단) | 홈 화면(자주 묻는 질문 + 공지) + AI 채팅 화면 |
| 문의 등록 모달 | FAB → 버튼 | 유형 선택 후 문의 접수 (현재 mock) |
| 관리자 | `/admin` | 수동 답변 CRUD |

---

## 2. 기술 스택

| 분류 | 기술 |
|------|------|
| Framework | Next.js 16.2.1 (App Router, TypeScript) |
| Styling | Tailwind CSS v4 |
| Database | Supabase (PostgreSQL, RLS 비활성화) |
| AI | Anthropic Claude API (`claude-sonnet-4-6`) |
| Font | Pretendard Variable |
| Testing | Vitest 4.x |

---

## 3. 아키텍처

```
수강생 질문
    │
    ▼
POST /api/chat
    ├── ensureCacheFresh() ──────────────────────────────► POST /api/sync
    │       └── sync_meta 1시간 경과 시 백그라운드 트리거     (Redash 쿼리 6832)
    │
    ├── Supabase inquiry_cache 키워드 OR 검색 (limit 5)
    ├── Supabase notices 관련 공지 검색 (limit 2)
    ├── isSubsidyTimingQuery() 감지 시
    │       └── api.nbc.spartacodingclub.kr/unit-periods 호출
    │               └── 이전 단위기간 종료일 + 1개월 → 지급 예상일
    │
    └── Anthropic claude-sonnet-4-6
            └── { answer, followUps } JSON 반환
                    │
                    ▼
            ChatBot UI 렌더링
            ├── parseAnswer() — URL → 친근한 링크
            │                   메뉴 항목 → 인라인 액션 버튼
            ├── 관련 공지 — 버블 내부 하단에 클릭 가능 링크
            └── 후속 질문 — 회색 버튼 (링크와 시각적 구분)
```

### 데이터 파이프라인

```
Redash 쿼리 6832 (MongoDB 행정 답변 DB)
    └── GET/POST /api/sync
            └── Supabase inquiry_cache upsert (배치 500건, status='답변 완료')

채널톡 워크플로 86459 (내일배움캠프 행정봇 10개 FAQ)
    └── GET/POST /api/sync/workflow
            └── Supabase inquiry_cache upsert (id: wf-86459-A ~ wf-86459-J)

관리자 수동 입력
    └── /admin → CRUD → Supabase answers 테이블
        ※ 현재 answers 테이블은 /api/chat RAG에 미연동 (보완 필요)
```

---

## 4. 데이터베이스 스키마

전체 DDL: [`supabase-schema.sql`](./supabase-schema.sql)

### inquiry_cache
```
id          TEXT PK     -- MongoDB _id 또는 wf-86459-{A~J}
question    TEXT        -- 수강생 질문
answer      TEXT        -- 행정 담당자 답변
category    TEXT        -- '행정 문의/요청' 등
kind        TEXT        -- '출석', '훈련장려금', '공가' 등
track_name  TEXT        -- 부트캠프 트랙명
round_id    TEXT        -- 훈련장려금 지급일 계산용
created_at  TIMESTAMPTZ
```

### sync_meta
```
id             TEXT PK DEFAULT 'inquiry'
last_synced_at TIMESTAMPTZ
row_count      INTEGER
```

### notices
```
id         UUID PK
title      TEXT        -- 공지 제목
summary    TEXT        -- 한 줄 요약
created_at TIMESTAMPTZ
```
초기 4건: KDT 훈련생 유의사항, 훈련생 제적 기준, QR코드 출석 가이드, 출석 및 공가 신청 가이드(QR)

### answers (Admin CMS)
```
id          UUID PK
question    TEXT
answer      TEXT
category    TEXT DEFAULT '기타'
used_count  INTEGER DEFAULT 0
active      BOOLEAN DEFAULT true
created_at  TIMESTAMPTZ
updated_at  TIMESTAMPTZ
```

> **주의**: 프로토타입으로 모든 테이블 RLS 비활성화 상태

---

## 5. API 라우트

### `POST /api/chat` — AI 답변 생성

**Request**
```json
{ "query": "훈련장려금은 언제 나오나요?", "history": [] }
```

**Response**
```json
{
  "answer": "훈련장려금은 ...",
  "followUps": ["신청 방법은?", "조건은?", "지급일은?"],
  "notices": [{ "title": "QR코드 출석 가이드", "summary": "..." }]
}
```

**동작 순서**
1. `ensureCacheFresh()` — 1시간 경과 시 /api/sync 백그라운드 트리거
2. 키워드 OR ilike 검색 (inquiry_cache, 최대 5건)
3. 공지 OR 검색 (notices, 최대 2건)
4. `isSubsidyTimingQuery()` 감지 시 unit-periods API 호출 → 지급 예상일 추가
5. Claude 호출 (system prompt + RAG context)
6. JSON 파싱 → `{ answer, followUps }` 반환

---

### `GET/POST /api/sync` — Redash 동기화

Redash 쿼리 6832 결과를 inquiry_cache에 배치 upsert (500건 단위). `status === '답변 완료'` 필터. 완료 후 sync_meta 갱신.

---

### `GET/POST /api/sync/workflow` — 워크플로 FAQ 동기화

채널톡 워크플로 86459 정적 데이터 10건을 inquiry_cache에 upsert.

| ID | kind | 내용 |
|----|------|------|
| wf-86459-A | 수강신청 | 내일배움카드 → HRD-Net 수강신청 방법 |
| wf-86459-B | 국취제 | 국민취업지원제도 안내 |
| wf-86459-C | 출석 | 출석체크 방법 |
| wf-86459-D | 공가 | 공가 인정 범위 |
| wf-86459-E | 공가 | 공가 신청 방법 및 절차 |
| wf-86459-F | 훈련장려금 | 수령 조건 |
| wf-86459-G | 훈련장려금 | 신청 절차 |
| wf-86459-H | 서류 발급 | 훈련탐색결과표 발급 방법 |
| wf-86459-I | 중도하차 | 패널티 안내 |
| wf-86459-J | QR출석 | QR코드 출석 가능 시간 |

---

### `GET /api/answers` — 수동 답변 목록
### `POST /api/answers` — 수동 답변 등록
### `PATCH /api/answers/[id]` — 수동 답변 수정
### `DELETE /api/answers/[id]` — 수동 답변 삭제
### `POST /api/search` — 키워드 검색 (answers 테이블, used_count 증가)

---

## 6. 주요 컴포넌트

### `components/ChatBot.tsx`

문의 도우미 FAB + 챗봇 모달 전체. `ssr: false`로 dynamic import.

**핵심 상태**

| 상태 | 타입 | 설명 |
|------|------|------|
| `open` | boolean | 모달 열림/닫힘 |
| `view` | `'home' \| 'chat'` | 홈 ↔ 채팅 뷰 (전환 시 채팅 이력 유지) |
| `msgs` | `Msg[]` | 채팅 메시지 배열 (user / ai / system 구분) |
| `history` | `HistoryItem[]` | Claude API 멀티턴용 히스토리 |
| `loading` | boolean | 응답 생성 중 |
| `fabBottom` | string | 푸터 IntersectionObserver 연동 동적 위치 |

**메시지 타입**
```ts
type Msg =
  | { type: 'system'; text: string }
  | { type: 'user'; text: string }
  | { type: 'ai'; answer: string; followUps: string[]; notices: Notice[]; rtaniImg: string }
```

**주요 함수**

| 함수 | 설명 |
|------|------|
| `send(query?)` | 메시지 전송 → /api/chat 호출 → 응답 렌더링 |
| `parseAnswer(text, onAction)` | URL/메뉴항목 파싱 → React 노드 변환 |
| `handleInquiryAction(type)` | 모달 닫기 + 문의 모달 오픈 |
| `StudentAvatar()` | 인라인 SVG 학생 캐릭터 (졸업모 + 인디고) |
| `RtaniAvatar({ src })` | 르탄이 PNG 이미지 아바타 |

---

### `components/InquiryModal.tsx`

문의 등록 모달. 유형 선택 + 제목/내용 입력.
현재 제출 시 mock (setTimeout 800ms). Supabase 실제 저장 미연동.

**문의 유형**: 학습 및 진로 상담 / 수강환경 제보 / 행정 문의/요청 / 기기대여 요청 / 서류 발급 / 기타

---

### `lib/utils.ts`

순수 유틸리티 함수 (테스트 가능, 외부 의존성 없음).

| export | 설명 |
|--------|------|
| `getFriendlyLabel(url)` | URL → 한국어 레이블 (10개 패턴 매핑) |
| `inferInquiryType(history)` | 대화 이력 기반 문의 유형 추론 |
| `isSubsidyTimingQuery(query)` | 훈련장려금 지급 시점 질문 감지 |
| `INQUIRY_ACTION_ITEMS` | 인라인 버튼 변환 대상 메뉴 항목 7개 |
| `DOC_ITEMS` | 서류 발급 3종 Set |
| `URL_LABELS` | URL → 레이블 매핑 배열 |

---

### `lib/supabase.ts`

Supabase 클라이언트 싱글턴 + `Answer`, `Notice` 타입 정의.

---

## 7. 핵심 기능 설명

### RAG 검색
1. 질문을 공백 기준으로 키워드 분리 (최대 5개)
2. `inquiry_cache`에서 question / answer / kind 컬럼 OR ilike 검색
3. 최대 5건을 Claude 프롬프트 `[유사 문의 사례]`에 삽입
4. 매칭 없으면 `(유사 사례 없음 - 일반적인 내배캠 행정 지식으로 답변)` 지시

### 훈련장려금 지급일 계산
- `isSubsidyTimingQuery()` 로 감지 (훈련장려금/장려금 + 언제/지급일/입금 등)
- NBC API에서 단위기간 배열 조회
- 오늘이 속한 단위기간 확인 → 이전 기간 종료일 +1개월 계산
- `FALLBACK_ROUND_ID = '67d0f95f735b66a72ad03cfe'` (round_id 없을 때 폴백)

### 채널톡 워크플로 데이터 통합
- Channel.io Open API v5는 워크플로 노드 구조 미지원
- CDP(Chrome DevTools Protocol)로 Channel Desk UI DOM 파싱하여 수동 수집
- 10개 FAQ를 `wf-86459-A~J` ID로 inquiry_cache에 정적 저장
- `GET /api/sync/workflow` 로 언제든 재동기화 가능

### 인라인 액션 버튼 변환
```
AI 답변 텍스트 중 "행정 문의/요청", "기기대여 요청" 등 7개 메뉴 항목 감지
    └── parseAnswer() 정규식 → <button> 으로 변환 → 클릭 시 문의 모달 오픈
서류 발급 3종(수기출석부 발급 / 훈련참여확인서 발급 / 훈련 과정 탐색 결과표)
    └── DOC_ITEMS → 모두 '서류 발급' 타입으로 통일
```

### 관련 공지 인라인 표시
- AI 답변 버블 내부 하단에 구분선 후 공지 표시 (버블 밖으로 분리 안 함)
- `NOTICE_URL_MAP`으로 공지 제목 → URL 매핑 (notices 테이블에 URL 미저장)
- URL 있으면 `<a>` 태그 (클릭 시 새 탭), 없으면 `<div>`

---

## 8. 환경 변수

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_SITE_URL=http://localhost:3000   # 배포 시 실제 URL로 교체
REDASH_QUERY_ID=6832
REDASH_API_KEY=...
```

---

## 9. 로컬 실행

```bash
npm install
npm run dev
# → http://localhost:3000
```

관리자 페이지: `http://localhost:3000/admin`

초기 워크플로 FAQ 동기화:
```bash
curl http://localhost:3000/api/sync/workflow
# → {"synced":true,"count":10}
```

---

## 10. 테스트

```bash
npm test            # 전체 1회 실행
npm run test:watch  # watch 모드
```

| 파일 | 테스트 수 | 커버 범위 |
|------|-----------|-----------|
| `__tests__/utils.test.ts` | 26 | getFriendlyLabel, isSubsidyTimingQuery, inferInquiryType, 상수 검증 |
| `__tests__/workflow-faq.test.ts` | 14 | 워크플로 FAQ 데이터 무결성, 검색 가능성 |
| `__tests__/api-chat.test.ts` | 17 | 지급일 계산 로직, RAG 필터 생성, JSON 파싱 |

**총 57개 테스트 모두 통과** (외부 의존성 없는 순수 로직만 커버)

---

## 11. 배포

Vercel 배포 권장.

```bash
vercel deploy --prod
```

**배포 후 필수 설정**
1. Vercel Dashboard → Settings → Environment Variables에 `.env.local` 항목 전부 등록
2. `NEXT_PUBLIC_SITE_URL`을 실제 Vercel URL로 변경
3. 초기 워크플로 FAQ 동기화: `GET [배포URL]/api/sync/workflow`

---

## 12. 미완성/보완 필요 항목

| 항목 | 현황 | 필요 작업 |
|------|------|-----------|
| 문의 등록 실제 저장 | mock (setTimeout 800ms) | InquiryModal submit → Supabase insert 연동 |
| Admin answers → RAG 연동 | 미연동 | /api/chat에서 answers 테이블도 검색하도록 확장 |
| 메인 페이지 공지 | 하드코딩 | Supabase notices 테이블에서 fetch로 변경 |
| inquiry_cache round_id DDL | 실 DB엔 컬럼 존재, schema.sql 누락 | supabase-schema.sql에 `round_id TEXT` 추가 |
| 인증/권한 | RLS 전체 비활성화 | 프로덕션 전 RLS + anon 정책 설정 필요 |
| 문의 내역 조회 | UI 하드코딩 | 실제 데이터 연동 필요 |
