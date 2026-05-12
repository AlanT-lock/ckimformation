-- Bucket public pour les images de hero des formations.
-- Upload via service_role (admin client), lecture publique via /storage/v1/object/public/...
insert into storage.buckets (id, name, public)
  values ('formation-hero', 'formation-hero', true)
  on conflict (id) do nothing;
