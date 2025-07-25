#!/bin/bash

# 域名监控平台 - 密码管理工具
# 使用方法: ./password-admin-tool.sh

echo "🔐 域名监控平台 - 密码管理工具"
echo "================================"

# 配置服务器地址
SERVER_URL="http://localhost:3001"

# 显示菜单
show_menu() {
    echo
    echo "请选择操作："
    echo "1. 查看当前密码策略"
    echo "2. 设置密码过期天数"
    echo "3. 强制用户修改密码"
    echo "4. 清除强制修改密码标记"
    echo "5. 重置为默认密码 (admin123)"
    echo "6. 查看系统状态"
    echo "0. 退出"
    echo
    echo -n "请输入选项 (0-6): "
}

# 获取认证会话
get_session() {
    echo -n "请输入管理员密码: "
    read -s ADMIN_PASSWORD
    echo
    
    # 登录获取会话ID
    LOGIN_RESPONSE=$(curl -s -X POST "$SERVER_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"password\": \"$ADMIN_PASSWORD\"}")
    
    if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
        SESSION_ID=$(echo "$LOGIN_RESPONSE" | grep -o '"sessionId":"[^"]*"' | cut -d'"' -f4)
        echo "✅ 管理员身份验证成功"
        return 0
    else
        echo "❌ 管理员身份验证失败"
        return 1
    fi
}

# 查看当前密码策略
view_password_policy() {
    echo "📋 当前密码策略："
    echo "----------------"
    
    # 查询强制修改状态
    FORCE_STATUS=$(curl -s "$SERVER_URL/api/auth/force-password-change")
    
    if echo "$FORCE_STATUS" | grep -q '"forcePasswordChange":true'; then
        REASON=$(echo "$FORCE_STATUS" | grep -o '"reason":"[^"]*"' | cut -d'"' -f4)
        echo "🔴 强制修改密码: 启用"
        echo "   原因: $REASON"
    else
        echo "🟢 强制修改密码: 关闭"
    fi
    
    echo
    echo "💡 提示: 密码策略存储在数据库中，包括："
    echo "   - 密码过期天数 (password_expire_days)"
    echo "   - 强制修改标记 (force_password_change)"
    echo "   - 会话过期时间 (session_expiry_hours)"
}

# 设置密码过期天数
set_password_expiry() {
    echo "📅 设置密码过期天数"
    echo "-------------------"
    echo "当前设置: 0 (不过期)"
    echo
    echo "新的过期天数设置："
    echo "  0 - 密码永不过期"
    echo "  30 - 30天后过期"
    echo "  90 - 90天后过期"
    echo "  180 - 180天后过期"
    echo
    echo -n "请输入天数 (0-365): "
    read EXPIRE_DAYS
    
    # 验证输入
    if ! [[ "$EXPIRE_DAYS" =~ ^[0-9]+$ ]] || [ "$EXPIRE_DAYS" -gt 365 ]; then
        echo "❌ 无效输入，请输入0-365之间的数字"
        return 1
    fi
    
    echo "⚠️  注意: 此功能需要直接修改数据库配置"
    echo "建议通过管理界面或数据库工具进行配置"
}

# 强制用户修改密码
force_password_change() {
    if ! get_session; then
        return 1
    fi
    
    echo "🔒 强制用户修改密码"
    echo "------------------"
    echo -n "请输入强制修改的原因: "
    read FORCE_REASON
    
    if [ -z "$FORCE_REASON" ]; then
        FORCE_REASON="管理员要求修改密码"
    fi
    
    # 调用API设置强制修改
    RESPONSE=$(curl -s -X POST "$SERVER_URL/api/auth/force-password-change" \
        -H "Content-Type: application/json" \
        -H "X-Session-Id: $SESSION_ID" \
        -d "{\"reason\": \"$FORCE_REASON\"}")
    
    if echo "$RESPONSE" | grep -q '"success":true'; then
        echo "✅ 已设置强制修改密码"
        echo "   原因: $FORCE_REASON"
        echo "💡 用户下次登录时将被要求修改密码"
    else
        ERROR_MSG=$(echo "$RESPONSE" | grep -o '"message":"[^"]*"' | cut -d'"' -f4)
        echo "❌ 设置失败: $ERROR_MSG"
    fi
}

# 清除强制修改密码标记
clear_force_change() {
    echo "🔓 清除强制修改密码标记"
    echo "---------------------"
    echo "⚠️  注意: 此操作将允许用户正常登录，无需修改密码"
    echo -n "确认清除? (y/N): "
    read CONFIRM
    
    if [[ "$CONFIRM" =~ ^[Yy]$ ]]; then
        echo "💡 此功能需要直接修改数据库"
        echo "建议重启服务器或通过数据库工具清除 force_password_change 标记"
    else
        echo "操作已取消"
    fi
}

# 重置为默认密码
reset_to_default() {
    if ! get_session; then
        return 1
    fi
    
    echo "🔄 重置为默认密码"
    echo "----------------"
    echo "⚠️  警告: 此操作将重置密码为 admin123"
    echo "强烈建议重置后立即修改密码"
    echo
    echo -n "确认重置密码? (y/N): "
    read CONFIRM
    
    if [[ "$CONFIRM" =~ ^[Yy]$ ]]; then
        # 通过修改密码API重置为默认密码
        RESPONSE=$(curl -s -X POST "$SERVER_URL/api/auth/change-password" \
            -H "Content-Type: application/json" \
            -H "X-Session-Id: $SESSION_ID" \
            -d "{\"oldPassword\": \"$ADMIN_PASSWORD\", \"newPassword\": \"admin123\"}")
        
        if echo "$RESPONSE" | grep -q '"success":true'; then
            echo "✅ 密码已重置为 admin123"
            echo "🔒 已自动设置强制修改密码标记"
            
            # 设置强制修改密码
            curl -s -X POST "$SERVER_URL/api/auth/force-password-change" \
                -H "Content-Type: application/json" \
                -H "X-Session-Id: $SESSION_ID" \
                -d '{"reason": "密码已重置为默认密码，请立即修改"}' > /dev/null
                
            echo "💡 用户下次登录时将被要求修改密码"
        else
            ERROR_MSG=$(echo "$RESPONSE" | grep -o '"message":"[^"]*"' | cut -d'"' -f4)
            echo "❌ 重置失败: $ERROR_MSG"
        fi
    else
        echo "操作已取消"
    fi
}

# 查看系统状态
view_system_status() {
    echo "🖥️  系统状态"
    echo "----------"
    
    # 检查服务器状态
    if curl -s "$SERVER_URL/api/auth/info" > /dev/null; then
        echo "✅ 后端服务: 正常运行"
    else
        echo "❌ 后端服务: 无法连接"
    fi
    
    # 获取登录信息
    AUTH_INFO=$(curl -s "$SERVER_URL/api/auth/info")
    if [ $? -eq 0 ]; then
        FAILED_ATTEMPTS=$(echo "$AUTH_INFO" | grep -o '"failedAttempts":[0-9]*' | cut -d':' -f2)
        REQUIRES_CAPTCHA=$(echo "$AUTH_INFO" | grep -o '"requiresCaptcha":[^,}]*' | cut -d':' -f2)
        
        echo "📊 登录统计:"
        echo "   失败尝试: $FAILED_ATTEMPTS 次"
        echo "   需要验证码: $REQUIRES_CAPTCHA"
    fi
    
    echo
    echo "🔗 系统地址:"
    echo "   管理界面: http://localhost:4322/"
    echo "   API地址: http://localhost:3001/api"
}

# 主程序循环
main() {
    while true; do
        show_menu
        read CHOICE
        
        case $CHOICE in
            1) view_password_policy ;;
            2) set_password_expiry ;;
            3) force_password_change ;;
            4) clear_force_change ;;
            5) reset_to_default ;;
            6) view_system_status ;;
            0) 
                echo "👋 感谢使用密码管理工具！"
                exit 0
                ;;
            *)
                echo "❌ 无效选项，请输入 0-6 之间的数字"
                ;;
        esac
        
        echo
        echo -n "按回车键继续..."
        read
    done
}

# 检查服务器连接
echo "🔍 检查服务器连接..."
if curl -s "$SERVER_URL/api/auth/info" > /dev/null; then
    echo "✅ 服务器连接正常"
    main
else
    echo "❌ 无法连接到服务器 ($SERVER_URL)"
    echo "请确保服务器正在运行：node server/index.js"
    exit 1
fi 