# Agent Capture Verification

## Setup

- Tool: Codex desktop app (`codex-cli 0.155.1` supplies the shared local runtime)
- Model: `gpt-5.6-sol`
- Planning and execution: the same `gpt-5.6-sol` model; no separate planner model is configured
- Author: `katareayush`

## Automatic mechanism

Codex project lifecycle hooks are configured in `.codex/hooks.json`. The
`UserPromptSubmit` event automatically sends the verbatim prompt to
`.codex/hooks/capture_turn.py`, and the `Stop` event automatically sends the final
assistant message. The script writes only those two event payloads to `.agent-logs/`,
along with the hook-provided session ID and active model plus a UTC timestamp generated
when each event is handled.

The hook was exercised with Codex's documented one-invocation
`--dangerously-bypass-hook-trust` option after reviewing the project-local hook. This
allowed the two fresh non-interactive sessions below to run the new hook without an
interactive trust prompt.

## Canary log paths

- `.agent-logs/2026-09-21_07-50-37_01a0c2f1-fca1-77f0-9d0c-acd860b0009c.md`
- `.agent-logs/2026-09-21_07-51-08_01a0c2f2-722e-7253-a128-628100650ed4.md`

The differing full session IDs prove that the second canary ran in a new session.

## Raw canary entries

```text
[LOG_ENTRY type=PROMPT num=1 session=01a0c2f1]
timestamp: 2026-09-21T07:50:37.819Z
model: gpt-5.6-sol

CAPTURE TEST — 8x assignment, Ayush

[LOG_ENTRY type=RESPONSE num=1 session=01a0c2f1]
timestamp: 2026-09-21T07:50:45.629Z
model: gpt-5.6-sol

Captured: **8× assignment — Ayush**.
```

```text
[LOG_ENTRY type=PROMPT num=1 session=01a0c2f2]
timestamp: 2026-09-21T07:51:08.160Z
model: gpt-5.6-sol

CAPTURE TEST — 8x assignment, Ayush

[LOG_ENTRY type=RESPONSE num=1 session=01a0c2f2]
timestamp: 2026-09-21T07:51:12.272Z
model: gpt-5.6-sol

Captured: **CAPTURE TEST — 8x assignment, Ayush**.
```

## Earlier attempt or limitation

No alternative capture mechanism was attempted first. The assignment setup message
arrived before the project hook existed, so that initial exchange was not captured and
has not been reconstructed or inserted after the fact. Automatic capture began only
after the hook was installed. The first and second canaries above are the first captured
exchanges.
