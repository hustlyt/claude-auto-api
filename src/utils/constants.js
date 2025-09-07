const os = require('os')
const path = require('path')

// 配置文件路径
const CONFIG_FILE = path.join(os.homedir(), '.ccapi-config.json')

// Claude settings.json中的环境变量键名
const CLAUDE_ENV_KEYS = {
  url: 'ANTHROPIC_BASE_URL',
  key: 'ANTHROPIC_API_KEY',
  token: 'ANTHROPIC_AUTH_TOKEN',
  model: 'ANTHROPIC_MODEL',
  fast: 'ANTHROPIC_SMALL_FAST_MODEL',
  timeout: 'API_TIMEOUT_MS',
  tokens: 'CLAUDE_CODE_MAX_OUTPUT_TOKENS',
  http: 'HTTP_PROXY',
  https: 'HTTPS_PROXY'
}

// 环境变量配置
const CONFIG_IDENTIFIER = 'CCAPI_CURRENT_CONFIG'

// 错误消息
const ERROR_MESSAGES = {
  CONFIG_NOT_FOUND: '配置文件未找到，请先使用 ccapi set 设置路径',
  SETTINGS_NOT_FOUND: 'settings文件不存在，请检查路径设置',
  API_CONFIG_NOT_FOUND: 'api配置文件不存在，请检查路径设置(支持JSON,JSON5,YAML,TOML格式)',
  INVALID_JSON: 'JSON文件格式错误',
  INVALID_YAML: 'YAML文件格式错误',
  INVALID_TOML: 'TOML文件格式错误',
  CONFIG_NAME_NOT_FOUND: '配置不存在',
  SAME_CONFIG: '当前已使用该配置',
  BACKUP_FAILED: 'settings文件备份失败',
  ENV_SET_FAILED: '环境变量设置失败',
  ENV_CLEAR_FAILED: '环境变量清除失败',
  PERMISSION_DENIED: '权限不足，无法修改系统环境变量',
  ENV_NOT_FOUND: '未找到相关的环境变量配置',
  PLATFORM_NOT_SUPPORTED: '不支持当前操作系统'
}

// 成功消息
const SUCCESS_MESSAGES = {
  CONFIG_SAVED: '配置路径已保存',
  CONFIG_SWITCHED: '配置切换成功',
  RESTART_TERMINAL: '(提示: 重启Claude Code终端后配置生效!)',
  BACKUP_CREATED: 'settings文件已备份',
  ENV_SET_SUCCESS: '环境变量设置成功',
  ENV_CLEAR_SUCCESS: '环境变量清除成功',
  FULL_CLEAR_SUCCESS: '配置完全清除成功',
  ENV_SYNC_SUCCESS: '配置已同步到环境变量'
}

module.exports = {
  CONFIG_FILE,
  CLAUDE_ENV_KEYS,
  CONFIG_IDENTIFIER,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES
}
