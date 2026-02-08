-- Drop the existing authenticated-only policy
DROP POLICY "Allow read access for authenticated users" ON public.exchange_rates;

-- Create a new policy allowing read access for all users (including anonymous)
CREATE POLICY "Allow read access for all users"
    ON public.exchange_rates
    FOR SELECT
    TO public
    USING (true);

-- Grant SELECT to anon role as well
GRANT SELECT ON TABLE public.exchange_rates TO anon;
