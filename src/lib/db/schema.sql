-- =============================================================================
-- RBAC Database Schema for Supabase
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- 1. Add role column to auth.users table
-- =============================================================================

-- Add role column to existing auth.users table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'auth' 
        AND table_name = 'users' 
        AND column_name = 'role'
    ) THEN
        ALTER TABLE auth.users 
        ADD COLUMN role text DEFAULT 'user' CHECK (role IN ('admin', 'support', 'user'));
    END IF;
END $$;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_users_role ON auth.users(role);

-- =============================================================================
-- 2. Create audit_logs table for tracking role changes
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    action text NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    performed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    details jsonb DEFAULT '{}',
    ip_address inet,
    user_agent text,
    timestamp timestamptz DEFAULT now(),
    
    -- Add indexes
    CONSTRAINT audit_logs_action_check CHECK (action IN (
        'role_changed', 'user_created', 'user_deleted', 
        'login', 'logout', 'profile_updated', 'password_changed'
    ))
);

-- Indexes for audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_performed_by ON public.audit_logs(performed_by);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp);

-- =============================================================================
-- 3. Create user_profiles table for extended user information
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.user_profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name text,
    avatar_url text,
    bio text,
    phone text,
    timezone text DEFAULT 'Asia/Bangkok',
    locale text DEFAULT 'th' CHECK (locale IN ('th', 'en')),
    theme text DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
    email_notifications boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Indexes for user_profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_display_name ON public.user_profiles(display_name);

-- =============================================================================
-- 4. Create role_change_requests table for role approval workflow
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.role_change_requests (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    current_role text NOT NULL,
    requested_role text NOT NULL CHECK (requested_role IN ('admin', 'support', 'user')),
    reason text,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
    requested_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    review_notes text,
    created_at timestamptz DEFAULT now(),
    reviewed_at timestamptz
);

-- Indexes for role_change_requests
CREATE INDEX IF NOT EXISTS idx_role_change_requests_user_id ON public.role_change_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_role_change_requests_status ON public.role_change_requests(status);
CREATE INDEX IF NOT EXISTS idx_role_change_requests_requested_by ON public.role_change_requests(requested_by);

-- =============================================================================
-- 5. Create user_sessions table for session tracking
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.user_sessions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id text NOT NULL,
    ip_address inet,
    user_agent text,
    country text,
    city text,
    device_type text,
    browser text,
    os text,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    last_activity_at timestamptz DEFAULT now(),
    expires_at timestamptz
);

-- Indexes for user_sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON public.user_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON public.user_sessions(is_active);

-- =============================================================================
-- 6. Functions and Triggers
-- =============================================================================

-- Function to automatically create user profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    -- Set default role if not specified
    IF NEW.role IS NULL OR NEW.role = '' THEN
        NEW.role = 'user';
    END IF;

    -- Create user profile
    INSERT INTO public.user_profiles (id, display_name, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.raw_user_meta_data->>'avatar_url'
    );

    -- Create audit log
    INSERT INTO public.audit_logs (action, user_id, performed_by, details)
    VALUES (
        'user_created',
        NEW.id,
        NEW.id,
        jsonb_build_object(
            'email', NEW.email,
            'role', NEW.role,
            'provider', NEW.raw_app_meta_data->>'provider'
        )
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    BEFORE INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Function to update user_profiles.updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updating updated_at
DROP TRIGGER IF EXISTS handle_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER handle_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Function to log role changes
CREATE OR REPLACE FUNCTION public.log_role_change()
RETURNS trigger AS $$
BEGIN
    IF OLD.role IS DISTINCT FROM NEW.role THEN
        INSERT INTO public.audit_logs (action, user_id, details)
        VALUES (
            'role_changed',
            NEW.id,
            jsonb_build_object(
                'old_role', OLD.role,
                'new_role', NEW.role,
                'changed_at', now()
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for role changes
DROP TRIGGER IF EXISTS on_user_role_changed ON auth.users;
CREATE TRIGGER on_user_role_changed
    AFTER UPDATE OF role ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.log_role_change();

-- =============================================================================
-- 7. Row Level Security (RLS) Policies
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Policies for user_profiles
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Policies for audit_logs
CREATE POLICY "Admins can view all audit logs" ON public.audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Users can view own audit logs" ON public.audit_logs
    FOR SELECT USING (auth.uid() = user_id);

-- Policies for role_change_requests
CREATE POLICY "Users can view own role change requests" ON public.role_change_requests
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() = requested_by);

CREATE POLICY "Users can create role change requests" ON public.role_change_requests
    FOR INSERT WITH CHECK (auth.uid() = requested_by);

CREATE POLICY "Admins can view all role change requests" ON public.role_change_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Policies for user_sessions
CREATE POLICY "Users can view own sessions" ON public.user_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all sessions" ON public.user_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =============================================================================
-- 8. Helper Functions
-- =============================================================================

-- Function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text AS $$
BEGIN
    RETURN (
        SELECT role 
        FROM auth.users 
        WHERE id = user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has permission
CREATE OR REPLACE FUNCTION public.user_has_role(user_id uuid, required_role text)
RETURNS boolean AS $$
DECLARE
    user_role text;
    role_hierarchy jsonb := '{
        "user": 1,
        "support": 2,
        "admin": 3
    }';
BEGIN
    SELECT role INTO user_role FROM auth.users WHERE id = user_id;
    
    IF user_role IS NULL THEN
        RETURN false;
    END IF;
    
    RETURN (role_hierarchy->>user_role)::int >= (role_hierarchy->>required_role)::int;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to safely change user role (with audit trail)
CREATE OR REPLACE FUNCTION public.change_user_role(
    target_user_id uuid,
    new_role text,
    performed_by_id uuid,
    reason text DEFAULT NULL
)
RETURNS boolean AS $$
DECLARE
    old_role text;
    performer_role text;
BEGIN
    -- Check if performer has admin role
    SELECT role INTO performer_role FROM auth.users WHERE id = performed_by_id;
    IF performer_role != 'admin' THEN
        RAISE EXCEPTION 'Only admins can change user roles';
    END IF;

    -- Validate new role
    IF new_role NOT IN ('admin', 'support', 'user') THEN
        RAISE EXCEPTION 'Invalid role: %', new_role;
    END IF;

    -- Get current role
    SELECT role INTO old_role FROM auth.users WHERE id = target_user_id;
    IF old_role IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    -- Update role
    UPDATE auth.users SET role = new_role WHERE id = target_user_id;

    -- Log the change
    INSERT INTO public.audit_logs (action, user_id, performed_by, details)
    VALUES (
        'role_changed',
        target_user_id,
        performed_by_id,
        jsonb_build_object(
            'old_role', old_role,
            'new_role', new_role,
            'reason', reason
        )
    );

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 9. Initial Data
-- =============================================================================

-- Create admin user policy (this should be run after creating your first admin user)
-- Replace 'your-admin-email@example.com' with your actual admin email
/*
UPDATE auth.users 
SET role = 'admin' 
WHERE email = 'your-admin-email@example.com';
*/

-- =============================================================================
-- 10. Views for easier querying
-- =============================================================================

-- View for user details with profile information
CREATE OR REPLACE VIEW public.user_details AS
SELECT 
    u.id,
    u.email,
    u.role,
    u.email_confirmed_at,
    u.last_sign_in_at,
    u.created_at as user_created_at,
    p.display_name,
    p.avatar_url,
    p.bio,
    p.phone,
    p.timezone,
    p.locale,
    p.theme,
    p.email_notifications,
    p.updated_at as profile_updated_at
FROM auth.users u
LEFT JOIN public.user_profiles p ON u.id = p.id;

-- View for recent audit logs with user details
CREATE OR REPLACE VIEW public.recent_audit_logs AS
SELECT 
    al.id,
    al.action,
    al.details,
    al.timestamp,
    al.ip_address,
    u1.email as user_email,
    u1.role as user_role,
    u2.email as performed_by_email,
    u2.role as performed_by_role
FROM public.audit_logs al
LEFT JOIN auth.users u1 ON al.user_id = u1.id
LEFT JOIN auth.users u2 ON al.performed_by = u2.id
ORDER BY al.timestamp DESC;

-- =============================================================================
-- END OF SCHEMA
-- =============================================================================