import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 数据库文件路径
const DB_PATH = join(__dirname, '..', 'domains.db');

class DomainDatabase {
  constructor() {
    this.db = null;
  }

  // 初始化数据库连接
  async init() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
          console.error('数据库连接失败:', err.message);
          reject(err);
        } else {
          console.log('✅ SQLite数据库连接成功');
          this.createTable().then(resolve).catch(reject);
        }
      });
    });
  }

  // 创建domains表和分组相关表
  async createTable() {
    const createDomainsTableSQL = `
      CREATE TABLE IF NOT EXISTS domains (
        id TEXT PRIMARY KEY,
        domain TEXT UNIQUE NOT NULL,
        registrar TEXT,
        expiresAt TEXT,
        dnsProvider TEXT,
        domainStatus TEXT,
        status TEXT DEFAULT 'normal' CHECK(status IN ('normal', 'expiring', 'expired', 'failed', 'unregistered')),
        lastCheck TEXT,
        notifications BOOLEAN DEFAULT 1,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `;

    const createGroupsTableSQL = `
      CREATE TABLE IF NOT EXISTS groups (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        color TEXT DEFAULT '#3B82F6',
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `;

    const createDomainGroupsTableSQL = `
      CREATE TABLE IF NOT EXISTS domain_groups (
        id TEXT PRIMARY KEY,
        domainId TEXT NOT NULL,
        groupId TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (domainId) REFERENCES domains (id) ON DELETE CASCADE,
        FOREIGN KEY (groupId) REFERENCES groups (id) ON DELETE CASCADE,
        UNIQUE(domainId, groupId)
      )
    `;

    return new Promise((resolve, reject) => {
      // 创建domains表
      this.db.run(createDomainsTableSQL, (err) => {
        if (err) {
          console.error('创建domains表失败:', err.message);
          reject(err);
          return;
        }
        console.log('✅ domains表创建成功');

        // 创建groups表
        this.db.run(createGroupsTableSQL, (err) => {
          if (err) {
            console.error('创建groups表失败:', err.message);
            reject(err);
            return;
          }
          console.log('✅ groups表创建成功');

          // 创建domain_groups关联表
          this.db.run(createDomainGroupsTableSQL, (err) => {
            if (err) {
              console.error('创建domain_groups表失败:', err.message);
              reject(err);
              return;
            }
            console.log('✅ domain_groups表创建成功');
            
            // 创建默认分组
            this.createDefaultGroups().then(resolve).catch(reject);
          });
        });
      });
    });
  }

  // 创建默认分组
  async createDefaultGroups() {
    const defaultGroups = [
      {
        id: 'default',
        name: '默认分组',
        description: '未分组的域名',
        color: '#6B7280'
      },
      {
        id: 'important',
        name: '重要域名',
        description: '核心业务域名',
        color: '#EF4444'
      },
      {
        id: 'development',
        name: '开发测试',
        description: '开发和测试环境域名',
        color: '#10B981'
      }
    ];

    for (const group of defaultGroups) {
      await this.addGroupIfNotExists(group);
    }
  }

  // 添加分组（如果不存在）
  async addGroupIfNotExists(groupData) {
    const { id, name, description, color } = groupData;
    const now = new Date().toISOString();

    const insertSQL = `
      INSERT OR IGNORE INTO groups (id, name, description, color, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    return new Promise((resolve, reject) => {
      this.db.run(insertSQL, [id, name, description, color, now, now], function(err) {
        if (err) {
          console.error('创建默认分组失败:', err.message);
          reject(err);
        } else {
          if (this.changes > 0) {
            console.log(`✅ 默认分组"${name}"创建成功`);
          }
          resolve();
        }
      });
    });
  }

  // 添加域名
  async addDomain(domainData) {
    const {
      id,
      domain,
      registrar,
      expiresAt,
      dnsProvider,
      domainStatus,
      status,
      lastCheck,
      notifications,
      createdAt,
      updatedAt
    } = domainData;

    const insertSQL = `
      INSERT INTO domains (
        id, domain, registrar, expiresAt, dnsProvider, domainStatus, 
        status, lastCheck, notifications, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    return new Promise((resolve, reject) => {
      this.db.run(insertSQL, [
        id, domain, registrar, expiresAt, dnsProvider, domainStatus,
        status, lastCheck, notifications ? 1 : 0, createdAt, updatedAt
      ], function(err) {
        if (err) {
          console.error('添加域名失败:', err.message);
          reject(err);
        } else {
          console.log(`✅ 域名 ${domain} 添加成功`);
          resolve({ ...domainData, rowId: this.lastID });
        }
      });
    });
  }

  // 获取所有域名
  async getAllDomains() {
    const selectSQL = `SELECT * FROM domains ORDER BY createdAt DESC`;

    return new Promise((resolve, reject) => {
      this.db.all(selectSQL, [], (err, rows) => {
        if (err) {
          console.error('获取域名列表失败:', err.message);
          reject(err);
        } else {
          // 转换数据类型
          const domains = rows.map(row => ({
            ...row,
            notifications: Boolean(row.notifications),
            expiresAt: row.expiresAt || null,
            lastCheck: row.lastCheck || null
          }));
          resolve(domains);
        }
      });
    });
  }

  // 根据ID获取域名
  async getDomainById(id) {
    const selectSQL = `SELECT * FROM domains WHERE id = ?`;

    return new Promise((resolve, reject) => {
      this.db.get(selectSQL, [id], (err, row) => {
        if (err) {
          reject(err);
        } else if (row) {
          resolve({
            ...row,
            notifications: Boolean(row.notifications)
          });
        } else {
          resolve(null);
        }
      });
    });
  }

  // 根据域名获取记录
  async getDomainByName(domain) {
    const selectSQL = `SELECT * FROM domains WHERE domain = ?`;

    return new Promise((resolve, reject) => {
      this.db.get(selectSQL, [domain], (err, row) => {
        if (err) {
          reject(err);
        } else if (row) {
          resolve({
            ...row,
            notifications: Boolean(row.notifications)
          });
        } else {
          resolve(null);
        }
      });
    });
  }

  // 更新域名信息
  async updateDomain(id, updateData) {
    const fields = [];
    const values = [];

    // 动态构建更新字段
    for (const [key, value] of Object.entries(updateData)) {
      if (key !== 'id') {
        fields.push(`${key} = ?`);
        if (key === 'notifications') {
          values.push(value ? 1 : 0);
        } else {
          values.push(value);
        }
      }
    }

    // 添加updatedAt
    fields.push('updatedAt = ?');
    values.push(new Date().toISOString());
    values.push(id);

    const updateSQL = `UPDATE domains SET ${fields.join(', ')} WHERE id = ?`;

    return new Promise((resolve, reject) => {
      this.db.run(updateSQL, values, function(err) {
        if (err) {
          console.error('更新域名失败:', err.message);
          reject(err);
        } else {
          console.log(`✅ 域名 ${id} 更新成功`);
          resolve({ changes: this.changes });
        }
      });
    });
  }

  // 删除域名
  async deleteDomain(id) {
    const deleteSQL = `DELETE FROM domains WHERE id = ?`;

    return new Promise((resolve, reject) => {
      this.db.run(deleteSQL, [id], function(err) {
        if (err) {
          console.error('删除域名失败:', err.message);
          reject(err);
        } else {
          console.log(`✅ 域名 ${id} 删除成功`);
          resolve({ changes: this.changes });
        }
      });
    });
  }

  // 获取域名统计信息
  async getDomainStats() {
    const statsSQL = `
      SELECT 
        status,
        COUNT(*) as count
      FROM domains 
      GROUP BY status
    `;

    return new Promise((resolve, reject) => {
      this.db.all(statsSQL, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const stats = {
            total: 0,
            normal: 0,
            expiring: 0,
            expired: 0,
            failed: 0,
            unregistered: 0
          };

          rows.forEach(row => {
            stats[row.status] = row.count;
            stats.total += row.count;
          });

          resolve(stats);
        }
      });
    });
  }

  // ====== 分组管理相关方法 ======

  // 获取所有分组
  async getAllGroups() {
    const selectSQL = `
      SELECT g.*, 
             COUNT(dg.domainId) as domainCount
      FROM groups g
      LEFT JOIN domain_groups dg ON g.id = dg.groupId
      GROUP BY g.id, g.name, g.description, g.color, g.createdAt, g.updatedAt
      ORDER BY g.createdAt ASC
    `;

    return new Promise((resolve, reject) => {
      this.db.all(selectSQL, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // 创建新分组
  async createGroup(groupData) {
    const { name, description, color } = groupData;
    const id = 'group_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const now = new Date().toISOString();

    const insertSQL = `
      INSERT INTO groups (id, name, description, color, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    return new Promise((resolve, reject) => {
      this.db.run(insertSQL, [id, name, description, color, now, now], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            id,
            name,
            description,
            color,
            createdAt: now,
            updatedAt: now,
            domainCount: 0
          });
        }
      });
    });
  }

  // 更新分组
  async updateGroup(id, groupData) {
    const { name, description, color } = groupData;
    const updatedAt = new Date().toISOString();

    const updateSQL = `
      UPDATE groups 
      SET name = ?, description = ?, color = ?, updatedAt = ?
      WHERE id = ?
    `;

    return new Promise((resolve, reject) => {
      this.db.run(updateSQL, [name, description, color, updatedAt, id], function(err) {
        if (err) {
          reject(err);
        } else if (this.changes === 0) {
          reject(new Error('分组不存在'));
        } else {
          resolve({ id, name, description, color, updatedAt });
        }
      });
    });
  }

  // 删除分组
  async deleteGroup(id) {
    // 检查是否为默认分组
    if (['default', 'important', 'development'].includes(id)) {
      throw new Error('无法删除系统默认分组');
    }

    const deleteSQL = `DELETE FROM groups WHERE id = ?`;

    return new Promise((resolve, reject) => {
      this.db.run(deleteSQL, [id], function(err) {
        if (err) {
          reject(err);
        } else if (this.changes === 0) {
          reject(new Error('分组不存在'));
        } else {
          resolve({ success: true, deletedCount: this.changes });
        }
      });
    });
  }

  // 将域名添加到分组
  async addDomainToGroup(domainId, groupId) {
    const id = 'dg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const createdAt = new Date().toISOString();

    const insertSQL = `
      INSERT OR IGNORE INTO domain_groups (id, domainId, groupId, createdAt)
      VALUES (?, ?, ?, ?)
    `;

    return new Promise((resolve, reject) => {
      this.db.run(insertSQL, [id, domainId, groupId, createdAt], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ success: true, added: this.changes > 0 });
        }
      });
    });
  }

  // 从分组中移除域名
  async removeDomainFromGroup(domainId, groupId) {
    const deleteSQL = `
      DELETE FROM domain_groups 
      WHERE domainId = ? AND groupId = ?
    `;

    return new Promise((resolve, reject) => {
      this.db.run(deleteSQL, [domainId, groupId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ success: true, removed: this.changes > 0 });
        }
      });
    });
  }

  // 获取分组中的域名
  async getDomainsByGroup(groupId) {
    const selectSQL = `
      SELECT d.*
      FROM domains d
      INNER JOIN domain_groups dg ON d.id = dg.domainId
      WHERE dg.groupId = ?
      ORDER BY d.domain ASC
    `;

    return new Promise((resolve, reject) => {
      this.db.all(selectSQL, [groupId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // 获取未分组的域名
  async getUngroupedDomains() {
    const selectSQL = `
      SELECT d.*
      FROM domains d
      LEFT JOIN domain_groups dg ON d.id = dg.domainId
      WHERE dg.domainId IS NULL
      ORDER BY d.domain ASC
    `;

    return new Promise((resolve, reject) => {
      this.db.all(selectSQL, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // 获取域名的分组信息
  async getDomainGroups(domainId) {
    const selectSQL = `
      SELECT g.*
      FROM groups g
      INNER JOIN domain_groups dg ON g.id = dg.groupId
      WHERE dg.domainId = ?
      ORDER BY g.name ASC
    `;

    return new Promise((resolve, reject) => {
      this.db.all(selectSQL, [domainId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // 获取分组统计信息
  async getGroupStats() {
    const statsSQL = `
      SELECT 
        g.id,
        g.name,
        g.color,
        COUNT(dg.domainId) as domainCount,
        COUNT(CASE WHEN d.status = 'normal' THEN 1 END) as normalCount,
        COUNT(CASE WHEN d.status = 'expiring' THEN 1 END) as expiringCount,
        COUNT(CASE WHEN d.status = 'expired' THEN 1 END) as expiredCount,
        COUNT(CASE WHEN d.status = 'failed' THEN 1 END) as failedCount
      FROM groups g
      LEFT JOIN domain_groups dg ON g.id = dg.groupId
      LEFT JOIN domains d ON dg.domainId = d.id
      GROUP BY g.id, g.name, g.color
      ORDER BY g.name ASC
    `;

    return new Promise((resolve, reject) => {
      this.db.all(statsSQL, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // 获取即将到期的域名 (90天内)
  async getExpiringDomains(days = 90) {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + days);
    
    const selectSQL = `
      SELECT * FROM domains 
      WHERE expiresAt IS NOT NULL 
      AND datetime(expiresAt) <= datetime(?)
      AND status = 'normal'
      ORDER BY expiresAt ASC
    `;

    return new Promise((resolve, reject) => {
      this.db.all(selectSQL, [thresholdDate.toISOString()], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const domains = rows.map(row => ({
            ...row,
            notifications: Boolean(row.notifications)
          }));
          resolve(domains);
        }
      });
    });
  }

  // 批量更新域名状态
  async updateDomainStatuses() {
    const now = new Date();
    const expiring90Days = new Date(now.getTime() + (90 * 24 * 60 * 60 * 1000));

    // 更新已过期的域名
    const updateExpiredSQL = `
      UPDATE domains 
      SET status = 'expired', updatedAt = ?
      WHERE datetime(expiresAt) <= datetime(?) 
      AND status NOT IN ('failed', 'unregistered')
    `;

    // 更新即将到期的域名 (90天内)
    const updateExpiringSQL = `
      UPDATE domains 
      SET status = 'expiring', updatedAt = ?
      WHERE datetime(expiresAt) > datetime(?) 
      AND datetime(expiresAt) <= datetime(?) 
      AND status NOT IN ('failed', 'unregistered', 'expired')
    `;

    const currentTime = now.toISOString();

    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run(updateExpiredSQL, [currentTime, currentTime], (err) => {
          if (err) {
            console.error('更新过期域名状态失败:', err);
            reject(err);
            return;
          }
        });

        this.db.run(updateExpiringSQL, [currentTime, currentTime, expiring90Days.toISOString()], function(err) {
          if (err) {
            console.error('更新即将到期域名状态失败:', err);
            reject(err);
          } else {
            console.log('✅ 域名状态批量更新完成');
            resolve();
          }
        });
      });
    });
  }

  // 关闭数据库连接
  close() {
    return new Promise((resolve) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            console.error('关闭数据库连接失败:', err.message);
          } else {
            console.log('✅ 数据库连接已关闭');
          }
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

// 创建单例实例
const db = new DomainDatabase();

export default db; 