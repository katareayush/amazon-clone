#!/usr/bin/env python3
"""Append only user prompts and final assistant responses to a session log."""

from __future__ import annotations

import datetime as dt
import fcntl
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile


AUTHOR = "katareayush"
TOOL = "codex-desktop"


def utc_now() -> str:
    return dt.datetime.now(dt.timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def git_root(cwd: str) -> Path:
    result = subprocess.run(
        ["git", "-C", cwd, "rev-parse", "--show-toplevel"],
        check=True,
        capture_output=True,
        text=True,
    )
    return Path(result.stdout.strip())


def first_timestamp_path(log_dir: Path, session_id: str, timestamp: str) -> Path:
    stamp = timestamp[:19].replace("T", "_").replace(":", "-")
    return log_dir / f"{stamp}_{session_id}.md"


def find_log(log_dir: Path, session_id: str) -> Path | None:
    matches = sorted(log_dir.glob(f"*_{session_id}.md"))
    return matches[0] if matches else None


def render_header(
    session_id: str,
    date: str,
    model: str,
    project: str,
    count: int,
    first_prompt_time: str,
    last_prompt_time: str,
) -> str:
    return (
        "---\n"
        f"session_id: {session_id}\n"
        f"date: {date}\n"
        f"author: {AUTHOR}\n"
        f"model: {model}\n"
        f"tool: {TOOL}\n"
        f"project: {project}\n"
        f"total_exchanges: {count}\n"
        f"first_prompt_time: {first_prompt_time}\n"
        f"last_prompt_time: {last_prompt_time}\n"
        "---\n\n"
        f"# Session Log - {date}\n\n"
        f"Session: `{session_id[:8]}` | Project: `{project}` | Author: `{AUTHOR}`\n\n"
        "---\n"
    )


def split_header(text: str) -> tuple[str, str]:
    marker = "\n---\n"
    end = text.find(marker, 4)
    if not text.startswith("---\n") or end == -1:
        raise ValueError("capture log has an invalid header")
    body_start = text.find("\n---\n", end + len(marker))
    if body_start == -1:
        raise ValueError("capture log is missing its session divider")
    return text[: body_start + len(marker)], text[body_start + len(marker) :]


def prompt_times(header: str) -> tuple[str, str]:
    values: dict[str, str] = {}
    for line in header.splitlines():
        if ": " in line:
            key, value = line.split(": ", 1)
            values[key] = value
    return values["first_prompt_time"], values["date"]


def write_atomic(path: Path, content: str) -> None:
    fd, temp_name = tempfile.mkstemp(prefix=f".{path.name}.", dir=path.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as handle:
            handle.write(content)
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temp_name, path)
    finally:
        if os.path.exists(temp_name):
            os.unlink(temp_name)


def main() -> int:
    event = json.load(sys.stdin)
    event_name = event.get("hook_event_name")
    if event_name not in {"UserPromptSubmit", "Stop"}:
        return 0

    session_id = str(event["session_id"])
    model = str(event.get("model") or "unknown")
    root = git_root(str(event.get("cwd") or os.getcwd()))
    project = root.name
    log_dir = root / ".agent-logs"
    log_dir.mkdir(parents=True, exist_ok=True)
    timestamp = utc_now()

    lock_path = root / ".git" / "agent-capture.lock"
    with lock_path.open("a", encoding="utf-8") as lock:
        fcntl.flock(lock.fileno(), fcntl.LOCK_EX)
        path = find_log(log_dir, session_id)

        if event_name == "UserPromptSubmit":
            prompt = event.get("prompt")
            if not isinstance(prompt, str):
                raise ValueError("UserPromptSubmit did not include a string prompt")
            if path is None:
                path = first_timestamp_path(log_dir, session_id, timestamp)
                date = timestamp[:10]
                header = render_header(session_id, date, model, project, 1, timestamp, timestamp)
                body = ""
                number = 1
            else:
                current = path.read_text(encoding="utf-8")
                old_header, body = split_header(current)
                first_prompt_time, date = prompt_times(old_header)
                number = body.count("[LOG_ENTRY type=PROMPT ") + 1
                header = render_header(
                    session_id, date, model, project, number, first_prompt_time, timestamp
                )
            entry = (
                f"\n[LOG_ENTRY type=PROMPT num={number} session={session_id[:8]}]\n"
                f"timestamp: {timestamp}\n"
                f"model: {model}\n\n"
                f"{prompt}\n"
            )
            write_atomic(path, header + body + entry)
            return 0

        response = event.get("last_assistant_message")
        if not isinstance(response, str):
            raise ValueError("Stop did not include a string last_assistant_message")
        if path is None:
            raise ValueError("Stop arrived before a captured prompt")
        current = path.read_text(encoding="utf-8")
        number = current.count("[LOG_ENTRY type=RESPONSE ") + 1
        entry = (
            f"\n[LOG_ENTRY type=RESPONSE num={number} session={session_id[:8]}]\n"
            f"timestamp: {timestamp}\n"
            f"model: {model}\n\n"
            f"{response}\n"
        )
        with path.open("a", encoding="utf-8") as handle:
            handle.write(entry)

    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"capture hook failed: {exc}", file=sys.stderr)
        raise SystemExit(1)
