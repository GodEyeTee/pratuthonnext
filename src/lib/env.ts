/**
 * Environment Variables Validation
 * ตรวจสอบและ validate environment variables ที่จำเป็น
 */

interface EnvConfig {
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  SENTRY_DSN?: string;
  NEXT_PUBLIC_SENTRY_DSN?: string;
  NEXTAUTH_URL?: string;
  NEXTAUTH_SECRET?: string;
}

class EnvironmentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EnvironmentError';
  }
}

function validateRequired(value: string | undefined, name: string): string {
  if (!value || value.trim() === '') {
    throw new EnvironmentError(
      `Missing required environment variable: ${name}`
    );
  }
  return value.trim();
}

function validateUrl(value: string, name: string): string {
  try {
    new URL(value);
    return value;
  } catch {
    throw new EnvironmentError(`Invalid URL format for ${name}: ${value}`);
  }
}

function validateSupabaseUrl(url: string): string {
  const validatedUrl = validateUrl(url, 'NEXT_PUBLIC_SUPABASE_URL');
  if (!validatedUrl.includes('supabase')) {
    throw new EnvironmentError(
      'NEXT_PUBLIC_SUPABASE_URL must be a Supabase URL'
    );
  }
  return validatedUrl;
}

function validateSupabaseKey(key: string, name: string): string {
  const validatedKey = validateRequired(key, name);
  // Supabase keys should be long alphanumeric strings
  if (validatedKey.length < 50) {
    throw new EnvironmentError(`${name} appears to be invalid (too short)`);
  }
  return validatedKey;
}

// ✅ Export validated environment config
export const env: EnvConfig = {
  // ✅ Required Supabase variables
  NEXT_PUBLIC_SUPABASE_URL: validateSupabaseUrl(
    process.env.NEXT_PUBLIC_SUPABASE_URL!
  ),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: validateSupabaseKey(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ),

  // ✅ Optional variables
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  SENTRY_DSN: process.env.SENTRY_DSN,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
};

// ✅ Runtime environment checks
export function validateEnvironment() {
  try {
    // Check required variables
    validateRequired(env.NEXT_PUBLIC_SUPABASE_URL, 'NEXT_PUBLIC_SUPABASE_URL');
    validateRequired(
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      'NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );

    // Validate production requirements
    if (process.env.NODE_ENV === 'production') {
      if (!env.SENTRY_DSN) {
        console.warn(
          '⚠️  SENTRY_DSN not set - error monitoring disabled in production'
        );
      }
      if (!env.NEXTAUTH_SECRET) {
        console.warn('⚠️  NEXTAUTH_SECRET not set - using default (insecure)');
      }
    }

    console.log('✅ Environment validation passed');
    return true;
  } catch (error) {
    if (error instanceof EnvironmentError) {
      console.error('❌ Environment validation failed:', error.message);
      console.error(
        'Please check your .env.local file and ensure all required variables are set'
      );

      // In development, show helpful instructions
      if (process.env.NODE_ENV === 'development') {
        console.error(`
📝 Required environment variables:
- NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
- NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

📝 Optional but recommended:
- SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
- SENTRY_DSN=your-sentry-dsn
- NEXT_PUBLIC_SENTRY_DSN=your-public-sentry-dsn
- NEXTAUTH_URL=http://localhost:3000
- NEXTAUTH_SECRET=your-secret-here
        `);
      }

      process.exit(1);
    }
    throw error;
  }
}

// ✅ Utility functions
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';
export const isServer = typeof window === 'undefined';
export const isClient = typeof window !== 'undefined';
