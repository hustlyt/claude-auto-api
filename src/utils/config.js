const { readConfigFile, writeConfigFile, fileExists } = require('./file')
const { CONFIG_FILE, ERROR_MESSAGES } = require('../utils/constants')

/**
 * 读取用户配置
 */
async function readConfig() {
  try {
    if (!(await fileExists(CONFIG_FILE))) {
      return {}
    }
    return await readConfigFile(CONFIG_FILE)
  } catch (error) {
    throw new Error(`读取配置失败: ${error.message}`)
  }
}

/**
 * 写入用户配置
 */
async function writeConfig(config) {
  try {
    await writeConfigFile(CONFIG_FILE, config)
  } catch (error) {
    throw new Error(`保存配置失败: ${error.message}`)
  }
}

/**
 * 获取settings.json路径
 */
async function getSettingsPath() {
  const config = await readConfig()
  return config.settingsPath || null
}

/**
 * 获取api.json路径
 */
async function getApiConfigPath() {
  const config = await readConfig()
  return config.apiConfigPath || null
}

/**
 * 设置settings.json路径
 */
async function setSettingsPath(path) {
  const config = await readConfig()
  config.settingsPath = path
  await writeConfig(config)
}

/**
 * 设置api.json路径
 */
async function setApiConfigPath(path) {
  const config = await readConfig()
  config.apiConfigPath = path
  await writeConfig(config)
}

/**
 * 验证配置完整性
 */
async function validateConfig() {
  const config = await readConfig()

  if (!config.settingsPath) {
    throw new Error('未设置settings.json文件路径')
  }

  if (!config.apiConfigPath) {
    throw new Error('未设置api配置文件路径')
  }

  if (!(await fileExists(config.settingsPath))) {
    throw new Error(ERROR_MESSAGES.SETTINGS_NOT_FOUND)
  }

  if (!(await fileExists(config.apiConfigPath))) {
    throw new Error(ERROR_MESSAGES.API_CONFIG_NOT_FOUND)
  }

  return config
}

module.exports = {
  readConfig,
  writeConfig,
  getSettingsPath,
  getApiConfigPath,
  setSettingsPath,
  setApiConfigPath,
  validateConfig
}
