#!/bin/bash

# 域名监控平台 - 修改密码示例脚本
# 使用方法: ./change-password-example.sh

echo "🔐 域名监控平台 - 修改密码工具"
echo "================================"

# 配置服务器地址
SERVER_URL="http://localhost:3001"

# 提示输入密码
echo -n "请输入当前密码: "
read -s CURRENT_PASSWORD
echo

echo -n "请输入新密码 (至少6位): "
read -s NEW_PASSWORD
echo

echo -n "确认新密码: "
read -s CONFIRM_PASSWORD
echo

# 验证新密码
if [ "$NEW_PASSWORD" != "$CONFIRM_PASSWORD" ]; then
    echo "❌ 两次输入的新密码不一致，请重新运行脚本"
    exit 1
fi

if [ ${#NEW_PASSWORD} -lt 6 ]; then
    echo "❌ 新密码长度至少需要6位字符"
    exit 1
fi

echo
echo "正在登录..."

# 第1步：先登录获取会话ID
LOGIN_RESPONSE=$(curl -s -X POST "$SERVER_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"password\": \"$CURRENT_PASSWORD\"}")

# 检查登录是否成功
if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
    # 提取会话ID
    SESSION_ID=$(echo "$LOGIN_RESPONSE" | grep -o '"sessionId":"[^"]*"' | cut -d'"' -f4)
    echo "✅ 登录成功"
    
    # 第2步：修改密码
    echo "正在修改密码..."
    CHANGE_RESPONSE=$(curl -s -X POST "$SERVER_URL/api/auth/change-password" \
        -H "Content-Type: application/json" \
        -H "X-Session-Id: $SESSION_ID" \
        -d "{\"oldPassword\": \"$CURRENT_PASSWORD\", \"newPassword\": \"$NEW_PASSWORD\"}")
    
    # 检查修改是否成功
    if echo "$CHANGE_RESPONSE" | grep -q '"success":true'; then
        echo "🎉 密码修改成功！"
        echo "✅ 新密码已生效，请使用新密码登录"
        
        # 第3步：登出当前会话（可选）
        curl -s -X POST "$SERVER_URL/api/auth/logout" \
            -H "X-Session-Id: $SESSION_ID" > /dev/null
        echo "✅ 已安全登出"
        
    else
        ERROR_MSG=$(echo "$CHANGE_RESPONSE" | grep -o '"message":"[^"]*"' | cut -d'"' -f4)
        echo "❌ 密码修改失败: $ERROR_MSG"
        exit 1
    fi
    
else
    ERROR_MSG=$(echo "$LOGIN_RESPONSE" | grep -o '"message":"[^"]*"' | cut -d'"' -f4)
    echo "❌ 登录失败: $ERROR_MSG"
    
    # 检查是否需要验证码
    if echo "$LOGIN_RESPONSE" | grep -q '"requiresCaptcha":true'; then
        CAPTCHA_QUESTION=$(echo "$LOGIN_RESPONSE" | grep -o '"question":"[^"]*"' | cut -d'"' -f4)
        CAPTCHA_ID=$(echo "$LOGIN_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
        
        echo "🔢 需要验证码: $CAPTCHA_QUESTION"
        echo -n "请输入验证码答案: "
        read CAPTCHA_ANSWER
        
        # 使用验证码重新登录
        LOGIN_RESPONSE=$(curl -s -X POST "$SERVER_URL/api/auth/login" \
            -H "Content-Type: application/json" \
            -d "{\"password\": \"$CURRENT_PASSWORD\", \"captcha\": \"$CAPTCHA_ANSWER\", \"captchaId\": \"$CAPTCHA_ID\"}")
        
        if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
            SESSION_ID=$(echo "$LOGIN_RESPONSE" | grep -o '"sessionId":"[^"]*"' | cut -d'"' -f4)
            echo "✅ 验证码登录成功"
            
            # 修改密码
            CHANGE_RESPONSE=$(curl -s -X POST "$SERVER_URL/api/auth/change-password" \
                -H "Content-Type: application/json" \
                -H "X-Session-Id: $SESSION_ID" \
                -d "{\"oldPassword\": \"$CURRENT_PASSWORD\", \"newPassword\": \"$NEW_PASSWORD\"}")
            
            if echo "$CHANGE_RESPONSE" | grep -q '"success":true'; then
                echo "🎉 密码修改成功！"
            else
                ERROR_MSG=$(echo "$CHANGE_RESPONSE" | grep -o '"message":"[^"]*"' | cut -d'"' -f4)
                echo "❌ 密码修改失败: $ERROR_MSG"
            fi
        else
            echo "❌ 验证码登录失败"
        fi
    fi
    
    exit 1
fi

echo
echo "📝 修改密码完成！"
echo "💡 提示: 请妥善保管新密码，建议定期更换密码以确保安全" 