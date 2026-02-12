/*
  # Create Demo Users Function
  
  Creates a function to easily create demo users for testing.
  This uses Supabase's built-in auth system properly.
*/

-- Create function to create demo users
CREATE OR REPLACE FUNCTION create_demo_user(
  user_email text,
  user_password text,
  user_name text,
  user_role text,
  user_quota numeric
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Generate a UUID for the user
  new_user_id := gen_random_uuid();
  
  -- Insert into auth.users
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
    role,
    confirmation_token
  ) VALUES (
    new_user_id,
    '00000000-0000-0000-0000-000000000000',
    user_email,
    crypt(user_password, gen_salt('bf')),
    now(),
    now(),
    now(),
    jsonb_build_object('provider', 'email', 'providers', array['email']),
    jsonb_build_object('name', user_name, 'role', user_role, 'quarterly_quota', user_quota),
    'authenticated',
    'authenticated',
    ''
  );
  
  -- Insert into auth.identities
  INSERT INTO auth.identities (
    provider_id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    new_user_id::text,
    new_user_id,
    jsonb_build_object('sub', new_user_id::text, 'email', user_email),
    'email',
    now(),
    now(),
    now()
  );
  
  RETURN new_user_id;
END;
$$;

-- Now create all demo users
DO $$
BEGIN
  -- Create admin user
  PERFORM create_demo_user(
    'adam@sqa.com',
    'demo123',
    'Adam',
    'admin',
    0
  );
  
  -- Create rep users
  PERFORM create_demo_user(
    'rocio@sqa.com',
    'demo123',
    'Rocio',
    'rep',
    70000
  );
  
  PERFORM create_demo_user(
    'fred@sqa.com',
    'demo123',
    'Fred',
    'rep',
    70000
  );
  
  PERFORM create_demo_user(
    'jasona@sqa.com',
    'demo123',
    'Jason A.',
    'rep',
    70000
  );
  
  PERFORM create_demo_user(
    'jasonw@sqa.com',
    'demo123',
    'Jason W.',
    'rep',
    70000
  );
  
  PERFORM create_demo_user(
    'peter@sqa.com',
    'demo123',
    'Peter',
    'rep',
    70000
  );
  
  RAISE NOTICE 'Demo users created successfully!';
EXCEPTION
  WHEN unique_violation THEN
    RAISE NOTICE 'Some users already exist, skipping...';
END $$;
