const chalk = require('chalk');
const { validateConfig } = require('../utils/config');
const { readJsonFile } = require('../utils/file');
const { validateApiConfig, validateSettingsConfig } = require('../utils/validator');
const { CLAUDE_ENV_KEYS, ERROR_MESSAGES } = require('../constants');

/**
 * 获取当前使用的配置名称
 */
function getCurrentConfigName(settingsData, apiConfig) {
  const currentUrl = settingsData.env?.[CLAUDE_ENV_KEYS.url];

  if (!currentUrl) {
    return null;
  }

  // 查找匹配的URL
  for (const [name, config] of Object.entries(apiConfig)) {
    if (config.url === currentUrl) {
      return name;
    }
  }

  return null;
}

/**
 * 格式化配置显示
 */
function formatConfigDisplay(name, config, isCurrent = false) {
  const prefix = isCurrent ? chalk.green('* ') : '  ';
  const nameDisplay = isCurrent ? chalk.green.bold(name) : chalk.cyan(name);
  config.model = config.model || 'claude-sonnet-4-20250514';
  config.fast = config.fast || 'claude-3-5-haiku-20241022';
  let details = [];
  details.push(`URL: ${chalk.gray(config.url)}`);
  details.push(`Model: ${chalk.gray(config.model)}`);
  details.push(`Fast: ${chalk.gray(config.fast)}`);

  if (config.key) {
    const maskedKey = config.key.length > 8
      ? config.key.slice(0, 8) + '...'
      : config.key;
    details.push(`Key: ${chalk.gray(maskedKey)}`);
  }

  if (config.token) {
    const maskedToken = config.token.length > 8
      ? config.token.slice(0, 8) + '...'
      : config.token;
    details.push(`Token: ${chalk.gray(maskedToken)}`);
  }

  console.log(`${prefix}${nameDisplay}`);
  details.forEach(detail => {
    console.log(`    ${detail}`);
  });
}

/**
 * 列举配置命令
 */
async function listCommand() {
  try {
    // 验证配置
    const config = await validateConfig();

    // 读取API配置文件
    const apiConfig = await readJsonFile(config.apiConfigPath);
    if (!validateApiConfig(apiConfig)) {
      console.error(chalk.red('错误:'), 'api.json文件格式不正确');
      return;
    }

    // 读取settings.json文件
    const settingsData = await readJsonFile(config.settingsPath);
    if (!validateSettingsConfig(settingsData)) {
      console.error(chalk.red('错误:'), 'settings.json文件格式不正确');
      return;
    }

    // 获取当前使用的配置
    const currentConfigName = getCurrentConfigName(settingsData, apiConfig);

    // 显示配置列表
    console.log(chalk.blue.bold('可用的API配置:'));

    const configNames = Object.keys(apiConfig);
    if (configNames.length === 0) {
      console.log(chalk.yellow('暂无可用配置'));
      return;
    }

    // 按名称排序显示
    configNames.sort().forEach(name => {
      const isCurrent = name === currentConfigName;
      formatConfigDisplay(name, apiConfig[name], isCurrent);
      console.log(); // 空行分隔
    });

    // 显示当前状态
    if (currentConfigName) {
      console.log(chalk.green(`当前使用: ${currentConfigName}`));
    } else {
      console.log(chalk.yellow('当前未进行任何配置'));
    }

  } catch (error) {
    if (error.message.includes('未设置') || error.message.includes('不存在')) {
      console.error(chalk.red('配置错误:'), error.message);
      console.log(chalk.gray('请先使用'), chalk.cyan('ccapi set'), chalk.gray('命令设置配置文件路径'));
    } else {
      console.error(chalk.red('列举配置失败:'), error.message);
    }
    process.exit(1);
  }
}

module.exports = listCommand;