create table if not exists public.repair_credit_wallets (
  wallet_hash text primary key check (wallet_hash ~ '^[0-9a-f]{64}$'),
  credits integer not null default 0 check (credits >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.repair_credit_reservations (
  id uuid primary key,
  wallet_hash text not null references public.repair_credit_wallets(wallet_hash) on delete cascade,
  status text not null default 'reserved' check (status in ('reserved', 'charged', 'released')),
  created_at timestamptz not null default now(),
  settled_at timestamptz
);
create index if not exists repair_credit_reservations_expiry_idx
  on public.repair_credit_reservations(wallet_hash, created_at)
  where status = 'reserved';

create table if not exists public.repair_credit_purchases (
  paddle_transaction_id text primary key,
  paddle_event_id text not null unique,
  wallet_hash text not null references public.repair_credit_wallets(wallet_hash),
  price_id text not null,
  credits integer not null check (credits in (1, 5)),
  created_at timestamptz not null default now()
);
create index if not exists repair_credit_purchases_wallet_idx
  on public.repair_credit_purchases(wallet_hash, created_at desc);

alter table public.repair_credit_wallets enable row level security;
alter table public.repair_credit_reservations enable row level security;
alter table public.repair_credit_purchases enable row level security;
revoke all on public.repair_credit_wallets, public.repair_credit_reservations, public.repair_credit_purchases from anon, authenticated;
grant all on public.repair_credit_wallets, public.repair_credit_reservations, public.repair_credit_purchases to service_role;

create or replace function public.reserve_repair_credit(p_wallet_hash text, p_reservation_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  expired_count integer;
begin
  if p_wallet_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid wallet identifier';
  end if;

  insert into public.repair_credit_wallets(wallet_hash, credits)
  values (p_wallet_hash, 0)
  on conflict (wallet_hash) do nothing;

  with expired as (
    update public.repair_credit_reservations
       set status = 'released', settled_at = now()
     where wallet_hash = p_wallet_hash
       and status = 'reserved'
       and created_at < now() - interval '10 minutes'
     returning id
  )
  select count(*) into expired_count from expired;

  if expired_count > 0 then
    update public.repair_credit_wallets
       set credits = credits + expired_count, updated_at = now()
     where wallet_hash = p_wallet_hash;
  end if;

  update public.repair_credit_wallets
     set credits = credits - 1, updated_at = now()
   where wallet_hash = p_wallet_hash and credits > 0;
  if not found then
    return false;
  end if;

  insert into public.repair_credit_reservations(id, wallet_hash, status)
  values (p_reservation_id, p_wallet_hash, 'reserved');
  return true;
end;
$$;

create or replace function public.settle_repair_credit(p_reservation_id uuid, p_succeeded boolean)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  reservation public.repair_credit_reservations%rowtype;
begin
  select * into reservation
    from public.repair_credit_reservations
   where id = p_reservation_id
   for update;
  if not found or reservation.status <> 'reserved' then
    return false;
  end if;

  update public.repair_credit_reservations
     set status = case when p_succeeded then 'charged' else 'released' end,
         settled_at = now()
   where id = p_reservation_id;

  if not p_succeeded then
    update public.repair_credit_wallets
       set credits = credits + 1, updated_at = now()
     where wallet_hash = reservation.wallet_hash;
  end if;
  return true;
end;
$$;

create or replace function public.grant_paddle_repair_credits(
  p_wallet_hash text,
  p_transaction_id text,
  p_event_id text,
  p_price_id text,
  p_credits integer
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_wallet_hash !~ '^[0-9a-f]{64}$' or p_credits not in (1, 5) then
    raise exception 'Invalid repair credit purchase';
  end if;

  insert into public.repair_credit_wallets(wallet_hash, credits)
  values (p_wallet_hash, 0)
  on conflict (wallet_hash) do nothing;

  insert into public.repair_credit_purchases(
    paddle_transaction_id, paddle_event_id, wallet_hash, price_id, credits
  ) values (
    p_transaction_id, p_event_id, p_wallet_hash, p_price_id, p_credits
  )
  on conflict do nothing;
  if not found then
    return false;
  end if;

  update public.repair_credit_wallets
     set credits = credits + p_credits, updated_at = now()
   where wallet_hash = p_wallet_hash;
  return true;
end;
$$;

revoke all on function public.reserve_repair_credit(text, uuid) from public, anon, authenticated;
revoke all on function public.settle_repair_credit(uuid, boolean) from public, anon, authenticated;
revoke all on function public.grant_paddle_repair_credits(text, text, text, text, integer) from public, anon, authenticated;
grant execute on function public.reserve_repair_credit(text, uuid) to service_role;
grant execute on function public.settle_repair_credit(uuid, boolean) to service_role;
grant execute on function public.grant_paddle_repair_credits(text, text, text, text, integer) to service_role;
