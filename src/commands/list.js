const chalk = require('chalk');
const { validateConfig } = require('../utils/config');
const { readConfigFile } = require('../utils/file');
const { validateApiConfig, validateSettingsConfig } = require('../utils/validator');
const { CLAUDE_ENV_KEYS, ERROR_MESSAGES } = require('../constants');

/**
 * 获取当前使用的配置名称和各字段索引信息
 */
function getCurrentConfigInfo(settingsData, apiConfig) {
  const currentUrl = settingsData.env?.[CLAUDE_ENV_KEYS.url];
  const currentKey = settingsData.env?.[CLAUDE_ENV_KEYS.key];
  const currentToken = settingsData.env?.[CLAUDE_ENV_KEYS.token];
  const currentModel = settingsData.env?.[CLAUDE_ENV_KEYS.model];
  const currentFast = settingsData.env?.[CLAUDE_ENV_KEYS.fast];

  // 优先基于 key/token 匹配，如果都没有则基于 URL 匹配
  const matchField = currentKey || currentToken;
  if (!matchField && !currentUrl) {
    return { name: null, urlIndex: -1, keyIndex: -1, tokenIndex: -1, modelIndex: -1, fastIndex: -1 };
  }

  // 查找匹配的配置
  for (const [name, config] of Object.entries(apiConfig)) {
    let isMatch = false;

    // 检查 key 匹配
    if (currentKey) {
      if (Array.isArray(config.key)) {
        if (config.key.includes(currentKey)) isMatch = true;
      } else if (config.key === currentKey) {
        isMatch = true;
      }
    }

    // 检查 token 匹配
    if (currentToken && !isMatch) {
      if (Array.isArray(config.token)) {
        if (config.token.includes(currentToken)) isMatch = true;
      } else if (config.token === currentToken) {
        isMatch = true;
      }
    }

    // 如果没有 key/token，则基于 URL 匹配（兼容旧逻辑）
    if (!currentKey && !currentToken && currentUrl) {
      if (Array.isArray(config.url)) {
        if (config.url.includes(currentUrl)) isMatch = true;
      } else if (config.url === currentUrl) {
        isMatch = true;
      }
    }

    if (isMatch) {
      let urlIndex = -1;
      let keyIndex = -1;
      let tokenIndex = -1;
      let modelIndex = -1;
      let fastIndex = -1;

      // 查找当前使用的 URL 索引
      if (currentUrl) {
        if (Array.isArray(config.url)) {
          urlIndex = config.url.indexOf(currentUrl);
        } else if (config.url === currentUrl) {
          urlIndex = 0; // 字符串情况下默认为0
        }
      }

      // 查找当前使用的 key 索引
      if (currentKey) {
        if (Array.isArray(config.key)) {
          keyIndex = config.key.indexOf(currentKey);
        } else if (config.key === currentKey) {
          keyIndex = 0; // 字符串情况下默认为0
        }
      }

      // 查找当前使用的 token 索引
      if (currentToken) {
        if (Array.isArray(config.token)) {
          tokenIndex = config.token.indexOf(currentToken);
        } else if (config.token === currentToken) {
          tokenIndex = 0; // 字符串情况下默认为0
        }
      }

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

      return { name, urlIndex, keyIndex, tokenIndex, modelIndex, fastIndex };
    }
  }

  return { name: null, urlIndex: -1, keyIndex: -1, tokenIndex: -1, modelIndex: -1, fastIndex: -1 };
}

/**
 * 格式化字段显示（支持 URL、Key、Token、Model、Fast）
 */
function formatFieldDisplay(fieldValue, currentIndex, label, isMasked = false) {
  if (Array.isArray(fieldValue)) {
    const lines = [`${label}:`];
    fieldValue.forEach((value, index) => {
      const isCurrentValue = index === currentIndex;
      const prefix = isCurrentValue ? '    * - ' : '      - ';

      // 处理敏感信息脱敏
      let displayValue = value;
      if (isMasked && value && value.length > 15) {
        displayValue = value.slice(0, 15) + '...';
      }

      const valueDisplay = isCurrentValue ? chalk.green.bold(displayValue) : chalk.cyan(displayValue);
      const text = `${prefix}${index + 1}: ${valueDisplay}`
      lines.push(isCurrentValue ? chalk.green.bold(text) : text);
    });
    return lines;
  } else {
    // 字符串情况，保持原样
    let displayValue = fieldValue;
    if (isMasked && fieldValue && fieldValue.length > 15) {
      displayValue = fieldValue.slice(0, 15) + '...';
    }

    const valueDisplay = currentIndex === 0 ? chalk.green.bold(displayValue) : chalk.cyan(displayValue);
    return [`${label}: ${valueDisplay}`];
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

  // 格式化 URL 显示
  const urlLines = formatFieldDisplay(
    config.url,
    isCurrent ? currentInfo.urlIndex : -1,
    'URL'
  );
  details.push(...urlLines);

  // 格式化模型显示
  const modelLines = formatFieldDisplay(
    config.model,
    isCurrent ? currentInfo.modelIndex : -1,
    'Model'
  );
  details.push(...modelLines);

  // 格式化快速模型显示
  if (config.fast) {
    const fastLines = formatFieldDisplay(
      config.fast,
      isCurrent ? currentInfo.fastIndex : -1,
      'Fast'
    );
    details.push(...fastLines);
  }

  // 格式化 Key 显示
  if (config.key) {
    const keyLines = formatFieldDisplay(
      config.key,
      isCurrent ? currentInfo.keyIndex : -1,
      'Key',
      true // 需要脱敏
    );
    details.push(...keyLines);
  }

  // 格式化 Token 显示
  if (config.token) {
    const tokenLines = formatFieldDisplay(
      config.token,
      isCurrent ? currentInfo.tokenIndex : -1,
      'Token',
      true // 需要脱敏
    );
    details.push(...tokenLines);
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
      console.error(chalk.red('错误:'), 'api配置文件格式不正确');
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
      console.log(chalk.green.bold(`当前使用的配置: ${currentConfigInfo.name}`));
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