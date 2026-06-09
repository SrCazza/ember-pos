-- Añadir campo email a profiles para mostrarlo en el KDS
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Backfill desde auth.users
UPDATE profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id;

-- Actualizar el trigger handle_new_user para que también guarde el email
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'waiter'),
    NEW.email
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
