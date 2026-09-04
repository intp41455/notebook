@echo off
chcp 65001 >nul
echo 正在启动云记事板桌面版...

if not exist "node_modules" (
  echo 首次运行，正在安装依赖（需要联网）...
  call npm install
  if errorlevel 1 (
    echo 安装失败，请确认已安装 Node.js 并可以联网。
    pause
    exit /b 1
  )
)

echo 启动中...
npm start
if errorlevel 1 pause
