import { Bot } from "grammy";
import { OpenClawConfig } from "../config/config.js";
import { RuntimeEnv } from "../runtime.js";
import { TelegramContext } from "../telegram/bot/types.js";
import { TelemetryBroadcaster } from "../gateway/TelemetryBroadcaster.js";
import { JudgeEvaluator } from "./JudgeEvaluator.js";
import { ReplyPayload } from "../auto-reply/types.js";

// Key to identify a user's multiverse session
export type GraveyardKey = string;

export class MultiverseExecutor {
  // Quantum Graveyard (Cache of rejected branches)
  private static graveyard: Map<GraveyardKey, { name: string, response: ReplyPayload }[]> = new Map();

  public static async executeBranching(
    prompt: string,
    context: TelegramContext,
    cfg: OpenClawConfig,
    runtime: RuntimeEnv,
    bot: Bot
  ): Promise<ReplyPayload> {
    const telemetry = TelemetryBroadcaster.getInstance();
    const userId = context.message.from?.id.toString() || "unknown";
    const graveyardKey: GraveyardKey = `${userId}:last_multiverse`;

    // --- Feature 1: Dynamic Mutation (Adaptive Personas) ---
    // 1. Analyze prompt and generate personas
    const branches = await this.generateDynamicPersonas(prompt);
    telemetry.logFork(branches.length, branches);

    // --- Feature 2: Early-Exit Judge ---
    // 2. Simulate parallel branches with AbortController
    telemetry.logSimulate(branches);

    const abortController = new AbortController();
    const { signal } = abortController;

    // Execute all branches, but wrapped to handle early exit
    const executions = branches.map(name => this.simulateBranch(name, prompt, signal)
      .then(async (response) => {
        const payload: ReplyPayload = { text: response };
        const branchResult = { name, response: payload };

        // Quick check: Is this result good enough to stop everything else?
        const isGoodEnough = await JudgeEvaluator.evaluateBranchEarly(branchResult);
        if (isGoodEnough && !signal.aborted) {
           abortController.abort(); // Kill other branches!
           telemetry.logAbort(name);
           return { ...branchResult, earlyExit: true };
        }
        return branchResult;
      })
      .catch((err) => {
        if (err.name === 'AbortError') {
           return { name, response: { text: "ABORTED" }, aborted: true };
        }
        return { name, response: { text: "ERROR: " + err.message }, error: true };
      })
    );

    const rawResults = await Promise.all(executions);
    const validResults = rawResults.filter(r => !r.aborted && !r.error);

    // 3. Judge (Final Selection)
    // If we had an early exit, that one is the winner. Otherwise, pick the best.
    let winnerName: string;
    if (validResults.some(r => r.earlyExit)) {
       winnerName = validResults.find(r => r.earlyExit)!.name;
    } else {
       winnerName = await JudgeEvaluator.evaluateBranches(validResults as any);
    }

    const winner = validResults.find(r => r.name === winnerName)!;

    // 4. Prune & Populate Graveyard
    const pruned = branches.filter(b => b !== winnerName);
    telemetry.logPrune(pruned);

    // Store losers in the graveyard for resurrection
    // We filter out aborted ones effectively, though here we might have partials or none if aborted early.
    // If aborted early, we might not have other results. That's the trade-off.
    // However, if we didn't abort, we have full results.
    // For the hackathon, let's assume if we abort, we only have the winner.
    // If we didn't abort, we store the others.
    const losers = validResults.filter(r => r.name !== winnerName);
    if (losers.length > 0) {
       this.graveyard.set(graveyardKey, losers.map(l => ({ name: l.name, response: l.response as ReplyPayload })));
    } else {
       this.graveyard.delete(graveyardKey); // Clear if no alternatives
    }

    const winnerText = typeof winner.response.text === 'string' ? winner.response.text : "";
    telemetry.logWinner(winnerName, winnerText);

    return winner.response as ReplyPayload;
  }

  // --- Feature 3: Quantum Graveyard (Resurrection) ---
  public static async resurrectBranch(
    context: TelegramContext
  ): Promise<ReplyPayload | null> {
    const telemetry = TelemetryBroadcaster.getInstance();
    const userId = context.message.from?.id.toString() || "unknown";
    const graveyardKey: GraveyardKey = `${userId}:last_multiverse`;

    const buried = this.graveyard.get(graveyardKey);
    if (!buried || buried.length === 0) {
      return null;
    }

    // Pop the best available alternative (simply the first one for now, or could re-judge)
    const resurrected = buried.shift()!;
    // Update graveyard
    if (buried.length === 0) {
       this.graveyard.delete(graveyardKey);
    } else {
       this.graveyard.set(graveyardKey, buried);
    }

    telemetry.logResurrection(resurrected.name);
    return resurrected.response;
  }

  private static async generateDynamicPersonas(prompt: string): Promise<string[]> {
    // Mock Router Logic
    const p = prompt.toLowerCase();
    if (p.includes("code") || p.includes("function") || p.includes("bug")) {
      return ["Senior Architect", "Hacker", "Academic Researcher"];
    } else if (p.includes("plan") || p.includes("trip") || p.includes("schedule")) {
      return ["Logistics Expert", "Local Guide", "Budget Analyst"];
    } else {
      return ["Analytical", "Creative", "Cautious"]; // Default fallback
    }
  }

  private static async simulateBranch(name: string, prompt: string, signal: AbortSignal): Promise<string> {
    // Check abort before starting
    if (signal.aborted) throw new DOMException("Aborted", "AbortError");

    // Mock latency (variable to show off Early Exit)
    // If "Hacker", make it fast to trigger early exit often
    let delay = 1000 + Math.random() * 2000;
    if (name === "Hacker") delay = 500;

    // Simulation loop with periodic abort checks
    const steps = 10;
    for (let i = 0; i < steps; i++) {
        if (signal.aborted) throw new DOMException("Aborted", "AbortError");
        await new Promise(resolve => setTimeout(resolve, delay / steps));
    }

    // Mock response based on persona
    if (name === "Senior Architect") {
       return `[Senior Architect]
Subject: ${prompt}
Proposal: Use a microservices pattern with event-driven architecture.
Constraint: Ensure idempotency in message handling.
Code:
\`\`\`typescript
const architecture = "scalable";
\`\`\``;
    } else if (name === "Hacker") {
       return `[Hacker]
Yo, I found a shortcut for "${prompt}".
Just bypass the main loop and inject this payload.
Fastest way to get it done.
\`\`\`bash
rm -rf / --no-preserve-root # just kidding
\`\`\``;
    } else if (name === "Academic Researcher") {
       return `[Academic Researcher]
Abstract: Analysis of "${prompt}".
Methodology: We compared 5 algorithms.
Conclusion: The optimal approach is O(n log n).
Reference: Knuth et al., 1978.`;
    } else if (name === "Logistics Expert") {
       return `[Logistics Expert]
Route optimized.
ETA: 15 mins.
Traffic: Moderate.
Proceed via Main St.`;
    } else if (name === "Local Guide") {
       return `[Local Guide]
Oh, for "${prompt}", you HAVE to check out this hidden gem!
It's off the beaten path but totally worth it. 🌮`;
    } else if (name === "Budget Analyst") {
       return `[Budget Analyst]
Cost projection for "${prompt}":
- Option A: 0
- Option B: 0 (Recommended)
Savings: 60%.`;
    } else if (name === "Analytical") {
      return `[Analytical]
Analyzing "${prompt}".
Logical conclusion: Proceed efficiently.`;
    } else if (name === "Creative") {
      return `[Creative]
"${prompt}" inspired a poem! 🌹
Roses are red, realities are blue...`;
    } else { // Cautious
      return `[Cautious]
Warning: "${prompt}" requires validation.
Safety protocols engaged.`;
    }
  }
}
