-- Update chatbot to use Claude model
UPDATE chatbot_settings 
SET setting_value = 'claude-sonnet-4-20250514',
    updated_at = NOW()
WHERE setting_key = 'model';

-- If the model setting doesn't exist, insert it
INSERT INTO chatbot_settings (setting_key, setting_value, description)
VALUES ('model', 'claude-sonnet-4-20250514', 'AI model for the chatbot')
ON CONFLICT (setting_key) DO UPDATE SET
  setting_value = 'claude-sonnet-4-20250514',
  updated_at = NOW();
