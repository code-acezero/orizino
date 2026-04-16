
-- Payment proofs table for MFS screenshot verification
CREATE TABLE public.payment_proofs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  payment_method TEXT NOT NULL,
  screenshot_url TEXT NOT NULL,
  transaction_id TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  customer_name TEXT,
  customer_phone TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  sheet_synced BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_proofs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all payment proofs"
ON public.payment_proofs FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can create payment proofs for own orders"
ON public.payment_proofs FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND EXISTS (
  SELECT 1 FROM orders WHERE orders.id = payment_proofs.order_id AND orders.user_id = auth.uid()
));

CREATE POLICY "Users can view own payment proofs"
ON public.payment_proofs FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Add COD toggle to shipping methods
ALTER TABLE public.shipping_methods ADD COLUMN IF NOT EXISTS cod_enabled BOOLEAN NOT NULL DEFAULT true;
