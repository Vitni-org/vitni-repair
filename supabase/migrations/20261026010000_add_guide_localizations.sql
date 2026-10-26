create table if not exists public.guide_localizations (
  guide_id bigint not null references public.guides(id) on delete cascade,
  locale text not null check (locale in ('fr')),
  title text not null check (char_length(title) between 1 and 200),
  description text not null default '',
  image_alt text not null default '',
  safety_notes text not null default '',
  tools jsonb not null default '[]'::jsonb check (jsonb_typeof(tools) = 'array'),
  steps jsonb not null default '[]'::jsonb check (jsonb_typeof(steps) = 'array'),
  parts jsonb not null default '[]'::jsonb check (jsonb_typeof(parts) = 'array'),
  search_text text not null default '',
  search_vector tsvector not null default ''::tsvector,
  updated_at timestamptz not null default now(),
  primary key (guide_id, locale)
);

create index if not exists guide_localizations_search_idx
  on public.guide_localizations using gin (search_vector);

create or replace function public.refresh_guide_localization_search_vector()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.search_vector := to_tsvector('french', coalesce(new.search_text, ''));
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists guide_localizations_search_update on public.guide_localizations;
create trigger guide_localizations_search_update
before insert or update of search_text, title, description, safety_notes, tools, steps, parts
on public.guide_localizations
for each row execute function public.refresh_guide_localization_search_vector();

alter table public.guide_localizations enable row level security;
revoke all on public.guide_localizations from anon, authenticated;
grant all on public.guide_localizations to service_role;
