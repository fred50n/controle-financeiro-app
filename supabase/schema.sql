-- Create the expenses table
CREATE TABLE public.expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    due_date DATE NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('unica', 'fixa', 'parcelada')),
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'paga'))
);

-- Note: In a real app with multiple users, we would enable RLS and add a user_id column.
-- For this personal app, we can either keep RLS disabled or require an anon key to access.
-- ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
