-- Chetesaí Fitness+ · Biblioteca multimedia propia
-- Bucket público para miniaturas, imágenes, GIF/WebP animados y vídeos de ejercicios.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'exercise-media',
  'exercise-media',
  true,
  52428800,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Las subidas se realizan exclusivamente desde la API del servidor con service_role.
-- La lectura es pública para que las miniaturas y demostraciones funcionen en el portal.

drop policy if exists "exercise_media_public_read" on storage.objects;
create policy "exercise_media_public_read"
on storage.objects for select
to public
using (bucket_id = 'exercise-media');
