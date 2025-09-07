const { validatePath } = require('./file')
const { validateApiConfigPath } = require('./config-reader')
const { t } = require('./i18n')

/**
 * 验证API配置数据结构
 */
function validateApiConfig(apiConfig) {
  if (!apiConfig) {
    return false
  }

  // 检查是否至少有一个配置
  const configNames = Object.keys(apiConfig)
  if (configNames.length === 0) {
    return false
  }

  // 验证每个配置的结构
  for (const name of configNames) {
    const config = apiConfig[name]
    if (!config || !config.url || (!config.key && !config.token)) {
      return false
    }
  }

  return true
}

/**
 * 验证settings.json结构
 */
function validateSettingsConfig(settings) {
  if (!settings || typeof settings !== 'object') {
    return false
  }

  // 检查env字段存在
  // if (!settings.env || typeof settings.env !== 'object') {
  //   return false;
  // }

  return true
}

/**
 * 验证配置名称是否存在
 */
function validateConfigName(apiConfig, configName) {
  return apiConfig && apiConfig[configName] !== undefined
}

/**
 * 验证命令行参数
 */
async function validateSetCommand(options) {
  const { settings, api } = options

  // 至少需要设置其中一个
  // if (!settings && !api) {
  //   return {
  //     valid: false,
  //     error: '请指定要设置的路径参数 (--settings 或 --api)'
  //   };
  // }

  // 验证settings路径
  if (settings && !validatePath(settings)) {
    return {
      valid: false,
      error: await t('utils.SETTINGS_PATH_FORMAT_ERROR')
    }
  }

  // 验证api路径 - 使用放宽的验证
  if (api && !validateApiConfigPath(api)) {
    return {
      valid: false,
      error: await t('utils.API_PATH_FORMAT_ERROR')
    }
  }

  return { valid: true }
}

module.exports = {
  validateApiConfig,
  validateSettingsConfig,
  validateConfigName,
  validateSetCommand
}
