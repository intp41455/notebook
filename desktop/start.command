#!/bin/bash
cd "$(dirname "$0")"

echo ""
echo "  正在启动 云记事板桌面版 ..."
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
  echo "  [错误] 没有检测到 Node.js，无法直接启动。"
  echo ""
  echo "  推荐方式：到 GitHub Releases 下载 macOS 免安装版（不需要 Node.js）"
  echo "  地址：https://github.com/intp41455/notebook/releases"
  echo ""
  echo "  或者先安装 Node.js：https://nodejs.org/"
  echo ""
  osascript -e 'display dialog "没有检测到 Node.js。\n\n推荐：到 GitHub Releases 下载 macOS 免安装版。\n或者先安装 Node.js：https://nodejs.org/" buttons {"打开下载页"} default button 1 with title "云记事板"' > /dev/null 2>&1
  open "https://github.com/intp41455/notebook/releases"
  read -n 1 -s -r -p "按任意键退出"
  exit 1
fi

if ! command -v npm &> /dev/null; then
  echo "  [错误] 已安装 Node.js，但没有找到 npm。"
  echo "  请重新安装 Node.js。"
  read -n 1 -s -r -p "按任意键退出"
  exit 1
fi

if [ ! -d "node_modules" ]; then
  echo "  首次运行，正在安装依赖（需要联网，请稍候）..."
  echo ""
  if ! npm install; then
    echo ""
    echo "  [错误] 安装失败，请检查网络连接。"
    read -n 1 -s -r -p "按任意键退出"
    exit 1
  fi
  echo ""
  echo "  安装完成！"
  echo ""
fi

echo "  启动中..."
npm start
if [ $? -ne 0 ]; then
  echo ""
  echo "  [错误] 程序运行异常，请查看上方错误信息。"
  read -n 1 -s -r -p "按任意键退出"
fi
