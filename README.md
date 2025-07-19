# PostgreSQL MCP 服务器（增强版）

一个模型上下文协议服务器，提供对PostgreSQL数据库的读写访问。该服务器使LLM能够检查数据库模式、执行查询、修改数据以及创建/修改数据库模式对象。

> **注意：** 这是Anthropic原始[PostgreSQL MCP服务器](https://github.com/modelcontextprotocol/servers/tree/main/src/postgres)的增强版本。原始服务器仅提供只读访问，而此增强版本添加了写入功能和模式管理。

## 组件

### 工具

#### 数据查询
- **query**
  - 对连接的数据库执行只读SQL查询
  - 输入：`sql`（字符串）：要执行的SQL查询
  - 所有查询都在只读事务中执行

#### 数据修改
- **execute**
  - 执行修改数据的SQL语句（INSERT、UPDATE、DELETE）
  - 输入：`sql`（字符串）：要执行的SQL语句
  - 在具有适当COMMIT/ROLLBACK处理的事务中执行

- **insert**
  - 向表中插入新记录
  - 输入：
    - `table`（字符串）：表名
    - `data`（对象）：键值对，其中键是列名，值是要插入的数据

- **update**
  - 更新表中的记录
  - 输入：
    - `table`（字符串）：表名
    - `data`（对象）：要更新字段的键值对
    - `where`（字符串）：用于标识要更新记录的WHERE条件

- **delete**
  - 从表中删除记录
  - 输入：
    - `table`（字符串）：表名
    - `where`（字符串）：用于标识要删除记录的WHERE条件

#### 模式管理
- **createTable**
  - 创建具有指定列和约束的新表
  - 输入：
    - `tableName`（字符串）：表名
    - `columns`（数组）：列定义数组，包含名称、类型和可选约束
    - `constraints`（数组）：可选的表级约束数组

- **createFunction**
  - 创建PostgreSQL函数/过程
  - 输入：
    - `name`（字符串）：函数名
    - `parameters`（字符串）：函数参数
    - `returnType`（字符串）：返回类型
    - `language`（字符串）：语言（plpgsql、sql等）
    - `body`（字符串）：函数体
    - `options`（字符串）：可选的附加函数选项

- **createTrigger**
  - 在表上创建触发器
  - 输入：
    - `name`（字符串）：触发器名称
    - `tableName`（字符串）：应用触发器的表
    - `functionName`（字符串）：要调用的函数
    - `when`（字符串）：BEFORE、AFTER或INSTEAD OF
    - `events`（数组）：事件数组（INSERT、UPDATE、DELETE）
    - `forEach`（字符串）：ROW或STATEMENT
    - `condition`（字符串）：可选的WHEN条件

- **createIndex**
  - 在表上创建索引
  - 输入：
    - `tableName`（字符串）：表名
    - `indexName`（字符串）：索引名
    - `columns`（数组）：要索引的列
    - `unique`（布尔值）：索引是否唯一
    - `type`（字符串）：可选的索引类型（BTREE、HASH、GIN、GIST等）
    - `where`（字符串）：可选条件

- **alterTable**
  - 修改表结构
  - 输入：
    - `tableName`（字符串）：表名
    - `operation`（字符串）：操作（ADD COLUMN、DROP COLUMN等）
    - `details`（字符串）：操作详情

### 资源

服务器为数据库中的每个表提供模式信息：

- **表模式**（`postgres://<host>/<table>/schema`）
  - 每个表的JSON模式信息
  - 包括列名和数据类型
  - 从数据库元数据自动发现

## 在Claude Desktop中使用

要在Claude Desktop应用程序中使用此服务器，请将以下配置添加到`claude_desktop_config.json`的"mcpServers"部分：

### Docker
* docker镜像需要自己编译
* 在macOS上运行docker时，如果服务器在主机网络上运行（例如localhost），请使用host.docker.internal
* 用户名/密码可以通过`postgresql://user:password@host:port/db-name`添加到postgresql url中
* 如果需要绕过SSL证书验证，请添加`?sslmode=no-verify`

### NPM包（推荐）

```json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": [
        "-y",
        "enhanced-postgres-mcp-server",
        "postgresql://username:password@localhost:5432/mydb"
      ]
    }
  }
}
```

**连接字符串格式说明：**
- `postgresql://username:password@localhost:5432/mydb` - 包含用户名和密码的完整格式
- `postgresql://localhost/mydb` - 使用默认用户的简化格式
- `postgresql://postgres:mypassword@localhost:5432/mydatabase` - 示例：用户名postgres，密码mypassword，数据库mydatabase

将连接字符串中的参数替换为您的实际数据库配置。

## 使用示例

### 查询数据
```
/query SELECT * FROM users LIMIT 5
```

### 插入数据
```
/insert table="users", data={"name": "张三", "email": "zhangsan@example.com"}
```

### 更新数据
```
/update table="users", data={"status": "inactive"}, where="id='123'"
```

### 创建表
```
/createTable tableName="tasks", columns=[
  {"name": "id", "type": "SERIAL", "constraints": "PRIMARY KEY"}, 
  {"name": "title", "type": "VARCHAR(100)", "constraints": "NOT NULL"},
  {"name": "created_at", "type": "TIMESTAMP", "constraints": "DEFAULT CURRENT_TIMESTAMP"}
]
```

### 创建函数和触发器
```
/createFunction name="update_timestamp", parameters="", returnType="TRIGGER", language="plpgsql", body="BEGIN NEW.updated_at = NOW(); RETURN NEW; END;"

/createTrigger name="set_timestamp", tableName="tasks", functionName="update_timestamp", when="BEFORE", events=["UPDATE"], forEach="ROW"
```

## 构建

Docker：

```sh
docker build -t mcp/postgres -f Dockerfile . 
```

## 安全考虑

1. 所有数据修改操作都使用具有适当COMMIT/ROLLBACK处理的事务
2. 每个操作都返回执行的SQL以确保透明度
3. 服务器对插入/更新操作使用参数化查询以防止SQL注入

## 许可证

此MCP服务器根据MIT许可证授权。这意味着您可以自由使用、修改和分发软件，但需遵守MIT许可证的条款和条件。有关更多详细信息，请参阅项目存储库中的LICENSE文件。
