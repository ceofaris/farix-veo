ALTER TABLE public.user_tools
  ADD CONSTRAINT user_tools_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;