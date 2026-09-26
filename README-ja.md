[English](README.md) · 日本語 · [繁體中文](README-zh-TW.md) · [简体中文](README-zh.md) · [Deutsch](README-de.md) · [Français](README-fr.md)

# http-status-monitor

[![Docs](https://img.shields.io/badge/docs-didvc.github.io%2Fhttp--status--monitor-blue)](https://didvc.github.io/http-status-monitor/)
[![License](https://img.shields.io/badge/License-Apache_2.0-green.svg)](LICENSE)

[ドキュメント全文 →](https://didvc.github.io/http-status-monitor/)

URLのリストに対して [lychee](https://github.com/lycheeverse/lychee) を実行し、HTTPステータスの変化を時系列で追跡して、VictoriaMetrics互換の形式でメトリクスを保存するCLIツールです。

基本的な考え方：「サーバーは生きているか？」という表面的なチェックでは、壊れたCSS、404になったJS、応答しないAPIエンドポイントを見逃します。lychee はページからリンクされたすべてのアセットを確認するので、こうした問題も見つけられます。このツールは lychee に状態の追跡を加え、サーバーが応答するかどうかだけでなく、何かが変わったときにそれがわかるようにします。

## 動作要件

- Node.js 18以上と [tsx](https://github.com/privatenumber/tsx)（`npm install -g tsx`）
- lychee のバイナリ：[lycheeverse/lychee のリリース](https://github.com/lycheeverse/lychee/releases)からダウンロードし、`./lychee-x86_64-unknown-linux-musl/lychee` に配置します（任意のパスに置いて `--lychee-path` で指定しても構いません）

## インストール

```sh
git clone https://github.com/didvc/http-status-monitor
cd http-status-monitor
npm install
```

lychee をダウンロードして実行可能にします:

```sh
mkdir -p lychee-x86_64-unknown-linux-musl
curl -L https://github.com/lycheeverse/lychee/releases/latest/download/lychee-x86_64-unknown-linux-musl.tar.gz \
  | tar xz -C lychee-x86_64-unknown-linux-musl
```

## 使い方

```
tsx http-status-monitor.mts [options]
```

### オプション

| フラグ | デフォルト | 説明 |
|---|---|---|
| `--urls-file <path>` | `./urls.txt` | 1行に1つのURLを書いたファイル |
| `--urls <url,...>` | - | カンマ区切りのURLを直接指定（`--urls-file` より優先） |
| `--lychee-path <path>` | auto | lychee バイナリのパスを明示的に指定 |
| `--verbose`, `-v` | off | lychee の出力とすべての結果を表示 |
| `--diff` | off | 状態が変わったときに unified diff を表示 |
| `--interval <secs>` | `3600` | 監視モードでのポーリング間隔 |
| `--once` | off | 1回だけ実行して終了 |
| `--victoriametrics` | off | メトリクスを `./data/victoriametrics/[yyyy-mm]/results.jsonl` に追記 |
| `--wait <secs>` | `1` | 連続するURLチェックの間隔 |

### 例

初回の実行（各URLの新しい状態を記録）:

```
$ tsx http-status-monitor.mts --once --urls-file ./urls.txt --verbose
lychee: ./lychee-x86_64-unknown-linux-musl/lychee
Checking https://example.com/ ...
[NEW    ] https://example.com/  94ff97988565
Checking https://blog.example.com/ ...
[NEW    ] https://blog.example.com/  c2d3b2b59402
```

2回目の実行（変化なし）:

```
$ tsx http-status-monitor.mts --once --urls-file ./urls.txt --verbose
lychee: ./lychee-x86_64-unknown-linux-musl/lychee
Checking https://example.com/ ...
[ok     ] https://example.com/  94ff97988565
```

`--diff` で変化を検出:

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

URLを直接指定:

```
$ tsx http-status-monitor.mts --once --urls "https://example.com/,https://blog.example.com/"
[ok     ] https://example.com/  94ff97988565
[ok     ] https://blog.example.com/  c2d3b2b59402
```

監視モード（永続的に実行し、各サイクルの間は待機）:

```
$ tsx http-status-monitor.mts --urls-file ./urls.txt --verbose
...
Sleeping 3600s until next run...
```

VictoriaMetrics への出力:

```
$ tsx http-status-monitor.mts --once --victoriametrics --urls "https://example.com/"
[ok     ] https://example.com/  94ff97988565

$ cat ./data/victoriametrics/2026-05/results.jsonl
{"metric":{"__name__":"lychee_total","url":"https://example.com/"},"value":13,"timestamp":1746403200000}
{"metric":{"__name__":"lychee_successful","url":"https://example.com/"},"value":12,"timestamp":1746403200000}
{"metric":{"__name__":"lychee_errors","url":"https://example.com/"},"value":0,"timestamp":1746403200000}
...
```

## 仕組み

各実行では、URLを `--format json --scheme https --accept 200 --method get` 付きで lychee に渡します。JSON出力は正規化（動的なフィールドを除去し、配列を決定的な順序に並べ替え）されてからハッシュ化されます。このハッシュを、`./data/state/<url-hash>.json` に保存された前回の状態と比較します。

- `[NEW]`：このURLを初めてチェックした
- `[ok]`：ハッシュが前回と一致
- `[CHANGED]`：ハッシュが異なる。`--diff` で変更点を確認できます

正規化ではタイミング系のフィールド（`span`、`duration`）を取り除き、すべてのオブジェクト配列をJSON表現で並べ替えます。そのため、実際の内容が変わっていなければ、ハッシュは実行をまたいで安定します。

## 同梱ツール

normalize-lychee.mts：単体で使える正規化ツール。lychee のJSON出力をパイプで通すと、安定した正規形が得られます:

```sh
./lychee --format json https://example.com/ | tsx normalize-lychee.mts | sha256sum
```

## ライセンス

Apache 2.0

<!-- BEGIN gh-mutual-linking -->

---

### Related projects

- [cf-cache-utils](https://github.com/didvc/cf-cache-utils): CLI to warm and inspect Cloudflare edge cache status across all your URLs, no external dependencies, pure Node.js
<!-- END gh-mutual-linking -->