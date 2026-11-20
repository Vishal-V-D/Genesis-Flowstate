-- Run this in your Supabase SQL editor to set up the database schema.
-- Dashboard: https://supabase.com/dashboard/project/_/sql

create table if not exists users (
  "userId" text primary key,
  email text not null,
  "firstName" text,
  "lastName" text,
  "hoverStyle" text default 'smooth',
  "onboardingData" jsonb default '{}',
  "excalidrawLibrary" text,
  "hasSeenTour" boolean default false,
  "createdAt" timestamptz default now(),
  "updatedAt" timestamptz default now()
);

create table if not exists workspaces (
  "workspaceId" text primary key,
  "userId" text not null,
  title text default 'Untitled Architecture',
  subtitle text default 'Personal Workspace',
  elements text default '[]',
  "appState" text default '{}',
  "shareMode" text default 'public',
  "editTokens" text[] default '{}',
  "viewTokens" text[] default '{}',
  chats jsonb default '[]',
  "createdAt" timestamptz default now(),
  "updatedAt" timestamptz default now()
);

create table if not exists workspace_members (
  "userId" text not null,
  "workspaceId" text not null references workspaces("workspaceId") on delete cascade,
  role text not null default 'viewer',
  title text,
  "updatedAt" timestamptz default now(),
  primary key ("userId", "workspaceId")
);

create index if not exists idx_workspaces_userId on workspaces("userId");
create index if not exists idx_workspace_members_userId on workspace_members("userId");

-- Enable RLS (Row Level Security)
-- Service role key bypasses RLS automatically, so API routes work without policies.
alter table users enable row level security;
alter table workspaces enable row level security;
alter table workspace_members enable row level security;
