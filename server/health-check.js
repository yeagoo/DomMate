// Health check module for DomMate
export const setupHealthCheck = (app, db) => {
  // Health check endpoint
  app.get('/health', async (req, res) => {
    const healthCheck = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '2.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks: {}
    };

    try {
      // Database health check
      if (db && db.db) {
        try {
          // Simple database test using a basic query
          await new Promise((resolve, reject) => {
            db.db.get('SELECT 1 as test', [], (err, row) => {
              if (err) {
                reject(err);
              } else {
                resolve(row);
              }
            });
          });
          healthCheck.checks.database = { status: 'healthy', message: 'Database connection is working' };
        } catch (error) {
          healthCheck.checks.database = { status: 'unhealthy', message: `Database error: ${error.message}` };
          healthCheck.status = 'WARNING';
        }
      } else {
        healthCheck.checks.database = { status: 'unknown', message: 'Database module not available' };
        healthCheck.status = 'WARNING';
      }

      // Memory check
      const memoryUsage = process.memoryUsage();
      const memoryUsageMB = {
        rss: Math.round(memoryUsage.rss / 1024 / 1024),
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        external: Math.round(memoryUsage.external / 1024 / 1024)
      };

      // Check if memory usage is too high (>500MB RSS)
      if (memoryUsageMB.rss > 500) {
        healthCheck.checks.memory = { status: 'warning', message: `High memory usage: ${memoryUsageMB.rss}MB RSS`, usage: memoryUsageMB };
        healthCheck.status = 'WARNING';
      } else {
        healthCheck.checks.memory = { status: 'healthy', message: 'Memory usage is normal', usage: memoryUsageMB };
      }

      // Disk space check (for logs and database)
      try {
        const fs = await import('fs');
        const stats = fs.statSync('./');
        healthCheck.checks.disk = { status: 'healthy', message: 'Disk access is working' };
      } catch (error) {
        healthCheck.checks.disk = { status: 'unhealthy', message: `Disk access error: ${error.message}` };
        healthCheck.status = 'ERROR';
      }

      // Overall status determination
      const allChecks = Object.values(healthCheck.checks);
      const hasError = allChecks.some(check => check.status === 'unhealthy');
      const hasWarning = allChecks.some(check => check.status === 'warning');

      if (hasError) {
        healthCheck.status = 'ERROR';
        res.status(500);
      } else if (hasWarning) {
        healthCheck.status = 'WARNING';
        res.status(200);
      } else {
        healthCheck.status = 'OK';
        res.status(200);
      }

      res.json(healthCheck);

    } catch (error) {
      healthCheck.status = 'ERROR';
      healthCheck.error = error.message;
      healthCheck.checks.general = { status: 'unhealthy', message: `General error: ${error.message}` };
      res.status(500).json(healthCheck);
    }
  });

  // Readiness check (more strict)
  app.get('/ready', async (req, res) => {
    try {
      // Check if all critical services are ready
      let ready = true;
      const checks = {};

      // Database readiness
      if (db && db.db) {
        try {
          // Try to query the domains table to ensure it's properly initialized
          await new Promise((resolve, reject) => {
            db.db.get('SELECT COUNT(*) as count FROM domains LIMIT 1', [], (err, row) => {
              if (err) {
                reject(err);
              } else {
                resolve(row);
              }
            });
          });
          checks.database = { ready: true, message: 'Database is ready' };
        } catch (error) {
          checks.database = { ready: false, message: `Database not ready: ${error.message}` };
          ready = false;
        }
      } else {
        checks.database = { ready: false, message: 'Database module not available' };
        ready = false;
      }

      if (ready) {
        res.status(200).json({
          status: 'ready',
          timestamp: new Date().toISOString(),
          checks
        });
      } else {
        res.status(503).json({
          status: 'not ready',
          timestamp: new Date().toISOString(),
          checks
        });
      }
    } catch (error) {
      res.status(503).json({
        status: 'not ready',
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  });

  // Liveness check (basic check)
  app.get('/live', (req, res) => {
    res.status(200).json({
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });
}; 