# Contributing

## Setup

```sh
git clone https://github.com/didvc/http-status-monitor
cd http-status-monitor
npm install
```

You'll also need a lychee binary — see the README for download instructions.

## Running

```sh
tsx http-status-monitor.mts --once --urls "https://example.com/" --verbose
```

## Code structure

- `http-status-monitor.mts` — main CLI, argument parsing, state management, VictoriaMetrics output
- `normalize-lychee.mts` — standalone normalizer for lychee JSON output

## Pull requests

- Keep changes focused. One thing per PR.
- If you're fixing a bug, include the command that reproduces it and confirm it's fixed.
- If you're adding a flag or behavior, update the README usage table and add an example to `examples.md`.

## Issues

Use the bug report or feature request templates. Include the lychee version (`./lychee --version`) and Node.js version (`node --version`) in bug reports.
