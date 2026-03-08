-- One-time: promote codeacezero@gmail.com to admin
DO $$
DECLARE
  target_uid uuid;
BEGIN
  SELECT id INTO target_uid FROM auth.users WHERE email = 'codeacezero@gmail.com';
  IF target_uid IS NOT NULL THEN
    UPDATE public.user_roles SET role = 'admin' WHERE user_id = target_uid;
    IF NOT FOUND THEN
      INSERT INTO public.user_roles (user_id, role) VALUES (target_uid, 'admin');
    END IF;
  END IF;
END $$;