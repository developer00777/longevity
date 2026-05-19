CREATE TABLE public.admin_users (
  uuid                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role                  TEXT NOT NULL CHECK (role IN ('admin','physician','staff')),
  linked_physician_uuid UUID REFERENCES public.physicians(uuid)
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_users_read_own" ON public.admin_users
  FOR SELECT USING (auth.uid() = uuid);
CREATE POLICY "admin_users_read_all_by_admin" ON public.admin_users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.admin_users au WHERE au.uuid = auth.uid() AND au.role = 'admin')
  );
