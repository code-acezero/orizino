-- CMS Pages for Terms, FAQ, About, etc.
CREATE TABLE public.cms_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  is_published boolean NOT NULL DEFAULT false,
  meta_title text,
  meta_description text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cms_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage CMS pages" ON public.cms_pages
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view published CMS pages" ON public.cms_pages
  FOR SELECT TO public
  USING (is_published = true);

-- Product import requests (Amazon/Flipkart)
CREATE TABLE public.product_import_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_url text NOT NULL,
  product_images text[] DEFAULT '{}',
  notes text,
  status text NOT NULL DEFAULT 'pending',
  conversation_id uuid REFERENCES public.support_conversations(id),
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.product_import_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own import requests" ON public.product_import_requests
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all import requests" ON public.product_import_requests
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

-- Seed default CMS pages
INSERT INTO public.cms_pages (slug, title, content, is_published) VALUES
  ('terms', 'Terms & Conditions', '# Terms & Conditions

Please update this page from the admin panel.', true),
  ('privacy', 'Privacy Policy', '# Privacy Policy

Please update this page from the admin panel.', true),
  ('faq', 'Frequently Asked Questions', '# FAQ

Please update this page from the admin panel.', true),
  ('about', 'About Us', '# About Us

Please update this page from the admin panel.', true),
  ('returns', 'Return Policy', '# Return Policy

Please update this page from the admin panel.', true),
  ('contact', 'Contact Us', '# Contact Us

Please update this page from the admin panel.', true);

-- Email subscriptions table
CREATE TABLE public.email_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can subscribe" ON public.email_subscriptions
  FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "Admins can manage subscriptions" ON public.email_subscriptions
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));