# Getting Started

## Requirements

- **Node.js** 18+ and [tsx](https://github.com/privatenumber/tsx) (`npm install -g tsx`)
- **lychee** binary from [lycheeverse/lychee releases](https://github.com/lycheeverse/lychee/releases)

## Install

Clone the repo and install Node dependencies:

```sh
git clone https://github.com/didvc/http-status-monitor
cd http-status-monitor
npm install
```

Download the lychee binary for Linux x86_64:

```sh
mkdir -p lychee-x86_64-unknown-linux-musl
curl -L https://github.com/lycheeverse/lychee/releases/latest/download/lychee-x86_64-unknown-linux-musl.tar.gz \
  | tar xz -C lychee-x86_64-unknown-linux-musl
```

The tool looks for lychee at `./lychee-x86_64-unknown-linux-musl/lychee` by default. For other platforms or a system-wide install, pass `--lychee-path /usr/local/bin/lychee`.

## First run

Create a `urls.txt` with one URL per line:

```
https://example.com/
https://blog.example.com/
```

Run once:

```sh
tsx http-status-monitor.mts --once --urls-file ./urls.txt --verbose
```

Output:

```
lychee: ./lychee-x86_64-unknown-linux-musl/lychee
Checking https://example.com/ ...
[NEW    ] https://example.com/  94ff97988565
Checking https://blog.example.com/ ...
[NEW    ] https://blog.example.com/  c2d3b2b59402
```

`NEW` means no previous state exists. The snapshot is saved to `./data/state/`.

## Second run — no changes

```sh
tsx http-status-monitor.mts --once --urls-file ./urls.txt --verbose
```

```
[ok     ] https://example.com/  94ff97988565
[ok     ] https://blog.example.com/  c2d3b2b59402
```

## Detecting a change

Use `--diff` to see exactly what changed when a URL's hash shifts:

```sh
tsx http-status-monitor.mts --once --diff --urls "https://blog.example.com/"
```

```
[CHANGED] https://blog.example.com/  1ed4abbb500c
Index: https://blog.example.com/
===================================================================
--- https://blog.example.com/	previous
+++ https://blog.example.com/	current
@@ -3,7 +3,7 @@
   "error_map": {
     "https://blog.example.com/": [
       {
-        "url": "https://example.com/cdn-cgi/l/email-protection#5137243c",
+        "url": "https://example.com/cdn-cgi/l/email-protection#8bedfee6",
```

## Watch mode

Omit `--once` to run on a loop. Default interval is 3600 seconds:

```sh
tsx http-status-monitor.mts --urls-file ./urls.txt --verbose
```

```
[ok     ] https://example.com/  94ff97988565
Sleeping 3600s until next run...
```

Use `--interval <secs>` to change the polling frequency.
