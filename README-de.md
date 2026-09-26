[English](README.md) · [日本語](README-ja.md) · [繁體中文](README-zh-TW.md) · [简体中文](README-zh.md) · Deutsch · [Français](README-fr.md)

# http-status-monitor

[![Docs](https://img.shields.io/badge/docs-didvc.github.io%2Fhttp--status--monitor-blue)](https://didvc.github.io/http-status-monitor/)
[![License](https://img.shields.io/badge/License-Apache_2.0-green.svg)](LICENSE)

[Vollständige Dokumentation →](https://didvc.github.io/http-status-monitor/)

Ein CLI-Werkzeug, das [lychee](https://github.com/lycheeverse/lychee) auf eine Liste von URLs anwendet, Änderungen des HTTP-Status über die Zeit verfolgt und Metriken in einem VictoriaMetrics-kompatiblen Format speichert.

Die Grundidee: Oberflächliche „Ist der Server erreichbar?“-Prüfungen übersehen kaputtes CSS, JS mit 404 und tote API-Endpunkte, die lychee findet, weil es jedes verlinkte Asset der Seite prüft. Dieses Werkzeug ergänzt lychee um eine Zustandsverfolgung, sodass du siehst, wann sich irgendetwas ändert, nicht nur, ob der Server antwortet.

## Voraussetzungen

- Node.js 18+ mit [tsx](https://github.com/privatenumber/tsx) (`npm install -g tsx`)
- lychee-Binary: von den [Releases von lycheeverse/lychee](https://github.com/lycheeverse/lychee/releases) herunterladen und unter `./lychee-x86_64-unknown-linux-musl/lychee` ablegen (oder an beliebigem Ort und dann `--lychee-path` angeben)

## Installation

```sh
git clone https://github.com/didvc/http-status-monitor
cd http-status-monitor
npm install
```

lychee herunterladen und ausführbar machen:

```sh
mkdir -p lychee-x86_64-unknown-linux-musl
curl -L https://github.com/lycheeverse/lychee/releases/latest/download/lychee-x86_64-unknown-linux-musl.tar.gz \
  | tar xz -C lychee-x86_64-unknown-linux-musl
```

## Verwendung

```
tsx http-status-monitor.mts [options]
```

### Optionen

| Flag | Standard | Beschreibung |
|---|---|---|
| `--urls-file <path>` | `./urls.txt` | Datei mit einer URL pro Zeile |
| `--urls <url,...>` | - | URLs direkt, durch Kommas getrennt (hat Vorrang vor `--urls-file`) |
| `--lychee-path <path>` | auto | Expliziter Pfad zur lychee-Binary |
| `--verbose`, `-v` | off | lychee-Ausgabe und alle Ergebnisse anzeigen |
| `--diff` | off | Unified Diff ausgeben, wenn sich der Zustand ändert |
| `--interval <secs>` | `3600` | Abfrageintervall im Überwachungsmodus |
| `--once` | off | Einmal ausführen und beenden |
| `--victoriametrics` | off | Metriken an `./data/victoriametrics/[yyyy-mm]/results.jsonl` anhängen |
| `--wait <secs>` | `1` | Pause zwischen aufeinanderfolgenden URL-Prüfungen |

### Beispiele

Erster Lauf (für jede URL wird ein neuer Zustand gespeichert):

```
$ tsx http-status-monitor.mts --once --urls-file ./urls.txt --verbose
lychee: ./lychee-x86_64-unknown-linux-musl/lychee
Checking https://example.com/ ...
[NEW    ] https://example.com/  94ff97988565
Checking https://blog.example.com/ ...
[NEW    ] https://blog.example.com/  c2d3b2b59402
```

Zweiter Lauf (keine Änderungen):

```
$ tsx http-status-monitor.mts --once --urls-file ./urls.txt --verbose
lychee: ./lychee-x86_64-unknown-linux-musl/lychee
Checking https://example.com/ ...
[ok     ] https://example.com/  94ff97988565
```

Eine Änderung mit `--diff` erkennen:

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

URLs direkt angeben:

```
$ tsx http-status-monitor.mts --once --urls "https://example.com/,https://blog.example.com/"
[ok     ] https://example.com/  94ff97988565
[ok     ] https://blog.example.com/  c2d3b2b59402
```

Überwachungsmodus (läuft dauerhaft, pausiert zwischen den Durchläufen):

```
$ tsx http-status-monitor.mts --urls-file ./urls.txt --verbose
...
Sleeping 3600s until next run...
```

Ausgabe für VictoriaMetrics:

```
$ tsx http-status-monitor.mts --once --victoriametrics --urls "https://example.com/"
[ok     ] https://example.com/  94ff97988565

$ cat ./data/victoriametrics/2026-05/results.jsonl
{"metric":{"__name__":"lychee_total","url":"https://example.com/"},"value":13,"timestamp":1746403200000}
{"metric":{"__name__":"lychee_successful","url":"https://example.com/"},"value":12,"timestamp":1746403200000}
{"metric":{"__name__":"lychee_errors","url":"https://example.com/"},"value":0,"timestamp":1746403200000}
...
```

## Funktionsweise

Bei jedem Lauf wird die URL mit `--format json --scheme https --accept 200 --method get` an lychee übergeben. Die JSON-Ausgabe wird normalisiert (dynamische Felder entfernt, Arrays deterministisch sortiert) und gehasht. Der Hash wird mit dem Zustand des vorherigen Laufs verglichen, der unter `./data/state/<url-hash>.json` gespeichert ist.

- `[NEW]`: diese URL wird zum ersten Mal geprüft
- `[ok]`: Hash stimmt mit dem vorherigen Lauf überein
- `[CHANGED]`: Hash weicht ab; mit `--diff` sieht man, was sich geändert hat

Der Normalisierer entfernt Zeitfelder (`span`, `duration`) und sortiert alle Objekt-Arrays nach ihrer JSON-Darstellung, sodass der Hash über mehrere Läufe stabil bleibt, solange sich der eigentliche Inhalt nicht ändert.

## Ebenfalls enthalten

normalize-lychee.mts: eigenständiger Normalisierer. lychee-JSON-Ausgabe hindurchleiten, um eine stabile, kanonische Form zu erhalten:

```sh
./lychee --format json https://example.com/ | tsx normalize-lychee.mts | sha256sum
```

## Lizenz

Apache 2.0

<!-- BEGIN gh-mutual-linking -->

---

### Related projects

- [cf-cache-utils](https://github.com/didvc/cf-cache-utils): CLI to warm and inspect Cloudflare edge cache status across all your URLs, no external dependencies, pure Node.js
<!-- END gh-mutual-linking -->