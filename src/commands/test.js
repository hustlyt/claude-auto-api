const chalk = require('chalk')
const { validateConfig } = require('../utils/config')
const { readConfigFile } = require('../utils/file')
const { validateApiConfig } = require('../utils/validator')
const { readConfig } = require('../utils/config')
const { execSync } = require('child_process')
const os = require('os')
const fs = require('fs')
const path = require('path')

let configData
let testTempDirs = [] // 存储所有测试临时目录，用于清理
const maxText = 50

/**
 * 创建测试用的临时目录和独立的Claude配置
 */
function createTestTempDir(url, key, token, model) {
  const tmpDir = os.tmpdir()
  const randomSuffix = Math.random().toString(36).substring(2, 15)
  const tempDir = path.join(tmpDir, `ccapi-test-${randomSuffix}`)

  // 记录临时目录用于清理
  testTempDirs.push(tempDir)

  // 创建目录结构
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true })
  }

  // 创建 .claude 配置目录
  const claudeConfigDir = path.join(tempDir, '.claude')
  if (!fs.existsSync(claudeConfigDir)) {
    fs.mkdirSync(claudeConfigDir, { recursive: true })
  }

  // 创建独立的配置文件，包含当前测试的API信息
  const settingsPath = path.join(claudeConfigDir, 'settings.json')
  const testSettings = {
    cleanupPeriodDays: 180,
    env: {
      ANTHROPIC_BASE_URL: url,
      ANTHROPIC_MODEL: model || 'claude-3-5-haiku-20241022',
      ANTHROPIC_SMALL_FAST_MODEL: 'claude-3-5-haiku-20241022'
    },
    includeCoAuthoredBy: false,
    permissions: {
      allow: [
        // 只允许测试必需的最基本工具
        'Read'
      ],
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

  // 写入配置文件
  fs.writeFileSync(settingsPath, JSON.stringify(testSettings, null, 2))

  // 创建空的 .claude.json 项目配置
  const projectConfigPath = path.join(tempDir, '.claude.json')
  const projectConfig = {
    projects: {
      [tempDir]: {
        allowedTools: [],
        history: [],
        mcpContextUris: [],
        mcpServers: {},
        enabledMcpjsonServers: [],
        disabledMcpjsonServers: [],
        hasTrustDialogAccepted: true,
        projectOnboardingSeenCount: 0,
        hasClaudeMdExternalIncludesApproved: false,
        hasClaudeMdExternalIncludesWarningShown: false
      }
    }
  }
  fs.writeFileSync(projectConfigPath, JSON.stringify(projectConfig, null, 2))

  return tempDir
}

/**
 * 清理测试临时目录（仅清理文件系统目录，不处理.claude.json）
 */
async function cleanupTestTempDir() {
  if (testTempDirs.length === 0) return

  // 稍微延迟，确保Claude Code SDK完成所有操作
  await new Promise(resolve => setTimeout(resolve, 1000))

  // 仅清理临时目录，不处理.claude.json（避免与异步清理重复）
  testTempDirs.forEach((tempDir) => {
    if (tempDir && fs.existsSync(tempDir)) {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true })
      } catch (error) {
        // console.warn(chalk.yellow(`警告: 无法删除临时目录 ${tempDir}: ${error.message}`))
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
 * 动态获取 Claude 可执行文件路径
 */
function getClaudeExecutablePath() {
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

    // Windows特殊处理：如果找到的是shell脚本，尝试找到实际的CLI文件
    if (isWindows && finalPath && fs.existsSync(finalPath)) {
      try {
        // 读取shell脚本内容，寻找实际的CLI路径
        const scriptContent = fs.readFileSync(finalPath, 'utf8')
        const match = scriptContent.match(/node_modules\/@anthropic-ai\/claude-code\/cli\.js/)

        if (match) {
          // 构建CLI文件的完整路径
          const basedir = path.dirname(finalPath)
          const cliPath = path.join(basedir, 'node_modules/@anthropic-ai/claude-code/cli.js')

          if (fs.existsSync(cliPath)) {
            // console.log(`找到Claude CLI文件: ${cliPath}`)
            return cliPath
          }
        }
      } catch (error) {
        console.log('获取Claude可执行文件路径失败:', error.message)
      }
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
    console.log('获取Claude可执行文件路径失败:', error.message)
    return null
  }
}

/**
 * 使用@anthropic-ai/claude-code库测试单个API配置的有效性
 */
async function testApiLatency(url, key, token, model = 'claude-3-5-haiku-20241022') {
  let latency
  const startTime = Date.now()

  try {
    // 动态获取 Claude 可执行文件路径
    const claudeExecutablePath = getClaudeExecutablePath()
    // console.log('claudeExecutablePath', claudeExecutablePath)

    if (!claudeExecutablePath) {
      throw new Error('Claude 可执行文件未找到，请确保已安装 Claude Code')
    }

    // 创建测试专用的临时工作目录，包含独立的Claude配置
    const tempDir = createTestTempDir(url, key, token, model)

    // 动态导入ESM模块
    const { query } = await import('@anthropic-ai/claude-code')

    const abortController = new AbortController()

    // 设置超时
    const timeout = configData.testTimeout || 60000
    const timeoutId = setTimeout(() => {
      abortController.abort()
    }, timeout)

    // 简化的queryOptions，完全依赖临时目录中的配置
    let queryOptions = {
      cwd: tempDir, // 使用包含独立配置的临时目录作为工作目录
      model: 'claude-3-5-haiku-20241022',
      fallbackModel: model,
      abortController,
      pathToClaudeCodeExecutable: claudeExecutablePath,
      executable: 'node',
      maxTurns: 1, // 限制为单轮对话以加快测试
      permissionMode: 'bypassPermissions' // 绕过权限检查以加快测试
    }

    let responseText = ''
    let hasResponse = false
    let success = false

    const queryIterator = query({
      prompt: 'please respond one word: Success',
      options: queryOptions
    })

    // console.log('开始请求', queryIterator);

    for await (const message of queryIterator) {
      // console.log('msg', message)
      // 处理首个消息
      if (message.type === 'result') {
        // console.log('msg', message)
        if (!hasResponse) {
          success = !message.is_error && message.subtype === 'success'
          hasResponse = true
          const endTime = Date.now()
          latency = endTime - startTime
          responseText = message.result?.replace(/\n/g, '') || 'Error'
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
      response: responseText.length > maxText ? responseText.slice(0, maxText) + '...' : responseText || 'Success',
      error: null
    }
  } catch (error) {
    // console.log('1111, error', error)
    let success = false
    let message = '请求失败'

    // 如果是AbortError且已经有延迟数据，说明是收到响应后手动中断，应该算成功
    if (error.name === 'AbortError' && latency && latency !== 'error' && typeof latency === 'number') {
      message = 'Success'
      success = true
    }
    // 如果是AbortError但没有延迟数据，说明是超时中断，算失败
    else if (error.name === 'AbortError' || error.message.includes('aborted')) {
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
 * 测试单个配置的所有URL
 */
async function testConfigurationSerial(configName, config, keyIndex = 0, tokenIndex = 0) {
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
          error: '缺少认证信息 (key 或 token)'
        }
      ]
    }
  }

  // 选择指定的key或token
  const selectedAuthIndex = keyIndex || tokenIndex || 0
  const selectedAuth = authItems[Math.min(selectedAuthIndex, authItems.length - 1)]

  // 创建并行测试任务
  const testPromises = urls.map((url, i) => {
    const model = Array.isArray(config.model) ? config.model[0] : config.model || 'claude-3-5-haiku-20241022'

    return testApiLatency(url, keys.length > 0 ? selectedAuth : null, tokens.length > 0 ? selectedAuth : null, model)
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
    console.log(chalk.cyan.bold(`[${configResult.configName}]`) + chalk.cyan.bold(`(最优路线: ${bestText})`))

    configResult.results.forEach((result, index) => {
      const status =
        result.success && result.latency !== 'error' ? `✅ ${chalk.green.bold('有效')}` : `❌ ${chalk.red.bold('无效')}`
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
  })

  console.log()
}

/**
 * 并行测试所有API配置的主函数
 */
async function testCommand(configName = null, keyIndex = 0, tokenIndex = 0) {
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
    console.log(chalk.green.bold(`正在测试${totalConfigs}个配置在Claude Code中的有效性(时间可能稍长,请耐心等待)...`))

    // 显示全局加载动画
    const globalSpinner = showSpinner()

    // 创建所有配置的并行测试任务
    const testPromises = Object.entries(configsToTest).map(([name, configData]) =>
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
    console.log(chalk.green.bold(`有效性测试完成, 此结果代表能否在Claude Code中使用!`))

    // 清理测试临时目录
    await cleanupTestTempDir()
    
    // 启动异步清理进程专门处理.claude.json中的所有临时项目记录
    // （包括当前测试产生的记录和历史遗留的记录）
    setTimeout(() => {
      const { cleanupAllTempProjects } = require('../utils/cleanup')
      cleanupAllTempProjects()
    }, 2000)

    return allResults
  } catch (error) {
    // 确保即使出错也清理临时目录
    await cleanupTestTempDir()
    console.error(chalk.red('有效性测试失败:'), error.message)
    process.exit(1)
  }
}

module.exports = testCommand
