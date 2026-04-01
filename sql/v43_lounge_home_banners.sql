alter table public.lounge_businesses
add column if not exists home_banner_enabled boolean not null default false;

alter table public.lounge_businesses
add column if not exists home_banner_title text;

alter table public.lounge_businesses
add column if not exists home_banner_description text;

alter table public.lounge_businesses
add column if not exists home_banner_order integer not null default 0;

create index if not exists idx_lounge_businesses_home_banner
on public.lounge_businesses(home_banner_enabled desc, home_banner_order asc, updated_at desc);
