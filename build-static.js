#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 开始构建静态文件...');

// 确保astro.config.mjs设置为静态构建
const configPath = path.join(__dirname, 'astro.config.mjs');
let configContent = fs.readFileSync(configPath, 'utf8');

// 确保output为static
if (!configContent.includes("output: 'static'")) {
  configContent = configContent.replace(/output:\s*['"][^'"]+['"]/, "output: 'static'");
  fs.writeFileSync(configPath, configContent);
  console.log('✅ 更新astro.config.mjs为静态构建模式');
}

// 运行构建命令
const buildProcess = spawn('npm', ['run', 'build'], {
  stdio: 'inherit',
  cwd: __dirname
});

buildProcess.on('close', (code) => {
  if (code === 0) {
    console.log('✅ 构建完成!');
    
    // 检查生成的文件
    const distPath = path.join(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      const files = fs.readdirSync(distPath);
      console.log('📁 生成的文件:', files);
      
      // 检查是否有HTML文件
      const htmlFiles = files.filter(f => f.endsWith('.html'));
      if (htmlFiles.length > 0) {
        console.log('✅ HTML文件生成成功:', htmlFiles);
      } else {
        console.log('⚠️  未找到HTML文件，可能还是SSR模式');
      }
    }
  } else {
    console.error('❌ 构建失败，退出码:', code);
    process.exit(code);
  }
});

buildProcess.on('error', (err) => {
  console.error('❌ 构建过程出错:', err);
  process.exit(1);
}); 