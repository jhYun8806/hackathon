# 로컬 실행 가이드

## 환경 변수 설정

`.env.local` 파일을 프로젝트 루트에 생성하고 아래 값을 입력합니다.

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_SITE_URL=http://localhost:3000   # 배포 시 실제 URL로 교체
REDASH_URL=https://redash-v2.spartacodingclub.kr
REDASH_QUERY_ID=6832
REDASH_API_KEY=...
```

## 실행

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # 테스트 실행 (57개)
```

관리자 페이지: `http://localhost:3000/admin`

## 초기 데이터 동기화

```bash
# 워크플로 FAQ 10건 초기 적재 (최초 1회)
curl -X POST http://localhost:3000/api/sync/workflow

# Redash 수동 동기화 (1시간 TTL 내 자동 트리거, 필요 시 수동 실행)
curl -X POST http://localhost:3000/api/sync
```

## 배포 (Vercel)

```bash
vercel deploy --prod
```

배포 후 Vercel Dashboard → Settings → Environment Variables에 위 환경 변수 전부 등록.
`NEXT_PUBLIC_SITE_URL`은 실제 Vercel URL로 교체 필요.
