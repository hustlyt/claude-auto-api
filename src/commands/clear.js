const chalk = require('chalk')
const readline = require('readline')
const { validateConfig } = require('../utils/config')
const { readConfigFile, writeConfigFile, backupFile } = require('../utils/file')
const { validateSettingsConfig } = require('../utils/validator')
const { CLAUDE_ENV_KEYS, SUCCESS_MESSAGES } = require('../utils/constants')
const { 
  clearSystemEnvVars, 
  checkEnvStatus, 
  getCurrentConfigName 
} = require('../utils/env')
const maxText = 30

/**
 * 清除settings.json中的配置字段
 */
function clearSettingsConfig(settingsData) {
  if (!settingsData.env) {
    return settingsData
  }

  // 清除所有相关的环境变量配置
  const envKeys = Object.values(CLAUDE_ENV_KEYS)
  for (const key of envKeys) {
    delete settingsData.env[key]
  }

  return settingsData
}

/**
 * 获取用户确认
 */
async function getUserConfirmation(message, confirmText = 'y') {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  return new Promise((resolve) => {
    rl.question(chalk.red(`${message} (输入${confirmText}确认): `), (answer) => {
      rl.close()
      resolve(answer.toLowerCase() === confirmText.toLowerCase())
    })
  })
}

/**
 * 显示将要清除的内容预览
 */
async function showClearPreview() {
  try {
    const status = await checkEnvStatus()
    const currentConfig = getCurrentConfigName()

    console.log(chalk.blue.bold('准备清除以下内容:'))
    console.log()

    // 显示settings.json中的配置
    try {
      const config = await validateConfig()
      const settingsData = await readConfigFile(config.settingsPath)
      
      if (settingsData.env && Object.keys(settingsData.env).length > 0) {
        console.log(chalk.yellow.bold('settings.json 中的环境变量配置:'))
        for (const [key, value] of Object.entries(settingsData.env)) {
          if (Object.values(CLAUDE_ENV_KEYS).includes(key)) {
            let displayValue = value
            if (key.includes('API_KEY') || key.includes('AUTH_TOKEN')) {
              displayValue = displayValue.length > maxText ? displayValue.slice(0, maxText) + '...' : displayValue
            }
            console.log(`  ${chalk.cyan(key)}: ${chalk.green(displayValue)}`)
          }
        }
        console.log()
      } else {
        console.log(chalk.dim('settings.json 中未检测到相关配置'))
        console.log()
      }
    } catch (error) {
      console.log(chalk.yellow('警告: 无法读取 settings.json 文件'))
      console.log()
    }

    // 显示系统环境变量
    if (status.hasEnvVars || currentConfig) {
      console.log(chalk.yellow.bold('系统环境变量:'))
      
      for (const [key, value] of Object.entries(status.envVars)) {
        if (key !== 'CCAPI_CURRENT_CONFIG') {
          let displayValue = value
          if (key.includes('API_KEY') || key.includes('AUTH_TOKEN')) {
            displayValue = displayValue.length > maxText ? displayValue.slice(0, maxText) + '...' : displayValue
          }
          console.log(`  ${chalk.cyan(key)}: ${chalk.green(displayValue)}`)
        }
      }
      console.log()
    } else {
      console.log(chalk.dim('系统环境变量中未检测到相关配置'))
      console.log()
    }

    return status.hasEnvVars || currentConfig || false
  } catch (error) {
    console.error(chalk.red('获取清除预览失败:'), error.message)
    return false
  }
}

/**
 * 全量清理命令
 */
async function clearCommand() {
  try {
    // 显示将要清除的内容
    const hasContent = await showClearPreview()

    if (!hasContent) {
      // 检查settings.json
      let hasSettingsConfig = false
      try {
        const config = await validateConfig()
        const settingsData = await readConfigFile(config.settingsPath)
        if (settingsData.env && Object.keys(settingsData.env).length > 0) {
          hasSettingsConfig = Object.values(CLAUDE_ENV_KEYS).some(key => settingsData.env[key])
        }
      } catch (error) {
        // 忽略错误，继续检查
      }

      if (!hasSettingsConfig) {
        console.log(chalk.green('未检测到任何需要清除的配置'))
        return
      }
    }

    console.log(chalk.red.bold('⚠️ 警告: 此操作将完全清除所有相关配置'))
    console.log(chalk.red('  • 清除 settings.json 中的环境变量配置'))
    console.log(chalk.red('  • 清除系统中的相关环境变量'))
    console.log()

    // 第一次确认
    const firstConfirm = await getUserConfirmation('确认要执行完全清理操作吗？', 'y')
    if (!firstConfirm) {
      return
    }

    console.log()
    
    let settingsCleared = false
    let envCleared = false

    // 清理 settings.json
    try {
      const config = await validateConfig()
      const settingsData = await readConfigFile(config.settingsPath)
      
      if (validateSettingsConfig(settingsData)) {
        // 备份 settings.json
        const backupPath = await backupFile(config.settingsPath)
        console.log(`settings.json 已备份到: ${backupPath}`)

        // 清理配置
        const clearedSettings = clearSettingsConfig(settingsData)
        await writeConfigFile(config.settingsPath, clearedSettings)
        
        console.log(chalk.green.bold('✓ settings.json 配置已清除'))
        settingsCleared = true
      }
    } catch (error) {
      console.log(chalk.yellow('警告: settings.json 清理失败'), error.message)
    }

    // 清理系统环境变量
    try {
      envCleared = await clearSystemEnvVars()
    } catch (error) {

    }

  } catch (error) {
    console.error(chalk.red('清理命令执行失败:'), error.message)
    process.exit(1)
  }
}

module.exports = clearCommand
