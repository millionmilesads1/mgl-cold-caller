-- Run this in Supabase SQL Editor (supabase.com → your project → SQL Editor → New Query)
-- This creates the prospects table for the MGL Cold Call Tracker

create table prospects (
  id uuid default gen_random_uuid() primary key,
  name text default '',
  business text default '',
  phone text default '',
  email text default '',
  website text default '',
  city text default '',
  state text default '',
  industry text default 'Other',
  competitor text default '',
  notes text default '',
  disposition text,
  call_history jsonb default '[]'::jsonb,
  follow_up_date text,
  created_at timestamptz default now()
);

-- Disable Row Level Security (your app is already password protected)
alter table prospects disable row level security;
