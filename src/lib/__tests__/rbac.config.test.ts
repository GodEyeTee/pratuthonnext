import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  canAccessRoute,
} from '../rbac.config.ts';

describe('RBAC utilities', () => {
  describe('hasPermission', () => {
    it('returns true for allowed permissions', () => {
      assert.equal(hasPermission('admin', 'users:read'), true);
    });
    it('returns false for disallowed permissions', () => {
      assert.equal(hasPermission('user', 'users:delete'), false);
    });
  });

  describe('hasAnyPermission', () => {
    it('returns true when at least one permission is allowed', () => {
      assert.equal(
        hasAnyPermission('support', ['users:create', 'profile:read']),
        true
      );
    });
    it('returns false when no permissions are allowed', () => {
      assert.equal(
        hasAnyPermission('user', ['reports:read', 'users:delete']),
        false
      );
    });
  });

  describe('hasAllPermissions', () => {
    it('returns true when all permissions are allowed', () => {
      assert.equal(
        hasAllPermissions('admin', ['users:read', 'users:create']),
        true
      );
    });
    it('returns false when any permission is missing', () => {
      assert.equal(
        hasAllPermissions('support', ['reports:read', 'reports:delete']),
        false
      );
    });
  });

  describe('canAccessRoute', () => {
    it('allows access to public routes', () => {
      assert.equal(canAccessRoute('user', '/about'), true);
    });
    it('allows access to protected routes when permitted', () => {
      assert.equal(canAccessRoute('admin', '/admin'), true);
    });
    it('denies access when role lacks permission', () => {
      assert.equal(canAccessRoute('user', '/admin'), false);
    });
  });
});
