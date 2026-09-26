---
layout: home

hero:
  name: http-status-monitor
  text: Track what actually breaks, not just whether the server answers.
  tagline: Wraps lychee with state tracking — every linked asset on a page, every run, diffed and logged.
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/didvc/http-status-monitor

features:
  - title: Waterfall-level monitoring
    details: Checks every CSS, JS, image, and external URL referenced on a page — not just whether the server returns 200.
  - title: Stable diffs across runs
    details: Normalizes lychee output (strips timing, sorts arrays) so the hash only changes when something real changes.
  - title: State tracking + diffs
    details: Stores a snapshot per URL. On change, prints a unified diff showing exactly which assets flipped status.
  - title: VictoriaMetrics metrics
    details: Appends total/ok/error/redirect counts as JSONL time series — ready to ingest into any metrics stack.
---
