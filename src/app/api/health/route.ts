/**
 * Health Check API Route
 * Used by Docker healthcheck and monitoring systems
 */

import { createClient } from '@/lib/auth.server';
import { env, getAppConfig } from '@/lib/env.validation';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  environment: string;
  checks: {
    database: HealthCheckResult;
    auth: HealthCheckResult;
    memory: HealthCheckResult;
    uptime: HealthCheckResult;
  };
  metadata?: {
    nodeVersion: string;
    platform: string;
    architecture: string;
    memoryUsage: NodeJS.MemoryUsage;
    uptime: number;
  };
}

interface HealthCheckResult {
  status: 'pass' | 'fail' | 'warn';
  responseTime?: number;
  message?: string;
  details?: any;
}

// Cache health check results for 30 seconds to avoid overwhelming services
let cachedResult: { data: HealthCheckResponse; timestamp: number } | null =
  null;
const CACHE_DURATION = 30 * 1000; // 30 seconds

export async function GET(req: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    // Check if we have a cached result
    if (cachedResult && Date.now() - cachedResult.timestamp < CACHE_DURATION) {
      return NextResponse.json(cachedResult.data, {
        status: cachedResult.data.status === 'healthy' ? 200 : 503,
      });
    }

    // Run health checks in parallel
    const [databaseCheck, authCheck, memoryCheck, uptimeCheck] =
      await Promise.allSettled([
        checkDatabase(),
        checkAuth(),
        checkMemory(),
        checkUptime(),
      ]);

    // Process results
    const checks = {
      database: getCheckResult(databaseCheck),
      auth: getCheckResult(authCheck),
      memory: getCheckResult(memoryCheck),
      uptime: getCheckResult(uptimeCheck),
    };

    // Determine overall status
    const hasFailures = Object.values(checks).some(
      check => check.status === 'fail'
    );
    const hasWarnings = Object.values(checks).some(
      check => check.status === 'warn'
    );

    let overallStatus: 'healthy' | 'unhealthy' | 'degraded';
    if (hasFailures) {
      overallStatus = 'unhealthy';
    } else if (hasWarnings) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'healthy';
    }

    const appConfig = getAppConfig();
    const response: HealthCheckResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: appConfig.version,
      environment: appConfig.environment,
      checks,
    };

    // Add metadata in development or if requested
    const includeMetadata =
      env.NODE_ENV === 'development' ||
      req.nextUrl.searchParams.get('detailed') === 'true';

    if (includeMetadata) {
      response.metadata = {
        nodeVersion: process.version,
        platform: process.platform,
        architecture: process.arch,
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime(),
      };
    }

    // Cache the result
    cachedResult = {
      data: response,
      timestamp: Date.now(),
    };

    // Set appropriate HTTP status
    const httpStatus = overallStatus === 'healthy' ? 200 : 503;

    return NextResponse.json(response, {
      status: httpStatus,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Response-Time': `${Date.now() - startTime}ms`,
      },
    });
  } catch (error) {
    console.error('Health check failed:', error);

    const errorResponse: HealthCheckResponse = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: getAppConfig().version,
      environment: getAppConfig().environment,
      checks: {
        database: { status: 'fail', message: 'Health check system failed' },
        auth: { status: 'fail', message: 'Health check system failed' },
        memory: { status: 'fail', message: 'Health check system failed' },
        uptime: { status: 'fail', message: 'Health check system failed' },
      },
    };

    return NextResponse.json(errorResponse, {
      status: 503,
      headers: {
        'X-Response-Time': `${Date.now() - startTime}ms`,
      },
    });
  }
}

// Individual health check functions
async function checkDatabase(): Promise<HealthCheckResult> {
  const startTime = Date.now();

  try {
    const supabase = await createClient();

    // Simple query to test database connectivity
    const { data, error } = await supabase
      .from('auth.users')
      .select('id')
      .limit(1);

    const responseTime = Date.now() - startTime;

    if (error) {
      return {
        status: 'fail',
        responseTime,
        message: 'Database query failed',
        details: error.message,
      };
    }

    // Check response time
    if (responseTime > 5000) {
      // 5 seconds
      return {
        status: 'warn',
        responseTime,
        message: 'Database response time is slow',
      };
    }

    return {
      status: 'pass',
      responseTime,
      message: 'Database is responsive',
    };
  } catch (error) {
    return {
      status: 'fail',
      responseTime: Date.now() - startTime,
      message: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function checkAuth(): Promise<HealthCheckResult> {
  const startTime = Date.now();

  try {
    const supabase = await createClient();

    // Test auth service connectivity
    const { error } = await supabase.auth.getSession();

    const responseTime = Date.now() - startTime;

    if (error) {
      return {
        status: 'fail',
        responseTime,
        message: 'Auth service failed',
        details: error.message,
      };
    }

    return {
      status: 'pass',
      responseTime,
      message: 'Auth service is responsive',
    };
  } catch (error) {
    return {
      status: 'fail',
      responseTime: Date.now() - startTime,
      message: 'Auth service connection failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function checkMemory(): Promise<HealthCheckResult> {
  try {
    const memoryUsage = process.memoryUsage();
    const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
    const heapTotalMB = memoryUsage.heapTotal / 1024 / 1024;
    const heapUsagePercent = (heapUsedMB / heapTotalMB) * 100;

    // Memory thresholds
    const warningThreshold = 80; // 80%
    const criticalThreshold = 95; // 95%

    if (heapUsagePercent > criticalThreshold) {
      return {
        status: 'fail',
        message: `Memory usage critical: ${heapUsagePercent.toFixed(1)}%`,
        details: {
          heapUsedMB: Math.round(heapUsedMB),
          heapTotalMB: Math.round(heapTotalMB),
          usagePercent: Math.round(heapUsagePercent),
        },
      };
    }

    if (heapUsagePercent > warningThreshold) {
      return {
        status: 'warn',
        message: `Memory usage high: ${heapUsagePercent.toFixed(1)}%`,
        details: {
          heapUsedMB: Math.round(heapUsedMB),
          heapTotalMB: Math.round(heapTotalMB),
          usagePercent: Math.round(heapUsagePercent),
        },
      };
    }

    return {
      status: 'pass',
      message: `Memory usage normal: ${heapUsagePercent.toFixed(1)}%`,
      details: {
        heapUsedMB: Math.round(heapUsedMB),
        heapTotalMB: Math.round(heapTotalMB),
        usagePercent: Math.round(heapUsagePercent),
      },
    };
  } catch (error) {
    return {
      status: 'fail',
      message: 'Memory check failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function checkUptime(): Promise<HealthCheckResult> {
  try {
    const uptimeSeconds = process.uptime();
    const uptimeMinutes = uptimeSeconds / 60;

    // Consider very short uptime as a warning (might indicate frequent restarts)
    if (uptimeMinutes < 2) {
      return {
        status: 'warn',
        message: `Low uptime: ${uptimeMinutes.toFixed(1)} minutes`,
        details: { uptimeSeconds: Math.round(uptimeSeconds) },
      };
    }

    return {
      status: 'pass',
      message: `Uptime: ${uptimeMinutes.toFixed(1)} minutes`,
      details: { uptimeSeconds: Math.round(uptimeSeconds) },
    };
  } catch (error) {
    return {
      status: 'fail',
      message: 'Uptime check failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Helper function to extract result from Promise.allSettled
function getCheckResult(
  settledResult: PromiseSettledResult<HealthCheckResult>
): HealthCheckResult {
  if (settledResult.status === 'fulfilled') {
    return settledResult.value;
  } else {
    return {
      status: 'fail',
      message: 'Health check promise rejected',
      details:
        settledResult.reason instanceof Error
          ? settledResult.reason.message
          : 'Unknown error',
    };
  }
}
