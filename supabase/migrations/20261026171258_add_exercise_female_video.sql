alter table public.ejercicios add column if not exists video_mujer_url text;
comment on column public.ejercicios.video_mujer_url is 'Independent female model video. NULL means no female video; never fall back to video_url.';
