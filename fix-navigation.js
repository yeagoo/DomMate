#!/usr/bin/env node

/**
 * 快速修复导航问题的脚本
 * 主要解决：点击导航菜单但内容不变的问题
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 开始修复导航问题...');

// 1. 检查当前构建状态
const distPath = path.join(__dirname, 'dist');
console.log('\n📁 当前构建状态:');

if (fs.existsSync(distPath)) {
  const distFiles = fs.readdirSync(distPath);
  console.log('dist目录内容:', distFiles);
  
  const hasServer = distFiles.includes('server');
  const hasClient = distFiles.includes('client');
  const hasIndexHtml = distFiles.includes('index.html');
  
  if (hasServer && hasClient && !hasIndexHtml) {
    console.log('❗ 检测到SSR构建，需要转换为静态构建');
    
    // 2. 更新配置为静态构建
    const configPath = path.join(__dirname, 'astro.config.mjs');
    if (fs.existsSync(configPath)) {
      let config = fs.readFileSync(configPath, 'utf8');
      config = config.replace(/output:\s*['"]server['"]/, "output: 'static'");
      config = config.replace(/\/\/\s*adapter:.*?\n/g, ''); // 移除注释的adapter
      config = config.replace(/adapter:.*?,?\n/g, ''); // 移除adapter配置
      fs.writeFileSync(configPath, config);
      console.log('✅ 已更新astro.config.mjs为静态构建');
    }
  } else if (hasIndexHtml) {
    console.log('✅ 已是静态构建');
    
    // 检查页面文件
    const requiredPages = ['groups.html', 'analytics.html', 'email.html'];
    const missingPages = requiredPages.filter(page => !distFiles.includes(page));
    
    if (missingPages.length > 0) {
      console.log('⚠️  缺少页面文件:', missingPages);
      // 创建缺失的页面文件（使用index.html作为模板）
      const indexContent = fs.readFileSync(path.join(distPath, 'index.html'), 'utf8');
      missingPages.forEach(page => {
        const pagePath = path.join(distPath, page);
        fs.writeFileSync(pagePath, indexContent);
        console.log(`✅ 已创建 ${page}`);
      });
    } else {
      console.log('✅ 所有页面文件都存在');
    }
  }
} else {
  console.log('❌ dist目录不存在，需要先构建');
}

// 3. 验证服务器路由配置
const serverPath = path.join(__dirname, 'server/index.js');
if (fs.existsSync(serverPath)) {
  const serverContent = fs.readFileSync(serverPath, 'utf8');
  
  if (serverContent.includes('routeMap') && serverContent.includes('htmlFile')) {
    console.log('✅ 服务器多页面路由配置已存在');
  } else {
    console.log('⚠️  服务器路由配置需要更新');
  }
} else {
  console.log('❌ 服务器文件不存在');
}

// 4. 验证客户端路由组件
const dashboardPath = path.join(__dirname, 'src/components/DashboardWithAuth.tsx');
if (fs.existsSync(dashboardPath)) {
  const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');
  
  if (dashboardContent.includes('currentPath') && dashboardContent.includes('handlePopState')) {
    console.log('✅ 客户端路由组件已更新');
  } else {
    console.log('⚠️  客户端路由组件需要更新');
  }
} else {
  console.log('❌ DashboardWithAuth组件不存在');
}

console.log('\n🎯 修复建议:');
console.log('1. 如果使用Docker，请重新构建镜像');
console.log('2. 如果本地开发，请运行: npm run build');
console.log('3. 确保astro.config.mjs中output设置为"static"');
console.log('4. 检查浏览器控制台是否有JavaScript错误');

console.log('\n✅ 导航修复脚本执行完成!'); 