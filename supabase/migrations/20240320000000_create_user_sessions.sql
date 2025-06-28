-- Create user_sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  device_info JSONB NOT NULL,
  ip_address TEXT NOT NULL,
  location JSONB,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  actions_count INTEGER NOT NULL DEFAULT 0
);

-- Add RLS policies
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view their own sessions
CREATE POLICY "Users can view their own sessions"
  ON user_sessions FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to create their own sessions
CREATE POLICY "Users can create their own sessions"
  ON user_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own sessions
CREATE POLICY "Users can update their own sessions"
  ON user_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Allow admins to view all sessions
CREATE POLICY "Admins can view all sessions"
  ON user_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Allow admins to manage all sessions
CREATE POLICY "Admins can manage all sessions"
  ON user_sessions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create index for faster queries
CREATE INDEX user_sessions_user_id_idx ON user_sessions(user_id);
CREATE INDEX user_sessions_profile_id_idx ON user_sessions(profile_id);
CREATE INDEX user_sessions_is_active_idx ON user_sessions(is_active);
CREATE INDEX user_sessions_last_active_idx ON user_sessions(last_active);

-- Function to update last_active timestamp
CREATE OR REPLACE FUNCTION update_session_last_active()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_active = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update last_active on any update
CREATE TRIGGER session_last_active_trigger
  BEFORE UPDATE ON user_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_session_last_active();

-- Create function to create a new session
CREATE OR REPLACE FUNCTION create_user_session(
  p_user_id UUID,
  p_profile_id UUID,
  p_device_info JSONB,
  p_ip_address TEXT,
  p_location JSONB
)
RETURNS UUID AS $$
DECLARE
  v_session_id UUID;
BEGIN
  -- First, mark any existing active sessions for this user as inactive
  UPDATE user_sessions
  SET is_active = FALSE
  WHERE profile_id = p_profile_id AND is_active = TRUE;
  
  -- Create new session
  INSERT INTO user_sessions (
    user_id,
    profile_id,
    device_info,
    ip_address,
    location
  ) VALUES (
    p_user_id,
    p_profile_id,
    p_device_info,
    p_ip_address,
    p_location
  ) RETURNING id INTO v_session_id;
  
  RETURN v_session_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to increment action count
CREATE OR REPLACE FUNCTION increment_session_action_count(p_session_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE user_sessions
  SET actions_count = actions_count + 1,
      last_active = NOW()
  WHERE id = p_session_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to end session
CREATE OR REPLACE FUNCTION end_user_session(p_session_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE user_sessions
  SET is_active = FALSE
  WHERE id = p_session_id;
END;
$$ LANGUAGE plpgsql; 