-- Run this in Supabase SQL Editor.

create table if not exists public.notes (
  id bigint generated always as identity primary key,
  title text not null,
  course text not null,
  section text not null,
  file_name text not null,
  file_path text not null unique,
  file_type text not null default 'application/octet-stream',
  created_at timestamp with time zone not null default now()
);

create index if not exists notes_course_idx on public.notes (course);
create index if not exists notes_section_idx on public.notes (section);
create index if not exists notes_created_at_idx on public.notes (created_at desc);

insert into storage.buckets (id, name, public)
values ('notes-files', 'notes-files', false)
on conflict (id) do nothing;
