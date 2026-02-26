import { WebSocketServer, WebSocket } from "ws";
import chalk from "chalk";
import ora, { type Ora } from "ora";
// @ts-ignore
import Table from "cli-table3";

interface TelemetryEvent {
  type: "fork" | "simulate" | "prune" | "winner" | "status" | "abort" | "resurrect";
  payload: any;
  timestamp: number;
}

export class TelemetryBroadcaster {
  private static instance: TelemetryBroadcaster;
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();
  private spinner: Ora | null = null;

  private constructor() {
    this.startServer();
  }

  public static getInstance(): TelemetryBroadcaster {
    if (!TelemetryBroadcaster.instance) {
      TelemetryBroadcaster.instance = new TelemetryBroadcaster();
    }
    return TelemetryBroadcaster.instance;
  }

  private startServer() {
    try {
      this.wss = new WebSocketServer({ port: 8080 });
      this.wss.on("connection", (ws) => {
        this.clients.add(ws);
        ws.on("close", () => {
          this.clients.delete(ws);
        });
        // Send initial connection confirmation
        ws.send(JSON.stringify({ type: "connection", status: "connected" }));
      });
      console.log(chalk.green("Telemetry WebSocket server started on port 8080"));
    } catch (error) {
      console.error(chalk.red("Failed to start Telemetry WebSocket server:"), error);
    }
  }

  public broadcast(event: TelemetryEvent) {
    const message = JSON.stringify(event);
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }
  }

  public logFork(count: number, branches: string[]) {
    this.broadcast({
      type: "fork",
      payload: { count, branches },
      timestamp: Date.now(),
    });
    console.log(chalk.cyan(`⚡ FORKING REALITY: ${count} Branches Created (${branches.join(", ")})`));
  }

  public logSimulate(branches: string[]) {
    this.broadcast({
      type: "simulate",
      payload: { branches },
      timestamp: Date.now(),
    });
    console.log(chalk.yellow(`⚙️ SIMULATING: ${branches.join(" | ")}`));
    if (!this.spinner) {
      this.spinner = ora("Simulating parallel realities...").start();
    }
  }

  public logPrune(prunedBranches: string[]) {
    this.broadcast({
      type: "prune",
      payload: { prunedBranches },
      timestamp: Date.now(),
    });
    if (this.spinner) {
      this.spinner.stop();
      this.spinner = null;
    }
    console.log(chalk.red(`❌ PRUNED: ${prunedBranches.join(", ")}`));
  }

  public logAbort(winner: string) {
    this.broadcast({
      type: "abort",
      payload: { winner },
      timestamp: Date.now(),
    });
    if (this.spinner) {
      this.spinner.stop();
      this.spinner = null;
    }
    console.log(chalk.yellow(`🛑 ABORTED_EARLY: Branch ${winner} won; killing others to save latency.`));
  }

  public logResurrection(branchName: string) {
     this.broadcast({
      type: "resurrect",
      payload: { branchName },
      timestamp: Date.now(),
    });
    console.log(chalk.magenta(`🧟 RESURRECTED: Branch ${branchName} pulled from the graveyard.`));
  }

  public logWinner(winner: string, response: string) {
    this.broadcast({
      type: "winner",
      payload: { winner, response },
      timestamp: Date.now(),
    });
    console.log(chalk.green(`✅ COLLAPSED TO WINNER: ${winner}`));

    const table = new Table({
      head: [chalk.green('Winner Branch'), chalk.white('Response Preview')],
      colWidths: [20, 60]
    });
    table.push([winner, response.substring(0, 50) + "..."]);
    console.log(table.toString());
  }
}
