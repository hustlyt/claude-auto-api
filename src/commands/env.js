const chalk = require('chalk')
const { validateConfig } = require('../utils/config')
const { readConfigFile } = require('../utils/file')
const { validateApiConfig, validateConfigName } = require('../utils/validator')
const { CLAUDE_ENV_KEYS, ERROR_MESSAGES } = require('../utils/constants')
const {
  setSystemEnvVars,
  clearSystemEnvVars,
  getCurrentConfigName,
  checkEnvStatus,
  CONFIG_IDENTIFIER
} = require('../utils/env')
const maxText = 30

/**
 * 显示当前环境变量状态
 */
async function displayEnvStatus() {
  try {
    const status = await checkEnvStatus()
    const currentConfig = getCurrentConfigName()

    if (currentConfig) {
      console.log(chalk.green.bold(`当前系统环境变量: ${currentConfig}`))
      console.log()
    }

    if (status.hasEnvVars) {
      // 按照CLAUDE_ENV_KEYS的顺序显示环境变量
      for (const [configKey, envKey] of Object.entries(CLAUDE_ENV_KEYS)) {
        if (status.envVars[envKey]) {
          let displayValue = status.envVars[envKey]

          // 对敏感信息进行脱敏处理
          if (configKey === 'key' || configKey === 'token') {
            displayValue = displayValue.length > maxText ? displayValue.slice(0, maxText) + '...' : displayValue
          }

          console.log(`  ${chalk.cyan(envKey)}: ${chalk.green(displayValue)}`)
        }
      }

      // 显示配置标识符
      if (status.envVars[CONFIG_IDENTIFIER]) {
        console.log(`  ${chalk.cyan(CONFIG_IDENTIFIER)}: ${chalk.green(status.envVars[CONFIG_IDENTIFIER])}`)
      }
    } else {
      console.log(chalk.yellow('当前配置未检测出环境变量'))
      console.log('使用', chalk.cyan('ccapi env <configName>'), '将配置设置到环境变量')
    }
  } catch (error) {
    console.error(chalk.red('获取当前配置环境变量失败:'), error.message)
  }
}

/**
 * 设置配置到环境变量
 */
async function setEnvFromConfig(configName, options = {}) {
  try {
    // 验证基础配置
    const config = await validateConfig()

    // 读取API配置文件
    const apiConfig = await readConfigFile(config.apiConfigPath)
    if (!validateApiConfig(apiConfig)) {
      console.error(chalk.red('错误:'), 'API配置文件格式不正确')
      return
    }

    // 验证配置名称是否存在
    if (!validateConfigName(apiConfig, configName)) {
      console.error(chalk.red('配置错误:'), `${ERROR_MESSAGES.CONFIG_NAME_NOT_FOUND}: ${configName}`)
      console.log(chalk.green('当前可用的配置:'), Object.keys(apiConfig).join(', '))
      return
    }

    const targetConfig = apiConfig[configName]

    // 处理数组配置，选择合适的索引
    const processedConfig = { ...targetConfig }

    // 根据选项处理数组字段（如果提供了索引选项）
    const indexOptions = ['url', 'key', 'token', 'model', 'fast']
    for (const field of indexOptions) {
      if (options[field] && Array.isArray(processedConfig[field])) {
        const index = parseInt(options[field]) - 1
        if (index >= 0 && index < processedConfig[field].length) {
          processedConfig[field] = processedConfig[field][index]
        } else {
          console.error(chalk.red('索引错误:'), `${field} 索引超出范围，可用范围: 1-${processedConfig[field].length}`)
          return
        }
      }
    }

    // 设置环境变量
    await setSystemEnvVars(processedConfig, configName)
  } catch (error) {
    if (error.message.includes('未设置') || error.message.includes('不存在')) {
      console.error(chalk.red('配置错误:'), error.message)
      console.log('请先使用', chalk.cyan('ccapi set'), '命令设置配置文件路径')
    } else {
      console.error(chalk.red('设置环境变量失败:'), error.message)
    }
    process.exit(1)
  }
}

/**
 * 清除环境变量
 */
async function clearEnvVars() {
  try {
    const status = await checkEnvStatus()

    if (!status.hasEnvVars && !status.currentConfig) {
      console.log(chalk.yellow('当前没有设置任何相关环境变量'))
      return
    }

    if (status.currentConfig) {
      console.log(chalk.yellow.bold(`将要清除当前配置${status.currentConfig}的环境变量: `))
      console.log()
    }

    // 列出将要清除的环境变量
    const envVarsToShow = Object.entries(status.envVars)
    for (const [key, value] of envVarsToShow) {
      let displayValue = value
      if (key.includes('API_KEY') || key.includes('AUTH_TOKEN')) {
        displayValue = displayValue.length > maxText ? displayValue.slice(0, maxText) + '...' : displayValue
      }
      console.log(`  ${chalk.cyan(key)}: ${chalk.green(displayValue)}`)
    }
    console.log()

    // 使用简单的readline确认操作
    const readline = require('readline')
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })

    const answer = await new Promise((resolve) => {
      rl.question(chalk.red('输入y确认清除: '), (answer) => {
        rl.close()
        resolve(answer.toLowerCase())
      })
    })

    console.log(answer)
    
    if (answer !== 'y') {
      return
    }

    // 执行清除
    await clearSystemEnvVars()
  } catch (error) {
    console.error(chalk.red.bold('清除环境变量失败:'), error.message)
    process.exit(1)
  }
}

/**
 * 环境变量命令入口
 */
async function envCommand(configName, options = {}) {
  try {
    // 如果没有提供配置名称，显示当前状态
    if (!configName) {
      await displayEnvStatus()
      return
    }

    // 如果是 clear 操作
    if (configName === 'clear') {
      await clearEnvVars()
      return
    }

    // 设置指定配置到环境变量
    await setEnvFromConfig(configName, options)
  } catch (error) {
    console.error(chalk.red.bold('环境变量命令执行失败:'), error.message)
    process.exit(1)
  }
}

module.exports = envCommand
