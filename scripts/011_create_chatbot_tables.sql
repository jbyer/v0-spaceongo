-- Create chatbot conversations table
CREATE TABLE IF NOT EXISTS chatbot_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create chatbot messages table
CREATE TABLE IF NOT EXISTS chatbot_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES chatbot_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create chatbot settings table
CREATE TABLE IF NOT EXISTS chatbot_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id)
);

-- Insert default settings
INSERT INTO chatbot_settings (setting_key, setting_value) 
VALUES 
  ('chatbot_enabled', 'true'),
  ('welcome_message', 'Hi! I''m SpaceBot, your AI assistant. How can I help you today?'),
  ('model', 'openai/gpt-4o-mini')
ON CONFLICT (setting_key) DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_user_id ON chatbot_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_session_id ON chatbot_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_messages_conversation_id ON chatbot_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_messages_created_at ON chatbot_messages(created_at);

-- Enable RLS
ALTER TABLE chatbot_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
CREATE POLICY "Users can view their own conversations" ON chatbot_conversations
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own conversations" ON chatbot_conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- RLS Policies for messages  
CREATE POLICY "Users can view messages in their conversations" ON chatbot_messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM chatbot_conversations 
      WHERE user_id = auth.uid() OR user_id IS NULL
    )
  );

CREATE POLICY "Users can insert messages in their conversations" ON chatbot_messages
  FOR INSERT WITH CHECK (
    conversation_id IN (
      SELECT id FROM chatbot_conversations 
      WHERE user_id = auth.uid() OR user_id IS NULL
    )
  );

-- RLS Policies for settings (admin only can update, everyone can read)
CREATE POLICY "Anyone can view chatbot settings" ON chatbot_settings
  FOR SELECT USING (true);

CREATE POLICY "Only superusers can update chatbot settings" ON chatbot_settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_superuser = true
    )
  );
