const { validatePath } = require('./file');

/**
 * 验证API配置数据结构
 */
function validateApiConfig(apiConfig) {
  if (!apiConfig || typeof apiConfig !== 'object') {
    return false;
  }

  // 检查是否至少有一个配置
  const configNames = Object.keys(apiConfig);
  if (configNames.length === 0) {
    return false;
  }

  // 验证每个配置的结构
  for (const name of configNames) {
    const config = apiConfig[name];
    if (!config || typeof config !== 'object') {
      return false;
    }

    // 检查必需字段
    if (!config.url || typeof config.url !== 'string') {
      return false;
    }

    // model字段必须存在
    // if (!config.model || typeof config.model !== 'string') {
    //   return false;
    // }

    // key和token至少其中一个要有值
    if (!config.key && !config.token) {
      return false;
    }
  }

  return true;
}

/**
 * 验证settings.json结构
 */
function validateSettingsConfig(settings) {
  if (!settings || typeof settings !== 'object') {
    return false;
  }

  // 检查env字段存在
  // if (!settings.env || typeof settings.env !== 'object') {
  //   return false;
  // }

  return true;
}

/**
 * 验证配置名称是否存在
 */
function validateConfigName(apiConfig, configName) {
  return apiConfig && apiConfig[configName] !== undefined;
}

/**
 * 验证命令行参数
 */
function validateSetCommand(options) {
  const { settings, api } = options;

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
      error: 'settings路径格式错误，请提供绝对路径的settings.json文件'
    };
  }

  // 验证api路径
  if (api && !validatePath(api)) {
    return {
      valid: false,
      error: 'api路径格式错误，请提供绝对路径的api.json文件'
    };
  }

  return { valid: true };
}

module.exports = {
  validateApiConfig,
  validateSettingsConfig,
  validateConfigName,
  validateSetCommand
};