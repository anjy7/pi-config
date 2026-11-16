# pi-config

Personal global [Pi](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) coding agent configuration — settings, extensions, and skills.

## Setup

```bash
mkdir -p ~/.pi
git clone https://github.com/anjy7/pi-config.git ~/.pi/agent
cd ~/.pi/agent && ./setup.sh
```

Add provider credentials to `~/.pi/agent/auth.json` and restart Pi.

## Repository Layout

| Path | Purpose |
| --- | --- |
| `settings.json` | Global Pi configuration and default models |
| `extensions/ask-user-question.ts` | Interactive `ask_user_question` tool |
| `extensions/bash-guard/` | Bash command safety guard extension |
| `extensions/browser/` | Browser automation & debugging tools |
| `extensions/custom-header.ts` | Custom TUI header |
| `extensions/interactive-subagents/` | Multiplexer-backed subagent orchestration (`subagent`, `subagent_resume`, `subagent_interrupt`, `subagents_list`) |
| `extensions/observational-memory/` | Observational memory observer & consolidator hooks |
| `extensions/prompt-snippets/` | Reusable prompt snippets |
| `extensions/web-fetch/` | Readability + Turndown `web_fetch` tool |
| `extensions/web-search/` | Google Custom Search `web_search` tool |
| `skills/analyze-sessions/` | Session history & cost analysis skill |
| `skills/pdf-reader/` | PDF extraction, rendering, and search skill |
| `skills/web-debug/` | Live frontend debugging workflow skill |
| `skills/youtube-transcript/` | YouTube transcript fetching skill |

## Update

```bash
cd ~/.pi/agent
git pull
./setup.sh
```
