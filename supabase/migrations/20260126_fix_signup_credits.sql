-- Fix: Give new users their signup bonus credits
-- The SIGNUP_BONUS_CREDITS constant is 5

-- Update the handle_new_user function to include credit_balance
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, credit_balance)
    VALUES (NEW.id, NEW.email, 5);

    -- Also create a credit transaction record for the signup bonus
    INSERT INTO public.credit_transactions (user_id, type, amount, balance_after, description)
    VALUES (NEW.id, 'signup', 5, 5, 'Signup bonus credits');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also set default value on the column for safety
ALTER TABLE public.profiles
ALTER COLUMN credit_balance SET DEFAULT 5;

-- Fix existing users who have 0 or NULL credits and never made a comparison
-- (only fix users who signed up but never got their credits)
UPDATE public.profiles
SET credit_balance = 5
WHERE credit_balance IS NULL OR credit_balance = 0
AND comparisons_used = 0
AND id NOT IN (
    SELECT DISTINCT user_id FROM public.credit_transactions
);
