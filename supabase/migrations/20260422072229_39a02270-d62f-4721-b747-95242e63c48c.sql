-- Seed loyalty tiers (idempotent on slug)
INSERT INTO public.loyalty_tiers (slug, name, min_lifetime_spend, points_multiplier, discount_percentage, badge_color, badge_icon, sort_order)
VALUES
  ('bronze',   'Bronze',   0,       1.0, 0,  '#cd7f32', 'medal',   1),
  ('silver',   'Silver',   10000,   1.2, 2,  '#c0c0c0', 'award',   2),
  ('gold',     'Gold',     50000,   1.5, 5,  '#ffd700', 'trophy',  3),
  ('platinum', 'Platinum', 150000,  2.0, 8,  '#e5e4e2', 'crown',   4),
  ('diamond',  'Diamond',  500000,  3.0, 12, '#b9f2ff', 'gem',     5)
ON CONFLICT (slug) DO NOTHING;

-- Seed courier pricing (typical BD rates) — only insert if no rules yet
INSERT INTO public.courier_pricing_rules (provider, zone_type, weight_max, base_fee, per_kg_fee, hub_pickup_discount, sort_order)
SELECT * FROM (VALUES
  ('pathao',    'inside_city',  1.0::numeric, 70::numeric,  20::numeric, 30::numeric, 1),
  ('pathao',    'sub_city',     1.0::numeric, 100::numeric, 25::numeric, 30::numeric, 2),
  ('pathao',    'outside_city', 1.0::numeric, 130::numeric, 30::numeric, 40::numeric, 3),
  ('steadfast', 'inside_city',  1.0::numeric, 60::numeric,  15::numeric, 30::numeric, 1),
  ('steadfast', 'sub_city',     1.0::numeric, 90::numeric,  20::numeric, 30::numeric, 2),
  ('steadfast', 'outside_city', 1.0::numeric, 120::numeric, 25::numeric, 40::numeric, 3)
) AS v(provider, zone_type, weight_max, base_fee, per_kg_fee, hub_pickup_discount, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.courier_pricing_rules WHERE provider = v.provider AND zone_type = v.zone_type);

-- Enable extensions for cron-based shipment auto-sync
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;