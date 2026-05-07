ALTER TABLE public.call_logs REPLICA IDENTITY FULL;
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.call_logs;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;