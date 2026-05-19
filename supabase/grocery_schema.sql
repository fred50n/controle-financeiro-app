-- Tabela para salvar o recibo geral (cabeçalho)
create table grocery_receipts (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  store_name text not null,
  date date not null,
  total_amount numeric not null
);

-- Tabela para salvar cada item individual comprado
create table grocery_items (
  id uuid default gen_random_uuid() primary key,
  receipt_id uuid references grocery_receipts(id) on delete cascade not null,
  name text not null,
  price numeric not null,
  quantity numeric default 1 not null
);

-- Opcional: Ativar RLS (Row Level Security) e permitir acesso anônimo para o seu projeto atual
-- IMPORTANTE: Em um projeto com login, você ajustaria isso para permitir apenas usuários autenticados.
alter table grocery_receipts enable row level security;
alter table grocery_items enable row level security;

create policy "Permitir leitura anonima recibos" on grocery_receipts for select using (true);
create policy "Permitir insercao anonima recibos" on grocery_receipts for insert with check (true);
create policy "Permitir delecao anonima recibos" on grocery_receipts for delete using (true);

create policy "Permitir leitura anonima itens" on grocery_items for select using (true);
create policy "Permitir insercao anonima itens" on grocery_items for insert with check (true);
create policy "Permitir delecao anonima itens" on grocery_items for delete using (true);
