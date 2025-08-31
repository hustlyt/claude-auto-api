# @4xian/ccapi

English | [中文](./README.md)

Claude Code settings.json key auto-configuration tool for easy switching between multiple API_KEYs, AUTH_TOKENs and multiple Model configurations

## Features

- 🚀 **One-click Switch** - Easily switch between different Claude API configurations
- ⚡ **Parallel Testing** - Fast concurrent testing of all API configurations with intelligent latency sorting
- 🎯 **Auto Optimization** - Automatically test and switch to the optimal configuration with lowest latency
- 🔒 **Safe Backup** - Automatically backup settings.json file before modifications
- 📝 **User-friendly Prompts** - Detailed error messages and operation guidance
- 🧠 **Smart Recognition** - Automatically identify currently used configuration and optimal routes
- 🛡️ **Data Protection** - Sensitive information is masked in display
- 📊 **Latency Testing** - Supports both parallel and serial testing modes
- 📄 **Multi-format Support** - Supports JSON, JSON5, YAML, TOML configuration files
- 🔧 **Array Support** - Comprehensive support for array configurations of URL, Key, Token, Model fields

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
ccapi set --settings ~/.claude/settings.json --api /Users/4xian/Desktop/api.json5

# Or set them separately
ccapi set --settings ~/.claude/settings.json
ccapi set --api /Users/4xian/Desktop/api.json5

# Directly modify paths in configuration file
# In ~/.ccapi-config.json file (at same level as .claude), there are path storage variables, modify directly:
  {
    "settingsPath": "~/.claude/settings.json",
    "apiConfigPath": "/Users/4xian/Desktop/api.json5",
  }

# Query current configuration file paths
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

### 6. Test API Latency

#### Test All Configurations (Default Parallel Mode)

```bash
# Parallel testing (fast, recommended)
ccapi test

# Serial testing (sequential testing)
ccapi test -s
```

#### Test Specific Configuration

```bash
# Parallel test specific configuration
ccapi test openrouter

# Serial test specific configuration
ccapi test -s openrouter
```

**Test Mode Description:**

- **Parallel Testing (Default)**: Test all URLs simultaneously, fast execution, results sorted by best latency
- **Serial Testing (-s option)**: Test URLs one by one, grouped by configuration

**Test Description:**

- **Test timeout**: Defaults to 5 seconds, can be controlled by adding timeout variable in ~/.ccapi-config.json file: testTimeout: 10000
- **Test result response**: Not displayed by default. Since different providers return different results, response errors don't mean it won't work in Claude Code - just focus on latency timing. Can enable response display by adding variable in ~/.ccapi-config.json file: testResponse: true

  ```json5
  {
    "settingsPath": "~/.claude/settings.json",
    "apiConfigPath": "/Users/4xian/Desktop/api.json5",
    "testTimeout": 5000,
    "testResponse": false
  }
  ```

- For array format URLs, all URL addresses will be tested
- Configurations sorted by best latency, lowest latency configurations appear first
- Shows optimal route (fastest URL address) for each configuration

**Parallel Testing Display Example:**

```text
Test Results (sorted by latency): 
【xxx】(Optimal Route: xxx/claude)
    1.[https://xxx/claude] ● 328ms 

【multiconfig】(Optimal Route: api.example1.com)
    1.[https://api.example1.com] ● 556ms 
    2.[https://api.example2.com] ● 892ms 

```

### 7. Auto Select Best Configuration

#### Basic Auto Selection

```bash
ccapi auto
```

#### Silent Mode (for Scripts)

```bash
# Common usage with combined commands
ccapi auto -s && claude

# Custom alias
alias cc=ccapi auto -s && claude
```

**Feature Description:**

- **Uses Parallel Testing**: Fast concurrent testing of all API configuration latencies
- **Smart Selection**: Automatically select and switch to the globally lowest latency configuration
- **Notes**:
  - For array format configurations, automatically selects optimal URL
  - If KEY/TOKEN are arrays, they will align with optimal URL index pairing, e.g.: if optimal URL is index 1, KEY/TOKEN will also select index 1; if optimal URL is 2, KEY/TOKEN will also select index 2. If you don't want automatic KEY/TOKEN switching, configure them as single values instead
- **Interesting Combinations**:
  - Due to automatic configuration alignment rules, you can configure multiple providers in one configuration, e.g.:

    ```json5
      {
        "aaa": {
          "url": [
            "https://first-provider.com",
            "https://second-provider.com",
            "https://third-provider.com",
          ],
          "token": [
            "first-provider-token",
            "second-provider-token",
            "third-provider-token",
          ],
          "model": ["xxx"]
        },
        "bbb": {
          "url": [
            "https://first-provider.com",
            "https://second-provider.com",
            "https://third-provider.com",
          ],
          "key": [
            "first-provider-key",
            "second-provider-key",
            "third-provider-key",
          ],
          "model": ["xxx"]
        },
      }
    ```

    - This way, automatically selecting the first provider will also automatically select the first provider's token, selecting the second provider will automatically select the second provider's token...
    - Note: group token-type providers together, and key-type providers together

## System Requirements

- Node.js >= 14.0.0
- Supported OS: macOS, Linux, Windows
