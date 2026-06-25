-- Hapus fungsi lama terlebih dahulu untuk menghindari bentrok tipe data
DROP FUNCTION IF EXISTS list_users_admin();
DROP FUNCTION IF EXISTS create_user_admin(text, text, text);
DROP FUNCTION IF EXISTS update_user_role_admin(uuid, text);
DROP FUNCTION IF EXISTS update_user_password_admin(uuid, text);
DROP FUNCTION IF EXISTS delete_user_admin(uuid);
DROP FUNCTION IF EXISTS get_approvers();

-- 1. Fungsi untuk mengambil daftar pengguna (Hanya untuk Super Admin)
CREATE OR REPLACE FUNCTION list_users_admin()
RETURNS TABLE (
  id UUID,
  email VARCHAR,
  raw_user_meta_data JSONB,
  created_at TIMESTAMPTZ
) 
SECURITY DEFINER
SET search_path = auth, public, extensions
LANGUAGE plpgsql
AS $$
BEGIN
  -- Proteksi keamanan: Hanya email salmon@pepenio.my.id yang boleh memanggil
  IF auth.jwt() ->> 'email' <> 'salmon@pepenio.my.id' THEN
    RAISE EXCEPTION 'Akses ditolak: Hanya Super Admin yang diizinkan.';
  END IF;

  RETURN QUERY 
  SELECT u.id, u.email, u.raw_user_meta_data, u.created_at 
  FROM auth.users u
  ORDER BY u.created_at DESC;
END;
$$;

-- 2. Fungsi untuk membuat pengguna baru langsung ke tabel Auth
CREATE OR REPLACE FUNCTION create_user_admin(
  user_email TEXT,
  user_password TEXT,
  user_role TEXT
)
RETURNS VOID
SECURITY DEFINER
SET search_path = auth, public, extensions
LANGUAGE plpgsql
AS $$
DECLARE
  new_user_id UUID;
  encrypted_pw TEXT;
BEGIN
  -- Proteksi keamanan
  IF auth.jwt() ->> 'email' <> 'salmon@pepenio.my.id' THEN
    RAISE EXCEPTION 'Akses ditolak: Hanya Super Admin yang diizinkan.';
  END IF;

  -- Enkripsi password menggunakan enkripsi bawaan Supabase
  encrypted_pw := crypt(user_password, gen_salt('bf'));

  -- Masukkan data ke tabel auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    user_email,
    encrypted_pw,
    now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    jsonb_build_object('role', user_role),
    now(),
    now(),
    '',
    '',
    '',
    ''
  ) RETURNING id INTO new_user_id;

  -- Buat identitas user agar bisa login menggunakan email & password
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    new_user_id,
    new_user_id,
    jsonb_build_object('sub', new_user_id, 'email', user_email),
    'email',
    new_user_id::text,
    now(),
    now(),
    now()
  );
END;
$$;

-- 3. Fungsi untuk memperbarui Role pengguna
CREATE OR REPLACE FUNCTION update_user_role_admin(
  target_user_id UUID,
  new_role TEXT
)
RETURNS VOID
SECURITY DEFINER
SET search_path = auth, public, extensions
LANGUAGE plpgsql
AS $$
BEGIN
  -- Proteksi keamanan
  IF auth.jwt() ->> 'email' <> 'salmon@pepenio.my.id' THEN
    RAISE EXCEPTION 'Akses ditolak: Hanya Super Admin yang diizinkan.';
  END IF;

  UPDATE auth.users
  SET raw_user_meta_data = jsonb_set(COALESCE(raw_user_meta_data, '{}'::jsonb), '{role}', to_jsonb(new_role))
  WHERE id = target_user_id;
END;
$$;

-- 4. Fungsi untuk mengganti Password pengguna
CREATE OR REPLACE FUNCTION update_user_password_admin(
  target_user_id UUID,
  new_password TEXT
)
RETURNS VOID
SECURITY DEFINER
SET search_path = auth, public, extensions
LANGUAGE plpgsql
AS $$
DECLARE
  encrypted_pw TEXT;
BEGIN
  -- Proteksi keamanan
  IF auth.jwt() ->> 'email' <> 'salmon@pepenio.my.id' THEN
    RAISE EXCEPTION 'Akses ditolak: Hanya Super Admin yang diizinkan.';
  END IF;

  encrypted_pw := crypt(new_password, gen_salt('bf'));

  UPDATE auth.users
  SET encrypted_password = encrypted_pw,
      updated_at = now()
  WHERE id = target_user_id;
END;
$$;

-- 5. Fungsi untuk menghapus pengguna secara permanen
CREATE OR REPLACE FUNCTION delete_user_admin(
  target_user_id UUID
)
RETURNS VOID
SECURITY DEFINER
SET search_path = auth, public, extensions
LANGUAGE plpgsql
AS $$
BEGIN
  -- Proteksi keamanan
  IF auth.jwt() ->> 'email' <> 'salmon@pepenio.my.id' THEN
    RAISE EXCEPTION 'Akses ditolak: Hanya Super Admin yang diizinkan.';
  END IF;

  -- Hapus identitas terlebih dahulu karena relasi foreign key
  DELETE FROM auth.identities WHERE user_id = target_user_id;
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;

-- 6. Fungsi publik/authenticated untuk mengambil daftar email & role approver secara aman
CREATE OR REPLACE FUNCTION get_approvers()
RETURNS TABLE (
  email VARCHAR,
  role TEXT
)
SECURITY DEFINER
SET search_path = auth, public, extensions
LANGUAGE plpgsql
AS $$
BEGIN
  -- Hanya izinkan pengguna yang sudah login (authenticated)
  IF auth.role() <> 'authenticated' THEN
    RAISE EXCEPTION 'Akses ditolak: Silakan login terlebih dahulu.';
  END IF;

  RETURN QUERY
  SELECT 
    u.email, 
    COALESCE(u.raw_user_meta_data->>'role', 'STAFF') as role
  FROM auth.users u
  WHERE u.raw_user_meta_data->>'role' IS NOT NULL;
END;
$$;

-- Berikan izin eksekusi ke pengguna yang terautentikasi
GRANT EXECUTE ON FUNCTION get_approvers() TO authenticated;