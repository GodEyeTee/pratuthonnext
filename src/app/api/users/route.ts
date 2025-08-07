/**
 * API Routes for User Management (Admin Only)
 */

import { createClient } from '@/lib/auth.server';
import { canManageRole } from '@/lib/rbac.config';
import { createAuditLog, withRBACProtection } from '@/lib/rbac.middleware';
import type { UserRole } from '@/types/rbac';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/admin/users - List all users
export const GET = withRBACProtection(
  async (req: NextRequest, user) => {
    try {
      const supabase = await createClient();
      const { searchParams } = new URL(req.url);

      // Query parameters
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');
      const search = searchParams.get('search') || '';
      const role = searchParams.get('role') as UserRole | null;

      // Build query
      let query = supabase
        .from('user_details') // Use the view we created
        .select('*')
        .order('user_created_at', { ascending: false });

      // Apply filters
      if (search) {
        query = query.or(
          `display_name.ilike.%${search}%,email.ilike.%${search}%`
        );
      }

      if (role) {
        query = query.eq('role', role);
      }

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data: users, error, count } = await query;

      if (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json(
          { error: 'Failed to fetch users' },
          { status: 500 }
        );
      }

      // Create audit log
      await createAuditLog(supabase, 'users_viewed', user.id, user.id, {
        filters: { search, role, page, limit },
        count: users?.length || 0,
      });

      return NextResponse.json({
        users: users || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      });
    } catch (error) {
      console.error('API Error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  },
  ['users:read']
);

// POST /api/admin/users - Create new user (placeholder)
export const POST = withRBACProtection(
  async (req: NextRequest, user) => {
    try {
      const body = await req.json();
      const { email, name, role } = body;

      // Validate input
      if (!email || !role) {
        return NextResponse.json(
          { error: 'Email and role are required' },
          { status: 400 }
        );
      }

      // Check if current user can assign this role
      if (!canManageRole(user.role, role)) {
        return NextResponse.json(
          { error: 'Insufficient permissions to assign this role' },
          { status: 403 }
        );
      }

      // For now, return a placeholder response
      // In a real implementation, you would:
      // 1. Create the user in Supabase Auth
      // 2. Set the role in user metadata
      // 3. Create user profile
      // 4. Send invitation email

      return NextResponse.json(
        {
          message: 'User creation not implemented yet',
          note: 'This would typically create a new user account and send an invitation email',
        },
        { status: 501 }
      );
    } catch (error) {
      console.error('API Error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  },
  ['users:create']
);

// PUT /api/admin/users/[id]/role - Update user role
export async function PUT(req: NextRequest) {
  return withRBACProtection(
    async (req: NextRequest, user) => {
      try {
        const body = await req.json();
        const { userId, newRole, reason } = body;

        if (!userId || !newRole) {
          return NextResponse.json(
            { error: 'User ID and new role are required' },
            { status: 400 }
          );
        }

        const supabase = await createClient();

        // Get target user
        const { data: targetUser, error: fetchError } = await supabase
          .from('auth.users')
          .select('id, email, role')
          .eq('id', userId)
          .single();

        if (fetchError || !targetUser) {
          return NextResponse.json(
            { error: 'User not found' },
            { status: 404 }
          );
        }

        // Check permissions
        if (
          !canManageRole(user.role, targetUser.role) ||
          !canManageRole(user.role, newRole)
        ) {
          return NextResponse.json(
            { error: 'Insufficient permissions' },
            { status: 403 }
          );
        }

        // Prevent self-role change
        if (userId === user.id) {
          return NextResponse.json(
            { error: 'Cannot change your own role' },
            { status: 400 }
          );
        }

        // Use the helper function to change role safely
        const { error: updateError } = await supabase.rpc('change_user_role', {
          target_user_id: userId,
          new_role: newRole,
          performed_by_id: user.id,
          reason: reason || null,
        });

        if (updateError) {
          console.error('Error updating user role:', updateError);
          return NextResponse.json(
            { error: 'Failed to update user role' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          message: 'User role updated successfully',
          user: {
            id: userId,
            email: targetUser.email,
            oldRole: targetUser.role,
            newRole,
          },
        });
      } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json(
          { error: 'Internal server error' },
          { status: 500 }
        );
      }
    },
    ['users:update']
  )(req);
}

// DELETE /api/admin/users/[id] - Delete user
export async function DELETE(req: NextRequest) {
  return withRBACProtection(
    async (req: NextRequest, user) => {
      try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('id');

        if (!userId) {
          return NextResponse.json(
            { error: 'User ID is required' },
            { status: 400 }
          );
        }

        const supabase = await createClient();

        // Get target user
        const { data: targetUser, error: fetchError } = await supabase
          .from('auth.users')
          .select('id, email, role')
          .eq('id', userId)
          .single();

        if (fetchError || !targetUser) {
          return NextResponse.json(
            { error: 'User not found' },
            { status: 404 }
          );
        }

        // Check permissions
        if (!canManageRole(user.role, targetUser.role)) {
          return NextResponse.json(
            { error: 'Insufficient permissions' },
            { status: 403 }
          );
        }

        // Prevent self-deletion
        if (userId === user.id) {
          return NextResponse.json(
            { error: 'Cannot delete your own account' },
            { status: 400 }
          );
        }

        // Create audit log before deletion
        await createAuditLog(supabase, 'user_deleted', userId, user.id, {
          deletedUser: {
            id: targetUser.id,
            email: targetUser.email,
            role: targetUser.role,
          },
        });

        // Delete user (this will cascade to related tables due to foreign key constraints)
        const { error: deleteError } =
          await supabase.auth.admin.deleteUser(userId);

        if (deleteError) {
          console.error('Error deleting user:', deleteError);
          return NextResponse.json(
            { error: 'Failed to delete user' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          message: 'User deleted successfully',
          deletedUser: {
            id: userId,
            email: targetUser.email,
          },
        });
      } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json(
          { error: 'Internal server error' },
          { status: 500 }
        );
      }
    },
    ['users:delete']
  )(req);
}
