import { Pool } from 'pg';

// 简单的数据库连接测试
async function testConnection() {
  const pool = new Pool({
    connectionString: 'postgresql://postgres:lgRlZXwjLuWDJfhruZX43scn95QcD9nSjPatrarTSABSzPDSs5vB677MuoSjT6Vi@127.0.0.1:5432/postgres',
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    ssl: {
      rejectUnauthorized: false // 允许自签名证书
    }
  });

  try {
    console.log('🔄 正在连接到PostgreSQL数据库...');
    const client = await pool.connect();
    console.log('✅ 成功连接到PostgreSQL数据库');

    // 测试基本查询
    const result = await client.query('SELECT NOW() as current_time, version()');
    console.log('📅 当前时间:', result.rows[0].current_time);
    console.log('🗄️ 数据库版本:', result.rows[0].version.substring(0, 50) + '...');

    // 测试创建表
    await client.query(`
      CREATE TABLE IF NOT EXISTS connection_test (
        id SERIAL PRIMARY KEY,
        message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ 测试表创建成功');

    // 测试插入数据
    const insertResult = await client.query(
      'INSERT INTO connection_test (message) VALUES ($1) RETURNING *',
      ['连接测试成功']
    );
    console.log('✅ 数据插入成功:', insertResult.rows[0]);

    // 测试查询数据
    const selectResult = await client.query('SELECT * FROM connection_test ORDER BY id DESC LIMIT 1');
    console.log('✅ 数据查询成功:', selectResult.rows[0]);

    // 清理测试数据
    await client.query('DROP TABLE IF EXISTS connection_test');
    console.log('✅ 测试数据清理完成');

    client.release();
    await pool.end();
    console.log('✅ 数据库连接已关闭');

  } catch (error) {
    console.error('❌ 数据库连接失败:', error);
    process.exit(1);
  }
}

// 运行测试
testConnection().then(() => {
  console.log('🎉 数据库连接测试完成');
}).catch((error) => {
  console.error('💥 测试失败:', error);
  process.exit(1);
});