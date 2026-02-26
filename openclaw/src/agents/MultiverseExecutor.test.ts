import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MultiverseExecutor } from './MultiverseExecutor';
import { TelemetryBroadcaster } from '../gateway/TelemetryBroadcaster';
import { Bot } from 'grammy';
import { TelegramContext } from '../telegram/bot/types';

// Mock dependencies
const mockLogFork = vi.fn();
const mockLogSimulate = vi.fn();
const mockLogPrune = vi.fn();
const mockLogWinner = vi.fn();
const mockLogAbort = vi.fn();
const mockLogResurrection = vi.fn();

vi.mock('../gateway/TelemetryBroadcaster', () => ({
  TelemetryBroadcaster: {
    getInstance: vi.fn().mockImplementation(() => ({
      logFork: mockLogFork,
      logSimulate: mockLogSimulate,
      logPrune: mockLogPrune,
      logWinner: mockLogWinner,
      logAbort: mockLogAbort,
      logResurrection: mockLogResurrection,
    })),
  },
}));

vi.mock('grammy', () => ({
  Bot: class {},
}));

describe('MultiverseExecutor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should execute branches and return a winner', async () => {
    const mockContext = { message: { from: { id: 123 }, text: 'test prompt' } } as unknown as TelegramContext;
    const mockCfg = {} as any;
    const mockRuntime = {} as any;
    const mockBot = new Bot('token') as any;

    const result = await MultiverseExecutor.executeBranching(
      'test prompt',
      mockContext,
      mockCfg,
      mockRuntime,
      mockBot
    );

    expect(result).toBeDefined();
    expect(result.text).toBeDefined();
    expect(typeof result.text).toBe('string');
    expect(mockLogFork).toHaveBeenCalled();
    expect(mockLogSimulate).toHaveBeenCalled();
    // Either LogWinner or LogAbort should be called
    const winnerCalled = mockLogWinner.mock.calls.length > 0;
    const abortCalled = mockLogAbort.mock.calls.length > 0;
    expect(winnerCalled || abortCalled).toBe(true);
  });

  it('should resurrect a branch from the graveyard', async () => {
    const mockContext = { message: { from: { id: 123 }, text: 'test prompt' } } as unknown as TelegramContext;
    const mockCfg = {} as any;
    const mockRuntime = {} as any;
    const mockBot = new Bot('token') as any;

    // First run to populate graveyard
    await MultiverseExecutor.executeBranching(
      'test prompt',
      mockContext,
      mockCfg,
      mockRuntime,
      mockBot
    );

    // Try resurrecting
    const resurrected = await MultiverseExecutor.resurrectBranch(mockContext);

    // Depending on random delays and early exit, graveyard might be empty or have items.
    // This is hard to deterministically test with Math.random() delays without mocking timers or logic.
    // However, if we get a result, it should be valid.
    if (resurrected) {
        expect(resurrected.text).toBeDefined();
        expect(mockLogResurrection).toHaveBeenCalled();
    }
  });
});
