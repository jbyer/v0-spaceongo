-- Create email_verifications table for Resend integration
-- This table stores verification tokens sent via Resend.com

CREATE TABLE IF NOT EXISTS email_verifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one active verification per user
  CONSTRAINT unique_user_verification UNIQUE (user_id)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_verifications_token ON email_verifications(token);
CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON email_verifications(email);
CREATE INDEX IF NOT EXISTS idx_email_verifications_user_id ON email_verifications(user_id);

-- Enable RLS
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can do everything (for API routes)
CREATE POLICY "Service role has full access to email_verifications"
  ON email_verifications
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Users can only view their own verification records
CREATE POLICY "Users can view own verification records"
  ON email_verifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_email_verifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_email_verifications_updated_at
  BEFORE UPDATE ON email_verifications
  FOR EACH ROW
  EXECUTE FUNCTION update_email_verifications_updated_at();

-- Add comment for documentation
COMMENT ON TABLE email_verifications IS 'Stores email verification tokens for Resend.com integration';
