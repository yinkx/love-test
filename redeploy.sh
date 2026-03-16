#!/bin/bash

###############################################################################
# 恋爱脑测试 H5 - 重新部署脚本
# 流程：停止服务 → 删除服务 → npm install → 重启服务
# 使用方法：sudo ./redeploy.sh
###############################################################################

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置项
APP_NAME="love-test-api"
APP_DIR="/data/test/love-test"

###############################################################################
# 打印函数
###############################################################################

print_header() {
    echo -e "${BLUE}"
    echo "========================================"
    echo "  $1"
    echo "========================================"
    echo -e "${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

###############################################################################
# 检查是否为 root 用户
###############################################################################

check_root() {
    print_header "检查用户权限"

    if [ "$EUID" -ne 0 ]; then
        print_error "请使用 root 用户运行此脚本"
        print_info "使用方法：sudo ./redeploy.sh"
        exit 1
    fi

    print_success "当前用户：root"
}

###############################################################################
# 验证环境
###############################################################################

verify_environment() {
    print_header "验证环境"

    # 检查项目目录
    if [ ! -d "$APP_DIR" ]; then
        print_error "项目目录不存在：$APP_DIR"
        print_info "请先运行 deploy.sh 进行首次部署"
        exit 1
    fi

    # 检查 PM2
    if ! command -v pm2 &> /dev/null; then
        print_error "PM2 未安装"
        print_info "请先运行 deploy.sh 进行首次部署"
        exit 1
    fi

    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js 未安装"
        exit 1
    fi

    # 检查 npm
    if ! command -v npm &> /dev/null; then
        print_error "npm 未安装"
        exit 1
    fi

    print_success "环境验证通过"
    print_info "Node.js: $(node -v)"
    print_info "npm: $(npm -v)"
    print_info "PM2: $(pm2 -v)"
}

###############################################################################
# 停止服务
###############################################################################

stop_service() {
    print_header "停止服务"

    print_info "停止 PM2 应用：$APP_NAME"

    if pm2 status $APP_NAME > /dev/null 2>&1; then
        pm2 stop $APP_NAME
        print_success "服务已停止"
    else
        print_warning "服务未运行，跳过停止"
    fi
}

###############################################################################
# 删除服务
###############################################################################

delete_service() {
    print_header "删除服务"

    print_info "删除 PM2 应用：$APP_NAME"

    if pm2 status $APP_NAME > /dev/null 2>&1; then
        pm2 delete $APP_NAME
        print_success "服务已删除"
    else
        print_warning "服务不存在，跳过删除"
    fi
}

###############################################################################
# 安装依赖
###############################################################################

install_dependencies() {
    print_header "安装依赖"

    cd "$APP_DIR"

    print_info "项目目录：$APP_DIR"
    print_info "执行 npm install --production..."

    # 清理 node_modules（可选，确保全新安装）
    if [ -d "node_modules" ]; then
        print_info "清理旧的 node_modules..."
        rm -rf node_modules
        print_success "清理完成"
    fi

    # 清理 package-lock.json（可选，使用最新版本）
    # 如果需要严格版本控制，可注释掉下面这行
    # rm -f package-lock.json

    # 安装依赖
    npm install --production

    print_success "依赖安装完成"
}

###############################################################################
# 启动服务
###############################################################################

start_service() {
    print_header "启动服务"

    cd "$APP_DIR"

    print_info "启动 PM2 应用..."

    # 启动服务
    pm2 start ecosystem.config.js --env production

    # 等待服务启动
    sleep 2

    # 检查服务状态
    if pm2 status $APP_NAME | grep -q "online"; then
        print_success "应用服务已启动"
        pm2 status
    else
        print_error "应用服务启动失败"
        pm2 logs $APP_NAME --lines 20
        exit 1
    fi

    # 保存 PM2 配置
    print_info "保存 PM2 配置..."
    pm2 save
    print_success "PM2 配置已保存"
}

###############################################################################
# 验证服务
###############################################################################

verify_service() {
    print_header "验证服务"

    # 检查 PM2 状态
    print_info "检查 PM2 服务状态..."
    pm2 status $APP_NAME

    # 检查日志
    print_info "最近日志..."
    pm2 logs $APP_NAME --lines 5 --nostream || true

    print_success "服务验证完成"
}

###############################################################################
# 显示完成信息
###############################################################################

show_complete_info() {
    print_header "重新部署完成"

    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  重新部署成功！${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "${BLUE}服务信息:${NC}"
    echo "  - 应用名称：$APP_NAME"
    echo "  - 项目目录：$APP_DIR"
    echo ""
    echo -e "${BLUE}管理命令:${NC}"
    echo "  - 查看状态：pm2 status"
    echo "  - 查看日志：pm2 logs $APP_NAME"
    echo "  - 重启服务：pm2 restart $APP_NAME"
    echo "  - 停止服务：pm2 stop $APP_NAME"
    echo ""
}

###############################################################################
# 主函数
###############################################################################

main() {
    clear

    echo -e "${BLUE}"
    echo "╔════════════════════════════════════════╗"
    echo "║   恋爱脑测试 H5 - 重新部署脚本        ║"
    echo "║   Re-deploy Script                    ║"
    echo "╚════════════════════════════════════════╝"
    echo -e "${NC}"
    echo ""

    # 执行重新部署流程
    check_root
    verify_environment

    # 核心流程：停止 → 删除 → install → 启动
    stop_service
    delete_service
    install_dependencies
    start_service
    verify_service
    show_complete_info
}

# 运行主函数
main "$@"
