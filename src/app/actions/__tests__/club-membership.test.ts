
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { mockSupabase, resetSupabaseMock, createChainableMock } from '../../../../tests/mocks/supabase';

// Import functions under test
import { joinClub, approveClubMember, rejectClubMember, getPendingMembers, getClubMembershipStatus, getMyClubs } from '../clubs';

// Mock External Dependencies
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

vi.mock('@/app/actions/push', () => ({
  sendPushToClubAdmin: vi.fn(() => Promise.resolve({ success: true, sent: 1 })),
  sendPushToClubMembers: vi.fn(() => Promise.resolve({ success: true, sent: 1 })),
  sendPushNotification: vi.fn(() => Promise.resolve({ success: true, sent: 1 })),
}));

vi.mock('@/lib/audit', () => ({
  logAndNotify: vi.fn(() => Promise.resolve()),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Club Membership Approval Flow', () => {
  const mockUser = { id: 'user-123', email: 'test@test.com' };
  const mockAdminUser = { id: 'admin-456', email: 'admin@test.com' };
  const mockClubId = 'club-abc';

  beforeEach(() => {
    resetSupabaseMock();
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
  });

  // Helper to set up per-call mocking with call counters
  function setupFromMock(tableConfig: Record<string, any[]>) {
    const callCounters: Record<string, number> = {};
    mockSupabase.from.mockImplementation((table: string) => {
      if (!callCounters[table]) callCounters[table] = 0;
      const configs = tableConfig[table] || [];
      const idx = Math.min(callCounters[table], configs.length - 1);
      callCounters[table]++;
      return configs[idx] || createChainableMock();
    });
  }

  // ============================================
  // joinClub Tests
  // ============================================
  describe('joinClub', () => {
    it('should create a pending membership when joining a club', async () => {
      // Call 1: check existing membership → null
      const checkMock = createChainableMock();
      checkMock.single.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });

      // Call 2: insert new membership (from('club_memberships').insert(...))
      const insertMock = createChainableMock();
      insertMock.insert.mockResolvedValue({ error: null });

      // Call 3: fetch profile for notification
      const profileMock = createChainableMock();
      profileMock.single.mockResolvedValue({ data: { full_name: 'Test', email: 'test@test.com' } });

      // Call 4: fetch club name for notification
      const clubMock = createChainableMock();
      clubMock.single.mockResolvedValue({ data: { name: 'Test Club' } });

      setupFromMock({
        club_memberships: [checkMock, insertMock],
        profiles: [profileMock],
        clubs: [clubMock],
      });

      const result = await joinClub(mockClubId);

      expect(result.success).toBe(true);
      expect(result.status).toBe('pending');
      expect(insertMock.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          club_id: mockClubId,
          user_id: mockUser.id,
          status: 'pending',
        })
      );
    });

    it('should include intro_message when provided', async () => {
      const checkMock = createChainableMock();
      checkMock.single.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });

      const insertMock = createChainableMock();
      insertMock.insert.mockResolvedValue({ error: null });

      const profileMock = createChainableMock();
      profileMock.single.mockResolvedValue({ data: { full_name: 'Test' } });

      const clubMock = createChainableMock();
      clubMock.single.mockResolvedValue({ data: { name: 'Club' } });

      setupFromMock({
        club_memberships: [checkMock, insertMock],
        profiles: [profileMock],
        clubs: [clubMock],
      });

      const result = await joinClub(mockClubId, '안녕하세요!');

      expect(result.success).toBe(true);
      expect(insertMock.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          intro_message: '안녕하세요!',
        })
      );
    });

    it('should fail when not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      const result = await joinClub(mockClubId);

      expect(result.error).toBe('Not authenticated');
    });

    it('should fail when already an approved member', async () => {
      const checkMock = createChainableMock();
      checkMock.single.mockResolvedValue({
        data: { id: 'mem-1', status: 'approved' },
      });

      setupFromMock({
        club_memberships: [checkMock],
      });

      const result = await joinClub(mockClubId);

      expect(result.error).toBe('already_member');
    });

    it('should fail when already pending', async () => {
      const checkMock = createChainableMock();
      checkMock.single.mockResolvedValue({
        data: { id: 'mem-1', status: 'pending' },
      });

      setupFromMock({
        club_memberships: [checkMock],
      });

      const result = await joinClub(mockClubId);

      expect(result.error).toBe('already_pending');
    });

    it('should allow re-application after rejection', async () => {
      // Call 1: check existing → rejected
      const checkMock = createChainableMock();
      checkMock.single.mockResolvedValue({
        data: { id: 'mem-1', status: 'rejected' },
      });

      // Call 2: update existing membership (from('club_memberships').update(...).eq(...))
      const updateMock = createChainableMock();
      updateMock.eq.mockResolvedValue({ error: null });

      // Call 3: profile for notification
      const profileMock = createChainableMock();
      profileMock.single.mockResolvedValue({ data: { full_name: 'User' } });

      // Call 4: club name for notification
      const clubMock = createChainableMock();
      clubMock.single.mockResolvedValue({ data: { name: 'Club' } });

      setupFromMock({
        club_memberships: [checkMock, updateMock],
        profiles: [profileMock],
        clubs: [clubMock],
      });

      const result = await joinClub(mockClubId);

      expect(result.success).toBe(true);
      expect(result.status).toBe('pending');
      expect(updateMock.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'pending' })
      );
    });
  });

  // ============================================
  // approveClubMember Tests
  // ============================================
  describe('approveClubMember', () => {
    it('should approve a pending membership as club creator', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockAdminUser } });

      // Call 1: fetch membership with club data
      const memMock = createChainableMock();
      memMock.single.mockResolvedValue({
        data: {
          club_id: mockClubId,
          user_id: mockUser.id,
          status: 'pending',
          club: { created_by: mockAdminUser.id, name: 'Test Club' },
        },
      });

      // Call 2: check admin profile role
      const profileMock = createChainableMock();
      profileMock.single.mockResolvedValue({
        data: { role: 'member' },  // not system admin, but is club creator
      });

      // Call 3: update membership status
      const updateMock = createChainableMock();
      updateMock.eq.mockResolvedValue({ error: null });

      setupFromMock({
        club_memberships: [memMock, updateMock],
        profiles: [profileMock],
      });

      const result = await approveClubMember('mem-1');

      expect(result.success).toBe(true);
      expect(updateMock.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'approved' })
      );
    });

    it('should approve as system admin even if not club creator', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'other-admin' } } });

      const memMock = createChainableMock();
      memMock.single.mockResolvedValue({
        data: {
          club_id: mockClubId,
          user_id: mockUser.id,
          status: 'pending',
          club: { created_by: mockAdminUser.id },  // different from 'other-admin'
        },
      });

      const profileMock = createChainableMock();
      profileMock.single.mockResolvedValue({
        data: { role: 'admin' },  // system admin
      });

      const updateMock = createChainableMock();
      updateMock.eq.mockResolvedValue({ error: null });

      setupFromMock({
        club_memberships: [memMock, updateMock],
        profiles: [profileMock],
      });

      const result = await approveClubMember('mem-1');

      expect(result.success).toBe(true);
    });

    it('should fail if not club creator and not system admin', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'random-user' } } });

      const memMock = createChainableMock();
      memMock.single.mockResolvedValue({
        data: {
          club_id: mockClubId,
          user_id: mockUser.id,
          status: 'pending',
          club: { created_by: mockAdminUser.id },
        },
      });

      const profileMock = createChainableMock();
      profileMock.single.mockResolvedValue({
        data: { role: 'member' },
      });

      setupFromMock({
        club_memberships: [memMock],
        profiles: [profileMock],
      });

      const result = await approveClubMember('mem-1');

      expect(result.error).toBe('Unauthorized');
    });

    it('should fail when membership not found', async () => {
      const memMock = createChainableMock();
      memMock.single.mockResolvedValue({ data: null });

      setupFromMock({
        club_memberships: [memMock],
      });

      const result = await approveClubMember('mem-nonexistent');

      expect(result.error).toBe('Membership not found');
    });

    it('should fail when not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      const result = await approveClubMember('mem-1');

      expect(result.error).toBe('Not authenticated');
    });
  });

  // ============================================
  // rejectClubMember Tests
  // ============================================
  describe('rejectClubMember', () => {
    it('should reject a pending membership', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockAdminUser } });

      const memMock = createChainableMock();
      memMock.single.mockResolvedValue({
        data: {
          club_id: mockClubId,
          user_id: mockUser.id,
          status: 'pending',
          club: { created_by: mockAdminUser.id },
        },
      });

      const profileMock = createChainableMock();
      profileMock.single.mockResolvedValue({ data: { role: 'member' } });

      const updateMock = createChainableMock();
      updateMock.eq.mockResolvedValue({ error: null });

      setupFromMock({
        club_memberships: [memMock, updateMock],
        profiles: [profileMock],
      });

      const result = await rejectClubMember('mem-1');

      expect(result.success).toBe(true);
      expect(updateMock.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'rejected' })
      );
    });

    it('should fail when not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      const result = await rejectClubMember('mem-1');

      expect(result.error).toBe('Not authenticated');
    });

    it('should fail when membership not found', async () => {
      const memMock = createChainableMock();
      memMock.single.mockResolvedValue({ data: null });

      setupFromMock({
        club_memberships: [memMock],
      });

      const result = await rejectClubMember('mem-nonexistent');

      expect(result.error).toBe('Membership not found');
    });
  });

  // ============================================
  // getPendingMembers Tests
  // ============================================
  describe('getPendingMembers', () => {
    it('should return pending members for a club', async () => {
      const mockPending = [
        { id: 'mem-1', user_id: 'u-1', intro_message: 'Hi!', user: { id: 'u-1', full_name: 'User 1', email: 'u1@test.com' } },
        { id: 'mem-2', user_id: 'u-2', intro_message: null, user: { id: 'u-2', full_name: 'User 2', email: 'u2@test.com' } },
      ];

      const pendingMock = createChainableMock();
      pendingMock.order.mockResolvedValue({ data: mockPending, error: null });

      setupFromMock({
        club_memberships: [pendingMock],
      });

      const result = await getPendingMembers(mockClubId);

      expect(result).toHaveLength(2);
      expect(result[0].intro_message).toBe('Hi!');
    });

    it('should return empty array when no pending members', async () => {
      const pendingMock = createChainableMock();
      pendingMock.order.mockResolvedValue({ data: [], error: null });

      setupFromMock({
        club_memberships: [pendingMock],
      });

      const result = await getPendingMembers(mockClubId);

      expect(result).toHaveLength(0);
    });

    it('should return empty array on error', async () => {
      const pendingMock = createChainableMock();
      pendingMock.order.mockResolvedValue({ data: null, error: { message: 'DB error' } });

      setupFromMock({
        club_memberships: [pendingMock],
      });

      const result = await getPendingMembers(mockClubId);

      expect(result).toEqual([]);
    });

    it('should handle array user from Supabase', async () => {
      const pendingMock = createChainableMock();
      pendingMock.order.mockResolvedValue({
        data: [
          { id: 'mem-1', user_id: 'u-1', intro_message: 'Hi', user: [{ id: 'u-1', full_name: 'User 1', email: 'u1@t.com' }] },
        ],
        error: null,
      });

      setupFromMock({
        club_memberships: [pendingMock],
      });

      const result = await getPendingMembers(mockClubId);

      expect(result[0].user.full_name).toBe('User 1');
    });
  });

  // ============================================
  // getClubMembershipStatus Tests
  // ============================================
  describe('getClubMembershipStatus', () => {
    it('should return "approved" for approved members', async () => {
      const memMock = createChainableMock();
      memMock.single.mockResolvedValue({ data: { status: 'approved' } });

      setupFromMock({
        club_memberships: [memMock],
      });

      const result = await getClubMembershipStatus(mockClubId);

      expect(result).toBe('approved');
    });

    it('should return "pending" for pending members', async () => {
      const memMock = createChainableMock();
      memMock.single.mockResolvedValue({ data: { status: 'pending' } });

      setupFromMock({
        club_memberships: [memMock],
      });

      const result = await getClubMembershipStatus(mockClubId);

      expect(result).toBe('pending');
    });

    it('should return "rejected" for rejected members', async () => {
      const memMock = createChainableMock();
      memMock.single.mockResolvedValue({ data: { status: 'rejected' } });

      setupFromMock({
        club_memberships: [memMock],
      });

      const result = await getClubMembershipStatus(mockClubId);

      expect(result).toBe('rejected');
    });

    it('should return null for non-members', async () => {
      const memMock = createChainableMock();
      memMock.single.mockResolvedValue({ data: null });

      setupFromMock({
        club_memberships: [memMock],
      });

      const result = await getClubMembershipStatus(mockClubId);

      expect(result).toBeNull();
    });

    it('should return null when not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      const result = await getClubMembershipStatus(mockClubId);

      expect(result).toBeNull();
    });
  });

  // ============================================
  // getMyClubs Tests
  // ============================================
  describe('getMyClubs', () => {
    it('should return approved memberships with club data', async () => {
      const memMock = createChainableMock();
      // getMyClubs chain: .select().eq("user_id", ...).eq("status", "approved")
      // First .eq() returns this for chaining, second .eq() is terminal
      memMock.eq
        .mockReturnValueOnce(memMock)  // first .eq("user_id", ...) returns this
        .mockResolvedValueOnce({       // second .eq("status", "approved") returns data
          data: [
            { id: 'mem-1', role: 'member', club: { id: 'c-1', name: 'Club A' } },
          ],
          error: null,
        });

      setupFromMock({
        club_memberships: [memMock],
      });

      const result = await getMyClubs();

      expect(result).toHaveLength(1);
    });

    it('should handle array club from Supabase', async () => {
      const memMock = createChainableMock();
      memMock.eq
        .mockReturnValueOnce(memMock)
        .mockResolvedValueOnce({
          data: [
            { id: 'mem-1', role: 'member', club: [{ id: 'c-1', name: 'Club A' }] },
          ],
          error: null,
        });

      setupFromMock({
        club_memberships: [memMock],
      });

      const result = await getMyClubs();

      expect(result).toHaveLength(1);
      expect((result[0] as any).club?.name).toBe('Club A');
    });

    it('should return empty array when not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      const result = await getMyClubs();

      expect(result).toEqual([]);
    });
  });
});
