ALTER TABLE public.invoices
ADD COLUMN created_by_profile_id uuid
REFERENCES public.profiles(id);
