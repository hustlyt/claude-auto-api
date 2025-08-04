# @4xian/ccapi

Claude Code settings.json中key自动配置工具，方便API_KEY、AUTH_TOKEN配置切换

## 功能特性

- 🚀 **一键切换** - 轻松在不同 Claude API 配置间切换
- 🔒 **安全备份** - 修改前自动备份 settings.json 文件
- 📝 **友好提示** - 详细的错误信息和操作指导
- 🎯 **智能识别** - 自动识别当前使用的配置
- 🛡️ **数据保护** - 敏感信息脱敏显示

## 安装

### 全局安装（推荐）

```bash
npm install -g @4xian/ccapi
```

## 使用方法

### 1. 查看版本

```bash
ccapi -v
```

### 2. 设置配置文件路径

初次使用需要设置 Claude 的 settings.json 文件路径和 API 配置文件路径：

```bash
# 同时设置两个路径
ccapi set --settings /path/to/claude/settings.json --api /path/to/api.json

# 或分别设置
ccapi set --settings /path/to/claude/settings.json
ccapi set --api /path/to/api.json
```

### 3. API 配置文件格式

创建一个`api.json`文件，格式如下：

```json
{
  "openrouter": {
    "url": "xxx",
    "token": "your-auth-token",
    "model": "claude-sonnet-4-20250514"
  },
  "anyrouter": {
    "url": "xxx",
    "key": "sk-xxxxxxxxxxxx",
    "model": "claude-sonnet-4-20250514"
  }
}
```

**字段说明：**

- `url`: API 服务器地址（必需）
- `key`: API 密钥（key 和 token 至少需要一个）
- `token`: 认证令牌（key 和 token 至少需要一个）
- `model`: 模型名称（必需）

### 4. 列举可用配置

```bash
ccapi ls
```

> 带`*`号的配置表示当前正在使用

### 5. 切换配置

```bash
ccapi use openrouter
```

## 系统要求

- Node.js >= 14.0.0
- 支持的操作系统: macOS, Linux, Windows
