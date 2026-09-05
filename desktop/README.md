# 云记事板桌面版

基于 Electron 的桌面客户端，支持透明置顶悬浮窗、系统托盘驻留、自动迁移浏览器数据。

## 特性

- 透明置顶悬浮窗，不影响底层窗口操作
- 鼠标穿透切换（悬浮窗上的图钉按钮）
- 关闭主窗口后仍驻留系统托盘
- 首次启动自动搜索下载文件夹、桌面、文档等位置的迁移文件
- 首次使用提供傻瓜式引导窗口
- 托盘菜单支持手动导入迁移文件
- 数据保存在应用本地存储，换电脑只需复制迁移文件

## 电脑小白使用指南（推荐）

### 方式一：直接下载运行（最简单，不需要 Node.js）

1. 打开 [GitHub Releases 页面](https://github.com/intp41455/notebook/releases)
2. 根据你的系统下载对应文件：
   - **Windows**：下载 `云记事板 Setup x.x.x.exe` 或 `...portable.exe`，双击运行
   - **macOS**：下载 `云记事板-x.x.x-mac.zip`，解压后双击 `云记事板.app`
   - **Linux**：下载 `云记事板-x.x.x.AppImage`，双击运行（可能需要右键→允许执行）
3. 第一次打开时，如果没有数据，会弹出引导窗口，按提示操作即可

### 方式二：用启动脚本运行（需要安装 Node.js）

1. 下载本仓库代码并解压
2. 进入 `desktop` 文件夹
3. 双击对应脚本：
   - **Windows**：双击 `start.bat`
   - **macOS**：双击 `start.command`
   - **Linux**：双击 `start.sh`，或在终端运行 `./start.sh`
4. 如果提示没有 Node.js，脚本会自动打开下载页面，安装后再运行即可

### 迁移浏览器里的数据

1. 在浏览器打开 [https://intp41455.github.io/notebook/](https://intp41455.github.io/notebook/)
2. 点击底部导航的 **同步设置**
3. 找到「迁移到桌面版」卡片，点击 **导出迁移文件**
4. 文件会下载到电脑的「下载」文件夹，名字是 `cloudworkbench_backup.json`
5. 重新打开桌面版，会自动发现并完成导入。原来的浏览器数据不会被删除。

> 如果桌面版已经打开，也可以从托盘菜单选择「导入迁移文件」。

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

> 打包前请确认已准备好 `assets/icon.png`（建议 512x512）。当前仓库包含自动生成图标。

## 常见问题

**Q：悬浮窗不见了怎么办？**  
A：点击系统托盘里的云记事板图标，选择「显示/隐藏悬浮窗」。

**Q：换了电脑数据还在吗？**  
A：把 `cloudworkbench_backup.json` 复制到新电脑，桌面版首次启动会自动导入。

**Q：悬浮窗点击没反应？**  
A：可能是开启了「鼠标穿透」模式。恢复方法：点击系统托盘图标选择「切换鼠标穿透」，或按快捷键 `Alt + Shift + F`。

**Q：Windows 提示 SmartScreen 拦截？**  
A：这是未签名应用的常见提示，点击「更多信息」→「仍要运行」即可。
