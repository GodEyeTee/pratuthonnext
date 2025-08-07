/**
 * Environment Variables Validation and Configuration
 * Clean Architecture - Infrastructure Layer
 */

// Environment variable configuration interface
interface EnvConfig {
  // Node Environment
  NODE_ENV: 'development' | 'production' | 'test';

  // Supabase Configuration (Required)
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;

  // Sentry Configuration (Optional)
  SENTRY_DSN?: string;
  NEXT_PUBLIC_SENTRY_DSN?: string;

  // Application Configuration
  NEXT_PUBLIC_APP_NAME: string;
  NEXT_PUBLIC_APP_VERSION: string;
}

class EnvValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EnvValidationError';
  }
}

// Validation utilities
const validators = {
  required(value: string | undefined, name: string): string {
    if (!value || value.trim() === '') {
      throw new EnvValidationError(
        `Environment variable ${name} is required but not set`
      );
    }
    return value.trim();
  },

  url(value: string | undefined, name: string): string {
    if (!value) {
      throw new EnvValidationError(`Environment variable ${name} is required`);
    }
    try {
      new URL(value);
      return value;
    } catch {
      throw new EnvValidationError(
        `Environment variable ${name} must be a valid URL`
      );
    }
  },

  optionalUrl(value: string | undefined): string | undefined {
    if (!value) return undefined;
    try {
      new URL(value);
      return value;
    } catch {
      return undefined;
    }
  },

  supabaseUrl(value: string | undefined): string {
    const url = validators.required(value, 'NEXT_PUBLIC_SUPABASE_URL');
    if (!url.includes('supabase')) {
      throw new EnvValidationError(
        'NEXT_PUBLIC_SUPABASE_URL must be a Supabase URL'
      );
    }
    return url;
  },

  supabaseKey(value: string | undefined, name: string): string {
    const key = validators.required(value, name);
    if (key.length < 50) {
      throw new EnvValidationError(`${name} appears to be invalid (too short)`);
    }
    return key;
  },
};

// Parse and validate environment variables
function parseEnvConfig(): EnvConfig {
  try {
    const config: EnvConfig = {
      NODE_ENV:
        (process.env.NODE_ENV as EnvConfig['NODE_ENV']) || 'development',

      // Supabase - Required
      NEXT_PUBLIC_SUPABASE_URL: validators.supabaseUrl(
        process.env.NEXT_PUBLIC_SUPABASE_URL
      ),
      NEXT_PUBLIC_SUPABASE_ANON_KEY: validators.supabaseKey(
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        'NEXT_PUBLIC_SUPABASE_ANON_KEY'
      ),
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,

      // Sentry - Optional
      SENTRY_DSN: validators.optionalUrl(process.env.SENTRY_DSN),
      NEXT_PUBLIC_SENTRY_DSN: validators.optionalUrl(
        process.env.NEXT_PUBLIC_SENTRY_DSN
      ),

      // Application
      NEXT_PUBLIC_APP_NAME:
        process.env.NEXT_PUBLIC_APP_NAME || 'Room Rental System',
      NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    };

    // Production-specific validations
    if (config.NODE_ENV === 'production') {
      if (!config.SENTRY_DSN && !config.NEXT_PUBLIC_SENTRY_DSN) {
        console.warn('⚠️ No Sentry DSN configured - error monitoring disabled');
      }
    }

    return config;
  } catch (error) {
    console.error('❌ Environment validation failed:');
    if (error instanceof EnvValidationError) {
      console.error(error.message);
    }

    if (process.env.NODE_ENV === 'development') {
      console.error(`
📝 Required environment variables:
- NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
- NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

📝 Optional variables:
- SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
- SENTRY_DSN=your-sentry-dsn
- NEXT_PUBLIC_SENTRY_DSN=your-public-sentry-dsn
      `);
    }

    process.exit(1);
  }
}

// Export validated environment
export const env = parseEnvConfig();

// Helper functions
export const isDevelopment = () => env.NODE_ENV === 'development';
export const isProduction = () => env.NODE_ENV === 'production';
export const isTest = () => env.NODE_ENV === 'test';

// Configuration getters
export const getSupabaseConfig = () => ({
  url: env.NEXT_PUBLIC_SUPABASE_URL,
  anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
});

export const getSentryConfig = () => {
  const dsn = env.SENTRY_DSN || env.NEXT_PUBLIC_SENTRY_DSN;
  return dsn ? { dsn, enabled: true } : { enabled: false };
};

export const getAppConfig = () => ({
  name: env.NEXT_PUBLIC_APP_NAME,
  version: env.NEXT_PUBLIC_APP_VERSION,
  environment: env.NODE_ENV,
});

// Development helpers
if (isDevelopment()) {
  console.log('🔧 Environment Configuration:');
  console.log(`  NODE_ENV: ${env.NODE_ENV}`);
  console.log(
    `  App: ${env.NEXT_PUBLIC_APP_NAME} v${env.NEXT_PUBLIC_APP_VERSION}`
  );
  console.log(`  Supabase: ${env.NEXT_PUBLIC_SUPABASE_URL}`);
  console.log(
    `  Sentry: ${getSentryConfig().enabled ? 'Enabled' : 'Disabled'}`
  );
}
