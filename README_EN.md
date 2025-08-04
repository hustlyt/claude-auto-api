# @4xian/ccapi

English | [中文](./README.md)

Claude Code settings.json key auto-configuration tool for easy API_KEY and AUTH_TOKEN configuration switching

## Features

- 🚀 **One-click Switch** - Easily switch between different Claude API configurations
- 🔒 **Safe Backup** - Automatically backup settings.json file before modifications
- 📝 **User-friendly Prompts** - Detailed error messages and operation guidance
- 🎯 **Smart Recognition** - Automatically identify the currently used configuration
- 🛡️ **Data Protection** - Sensitive information is masked in display

## Installation

### Global Installation (Recommended)

```bash
npm install -g @4xian/ccapi
```

## Usage

### 1. Check Version

```bash
ccapi -v
```

### 2. Set Configuration File Path

First-time use requires setting the path to Claude Code's settings.json file and custom API configuration file path:

```bash
Examples:
# Set both paths at once
ccapi set --settings /Users/4xian/Desktop/settings.json --api /Users/4xian/Desktop/api.json

# Or set them separately
ccapi set --settings /Users/4xian/Desktop/settings.json
ccapi set --api /Users/4xian/Desktop/api.json
```

### 3. Custom API Configuration File Format

Create an `api.json` file with the following format:

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

**Field Description:**
[Different providers may offer either key or token. If one doesn't work, try switching between key and token]
[This tool only supports Anthropic format configuration, but anything that works with Claude should be compatible]

- `url`: API provider server address (required)
- `key`: API_KEY (at least one of key or token is required)
- `token`: AUTH_TOKEN (at least one of key or token is required)
- `model`: Model name (optional, default: claude-sonnet-4-20250514)
- `fast`: Fast model name (optional, default: claude-3-5-haiku-20241022)
- `timeout`: Request timeout in milliseconds (optional, default: 600000ms)
- `tokens`: Maximum output tokens (optional, default: 25000)

### 4. List Available Configurations

```bash
ccapi ls or ccapi list
```

> Configurations marked with `*` indicate currently active configuration

### 5. Switch Configuration (Remember to restart Claude terminal after successful switch!!!)

```bash
ccapi use openrouter
```

## System Requirements

- Node.js >= 14.0.0
- Supported OS: macOS, Linux, Windows
