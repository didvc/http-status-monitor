[English](README.md) · [日本語](README-ja.md) · 繁體中文 · [简体中文](README-zh.md) · [Deutsch](README-de.md) · [Français](README-fr.md)

# http-status-monitor

[![Docs](https://img.shields.io/badge/docs-didvc.github.io%2Fhttp--status--monitor-blue)](https://didvc.github.io/http-status-monitor/)
[![License](https://img.shields.io/badge/License-Apache_2.0-green.svg)](LICENSE)

[完整文件 →](https://didvc.github.io/http-status-monitor/)

一個命令列工具，會對一組 URL 執行 [lychee](https://github.com/lycheeverse/lychee)，追蹤 HTTP 狀態隨時間的變化，並以 VictoriaMetrics 相容的格式儲存指標。

核心想法：「伺服器還活著嗎？」這種淺層檢查，會漏掉壞掉的 CSS、404 的 JS 與失效的 API 端點；lychee 會檢查頁面上連結的每一項資源，所以能抓到這些問題。本工具為 lychee 加上狀態追蹤，讓你不只知道伺服器是否回應，也能在任何東西改變時察覺。

![didvc/http-status-monitor](assets/social-preview.png)

## 需求

- Node.js 18 以上，以及 [tsx](https://github.com/privatenumber/tsx)（`npm install -g tsx`）
- lychee 執行檔：從 [lycheeverse/lychee 的發行版](https://github.com/lycheeverse/lychee/releases)下載，放在 `./lychee-x86_64-unknown-linux-musl/lychee`（或任何路徑，再用 `--lychee-path` 指定）

## 安裝

```sh
git clone https://github.com/didvc/http-status-monitor
cd http-status-monitor
npm install
```

下載 lychee 並設為可執行：

```sh
mkdir -p lychee-x86_64-unknown-linux-musl
curl -L https://github.com/lycheeverse/lychee/releases/latest/download/lychee-x86_64-unknown-linux-musl.tar.gz \
  | tar xz -C lychee-x86_64-unknown-linux-musl
```

## 使用方式

```
tsx http-status-monitor.mts [options]
```

### 選項

| 旗標 | 預設值 | 說明 |
|---|---|---|
| `--urls-file <path>` | `./urls.txt` | 每行一個 URL 的檔案 |
| `--urls <url,...>` | - | 以逗號分隔直接指定 URL（優先於 `--urls-file`） |
| `--lychee-path <path>` | auto | 明確指定 lychee 執行檔路徑 |
| `--verbose`, `-v` | off | 顯示 lychee 輸出與所有結果 |
| `--diff` | off | 狀態改變時印出 unified diff |
| `--interval <secs>` | `3600` | 監看模式的輪詢間隔 |
| `--once` | off | 只執行一次後結束 |
| `--victoriametrics` | off | 將指標附加到 `./data/victoriametrics/[yyyy-mm]/results.jsonl` |
| `--wait <secs>` | `1` | 連續 URL 檢查之間的延遲 |

### 範例

第一次執行（為每個 URL 記錄新狀態）：

```
$ tsx http-status-monitor.mts --once --urls-file ./urls.txt --verbose
lychee: ./lychee-x86_64-unknown-linux-musl/lychee
Checking https://example.com/ ...
[NEW    ] https://example.com/  94ff97988565
Checking https://blog.example.com/ ...
[NEW    ] https://blog.example.com/  c2d3b2b59402
```

第二次執行（沒有變化）：

```
$ tsx http-status-monitor.mts --once --urls-file ./urls.txt --verbose
lychee: ./lychee-x86_64-unknown-linux-musl/lychee
Checking https://example.com/ ...
[ok     ] https://example.com/  94ff97988565
```

用 `--diff` 偵測變化：

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

直接指定 URL：

```
$ tsx http-status-monitor.mts --once --urls "https://example.com/,https://blog.example.com/"
[ok     ] https://example.com/  94ff97988565
[ok     ] https://blog.example.com/  c2d3b2b59402
```

監看模式（持續執行，每輪之間等待）：

```
$ tsx http-status-monitor.mts --urls-file ./urls.txt --verbose
...
Sleeping 3600s until next run...
```

VictoriaMetrics 輸出：

```
$ tsx http-status-monitor.mts --once --victoriametrics --urls "https://example.com/"
[ok     ] https://example.com/  94ff97988565

$ cat ./data/victoriametrics/2026-05/results.jsonl
{"metric":{"__name__":"lychee_total","url":"https://example.com/"},"value":13,"timestamp":1746403200000}
{"metric":{"__name__":"lychee_successful","url":"https://example.com/"},"value":12,"timestamp":1746403200000}
{"metric":{"__name__":"lychee_errors","url":"https://example.com/"},"value":0,"timestamp":1746403200000}
...
```

## 運作方式

每次執行都會以 `--format json --scheme https --accept 200 --method get` 將 URL 交給 lychee。JSON 輸出經過正規化（移除動態欄位、以固定順序排序陣列）後再計算雜湊，並與儲存在 `./data/state/<url-hash>.json` 的上一次狀態比較。

- `[NEW]`：第一次檢查這個 URL
- `[ok]`：雜湊與上一次相同
- `[CHANGED]`：雜湊不同；可用 `--diff` 查看變更內容

正規化會移除計時欄位（`span`、`duration`），並依 JSON 表示排序所有物件陣列，因此只要實際內容沒變，雜湊在多次執行之間就會保持穩定。

## 附帶工具

normalize-lychee.mts：可單獨使用的正規化工具。將 lychee 的 JSON 輸出透過管線傳給它，即可得到穩定的標準形式：

```sh
./lychee --format json https://example.com/ | tsx normalize-lychee.mts | sha256sum
```

## 授權

Apache 2.0

<!-- BEGIN gh-mutual-linking -->

---

### Related projects

- [cf-cache-utils](https://github.com/didvc/cf-cache-utils): CLI to warm and inspect Cloudflare edge cache status across all your URLs, no external dependencies, pure Node.js
<!-- END gh-mutual-linking -->