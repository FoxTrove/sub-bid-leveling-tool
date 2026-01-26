-- Add column to track when signin reminder email was sent
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS signin_reminder_sent_at TIMESTAMPTZ;

-- Add index for efficient querying of users who need reminders
CREATE INDEX IF NOT EXISTS idx_profiles_signin_reminder
ON public.profiles (created_at, signin_reminder_sent_at)
WHERE full_name IS NULL;
