-- Create exchange_rates table
CREATE TABLE public.exchange_rates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    source text DEFAULT 'USD' NOT NULL,
    target text DEFAULT '' NOT NULL,
    rate double precision NOT NULL,
    CONSTRAINT exchange_rates_pkey PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

-- Read access for all authenticated users
CREATE POLICY "Allow read access for authenticated users"
    ON public.exchange_rates
    FOR SELECT
    TO authenticated
    USING (true);

-- Grant minimal necessary permissions
GRANT SELECT ON TABLE public.exchange_rates TO authenticated;
GRANT ALL ON TABLE public.exchange_rates TO service_role;
