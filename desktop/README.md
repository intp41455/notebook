# 云记事板桌面版

基于 Electron 的桌面客户端，支持透明置顶悬浮窗、系统托盘驻留、一键迁移浏览器数据。

## 特性

- 透明置顶悬浮窗，不影响底层窗口操作
- 鼠标穿透切换（悬浮窗上的图钉按钮）
- 关闭主窗口后仍驻留系统托盘
- 首次启动自动搜索下载文件夹、桌面、文档等位置的迁移文件
- 托盘菜单支持手动导入迁移文件
- 数据保存在应用本地存储，换电脑只需复制迁移文件

## 电脑小白使用指南

### 1. 导出浏览器里的数据
1. 在浏览器打开 [https://intp41455.github.io/notebook/](https://intp41455.github.io/notebook/)
2. 点击底部导航的 **同步设置**
3. 找到「迁移到桌面版」卡片，点击 **导出迁移文件**
4. 文件会下载到电脑的「下载」文件夹，名字是 `cloudworkbench_backup.json`

### 2. 启动桌面版（自动导入）
- **Windows**：双击 `start.bat`
- **macOS**：双击 `start.command`
- **Linux**：双击 `start.sh`，或在终端运行 `./start.sh`

> 第一次运行会弹出命令窗口安装依赖，请保持联网，安装完成后会自动打开程序。

### 3. 完成
桌面版启动后会自动找到你刚才下载的 `cloudworkbench_backup.json` 并导入数据。原来的浏览器数据不会被删除。

## 开发者快速开始

```bash
cd desktop
npm install
npm start
```

## 打包

```bash
npm run build:win   # Windows
npm run build:mac   # macOS
npm run build:linux # Linux
```

> 打包前请确认已准备好 `assets/icon.png`（建议 512x512）。当前仓库包含一个占位图标，正式发布时请替换。
