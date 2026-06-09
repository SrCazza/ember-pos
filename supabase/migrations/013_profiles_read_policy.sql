-- Permitir a todos los usuarios autenticados leer perfiles
-- Necesario para que kitchen pueda ver el nombre/email del camarero en las tarjetas
DROP POLICY IF EXISTS "profiles_read_own" ON profiles;

CREATE POLICY "profiles_read_authenticated" ON profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);
