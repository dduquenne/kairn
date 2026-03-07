/**
 * QStash Client Tests
 *
 * Tests for the QStash scheduling client including:
 * - Client creation and singleton management
 * - Post scheduling
 * - Recurring schedule management
 * - Delayed task publishing
 * - Schedule CRUD operations
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const {
  mockPublishJSON,
  mockSchedulesCreate,
  mockSchedulesDelete,
  mockSchedulesList,
  mockSchedulesGet,
  mockSchedulesPause,
  mockSchedulesResume,
  mockMessagesDelete,
} = vi.hoisted(() => ({
  mockPublishJSON: vi.fn().mockResolvedValue({ messageId: 'msg-123' }),
  mockSchedulesCreate: vi.fn().mockResolvedValue({ scheduleId: 'sched-123' }),
  mockSchedulesDelete: vi.fn().mockResolvedValue(undefined),
  mockSchedulesList: vi.fn().mockResolvedValue([]),
  mockSchedulesGet: vi.fn().mockResolvedValue({
    scheduleId: 'sched-123',
    cron: '*/5 * * * *',
    destination: 'https://example.com',
    createdAt: 1700000000,
    isPaused: false,
  }),
  mockSchedulesPause: vi.fn().mockResolvedValue(undefined),
  mockSchedulesResume: vi.fn().mockResolvedValue(undefined),
  mockMessagesDelete: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@upstash/qstash', () => {
  // Use a class-like function so `new Client()` returns the mocked shape
  function MockClient() {
    return {
      publishJSON: mockPublishJSON,
      schedules: {
        create: mockSchedulesCreate,
        delete: mockSchedulesDelete,
        list: mockSchedulesList,
        get: mockSchedulesGet,
        pause: mockSchedulesPause,
        resume: mockSchedulesResume,
      },
      messages: {
        delete: mockMessagesDelete,
      },
    };
  }
  return { Client: MockClient };
});

import {
  createQStashClient,
  getQStashClient,
  resetQStashClient,
  schedulePost,
  scheduleRecurring,
  publishDelayed,
  cancelMessage,
  deleteSchedule,
  listSchedules,
  getSchedule,
  pauseSchedule,
  resumeSchedule,
} from '../scheduler/qstash-client';

const originalEnv = { ...process.env };

beforeEach(() => {
  process.env = { ...originalEnv };
  process.env.QSTASH_TOKEN = 'test-token';
  resetQStashClient();
  // Reset individual mocks and restore default implementations
  mockPublishJSON.mockReset().mockResolvedValue({ messageId: 'msg-123' });
  mockSchedulesCreate.mockReset().mockResolvedValue({ scheduleId: 'sched-123' });
  mockSchedulesDelete.mockReset().mockResolvedValue(undefined);
  mockSchedulesList.mockReset().mockResolvedValue([]);
  mockSchedulesGet.mockReset().mockResolvedValue({
    scheduleId: 'sched-123',
    cron: '*/5 * * * *',
    destination: 'https://example.com',
    createdAt: 1700000000,
    isPaused: false,
  });
  mockSchedulesPause.mockReset().mockResolvedValue(undefined);
  mockSchedulesResume.mockReset().mockResolvedValue(undefined);
  mockMessagesDelete.mockReset().mockResolvedValue(undefined);
});

afterEach(() => {
  process.env = originalEnv;
});

// =============================================================================
// createQStashClient
// =============================================================================

describe('createQStashClient', () => {
  it('should create a client with env token', () => {
    const client = createQStashClient();
    expect(client).toBeDefined();
  });

  it('should create a client with provided token', () => {
    delete process.env.QSTASH_TOKEN;
    const client = createQStashClient({ token: 'custom-token' });
    expect(client).toBeDefined();
  });

  it('should throw when no token is available', () => {
    delete process.env.QSTASH_TOKEN;
    expect(() => createQStashClient()).toThrow('QSTASH_TOKEN is required');
  });
});

// =============================================================================
// Singleton management
// =============================================================================

describe('getQStashClient / resetQStashClient', () => {
  it('should return the same instance on multiple calls', () => {
    const client1 = getQStashClient();
    const client2 = getQStashClient();
    expect(client1).toBe(client2);
  });

  it('should return a new instance after reset', () => {
    const client1 = getQStashClient();
    resetQStashClient();
    const client2 = getQStashClient();
    expect(client1).not.toBe(client2);
  });
});

// =============================================================================
// schedulePost
// =============================================================================

describe('schedulePost', () => {
  it('should schedule a post for publication', async () => {
    const scheduledAt = new Date('2025-06-15T09:00:00Z');
    const result = await schedulePost('post-1', scheduledAt, 'https://example.com');

    expect(result.messageId).toBe('msg-123');
    expect(result.destination).toBe('https://example.com/api/social/posts/post-1/publish');
    expect(result.scheduledAt).toEqual(scheduledAt);

    expect(mockPublishJSON).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://example.com/api/social/posts/post-1/publish',
        notBefore: Math.floor(scheduledAt.getTime() / 1000),
        retries: 3,
      })
    );
  });
});

// =============================================================================
// scheduleRecurring
// =============================================================================

describe('scheduleRecurring', () => {
  it('should create a recurring schedule', async () => {
    const result = await scheduleRecurring({
      destination: 'https://example.com/api/cron/social-publish',
      cron: '*/5 * * * *',
    });

    expect(result.scheduleId).toBe('sched-123');
    expect(result.cron).toBe('*/5 * * * *');
    expect(result.destination).toBe('https://example.com/api/cron/social-publish');
  });

  it('should stringify object body', async () => {
    await scheduleRecurring({
      destination: 'https://example.com/api/cron/test',
      cron: '0 * * * *',
      body: { key: 'value' },
    });

    expect(mockSchedulesCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        body: JSON.stringify({ key: 'value' }),
      })
    );
  });

  it('should pass string body directly', async () => {
    await scheduleRecurring({
      destination: 'https://example.com/api/cron/test',
      cron: '0 * * * *',
      body: 'raw-body',
    });

    expect(mockSchedulesCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        body: 'raw-body',
      })
    );
  });

  it('should pass optional config fields', async () => {
    await scheduleRecurring({
      destination: 'https://example.com/api/cron/test',
      cron: '0 * * * *',
      retries: 5,
      headers: { 'X-Custom': 'value' },
      callback: 'https://example.com/callback',
      failureCallback: 'https://example.com/failure',
    });

    expect(mockSchedulesCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        retries: 5,
        headers: { 'X-Custom': 'value' },
        callback: 'https://example.com/callback',
        failureCallback: 'https://example.com/failure',
      })
    );
  });
});

// =============================================================================
// publishDelayed
// =============================================================================

describe('publishDelayed', () => {
  it('should publish with notBefore from Date', async () => {
    const notBefore = new Date('2025-06-15T09:00:00Z');
    const result = await publishDelayed({
      destination: 'https://example.com/api/task',
      notBefore,
    });

    expect(result.messageId).toBe('msg-123');
    expect(result.scheduledAt).toEqual(notBefore);
    expect(mockPublishJSON).toHaveBeenCalledWith(
      expect.objectContaining({
        notBefore: Math.floor(notBefore.getTime() / 1000),
      })
    );
  });

  it('should publish with notBefore from Unix timestamp', async () => {
    const timestamp = 1718442000; // Unix timestamp
    await publishDelayed({
      destination: 'https://example.com/api/task',
      notBefore: timestamp,
    });

    expect(mockPublishJSON).toHaveBeenCalledWith(
      expect.objectContaining({
        notBefore: timestamp,
      })
    );
  });

  it('should calculate notBefore from delay in seconds', async () => {
    const before = Math.floor(Date.now() / 1000);
    await publishDelayed({
      destination: 'https://example.com/api/task',
      delay: 300, // 5 minutes
    });

    const call = mockPublishJSON.mock.calls[0][0];
    expect(call.notBefore).toBeGreaterThanOrEqual(before + 300);
  });

  it('should pass deduplicationId', async () => {
    await publishDelayed({
      destination: 'https://example.com/api/task',
      deduplicationId: 'dedup-123',
    });

    expect(mockPublishJSON).toHaveBeenCalledWith(
      expect.objectContaining({
        deduplicationId: 'dedup-123',
      })
    );
  });
});

// =============================================================================
// Schedule management
// =============================================================================

describe('cancelMessage', () => {
  it('should delete a message by ID', async () => {
    await cancelMessage('msg-456');
    expect(mockMessagesDelete).toHaveBeenCalledWith('msg-456');
  });
});

describe('deleteSchedule', () => {
  it('should delete a schedule by ID', async () => {
    await deleteSchedule('sched-456');
    expect(mockSchedulesDelete).toHaveBeenCalledWith('sched-456');
  });
});

describe('listSchedules', () => {
  it('should return mapped schedule list', async () => {
    mockSchedulesList.mockResolvedValueOnce([
      {
        scheduleId: 'sched-1',
        cron: '*/5 * * * *',
        destination: 'https://example.com/api/cron/a',
        createdAt: 1700000000,
      },
      {
        scheduleId: 'sched-2',
        cron: '0 * * * *',
        destination: 'https://example.com/api/cron/b',
        createdAt: 1700000001,
      },
    ]);

    const schedules = await listSchedules();

    expect(schedules).toHaveLength(2);
    expect(schedules[0]).toEqual({
      scheduleId: 'sched-1',
      cron: '*/5 * * * *',
      destination: 'https://example.com/api/cron/a',
      createdAt: 1700000000,
    });
  });
});

describe('getSchedule', () => {
  it('should return schedule details', async () => {
    const schedule = await getSchedule('sched-123');

    expect(schedule).toEqual({
      scheduleId: 'sched-123',
      cron: '*/5 * * * *',
      destination: 'https://example.com',
      createdAt: 1700000000,
      isPaused: false,
    });
  });

  it('should return null when schedule not found', async () => {
    mockSchedulesGet.mockRejectedValueOnce(new Error('Not found'));

    const schedule = await getSchedule('nonexistent');

    expect(schedule).toBeNull();
  });
});

describe('pauseSchedule', () => {
  it('should pause a schedule', async () => {
    await pauseSchedule('sched-123');
    expect(mockSchedulesPause).toHaveBeenCalledWith({ schedule: 'sched-123' });
  });
});

describe('resumeSchedule', () => {
  it('should resume a schedule', async () => {
    await resumeSchedule('sched-123');
    expect(mockSchedulesResume).toHaveBeenCalledWith({ schedule: 'sched-123' });
  });
});
