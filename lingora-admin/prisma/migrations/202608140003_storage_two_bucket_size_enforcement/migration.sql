-- SEC-D8 PA2 corrective migration: enforce media-class limits at bucket level.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM storage.objects
    WHERE bucket_id = 'lingora-media'
      AND (storage.foldername(name))[1] = 'profiles'
  ) THEN
    RAISE EXCEPTION 'lingora-media contains avatar objects; inventory and migration are required before applying this correction';
  END IF;
END
$$;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'lingora-avatars',
  'lingora-avatars',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET public = false,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

UPDATE storage.buckets
SET public = false,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['audio/mpeg', 'audio/wav']
WHERE id = 'lingora-media';

DROP POLICY IF EXISTS lingora_avatar_select ON storage.objects;
DROP POLICY IF EXISTS lingora_avatar_insert ON storage.objects;
DROP POLICY IF EXISTS lingora_avatar_delete ON storage.objects;

CREATE POLICY lingora_avatar_select ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'lingora-avatars'
  AND (storage.foldername(name))[1] = 'profiles'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY lingora_avatar_insert ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'lingora-avatars'
  AND (storage.foldername(name))[1] = 'profiles'
  AND (storage.foldername(name))[2] = auth.uid()::text
  AND array_length(storage.foldername(name), 1) = 2
  AND metadata ->> 'mimetype' IN ('image/jpeg', 'image/png', 'image/webp')
  AND COALESCE((metadata ->> 'size')::bigint, 0) <= 5242880
);

CREATE POLICY lingora_avatar_delete ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id = 'lingora-avatars'
  AND (storage.foldername(name))[1] = 'profiles'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Existing vocabulary-audio policies remain on lingora-media. No UPDATE policy
-- is added, so replacement continues to require a new object name.
