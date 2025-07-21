const https = require('https');
const http = require('http');

// 测试认证API
async function testAuthAPI() {
    console.log('🔐 测试DomainFlow认证API...\n');
    
    try {
        // 1. 测试验证码API
        console.log('1️⃣ 测试验证码生成...');
        const captchaResult = await makeRequest('GET', '/api/auth/captcha');
        console.log('✅ 验证码API响应:', JSON.stringify(captchaResult, null, 2));
        
        const captchaId = captchaResult.success ? captchaResult.data.id : null;
        
        // 2. 测试登录API（错误验证码）
        console.log('\n2️⃣ 测试登录API（错误验证码）...');
        const loginResult1 = await makeRequest('POST', '/api/auth/login', {
            password: 'admin123456',
            captchaId: captchaId,
            captchaText: 'XXXX'
        });
        console.log('✅ 错误验证码响应:', JSON.stringify(loginResult1, null, 2));
        
        // 3. 测试登录API（错误密码）
        console.log('\n3️⃣ 测试登录API（错误密码）...');
        const captchaResult2 = await makeRequest('GET', '/api/auth/captcha');
        const loginResult2 = await makeRequest('POST', '/api/auth/login', {
            password: 'wrong_password',
            captchaId: captchaResult2.data.id,
            captchaText: 'test'
        });
        console.log('✅ 错误密码响应:', JSON.stringify(loginResult2, null, 2));
        
        // 4. 测试统计API
        console.log('\n4️⃣ 测试统计API...');
        const statsResult = await makeRequest('GET', '/api/auth/stats');
        console.log('✅ 统计API响应:', JSON.stringify(statsResult, null, 2));
        
        console.log('\n🎉 认证API测试完成！');
        
    } catch (error) {
        console.error('❌ 测试失败:', error.message);
    }
}

// HTTP请求辅助函数
function makeRequest(method, path, data) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(body);
                    resolve(result);
                } catch (e) {
                    resolve({ error: 'Invalid JSON', body });
                }
            });
        });
        
        req.on('error', reject);
        
        if (data) {
            req.write(JSON.stringify(data));
        }
        
        req.end();
    });
}

// 运行测试
testAuthAPI(); 