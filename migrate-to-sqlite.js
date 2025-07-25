import fs from 'fs/promises';
import db from './server/database.js';

async function migrateData() {
  console.log('🚀 开始数据迁移：JSON → SQLite');
  
  try {
    // 初始化数据库
    await db.init();
    
    // 检查JSON文件是否存在
    let jsonData = [];
    try {
      const data = await fs.readFile('domains.json', 'utf8');
      jsonData = JSON.parse(data);
      console.log(`📂 找到 ${jsonData.length} 条域名记录`);
    } catch (error) {
      console.log('📂 未找到domains.json文件，将创建空数据库');
      return;
    }
    
    // 检查是否已有数据
    const existingDomains = await db.getAllDomains();
    if (existingDomains.length > 0) {
      console.log(`⚠️  数据库中已有 ${existingDomains.length} 条记录`);
      console.log('如需重新迁移，请先删除 domains.db 文件');
      return;
    }
    
    // 迁移数据
    let successCount = 0;
    let errorCount = 0;
    
    for (const domain of jsonData) {
      try {
        await db.addDomain(domain);
        successCount++;
      } catch (error) {
        console.error(`❌ 迁移域名 ${domain.domain} 失败:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`✅ 数据迁移完成！`);
    console.log(`   成功迁移: ${successCount} 条记录`);
    console.log(`   失败: ${errorCount} 条记录`);
    
    // 备份原JSON文件
    if (jsonData.length > 0) {
      const backupName = `domains.json.backup.${Date.now()}`;
      await fs.copyFile('domains.json', backupName);
      console.log(`📦 原JSON文件已备份为: ${backupName}`);
    }
    
    // 验证数据
    const migratedDomains = await db.getAllDomains();
    console.log(`🔍 验证：数据库中现有 ${migratedDomains.length} 条记录`);
    
  } catch (error) {
    console.error('❌ 数据迁移失败:', error);
  } finally {
    await db.close();
  }
}

// 如果是直接执行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateData();
}

export default migrateData; 