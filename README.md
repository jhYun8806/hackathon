# 내일배움캠프 문의 도우미 — LMS Inquiry Assistant

> 2026 제품실 AI 해커톤 출품작

**배포 URL:** https://lms-inquiry-assistant-app.vercel.app

---

## 문제 정의

내일배움캠프 수강생의 출석·훈련장려금·기기대여 등 행정 문의가 반복적으로 발생해 담당 매니저의 응답 부담이 높고, 운영시간 외에는 즉각 대응이 불가능하다.

- 전체 문의 4,324건 중 **행정 문의/요청 56%** (출석 713건, 훈련장려금 826건, 기타 510건)
- 채널톡 고객센터 운영시간: 평일 10:30~17:30 → **운영 외 시간 응답 공백**
- 반복 질문 유형이 명확함에도 매번 담당자가 직접 답변

---

## 솔루션

실제 행정 담당자가 답변 완료한 **4,324건의 문의 이력(Redash)**을 RAG로 활용해 Claude AI가 24시간 즉시 답변.

- 수강생: 대기 없이 행정 정보 즉시 획득
- 담당자: 반복 문의 응답 부담 감소, 복잡한 케이스에 집중 가능

---

## 동작 방식

```
수강생 질문
    │
    ▼
POST /api/chat (SSE 스트리밍)
    ├── Supabase inquiry_cache 키워드 OR 검색 (limit 5)  ─┐ Promise.all
    ├── Supabase notices 관련 공지 검색 (limit 2)         ─┘ 병렬 실행
    ├── 훈련장려금 지급일 질문 감지 시
    │       └── NBC API unit-periods 호출 → 지급 예상일 계산
    │
    └── Anthropic claude-sonnet-4-6 (스트리밍)
            └── 토큰 생성 즉시 클라이언트에 전달
                    └── ChatBot UI 실시간 렌더링
```

---

## 주요 기능

| 기능 | 설명 |
|------|------|
| RAG 기반 답변 | 과거 유사 문의 사례 최대 5건을 Claude 컨텍스트에 주입 |
| SSE 스트리밍 | 응답 생성 즉시 화면에 표시 (체감 응답속도 개선) |
| 훈련장려금 지급일 | NBC API 단위기간 조회 → 이전 기간 종료일 +1개월 자동 계산 |
| 멀티턴 대화 | history 배열로 이전 대화 맥락 유지 |
| 인라인 액션 버튼 | 답변 내 메뉴 항목(행정 문의/요청 등)을 클릭 가능한 버튼으로 변환 |
| 자주 묻는 질문 TOP3 | 전체 데이터 분석 기반 🥇훈련장려금 🥈출석/공가 🥉기기대여 |
| 채널톡 워크플로 통합 | 워크플로 86459 FAQ 10건을 RAG 데이터로 통합 |

---

## 기술 스택

| 분류 | 기술 |
|------|------|
| Framework | Next.js 16.2.1 (App Router, TypeScript) |
| Styling | Tailwind CSS v4 |
| Database | Supabase (PostgreSQL) |
| AI | Anthropic Claude API (`claude-sonnet-4-6`) |
| Testing | Vitest 4.x (57개 테스트) |
| 배포 | Vercel |

---

## 데이터 파이프라인

```
Redash 쿼리 6832 (MongoDB 행정 답변 DB)
    └── POST /api/sync (1시간 캐시 TTL, 백그라운드 자동 트리거)
            └── Supabase inquiry_cache upsert (500건 배치, status='답변 완료')

채널톡 워크플로 86459 (내일배움캠프 행정봇 FAQ)
    └── POST /api/sync/workflow
            └── Supabase inquiry_cache upsert (id: wf-86459-A ~ wf-86459-J)
```

---

## 테스트

```bash
npm test
```

총 **57개 테스트 통과** (외부 의존성 없는 순수 로직 커버)

| 파일 | 테스트 수 | 커버 범위 |
|------|-----------|-----------|
| `__tests__/utils.test.ts` | 26 | getFriendlyLabel, isSubsidyTimingQuery, inferInquiryType |
| `__tests__/workflow-faq.test.ts` | 14 | 워크플로 FAQ 데이터 무결성 |
| `__tests__/api-chat.test.ts` | 17 | 지급일 계산, RAG 필터 생성, JSON 파싱 |
