// DomainFlow 第三方API集成功能演示脚本
import { API_CONFIG, getQueryStrategy, isApiEnabled } from './server/config.js';

console.log('🚀 DomainFlow 第三方API集成功能演示\n');

// 演示配置状态
console.log('📋 当前API配置状态:');
console.log(`   ✅ 标准WHOIS: ${isApiEnabled('standard') ? '已启用' : '未启用'}`);
console.log(`   ${isApiEnabled('viewdns') ? '✅' : '❌'} ViewDNS.info: ${isApiEnabled('viewdns') ? '已启用' : '未启用'}`);
console.log(`   ${isApiEnabled('ip2whois') ? '✅' : '❌'} IP2WHOIS.com: ${isApiEnabled('ip2whois') ? '已启用' : '未启用'}`);

// 演示查询策略
console.log('\n🎯 智能查询策略演示:');
const testCases = [
  { domain: 'example.com', description: '普通.com域名 (默认策略)' },
  { domain: 'baidu.cn', description: '中国.cn域名 (优先第三方API)' },
  { domain: 'yandex.ru', description: '俄罗斯.ru域名 (优先ViewDNS)' },
  { domain: 'test.tk', description: '免费.tk域名 (优先第三方API)' },
  { domain: 'example.ml', description: '免费.ml域名 (优先第三方API)' }
];

testCases.forEach(({ domain, description }) => {
  const strategy = getQueryStrategy(domain);
  console.log(`   📍 ${domain} (${description})`);
  console.log(`      查询顺序: ${strategy.join(' → ')}`);
});

// 功能特性介绍
console.log('\n🌟 核心功能特性:');
console.log('   🔄 智能回退机制: 标准WHOIS失败时自动切换到第三方API');
console.log('   🎯 TLD优先策略: 针对特殊域名后缀优化查询顺序'); 
console.log('   ⚡ 速率控制: 自动控制API请求频率，避免触发限制');
console.log('   📊 详细日志: 完整的查询过程追踪和结果来源标识');
console.log('   🛡️ 错误处理: 完善的异常处理和用户友好的错误提示');

// API服务商信息
console.log('\n📡 支持的API服务商:');
console.log('   🔗 ViewDNS.info');
console.log('      • 用途: 冷门ccTLD和特殊域名后缀');
console.log('      • 免费额度: 1000次/月');
console.log('      • 官网: https://viewdns.info/');

console.log('\n   🔗 IP2WHOIS.com');
console.log('      • 用途: 专业WHOIS查询服务');
console.log('      • 免费额度: 500次/月'); 
console.log('      • 官网: https://www.ip2whois.com/');

// 配置指导
console.log('\n⚙️ 快速配置指南:');
console.log('   1️⃣ 获取API密钥:');
console.log('      - 访问服务商官网注册账户');
console.log('      - 在控制面板获取API密钥');

console.log('\n   2️⃣ 配置环境变量:');
console.log('      创建 .env 文件:');
console.log('      VIEWDNS_API_KEY=your_key_here');
console.log('      IP2WHOIS_API_KEY=your_key_here');

console.log('\n   3️⃣ 启用API服务:');
console.log('      在 server/config.js 中设置 enabled: true');

console.log('\n   4️⃣ 重启服务器应用配置');

// 使用建议
console.log('\n💡 使用建议:');
console.log('   🆓 个人用户: 免费配额通常够用，建议同时配置两个API作备份');
console.log('   🏢 企业用户: 可考虑付费计划获得更高查询限额');
console.log('   🔧 开发者: 可根据业务需求调整TLD优先策略配置');
console.log('   📈 监控: 定期检查API使用量，避免超出配额');

if (!isApiEnabled('viewdns') && !isApiEnabled('ip2whois')) {
  console.log('\n⚠️  提示: 当前仅启用标准WHOIS查询');
  console.log('   对于冷门域名后缀，建议配置第三方API以提高查询成功率');
  console.log('   详细配置说明请查看 API-CONFIG.md 文件');
}

console.log('\n🎉 演示完成! 开始体验智能域名查询功能吧!'); 