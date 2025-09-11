const chalk = require('chalk')
const { validateConfig } = require('../utils/config')
const { readConfigFile } = require('../utils/file')
const { validateApiConfig } = require('../utils/validator')
const { readConfig } = require('../utils/config')
const { exec, execSync } = require('child_process')
const { promisify } = require('util')
const execAsync = promisify(exec)
const os = require('os')
const fs = require('fs')
const path = require('path')
const { t } = require('../utils/i18n')

let configData
let testTempDirs = [] // 存储所有测试临时目录，用于清理
const maxText = 50

/**
 * 创建测试用的临时settings文件供claude cli使用
 */
function createTestSettingsFile(url, key, token, model) {
  const tmpDir = os.tmpdir()
  const randomSuffix = Math.random().toString(36).substring(2, 15)
  const settingsPath = path.join(tmpDir, `ccapi-test-${randomSuffix}.json`)

  // 记录临时文件用于清理
  testTempDirs.push(settingsPath)

  // 创建适合claude cli使用的配置文件
  const testSettings = {
    cleanupPeriodDays: 1,
    env: {
      ANTHROPIC_BASE_URL: url,
      ANTHROPIC_MODEL: model
    },
    includeCoAuthoredBy: false,
    permissions: {
      allow: [],
      deny: []
    },
    hooks: {},
    mcpServers: {} // 禁用所有MCP服务以加快测试
  }

  // 设置认证信息
  if (key) {
    testSettings.env.ANTHROPIC_API_KEY = key
  }
  if (token) {
    testSettings.env.ANTHROPIC_AUTH_TOKEN = token
  }

  // console.log(testSettings)

  // 创建空的MCP配置文件
  const mcpConfigPath = path.join(path.dirname(settingsPath), `ccapi-mcp-${randomSuffix}.json`)
  const emptyMcpConfig = {
    mcpServers: {}
  }
  fs.writeFileSync(mcpConfigPath, JSON.stringify(emptyMcpConfig, null, 2))
  testTempDirs.push(mcpConfigPath) // 记录用于清理

  // 写入配置文件
  fs.writeFileSync(settingsPath, JSON.stringify(testSettings, null, 2))

  return { settingsPath, mcpConfigPath }
}

/**
 * 清理测试临时settings文件
 */
async function cleanupTestTempFiles() {
  if (testTempDirs.length === 0) return

  // 稍微延迟，确保claude cli完成所有操作
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // 清理临时settings文件
  testTempDirs.forEach((tempFile) => {
    if (tempFile && fs.existsSync(tempFile)) {
      try {
        fs.unlinkSync(tempFile)
      } catch (error) {
        // console.warn(chalk.yellow(`警告: 无法删除临时文件 ${tempFile}: ${error.message}`))
      }
    }
  })

  testTempDirs = [] // 清空数组
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
 * 使用claude cli测试单个API配置的有效性
 */
async function testApiLatency(url, key, token, model = 'claude-3-5-haiku-20241022') {
  let latency
  let startTime = Date.now()

  try {
    // 创建测试专用的临时settings文件和MCP配置文件
    // const m = model ? model.includes('claude') ? 'claude-3-5-haiku-20241022' : model : 'claude-3-5-haiku-20241022'
    const { settingsPath: tempSettingsPath, mcpConfigPath } = createTestSettingsFile(url, key, token, model)

    // 创建临时工作目录用于claude cli执行
    const tmpDir = os.tmpdir()
    const randomSuffix = Math.random().toString(36).substring(2, 15)
    const tempWorkDir = path.join(tmpDir, `ccapi-test-${randomSuffix}`)

    if (!fs.existsSync(tempWorkDir)) {
      fs.mkdirSync(tempWorkDir, { recursive: true })
    }
    testTempDirs.push(tempWorkDir) // 记录用于清理

    const testPrompt =
      'Please reply with only one word "Success", no thinking is allowed, and no use of any mcp services, tools or hooks is allowed.'

    // 构建claude cli命令
    const claudeCommand = `echo "${testPrompt}" | claude -p --model ${model} --max-turns 2 --dangerously-skip-permissions --settings "${tempSettingsPath}" --mcp-config "${mcpConfigPath}"`
    // console.log('Executing command:', claudeCommand)

    // 设置执行选项
    const timeout = configData.testTimeout || 60000
    const execOptions = {
      encoding: 'utf8',
      timeout: timeout - 1000,
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: tempWorkDir
    }

    // 执行claude cli命令
    startTime = Date.now()
    const result = await execAsync(claudeCommand, execOptions)
    // 命令执行完成
    // console.log('result', result)

    const endTime = Date.now()
    latency = endTime - startTime

    // 解析响应
    let responseText = result.stdout.toString().trim().replace(/\n/g, '')
    const success = responseText && !responseText.toLowerCase().includes('error')

    return {
      success,
      latency,
      response: responseText.length > maxText ? responseText.slice(0, maxText) + '...' : responseText || 'Success',
      error: null
    }
  } catch (error) {
    // 处理错误
    // console.log('error', error)

    let success = false
    let message = await t('test.REQUEST_FAILED')

    // 处理超时错误
    if (error.signal === 'SIGTERM' || error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
      message = await t('test.TIMEOUT')
      latency = 'error'
    } else if (error.stdout) {
      message = error.stdout.toString().trim()
      latency = 'error'
    }
    // 处理其他错误
    else if (error.stderr) {
      message = error.stderr.toString().trim()
      latency = 'error'
    } else if (error.message) {
      message = error.message
      latency = 'error'
    } else {
      message = 'Failed'
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
 * 测试单个配置的所有URL
 */
async function testConfiguration(configName, config, keyIndex = 0, tokenIndex = 0) {
  const urls = Array.isArray(config.url) ? config.url : [config.url]
  const keys = Array.isArray(config.key) ? config.key : config.key ? [config.key] : []
  const tokens = Array.isArray(config.token) ? config.token : config.token ? [config.token] : []

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
          error: await t('test.MISSING_AUTH')
        }
      ]
    }
  }

  // 选择指定的key或token
  const selectedAuthIndex = keyIndex || tokenIndex || 0
  const selectedAuth = authItems[Math.min(selectedAuthIndex, authItems.length - 1)]

  // 创建URL测试任务队列
  const urlTasks = urls.map((url, i) => ({
    url,
    index: i,
    model: Array.isArray(config.model) ? config.model[0] : config.model || 'claude-3-5-haiku-20241022',
    selectedAuth
  }))

  // 分片执行URL测试，每次最多并发3个
  const urlChunkSize = 3
  const results = []

  for (let i = 0; i < urlTasks.length; i += urlChunkSize) {
    const chunk = urlTasks.slice(i, i + urlChunkSize)

    const chunkPromises = chunk.map((task) =>
      testApiLatency(
        task.url,
        keys.length > 0 ? task.selectedAuth : null,
        tokens.length > 0 ? task.selectedAuth : null,
        task.model
      )
        .then((result) => ({ url: task.url, ...result, configName, index: task.index }))
        .catch((error) => ({
          url: task.url,
          success: false,
          latency: 'error',
          error: error.message,
          configName,
          index: task.index
        }))
    )

    const chunkResults = await Promise.all(chunkPromises)
    results.push(...chunkResults)
  }
  return { configName, results }
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
    .filter((r) => typeof r.latency === 'number' && r.latency > 0 && r.latency !== Infinity)
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
async function displaySimpleResults(sortedResults) {
  console.log()
  console.log(chalk.yellow.bold(await t('test.TEST_RESULTS_TITLE')))
  console.log()

  // 预先加载翻译信息
  const translations = {
    valid: await t('test.VALID'),
    invalid: await t('test.INVALID')
  }

  for (const [configIndex, configResult] of sortedResults.entries()) {
    // 获取并显示配置的最佳延迟和地址
    const bestInfo = getBestLatencyInfo(configResult.results)

    let bestText
    if (bestInfo.latency === Infinity) {
      bestText = await t('common.NONE')
    } else {
      const shortUrl = formatUrl(bestInfo.url)
      bestText = `${shortUrl}`
    }
    console.log(
      chalk.cyan.bold(`[${configResult.configName}]`) + chalk.cyan.bold(`(${await t('test.BEST_ROUTE')}: ${bestText})`)
    )

    configResult.results.forEach((result, index) => {
      const status =
        result.success && result.latency !== 'error'
          ? `✅ ${chalk.green.bold(translations.valid)}`
          : `❌ ${chalk.red.bold(translations.invalid)}`
      const { color } = getLatencyColor(result.latency)
      const latencyText = result.latency === 'error' ? 'error' : `${result.latency}ms`
      const responseText = result.response
        ? result.response.length > maxText
          ? result.response.slice(0, maxText) + '...'
          : result.response
        : result.error || 'Success'

      const responseDisplay = configData.testResponse ? ` [Response: ${responseText}]` : ''

      console.log(`    ${index + 1}.[${result.url}] ${status}(${color.bold(latencyText)})${responseDisplay}`)
    })
    if (configIndex < sortedResults.length - 1) {
      console.log()
    }
  }

  console.log()
}

/**
 * 并行测试所有API配置的主函数
 */
async function testCommand(configName = null, keyIndex = 0, tokenIndex = 0) {
  const { cleanupAllTempProjects } = require('../utils/cleanup')
  try {
    // 验证配置
    const config = await validateConfig()

    // 读取API配置文件
    const apiConfig = await readConfigFile(config.apiConfigPath)
    if (!validateApiConfig(apiConfig)) {
      console.error(chalk.red(await t('common.PARAMETER_ERROR')), await t('test.CONFIG_FORMAT_ERROR'))
      return
    }

    let configsToTest = {}

    if (configName) {
      // 测试指定配置
      if (!apiConfig[configName]) {
        console.error(chalk.red(await t('common.PARAMETER_ERROR')), await t('test.CONFIG_NOT_EXIST', configName))
        console.log(chalk.green(await t('common.AVAILABLE_CONFIGS')), Object.keys(apiConfig).join(', '))
        return
      }
      configsToTest[configName] = apiConfig[configName]
    } else {
      // 测试所有配置
      configsToTest = apiConfig
    }

    // 测试开始前清理历史遗留的临时项目记录
    // try {
    //   await cleanupAllTempProjects()
    // } catch (error) {

    // }

    // 显示并行测试进度
    const totalConfigs = Object.keys(configsToTest).length
    console.log(chalk.green.bold(await t('test.TESTING_CONFIGS', totalConfigs)))

    // 显示全局加载动画
    const globalSpinner = showSpinner()

    // 创建所有配置的测试任务队列
    const testTasks = Object.entries(configsToTest).map(([name, configData]) => ({
      name,
      configData,
      keyIndex,
      tokenIndex
    }))

    // 分片执行测试，每次最多并发执行的数量（可配置）
    const chunkSize = configData.testConcurrency || 3
    const allResults = []

    for (let i = 0; i < testTasks.length; i += chunkSize) {
      const chunk = testTasks.slice(i, i + chunkSize)

      // 执行当前分片的测试任务
      const chunkPromises = chunk.map((task) =>
        testConfiguration(task.name, task.configData, task.keyIndex, task.tokenIndex)
      )

      // 等待当前分片完成
      const chunkResults = await Promise.all(chunkPromises)
      allResults.push(...chunkResults)

      // 显示进度 - 每完成一个分片更新一次
      const completed = Math.min(i + chunkSize, testTasks.length)
      if (completed < testTasks.length) {
        // 清除spinner并显示进度
        process.stdout.write(`\r\u001b[K✓ 已完成 ${completed}/${testTasks.length} 个测试，继续下一批测试中... `)
        // 稍微停顿一下让用户看到进度
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
    }

    // 清除加载动画
    clearInterval(globalSpinner)
    process.stdout.write('\r\u001b[K') // 清除当前行

    // 整理并排序所有测试结果（与原test命令保持一致）
    const sortedResults = sortTestResults(allResults)

    // 使用简化显示
    await displaySimpleResults(sortedResults)

    // 显示测试完成
    console.log(chalk.green.bold(await t('test.TEST_COMPLETE')))

    // 清理测试临时文件
    await cleanupTestTempFiles()

    // 启动异步清理进程专门处理.claude.json中的所有临时项目记录
    // （包括当前测试产生的记录和历史遗留的记录）
    setTimeout(() => {
      cleanupAllTempProjects()
    }, 2000)

    return allResults
  } catch (error) {
    // 确保即使出错也清理临时文件
    await cleanupTestTempFiles()
    cleanupAllTempProjects()
    console.error(chalk.red(await t('test.TEST_FAILED')), error.message)
    process.exit(1)
  }
}

module.exports = testCommand
