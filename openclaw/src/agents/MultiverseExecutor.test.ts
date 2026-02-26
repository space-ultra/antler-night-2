import { describe, it, expect, vi } from 'vitest';
import { MultiverseExecutor } from './MultiverseExecutor';
import { TelemetryBroadcaster } from '../gateway/TelemetryBroadcaster';
import { Bot } from 'grammy';
import { TelegramContext } from '../telegram/bot/types';

// Mock dependencies
vi.mock('../gateway/TelemetryBroadcaster', () => ({
  TelemetryBroadcaster: {
    getInstance: vi.fn().mockReturnValue({
      logFork: vi.fn(),
      logSimulate: vi.fn(),
      logPrune: vi.fn(),
      logWinner: vi.fn(),
    }),
  },
}));

vi.mock('grammy', () => ({
  Bot: class {},
}));

describe('MultiverseExecutor', () => {
  it('should execute branches and return a winner', async () => {
    const mockContext = { message: { text: 'test prompt' } } as unknown as TelegramContext;
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
  });
});
