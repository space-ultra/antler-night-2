# Multiverse Engine Architecture (v2)

This document describes the upgraded Counterfactual Branching Infrastructure ("Multiverse Engine"), transforming it from a prototype into an enterprise-grade causal system.

## v1 Recap (The Foundation)

The core mechanic involves intercepting user prompts, forking reality into three parallel branches (Analytical, Creative, Cautious), simulating their outcomes, and using a Judge Evaluator to select the winner. Telemetry is broadcast in real-time via WebSockets to a web visualizer.

## v2 Features: Dynamic, Short-circuiting, and Resurrecting

### 1. Dynamic Mutation (Adaptive Personas)
**Goal:** Replace hardcoded personas with context-aware, dynamically generated temperaments.
**Implementation:**
- A lightweight router analyzes the user's prompt.
- It generates 3 distinct, highly specific system prompts tailored to the problem (e.g., for a coding question: "Senior Architect", "Hacker", "Academic Researcher").
- This ensures the branches explore the most relevant solution space.

### 2. Early-Exit Judge (Latency Optimization)
**Goal:** Reduce latency and cost by not waiting for slow branches.
**Implementation:**
- Branches execute concurrently with an `AbortController`.
- As soon as a branch completes, it is immediately evaluated by the Judge.
- If the confidence score exceeds a threshold (e.g., 90%), the system triggers an `AbortSignal`.
- Pending branches are instantly killed, saving tokens and time.
- Telemetry emits an `ABORTED_EARLY` event.

### 3. The Quantum Graveyard (State Resurrection)
**Goal:** Allow users to explore rejected futures without re-running simulations.
**Implementation:**
- Pruned branches are not deleted but moved to a "Quantum Graveyard" (in-memory cache).
- If the user is unsatisfied (e.g., replies "try another way" or "/alt"), the system intercepts this intent.
- It bypasses the LLM and instantly resurrects the next-best branch from the graveyard.
- Telemetry emits a `RESURRECTED` event.
