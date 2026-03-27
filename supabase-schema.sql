-- ═══════════════════════════════════════
-- 1. 문의 캐시 테이블 (Redash 데이터 캐싱)
-- ═══════════════════════════════════════
create table if not exists inquiry_cache (
  id          text primary key,          -- MongoDB _id
  question    text not null,             -- content->desc (수강생 질문)
  answer      text not null,             -- 행정 담당자 답변
  category    text,                      -- 기기대여 요청 / 행정 문의/요청 등
  kind        text,                      -- 출석 / 훈련장려금 / 기타 문의 등
  track_name  text,                      -- 부트캠프 트랙명
  created_at  timestamptz
);

-- 빠른 검색을 위한 인덱스
create index if not exists idx_inquiry_cache_question on inquiry_cache using gin(to_tsvector('simple', question));
create index if not exists idx_inquiry_cache_category on inquiry_cache(category);

-- ═══════════════════════════════════════
-- 2. 캐시 동기화 메타 테이블
-- ═══════════════════════════════════════
create table if not exists sync_meta (
  id             text primary key default 'inquiry',
  last_synced_at timestamptz,
  row_count      integer default 0
);

insert into sync_meta (id) values ('inquiry')
on conflict (id) do nothing;

-- ═══════════════════════════════════════
-- 3. 공지 테이블 (기존)
-- ═══════════════════════════════════════
create table if not exists notices (
  id         uuid default gen_random_uuid() primary key,
  title      text not null,
  summary    text not null,
  created_at timestamptz default now()
);

insert into notices (title, summary) values
  ('KDT 훈련생 유의사항 및 제도', 'KDT 훈련생이라면 반드시 확인해야 할 유의사항 및 제도를 안내합니다.'),
  ('훈련생 제적 기준', '출결 미달, 과제 미제출 등 제적 처리 기준을 안내합니다.'),
  ('QR코드 출석 가이드', 'QR코드를 활용한 출석 인정 방법을 안내합니다.'),
  ('출석 및 공가 신청 가이드(QR)', '공가 신청 절차 및 인정 서류 안내입니다.')
on conflict do nothing;

-- ═══════════════════════════════════════
-- 4. 수동 답변 테이블 (Admin CMS 관리)
-- ═══════════════════════════════════════
create table if not exists answers (
  id          uuid default gen_random_uuid() primary key,
  question    text not null,
  answer      text not null,
  category    text not null default '기타',  -- 출결 / 환불 / 수료 / 기타
  used_count  integer not null default 0,
  active      boolean not null default true,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create index if not exists idx_answers_category on answers(category);
create index if not exists idx_answers_active   on answers(active);

-- ═══════════════════════════════════════
-- 5. RLS 비활성화 (프로토타입용)
-- ═══════════════════════════════════════
alter table inquiry_cache disable row level security;
alter table sync_meta     disable row level security;
alter table notices       disable row level security;
alter table answers       disable row level security;
