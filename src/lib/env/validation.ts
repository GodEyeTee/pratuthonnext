/**
 * Environment Variables Validation and Type Safety
 * Simple validation without external dependencies
 */

/**
 * Environment Variables Validation and Type Safety
 * Simple validation without external dependencies
 */

// Environment variable configuration
interface EnvConfig {
  // Node Environment
  NODE_ENV: 'development' | 'production' | 'test';

  // Next.js Configuration
  NEXTAUTH_URL?: string;
  NEXTAUTH_SECRET?: string;

  // Supabase Configuration (Required)
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;

  // Sentry Configuration (Optional)
  SENTRY_DSN?: string;
  NEXT_PUBLIC_SENTRY_DSN?: string;
  SENTRY_ORG?: string;
  SENTRY_PROJECT?: string;
  SENTRY_AUTH_TOKEN?: string;

  // Database Configuration (Optional)
  DATABASE_URL?: string;

  // External Services (Optional)
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;

  // Analytics (Optional)
  NEXT_PUBLIC_GA_MEASUREMENT_ID?: string;

  // Feature Flags (Optional)
  NEXT_PUBLIC_ENABLE_ANALYTICS: boolean;
  NEXT_PUBLIC_ENABLE_SENTRY: boolean;
  NEXT_PUBLIC_ENABLE_DEV_TOOLS: boolean;

  // Application Configuration
  NEXT_PUBLIC_APP_NAME: string;
  NEXT_PUBLIC_APP_VERSION: string;
  NEXT_PUBLIC_API_BASE_URL?: string;

  // Security Configuration
  ENCRYPTION_KEY?: string;
  JWT_SECRET?: string;

  // Rate Limiting
  RATE_LIMIT_MAX: number;
  RATE_LIMIT_WINDOW_MS: number;

  // Email Configuration (Optional)
  SMTP_HOST?: string;
  SMTP_PORT?: number;
  SMTP_USER?: string;
  SMTP_PASSWORD?: string;
  SMTP_FROM?: string;
}

// Validation functions
function validateRequired(value: string | undefined, name: string): string {
  if (!value || value.trim() === '') {
    throw new Error(`Environment variable ${name} is required but not set`);
  }
  return value.trim();
}

function validateUrl(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`Environment variable ${name} is required`);
  }

  try {
    new URL(value);
    return value;
  } catch {
    throw new Error(`Environment variable ${name} must be a valid URL`);
  }
}

function validateOptionalUrl(
  value: string | undefined,
  name: string
): string | undefined {
  if (!value) return undefined;

  try {
    new URL(value);
    return value;
  } catch {
    throw new Error(`Environment variable ${name} must be a valid URL`);
  }
}

function parseBoolean(
  value: string | undefined,
  defaultValue: boolean = false
): boolean {
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true';
}

function parseNumber(value: string | undefined, defaultValue: number): number {
  if (!value) return defaultValue;
  const num = parseInt(value, 10);
  if (isNaN(num)) return defaultValue;
  return num;
}

// Parse and validate environment variables
function validateEnv(): EnvConfig {
  const errors: string[] = [];

  try {
    // Required variables
    const supabaseUrl = validateUrl(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      'NEXT_PUBLIC_SUPABASE_URL'
    );
    const supabaseAnonKey = validateRequired(
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      'NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );

    // Validate Supabase URL contains 'supabase'
    if (!supabaseUrl.includes('supabase')) {
      errors.push('NEXT_PUBLIC_SUPABASE_URL must be a Supabase URL');
    }

    // Validate anon key length
    if (supabaseAnonKey.length < 50) {
      errors.push(
        'NEXT_PUBLIC_SUPABASE_ANON_KEY appears to be invalid (too short)'
      );
    }

    const config: EnvConfig = {
      // Node Environment
      NODE_ENV: (process.env.NODE_ENV as any) || 'development',

      // Next.js Configuration
      NEXTAUTH_URL: validateOptionalUrl(
        process.env.NEXTAUTH_URL,
        'NEXTAUTH_URL'
      ),
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,

      // Supabase Configuration
      NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,

      // Sentry Configuration
      SENTRY_DSN: validateOptionalUrl(process.env.SENTRY_DSN, 'SENTRY_DSN'),
      NEXT_PUBLIC_SENTRY_DSN: validateOptionalUrl(
        process.env.NEXT_PUBLIC_SENTRY_DSN,
        'NEXT_PUBLIC_SENTRY_DSN'
      ),
      SENTRY_ORG: process.env.SENTRY_ORG,
      SENTRY_PROJECT: process.env.SENTRY_PROJECT,
      SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,

      // Database Configuration
      DATABASE_URL: validateOptionalUrl(
        process.env.DATABASE_URL,
        'DATABASE_URL'
      ),

      // External Services
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,

      // Analytics
      NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,

      // Feature Flags
      NEXT_PUBLIC_ENABLE_ANALYTICS: parseBoolean(
        process.env.NEXT_PUBLIC_ENABLE_ANALYTICS,
        false
      ),
      NEXT_PUBLIC_ENABLE_SENTRY: parseBoolean(
        process.env.NEXT_PUBLIC_ENABLE_SENTRY,
        false
      ),
      NEXT_PUBLIC_ENABLE_DEV_TOOLS: parseBoolean(
        process.env.NEXT_PUBLIC_ENABLE_DEV_TOOLS,
        false
      ),

      // Application Configuration
      NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'RBAC System',
      NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      NEXT_PUBLIC_API_BASE_URL: validateOptionalUrl(
        process.env.NEXT_PUBLIC_API_BASE_URL,
        'NEXT_PUBLIC_API_BASE_URL'
      ),

      // Security Configuration
      ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
      JWT_SECRET: process.env.JWT_SECRET,

      // Rate Limiting
      RATE_LIMIT_MAX: parseNumber(process.env.RATE_LIMIT_MAX, 100),
      RATE_LIMIT_WINDOW_MS: parseNumber(
        process.env.RATE_LIMIT_WINDOW_MS,
        900000
      ), // 15 minutes

      // Email Configuration
      SMTP_HOST: process.env.SMTP_HOST,
      SMTP_PORT: parseNumber(process.env.SMTP_PORT, 587),
      SMTP_USER: process.env.SMTP_USER,
      SMTP_PASSWORD: process.env.SMTP_PASSWORD,
      SMTP_FROM: process.env.SMTP_FROM,
    };

    // Additional validations
    if (config.NODE_ENV === 'production') {
      if (!config.NEXTAUTH_SECRET) {
        errors.push('NEXTAUTH_SECRET is required in production');
      }
      if (config.NEXTAUTH_SECRET && config.NEXTAUTH_SECRET.length < 32) {
        errors.push('NEXTAUTH_SECRET must be at least 32 characters long');
      }
    }

    if (errors.length > 0) {
      throw new Error(errors.join('\n'));
    }

    return config;
  } catch (error) {
    console.error('❌ Environment variable validation failed:');
    if (error instanceof Error) {
      console.error(error.message);
    }

    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }

    // In development, show helpful message
    console.error('\n💡 To fix this:');
    console.error('  1. Copy .env.example to .env.local');
    console.error('  2. Fill in the required environment variables');
    console.error('  3. Restart the development server\n');

    process.exit(1);
  }
}

// Export validated environment variables
export const env = validateEnv();

// Type-safe environment variables
export type Environment = EnvConfig;

// Helper functions
export function isDevelopment(): boolean {
  return env.NODE_ENV === 'development';
}

export function isProduction(): boolean {
  return env.NODE_ENV === 'production';
}

export function isTest(): boolean {
  return env.NODE_ENV === 'test';
}

// Feature flag helpers
export function isFeatureEnabled(
  feature: keyof Pick<
    Environment,
    | 'NEXT_PUBLIC_ENABLE_ANALYTICS'
    | 'NEXT_PUBLIC_ENABLE_SENTRY'
    | 'NEXT_PUBLIC_ENABLE_DEV_TOOLS'
  >
): boolean {
  return env[feature] === true;
}

// Supabase configuration
export function getSupabaseConfig() {
  return {
    url: env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

// Sentry configuration
export function getSentryConfig() {
  if (!env.SENTRY_DSN && !env.NEXT_PUBLIC_SENTRY_DSN) {
    return null;
  }

  return {
    dsn: env.SENTRY_DSN || env.NEXT_PUBLIC_SENTRY_DSN,
    org: env.SENTRY_ORG,
    project: env.SENTRY_PROJECT,
    authToken: env.SENTRY_AUTH_TOKEN,
    enabled: isFeatureEnabled('NEXT_PUBLIC_ENABLE_SENTRY'),
  };
}

// Database configuration
export function getDatabaseConfig() {
  return {
    url: env.DATABASE_URL,
  };
}

// Email configuration
export function getEmailConfig() {
  if (!env.SMTP_HOST) return null;

  return {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT || 587,
    user: env.SMTP_USER,
    password: env.SMTP_PASSWORD,
    from: env.SMTP_FROM,
  };
}

// Rate limiting configuration
export function getRateLimitConfig() {
  return {
    max: env.RATE_LIMIT_MAX,
    windowMs: env.RATE_LIMIT_WINDOW_MS,
  };
}

// Application configuration
export function getAppConfig() {
  return {
    name: env.NEXT_PUBLIC_APP_NAME,
    version: env.NEXT_PUBLIC_APP_VERSION,
    apiBaseUrl: env.NEXT_PUBLIC_API_BASE_URL,
    environment: env.NODE_ENV,
  };
}

// Validation helpers for runtime checks
export function requireEnvVar(name: string, value?: string): string {
  if (!value) {
    throw new Error(`Environment variable ${name} is required but not set`);
  }
  return value;
}

export function validateUrl(name: string, value?: string): string | undefined {
  if (!value) return undefined;

  try {
    new URL(value);
    return value;
  } catch {
    throw new Error(`Environment variable ${name} must be a valid URL`);
  }
}

// Development helpers
export function printEnvInfo() {
  if (!isDevelopment()) return;

  console.log('🔧 Environment Configuration:');
  console.log(`  NODE_ENV: ${env.NODE_ENV}`);
  console.log(`  App Name: ${env.NEXT_PUBLIC_APP_NAME}`);
  console.log(`  App Version: ${env.NEXT_PUBLIC_APP_VERSION}`);
  console.log(`  Supabase URL: ${env.NEXT_PUBLIC_SUPABASE_URL}`);
  console.log(
    `  Sentry Enabled: ${isFeatureEnabled('NEXT_PUBLIC_ENABLE_SENTRY')}`
  );
  console.log(
    `  Analytics Enabled: ${isFeatureEnabled('NEXT_PUBLIC_ENABLE_ANALYTICS')}`
  );
  console.log(
    `  Dev Tools Enabled: ${isFeatureEnabled('NEXT_PUBLIC_ENABLE_DEV_TOOLS')}`
  );
}

// Initialize environment validation
if (isDevelopment()) {
  printEnvInfo();
}
