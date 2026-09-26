[English](README.md) · [日本語](README-ja.md) · [繁體中文](README-zh-TW.md) · 简体中文 · [Deutsch](README-de.md) · [Français](README-fr.md)

# http-status-monitor

[![Docs](https://img.shields.io/badge/docs-didvc.github.io%2Fhttp--status--monitor-blue)](https://didvc.github.io/http-status-monitor/)
[![License](https://img.shields.io/badge/License-Apache_2.0-green.svg)](LICENSE)

[完整文档 →](https://didvc.github.io/http-status-monitor/)

一个命令行工具，会对一组 URL 运行 [lychee](https://github.com/lycheeverse/lychee)，跟踪 HTTP 状态随时间的变化，并以兼容 VictoriaMetrics 的格式存储指标。

核心思路：“服务器还在线吗？”这种浅层检查，会漏掉损坏的 CSS、404 的 JS 和失效的 API 端点；lychee 会检查页面上链接的每一个资源，所以能发现这些问题。本工具为 lychee 加上状态跟踪，让你不只知道服务器是否响应，还能在任何东西发生变化时察觉。

## 要求

- Node.js 18+，以及 [tsx](https://github.com/privatenumber/tsx)（`npm install -g tsx`）
- lychee 可执行文件：从 [lycheeverse/lychee 的发布页](https://github.com/lycheeverse/lychee/releases)下载，放在 `./lychee-x86_64-unknown-linux-musl/lychee`（或任意路径，再用 `--lychee-path` 指定）

## 安装

```sh
git clone https://github.com/didvc/http-status-monitor
cd http-status-monitor
npm install
```

下载 lychee 并设为可执行：

```sh
mkdir -p lychee-x86_64-unknown-linux-musl
curl -L https://github.com/lycheeverse/lychee/releases/latest/download/lychee-x86_64-unknown-linux-musl.tar.gz \
  | tar xz -C lychee-x86_64-unknown-linux-musl
```

## 用法

```
tsx http-status-monitor.mts [options]
```

### 选项

| 参数 | 默认值 | 说明 |
|---|---|---|
| `--urls-file <path>` | `./urls.txt` | 每行一个 URL 的文件 |
| `--urls <url,...>` | - | 用逗号分隔直接指定 URL（优先于 `--urls-file`） |
| `--lychee-path <path>` | auto | 显式指定 lychee 可执行文件路径 |
| `--verbose`, `-v` | off | 显示 lychee 输出和所有结果 |
| `--diff` | off | 状态变化时打印 unified diff |
| `--interval <secs>` | `3600` | 监视模式下的轮询间隔 |
| `--once` | off | 只运行一次然后退出 |
| `--victoriametrics` | off | 将指标追加到 `./data/victoriametrics/[yyyy-mm]/results.jsonl` |
| `--wait <secs>` | `1` | 连续 URL 检查之间的延迟 |

### 示例

首次运行（为每个 URL 记录新状态）：

```
$ tsx http-status-monitor.mts --once --urls-file ./urls.txt --verbose
lychee: ./lychee-x86_64-unknown-linux-musl/lychee
Checking https://example.com/ ...
[NEW    ] https://example.com/  94ff97988565
Checking https://blog.example.com/ ...
[NEW    ] https://blog.example.com/  c2d3b2b59402
```

第二次运行（没有变化）：

```
$ tsx http-status-monitor.mts --once --urls-file ./urls.txt --verbose
lychee: ./lychee-x86_64-unknown-linux-musl/lychee
Checking https://example.com/ ...
[ok     ] https://example.com/  94ff97988565
```

用 `--diff` 检测变化：

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

监视模式（持续运行，每轮之间等待）：

```
$ tsx http-status-monitor.mts --urls-file ./urls.txt --verbose
...
Sleeping 3600s until next run...
```

VictoriaMetrics 输出：

```
$ tsx http-status-monitor.mts --once --victoriametrics --urls "https://example.com/"
[ok     ] https://example.com/  94ff97988565

$ cat ./data/victoriametrics/2026-05/results.jsonl
{"metric":{"__name__":"lychee_total","url":"https://example.com/"},"value":13,"timestamp":1746403200000}
{"metric":{"__name__":"lychee_successful","url":"https://example.com/"},"value":12,"timestamp":1746403200000}
{"metric":{"__name__":"lychee_errors","url":"https://example.com/"},"value":0,"timestamp":1746403200000}
...
```

## 工作原理

每次运行都会以 `--format json --scheme https --accept 200 --method get` 把 URL 交给 lychee。JSON 输出经过规范化（去掉动态字段、按确定的顺序排序数组）后再计算哈希，并与保存在 `./data/state/<url-hash>.json` 中的上一次状态比较。

- `[NEW]`：第一次检查这个 URL
- `[ok]`：哈希与上一次一致
- `[CHANGED]`：哈希不同；用 `--diff` 查看变化内容

规范化会去掉计时字段（`span`、`duration`），并按 JSON 表示对所有对象数组排序，因此只要实际内容没有变化，哈希在多次运行之间就会保持稳定。

## 附带工具

normalize-lychee.mts：可单独使用的规范化工具。把 lychee 的 JSON 输出通过管道传给它，就能得到稳定的规范形式：

```sh
./lychee --format json https://example.com/ | tsx normalize-lychee.mts | sha256sum
```

## 许可证

Apache 2.0

<!-- BEGIN gh-mutual-linking -->

---

### Related projects

- [cf-cache-utils](https://github.com/didvc/cf-cache-utils): CLI to warm and inspect Cloudflare edge cache status across all your URLs, no external dependencies, pure Node.js
<!-- END gh-mutual-linking -->