const chalk = require('chalk');
const { validateConfig } = require('../utils/config');
const { readConfigFile } = require('../utils/file');
const { validateApiConfig } = require('../utils/validator');
const { default: Anthropic } = require('@anthropic-ai/sdk');
const { readConfig } = require('../utils/config');

let configData;

/**
 * 延迟分级颜色
 */
const LATENCY_COLORS = {
  EXCELLENT: { color: chalk.green, threshold: 300 },
  GOOD: { color: chalk.yellow, threshold: 800 },
  POOR: { color: chalk.red, threshold: Infinity }
};

async function getConfigData() {
  configData = await readConfig();
}
getConfigData();

/**
 * 获取延迟颜色和状态
 */
function getLatencyColor(latency) {
  if (latency === 'error') {
    return { color: chalk.red, text: 'error', status: '●' };
  }

  const ms = parseInt(latency);
  if (ms <= LATENCY_COLORS.EXCELLENT.threshold) {
    return { color: LATENCY_COLORS.EXCELLENT.color, text: `${ms}ms`, status: '●' };
  } else if (ms <= LATENCY_COLORS.GOOD.threshold) {
    return { color: LATENCY_COLORS.GOOD.color, text: `${ms}ms`, status: '●' };
  } else {
    return { color: LATENCY_COLORS.POOR.color, text: `${ms}ms`, status: '●' };
  }
}

/**
 * 显示加载动画的简单实现
 */
function showSpinner() {
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let i = 0;
  return setInterval(() => {
    process.stdout.write(`\r${frames[i]} `);
    i = (i + 1) % frames.length;
  }, 100);
}

/**
 * 测试单个API配置的延迟
 */
async function testApiLatency(url, key, token, model = 'claude-3-5-haiku-20241022') {
  let latency
  const startTime = Date.now();
  try {
    // const configData = await readConfig();
    const client = new Anthropic({
      apiKey: key || null,
      authToken: token || null,
      baseURL: url,
      timeout: configData.testTimeout || 5000,
      maxRetries: 1
    });

    // 发送简单的测试请求
    const response = await Promise.race([
      client.messages.create({
        model: model,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }]
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject('timeout'), configData.testTimeout || 5000)
      )
    ]);

    const endTime = Date.now();
    latency = endTime - startTime;
    let text = 'Success'
    // console.log('response', response.content);

    try {
      const data = response.content ? response : JSON.parse(response)
      // console.log('响应111', data);
      text = data?.content?.[0]?.text || data?.content?.[0]?.thinking || 'Success'
    } catch (err) {
      // console.log(22, err);
    }
    // console.log('text', response?.content, response?.content[0].text);

    return {
      success: true,
      latency,
      response: text,
      error: null
    };
  } catch (error) {
    // console.log('响应err', error);
    const endTime = Date.now();
    latency = endTime - startTime;
    const message = error === 'timeout' ? 'Timeout' : `${error.status || ''} ${error?.error?.error?.message || '请求失败'}`
    return {
      success: false,
      latency: error === 'timeout' ? 'error' : latency,
      error: message,
      response: null
    };
  }
}

/**
 * 格式化URL，确保对齐
 */
function formatUrl(url, maxLength = 50) {
  if (url.length > maxLength) {
    return url.slice(0, maxLength - 3) + '...';
  }
  // return url.padEnd(maxLength);
  return url;
}

/**
 * 测试单个配置的所有URL (并行版本)
 */
async function testConfiguration(configName, config) {
  const urls = Array.isArray(config.url) ? config.url : [config.url];
  const keys = Array.isArray(config.key) ? config.key : (config.key ? [config.key] : []);
  const tokens = Array.isArray(config.token) ? config.token : (config.token ? [config.token] : []);

  // 获取认证信息，优先使用key
  const authItems = keys.length > 0 ? keys : tokens;

  if (authItems.length === 0) {
    return { configName, results: [{ url: 'all', success: false, latency: 'error', error: '缺少认证信息 (key 或 token)' }] };
  }

  // 创建并行测试任务
  const testPromises = urls.map((url, i) => {
    const auth = authItems[Math.min(i, authItems.length - 1)]; // 如果认证信息不足，使用最后一个
    const model = Array.isArray(config.model) ? config.model[0] : (config.model || 'claude-3-5-haiku-20241022');
    
    return testApiLatency(url, keys.length > 0 ? auth : null, tokens.length > 0 ? auth : null, model)
      .then(result => ({ url, ...result, configName, index: i }))
      .catch(error => ({ 
        url, 
        success: false, 
        latency: 'error', 
        error: error.message,
        configName,
        index: i
      }));
  });

  // 等待所有测试完成
  const results = await Promise.all(testPromises);
  return { configName, results };
}

/**
 * 原有的串行测试单个配置（保留用于向后兼容）
 */
async function testConfigurationSerial(configName, config) {
  console.log(chalk.cyan.bold(`【${configName}】`));

  const urls = Array.isArray(config.url) ? config.url : [config.url];
  const keys = Array.isArray(config.key) ? config.key : (config.key ? [config.key] : []);
  const tokens = Array.isArray(config.token) ? config.token : (config.token ? [config.token] : []);

  // 获取认证信息，优先使用key
  const authItems = keys.length > 0 ? keys : tokens;

  if (authItems.length === 0) {
    console.log(chalk.red('    错误: 缺少认证信息 (key 或 token)'));
    return { configName, results: [] };
  }

  const results = [];
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const auth = authItems[Math.min(i, authItems.length - 1)];
    const model = Array.isArray(config.model) ? config.model[0] : (config.model || 'claude-3-5-haiku-20241022');

    const spinner = showSpinner();

    try {
      const result = await testApiLatency(url, keys.length > 0 ? auth : null, tokens.length > 0 ? auth : null, model);

      clearInterval(spinner);
      process.stdout.write('\r\u001b[K');

      const { color, text, status } = getLatencyColor(result.latency);
      const responseText = result.response ?
        (result.response.length > 80 ? result.response.slice(0, 80) + '...' : result.response) : (result.error || 'Success');
      const log = `    ${i + 1}.[${formatUrl(url)}] ${color(status)} ${color.bold(text)} ${configData.testResponse ? `[Response: ${responseText}]` : ''}`
      console.log(log);

      results.push({ url, ...result });
    } catch (error) {
      clearInterval(spinner);
      process.stdout.write('\r\u001b[K');
      const log = `    ${i + 1}.[${formatUrl(url)}] ${chalk.red('●')} ${chalk.red.bold('error')} ${configData.testResponse ? `[Response: ${error.message}]` : ''}`
      console.log(log);
      results.push({ url, success: false, latency: 'error', error: error.message });
    }
  }

  console.log();
  return { configName, results };
}

/**
 * 并行测试所有API配置的主函数
 */
async function testParallelCommand(configName = null, auto = false) {
  try {
    // 验证配置
    const config = await validateConfig();

    // 读取API配置文件
    const apiConfig = await readConfigFile(config.apiConfigPath);
    if (!validateApiConfig(apiConfig)) {
      console.error(chalk.red('错误:'), 'api配置文件格式不正确');
      return;
    }

    let configsToTest = {};

    if (configName) {
      // 测试指定配置
      if (!apiConfig[configName]) {
        console.error(chalk.red('错误:'), `配置 "${configName}" 不存在`);
        console.log(chalk.green('可用配置:'), Object.keys(apiConfig).join(', '));
        return;
      }
      configsToTest[configName] = apiConfig[configName];
    } else {
      // 测试所有配置
      configsToTest = apiConfig;
    }

    // 显示并行测试进度
    const totalConfigs = Object.keys(configsToTest).length;
    console.log(chalk.green.bold(`正在测试${totalConfigs}个配置...`));
    
    // 显示全局加载动画
    const globalSpinner = showSpinner();

    // 创建所有配置的并行测试任务
    const testPromises = Object.entries(configsToTest).map(([name, configData]) => 
      testConfiguration(name, configData)
    );

    // 等待所有配置测试完成
    const allResults = await Promise.all(testPromises);

    // 清除加载动画
    clearInterval(globalSpinner);
    process.stdout.write('\r\u001b[K'); // 清除当前行

    // 整理并排序所有测试结果
    const sortedResults = sortTestResults(allResults);

    // 显示排序后的结果
    displaySortedResults(sortedResults);

    // 统计总的端点数量
    // const totalEndpoints = sortedResults.reduce((total, config) => total + config.results.length, 0);

    // 显示测试完成
    console.log(chalk.green.bold(`延迟测试完成!`));
    return sortedResults;

  } catch (error) {
    console.error(chalk.red('并行延迟测试失败:'), error.message);
    process.exit(1);
  }
}

/**
 * 对测试结果进行排序和分组 (按配置分组，配置内按原始顺序)
 */
function sortTestResults(allResults) {
  // 对每个配置的results内部保持原始顺序（按index排序）
  const sortedResults = allResults.map(configResult => {
    const sortedConfigResults = configResult.results.sort((a, b) => {
      // 按原始配置文件中的顺序排序（使用index字段）
      if (a.index !== undefined && b.index !== undefined) {
        return a.index - b.index;
      }
      
      // 如果没有index字段，保持原顺序（不排序）
      return 0;
    });
    
    return {
      ...configResult,
      results: sortedConfigResults
    };
  });

  // 按配置的最佳延迟排序配置
  const finalSorted = sortedResults.sort((a, b) => {
    const bestLatencyA = getBestLatency(a.results);
    const bestLatencyB = getBestLatency(b.results);
    
    // 调试信息
    // console.log(`比较 ${a.configName}(${bestLatencyA}ms) vs ${b.configName}(${bestLatencyB}ms)`);
    
    // 如果都有成功的结果，按最佳延迟排序
    if (bestLatencyA !== Infinity && bestLatencyB !== Infinity) {
      return bestLatencyA - bestLatencyB;
    }
    
    // 有成功结果的排在前面
    if (bestLatencyA !== Infinity && bestLatencyB === Infinity) return -1;
    if (bestLatencyA === Infinity && bestLatencyB !== Infinity) return 1;
    
    // 都没有成功结果，按配置名排序
    return a.configName.localeCompare(b.configName);
  });
  
  return finalSorted;
}

/**
 * 获取配置结果中的最佳延迟和对应地址
 */
function getBestLatencyInfo(results) {
  // 首先尝试从成功的结果中获取
  // const successResults = results.filter(r => r.success === true);
  
  // 如果有成功的结果，从中获取最佳延迟
  // if (successResults.length > 0) {
  //   const validResults = successResults
  //     .map(r => ({ ...r, latency: typeof r.latency === 'number' ? r.latency : Infinity }))
  //     .filter(r => r.latency !== Infinity);
    
  //   if (validResults.length > 0) {
  //     const bestResult = validResults.reduce((best, current) => 
  //       current.latency < best.latency ? current : best
  //     );
  //     return { latency: bestResult.latency, url: bestResult.url };
  //   }
  // }
  
  // 如果没有标记为成功的结果，尝试从所有有数字延迟的结果中获取
  const numericResults = results
    .filter(r => typeof r.latency === 'number' && r.latency > 0 && r.latency !== Infinity)
    .sort((a, b) => a.latency - b.latency);
  
  if (numericResults.length > 0) {
    return { latency: numericResults[0].latency, url: numericResults[0].url };
  }
  
  return { latency: Infinity, url: null };
}

/**
 * 获取配置结果中的最佳延迟（向后兼容）
 */
function getBestLatency(results) {
  const info = getBestLatencyInfo(results);
  return info.latency;
}

/**
 * 显示排序后的测试结果 (按配置分组显示)
 */
function displaySortedResults(sortedResults) {
  console.log();
  console.log(chalk.yellow.bold('测试结果(按延迟从低到高): '));
  console.log();

  sortedResults.forEach((configResult, configIndex) => {
    // 获取并显示配置的最佳延迟和地址
    const bestInfo = getBestLatencyInfo(configResult.results);
    
    let bestText;
    if (bestInfo.latency === Infinity) {
      bestText = '无';
    } else {
      const shortUrl = formatUrl(bestInfo.url);
      bestText = `${shortUrl}`;
      // bestText = `${bestInfo.latency}ms`;
    }
    
    // 显示配置名和最佳延迟信息
    console.log(chalk.cyan.bold(`【${configResult.configName}】`) + chalk.cyan.bold(`(最优路线: ${bestText})`));

    configResult.results.forEach((result, index) => {
      const { color, text, status } = getLatencyColor(result.latency);
      const responseText = result.response ?
        (result.response.length > 80 ? result.response.slice(0, 80) + '...' : result.response) : 
        (result.error || 'Success');
      
      const urlFormatted = formatUrl(result.url);
      const resultLine = `    ${index + 1}.[${urlFormatted}] ${color(status)} ${color.bold(text)} ${
        configData.testResponse ? `[Response: ${responseText}]` : ''
      }`;
      
      console.log(resultLine);
    });

    // 在每个配置后添加空行
    if (configIndex < sortedResults.length - 1) {
      console.log();
    }
  });

  console.log();
}

/**
 * 测试配置命令 (保留原有功能，串行测试)
 */
async function testCommand(configName = null) {
  try {
    console.log(chalk.green.bold('正在测试延迟中...'));
    console.log();

    // 验证配置
    const config = await validateConfig();

    // 读取API配置文件
    const apiConfig = await readConfigFile(config.apiConfigPath);
    if (!validateApiConfig(apiConfig)) {
      console.error(chalk.red('错误:'), 'api配置文件格式不正确');
      return;
    }

    let configsToTest = {};

    if (configName) {
      // 测试指定配置
      if (!apiConfig[configName]) {
        console.error(chalk.red('错误:'), `配置 "${configName}" 不存在`);
        console.log(chalk.green('可用配置:'), Object.keys(apiConfig).join(', '));
        return;
      }
      configsToTest[configName] = apiConfig[configName];
    } else {
      // 测试所有配置
      configsToTest = apiConfig;
    }

    const allResults = [];

    // 逐个测试配置
    for (const [name, configData] of Object.entries(configsToTest)) {
      const result = await testConfigurationSerial(name, configData);
      allResults.push(result);
    }

    // 显示测试完成
    console.log(chalk.green.bold('延迟测试完成！'));

    return allResults;

  } catch (error) {
    console.error(chalk.red('延迟测试失败:'), error.message);
    process.exit(1);
  }
}

module.exports = testParallelCommand;
module.exports.testCommand = testCommand;
module.exports.testParallelCommand = testParallelCommand;