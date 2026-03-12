-- Create transactions table
CREATE TABLE public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_name TEXT NOT NULL,
  po_number TEXT NOT NULL,
  transaction_amount DECIMAL(10,2) NOT NULL,
  bm_percentage DECIMAL(5,2) NOT NULL,
  code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (REQUIRED for security)
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Create secure policies for each operation
CREATE POLICY "transactions_select_policy" ON public.transactions
FOR SELECT TO authenticated USING (true);

CREATE POLICY "transactions_insert_policy" ON public.transactions
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "transactions_update_policy" ON public.transactions
FOR UPDATE TO authenticated USING (true);

CREATE POLICY "transactions_delete_policy" ON public.transactions
FOR DELETE TO authenticated USING (true);