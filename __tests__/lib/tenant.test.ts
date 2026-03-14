import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { getAdminEmail, isAdmin } from '@/lib/tenant'

describe('tenant', () => {
  const originalEnv = process.env.ADMIN_EMAIL

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.ADMIN_EMAIL = originalEnv
    } else {
      delete process.env.ADMIN_EMAIL
    }
  })

  describe('getAdminEmail', () => {
    it('returns ADMIN_EMAIL env var', () => {
      process.env.ADMIN_EMAIL = 'admin@example.com'
      expect(getAdminEmail()).toBe('admin@example.com')
    })

    it('throws if ADMIN_EMAIL is not set', () => {
      delete process.env.ADMIN_EMAIL
      expect(() => getAdminEmail()).toThrow('ADMIN_EMAIL environment variable is not set')
    })
  })

  describe('isAdmin', () => {
    beforeEach(() => {
      process.env.ADMIN_EMAIL = 'admin@example.com'
    })

    it('returns true for exact match', () => {
      expect(isAdmin('admin@example.com')).toBe(true)
    })

    it('returns true for case-insensitive match', () => {
      expect(isAdmin('Admin@Example.COM')).toBe(true)
    })

    it('returns false for non-matching email', () => {
      expect(isAdmin('other@example.com')).toBe(false)
    })
  })
})
