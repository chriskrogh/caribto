CREATE TABLE IF NOT EXISTS "public"."waitlist" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "created_at" timestamptz DEFAULT now() NOT NULL,
    "email" text NOT NULL,
    CONSTRAINT "waitlist_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "waitlist_email_key" UNIQUE ("email")
);

ALTER TABLE "public"."waitlist" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous inserts" ON "public"."waitlist"
    FOR INSERT TO anon WITH CHECK (true);
