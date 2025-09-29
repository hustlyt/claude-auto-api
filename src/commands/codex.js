const chalk = require('chalk')
const os = require('os')
const path = require('path')
const toml = require('@iarna/toml')
const { fileExists, readFileContent, writeFileContent } = require('../utils/file')
const { t } = require('../utils/i18n')
const { execSync } = require('child_process')

/**
 * 读取codex配置文件
 */
async function readCodexConfig() {
  const configPath = path.join(os.homedir(), '.codex', 'config.toml')

  if (!(await fileExists(configPath))) {
    throw new Error(`Codex config file not found: ${configPath}`)
  }

  try {
    const content = await readFileContent(configPath)
    return toml.parse(content)
  } catch (error) {
    throw new Error(`Failed to parse codex config: ${error.message}`)
  }
}

/**
 * 写入codex配置文件
 */
async function writeCodexConfig(config) {
  const configPath = path.join(os.homedir(), '.codex', 'config.toml')

  try {
    const content = toml.stringify(config)
    await writeFileContent(configPath, content)
  } catch (error) {
    throw new Error(`Failed to write codex config: ${error.message}`)
  }
}

/**
 * 检查model_provider是否存在
 */
function checkModelProviderExists(config, providerName) {
  return config.model_providers && config.model_providers[providerName]
}

/**
 * 获取可用的model_providers列表
 */
function getAvailableProviders(config) {
  if (!config.model_providers) {
    return []
  }
  return Object.keys(config.model_providers)
}

/**
 * 设置API Key到auth.json文件中
 */
async function setAuthJsonApiKey(apiKey) {
  try {
    const authPath = path.join(os.homedir(), '.codex', 'auth.json')

    let authData = {}

    // 如果auth.json文件存在，先读取现有内容
    if (await fileExists(authPath)) {
      try {
        const content = await readFileContent(authPath)
        authData = JSON.parse(content)
      } catch (error) {
        console.warn(chalk.yellow('警告: 读取auth.json失败，将创建新的配置:'), error.message)
        authData = {}
      }
    }

    // 更新OPENAI_API_KEY字段
    authData.OPENAI_API_KEY = apiKey

    // 写回auth.json文件
    await writeFileContent(authPath, JSON.stringify(authData, null, 2))

  } catch (error) {
    console.warn(chalk.yellow('警告: 设置auth.json失败:'), error.message)
    console.log(chalk.yellow(`请手动在 ~/.codex/auth.json 中设置: {"OPENAI_API_KEY": "${apiKey}"}`))
  }
}

/**
 * codex命令处理函数
 */
async function codexCommand(providerName) {
  try {
    const configPath = path.join(os.homedir(), '.codex', 'config.toml')

    // 如果没有提供provider名称，显示当前配置和可用选项
    if (!providerName) {
      console.log(chalk.green('当前codex配置:'))
      console.log(`  配置文件: ${chalk.cyan(configPath)}`)

      try {
        const config = await readCodexConfig()
        const currentProvider = config.model_provider || '未设置'
        console.log(`  当前model_provider: ${chalk.yellow(currentProvider)}`)

        const availableProviders = getAvailableProviders(config)
        if (availableProviders.length > 0) {
          console.log(`  可用的model_providers: ${chalk.cyan(availableProviders.join(', '))}`)
        } else {
          console.log(`  ${chalk.yellow('未找到可用的model_providers配置')}`)
        }

        console.log()
        console.log('使用方法:')
        console.log(`  ${chalk.cyan('ccapi codex <provider_name>')} - 切换到指定的model_provider`)
        console.log(`  例如: ${chalk.cyan('ccapi codex 88code')}`)
      } catch (error) {
        console.error(chalk.red('读取codex配置失败:'), error.message)
      }
      return
    }

    // 读取现有配置
    const config = await readCodexConfig()

    // 检查指定的model_provider是否存在
    if (!checkModelProviderExists(config, providerName)) {
      const availableProviders = getAvailableProviders(config)
      console.error(chalk.red('错误:'), `model_provider "${providerName}" 不存在`)
      if (availableProviders.length > 0) {
        console.log(`可用的model_providers: ${chalk.cyan(availableProviders.join(', '))}`)
      } else {
        console.log(chalk.yellow('配置文件中未找到任何model_providers'))
      }
      return
    }

    // 检查是否已经是当前配置
    if (config.model_provider === providerName) {
      console.log(chalk.yellow(`当前已使用 "${providerName}" 配置`))
      return
    }

    // 更新model_provider
    config.model_provider = providerName
    await writeCodexConfig(config)

    // 获取并设置API Key到auth.json文件
    const providerConfig = config.model_providers[providerName]
    if (providerConfig && providerConfig.api_key) {
      await setAuthJsonApiKey(providerConfig.api_key)
      console.log(chalk.green('✓ codex配置切换成功'))
      console.log(`  model_provider: ${chalk.cyan(providerName)}`)
      console.log(`  API Key 已写入 ~/.codex/auth.json`)
      console.log(`  配置文件: ${chalk.cyan(configPath)}`)
    } else {
      console.log(chalk.green('✓ codex配置切换成功'))
      console.log(`  model_provider: ${chalk.cyan(providerName)}`)
      console.log(chalk.yellow(`  警告: ${providerName} 配置中未找到 api_key 字段`))
      console.log(`  配置文件: ${chalk.cyan(configPath)}`)
    }

  } catch (error) {
    console.error(chalk.red('codex配置切换失败:'), error.message)
    process.exit(1)
  }
}

module.exports = codexCommand