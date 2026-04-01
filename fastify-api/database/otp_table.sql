-- Create OTP verifications table
CREATE TABLE IF NOT EXISTS otp_verifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    otp VARCHAR(6) NOT NULL,
    user_data JSONB DEFAULT '{}'::jsonb,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    attempts INTEGER DEFAULT 0,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_otp_email ON otp_verifications(email);

-- Create index on expires_at for cleanup queries
CREATE INDEX IF NOT EXISTS idx_otp_expires ON otp_verifications(expires_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_otp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_otp_updated_at
    BEFORE UPDATE ON otp_verifications
    FOR EACH ROW
    EXECUTE FUNCTION update_otp_updated_at();

-- Enable RLS
ALTER TABLE otp_verifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies (service role only for security)
CREATE POLICY "Service role can manage OTP records"
    ON otp_verifications
    FOR ALL
    USING (auth.role() = 'service_role');

COMMENT ON TABLE otp_verifications IS 'Stores OTP codes for email verification during registration';
COMMENT ON COLUMN otp_verifications.email IS 'User email address (unique)';
COMMENT ON COLUMN otp_verifications.otp IS '6-digit OTP code';
COMMENT ON COLUMN otp_verifications.user_data IS 'Temporary storage for user registration data';
COMMENT ON COLUMN otp_verifications.expires_at IS 'OTP expiration timestamp';
COMMENT ON COLUMN otp_verifications.attempts IS 'Number of verification attempts';
COMMENT ON COLUMN otp_verifications.verified IS 'Whether OTP has been verified';
