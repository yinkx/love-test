#!/bin/bash

###############################################################################
# 恋爱脑测试 H5 - 一键部署脚本 (PM2 版本)
# 使用方法：./deploy.sh
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
PROJECT_SHORT_NAME="love-test"     # 项目访问前缀，如 love-test -> xiaotuzi.fun/love-test/
NODE_VERSION="18"
PORT=8000

# 域名配置
DOMAIN_NAME="xiaotuzi.fun"
SUB_DOMAIN=""                 # 子域名前缀，留空则使用根域名
                           # 示例：love -> love.xiaotuzi.fun
SERVER_IP="47.95.70.70"      # 服务器公网 IP

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
        print_info "使用方法：sudo ./deploy.sh"
        exit 1
    fi

    print_success "当前用户：root"
}

###############################################################################
# 检查操作系统
###############################################################################

check_os() {
    print_header "检查操作系统"

    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$NAME
        VER=$VERSION_ID
        print_info "操作系统：$OS $VER"

        case "$ID" in
            ubuntu)
                PKG_MANAGER="apt-get"
                PKG_UPDATE="apt-get update"
                ;;
            debian)
                PKG_MANAGER="apt-get"
                PKG_UPDATE="apt-get update"
                ;;
            centos|rhel|almalinux|rocky)
                PKG_MANAGER="yum"
                PKG_UPDATE="yum update -y"
                ;;
            *)
                print_warning "未识别的操作系统，尝试使用通用安装方式"
                PKG_MANAGER="yum"
                PKG_UPDATE="yum update -y"
                ;;
        esac
    else
        print_error "无法识别操作系统类型"
        exit 1
    fi
}

###############################################################################
# 环境验证与安装
###############################################################################

setup_environment() {
    print_header "环境验证与安装"

    # 更新系统包
    print_info "更新系统包..."
    $PKG_UPDATE -y > /dev/null 2>&1 || true

    # 检查并安装 Node.js
    if command -v node &> /dev/null; then
        NODE_VER=$(node -v)
        print_success "Node.js 已安装：$NODE_VER"
    else
        print_info "安装 Node.js ${NODE_VERSION}.x..."

        # 安装 NodeSource 仓库
        if [ "$PKG_MANAGER" = "apt-get" ]; then
            curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash - > /dev/null 2>&1
            apt-get install -y nodejs > /dev/null 2>&1
        else
            curl -fsSL https://rpm.nodesource.com/setup_${NODE_VERSION}.x | bash - > /dev/null 2>&1
            yum install -y nodejs > /dev/null 2>&1
        fi

        print_success "Node.js 安装完成"
    fi

    # 检查并安装 Nginx（不依赖宝塔）
    if command -v nginx &> /dev/null; then
        NGINX_VER=$(nginx -v 2>&1)
        print_success "Nginx 已安装：$NGINX_VER"
    else
        print_info "安装 Nginx..."
        if [ "$PKG_MANAGER" = "apt-get" ]; then
            apt-get install -y nginx > /dev/null 2>&1
        else
            yum install -y nginx > /dev/null 2>&1
        fi
        print_success "Nginx 安装完成"
    fi

    # 检查并安装 PM2
    if command -v pm2 &> /dev/null; then
        PM2_VER=$(pm2 -v)
        print_success "PM2 已安装：v$PM2_VER"
    else
        print_info "安装 PM2..."
        npm install -g pm2 > /dev/null 2>&1
        print_success "PM2 安装完成"
    fi

    # 验证版本
    print_info "版本信息:"
    echo "  - Node.js: $(node -v)"
    echo "  - npm: $(npm -v)"
    echo "  - Nginx: $(nginx -v 2>&1 | head -1)"
    echo "  - PM2: $(pm2 -v)"
}

###############################################################################
# 配置系统服务
###############################################################################

setup_systemd() {
    print_header "配置系统服务"

    # 启动并配置 Nginx
    print_info "配置 Nginx 服务..."
    systemctl start nginx
    systemctl enable nginx
    print_success "Nginx 服务已启动"

    # 配置 PM2 开机自启
    print_info "配置 PM2 开机自启..."
    pm2 startup 2>/dev/null || true

    # 执行 pm2 startup 输出的命令（如果有）
    PM2_STARTUP=$(pm2 startup 2>/dev/null | grep "env" | tail -1)
    if [ -n "$PM2_STARTUP" ]; then
        eval "$PM2_STARTUP" 2>/dev/null || true
    fi

    print_success "PM2 开机自启已配置"
}

###############################################################################
# 创建项目目录
###############################################################################

setup_project_dir() {
    print_header "创建项目目录"

    if [ -d "$APP_DIR" ]; then
        print_warning "项目目录已存在：$APP_DIR"
        print_info "备份旧项目..."
        BACKUP_DIR="${APP_DIR}.backup.$(date +%Y%m%d_%H%M%S)"
        cp -r "$APP_DIR" "$BACKUP_DIR"
        print_success "备份完成：$BACKUP_DIR"
    else
        mkdir -p "$APP_DIR"
        print_success "创建项目目录：$APP_DIR"
    fi
}

###############################################################################
# 部署项目代码
###############################################################################

deploy_code() {
    print_header "部署项目代码"

    cd "$APP_DIR"

    # 安装依赖
    print_info "安装项目依赖..."
    npm install --production > /dev/null 2>&1
    print_success "依赖安装完成"

    # 生成验证码（如果不存在）
    if [ ! -d "data/codes" ] || [ -z "$(ls -A data/codes 2>/dev/null)" ]; then
        print_info "生成验证码..."
        mkdir -p data/codes
        npm run generate-codes -- --count 100 > /dev/null 2>&1
        print_success "验证码生成完成"

        # 显示前 5 个验证码
        print_info "前 5 个验证码:"
        ls data/codes/ | head -5 | while read code; do
            echo "  - ${code%.json}"
        done
    else
        CODE_COUNT=$(ls data/codes/*.json 2>/dev/null | wc -l)
        print_success "验证码已存在：共 $CODE_COUNT 个"
    fi

    # 创建日志目录
    mkdir -p logs
    print_success "日志目录已创建"
}

###############################################################################
# 配置 Nginx
###############################################################################

setup_nginx() {
    print_header "配置 Nginx"

    # 构建完整域名
    if [ -n "$SUB_DOMAIN" ]; then
        FULL_DOMAIN="$SUB_DOMAIN.$DOMAIN_NAME"
        SERVER_NAME="$FULL_DOMAIN www.$FULL_DOMAIN"
    else
        FULL_DOMAIN="$DOMAIN_NAME"
        SERVER_NAME="$DOMAIN_NAME www.$DOMAIN_NAME"
    fi

    # 项目访问路径（如 /love-test/）
    PROJECT_PATH="/$PROJECT_SHORT_NAME"

    # 项目 Nginx 配置目录
    PROJECT_NGINX_DIR="/data/test/nginx"
    NGINX_CONF="$PROJECT_NGINX_DIR/love-test.conf"

    # 创建配置目录
    mkdir -p "$PROJECT_NGINX_DIR"
    print_info "项目 Nginx 配置目录：$PROJECT_NGINX_DIR"

    print_info "配置域名：$SERVER_NAME"
    print_info "项目访问路径：$PROJECT_PATH"

    # 创建 Nginx 配置文件（支持子路径访问）
    cat > "$NGINX_CONF" << EOF
server {
    listen 80;
    server_name $SERVER_NAME $SERVER_IP;

    # 项目根目录
    set \$project_root $APP_DIR;

    # 访问日志
    access_log /var/log/nginx/love-test-access.log;
    error_log /var/log/nginx/love-test-error.log;

    # 项目子路径访问（如 /love-test/）
    location /$PROJECT_SHORT_NAME/ {
        alias \$project_root/public/;
        index index.html;
        try_files \$uri \$uri/ /$PROJECT_SHORT_NAME/index.html;
    }

    # API 接口（支持 /{PROJECT_SHORT_NAME}/api/）
    location /$PROJECT_SHORT_NAME/api/ {
        proxy_pass http://127.0.0.1:$PORT/$PROJECT_SHORT_NAME/api/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        # CORS
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods 'GET, POST, OPTIONS';
        add_header Access-Control-Allow-Headers 'Content-Type';

        if (\$request_method = OPTIONS) {
            return 204;
        }
    }

    # 静态资源（支持 /{PROJECT_SHORT_NAME}/src/）
    location /$PROJECT_SHORT_NAME/src/ {
        alias \$project_root/public/src/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
EOF

    print_success "Nginx 配置文件已创建：$NGINX_CONF"

    # 查找主 nginx.conf 并添加 include
    print_info "配置主 Nginx 包含项目配置..."

    # 查找 nginx.conf 路径
    if [ -f /etc/nginx/nginx.conf ]; then
        MAIN_NGINX_CONF="/etc/nginx/nginx.conf"
    elif [ -f /www/server/nginx/conf/nginx.conf ]; then
        MAIN_NGINX_CONF="/www/server/nginx/conf/nginx.conf"
    elif [ -f /usr/local/nginx/conf/nginx.conf ]; then
        MAIN_NGINX_CONF="/usr/local/nginx/conf/nginx.conf"
    else
        MAIN_NGINX_CONF=$(nginx -t 2>&1 | grep "configuration file" | awk '{print $5}')
    fi

    if [ -z "$MAIN_NGINX_CONF" ] || [ ! -f "$MAIN_NGINX_CONF" ]; then
        print_error "未找到主 Nginx 配置文件"
        exit 1
    fi

    print_info "主 Nginx 配置文件：$MAIN_NGINX_CONF"

    # 检查是否已包含项目配置（检查 love-test.conf）
    if grep -q "love-test.conf" "$MAIN_NGINX_CONF" 2>/dev/null; then
        print_info "项目配置已包含在主配置中"
    else
        # 在 http 块结束前添加 include
        print_info "添加 include 指令到主配置..."

        # 备份
        cp "$MAIN_NGINX_CONF" "${MAIN_NGINX_CONF}.bak"

        # 使用 awk 在 http 块结束前添加 include
        awk -v conf="$NGINX_CONF" '
        /^http[[:space:]]*\{/ {
            in_http = 1
            print
            next
        }
        in_http && /^[[:space:]]*\}[[:space:]]*$/ && !added {
            print "    include " conf ";"
            added = 1
            in_http = 0
        }
        { print }
        ' "$MAIN_NGINX_CONF" > "${MAIN_NGINX_CONF}.tmp" && mv "${MAIN_NGINX_CONF}.tmp" "$MAIN_NGINX_CONF"

        print_success "已添加 include 到主配置"
    fi

    # 验证并重载配置
    print_info "验证 Nginx 配置..."

    # 禁用 default 站点（避免冲突）
    if [ -L /etc/nginx/sites-enabled/default ]; then
        print_info "禁用 default 站点..."
        rm -f /etc/nginx/sites-enabled/default
    fi

    if nginx -t > /dev/null 2>&1; then
        print_success "Nginx 配置验证通过"
        systemctl reload nginx
        print_success "Nginx 已重载"
    else
        print_error "Nginx 配置验证失败"
        nginx -t
        exit 1
    fi
}

###############################################################################
# 配置防火墙
###############################################################################

setup_firewall() {
    print_header "配置防火墙"

    # 检查 firewalld
    if systemctl is-active --quiet firewalld 2>/dev/null; then
        print_info "配置 firewalld..."
        firewall-cmd --permanent --add-service=http > /dev/null 2>&1
        firewall-cmd --permanent --add-service=https > /dev/null 2>&1
        firewall-cmd --permanent --add-port=${PORT}/tcp > /dev/null 2>&1
        firewall-cmd --reload > /dev/null 2>&1
        print_success "firewalld 配置完成"
    fi

    # 检查 ufw
    if command -v ufw &> /dev/null && systemctl is-active --quiet ufw 2>/dev/null; then
        print_info "配置 ufw..."
        ufw allow http > /dev/null 2>&1
        ufw allow https > /dev/null 2>&1
        ufw allow ${PORT}/tcp > /dev/null 2>&1
        print_success "ufw 配置完成"
    fi

    print_warning "请记得在云服务商控制台配置安全组"
    print_info "需要开放的端口：80 (HTTP), 443 (HTTPS), $PORT (API)"
}

###############################################################################
# 启动应用
###############################################################################

start_app() {
    print_header "启动应用服务"

    cd "$APP_DIR"

    # 停止旧服务（先停止再删除，避免端口占用）
    print_info "停止旧服务 (如果存在)..."
    pm2 stop $APP_NAME 2>/dev/null || true

    print_info "删除旧服务..."
    pm2 delete $APP_NAME 2>/dev/null || true

    # 启动新服务
    print_info "启动 PM2 服务..."
    pm2 start ecosystem.config.js --env production > /dev/null 2>&1

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
    pm2 save > /dev/null 2>&1
    print_success "PM2 配置已保存"
}

###############################################################################
# 验证部署
###############################################################################

verify_deployment() {
    print_header "验证部署"

    # 检查服务状态
    print_info "检查服务状态..."

    echo ""
    echo "PM2 服务状态:"
    pm2 status $APP_NAME

    echo ""
    echo "Nginx 服务状态:"
    systemctl status nginx --no-pager | head -5

    # 测试 API
    print_info "测试 API 接口..."
    API_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:${PORT}/api/ 2>/dev/null || echo "000")

    if [ "$API_RESPONSE" = "404" ] || [ "$API_RESPONSE" = "200" ]; then
        print_success "API 接口响应正常 (HTTP $API_RESPONSE)"
    else
        print_warning "API 接口响应异常 (HTTP $API_RESPONSE)"
    fi

    # 测试 Nginx
    print_info "测试 Nginx 配置..."
    NGINX_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1/ 2>/dev/null || echo "000")

    if [ "$NGINX_RESPONSE" = "200" ] || [ "$NGINX_RESPONSE" = "304" ]; then
        print_success "Nginx 响应正常 (HTTP $NGINX_RESPONSE)"
    else
        print_warning "Nginx 响应异常 (HTTP $NGINX_RESPONSE)"
    fi
}

###############################################################################
# 显示部署信息
###############################################################################

show_deployment_info() {
    print_header "部署完成"

    # 构建完整域名
    if [ -n "$SUB_DOMAIN" ]; then
        FULL_DOMAIN="$SUB_DOMAIN.$DOMAIN_NAME"
    else
        FULL_DOMAIN="$DOMAIN_NAME"
    fi

    # 项目访问路径
    PROJECT_PATH="/$PROJECT_SHORT_NAME"

    # 使用预设的服务器 IP
    PUBLIC_IP="$SERVER_IP"

    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  部署成功！${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "${BLUE}访问地址:${NC}"
    echo "  - 域名：http://$FULL_DOMAIN$PROJECT_PATH/"
    echo "  - 公网 IP：http://$PUBLIC_IP$PROJECT_PATH/"
    echo "  - 测试：http://$FULL_DOMAIN$PROJECT_PATH/test.html?code=验证码"
    echo ""
    echo -e "${BLUE}管理命令:${NC}"
    echo "  - 查看状态：pm2 status"
    echo "  - 查看日志：pm2 logs $APP_NAME"
    echo "  - 重启服务：pm2 restart $APP_NAME"
    echo "  - 停止服务：pm2 stop $APP_NAME"
    echo ""
    echo -e "${BLUE}项目目录:${NC}"
    echo "  - $APP_DIR"
    echo ""
    echo -e "${BLUE}验证码目录:${NC}"
    echo "  - $APP_DIR/data/codes/"
    echo ""

    # 显示可用的验证码
    if [ -d "$APP_DIR/data/codes" ]; then
        echo -e "${BLUE}可用验证码 (前 10 个):${NC}"
        ls "$APP_DIR/data/codes/" 2>/dev/null | head -10 | sed 's/.json$//' | while read code; do
            echo "  - $code"
        done
    fi

    echo ""
    echo -e "${YELLOW}注意事项:${NC}"
    echo "  1. 请在阿里云控制台配置安全组，开放端口 80/443/${PORT}"
    echo "  2. 如需使用域名访问，请配置 DNS 解析：$FULL_DOMAIN → $PUBLIC_IP"
    echo "  3. 建议使用 Certbot 配置 HTTPS 加密"
    echo ""
}

###############################################################################
# 主函数
###############################################################################

main() {
    clear

    echo -e "${BLUE}"
    echo "╔════════════════════════════════════════╗"
    echo "║   恋爱脑测试 H5 - 一键部署脚本        ║"
    echo "║   PM2 Version                         ║"
    echo "╚════════════════════════════════════════╝"
    echo -e "${NC}"
    echo ""

    # 执行部署步骤
    check_root
    check_os
    setup_environment
    setup_systemd
    setup_project_dir

    # 部署代码
    deploy_code

    setup_nginx
    setup_firewall
    start_app
    verify_deployment
    show_deployment_info
}

# 运行主函数
main "$@"
