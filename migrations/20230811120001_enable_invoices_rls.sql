alter table invoices enable row level security;

create policy "Users can manage their own invoices"
on invoices
as permissive
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
