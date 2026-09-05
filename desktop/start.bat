@echo off
chcp 65001 >nul
title 云记事板桌面版

echo.
echo   正在启动 云记事板桌面版 ...
echo.

:: 检查 Node.js
where node >nul 2>nul
if errorlevel 1 (
  echo   [错误] 没有检测到 Node.js，无法直接启动。
  echo.
  echo   云记事板桌面版需要 Node.js 环境才能运行。
  echo.
  echo   请选择以下方式之一：
  echo   1. 推荐：到 GitHub Releases 下载免安装的 .exe 版本（不需要 Node.js）
  echo      地址：https://github.com/intp41455/notebook/releases
  echo   2. 安装 Node.js 后再运行此脚本：https://nodejs.org/
  echo.
  powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.MessageBox]::Show('没有检测到 Node.js。%n%n推荐方式：到 GitHub Releases 下载 exe 免安装版。%n或者先安装 Node.js：https://nodejs.org/', '云记事板 - 需要 Node.js', 'OK', 'Information')" >nul 2>nul
  start "" "https://github.com/intp41455/notebook/releases"
  pause
  exit /b 1
)

:: 检查 npm
where npm >nul 2>nul
if errorlevel 1 (
  echo   [错误] 已安装 Node.js，但没有找到 npm。
  echo   请重新安装 Node.js（安装时勾选 npm）。
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo   首次运行，正在安装依赖（需要联网，请稍候）...
  echo.
  call npm install
  if errorlevel 1 (
    echo.
    echo   [错误] 安装失败，请检查网络连接或配置 npm 镜像后重试。
    pause
    exit /b 1
  )
  echo.
  echo   安装完成！
  echo.
)

echo   启动中...
npm start
if errorlevel 1 (
  echo.
  echo   [错误] 程序运行异常，请查看上方错误信息。
  pause
)
