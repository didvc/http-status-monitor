English · [日本語](README-ja.md) · [繁體中文](README-zh-TW.md) · [简体中文](README-zh.md) · [Deutsch](README-de.md) · [Français](README-fr.md)

# http-status-monitor

[![Docs](https://img.shields.io/badge/docs-didvc.github.io%2Fhttp--status--monitor-blue)](https://didvc.github.io/http-status-monitor/)
[![License](https://img.shields.io/badge/License-Apache_2.0-green.svg)](LICENSE)

[Full documentation →](https://didvc.github.io/http-status-monitor/)

A CLI tool that runs [lychee](https://github.com/lycheeverse/lychee) against a list of URLs, tracks changes in HTTP status over time, and stores metrics in a VictoriaMetrics-compatible format.

The core idea: shallow "is the server up?" checks miss broken CSS, 404'd JS, and dead API endpoints that lychee catches by checking every linked asset on the page. This tool wraps lychee with state tracking so you can see when anything changes, not just whether the server responds.

![didvc/http-status-monitor](assets/social-preview.png)

## Requirements

- Node.js 18+ with [tsx](https://github.com/privatenumber/tsx) (`npm install -g tsx`)
- lychee binary: download from [lycheeverse/lychee releases](https://github.com/lycheeverse/lychee/releases) and place at `./lychee-x86_64-unknown-linux-musl/lychee` (or any path, then pass `--lychee-path`)

## Install

```sh
git clone https://github.com/didvc/http-status-monitor
cd http-status-monitor
npm install
```

Download lychee and make it executable:

```sh
mkdir -p lychee-x86_64-unknown-linux-musl
curl -L https://github.com/lycheeverse/lychee/releases/latest/download/lychee-x86_64-unknown-linux-musl.tar.gz \
  | tar xz -C lychee-x86_64-unknown-linux-musl
```

## Usage

```
tsx http-status-monitor.mts [options]
```

### Options

| Flag | Default | Description |
|---|---|---|
| `--urls-file <path>` | `./urls.txt` | File with one URL per line |
| `--urls <url,...>` | - | Inline comma-separated URLs (overrides `--urls-file`) |
| `--lychee-path <path>` | auto | Explicit lychee binary path |
| `--verbose`, `-v` | off | Show lychee output and all results |
| `--diff` | off | Print unified diff when state changes |
| `--interval <secs>` | `3600` | Poll interval in watch mode |
| `--once` | off | Single run then exit |
| `--victoriametrics` | off | Append metrics to `./data/victoriametrics/[yyyy-mm]/results.jsonl` |
| `--wait <secs>` | `1` | Delay between consecutive URL checks |

### Examples

First run (new state recorded for each URL):

```
$ tsx http-status-monitor.mts --once --urls-file ./urls.txt --verbose
lychee: ./lychee-x86_64-unknown-linux-musl/lychee
Checking https://example.com/ ...
[NEW    ] https://example.com/  94ff97988565
Checking https://blog.example.com/ ...
[NEW    ] https://blog.example.com/  c2d3b2b59402
```

Second run (no changes):

```
$ tsx http-status-monitor.mts --once --urls-file ./urls.txt --verbose
lychee: ./lychee-x86_64-unknown-linux-musl/lychee
Checking https://example.com/ ...
[ok     ] https://example.com/  94ff97988565
```

Detect a change with `--diff`:

```
$ tsx http-status-monitor.mts --once --diff --urls "https://blog.example.com/"
[CHANGED] https://blog.example.com/  1ed4abbb500c
Index: https://blog.example.com/
===================================================================
--- https://blog.example.com/	previous
+++ https://blog.example.com/	current
@@ -3,7 +3,7 @@
   "error_map": {
     "https://blog.example.com/": [
       {
-        "url": "https://example.com/cdn-cgi/l/email-protection#5137243c382830",
+        "url": "https://example.com/cdn-cgi/l/email-protection#8bedfee6e2f2ea",
```

Inline URLs:

```
$ tsx http-status-monitor.mts --once --urls "https://example.com/,https://blog.example.com/"
[ok     ] https://example.com/  94ff97988565
[ok     ] https://blog.example.com/  c2d3b2b59402
```

Watch mode (runs forever, sleeps between each cycle):

```
$ tsx http-status-monitor.mts --urls-file ./urls.txt --verbose
...
Sleeping 3600s until next run...
```

VictoriaMetrics output:

```
$ tsx http-status-monitor.mts --once --victoriametrics --urls "https://example.com/"
[ok     ] https://example.com/  94ff97988565

$ cat ./data/victoriametrics/2026-05/results.jsonl
{"metric":{"__name__":"lychee_total","url":"https://example.com/"},"value":13,"timestamp":1746403200000}
{"metric":{"__name__":"lychee_successful","url":"https://example.com/"},"value":12,"timestamp":1746403200000}
{"metric":{"__name__":"lychee_errors","url":"https://example.com/"},"value":0,"timestamp":1746403200000}
...
```

## How it works

Each run passes the URL to lychee with `--format json --scheme https --accept 200 --method get`. The JSON output is normalized (dynamic fields stripped, arrays sorted deterministically) and hashed. The hash is compared against the previous run's state stored at `./data/state/<url-hash>.json`.

- `[NEW]`: first time this URL has been checked
- `[ok]`: hash matches previous run
- `[CHANGED]`: hash differs; use `--diff` to see what changed

The normalizer removes timing fields (`span`, `duration`) and sorts all object arrays by their JSON representation, so the hash is stable across runs when the actual content hasn't changed.

## Also included

normalize-lychee.mts: standalone normalizer. Pipe lychee JSON output through it to get a stable canonical form:

```sh
./lychee --format json https://example.com/ | tsx normalize-lychee.mts | sha256sum
```

## License

Apache 2.0

<!-- BEGIN gh-mutual-linking -->

---

### Related projects

- [cf-cache-utils](https://github.com/didvc/cf-cache-utils): CLI to warm and inspect Cloudflare edge cache status across all your URLs, no external dependencies, pure Node.js
<!-- END gh-mutual-linking -->