
CREATE TABLE public.call_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.support_conversations(id) ON DELETE SET NULL,
  caller_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'initiated',
  duration_seconds integer DEFAULT 0,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  ended_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all call logs"
ON public.call_logs FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own call logs"
ON public.call_logs FOR SELECT TO authenticated
USING (receiver_id = auth.uid() OR caller_id = auth.uid());

CREATE POLICY "Authenticated can insert call logs"
ON public.call_logs FOR INSERT TO authenticated
WITH CHECK (caller_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Admins or callers can update call logs"
ON public.call_logs FOR UPDATE TO authenticated
USING (caller_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (caller_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));
