-- Run this in your Supabase SQL editor to set up the schema

create table recipients (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  first_name text,
  last_name text,
  company text,
  custom_fields jsonb,
  created_at timestamptz default now()
);

create table templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  subject text not null,
  html_content text not null default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table send_logs (
  id uuid primary key default gen_random_uuid(),
  template_id uuid references templates(id) on delete set null,
  template_name text not null,
  recipient_count int not null default 0,
  sent_at timestamptz default now(),
  status text check (status in ('sent', 'failed', 'partial')) not null default 'sent',
  errors text[]
);
