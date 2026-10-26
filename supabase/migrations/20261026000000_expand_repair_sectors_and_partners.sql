alter table public.guides add column if not exists sector text;

update public.guides
set sector = case
  when sector is not null and btrim(sector) <> '' then sector
  when area = 'Bike' then 'Bikes & mobility'
  when area = 'Clothes' then 'Clothing & textiles'
  when coalesce(slug, '') || ' ' || title ilike '%chair%' or coalesce(slug, '') || ' ' || title ilike '%furniture%' or coalesce(slug, '') || ' ' || title ilike '%veneer%' then 'Furniture & upholstery'
  when coalesce(slug, '') || ' ' || title ilike '%remote%' or coalesce(slug, '') || ' ' || title ilike '%vacuum%' or coalesce(slug, '') || ' ' || title ilike '%battery%' then 'Appliances & electronics'
  when coalesce(slug, '') || ' ' || title ilike '%garden%' or coalesce(slug, '') || ' ' || title ilike '%hose%' or coalesce(slug, '') || ' ' || title ilike '%shears%' or coalesce(slug, '') || ' ' || title ilike '%pruner%' then 'Garden & outdoor'
  when coalesce(slug, '') || ' ' || title ilike '%backpack%' or coalesce(slug, '') || ' ' || title ilike '%luggage%' or coalesce(slug, '') || ' ' || title ilike '%suitcase%' then 'Personal gear'
  when coalesce(slug, '') || ' ' || title ilike '%toy%' or coalesce(slug, '') || ' ' || title ilike '%badminton%' or coalesce(slug, '') || ' ' || title ilike '%overgrip%' or coalesce(slug, '') || ' ' || title ilike '%racket%' then 'Toys & leisure'
  when coalesce(slug, '') || ' ' || title ilike '%wiper%' or coalesce(slug, '') || ' ' || title ilike '%vehicle%' or coalesce(slug, '') || ' ' || title ilike '%windscreen%' then 'Vehicles & powered equipment'
  when coalesce(slug, '') || ' ' || title ilike '%kitchen%' or coalesce(slug, '') || ' ' || title ilike '%cabinet%' or coalesce(slug, '') || ' ' || title ilike '%drawer%' or coalesce(slug, '') || ' ' || title ilike '%bottle%' or coalesce(slug, '') || ' ' || title ilike '%gasket%' then 'Kitchen & household'
  when area = 'Home' then 'Home fixtures'
  else 'Other everyday objects'
end;

alter table public.guides alter column sector set default 'Other everyday objects';
alter table public.guides alter column sector set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'guides_sector_check'
      and conrelid = 'public.guides'::regclass
  ) then
    alter table public.guides add constraint guides_sector_check check (
      sector in (
        'Bikes & mobility',
        'Clothing & textiles',
        'Home fixtures',
        'Furniture & upholstery',
        'Appliances & electronics',
        'Kitchen & household',
        'Garden & outdoor',
        'Personal gear',
        'Toys & leisure',
        'Vehicles & powered equipment',
        'Other everyday objects'
      )
    );
  end if;
end;
$$;

create index if not exists guides_public_sector_created_idx
  on public.guides (sector, created_at desc, id desc)
  where status in ('published', 'needs_illustrations') and visibility = 'public';

create or replace function public.refresh_guide_search_vector()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.search_vector :=
    setweight(to_tsvector('simple', coalesce(new.title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(new.description, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(new.area, '') || ' ' || coalesce(new.sector, '') || ' ' || array_to_string(new.tools, ' ')), 'C') ||
    setweight(to_tsvector('simple', coalesce((select string_agg(title || ' ' || instruction, ' ') from public.guide_steps where guide_id = new.id), '')), 'D') ||
    setweight(to_tsvector('simple', coalesce((select string_agg(name || ' ' || details, ' ') from public.guide_parts where guide_id = new.id), '')), 'D');
  return new;
end;
$$;

drop trigger if exists guides_search_vector_update on public.guides;
create trigger guides_search_vector_update
before insert or update of title, description, area, sector, tools on public.guides
for each row execute function public.refresh_guide_search_vector();

update public.guides set sector = sector;

create table if not exists public.partner_inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 100),
  email text not null check (char_length(email) between 3 and 254),
  organization text check (organization is null or char_length(organization) <= 160),
  partner_type text not null check (partner_type in ('local_repair', 'repair_cafe', 'parts_retailer', 'brand', 'other')),
  city text check (city is null or char_length(city) <= 100),
  website text,
  message text not null check (char_length(message) between 10 and 2000),
  consented_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists partner_inquiries_created_idx on public.partner_inquiries (created_at desc);
alter table public.partner_inquiries enable row level security;
revoke all on public.partner_inquiries from anon, authenticated;
grant all on public.partner_inquiries to service_role;
