
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockSupabase, resetSupabaseMock, createChainableMock } from '../../../../tests/mocks/supabase';
import { joinMatch, cancelJoin } from '../match';
import { confirmPointCharge } from '../superuser';
import { requestPointCharge } from '../points';

// Mock External Dependencies
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

vi.mock('@/app/actions/push', () => ({
  sendPushNotification: vi.fn(() => Promise.resolve({ success: true, sent: 1 })),
}));

vi.mock('@/lib/audit', () => ({
  logAndNotify: vi.fn(() => Promise.resolve()),
}));

vi.mock('../points', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    calculateRefundPercent: vi.fn(), 
  };
});
import { calculateRefundPercent } from '../points';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Financial Flows', () => {
  const mockUser = { id: 'user-123', email: 'test@test.com', full_name: 'Test User' };
  const mockMatchId = 'match-abc';

  // Table-specific Mocks
  let profilesMock: any;
  let matchesMock: any;
  let participantsMock: any;
  let transactionsMock: any;
  let requestsMock: any;

  beforeEach(() => {
    resetSupabaseMock();
    
    // Create fresh chains for each table
    profilesMock = createChainableMock();
    matchesMock = createChainableMock();
    participantsMock = createChainableMock();
    transactionsMock = createChainableMock();
    requestsMock = createChainableMock();

    // Default: Route from() to specific mocks
    mockSupabase.from.mockImplementation((table: string) => {
      switch (table) {
        case 'profiles': return profilesMock;
        case 'matches': return matchesMock;
        case 'participants': return participantsMock;
        case 'point_transactions': return transactionsMock;
        case 'point_charge_requests': return requestsMock;
        default: return createChainableMock();
      }
    });

    // Default Auth Mock
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
  });

  describe('Join Match Flow', () => {
    it('Scenario 1: Join with sufficient points -> Confirmed & Deducted', async () => {
      // 1. Mock Data
      // Participant check (not joined)
      participantsMock.single.mockResolvedValue({ data: null });
      
      // Match info (Entry: 10,000, Open)
      matchesMock.single.mockResolvedValue({
        data: { entry_points: 10000, status: 'open', goalie_free: false, id: mockMatchId, start_time: new Date().toISOString(), created_by: 'admin-1', rink: { name_ko: 'Rink' } }
      });
      
      // User Points (Has 20,000)
      profilesMock.single.mockResolvedValue({
        data: { points: 20000, full_name: 'Test User' }
      });

      // 2. Action
      const result = await joinMatch(mockMatchId, 'FW');

      // 3. Verify
      expect(result.status).toBe('confirmed');
      expect(result.success).toBe(true);

      // Verify Point Deduction (Update on Profiles)
      expect(profilesMock.update).toHaveBeenCalledWith({ points: 10000 }); // 20000 - 10000
      expect(profilesMock.eq).toHaveBeenCalledWith('id', mockUser.id);

      // Verify Transaction Record
      expect(transactionsMock.insert).toHaveBeenCalledWith(expect.objectContaining({
        type: 'use',
        amount: -10000,
        description: '경기 참가'
      }));
    });

    it('Scenario 2: Join with insufficient points -> Pending Payment & No Deduction', async () => {
      participantsMock.single.mockResolvedValue({ data: null });
      matchesMock.single.mockResolvedValue({
        data: { entry_points: 10000, status: 'open', goalie_free: false, id: mockMatchId }
      });
      
      // User Points (Has 5,000 - Insufficient)
      profilesMock.single.mockResolvedValue({
        data: { points: 5000 }
      });

      const result = await joinMatch(mockMatchId, 'FW');

      expect(result.status).toBe('pending_payment');
      
      // Verify NO Point Deduction
      expect(profilesMock.update).not.toHaveBeenCalled();
      
      // Verify NO Transaction Record
      expect(transactionsMock.insert).not.toHaveBeenCalled();
    });

    it('Scenario 3: Goalie Free -> Confirmed (0 Points)', async () => {
      participantsMock.single.mockResolvedValue({ data: null });
      matchesMock.single.mockResolvedValue({
        data: { entry_points: 10000, status: 'open', goalie_free: true, id: mockMatchId, start_time: new Date().toISOString() }
      });
      profilesMock.single.mockResolvedValue({
        data: { points: 0 }
      });

      const result = await joinMatch(mockMatchId, 'G');

      expect(result.status).toBe('confirmed');

      // Verify NO Point Deduction (Free)
      expect(profilesMock.update).not.toHaveBeenCalled();
    });
  });

  describe('Cancel Match Flow', () => {
    it('Scenario 1: Cancel "Waiting" status -> No Refund (The Bug Fix Check)', async () => {
      // User is 'waiting'
      participantsMock.single.mockResolvedValue({
        data: { id: 'p-1', status: 'waiting', position: 'FW' }
      });
      
      // Info: Cost 10,000
      matchesMock.single.mockResolvedValue({
        data: { entry_points: 10000, start_time: '2026-03-01', goalie_free: false }
      });

      const result = await cancelJoin(mockMatchId);

      expect(result.success).toBe(true);
      expect(result.refundAmount).toBe(0); 

      // Verify DELETE
      expect(participantsMock.delete).toHaveBeenCalled();

      // Verify NO Profile Update (Refund)
      expect(profilesMock.update).not.toHaveBeenCalled();
      
      // Verify NO Transaction
      expect(transactionsMock.insert).not.toHaveBeenCalled();
    });

    it('Scenario 2: Cancel "Pending Payment" -> No Refund', async () => {
      participantsMock.single.mockResolvedValue({
        data: { id: 'p-1', status: 'pending_payment', position: 'FW' }
      });
      matchesMock.single.mockResolvedValue({
        data: { entry_points: 10000, start_time: '2026-03-01', goalie_free: false }
      });

      const result = await cancelJoin(mockMatchId);

      expect(result.success).toBe(true);
      expect(profilesMock.update).not.toHaveBeenCalled();
    });

    it('Scenario 3: Cancel Confirmed (Paid) with 100% Refund Policy', async () => {
      participantsMock.single.mockResolvedValue({
        data: { id: 'p-1', status: 'confirmed', position: 'FW' }
      });
      matchesMock.single.mockResolvedValue({
        data: { entry_points: 10000, start_time: '2026-03-01', goalie_free: false }
      });
      profilesMock.single.mockResolvedValue({
        data: { points: 5000 }
      });

      // Mock calculateRefundPercent to return 100
      (calculateRefundPercent as any).mockResolvedValue(100);

      const result = await cancelJoin(mockMatchId);

      expect(result.success).toBe(true);
      expect(result.refundAmount).toBe(10000);

      // Verify Refund Update (5000 + 10000)
      expect(profilesMock.update).toHaveBeenCalledWith({ points: 15000 });

      // Verify Refund Transaction
      expect(transactionsMock.insert).toHaveBeenCalledWith(expect.objectContaining({
        type: 'refund',
        amount: 10000,
        description: expect.stringContaining('100%')
      }));
    });
  });

  describe('Point Charge Flow', () => {
    it('Full Flow: Request -> Confirm by Admin', async () => {
      // 1. Request
      requestsMock.single.mockResolvedValueOnce({ data: null }); // check existing
      
      // Mock Insert Return (for request)
      const mockRequest = { id: 'req-1', amount: 50000, user_id: mockUser.id, status: 'pending' };
      requestsMock.single.mockResolvedValueOnce({ data: mockRequest }); // result of insert().select().single()

      await requestPointCharge(50000, 'Depositor');

      // Verify Insert
      expect(requestsMock.insert).toHaveBeenCalledWith(expect.objectContaining({
        amount: 50000,
        status: 'pending'
      }));

      // 2. Admin Confirm
      // Mock Superuser Check (checks profiles)
      profilesMock.single.mockResolvedValueOnce({ data: { role: 'superuser' } }); 
      
      // Mock Data Fetching inside confirmPointCharge
      requestsMock.single.mockResolvedValueOnce({ data: mockRequest }); // fetch charge request
      profilesMock.single.mockResolvedValueOnce({ data: { points: 1000 } }); // fetch user points before update

      // Execute Confirm
      const confirmResult = await confirmPointCharge('req-1');

      expect(confirmResult.success).toBe(true);

      // Verify Points Added (1000 + 50000)
      expect(profilesMock.update).toHaveBeenCalledWith({ points: 51000 });

      // Verify Request Status Updated
      expect(requestsMock.update).toHaveBeenCalledWith(expect.objectContaining({
        status: 'confirmed'
      }));

      // Verify Transaction Logged
      expect(transactionsMock.insert).toHaveBeenCalledWith(expect.objectContaining({
        type: 'charge',
        amount: 50000
      }));
    });
  });

  describe('Waitlist Promotion Flow', () => {
    it('Scenario: FW Cancel -> DF Waiter Promoted (Skater Pool)', async () => {
      // 1. Setup: FW cancels
      participantsMock.single.mockResolvedValue({
        data: { id: 'p-leaving', status: 'confirmed', position: 'FW' }
      });
      matchesMock.single.mockResolvedValue({
        data: { entry_points: 10000, start_time: new Date().toISOString(), goalie_free: false, rink: { name_ko: 'Test Rink' } }
      });
      profilesMock.single.mockResolvedValue({
        data: { points: 0 } // cancelled user parts
      });
      (calculateRefundPercent as any).mockResolvedValue(100);

      // 2. Setup Promotion Query Mock
      const mockWaiter = { id: 'p-waiter', user_id: 'user-waiter', position: 'DF' };
      
      // Queue responses for participants table:
      // 1st call: find the leaver (cancelJoin)
      // 2nd call: find the waiter (promoteWaitlistUser)
      participantsMock.single
        .mockResolvedValueOnce({ data: { id: 'p-leaving', status: 'confirmed', position: 'FW' } }) 
        .mockResolvedValueOnce({ data: mockWaiter }); 

      // Mock waiter's profile points (for deduction check)
      profilesMock.single
        .mockResolvedValueOnce({ data: { points: 0 } })   // 1. Cancelled user (refund)
        .mockResolvedValueOnce({ data: { points: 20000 } }); // 2. Waiter (promotion)

      // 3. Action
      await cancelJoin(mockMatchId);

      // 4. Verify
      // Verify that the IN filter was used (Skater Pool)
      expect(participantsMock.in).toHaveBeenCalledWith('position', ['FW', 'DF']);
      
      // Verify Waiter Promoted
      expect(participantsMock.update).toHaveBeenCalledWith(expect.objectContaining({
        status: 'confirmed',
        payment_status: true
      }));
      expect(participantsMock.eq).toHaveBeenCalledWith('id', mockWaiter.id);
    });
  });
});
