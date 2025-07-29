#!/bin/bash

# Docker镜像源配置脚本

echo "🔧 配置Docker镜像源..."

# 创建Docker配置目录
sudo mkdir -p /etc/docker

# 创建daemon.json配置文件
sudo tee /etc/docker/daemon.json > /dev/null << 'EOF'
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com",
    "https://mirror.baidubce.com",
    "https://ccr.ccs.tencentyun.com"
  ],
  "insecure-registries": [],
  "debug": false,
  "experimental": false,
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF

echo "✅ Docker配置文件已创建"

# 重启Docker服务
echo "🔄 重启Docker服务..."
sudo systemctl daemon-reload
sudo systemctl restart docker

# 等待Docker启动
echo "⏳ 等待Docker服务启动..."
sleep 5

# 验证配置
echo "🔍 验证Docker配置..."
sudo docker info | grep -A 10 "Registry Mirrors"

echo "✅ Docker镜像源配置完成！"
echo ""
echo "📊 现在可以使用以下镜像源："
echo "   - 中科大: https://docker.mirrors.ustc.edu.cn"
echo "   - 网易: https://hub-mirror.c.163.com"
echo "   - 百度: https://mirror.baidubce.com"
echo "   - 腾讯: https://ccr.ccs.tencentyun.com" 