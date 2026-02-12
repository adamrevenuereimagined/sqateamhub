/*
  # Setup Authentication for Demo Users (Fixed)
  
  Creates demo authentication accounts and links them to the users table.
  
  ## Changes
  - Creates auth accounts for admin and rep users
  - Sets passwords to 'demo123' for all demo accounts
  - Links auth.users to public.users table properly
  
  ## Demo Accounts
  Admin:
  - adam@sqa.com / demo123
  
  Reps:
  - rocio@sqa.com / demo123
  - fred@sqa.com / demo123
  - jasona@sqa.com / demo123
  - jasonw@sqa.com / demo123
  - peter@sqa.com / demo123
*/

DO $$
DECLARE
  admin_user_id uuid;
  rocio_user_id uuid;
  fred_user_id uuid;
  jasona_user_id uuid;
  jasonw_user_id uuid;
  peter_user_id uuid;
BEGIN
  -- Get existing user IDs from public.users
  SELECT id INTO admin_user_id FROM users WHERE email = 'adam@sqa.com';
  SELECT id INTO rocio_user_id FROM users WHERE email = 'rocio@sqa.com';
  SELECT id INTO fred_user_id FROM users WHERE email = 'fred@sqa.com';
  SELECT id INTO jasona_user_id FROM users WHERE email = 'jasona@sqa.com';
  SELECT id INTO jasonw_user_id FROM users WHERE email = 'jasonw@sqa.com';
  SELECT id INTO peter_user_id FROM users WHERE email = 'peter@sqa.com';

  -- Create auth user for Adam (admin)
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    aud,
    role
  ) VALUES (
    admin_user_id,
    '00000000-0000-0000-0000-000000000000',
    'adam@sqa.com',
    crypt('demo123', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    'authenticated',
    'authenticated'
  ) ON CONFLICT (id) DO NOTHING;

  -- Create auth user for Rocio
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    aud,
    role
  ) VALUES (
    rocio_user_id,
    '00000000-0000-0000-0000-000000000000',
    'rocio@sqa.com',
    crypt('demo123', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    'authenticated',
    'authenticated'
  ) ON CONFLICT (id) DO NOTHING;

  -- Create auth user for Fred
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    aud,
    role
  ) VALUES (
    fred_user_id,
    '00000000-0000-0000-0000-000000000000',
    'fred@sqa.com',
    crypt('demo123', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    'authenticated',
    'authenticated'
  ) ON CONFLICT (id) DO NOTHING;

  -- Create auth user for Jason A.
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    aud,
    role
  ) VALUES (
    jasona_user_id,
    '00000000-0000-0000-0000-000000000000',
    'jasona@sqa.com',
    crypt('demo123', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    'authenticated',
    'authenticated'
  ) ON CONFLICT (id) DO NOTHING;

  -- Create auth user for Jason W.
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    aud,
    role
  ) VALUES (
    jasonw_user_id,
    '00000000-0000-0000-0000-000000000000',
    'jasonw@sqa.com',
    crypt('demo123', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    'authenticated',
    'authenticated'
  ) ON CONFLICT (id) DO NOTHING;

  -- Create auth user for Peter
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    aud,
    role
  ) VALUES (
    peter_user_id,
    '00000000-0000-0000-0000-000000000000',
    'peter@sqa.com',
    crypt('demo123', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    'authenticated',
    'authenticated'
  ) ON CONFLICT (id) DO NOTHING;

  -- Create identities for each user with provider_id
  INSERT INTO auth.identities (
    provider_id,
    user_id,
    identity_data,
    provider,
    created_at,
    updated_at
  ) VALUES
    (admin_user_id::text, admin_user_id, jsonb_build_object('sub', admin_user_id::text, 'email', 'adam@sqa.com'), 'email', now(), now()),
    (rocio_user_id::text, rocio_user_id, jsonb_build_object('sub', rocio_user_id::text, 'email', 'rocio@sqa.com'), 'email', now(), now()),
    (fred_user_id::text, fred_user_id, jsonb_build_object('sub', fred_user_id::text, 'email', 'fred@sqa.com'), 'email', now(), now()),
    (jasona_user_id::text, jasona_user_id, jsonb_build_object('sub', jasona_user_id::text, 'email', 'jasona@sqa.com'), 'email', now(), now()),
    (jasonw_user_id::text, jasonw_user_id, jsonb_build_object('sub', jasonw_user_id::text, 'email', 'jasonw@sqa.com'), 'email', now(), now()),
    (peter_user_id::text, peter_user_id, jsonb_build_object('sub', peter_user_id::text, 'email', 'peter@sqa.com'), 'email', now(), now())
  ON CONFLICT DO NOTHING;

END $$;
