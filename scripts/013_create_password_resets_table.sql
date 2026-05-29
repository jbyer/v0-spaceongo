-- Create password_resets table for storing password reset tokens
CREATE TABLE IF NOT EXISTS password_resets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_user_reset UNIQUE (user_id)
);

-- Create index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(token);
CREATE INDEX IF NOT EXISTS idx_password_resets_email ON password_resets(email);

-- Enable RLS
ALTER TABLE password_resets ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role can manage password resets"
  ON password_resets
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Clean up expired tokens (can be run periodically)
-- DELETE FROM password_resets WHERE expires_at < NOW() OR used = true;
