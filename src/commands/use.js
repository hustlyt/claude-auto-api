const chalk = require('chalk');
const { validateConfig } = require('../utils/config');
const { readJsonFile, writeJsonFile, backupFile } = require('../utils/file');
const { validateApiConfig, validateSettingsConfig, validateConfigName } = require('../utils/validator');
const { CLAUDE_ENV_KEYS, ERROR_MESSAGES, SUCCESS_MESSAGES } = require('../constants');

/**
 * 检查是否为当前配置
 */
function isCurrentConfig(settingsData, targetConfig) {
  const env = settingsData.env || {};

  return env[CLAUDE_ENV_KEYS.url] === targetConfig.url &&
    env[CLAUDE_ENV_KEYS.model] === targetConfig.model;
}

/**
 * 更新settings.json中的环境变量
 */
function updateSettingsEnv(settingsData, targetConfig) {
  // 确保env对象存在
  if (!settingsData.env) {
    settingsData.env = {};
  }

  const env = settingsData.env;

  // 更新URL（必需）
  env[CLAUDE_ENV_KEYS.url] = targetConfig.url;

  // 更新Model（可选）
  env[CLAUDE_ENV_KEYS.model] = targetConfig.model;

  // 轻量模型（可选）
  env[CLAUDE_ENV_KEYS.fast] = targetConfig.fast;

  // API请求超时时间（可选）
  env[CLAUDE_ENV_KEYS.timeout] = targetConfig.timeout;

  if (targetConfig.tokens) {
    env[CLAUDE_ENV_KEYS.tokens] = targetConfig.tokens;
  } else {
    delete env[CLAUDE_ENV_KEYS.tokens];
  }

  if (targetConfig.key && targetConfig.token) {
    env[CLAUDE_ENV_KEYS.key] = targetConfig.key;
    env[CLAUDE_ENV_KEYS.token] = targetConfig.token;
  } else {
    // 更新Key（如果有值）
    if (targetConfig.key) {
      env[CLAUDE_ENV_KEYS.key] = targetConfig.key;
      delete env[CLAUDE_ENV_KEYS.token];
    }

    // 更新Token（如果有值）
    if (targetConfig.token) {
      env[CLAUDE_ENV_KEYS.token] = targetConfig.token;
      delete env[CLAUDE_ENV_KEYS.key];
    }
  }

  if (targetConfig.http) {
    // HTTP代理（可选）
    env[CLAUDE_ENV_KEYS.http] = targetConfig.http;
  } else {
    delete env[CLAUDE_ENV_KEYS.http];
  }
  if (targetConfig.https) {
    // HTTPS代理（可选）
    env[CLAUDE_ENV_KEYS.https] = targetConfig.https;
  } else {
    delete env[CLAUDE_ENV_KEYS.https];
  }
  return settingsData;
}

/**
 * 解析和选择模型
 */
function selectModel(modelValue, selectedIndex, defaultModel) {
  if (Array.isArray(modelValue)) {
    // 数组情况：选择指定索引的模型，默认为第一个
    const index = selectedIndex > 0 ? selectedIndex - 1 : 0;
    if (index >= modelValue.length) {
      throw new Error(`模型索引 ${selectedIndex} 超出范围，可用范围: 1-${modelValue.length}`);
    }
    return modelValue[index];
  } else {
    // 字符串情况：直接返回，忽略索引参数
    return modelValue || defaultModel;
  }
}

/**
 * 使用指定配置命令
 */
async function useCommand(configName, options = {}) {
  try {
    // 验证配置
    const config = await validateConfig();

    // 读取API配置文件
    const apiConfig = await readJsonFile(config.apiConfigPath);
    if (!validateApiConfig(apiConfig)) {
      console.error(chalk.red('错误:'), 'api.json文件格式不正确');
      return;
    }

    // 验证配置名称是否存在
    if (!validateConfigName(apiConfig, configName)) {
      console.error(chalk.red('设置错误:'), `${ERROR_MESSAGES.CONFIG_NAME_NOT_FOUND}: ${configName}`);
      console.log(chalk.green('当前可用的配置:'), Object.keys(apiConfig).join(', '));
      return;
    }

    // 读取settings.json文件
    const settingsData = await readJsonFile(config.settingsPath);
    if (!validateSettingsConfig(settingsData)) {
      console.error(chalk.red('错误:'), 'settings.json文件格式不正确');
      return;
    }

    const originalConfig = apiConfig[configName];

    // 创建配置副本用于修改
    const targetConfig = { ...originalConfig };

    // 设置默认值
    targetConfig.model = targetConfig.model || 'claude-sonnet-4-20250514';
    targetConfig.fast = targetConfig.fast || 'claude-3-5-haiku-20241022';
    targetConfig.timeout = targetConfig.timeout || "600000";

    try {
      // 根据参数选择模型
      const selectedModel = selectModel(
        targetConfig.model,
        options.model ? parseInt(options.model) : 0,
        'claude-sonnet-4-20250514'
      );

      const selectedFast = selectModel(
        targetConfig.fast,
        options.fast ? parseInt(options.fast) : 0,
        'claude-3-5-haiku-20241022'
      );

      // 更新目标配置为选中的具体模型
      targetConfig.model = selectedModel;
      targetConfig.fast = selectedFast;

    } catch (error) {
      console.error(chalk.red('参数错误:'), error.message);
      return;
    }

    // 检查是否已经是当前配置
    // if (isCurrentConfig(settingsData, targetConfig)) {
    //   console.log(chalk.yellow(ERROR_MESSAGES.SAME_CONFIG));
    //   return;
    // }

    // 备份settings.json
    console.log('正在备份settings.json...');
    const backupPath = await backupFile(config.settingsPath);
    console.log(chalk.green(SUCCESS_MESSAGES.BACKUP_CREATED), `(${backupPath})`);

    // 更新配置
    console.log(`正在切换配置: ${configName}`);
    const updatedSettings = updateSettingsEnv(settingsData, targetConfig);

    // 保存更新后的settings.json
    await writeJsonFile(config.settingsPath, updatedSettings);

    // 显示成功信息
    console.log();
    console.log(chalk.green.bold(SUCCESS_MESSAGES.CONFIG_SWITCHED));
    console.log();
    console.log(chalk.blue('当前配置详情:'));
    console.log(`  名称: ${chalk.cyan(configName)}`);
    console.log(`  URL: ${chalk.cyan(targetConfig.url)}`);

    // 显示选中的模型信息
    console.log(`  Model: ${chalk.cyan(targetConfig.model)}`);

    console.log(`  Fast: ${chalk.cyan(targetConfig.fast)}`);

    if (targetConfig.key) {
      const maskedKey = targetConfig.key.length > 15
        ? targetConfig.key.slice(0, 15) + '...'
        : targetConfig.key;
      console.log(`  Key: ${chalk.cyan(maskedKey)}`);
    }
    if (targetConfig.token) {
      const maskedToken = targetConfig.token.length > 15
        ? targetConfig.token.slice(0, 15) + '...'
        : targetConfig.token;
      console.log(`  Token: ${chalk.cyan(maskedToken)}`);
    }
    if (targetConfig.http) {
      console.log(`  HTTP Proxy: ${chalk.cyan(targetConfig.http)}`);
    }
    if (targetConfig.https) {
      console.log(`  HTTPS Proxy: ${chalk.cyan(targetConfig.https)}`);
    }
    console.log();
  } catch (error) {
    if (error.message.includes('未设置') || error.message.includes('不存在')) {
      console.error(chalk.red('配置错误:'), error.message);
      console.log('请先使用', chalk.cyan('ccapi set'), '命令设置配置文件路径');
    } else {
      console.error(chalk.red('切换配置失败:'), error.message);
    }
    process.exit(1);
  }
}

module.exports = useCommand;