
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockSupabase, resetSupabaseMock, createChainableMock } from '../../../../tests/mocks/supabase';

// Import functions under test
import { joinMatch, respondToRegularMatch, getRegularMatchResponses, getMyRegularMatchResponse } from '../match';
import { createMatch } from '../admin';

// Mock External Dependencies
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

vi.mock('@/app/actions/push', () => ({
  sendPushNotification: vi.fn(() => Promise.resolve({ success: true, sent: 1 })),
  sendPushToClubMembers: vi.fn(() => Promise.resolve({ success: true, sent: 5 })),
  sendPushToClubAdmin: vi.fn(() => Promise.resolve({ success: true, sent: 1 })),
}));

vi.mock('@/lib/audit', () => ({
  logAndNotify: vi.fn(() => Promise.resolve()),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Regular Match Features', () => {
  const mockUser = { id: 'user-123', email: 'test@test.com' };
  const mockMatchId = 'match-abc';
  const mockClubId = 'club-xyz';

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
  // Guest Time Restriction for Regular Matches
  // ============================================
  describe('joinMatch - Guest Time Restriction', () => {
    it('should block guest from joining regular match before guest open time', async () => {
      // Call 1: participant check → not already joined
      const partMock = createChainableMock();
      partMock.single.mockResolvedValue({ data: null });

      // Call 2: match info → regular, starts in 48h, guest open 24h before
      const matchMock = createChainableMock();
      const futureStart = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
      matchMock.single.mockResolvedValue({
        data: {
          id: mockMatchId,
          entry_points: 10000,
          status: 'open',
          goalie_free: false,
          match_type: 'regular',
          guest_open_hours_before: 24,
          start_time: futureStart,
          club_id: mockClubId,
        },
      });

      // Call 3: check club membership → not a member
      const memMock = createChainableMock();
      memMock.single.mockResolvedValue({ data: null });

      setupFromMock({
        participants: [partMock],
        matches: [matchMock],
        club_memberships: [memMock],
      });

      const result = await joinMatch(mockMatchId, 'FW');

      expect(result.error).toBe('guest_not_yet_open');
      expect(result.code).toBe('GUEST_NOT_YET_OPEN');
    });

    it('should allow guest to join regular match after guest open time has passed', async () => {
      const partCheckMock = createChainableMock();
      partCheckMock.single.mockResolvedValue({ data: null });

      // Match starts in 12 hours, guest open 24 hours before → already open
      const futureStart = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();
      const matchMock = createChainableMock();
      matchMock.single.mockResolvedValue({
        data: {
          id: mockMatchId,
          entry_points: 10000,
          status: 'open',
          goalie_free: false,
          match_type: 'regular',
          guest_open_hours_before: 24,
          start_time: futureStart,
          club_id: mockClubId,
        },
      });

      // Not a member → guest, but time is open
      const memMock = createChainableMock();
      memMock.single.mockResolvedValue({ data: null });

      // Profile 1: get points
      const profilePointsMock = createChainableMock();
      profilePointsMock.single.mockResolvedValue({
        data: { points: 20000, full_name: 'Test User' },
      });

      // Profile 2: update points (deduction) - chain: .update().eq()
      const profileUpdateMock = createChainableMock();
      profileUpdateMock.eq.mockResolvedValue({ error: null });

      // Transaction insert
      const txMock = createChainableMock();
      txMock.insert.mockResolvedValue({ error: null });

      // Participant insert
      const partInsertMock = createChainableMock();
      partInsertMock.insert.mockResolvedValue({ error: null });

      // Match 2: notification details
      const matchNotifMock = createChainableMock();
      matchNotifMock.single.mockResolvedValue({
        data: { start_time: futureStart, created_by: 'admin-1', rink: { name_ko: 'Rink' } },
      });

      // Profile 3: participant name for notification
      const profileNameMock = createChainableMock();
      profileNameMock.single.mockResolvedValue({
        data: { full_name: 'Test User' },
      });

      setupFromMock({
        participants: [partCheckMock, partInsertMock],
        matches: [matchMock, matchNotifMock],
        club_memberships: [memMock],
        profiles: [profilePointsMock, profileUpdateMock, profileNameMock],
        point_transactions: [txMock],
      });

      const result = await joinMatch(mockMatchId, 'FW');

      // Should NOT be blocked by guest restriction
      expect(result.error).not.toBe('guest_not_yet_open');
    });

    it('should always allow club members to join regular match regardless of time', async () => {
      const partCheckMock = createChainableMock();
      partCheckMock.single.mockResolvedValue({ data: null });

      // Match starts in 48 hours, guest open 24 hours before → would block guest
      const futureStart = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
      const matchMock = createChainableMock();
      matchMock.single.mockResolvedValue({
        data: {
          id: mockMatchId,
          entry_points: 10000,
          status: 'open',
          goalie_free: false,
          match_type: 'regular',
          guest_open_hours_before: 24,
          start_time: futureStart,
          club_id: mockClubId,
        },
      });

      // IS an approved club member
      const memMock = createChainableMock();
      memMock.single.mockResolvedValue({
        data: { status: 'approved' },
      });

      // Profile 1: get points
      const profilePointsMock = createChainableMock();
      profilePointsMock.single.mockResolvedValue({
        data: { points: 20000, full_name: 'Test User' },
      });

      // Profile 2: update points - chain: .update().eq()
      const profileUpdateMock = createChainableMock();
      profileUpdateMock.eq.mockResolvedValue({ error: null });

      // Transaction insert
      const txMock = createChainableMock();
      txMock.insert.mockResolvedValue({ error: null });

      // Participant insert
      const partInsertMock = createChainableMock();
      partInsertMock.insert.mockResolvedValue({ error: null });

      // Match 2: notification details
      const matchNotifMock = createChainableMock();
      matchNotifMock.single.mockResolvedValue({
        data: { start_time: futureStart, created_by: 'admin-1', rink: { name_ko: 'Rink' } },
      });

      // Profile 3: participant name
      const profileNameMock = createChainableMock();
      profileNameMock.single.mockResolvedValue({
        data: { full_name: 'Test User' },
      });

      setupFromMock({
        participants: [partCheckMock, partInsertMock],
        matches: [matchMock, matchNotifMock],
        club_memberships: [memMock],
        profiles: [profilePointsMock, profileUpdateMock, profileNameMock],
        point_transactions: [txMock],
      });

      const result = await joinMatch(mockMatchId, 'FW');

      // Should NOT be blocked
      expect(result.error).not.toBe('guest_not_yet_open');
    });

    it('should not restrict anyone for open_hockey matches', async () => {
      const partCheckMock = createChainableMock();
      partCheckMock.single.mockResolvedValue({ data: null });

      const futureStart = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
      const matchMock = createChainableMock();
      matchMock.single.mockResolvedValue({
        data: {
          id: mockMatchId,
          entry_points: 10000,
          status: 'open',
          goalie_free: false,
          match_type: 'open_hockey',
          guest_open_hours_before: null,
          start_time: futureStart,
          club_id: null,
        },
      });

      // Profile 1: get points
      const profilePointsMock = createChainableMock();
      profilePointsMock.single.mockResolvedValue({
        data: { points: 20000, full_name: 'Test User' },
      });

      // Profile 2: update points
      const profileUpdateMock = createChainableMock();
      profileUpdateMock.eq.mockResolvedValue({ error: null });

      // Transaction
      const txMock = createChainableMock();
      txMock.insert.mockResolvedValue({ error: null });

      // Participant insert
      const partInsertMock = createChainableMock();
      partInsertMock.insert.mockResolvedValue({ error: null });

      // Match 2: notification details
      const matchNotifMock = createChainableMock();
      matchNotifMock.single.mockResolvedValue({
        data: { start_time: futureStart, created_by: 'admin-1', rink: { name_ko: 'Rink' } },
      });

      // Profile 3: participant name
      const profileNameMock = createChainableMock();
      profileNameMock.single.mockResolvedValue({
        data: { full_name: 'Test User' },
      });

      setupFromMock({
        participants: [partCheckMock, partInsertMock],
        matches: [matchMock, matchNotifMock],
        profiles: [profilePointsMock, profileUpdateMock, profileNameMock],
        point_transactions: [txMock],
      });

      const result = await joinMatch(mockMatchId, 'FW');

      expect(result.error).not.toBe('guest_not_yet_open');
    });

    it('should block guest when match is 30h away with null guest_open_hours_before (default 24h)', async () => {
      const partMock = createChainableMock();
      partMock.single.mockResolvedValue({ data: null });

      // Match in 30 hours, null guest_open_hours_before defaults to 24h
      // Guest open time = match - 24h = now + 6h → still in the future → blocked
      const futureStart = new Date(Date.now() + 30 * 60 * 60 * 1000).toISOString();
      const matchMock = createChainableMock();
      matchMock.single.mockResolvedValue({
        data: {
          id: mockMatchId,
          entry_points: 10000,
          status: 'open',
          goalie_free: false,
          match_type: 'regular',
          guest_open_hours_before: null,  // defaults to 24
          start_time: futureStart,
          club_id: mockClubId,
        },
      });

      const memMock = createChainableMock();
      memMock.single.mockResolvedValue({ data: null }); // not a member

      setupFromMock({
        participants: [partMock],
        matches: [matchMock],
        club_memberships: [memMock],
      });

      const result = await joinMatch(mockMatchId, 'FW');

      // 30h away, guest opens at 24h before → 6h in the future → BLOCKED
      expect(result.error).toBe('guest_not_yet_open');
    });

    it('should allow guest when match is 20h away with null guest_open_hours_before (default 24h)', async () => {
      const partCheckMock = createChainableMock();
      partCheckMock.single.mockResolvedValue({ data: null });

      // Match in 20 hours, null guest_open_hours_before defaults to 24h
      // Guest open time = match - 24h = now - 4h → past → allowed
      const futureStart = new Date(Date.now() + 20 * 60 * 60 * 1000).toISOString();
      const matchMock = createChainableMock();
      matchMock.single.mockResolvedValue({
        data: {
          id: mockMatchId,
          entry_points: 10000,
          status: 'open',
          goalie_free: false,
          match_type: 'regular',
          guest_open_hours_before: null,
          start_time: futureStart,
          club_id: mockClubId,
        },
      });

      // Not a member
      const memMock = createChainableMock();
      memMock.single.mockResolvedValue({ data: null });

      // Profile 1: get points
      const profilePointsMock = createChainableMock();
      profilePointsMock.single.mockResolvedValue({
        data: { points: 20000, full_name: 'Test User' },
      });

      // Profile 2: update points
      const profileUpdateMock = createChainableMock();
      profileUpdateMock.eq.mockResolvedValue({ error: null });

      // Transaction
      const txMock = createChainableMock();
      txMock.insert.mockResolvedValue({ error: null });

      // Participant insert
      const partInsertMock = createChainableMock();
      partInsertMock.insert.mockResolvedValue({ error: null });

      // Match 2: notification details
      const matchNotifMock = createChainableMock();
      matchNotifMock.single.mockResolvedValue({
        data: { start_time: futureStart, created_by: 'admin-1', rink: { name_ko: 'Rink' } },
      });

      // Profile 3: participant name
      const profileNameMock = createChainableMock();
      profileNameMock.single.mockResolvedValue({
        data: { full_name: 'Test User' },
      });

      setupFromMock({
        participants: [partCheckMock, partInsertMock],
        matches: [matchMock, matchNotifMock],
        club_memberships: [memMock],
        profiles: [profilePointsMock, profileUpdateMock, profileNameMock],
        point_transactions: [txMock],
      });

      const result = await joinMatch(mockMatchId, 'FW');

      // 20h away, guest opens at 24h before → 4h ago → ALLOWED
      expect(result.error).not.toBe('guest_not_yet_open');
    });
  });

  // ============================================
  // respondToRegularMatch Tests
  // ============================================
  describe('respondToRegularMatch', () => {
    it('should allow a club member to respond "attending" with position', async () => {
      // Fetch match
      const matchMock = createChainableMock();
      matchMock.single.mockResolvedValue({
        data: { match_type: 'regular', club_id: mockClubId },
      });

      // Check membership
      const memMock = createChainableMock();
      memMock.single.mockResolvedValue({
        data: { status: 'approved' },
      });

      // Upsert response (the chain is .upsert(...) which resolves directly)
      const resMock = {
        upsert: vi.fn().mockResolvedValue({ error: null }),
      };

      setupFromMock({
        matches: [matchMock],
        club_memberships: [memMock],
        regular_match_responses: [resMock as any],
      });

      const result = await respondToRegularMatch(mockMatchId, 'attending', 'FW');

      expect(result.success).toBe(true);
      expect(resMock.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          match_id: mockMatchId,
          user_id: mockUser.id,
          response: 'attending',
          position: 'FW',
        }),
        expect.objectContaining({ onConflict: 'match_id,user_id' })
      );
    });

    it('should allow a club member to respond "not_attending" with null position', async () => {
      const matchMock = createChainableMock();
      matchMock.single.mockResolvedValue({
        data: { match_type: 'regular', club_id: mockClubId },
      });

      const memMock = createChainableMock();
      memMock.single.mockResolvedValue({
        data: { status: 'approved' },
      });

      const resMock = {
        upsert: vi.fn().mockResolvedValue({ error: null }),
      };

      setupFromMock({
        matches: [matchMock],
        club_memberships: [memMock],
        regular_match_responses: [resMock as any],
      });

      const result = await respondToRegularMatch(mockMatchId, 'not_attending');

      expect(result.success).toBe(true);
      expect(resMock.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          response: 'not_attending',
          position: null,
        }),
        expect.any(Object)
      );
    });

    it('should fail for non-regular matches', async () => {
      const matchMock = createChainableMock();
      matchMock.single.mockResolvedValue({
        data: { match_type: 'open_hockey', club_id: mockClubId },
      });

      setupFromMock({
        matches: [matchMock],
      });

      const result = await respondToRegularMatch(mockMatchId, 'attending', 'FW');

      expect(result.error).toBe('Not a regular match');
    });

    it('should fail for non-club members', async () => {
      const matchMock = createChainableMock();
      matchMock.single.mockResolvedValue({
        data: { match_type: 'regular', club_id: mockClubId },
      });

      const memMock = createChainableMock();
      memMock.single.mockResolvedValue({ data: null });

      setupFromMock({
        matches: [matchMock],
        club_memberships: [memMock],
      });

      const result = await respondToRegularMatch(mockMatchId, 'attending', 'FW');

      expect(result.error).toBe('Not a club member');
    });

    it('should fail when not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      const result = await respondToRegularMatch(mockMatchId, 'attending', 'FW');

      expect(result.error).toBe('Not authenticated');
    });

    it('should fail when match not found', async () => {
      const matchMock = createChainableMock();
      matchMock.single.mockResolvedValue({ data: null });

      setupFromMock({
        matches: [matchMock],
      });

      const result = await respondToRegularMatch(mockMatchId, 'attending', 'FW');

      expect(result.error).toBe('Not a regular match');
    });
  });

  // ============================================
  // getRegularMatchResponses Tests
  // ============================================
  describe('getRegularMatchResponses', () => {
    it('should return all responses for a match', async () => {
      const mockResponses = [
        { id: 'r-1', match_id: mockMatchId, user_id: 'u-1', response: 'attending', position: 'FW', user: { id: 'u-1', full_name: 'Player 1', email: 'p1@test.com' } },
        { id: 'r-2', match_id: mockMatchId, user_id: 'u-2', response: 'not_attending', position: null, user: { id: 'u-2', full_name: 'Player 2', email: 'p2@test.com' } },
        { id: 'r-3', match_id: mockMatchId, user_id: 'u-3', response: 'attending', position: 'G', user: { id: 'u-3', full_name: 'Player 3', email: 'p3@test.com' } },
      ];

      const resMock = createChainableMock();
      resMock.order.mockResolvedValue({ data: mockResponses, error: null });

      setupFromMock({
        regular_match_responses: [resMock],
      });

      const result = await getRegularMatchResponses(mockMatchId);

      expect(result).toHaveLength(3);
      expect(result[0].response).toBe('attending');
      expect(result[1].response).toBe('not_attending');
      expect(result[2].position).toBe('G');
    });

    it('should return empty array on error', async () => {
      const resMock = createChainableMock();
      resMock.order.mockResolvedValue({ data: null, error: { message: 'DB error' } });

      setupFromMock({
        regular_match_responses: [resMock],
      });

      const result = await getRegularMatchResponses(mockMatchId);

      expect(result).toEqual([]);
    });

    it('should handle array user from Supabase join', async () => {
      const resMock = createChainableMock();
      resMock.order.mockResolvedValue({
        data: [
          { id: 'r-1', match_id: mockMatchId, user_id: 'u-1', response: 'attending', position: 'FW', user: [{ id: 'u-1', full_name: 'Player 1', email: 'p1@test.com' }] },
        ],
        error: null,
      });

      setupFromMock({
        regular_match_responses: [resMock],
      });

      const result = await getRegularMatchResponses(mockMatchId);

      expect(result).toHaveLength(1);
      expect(result[0].user.full_name).toBe('Player 1');
    });
  });

  // ============================================
  // getMyRegularMatchResponse Tests
  // ============================================
  describe('getMyRegularMatchResponse', () => {
    it('should return my response for a match when attending', async () => {
      const resMock = createChainableMock();
      resMock.single.mockResolvedValue({
        data: { response: 'attending', position: 'DF' },
      });

      setupFromMock({
        regular_match_responses: [resMock],
      });

      const result = await getMyRegularMatchResponse(mockMatchId);

      expect(result).toBeTruthy();
      expect(result!.response).toBe('attending');
      expect(result!.position).toBe('DF');
    });

    it('should return my response when not attending', async () => {
      const resMock = createChainableMock();
      resMock.single.mockResolvedValue({
        data: { response: 'not_attending', position: null },
      });

      setupFromMock({
        regular_match_responses: [resMock],
      });

      const result = await getMyRegularMatchResponse(mockMatchId);

      expect(result!.response).toBe('not_attending');
      expect(result!.position).toBeNull();
    });

    it('should return null when no response exists', async () => {
      const resMock = createChainableMock();
      resMock.single.mockResolvedValue({ data: null });

      setupFromMock({
        regular_match_responses: [resMock],
      });

      const result = await getMyRegularMatchResponse(mockMatchId);

      expect(result).toBeNull();
    });

    it('should return null when not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      const result = await getMyRegularMatchResponse(mockMatchId);

      expect(result).toBeNull();
    });
  });

  // ============================================
  // createMatch with Regular Type Tests
  // ============================================
  describe('createMatch - Regular Match Type', () => {
    it('should create a regular match with correct fields', async () => {
      // Admin role check
      const profileMock = createChainableMock();
      profileMock.single.mockResolvedValue({ data: { role: 'admin' } });

      // Match insert 
      const matchMock = createChainableMock();
      matchMock.select.mockReturnThis();
      matchMock.single.mockResolvedValue({
        data: { id: 'new-match', match_type: 'regular', guest_open_hours_before: 48, club_id: mockClubId },
      });

      setupFromMock({
        profiles: [profileMock],
        matches: [matchMock],
      });

      const formData = new FormData();
      formData.set('rink_id', 'rink-1');
      formData.set('start_time', '2026-03-01T18:00');
      formData.set('entry_points', '30000');
      formData.set('max_skaters', '20');
      formData.set('max_goalies', '2');
      formData.set('club_id', mockClubId);
      formData.set('match_type', 'regular');
      formData.set('guest_open_hours_before', '48');

      const result = await createMatch(formData);

      expect(result.success).toBe(true);
      expect(matchMock.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          match_type: 'regular',
          guest_open_hours_before: 48,
          club_id: mockClubId,
        })
      );
    });

    it('should default to open_hockey when no match_type specified', async () => {
      const profileMock = createChainableMock();
      profileMock.single.mockResolvedValue({ data: { role: 'admin' } });

      const matchMock = createChainableMock();
      matchMock.select.mockReturnThis();
      matchMock.single.mockResolvedValue({
        data: { id: 'new-match', match_type: 'open_hockey' },
      });

      setupFromMock({
        profiles: [profileMock],
        matches: [matchMock],
      });

      const formData = new FormData();
      formData.set('rink_id', 'rink-1');
      formData.set('start_time', '2026-03-01T18:00');
      formData.set('entry_points', '30000');
      formData.set('max_skaters', '20');
      formData.set('max_goalies', '2');

      const result = await createMatch(formData);

      expect(result.success).toBe(true);
      expect(matchMock.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          match_type: 'open_hockey',
        })
      );
    });
  });
});
