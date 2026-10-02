# CLAUDE.md

本文件为 Claude Code 在此仓库工作时提供上下文。

## 项目目的

**云记事板（cloudworkbench）**：一个"云同步便利贴 · 记事本与待办看板"应用。

- **浏览器版（PWA）**：根目录的纯静态单页应用 `index.html`，包含仪表盘、便利贴（notes）、待办看板（todos）、日历（events）、云同步、导出 6 个视图（`#view-dashboard` ~ `#view-export`）。支持首次使用引导（setup guide）和迁移到桌面版。
- **桌面版（Electron）**：`desktop/` 目录下的桌面客户端，加载浏览器版同一份 `index.html`，提供透明置顶悬浮窗（`float.html`）、系统托盘驻留、引导窗口（`welcome.html`）、自动搜索并迁移浏览器备份文件（`cloudworkbench_backup*.json`）。

## 技术栈

- **浏览器版**：无构建步骤的原生 HTML/CSS/JS 单文件（`index.html` 约 92KB，内联 CSS 与 JS），localStorage 持久化（键 `cloudworkbench_v1` / `cloudworkbench_sync_v1`），PWA（`manifest.json` + `sw.js` service worker，缓存 `/notebook/` 作用域，部署在 GitHub Pages）。云同步走 **JsonBin API**（`https://api.jsonbin.io/v3/b`，X-Master-Key 鉴权，私有 bin）。
- **桌面版**：Node.js + **Electron ^32** + **electron-builder ^25**，打包脚本 `scripts/prebuild.js` 会把仓库根的 `index.html`/`manifest.json`/`sw.js` 复制进 `desktop/app/` 供主窗口加载；`scripts/make-icon.js`（jimp）生成图标。

## 目录结构

```
├── index.html            # 浏览器版主应用（PWA）
├── float.html            # 悬浮窗页面（浏览器版；桌面版在 desktop/ 下有自己的 float.html）
├── manifest.json         # PWA manifest（scope: /notebook/）
├── sw.js                 # service worker（缓存 /notebook/ 作用域资源）
├── test.js               # Playwright 端到端测试脚本（需本地 http://localhost:8080）
├── .github/workflows/build-desktop.yml  # 打 tag 触发三平台 CI 构建
└── desktop/              # Electron 桌面版
    ├── main.js           # 主进程：窗口/托盘/迁移/文件存储
    ├── preload.js / preload-float.js / preload-welcome.js
    ├── float.html, welcome.html
    ├── app/              # prebuild 时生成的目录（复制 index.html 等，git 忽略）
    ├── assets/           # icon.png, icon.svg, tray.png
    ├── scripts/          # prebuild.js（复制根目录文件）、make-icon.js
    └── start.bat / start.command / start.sh  # 无构建运行入口
```

## 安装 / 构建 / 运行 / 测试

### 浏览器版

无构建。本地起静态服务器即可（PWA scope 为 `/notebook/`，注意路径前缀）：

```bash
python -m http.server 8080   # 或将文件部署到 https://<user>.github.io/notebook/
```

### 桌面版

```bash
cd desktop
npm install
npm start          # electron .
```

或双击对应启动脚本：`start.bat`（Windows）/ `start.command`（macOS）/ `start.sh`（Linux），脚本会检测 Node.js 缺失时引导下载。

### 打包

```bash
cd desktop
npm run build:win    # portable x64
npm run build:mac    # zip x64+arm64
npm run build:linux  # AppImage + tar.gz
```

`build` 脚本会先运行 `prebuild`（复制根目录 `index.html`/`manifest.json`/`sw.js` 到 `desktop/app/`）。产物输出到 `desktop/dist/`。CI（`.github/workflows/build-desktop.yml`）在推送 `v*` tag 时自动构建并上传 Release，需要 `contents: write` 权限（历史提交 6826bc6 修复过此问题），使用 npmmirror Electron 镜像。

### 测试

`test.js` 是 **Playwright 脚本**（非框架集成），测试首访引导、仪表盘、便签、待办看板等流程，依赖：

1. Chromium 装在 `/root/.cache/ms-playwright/chromium-1234/`（路径硬编码）
2. 应用以 `http://localhost:8080` 静态服务运行

```bash
node test.js   # 在项目根目录，需 playwright 已安装
```

输出 `✓/✗` 逐项结果到终端，无断言框架，退出码不反映失败。

## 关键约定与坑点

- **单文件架构**：`index.html` 是全部前端逻辑（内联 CSS+JS），改动需谨慎，勿拆分。
- **localStorage 双写约定**：浏览器版数据存 `localStorage`（`LS_KEY='cloudworkbench_v1'`）；桌面版通过 preload **劫持 `window.localStorage`**（`Object.defineProperty`，见 `index.html:422-426`）映射到 Electron 文件存储（`userData/state.json` 等），业务代码无需感知差异。桌面版 `main.js` 中 `state.json`/`sync.json`/`float.json` 分别存笔记数据、同步配置、悬浮窗位置。
- **桌面版加载文件来源**：`main.js` 用 `resolveAppFile('index.html')` 解析——打包后从 `process.resourcesPath/app/index.html` 加载，开发时回退 `desktop/app/index.html`。改前端后需重跑 `npm run build:win`（含 prebuild）才会进包。
- **迁移文件约定**：浏览器版「同步设置」页可导出 `cloudworkbench_backup.json`；桌面版启动时扫描 `process.cwd()`、resourcesPath/app、userData、下载/桌面/文档目录寻找 `cloudworkbench_backup*.json`（排除已导入的 `*_imported_<ts>.json`），导入记录写在 `userData/.imported_backups.json`（按 mtime+hash 去重）。`.gitignore` 已排除 `cloudworkbench_backup*.json`。
- **PWA scope 是 `/notebook/`**：`sw.js` 缓存键与资源路径均带 `/notebook/` 前缀（部署在 GitHub Pages 子路径 `intp41455.github.io/notebook/`）。本地测试若不用该前缀，SW 缓存路径会 miss。
- **悬浮窗穿透**：桌面版 `float.json` 的 `passthrough` 控制鼠标穿透，快捷键 `Alt+Shift+F` 或托盘菜单切换；主窗口 `close` 事件被 preventDefault 改为隐藏（驻留托盘，非退出）。
- **无包管理器锁定根目录**：根目录无 `package.json`，依赖全部在 `desktop/package-lock.json`；CI 以该文件为 cache-dependency-path。
- **CI 只触发 tag `v*`**：普通 push 不构建；打 Release 后各平台产物由 workflow 上传。
- **test.js 硬编码路径**：Chromium executablePath 与 localhost:8080 均硬编码，换环境需改脚本。
