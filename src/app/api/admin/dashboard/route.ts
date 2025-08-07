/**
 * API Route for Dashboard Statistics
 */

import { createClient } from '@/lib/auth.server';
import { withRBACProtection } from '@/lib/rbac.middleware';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/dashboard/stats - Get dashboard statistics
export const GET = withRBACProtection(
  async (req: NextRequest, user) => {
    try {
      const supabase = await createClient();

      // Get basic user statistics
      const stats = await Promise.all([
        // Total users count
        supabase
          .from('auth.users')
          .select('id', { count: 'exact' })
          .then(({ count }) => ({ totalUsers: count || 0 })),

        // Users by role
        supabase
          .from('auth.users')
          .select('role')
          .then(({ data }) => {
            const roleCounts = { admin: 0, support: 0, user: 0 };
            data?.forEach(user => {
              const role = user.role || 'user';
              if (role in roleCounts) {
                roleCounts[role as keyof typeof roleCounts]++;
              }
            });
            return { usersByRole: roleCounts };
          }),

        // Active users (signed in within last 30 days)
        supabase
          .from('auth.users')
          .select('id', { count: 'exact' })
          .gte(
            'last_sign_in_at',
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
          )
          .then(({ count }) => ({ activeUsers: count || 0 })),

        // New users (created within last 30 days)
        supabase
          .from('auth.users')
          .select('id', { count: 'exact' })
          .gte(
            'created_at',
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
          )
          .then(({ count }) => ({ newUsers: count || 0 })),

        // Recent activity (if user has admin/support permissions)
        user.role === 'admin' || user.role === 'support'
          ? supabase
              .from('audit_logs')
              .select('*')
              .order('timestamp', { ascending: false })
              .limit(10)
              .then(({ data }) => ({ recentActivity: data || [] }))
          : Promise.resolve({ recentActivity: [] }),
      ]);

      // Combine all statistics
      const combinedStats = stats.reduce(
        (acc, stat) => ({ ...acc, ...stat }),
        {}
      );

      // Calculate trends (mock data for now - in real app, compare with previous period)
      const trends = {
        totalUsers: { value: 12, isPositive: true },
        activeUsers: { value: 8, isPositive: true },
        newUsers: { value: 23, isPositive: true },
        systemHealth: { value: 99.9, isPositive: true },
      };

      // System health metrics (mock data)
      const systemHealth = {
        uptime: 99.9,
        responseTime: 245, // ms
        errorRate: 0.1, // %
        status: 'healthy' as const,
      };

      return NextResponse.json({
        ...combinedStats,
        trends,
        systemHealth,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Dashboard stats error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch dashboard statistics' },
        { status: 500 }
      );
    }
  },
  ['dashboard:user']
); // Minimum permission required

// GET /api/dashboard/activity - Get recent activity logs
export const activity = withRBACProtection(
  async (req: NextRequest, user) => {
    try {
      const supabase = await createClient();
      const { searchParams } = new URL(req.url);

      const limit = parseInt(searchParams.get('limit') || '20');
      const page = parseInt(searchParams.get('page') || '1');
      const action = searchParams.get('action');

      let query = supabase
        .from('recent_audit_logs') // Use the view we created
        .select('*')
        .order('timestamp', { ascending: false });

      // Filter by action if specified
      if (action) {
        query = query.eq('action', action);
      }

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data: activities, error, count } = await query;

      if (error) {
        throw error;
      }

      return NextResponse.json({
        activities: activities || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      });
    } catch (error) {
      console.error('Activity logs error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch activity logs' },
        { status: 500 }
      );
    }
  },
  ['reports:read']
); // Requires reports permission
