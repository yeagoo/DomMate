#!/bin/bash

# ================================
# DomMate Docker 构建测试脚本
# ================================

set -e  # 遇到错误立即退出

echo "🐳 开始 DomMate Docker 构建测试..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查 Docker 是否安装
check_docker() {
    log_info "检查 Docker 是否安装..."
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi
    log_success "Docker 已安装: $(docker --version)"
}

# 检查 Docker Compose 是否安装
check_docker_compose() {
    log_info "检查 Docker Compose 是否安装..."
    if ! command -v docker-compose &> /dev/null; then
        log_warning "Docker Compose 未安装，将使用 docker compose"
        COMPOSE_CMD="docker compose"
    else
        COMPOSE_CMD="docker-compose"
        log_success "Docker Compose 已安装: $(docker-compose --version)"
    fi
}

# 检查必要文件
check_files() {
    log_info "检查必要文件..."
    
    local required_files=(
        "Dockerfile"
        ".dockerignore"
        "docker-compose.yml"
        "env.example"
        "package.json"
    )
    
    for file in "${required_files[@]}"; do
        if [[ ! -f "$file" ]]; then
            log_error "缺少必要文件: $file"
            exit 1
        fi
    done
    
    log_success "所有必要文件检查通过"
}

# 创建环境文件
create_env() {
    log_info "创建环境配置文件..."
    
    if [[ ! -f ".env" ]]; then
        cp env.example .env
        log_info "已创建 .env 文件，使用默认配置"
    else
        log_info ".env 文件已存在，跳过创建"
    fi
}

# 构建 Docker 镜像
build_image() {
    log_info "开始构建 Docker 镜像..."
    
    local image_name="dommate:test"
    
    # 构建镜像
    if docker build -t "$image_name" .; then
        log_success "Docker 镜像构建成功: $image_name"
    else
        log_error "Docker 镜像构建失败"
        exit 1
    fi
    
    # 查看镜像信息
    log_info "镜像信息:"
    docker images "$image_name"
}

# 测试容器启动
test_container() {
    log_info "测试容器启动..."
    
    local container_name="dommate-test"
    local image_name="dommate:test"
    
    # 清理可能存在的容器
    if docker ps -a | grep -q "$container_name"; then
        log_info "清理已存在的测试容器..."
        docker rm -f "$container_name" >/dev/null 2>&1
    fi
    
    # 启动容器
    log_info "启动测试容器..."
    if docker run -d \
        --name "$container_name" \
        -p 3002:3001 \
        -e NODE_ENV=production \
        -e DATABASE_PATH=/app/data/test.db \
        "$image_name"; then
        log_success "容器启动成功"
    else
        log_error "容器启动失败"
        exit 1
    fi
    
    # 等待容器启动
    log_info "等待应用启动..."
    sleep 10
    
    # 检查容器状态
    if docker ps | grep -q "$container_name"; then
        log_success "容器运行正常"
    else
        log_error "容器未正常运行"
        docker logs "$container_name"
        exit 1
    fi
    
    # 测试健康检查
    log_info "测试应用健康检查..."
    local max_attempts=6
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -f http://localhost:3002/api/auth/info >/dev/null 2>&1; then
            log_success "应用健康检查通过"
            break
        else
            log_info "健康检查失败，重试 ($attempt/$max_attempts)..."
            sleep 5
            ((attempt++))
        fi
    done
    
    if [[ $attempt -gt $max_attempts ]]; then
        log_error "应用健康检查失败"
        log_info "容器日志:"
        docker logs "$container_name"
        exit 1
    fi
    
    # 清理测试容器
    log_info "清理测试容器..."
    docker rm -f "$container_name" >/dev/null 2>&1
}

# 测试 Docker Compose
test_compose() {
    log_info "测试 Docker Compose 配置..."
    
    # 验证 docker-compose.yml 语法
    if $COMPOSE_CMD config >/dev/null 2>&1; then
        log_success "docker-compose.yml 配置有效"
    else
        log_error "docker-compose.yml 配置无效"
        $COMPOSE_CMD config
        exit 1
    fi
    
    # 如果存在开发配置，也验证一下
    if [[ -f "docker-compose.dev.yml" ]]; then
        if $COMPOSE_CMD -f docker-compose.dev.yml config >/dev/null 2>&1; then
            log_success "docker-compose.dev.yml 配置有效"
        else
            log_warning "docker-compose.dev.yml 配置可能有问题"
        fi
    fi
}

# 清理函数
cleanup() {
    log_info "清理测试资源..."
    
    # 删除测试镜像
    if docker images | grep -q "dommate:test"; then
        docker rmi dommate:test >/dev/null 2>&1 || true
    fi
    
    # 清理未使用的资源
    docker system prune -f >/dev/null 2>&1 || true
    
    log_success "清理完成"
}

# 显示使用说明
show_usage() {
    log_info "Docker 镜像构建成功！"
    echo
    echo "📋 使用说明:"
    echo
    echo "1. 生产环境部署:"
    echo "   docker-compose up -d"
    echo
    echo "2. 开发环境启动:"
    echo "   docker-compose -f docker-compose.dev.yml up -d"
    echo
    echo "3. 使用预构建镜像:"
    echo "   docker pull ghcr.io/yeagoo/dommate:latest"
    echo "   docker run -d -p 3001:3001 ghcr.io/yeagoo/dommate:latest"
    echo
    echo "4. 查看应用:"
    echo "   http://localhost:3001"
    echo
    echo "5. 默认登录密码: admin123"
    echo
}

# 主函数
main() {
    echo "========================================"
    echo "  DomMate Docker 构建测试"
    echo "========================================"
    echo
    
    # 执行检查和测试
    check_docker
    check_docker_compose
    check_files
    create_env
    
    echo
    log_info "开始构建和测试流程..."
    echo
    
    build_image
    test_container
    test_compose
    
    echo
    log_success "🎉 所有测试通过！"
    echo
    
    show_usage
    
    # 询问是否清理
    echo
    read -p "是否清理测试资源? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cleanup
    else
        log_info "保留测试资源，可手动清理: docker rmi dommate:test"
    fi
}

# 设置退出时清理
trap cleanup EXIT

# 运行主函数
main "$@" 