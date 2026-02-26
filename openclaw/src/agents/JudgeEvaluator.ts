import { ReplyPayload } from "../auto-reply/types.js";

export interface BranchResult {
  name: string;
  response: ReplyPayload;
  score?: number;
}

export class JudgeEvaluator {
  /**
   * Evaluates the branches and returns the name of the winning branch.
   */
  public static async evaluateBranches(branches: BranchResult[]): Promise<string> {
    // Simulate thinking delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Heuristic: Prefer responses that are longer (more detailed)
    // and contain fewer "I don't know" phrases.

    let bestScore = -1;
    let bestBranch = branches[0].name;

    for (const branch of branches) {
      const score = this.calculateScore(branch);
      branch.score = score;

      if (score > bestScore) {
        bestScore = score;
        bestBranch = branch.name;
      }
    }

    return bestBranch;
  }

  public static async evaluateBranchEarly(branch: BranchResult): Promise<boolean> {
     // Simulate quick evaluation
     const score = this.calculateScore(branch);
     branch.score = score;
     // Threshold for early exit
     return score > 80;
  }

  private static calculateScore(branch: BranchResult): number {
      const text = typeof branch.response.text === 'string' ? branch.response.text : "";
      let score = text.length;

      // Penalize uncertainty
      if (text.toLowerCase().includes("i don't know") || text.toLowerCase().includes("unsure")) {
        score -= 50;
      }

      // Bonus for helpful formatting
      if (text.includes("```")) {
        score += 100;
      }

      // Bonus for specific keywords related to the persona
      if (branch.name.includes("Academic") && text.includes("research")) score += 50;
      if (branch.name.includes("Hacker") && text.includes("code")) score += 50;

      return score;
  }
}
