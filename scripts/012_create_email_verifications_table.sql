-- Create email_verifications table for custom verification flow
CREATE TABLE IF NOT EXISTS email_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_verifications_token ON email_verifications(token);
CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON email_verifications(email);

-- Enable RLS
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations (will be accessed via service role)
DROP POLICY IF EXISTS "email_verifications_policy" ON email_verifications;
CREATE POLICY "email_verifications_policy" ON email_verifications FOR ALL USING (true) WITH CHECK (true);
