import { Pool } from 'pg';

// 测试不同的数据库连接字符串配置
const testConfigurations = [
  {
    name: '本地连接（无SSL）',
    url: 'postgresql://postgres:password@localhost:5432/testdb',
    env: {}
  },
  {
    name: '远程连接（自动SSL）',
    url: 'postgresql://postgres:password@remote.example.com:5432/testdb',
    env: {}
  },
  {
    name: '显式启用SSL',
    url: 'postgresql://postgres:password@127.0.0.1:5432/testdb?ssl=true',
    env: {}
  },
  {
    name: '显式要求SSL模式',
    url: 'postgresql://postgres:password@127.0.0.1:5432/testdb?sslmode=require',
    env: {}
  },
  {
    name: '环境变量启用SSL',
    url: 'postgresql://postgres:password@localhost:5432/testdb',
    env: { POSTGRES_SSL: 'true' }
  },
  {
    name: '强制启用SSL',
    url: 'postgresql://postgres:password@localhost:5432/testdb',
    env: { POSTGRES_SSL_FORCE: 'true' }
  },
  {
    name: '当前测试数据库（环境变量SSL）',
    url: 'postgresql://postgres:lgRlZXwjLuWDJfhruZX43scn95QcD9nSjPatrarTSABSzPDSs5vB677MuoSjT6Vi@127.0.0.1:5432/postgres',
    env: { POSTGRES_SSL_FORCE: 'true' }
  }
];

function createPoolWithSSLLogic(databaseUrl, envVars = {}) {
  // 模拟环境变量
  const originalEnv = { ...process.env };
  Object.assign(process.env, envVars);

  // 解析数据库URL以确定是否需要SSL
  const dbUrl = new URL(databaseUrl);

  // 多种方式确定是否需要SSL：
  // 1. 显式在URL中指定 ssl=true 或 sslmode=require
  // 2. 环境变量 POSTGRES_SSL=true
  // 3. 非本地连接默认启用SSL
  // 4. 可以通过环境变量 POSTGRES_SSL_FORCE=true 强制启用
  const explicitSSL = dbUrl.searchParams.get('sslmode') === 'require' || 
                      dbUrl.searchParams.get('ssl') === 'true';
  const envSSL = process.env.POSTGRES_SSL === 'true';
  const forceSSL = process.env.POSTGRES_SSL_FORCE === 'true';
  const isRemote = dbUrl.hostname !== 'localhost' && dbUrl.hostname !== '127.0.0.1';

  const requireSSL = explicitSSL || envSSL || forceSSL || isRemote;

  // SSL配置选项
  const sslConfig = requireSSL ? {
    rejectUnauthorized: process.env.POSTGRES_SSL_REJECT_UNAUTHORIZED === 'true' // 默认为false以支持自签名证书
  } : false;

  const config = {
    connectionString: databaseUrl,
    // 根据多种条件智能配置SSL
    ssl: sslConfig,
    // 连接池配置
    max: parseInt(process.env.POSTGRES_POOL_MAX || '20'), // 最大连接数
    idleTimeoutMillis: parseInt(process.env.POSTGRES_IDLE_TIMEOUT || '30000'), // 空闲连接超时时间
    connectionTimeoutMillis: parseInt(process.env.POSTGRES_CONNECTION_TIMEOUT || '5000'), // 连接超时时间
  };

  // 恢复原始环境变量
  process.env = originalEnv;

  return { 
    config, 
    requireSSL, 
    reasons: {
      explicitSSL,
      envSSL,
      forceSSL,
      isRemote
    }
  };
}

console.log('🔧 数据库连接SSL配置测试\n');

testConfigurations.forEach((test, index) => {
  console.log(`${index + 1}. ${test.name}`);
  console.log(`   URL: ${test.url}`);
  console.log(`   环境变量: ${JSON.stringify(test.env)}`);
  
  const { config, requireSSL, reasons } = createPoolWithSSLLogic(test.url, test.env);
  
  console.log(`   SSL启用: ${requireSSL ? '是' : '否'}`);
  console.log(`   SSL原因: 显式=${reasons.explicitSSL}, 环境=${reasons.envSSL}, 强制=${reasons.forceSSL}, 远程=${reasons.isRemote}`);
  console.log(`   SSL配置: ${JSON.stringify(config.ssl)}`);
  console.log('');
});

// 测试实际连接（使用强制SSL）
async function testActualConnection() {
  const testUrl = 'postgresql://postgres:lgRlZXwjLuWDJfhruZX43scn95QcD9nSjPatrarTSABSzPDSs5vB677MuoSjT6Vi@127.0.0.1:5432/postgres';
  
  console.log('🔄 测试实际数据库连接（强制SSL）...');
  
  // 设置环境变量强制启用SSL
  process.env.POSTGRES_SSL_FORCE = 'true';
  
  const { config } = createPoolWithSSLLogic(testUrl, { POSTGRES_SSL_FORCE: 'true' });
  const pool = new Pool(config);
  
  try {
    const client = await pool.connect();
    console.log('✅ 数据库连接成功');
    
    const result = await client.query('SELECT version(), current_setting(\'ssl\') as ssl_status');
    console.log('📊 数据库信息:');
    console.log(`   版本: ${result.rows[0].version.substring(0, 50)}...`);
    console.log(`   SSL状态: ${result.rows[0].ssl_status}`);
    
    client.release();
    await pool.end();
    
  } catch (error) {
    console.error('❌ 连接失败:', error.message);
  } finally {
    // 清理环境变量
    delete process.env.POSTGRES_SSL_FORCE;
  }
}

// 运行测试
testActualConnection().then(() => {
  console.log('\n🎉 SSL配置测试完成');
}).catch((error) => {
  console.error('💥 测试失败:', error);
});