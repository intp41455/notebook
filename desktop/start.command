#!/bin/bash
cd "$(dirname "$0")"
echo "正在启动云记事板桌面版..."

if [ ! -d "node_modules" ]; then
  echo "首次运行，正在安装依赖（需要联网）..."
  if ! npm install; then
    echo "安装失败，请确认已安装 Node.js 并可以联网。"
    read -n 1 -s -r -p "按任意键退出"
    exit 1
  fi
fi

echo "启动中..."
npm start
if [ $? -ne 0 ]; then
  read -n 1 -s -r -p "按任意键退出"
fi
