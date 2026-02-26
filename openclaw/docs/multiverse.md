# Counterfactual Branching Infrastructure (Multiverse Engine)

## Overview

The **Multiverse Engine** is a groundbreaking feature in OpenClaw that simulates parallel realities for every user interaction. Instead of a linear response, the system forks the conversation into three distinct branches, each with a unique persona/temperament:

1.  **Analytical**: Logical, structured, and data-driven.
2.  **Creative**: Imaginative, artistic, and unconventional.
3.  **Cautious**: Risk-averse, careful, and verification-focused.

These branches execute concurrently. A **Judge Evaluator** then analyzes the outputs and selects the single best response to send back to the user, ensuring the highest quality interaction.

## Architecture

The system consists of four key components:

1.  **Multiverse Executor** (`src/agents/MultiverseExecutor.ts`): Orchestrates the forking, simulation, judging, and pruning process.
2.  **Judge Evaluator** (`src/agents/JudgeEvaluator.ts`): Selects the winning branch based on heuristics (clarity, detail, safety).
3.  **Telemetry Broadcaster** (`src/gateway/TelemetryBroadcaster.ts`): Streams real-time events to the terminal and Web UI via WebSockets.
4.  **Web Visualizer** (`public/index.html`): A live, interactive graph visualization of the branching process.

## Installation

Ensure you have installed the required dependencies:

```bash
pnpm install
```

The new dependencies include:
- `ora`: For elegant terminal spinners.
- `cli-table3`: For formatted console output.
- `ws`: For the WebSocket telemetry server.

## Usage Guide

### 1. Start the Gateway

Launch the OpenClaw gateway as usual:

```bash
pnpm start
```

You will see a green message in the terminal indicating the **Telemetry WebSocket server** has started on port `8080`.

### 2. Open the Web Visualizer

To visualize the Multiverse in real-time:

1.  Navigate to the `public` folder in your repository.
2.  Open `index.html` in your web browser.
    - You can simply drag and drop the file into a browser tab.
    - Or serve it via a local server (e.g., `npx serve public`).

The visualizer will show a "Connected to Multiverse Engine" status when it successfully connects to the WebSocket server.

### 3. Trigger the Multiverse

Interact with your configured **Telegram Bot**. Send any message or prompt.

**Example:**
> "How should I plan my weekend in Berlin?"

### 4. Observe the Magic

#### In the Terminal
You will see a live, color-coded log of the process:
- **Forking**: Creating the 3 parallel realities.
- **Simulating**: A spinner indicating the branches are generating responses.
- **Pruning**: The discarded branches being removed.
- **Winner**: The selected response displayed in a formatted table.

#### In the Web Visualizer
The graph will dynamically animate:
1.  **Root Node**: The starting point.
2.  **Branching**: Three yellow nodes (Analytical, Creative, Cautious) appear.
3.  **Simulation**: Nodes turn purple as they process.
4.  **Pruning**: Losing nodes turn red and fade out.
5.  **Winner**: The winning node turns green and expands.
6.  **Consensus**: A final white node confirms the selection.

## Configuration

The branching logic is currently defined in `src/agents/MultiverseExecutor.ts`. You can modify the branches or the simulation delay there.

The **Judge Evaluator** logic in `src/agents/JudgeEvaluator.ts` can be tweaked to prefer different styles of responses.

## Troubleshooting

- **WebSocket Connection Failed**: Ensure the gateway is running and port `8080` is not blocked.
- **No Response**: Check the terminal logs for errors. The simulation includes a deliberate delay (1-3s) for effect.
