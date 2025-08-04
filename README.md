# @4xian/ccapi

[English](./README_EN.md) | 中文

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

初次使用需要设置 Claude Code 的 settings.json 文件路径和自定义API配置文件路径：

```bash
例如:
# 同时设置两个路径
ccapi set --settings /Users/4xian/Desktop/settings.json --api /Users/4xian/Desktop/api.json

# 或分别设置
ccapi set --settings /Users/4xian/Desktop/settings.json
ccapi set --api /Users/4xian/Desktop/api.json
```

### 3. 自定义API配置文件格式

创建一个`api.json`文件，格式如下：

```json
{
  "openrouter": {
    "url": "xxx",
    "token": "your-auth-token",
    "model": "claude-sonnet-4-20250514",
    "fast": "claude-3-5-haiku-20241022",
    "timeout": 120000,
    "tokens": 20000
  },
  "anyrouter": {
    "url": "xxx",
    "key": "you-api-key",
    "model": "claude-sonnet-4-20250514"
  }
}
```

**字段说明：**
【不同厂商提供的可能是key, 也可能是token, 若不能使用可将key和token互换一下】
【本工具只支持Anthropic格式的配置, 当然只要Claude能用就都可以】

- `url`: API厂商服务器地址（必需）
- `key`: API_KEY（key 和 token 至少需要一个）
- `token`: AUTH_TOKEN（key 和 token 至少需要一个）
- `model`: 模型名称（非必需，默认claude-sonnet-4-20250514）
- `fast`: 快速模型名称（非必需，默认claude-3-5-haiku-20241022）
- `timeout`: 请求超时时间（非必需，默认600000ms）
- `tokens`: 最大输出令牌数（非必需，默认25000）

### 4. 列举api配置文件中的可用配置

```bash
ccapi ls 或者 ccapi list
```

> 带`*`号的配置表示当前正在使用

### 5. 自由切换配置(切换成功后记得重启Claude终端才会生效!!!)

```bash
ccapi use openrouter
```

## 系统要求

- Node.js >= 14.0.0
- 支持的操作系统: macOS, Linux, Windows
