
-- 1) Add recording columns to call_logs
ALTER TABLE public.call_logs
  ADD COLUMN IF NOT EXISTS recording_user_url text,
  ADD COLUMN IF NOT EXISTS recording_admin_url text,
  ADD COLUMN IF NOT EXISTS drive_file_id text,
  ADD COLUMN IF NOT EXISTS drive_synced_at timestamptz;

-- 2) Create private bucket for recordings
INSERT INTO storage.buckets (id, name, public)
VALUES ('call-recordings', 'call-recordings', false)
ON CONFLICT (id) DO NOTHING;

-- 3) RLS policies on storage.objects scoped to this bucket
-- Path convention: {user_id}/{call_log_id}_{role}.webm
DROP POLICY IF EXISTS "Users upload own call recordings" ON storage.objects;
CREATE POLICY "Users upload own call recordings"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'call-recordings'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users read own call recordings" ON storage.objects;
CREATE POLICY "Users read own call recordings"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'call-recordings'
  AND ((storage.foldername(name))[1] = auth.uid()::text
       OR public.has_role(auth.uid(), 'admin'::public.app_role))
);

DROP POLICY IF EXISTS "Admins manage all call recordings" ON storage.objects;
CREATE POLICY "Admins manage all call recordings"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'call-recordings' AND public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (bucket_id = 'call-recordings' AND public.has_role(auth.uid(), 'admin'::public.app_role));
