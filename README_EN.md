# @4xian/ccapi

English | [中文](./README.md)

Claude Code settings.json key auto-configuration tool for easy API_KEY and AUTH_TOKEN and multimodel configuration switching

## Features

- 🚀 **One-click Switch** - Easily switch between different Claude API configurations
- 🔒 **Safe Backup** - Automatically backup settings.json file before modifications
- 📝 **User-friendly Prompts** - Detailed error messages and operation guidance
- 🎯 **Smart Recognition** - Automatically identify the currently used configuration
- 🛡️ **Data Protection** - Sensitive information is masked in display
- 📄 **Multi-format Support** - Supports JSON, JSON5, YAML, TOML configuration files

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

Now supports multiple configuration file formats: **JSON, JSON5, YAML, TOML**.

Create a configuration file (such as `api.json`, `api.yaml`, `api.jsonc`, `api.json5`, or `api.toml`) with the following format:

**JSON Format Example:**

```json
{
  "openrouter": {
    "url": "https://api.openrouter.ai",
    "token": "your-auth-token",
    "model": "claude-sonnet-4-20250514",
    "fast": "claude-3-5-haiku-20241022",
    "timeout": 600000,
    "tokens": 65000
  },
  "multiconfig": {
    "url": [
      "https://api.example1.com",
      "https://api.example2.com"
    ],
    "key": [
      "sk-key1-for-api1",
      "sk-key2-for-api2"
    ],
    "token": [
      "token1-for-auth",
      "token2-for-auth"
    ],
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

**YAML Format Example:**

```yaml
openrouter:
  url: "https://api.openrouter.ai"
  token: "your-auth-token"
  model: "claude-sonnet-4-20250514"
  fast: "claude-3-5-haiku-20241022"
  timeout: 600000
  tokens: 65000

multiconfig:
  url:
    - "https://api.example1.com"
    - "https://api.example2.com"
  key:
    - "sk-key1-for-api1"
    - "sk-key2-for-api2"
  token:
    - "token1-for-auth"
    - "token2-for-auth"
  model:
    - "claude-sonnet-4-20250514"
    - "claude-3-5-haiku-20241022"
    - "claude-3-opus-20240229"
  fast:
    - "claude-3-5-haiku-20241022"
    - "claude-3-haiku-20240307"
```

**JSON5 Format Example (supports comments):**

```json5
{
  // OpenRouter configuration
  "openrouter": {
    "url": "https://api.openrouter.ai",
    "token": "your-auth-token",
    "model": "claude-sonnet-4-20250514",  // default model
    "fast": "claude-3-5-haiku-20241022",  // fast model
    "timeout": 600000,  // request timeout
    "tokens": 65000  // max output tokens
  }
}
```

**TOML Format Example:**

```toml
[openrouter]
url = "https://api.openrouter.ai"
token = "your-auth-token"
model = "claude-sonnet-4-20250514"
fast = "claude-3-5-haiku-20241022"
timeout = 600000
tokens = 65000

[multiconfig]
url = [
  "https://api.example1.com",
  "https://api.example2.com"
]
key = [
  "sk-key1-for-api1",
  "sk-key2-for-api2"
]
token = [
  "token1-for-auth",
  "token2-for-auth"
]
model = [
  "claude-sonnet-4-20250514",
  "claude-3-5-haiku-20241022",
  "claude-3-opus-20240229"
]
fast = [
  "claude-3-5-haiku-20241022",
  "claude-3-haiku-20240307"
]
```

**Field Description:**
[Different providers may offer either key or token. If one doesn't work, try switching between key and token]
[This tool only supports Anthropic format configuration, but anything that works with Claude should be compatible]

- `url`: API provider server address (required)
  - **String format**: Directly specify a single URL
  - **Array format**: Specify multiple URLs, supports switching via index
- `key`: API_KEY (at least one of key or token is required)
  - **String format**: Directly specify a single API Key
  - **Array format**: Specify multiple API Keys, supports switching via index
- `token`: AUTH_TOKEN (at least one of key or token is required)
  - **String format**: Directly specify a single Auth Token
  - **Array format**: Specify multiple Auth Tokens, supports switching via index
- `model`: Model name (optional, default: claude-sonnet-4-20250514)
  - **String format**: Directly specify a single model
  - **Array format**: Specify multiple models, supports switching via index
- `fast`: Fast model name (optional, default: claude-3-5-haiku-20241022)
  - **String format**: Directly specify a single fast model
  - **Array format**: Specify multiple fast models, supports switching via index
- `timeout`: Request timeout in milliseconds (optional, default: 600000ms)
- `tokens`: Maximum output tokens (optional, default: official)
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
    Token: your-auth-token...

* 【multiconfig】
    URL:
    * - 1: https://api.example1.com
      - 2: https://api.example2.com
    Model:
    * - 1: claude-sonnet-4-20250514
      - 2: claude-3-5-haiku-20241022
      - 3: claude-3-opus-20240229
    Fast:
      - 1: claude-3-5-haiku-20241022
    * - 2: claude-3-haiku-20240307
    Key:
    * - 1: sk-key1-for-api1...
      - 2: sk-key2-for-api2...
    Token:
      - 1: token1-for-auth...
    * - 2: token2-for-auth...
```

**Display Description:**

- Configurations marked with `*` indicate currently active configuration
- For array format url/key/token/model/fast, index numbers are displayed
- Currently used items are marked with `* - ` and highlighted
- Sensitive information (key, token) is automatically masked

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
# Switch to multiconfig configuration with specified field indices
ccapi use multiconfig -u 1 -k 2 -t 1 -m 2 -f 2

# Mix different parameters
ccapi use multiconfig -u 2 -m 1 -f 1

# Switch only specific field indices
ccapi use multiconfig -k 1      # Switch Key index only
ccapi use multiconfig -t 2      # Switch Token index only
ccapi use multiconfig -u 1      # Switch URL index only
ccapi use multiconfig -m 3      # Switch Model index only
ccapi use multiconfig -f 2      # Switch Fast Model index only

# Combination usage examples
ccapi use multiconfig -u 1 -k 1 -t 2 -m 1 -f 2
```

**Parameter Description:**

- `-u <index>`: Specify URL index to use (counting from 1)
- `-k <index>`: Specify Key index to use (counting from 1)
- `-t <index>`: Specify Token index to use (counting from 1)
- `-m <index>`: Specify model index to use (counting from 1)
- `-f <index>`: Specify fast model index to use (counting from 1)
- For string format configurations, index parameters are automatically ignored
- When no index is specified, defaults to the first element of the array
- You can combine these parameters in any way

## System Requirements

- Node.js >= 14.0.0
- Supported OS: macOS, Linux, Windows
