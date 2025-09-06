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

// 错误消息
const ERROR_MESSAGES = {
  CONFIG_NOT_FOUND: '配置文件未找到，请先使用 ccapi set 设置路径',
  SETTINGS_NOT_FOUND: 'settings文件不存在，请检查路径设置',
  API_CONFIG_NOT_FOUND: 'api配置文件不存在，请检查路径设置(支持JSON,JSON5,YAML,TOML格式)',
  INVALID_JSON: 'JSON文件格式错误',
  INVALID_YAML: 'YAML文件格式错误',
  INVALID_TOML: 'TOML文件格式错误',
  CONFIG_NAME_NOT_FOUND: '指定的配置名称不存在',
  SAME_CONFIG: '当前已使用该配置',
  BACKUP_FAILED: 'settings文件备份失败'
}

// 成功消息
const SUCCESS_MESSAGES = {
  CONFIG_SAVED: '配置路径已保存',
  CONFIG_SWITCHED: '配置切换成功',
  RESTART_TERMINAL: '(提示: 重启Claude Code终端后配置生效!)',
  BACKUP_CREATED: 'settings文件已备份'
}

module.exports = {
  CONFIG_FILE,
  CLAUDE_ENV_KEYS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES
}
