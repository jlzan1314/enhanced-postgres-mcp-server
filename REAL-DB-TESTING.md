# 真实PostgreSQL数据库测试指南

## 概述

本指南介绍如何使用真实的PostgreSQL数据库进行MCP服务器集成测试。

## 数据库连接信息

**测试数据库**: `postgresql://postgres:lgRlZXwjLuWDJfhruZX43scn95QcD9nSjPatrarTSABSzPDSs5vB677MuoSjT6Vi@127.0.0.1:5432/postgres`

- **主机**: 127.0.0.1
- **端口**: 5432
- **数据库**: postgres
- **用户名**: postgres
- **密码**: lgRlZXwjLuWDJfhruZX43scn95QcD9nSjPatrarTSABSzPDSs5vB677MuoSjT6Vi

## 测试文件说明

### 1. `tests/real-postgres.test.ts`
**真实PostgreSQL数据库基础集成测试**

测试内容：
- ✅ 数据库连接测试
- ✅ 基础CRUD操作 (CREATE, READ, UPDATE, DELETE)
- ✅ 复杂查询测试 (JOIN, 聚合, 子查询)
- ✅ 事务处理测试 (COMMIT, ROLLBACK)
- ✅ 错误处理测试
- ✅ 性能测试 (批量操作, 复杂查询)
- ✅ 并发测试

### 2. `tests/mcp-real-postgres.test.ts`
**MCP服务器真实PostgreSQL集成测试**

测试内容：
- ✅ MCP工具基础功能 (query, execute, createTable, insert, update, delete)
- ✅ 复杂业务场景 (电商订单管理, 数据分析查询)
- ✅ 错误处理和事务回滚
- ✅ 性能测试 (批量操作)
- ✅ 边界条件测试 (空查询, SQL注入防护, 大数据量)

## 运行测试命令

### 基础真实数据库测试
```bash
# 运行真实PostgreSQL数据库基础测试
npm run test:real-db

# 运行MCP服务器真实PostgreSQL集成测试
npm run test:mcp-real

# 运行所有真实数据库测试
npm run test:real-all
```

### 完整测试套件
```bash
# 运行所有测试（模拟 + 真实数据库）
npm run test:complete

# 运行稳定测试（仅模拟数据库）
npm run test:stable
```

## 测试特点

### 🔒 安全性
- ✅ 使用参数化查询防止SQL注入
- ✅ 事务处理确保数据一致性
- ✅ 自动清理测试数据

### 🚀 性能
- ✅ 连接池管理
- ✅ 批量操作优化
- ✅ 性能基准测试

### 🛡️ 可靠性
- ✅ 错误处理和回滚机制
- ✅ 并发操作测试
- ✅ 边界条件验证

## 测试数据管理

### 自动清理机制
- 每个测试前后自动清理测试数据
- 使用 `test_` 前缀的表名避免冲突
- 自动重置序列计数器

### 测试表结构
```sql
-- 用户表
CREATE TABLE test_users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 产品表
CREATE TABLE test_products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(50),
    stock_quantity INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 订单表
CREATE TABLE test_orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES test_users(id),
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 性能基准

### 已验证的性能指标
- ✅ **批量插入**: 100条记录 < 5秒
- ✅ **复杂查询**: CTE和JOIN查询 < 500ms
- ✅ **并发操作**: 10个并发请求正常处理
- ✅ **大数据查询**: 100条1KB记录查询 < 5秒

## 故障排除

### 常见问题

1. **连接超时**
   ```
   Error: connect ETIMEDOUT
   ```
   - 检查数据库服务器是否运行
   - 验证网络连接
   - 确认防火墙设置

2. **认证失败**
   ```
   Error: password authentication failed
   ```
   - 验证用户名和密码
   - 检查数据库权限设置

3. **表已存在错误**
   ```
   Error: relation "test_table" already exists
   ```
   - 测试清理机制可能失败
   - 手动清理测试表

### 手动清理命令
```sql
-- 清理所有测试表
DROP TABLE IF EXISTS test_order_items CASCADE;
DROP TABLE IF EXISTS test_orders CASCADE;
DROP TABLE IF EXISTS test_products CASCADE;
DROP TABLE IF EXISTS test_users CASCADE;

-- 清理MCP测试表
DROP TABLE IF EXISTS mcp_test_order_items CASCADE;
DROP TABLE IF EXISTS mcp_test_orders CASCADE;
DROP TABLE IF EXISTS mcp_test_products CASCADE;
DROP TABLE IF EXISTS mcp_test_users CASCADE;
DROP TABLE IF EXISTS mcp_test_simple CASCADE;
```

## 最佳实践

### 测试编写
1. **隔离性**: 每个测试独立运行，不依赖其他测试
2. **清理**: 测试前后自动清理数据
3. **超时**: 设置合理的测试超时时间
4. **错误处理**: 妥善处理数据库连接错误

### 数据库操作
1. **连接池**: 使用连接池管理数据库连接
2. **事务**: 使用事务确保数据一致性
3. **参数化查询**: 防止SQL注入攻击
4. **资源释放**: 及时释放数据库连接

## 贡献指南

### 添加新测试
1. 在相应的测试文件中添加测试用例
2. 确保测试的独立性和可重复性
3. 添加适当的清理机制
4. 更新文档

### 性能优化
1. 监控测试执行时间
2. 优化数据库查询
3. 使用批量操作
4. 合理使用索引

---

**最后更新**: 2024年12月  
**维护者**: Enhanced PostgreSQL MCP Server Team