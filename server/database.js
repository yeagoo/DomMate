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

  // 创建domains表
  async createTable() {
    const createTableSQL = `
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

    return new Promise((resolve, reject) => {
      this.db.run(createTableSQL, (err) => {
        if (err) {
          console.error('创建表失败:', err.message);
          reject(err);
        } else {
          console.log('✅ domains表创建成功');
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

  // 获取即将到期的域名 (30天内)
  async getExpiringDomains(days = 30) {
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
    const expiring30Days = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));

    // 更新已过期的域名
    const updateExpiredSQL = `
      UPDATE domains 
      SET status = 'expired', updatedAt = ?
      WHERE datetime(expiresAt) <= datetime(?) 
      AND status NOT IN ('failed', 'unregistered')
    `;

    // 更新即将到期的域名 (30天内)
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

        this.db.run(updateExpiringSQL, [currentTime, currentTime, expiring30Days.toISOString()], function(err) {
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