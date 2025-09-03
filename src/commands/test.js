const chalk = require('chalk')
const { validateConfig } = require('../utils/config')
const { readConfigFile } = require('../utils/file')
const { validateApiConfig } = require('../utils/validator')
const { query } = require('@anthropic-ai/claude-code')
const Anthropic = require('@anthropic-ai/sdk')
const { readConfig } = require('../utils/config')
const { execSync } = require('child_process')
const os = require('os')
const fs = require('fs')
const path = require('path')

let configData
let testTempDir = null // 全局测试临时目录
const maxText = 40

/**
 * 创建测试用的临时目录
 */
function createTestTempDir() {
  if (!testTempDir) {
    const tmpDir = os.tmpdir()
    const randomSuffix = Math.random().toString(36).substring(2, 15)
    testTempDir = path.join(tmpDir, `ccapi-test-${randomSuffix}`)

    // 创建目录
    if (!fs.existsSync(testTempDir)) {
      fs.mkdirSync(testTempDir, { recursive: true })
    }
  }
  return testTempDir
}

/**
 * 清理测试临时目录
 */
function cleanupTestTempDir() {
  if (testTempDir && fs.existsSync(testTempDir)) {
    try {
      fs.rmSync(testTempDir, { recursive: true, force: true })
      testTempDir = null
    } catch (error) {
      // console.warn(chalk.yellow(`警告: 无法删除临时目录 ${testTempDir}: ${error.message}`))
    }
  }
}

/**
 * 延迟分级颜色
 */
const LATENCY_COLORS = {
  EXCELLENT: { color: chalk.green, threshold: 300 },
  GOOD: { color: chalk.yellow, threshold: 800 },
  POOR: { color: chalk.red, threshold: Infinity }
}

async function getConfigData() {
  configData = await readConfig()
}
getConfigData()

/**
 * 获取延迟颜色和状态
 */
function getLatencyColor(latency) {
  if (latency === 'error') {
    return { color: chalk.red, text: 'error', status: '●' }
  }

  const ms = parseInt(latency)
  if (ms <= LATENCY_COLORS.EXCELLENT.threshold) {
    return {
      color: LATENCY_COLORS.EXCELLENT.color,
      text: `${ms}ms`,
      status: '●'
    }
  } else if (ms <= LATENCY_COLORS.GOOD.threshold) {
    return { color: LATENCY_COLORS.GOOD.color, text: `${ms}ms`, status: '●' }
  } else {
    return { color: LATENCY_COLORS.POOR.color, text: `${ms}ms`, status: '●' }
  }
}

/**
 * 显示加载动画的简单实现
 */
function showSpinner() {
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
  let i = 0
  return setInterval(() => {
    process.stdout.write(`\r${frames[i]} `)
    i = (i + 1) % frames.length
  }, 100)
}

/**
 * 动态获取 Claude 可执行文件路径
 */
function getClaudeExecutablePath() {
  const fs = require('fs')

  try {
    let command
    const isWindows = process.platform === 'win32'

    if (isWindows) {
      command = 'where claude'
    } else {
      command = 'which claude'
    }
    const claudePath = execSync(command, { encoding: 'utf8' }).trim()
    let finalPath = claudePath

    if (isWindows && claudePath.includes('\n')) {
      finalPath = claudePath.split('\n')[0].trim()
    }

    // 检查文件是否存在，并处理符号链接
    if (fs.existsSync(finalPath)) {
      const stats = fs.lstatSync(finalPath)
      if (stats.isSymbolicLink()) {
        finalPath = fs.realpathSync(finalPath) // 解析符号链接的真实路径
      }
    }

    return finalPath
  } catch (error) {
    return null
  }
}

/**
 * 使用@anthropic-ai/sdk库测试单个API配置的延迟
 */
async function testApiLatencyWithSDK(
  url,
  key,
  token,
  model = 'claude-3-5-haiku-20241022'
) {
  let latency
  const startTime = Date.now()

  try {
    // 初始化Anthropic客户端
    const client = new Anthropic({
      apiKey: key || token,
      baseURL: url
    })

    // 设置超时
    const timeout = configData.testTimeout || 5000
    const abortController = new AbortController()
    const timeoutId = setTimeout(() => {
      abortController.abort()
    }, timeout)

    // 发送测试消息
    const response = await client.messages.create(
      {
        model,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }]
      },
      {
        signal: abortController.signal
      }
    )

    clearTimeout(timeoutId)
    const endTime = Date.now()
    latency = endTime - startTime

    let text = 'Success'
    // console.log('response', response.content);

    try {
      const data = response.content ? response : JSON.parse(response)
      // console.log('响应111', data);
      text =
        data?.content?.[0]?.text || data?.content?.[0]?.thinking || 'Success'
    } catch (err) {
      // console.log(22, err);
    }
    return {
      success: true,
      latency,
      response: text,
      error: null
    }
  } catch (error) {
    // console.log(111, error.message)
    const endTime = Date.now()
    latency = endTime - startTime
    const message =
      error.message === 'Request was aborted.'
        ? 'Timeout'
        : `${error.message || error?.error?.error?.message || '请求失败'}`
    return {
      success: false,
      latency: error === 'timeout' ? 'error' : latency,
      error: message,
      response: null
    }
  }
}

/**
 * 使用@anthropic-ai/claude-code库测试单个API配置的延迟（用于-s参数）
 */
async function testApiLatency(
  url,
  key,
  token,
  model = 'claude-3-5-haiku-20241022'
) {
  let latency
  const startTime = Date.now()

  try {
    // 为测试创建临时工作目录，避免污染用户的Claude Code会话历史
    const tempDir = createTestTempDir()

    // 构建环境变量配置，与 claude-code SDK 保持一致
    const env = {
      ANTHROPIC_BASE_URL: url,
      ANTHROPIC_MODEL: model
    }

    // 设置认证信息
    if (key) {
      env.ANTHROPIC_API_KEY = key
    }
    if (token) {
      env.ANTHROPIC_AUTH_TOKEN = token
    }

    // 使用 claude-code SDK 的 query 函数
    const abortController = new AbortController()

    // 设置超时
    const timeout = configData.testValidTimeout || 20000
    const timeoutId = setTimeout(() => {
      latency = 'error'
      abortController.abort()
    }, timeout)

    // 动态获取 Claude 可执行文件路径
    const claudeExecutablePath = getClaudeExecutablePath()
    if (!claudeExecutablePath) {
      throw new Error('Claude 可执行文件未找到，请确保已安装 Claude Code')
    }

    // 执行查询 - 修正参数格式和添加必需的环境变量
    const queryOptions = {
      env: {
        ...env,
        PATH: process.env.PATH // 传递 PATH 环境变量以确保能找到 node
      },
      cwd: tempDir, // 使用临时目录作为工作目录，隔离会话历史
      model,
      abortController,
      mcpServers: undefined,
      maxTurns: 2, // 限制为单轮对话以加快测试
      pathToClaudeCodeExecutable: claudeExecutablePath, // 动态获取的路径
      permissionMode: 'bypassPermissions', // 绕过权限检查以加快测试
      executable: 'node' // 明确指定使用 Node.js
    }

    let responseText = ''
    let hasResponse = false
    let success = false

    // 使用异步迭代器获取响应 - 修正 query 调用格式
    const queryIterator = query({
      prompt: 'test',
      options: queryOptions
    })

    for await (const message of queryIterator) {
      // console.log('msg', message); // 只在调试时启用

      // 处理首个消息
      if (message.type === 'result') {
        // console.log('msg', message)

        if (!hasResponse) {
          success = !message.is_error && message.subtype === 'success'
          hasResponse = true
          const endTime = Date.now()
          latency = endTime - startTime
          responseText = message.result.replace(/\n/g, '') || 'error_during_execution'
          abortController.abort()
          break
        }
      }
    }

    clearTimeout(timeoutId)

    // 如果没有获得响应但也没有错误，可能是空响应
    if (!hasResponse) {
      latency = 'error'
      responseText = 'Empty response'
      abortController.abort()
    }

    return {
      success,
      latency,
      response:
        responseText.length > maxText
          ? responseText.slice(0, maxText) + '...'
          : responseText || 'Success',
      error: null
    }
  } catch (error) {
    console.log('error', error)
    let success = false
    let message = '请求失败'

    // 如果是AbortError且已经有延迟数据，说明是收到响应后手动中断，应该算成功
    if (
      error.name === 'AbortError' &&
      latency &&
      latency !== 'error' &&
      typeof latency === 'number'
    ) {
      message = 'Success'
      success = true
    }
    // 如果是AbortError但没有延迟数据，说明是超时中断，算失败
    else if (error.message === 'Claude Code process aborted by user') {
      message = 'Timeout'
      latency = 'error'
    }
    // 其他错误
    else if (error.message) {
      message = error.message
      latency = 'error'
    }

    return {
      success,
      latency,
      error: message,
      response: null
    }
  }
}

/**
 * 格式化URL，确保对齐
 */
function formatUrl(url, maxLength = maxText) {
  if (url.length > maxLength) {
    return url.slice(0, maxLength - 3) + '...'
  }
  // return url.padEnd(maxLength);
  return url
}

/**
 * 测试单个配置的所有URL (并行版本，用于-s参数)
 */
async function testConfigurationSerial(
  configName,
  config,
  keyIndex = 0,
  tokenIndex = 0
) {
  const urls = Array.isArray(config.url) ? config.url : [config.url]
  const keys = Array.isArray(config.key)
    ? config.key
    : config.key
    ? [config.key]
    : []
  const tokens = Array.isArray(config.token)
    ? config.token
    : config.token
    ? [config.token]
    : []

  // 获取认证信息，优先使用key
  const authItems = keys.length > 0 ? keys : tokens

  if (authItems.length === 0) {
    return {
      configName,
      results: [
        {
          url: 'all',
          success: false,
          latency: 'error',
          error: '缺少认证信息 (key 或 token)'
        }
      ]
    }
  }

  // 选择指定的key或token
  const selectedAuthIndex = keyIndex || tokenIndex || 0
  const selectedAuth =
    authItems[Math.min(selectedAuthIndex, authItems.length - 1)]

  // 创建并行测试任务
  const testPromises = urls.map((url, i) => {
    const model = Array.isArray(config.model)
      ? config.model[0]
      : config.model || 'claude-3-5-haiku-20241022'

    return testApiLatency(
      url,
      keys.length > 0 ? selectedAuth : null,
      tokens.length > 0 ? selectedAuth : null,
      model
    )
      .then((result) => ({ url, ...result, configName, index: i }))
      .catch((error) => ({
        url,
        success: false,
        latency: 'error',
        error: error.message,
        configName,
        index: i
      }))
  })

  // 等待所有测试完成
  const results = await Promise.all(testPromises)
  return { configName, results }
}

/**
 * 测试单个配置的所有URL (使用@anthropic-ai/sdk，用于原有test命令)
 */
async function testConfiguration(configName, config) {
  const urls = Array.isArray(config.url) ? config.url : [config.url]
  const keys = Array.isArray(config.key)
    ? config.key
    : config.key
    ? [config.key]
    : []
  const tokens = Array.isArray(config.token)
    ? config.token
    : config.token
    ? [config.token]
    : []

  // 获取认证信息，优先使用key
  const authItems = keys.length > 0 ? keys : tokens

  if (authItems.length === 0) {
    return {
      configName,
      results: [
        {
          url: 'all',
          success: false,
          latency: 'error',
          error: '缺少认证信息 (key 或 token)'
        }
      ]
    }
  }

  // 创建并行测试任务
  const testPromises = urls.map((url, i) => {
    const auth = authItems[Math.min(i, authItems.length - 1)] // 如果认证信息不足，使用最后一个
    const model = Array.isArray(config.model)
      ? config.model[0]
      : config.model || 'claude-3-5-haiku-20241022'

    return testApiLatencyWithSDK(
      url,
      keys.length > 0 ? auth : null,
      tokens.length > 0 ? auth : null,
      model
    )
      .then((result) => ({ url, ...result, configName, index: i }))
      .catch((error) => ({
        url,
        success: false,
        latency: 'error',
        error: error.message,
        configName,
        index: i
      }))
  })

  // 等待所有测试完成
  const results = await Promise.all(testPromises)
  return { configName, results }
}

/**
 * 原有的串行测试单个配置（保留用于向后兼容，使用@anthropic-ai/sdk）
 */
async function testConfigurationSerialOld(configName, config) {
  console.log(chalk.cyan.bold(`[${configName}]`))

  const urls = Array.isArray(config.url) ? config.url : [config.url]
  const keys = Array.isArray(config.key)
    ? config.key
    : config.key
    ? [config.key]
    : []
  const tokens = Array.isArray(config.token)
    ? config.token
    : config.token
    ? [config.token]
    : []

  // 获取认证信息，优先使用key
  const authItems = keys.length > 0 ? keys : tokens

  if (authItems.length === 0) {
    console.log(chalk.red('    错误: 缺少认证信息 (key 或 token)'))
    return { configName, results: [] }
  }

  const results = []
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i]
    const auth = authItems[Math.min(i, authItems.length - 1)]
    const model = Array.isArray(config.model)
      ? config.model[0]
      : config.model || 'claude-3-5-haiku-20241022'

    const spinner = showSpinner()

    try {
      const result = await testApiLatencyWithSDK(
        url,
        keys.length > 0 ? auth : null,
        tokens.length > 0 ? auth : null,
        model
      )

      clearInterval(spinner)
      process.stdout.write('\r\u001b[K')

      const { color, text, status } = getLatencyColor(result.latency)
      const responseText = result.response
        ? result.response.length > maxText
          ? result.response.slice(0, maxText) + '...'
          : result.response
        : result.error || 'Success'
      const log = `    ${i + 1}.[${formatUrl(url)}] ${color(
        status
      )} ${color.bold(text)} ${
        configData.testResponse ? `[Response: ${responseText}]` : ''
      }`
      console.log(log)

      results.push({ url, ...result })
    } catch (error) {
      clearInterval(spinner)
      process.stdout.write('\r\u001b[K')
      const log = `    ${i + 1}.[${formatUrl(url)}] ${chalk.red(
        '●'
      )} ${chalk.red.bold('error')} ${
        configData.testResponse ? `[Response: ${error.message}]` : ''
      }`
      console.log(log)
      results.push({
        url,
        success: false,
        latency: 'error',
        error: error.message
      })
    }
  }

  console.log()
  return { configName, results }
}

/**
 * 并行测试所有API配置的主函数
 */
async function testParallelCommand(configName = null, auto = false) {
  try {
    // 验证配置
    const config = await validateConfig()

    // 读取API配置文件
    const apiConfig = await readConfigFile(config.apiConfigPath)
    if (!validateApiConfig(apiConfig)) {
      console.error(chalk.red('错误:'), 'api配置文件格式不正确')
      return
    }

    let configsToTest = {}

    if (configName) {
      // 测试指定配置
      if (!apiConfig[configName]) {
        console.error(chalk.red('错误:'), `配置 "${configName}" 不存在`)
        console.log(chalk.green('可用配置:'), Object.keys(apiConfig).join(', '))
        return
      }
      configsToTest[configName] = apiConfig[configName]
    } else {
      // 测试所有配置
      configsToTest = apiConfig
    }

    // 显示并行测试进度
    const totalConfigs = Object.keys(configsToTest).length
    console.log(chalk.green.bold(`正在测试${totalConfigs}个配置的URL延迟...`))

    // 显示全局加载动画
    const globalSpinner = showSpinner()

    // 创建所有配置的并行测试任务
    const testPromises = Object.entries(configsToTest).map(
      ([name, configData]) => testConfiguration(name, configData)
    )

    // 等待所有配置测试完成
    const allResults = await Promise.all(testPromises)

    // 清除加载动画
    clearInterval(globalSpinner)
    process.stdout.write('\r\u001b[K') // 清除当前行

    // 整理并排序所有测试结果
    const sortedResults = sortTestResults(allResults)

    // 显示排序后的结果
    displaySortedResults(sortedResults)

    // 统计总的端点数量
    // const totalEndpoints = sortedResults.reduce((total, config) => total + config.results.length, 0);

    // 显示测试完成
    console.log(chalk.green.bold(`URL延迟测试完成!`))
    return sortedResults
  } catch (error) {
    console.error(chalk.red('URL延迟测试失败:'), error.message)
    process.exit(1)
  }
}

/**
 * 对测试结果进行排序和分组 (按配置分组，配置内按原始顺序)
 */
function sortTestResults(allResults) {
  // 对每个配置的results内部保持原始顺序（按index排序）
  const sortedResults = allResults.map((configResult) => {
    const sortedConfigResults = configResult.results.sort((a, b) => {
      // 按原始配置文件中的顺序排序（使用index字段）
      if (a.index !== undefined && b.index !== undefined) {
        return a.index - b.index
      }

      // 如果没有index字段，保持原顺序（不排序）
      return 0
    })

    return {
      ...configResult,
      results: sortedConfigResults
    }
  })

  // 按配置的最佳延迟排序配置
  const finalSorted = sortedResults.sort((a, b) => {
    const bestLatencyA = getBestLatency(a.results)
    const bestLatencyB = getBestLatency(b.results)

    // 调试信息
    // console.log(`比较 ${a.configName}(${bestLatencyA}ms) vs ${b.configName}(${bestLatencyB}ms)`);

    // 如果都有成功的结果，按最佳延迟排序
    if (bestLatencyA !== Infinity && bestLatencyB !== Infinity) {
      return bestLatencyA - bestLatencyB
    }

    // 有成功结果的排在前面
    if (bestLatencyA !== Infinity && bestLatencyB === Infinity) return -1
    if (bestLatencyA === Infinity && bestLatencyB !== Infinity) return 1

    // 都没有成功结果，按配置名排序
    return a.configName.localeCompare(b.configName)
  })

  return finalSorted
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
    .filter(
      (r) =>
        typeof r.latency === 'number' && r.latency > 0 && r.latency !== Infinity
    )
    .sort((a, b) => a.latency - b.latency)

  if (numericResults.length > 0) {
    return { latency: numericResults[0].latency, url: numericResults[0].url }
  }

  return { latency: Infinity, url: null }
}

/**
 * 获取配置结果中的最佳延迟（向后兼容）
 */
function getBestLatency(results) {
  const info = getBestLatencyInfo(results)
  return info.latency
}

/**
 * 简化显示测试结果 (用于-s参数)
 */
function displaySimpleResults(sortedResults) {
  console.log()
  console.log(chalk.yellow.bold('有效性测试结果(按响应延迟从低到高): '))
  console.log()

  sortedResults.forEach((configResult, configIndex) => {
    // 获取并显示配置的最佳延迟和地址
    const bestInfo = getBestLatencyInfo(configResult.results)

    let bestText
    if (bestInfo.latency === Infinity) {
      bestText = '无'
    } else {
      const shortUrl = formatUrl(bestInfo.url)
      bestText = `${shortUrl}`
    }

    // 显示配置名和最佳延迟信息
    console.log(
      chalk.cyan.bold(`[${configResult.configName}]`) +
        chalk.cyan.bold(`(最优路线: ${bestText})`)
    )

    configResult.results.forEach((result, index) => {
      const status =
        result.success && result.latency !== 'error'
          ? `✅${chalk.green.bold('有效')}`
          : `❌${chalk.red.bold('无效')}`

      // 使用与原test命令相同的颜色逻辑
      const { color } = getLatencyColor(result.latency)
      const latencyText =
        result.latency === 'error' ? 'error' : `${result.latency}ms`

      // 根据configData.testResponse配置决定是否显示响应结果
      const responseText = result.response
        ? result.response.length > maxText
          ? result.response.slice(0, maxText) + '...'
          : result.response
        : result.error || 'Success'

      const responseDisplay = configData.testResponse
        ? ` [Response: ${responseText}]`
        : ''

      console.log(
        `    ${index + 1}.[${result.url}] ${status}(${color.bold(
          latencyText
        )})${responseDisplay}`
      )
    })

    // 在每个配置后添加空行
    if (configIndex < sortedResults.length - 1) {
      console.log()
    }
  })

  console.log()
}

/**
 * 并行测试所有API配置的主函数 (用于-s参数)
 */
async function testSerialCommand(
  configName = null,
  keyIndex = 0,
  tokenIndex = 0
) {
  try {
    // 验证配置
    const config = await validateConfig()

    // 读取API配置文件
    const apiConfig = await readConfigFile(config.apiConfigPath)
    if (!validateApiConfig(apiConfig)) {
      console.error(chalk.red('错误:'), 'api配置文件格式不正确')
      return
    }

    let configsToTest = {}

    if (configName) {
      // 测试指定配置
      if (!apiConfig[configName]) {
        console.error(chalk.red('错误:'), `配置 "${configName}" 不存在`)
        console.log(chalk.green('可用配置:'), Object.keys(apiConfig).join(', '))
        return
      }
      configsToTest[configName] = apiConfig[configName]
    } else {
      // 测试所有配置
      configsToTest = apiConfig
    }

    // 显示并行测试进度
    const totalConfigs = Object.keys(configsToTest).length
    console.log(
      chalk.green.bold(
        `正在测试${totalConfigs}个配置在Claude Code中的有效性(请耐心等待)...`
      )
    )

    // 显示全局加载动画
    const globalSpinner = showSpinner()

    // 创建所有配置的并行测试任务
    const testPromises = Object.entries(configsToTest).map(
      ([name, configData]) =>
        testConfigurationSerial(name, configData, keyIndex, tokenIndex)
    )

    // 等待所有配置测试完成
    const allResults = await Promise.all(testPromises)

    // 清除加载动画
    clearInterval(globalSpinner)
    process.stdout.write('\r\u001b[K') // 清除当前行

    // 整理并排序所有测试结果（与原test命令保持一致）
    const sortedResults = sortTestResults(allResults)

    // 使用简化显示
    displaySimpleResults(sortedResults)

    // 显示测试完成
    console.log(
      chalk.green.bold(`有效性测试完成, 此结果代表能否在Claude Code中真正使用!`)
    )

    // 清理测试临时目录
    cleanupTestTempDir()

    return allResults
  } catch (error) {
    // 确保即使出错也清理临时目录
    cleanupTestTempDir()
    console.error(chalk.red('有效性测试失败:'), error.message)
    process.exit(1)
  }
}

/**
 * 显示排序后的测试结果 (按配置分组显示)
 */
function displaySortedResults(sortedResults) {
  console.log()
  console.log(chalk.yellow.bold('测试结果(按厂商URL延迟从低到高): '))
  console.log()

  sortedResults.forEach((configResult, configIndex) => {
    // 获取并显示配置的最佳延迟和地址
    const bestInfo = getBestLatencyInfo(configResult.results)

    let bestText
    if (bestInfo.latency === Infinity) {
      bestText = '无'
    } else {
      const shortUrl = formatUrl(bestInfo.url)
      bestText = `${shortUrl}`
      // bestText = `${bestInfo.latency}ms`;
    }

    // 显示配置名和最佳延迟信息
    console.log(
      chalk.cyan.bold(`[${configResult.configName}]`) +
        chalk.cyan.bold(`(最优路线: ${bestText})`)
    )

    configResult.results.forEach((result, index) => {
      const { color, text, status } = getLatencyColor(result.latency)
      const responseText = result.response
        ? result.response.length > maxText
          ? result.response.slice(0, maxText) + '...'
          : result.response
        : result.error || 'Success'

      const urlFormatted = formatUrl(result.url)
      const resultLine = `    ${index + 1}.[${urlFormatted}] ${color(
        status
      )} ${color.bold(text)} ${
        configData.testResponse ? `[Response: ${responseText}]` : ''
      }`

      console.log(resultLine)
    })

    // 在每个配置后添加空行
    if (configIndex < sortedResults.length - 1) {
      console.log()
    }
  })

  console.log()
}

/**
 * 测试配置命令 (保留原有功能，串行测试)
 */
async function testCommand(configName = null) {
  try {
    console.log(chalk.green.bold('正在测试延迟中...'))
    console.log()

    // 验证配置
    const config = await validateConfig()

    // 读取API配置文件
    const apiConfig = await readConfigFile(config.apiConfigPath)
    if (!validateApiConfig(apiConfig)) {
      console.error(chalk.red('错误:'), 'api配置文件格式不正确')
      return
    }

    let configsToTest = {}

    if (configName) {
      // 测试指定配置
      if (!apiConfig[configName]) {
        console.error(chalk.red('错误:'), `配置 "${configName}" 不存在`)
        console.log(chalk.green('可用配置:'), Object.keys(apiConfig).join(', '))
        return
      }
      configsToTest[configName] = apiConfig[configName]
    } else {
      // 测试所有配置
      configsToTest = apiConfig
    }

    const allResults = []

    // 逐个测试配置
    for (const [name, configData] of Object.entries(configsToTest)) {
      const result = await testConfigurationSerialOld(name, configData)
      allResults.push(result)
    }

    // 显示测试完成
    console.log(chalk.green.bold('延迟测试完成！'))

    return allResults
  } catch (error) {
    console.error(chalk.red('延迟测试失败:'), error.message)
    process.exit(1)
  }
}

module.exports = testParallelCommand
module.exports.testCommand = testCommand
module.exports.testParallelCommand = testParallelCommand
module.exports.testSerialCommand = testSerialCommand
