# 云记事板桌面版

基于 Electron 的桌面客户端，支持透明置顶悬浮窗、系统托盘驻留、一键迁移浏览器数据。

## 特性

- 透明置顶悬浮窗，不影响底层窗口操作
- 鼠标穿透切换（悬浮窗上的图钉按钮）
- 关闭主窗口后仍驻留系统托盘
- 首次启动自动导入同级目录的 `cloudworkbench_backup.json`
- 托盘菜单支持手动导入迁移文件
- 数据保存在应用本地存储，换电脑只需复制迁移文件

## 快速开始

```bash
cd desktop
npm install
npm start
```

## 从浏览器版迁移数据

1. 在浏览器版打开「同步设置」页面
2. 点击「导出迁移文件」，下载 `cloudworkbench_backup.json`
3. 把文件放在桌面版可执行文件同级目录
4. 启动桌面版，数据自动导入

## 打包

```bash
npm run build:win   # Windows
npm run build:mac   # macOS
npm run build:linux # Linux
```

> 打包前请确认已准备好 `assets/icon.png`（建议 512x512）。当前仓库包含一个占位图标，正式发布时请替换。
