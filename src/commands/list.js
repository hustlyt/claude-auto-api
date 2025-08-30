const chalk = require('chalk');
const { validateConfig } = require('../utils/config');
const { readConfigFile } = require('../utils/file');
const { validateApiConfig, validateSettingsConfig } = require('../utils/validator');
const { CLAUDE_ENV_KEYS, ERROR_MESSAGES } = require('../constants');

/**
 * 获取当前使用的配置名称和模型索引信息
 */
function getCurrentConfigInfo(settingsData, apiConfig) {
  const currentUrl = settingsData.env?.[CLAUDE_ENV_KEYS.url];
  const currentModel = settingsData.env?.[CLAUDE_ENV_KEYS.model];
  const currentFast = settingsData.env?.[CLAUDE_ENV_KEYS.fast];

  if (!currentUrl) {
    return { name: null, modelIndex: -1, fastIndex: -1 };
  }

  // 查找匹配的URL
  for (const [name, config] of Object.entries(apiConfig)) {
    if (config.url === currentUrl) {
      let modelIndex = -1;
      let fastIndex = -1;

      // 查找当前使用的模型索引
      if (currentModel) {
        if (Array.isArray(config.model)) {
          modelIndex = config.model.indexOf(currentModel);
        } else if (config.model === currentModel) {
          modelIndex = 0; // 字符串情况下默认为0
        }
      }

      // 查找当前使用的快速模型索引
      if (currentFast) {
        if (Array.isArray(config.fast)) {
          fastIndex = config.fast.indexOf(currentFast);
        } else if (config.fast === currentFast) {
          fastIndex = 0; // 字符串情况下默认为0
        }
      }

      return { name, modelIndex, fastIndex };
    }
  }

  return { name: null, modelIndex: -1, fastIndex: -1 };
}

/**
 * 格式化模型/快速模型显示
 */
function formatModelDisplay(modelValue, currentIndex, label) {
  if (Array.isArray(modelValue)) {
    const lines = [`${label}:`];
    modelValue.forEach((model, index) => {
      const isCurrentModel = index === currentIndex;
      const prefix = isCurrentModel ? '    * - ' : '      - ';
      const modelDisplay = isCurrentModel ? chalk.green.bold(model) : chalk.cyan(model);
      lines.push(`${prefix}${index + 1}: ${modelDisplay}`);
    });
    return lines;
  } else {
    // 字符串情况，保持原样
    const modelDisplay = currentIndex === 0 ? chalk.green.bold(modelValue) : chalk.cyan(modelValue);
    return [`${label}: ${modelDisplay}`];
  }
}

/**
 * 格式化配置显示
 */
function formatConfigDisplay(name, config, currentInfo) {
  const isCurrent = name === currentInfo.name;
  const prefix = isCurrent ? chalk.green('* ') : '  ';
  const nameDisplay = isCurrent ? chalk.green.bold(`【${name}】`) : chalk.cyan(`【${name}】`);

  // 设置默认值
  config.model = config.model || 'claude-sonnet-4-20250514';
  // config.fast = config.fast || 'claude-3-5-haiku-20241022';

  let details = [];
  details.push(`URL: ${chalk.cyan(config.url)}`);

  // 格式化模型显示
  const modelLines = formatModelDisplay(
    config.model,
    isCurrent ? currentInfo.modelIndex : -1,
    'Model'
  );
  details.push(...modelLines);

  // 格式化快速模型显示
  if (config.fast) {
    const fastLines = formatModelDisplay(
      config.fast,
      isCurrent ? currentInfo.fastIndex : -1,
      'Fast'
    );
    details.push(...fastLines);
  }

  if (config.key) {
    const maskedKey = config.key.length > 15
      ? config.key.slice(0, 15) + '...'
      : config.key;
    details.push(`Key: ${chalk.cyan(maskedKey)}`);
  }

  if (config.token) {
    const maskedToken = config.token.length > 15
      ? config.token.slice(0, 15) + '...'
      : config.token;
    details.push(`Token: ${chalk.cyan(maskedToken)}`);
  }

  if (config.http) {
    details.push(`HTTP: ${chalk.cyan(config.http)}`);
  }

  if (config.https) {
    details.push(`HTTPS: ${chalk.cyan(config.https)}`);
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
    const apiConfig = await readConfigFile(config.apiConfigPath);
    if (!validateApiConfig(apiConfig)) {
      console.error(chalk.red('错误:'), 'api.json文件格式不正确');
      return;
    }

    // 读取settings.json文件
    const settingsData = await readConfigFile(config.settingsPath);
    if (!validateSettingsConfig(settingsData)) {
      console.error(chalk.red('错误:'), 'settings.json文件格式不正确');
      return;
    }

    // 获取当前使用的配置信息
    const currentConfigInfo = getCurrentConfigInfo(settingsData, apiConfig);

    // 显示配置列表
    console.log(chalk.green.bold('可用的API配置:'));

    const configNames = Object.keys(apiConfig);
    if (configNames.length === 0) {
      console.log(chalk.yellow('暂无可用配置'));
      return;
    }

    // 按名称排序显示
    configNames.sort().forEach(name => {
      formatConfigDisplay(name, apiConfig[name], currentConfigInfo);
      console.log(); // 空行分隔
    });

    // 显示当前状态
    if (currentConfigInfo.name) {
      console.log(chalk.green(`当前使用的配置: ${currentConfigInfo.name}`));
    } else {
      console.log(chalk.yellow('当前未进行任何配置'));
    }

  } catch (error) {
    if (error.message.includes('未设置') || error.message.includes('不存在')) {
      console.error(chalk.red('配置错误:'), error.message);
      console.log('请先使用', chalk.cyan('ccapi set'), '命令设置配置文件路径');
    } else {
      console.error(chalk.red('列举配置失败:'), error.message);
    }
    process.exit(1);
  }
}

module.exports = listCommand;