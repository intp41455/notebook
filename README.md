# 云记事板 / CloudWorkbench

Offline-first 笔记与待办应用，同时跑在 **PWA** 和 **Electron 桌面端**上。单文件前端 + Electron 壳，零后端依赖，数据全本地持久化。

> 在线体验: https://intp41455.github.io/notebook/

## 技术栈

| 层 | 技术 | 说明 |
|---|---|---|
| 前端 | Vanilla JS + 内联 CSS | 单文件 `index.html`（90KB），零构建步骤 |
| PWA | Service Worker + Web App Manifest | 离线缓存、可安装、`standalone` 模式 |
| 桌面端 | Electron 32 + electron-builder | 透明置顶悬浮窗、系统托盘、全局快捷键 |
| 测试 | Playwright (chromium) | 32 项 E2E 测试，覆盖 CRUD / 拖拽 / 导出 / 键盘 |
| CI/CD | GitHub Actions | tag 触发，三平台并行构建并发布 Release |

## 核心特性

- **便利贴 CRUD** — 创建、编辑、删除、全文搜索
- **待办看板** — 三列看板（待办 / 进行中 / 完成），支持 HTML5 拖拽跨列移动
- **日程日历** — 日期 + 时间事件，日视图面板
- **周报导出** — 支持 Markdown / HTML / 纯文本三种格式，可按周翻页
- **云端同步** — 基于 jsonbin.io，用户自行填入 Master Key，不硬编码
- **悬浮窗模式** — PWA standalone 下可弹出独立悬浮窗（`float.html`），位置持久化
- **数据迁移** — 浏览器版一键导出 `cloudworkbench_backup.json`，桌面版首次启动自动扫描并导入
- **全屏模式** — F11 切换，PWA 支持开机自启引导

## 桌面版架构

```
notebook/
├── index.html          # 前端主体（PWA + 悬浮窗逻辑）
├── float.html           # 独立悬浮窗页面
├── manifest.json        # PWA manifest
├── sw.js                # Service Worker (缓存版本管理)
├── test.js              # Playwright E2E 测试（32 项）
├── .github/workflows/
│   └── build-desktop.yml  # CI: 三平台自动构建 + Release
└── desktop/            # Electron 壳
    ├── main.js          # 主进程：窗口管理 / 托盘 / IPC / 迁移逻辑
    ├── preload.js       # contextBridge: 暴露安全 storage API
    ├── preload-float.js # 悬浮窗 preload
    ├── preload-welcome.js# 首次引导 preload
    ├── float.html       # 桌面版悬浮窗
    ├── welcome.html     # 首次启动引导窗口
    ├── package.json     # electron-builder 配置
    ├── start.bat / .sh / .command  # 三平台一键启动脚本
    └── scripts/
        └── prebuild.js   # 打包前将 index.html 等拷入 app/
```

### 安全设计

- **contextIsolation: true** — 主进程与渲染进程隔离
- **nodeIntegration: false** — 渲染进程无 Node.js 权限
- **contextBridge** — 通过 `window.__desktop.storage` 桥接，渲染进程只能通过 IPC 读写本地文件
- **无硬编码密钥** — jsonbin.io Master Key 由用户运行时输入，存于 localStorage / 文件系统
- **.gitignore** — `cloudworkbench_backup*.json` 已排除，迁移文件不会被提交

## 测试

```bash
# 启动本地服务器
python3 -m http.server 8080

# 运行 Playwright E2E 测试
npx playwright test
```

32 项测试覆盖：

| 阶段 | 覆盖范围 |
|---|---|
| 首次访问 | Setup 向导弹出 / 分步导航 / 完成 / Dashboard 加载 / Demo 数据 |
| 便利贴 | 新建 / 搜索 / 编辑 / 删除（含 confirm 拦截） |
| 待办 | 创建 / 拖拽跨列移动 |
| 日程 | 添加 / 删除 |
| 导出 | 周报预览 / HTML / 纯文本 / Markdown 切换 / 周翻页 |
| 同步 | Master Key 输入框 |
| 交互 | Escape 关闭弹窗 / 导航高亮 / 全屏按钮 / 悬浮窗按钮 / 欢迎回来 toast |

## CI/CD

tag 推送（`v*`）触发 GitHub Actions，三平台并行构建：

| 平台 | 产物 |
|---|---|
| Windows | `.exe` portable |
| Linux | `.AppImage` + `.tar.gz` |
| macOS | `.zip` (x64 + arm64) |

构建产物自动上传至 GitHub Releases。

## 快速开始

### 在线版（PWA）

直接访问 https://intp41455.github.io/notebook/

### 桌面版

1. 前往 [Releases](https://github.com/intp41455/notebook/releases) 下载对应平台安装包
2. Windows 双击 `.exe` / macOS 解压 `.zip` / Linux 双击 `.AppImage`
3. 首次启动如无数据，自动弹出引导窗口

### 开发

```bash
# 前端开发
git clone https://github.com/intp41455/notebook.git
cd notebook
python3 -m http.server 8080
# 浏览器打开 http://localhost:8080

# 桌面版开发
cd desktop
npm install
npm start
```

## 数据与隐私

- 所有数据保存在本机（浏览器 localStorage 或桌面版文件系统）
- 不上传云端、不跨设备同步（除非用户主动配置 jsonbin.io）
- 换设备：浏览器版导出迁移文件 → 桌面版自动导入

## License

MIT
