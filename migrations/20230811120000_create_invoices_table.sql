create table invoices (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null default auth.uid(),
  invoice_number text not null,
  date date not null,
  due_date date not null,
  status text not null,
  total numeric not null,
  paid_amount numeric,
  client_id uuid references clients(id),
  company_id uuid references companies(id),
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);
