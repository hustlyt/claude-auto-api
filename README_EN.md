# @4xian/ccapi

English | [中文](./README.md)

Claude Code settings.json key auto-configuration tool for easy API_KEY and AUTH_TOKEN and multimodel configuration switching

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

# Or get current path
ccapi set
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
  "multimodel": {
    "url": "https://api.example.com",
    "key": "your-api-key",
    "model": [
      "claude-sonnet-4-20250514",
      "claude-3-5-haiku-20241022",
      "claude-3-opus-20240229"
    ],
    "fast": [
      "claude-3-5-haiku-20241022",
      "claude-3-haiku-20240307"
    ]
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
  - **String format**: Directly specify a single model
  - **Array format**: Specify multiple models, supports switching via index
- `fast`: Fast model name (optional, default: claude-3-5-haiku-20241022)
  - **String format**: Directly specify a single fast model
  - **Array format**: Specify multiple fast models, supports switching via index
- `timeout`: Request timeout in milliseconds (optional, default: 600000ms)
- `tokens`: Maximum output tokens (optional, default: 25000)
- `http`: Custom HTTP Proxy Settings (optional)
- `https`: Custom HTTPS Proxy Settings (optional)

### 4. List Available Configurations

```bash
ccapi ls or ccapi list
```

Display example:

```text
Available API Configurations:

  【openrouter】
    URL: https://api.openrouter.ai
    Model: claude-sonnet-4-20250514
    Fast: claude-3-5-haiku-20241022
    Key: sk-or123...

* 【multimodel】
    URL: https://api.example.com
    Model:
    * - 1: claude-sonnet-4-20250514
      - 2: claude-3-5-haiku-20241022
      - 3: claude-3-opus-20240229
    Fast:
      - 1: claude-3-5-haiku-20241022
    * - 2: claude-3-haiku-20240307
    Key: sk-abc123...
```

**Display Description:**

- Configurations marked with `*` indicate currently active configuration
- For array format model/fast, index numbers are displayed
- Currently used model index is also marked with `*`

### 5. Switch Configuration (Remember to restart Claude terminal after successful switch!!!)

#### Basic Switching

```bash
# Switch to specified configuration (using default model)
ccapi use openrouter

# For string format model/fast, direct switching
ccapi use anyrouter
```

#### Advanced Switching (for Array Format)

```bash
# Switch to multimodel config's 2nd model and 1st fast model
ccapi use multimodel -m 2 -f 1

# Only specify standard model index, fast model uses default (1st)
ccapi use multimodel -m 3

# Only specify fast model index, model uses default (1st)
ccapi use multimodel -f 2
```

**Parameter Description:**

- `-m <index>`: Specify model index to use (counting from 1)
- `-f <index>`: Specify fast model index to use (counting from 1)
- For string format configurations, index parameters are automatically ignored
- When no index is specified, defaults to the first element of the array

## System Requirements

- Node.js >= 14.0.0
- Supported OS: macOS, Linux, Windows
