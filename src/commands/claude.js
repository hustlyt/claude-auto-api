const chalk = require('chalk')
const { validateConfig, readConfig } = require('../utils/config')
const { readConfigFile, writeConfigFile, backupFile } = require('../utils/file')
const { validateApiConfig, validateSettingsConfig, validateConfigName } = require('../utils/validator')
const { CLAUDE_ENV_KEYS, ERROR_MESSAGES, SUCCESS_MESSAGES } = require('../utils/constants')
const { setSystemEnvVars } = require('../utils/env')
const { t } = require('../utils/i18n')

const maxText = 30

/**
 * 获取当前使用的配置名称和各字段索引信息
 */
function getCurrentConfigInfo(settingsData, apiConfig) {
  const currentUrl = settingsData.env?.[CLAUDE_ENV_KEYS.url]
  const currentKey = settingsData.env?.[CLAUDE_ENV_KEYS.key]
  const currentToken = settingsData.env?.[CLAUDE_ENV_KEYS.token]
  const currentModel = settingsData.env?.[CLAUDE_ENV_KEYS.model]
  const currentFast = settingsData.env?.[CLAUDE_ENV_KEYS.fast]

  // 优先基于 key/token 匹配，如果都没有则基于 URL 匹配
  const matchField = currentKey || currentToken
  if (!matchField && !currentUrl) {
    return {
      name: null,
      urlIndex: -1,
      keyIndex: -1,
      tokenIndex: -1,
      modelIndex: -1,
      fastIndex: -1
    }
  }

  // 查找匹配的配置
  for (const [name, config] of Object.entries(apiConfig)) {
    let isMatch = false

    // 检查 key 匹配
    if (currentKey) {
      if (Array.isArray(config.key)) {
        if (config.key.includes(currentKey)) isMatch = true
      } else if (config.key === currentKey) {
        isMatch = true
      }
    }

    // 检查 token 匹配
    if (currentToken && !isMatch) {
      if (Array.isArray(config.token)) {
        if (config.token.includes(currentToken)) isMatch = true
      } else if (config.token === currentToken) {
        isMatch = true
      }
    }

    // 如果没有 key/token，则基于 URL 匹配（兼容旧逻辑）
    if (!currentKey && !currentToken && currentUrl) {
      if (Array.isArray(config.url)) {
        if (config.url.includes(currentUrl)) isMatch = true
      } else if (config.url === currentUrl) {
        isMatch = true
      }
    }

    if (isMatch) {
      let urlIndex = -1
      let keyIndex = -1
      let tokenIndex = -1
      let modelIndex = -1
      let fastIndex = -1

      // 查找当前使用的 URL 索引
      if (currentUrl) {
        if (Array.isArray(config.url)) {
          urlIndex = config.url.indexOf(currentUrl)
        } else if (config.url === currentUrl) {
          urlIndex = 0 // 字符串情况下默认为0
        }
      }

      // 查找当前使用的 key 索引
      if (currentKey) {
        if (Array.isArray(config.key)) {
          keyIndex = config.key.indexOf(currentKey)
        } else if (config.key === currentKey) {
          keyIndex = 0 // 字符串情况下默认为0
        }
      }

      // 查找当前使用的 token 索引
      if (currentToken) {
        if (Array.isArray(config.token)) {
          tokenIndex = config.token.indexOf(currentToken)
        } else if (config.token === currentToken) {
          tokenIndex = 0 // 字符串情况下默认为0
        }
      }

      // 查找当前使用的模型索引
      if (currentModel) {
        if (Array.isArray(config.model)) {
          modelIndex = config.model.indexOf(currentModel)
        } else if (config.model === currentModel) {
          modelIndex = 0 // 字符串情况下默认为0
        }
      }

      // 查找当前使用的快速模型索引
      if (currentFast) {
        if (Array.isArray(config.fast)) {
          fastIndex = config.fast.indexOf(currentFast)
        } else if (config.fast === currentFast) {
          fastIndex = 0 // 字符串情况下默认为0
        }
      }

      return { name, urlIndex, keyIndex, tokenIndex, modelIndex, fastIndex }
    }
  }

  return {
    name: null,
    urlIndex: -1,
    keyIndex: -1,
    tokenIndex: -1,
    modelIndex: -1,
    fastIndex: -1
  }
}

/**
 * 格式化字段显示（支持 URL、Key、Token、Model、Fast）
 */
async function formatFieldDisplay(fieldValue, currentIndex, label, isMasked = false) {
  // 获取本地化标签
  const localizedLabel = await t(`list.${label}`) || label

  if (Array.isArray(fieldValue)) {
    const lines = [`${localizedLabel}:`]
    fieldValue.forEach((value, index) => {
      const isCurrentValue = index === currentIndex
      const prefix = isCurrentValue ? '    * - ' : '      - '

      // 处理敏感信息脱敏
      let displayValue = value
      if (isMasked && value && value.length > maxText) {
        displayValue = value.slice(0, maxText) + '...'
      }

      const valueDisplay = isCurrentValue ? chalk.green.bold(displayValue) : chalk.cyan(displayValue)
      const text = `${prefix}${index + 1}: ${valueDisplay}`
      lines.push(isCurrentValue ? chalk.green.bold(text) : text)
    })
    return lines
  } else {
    // 字符串情况，保持原样
    let displayValue = fieldValue
    if (isMasked && fieldValue && fieldValue.length > maxText) {
      displayValue = fieldValue.slice(0, maxText) + '...'
    }

    const valueDisplay = currentIndex === 0 ? chalk.green.bold(displayValue) : chalk.cyan(displayValue)
    return [`${localizedLabel}: ${valueDisplay}`]
  }
}

/**
 * 格式化配置显示
 */
async function formatConfigDisplay(name, config, currentInfo) {
  const isCurrent = name === currentInfo.name
  const prefix = isCurrent ? chalk.green.bold('*') : '  '
  const nameDisplay = isCurrent ? chalk.green.bold(`[${name}]`) : chalk.cyan(`[${name}]`)

  // 设置默认值
  config.model = config.model || 'claude-sonnet-4-20250514'
  // config.fast = config.fast || 'claude-3-5-haiku-20241022';

  let details = []

  // 格式化 URL 显示
  const urlLines = await formatFieldDisplay(config.url, isCurrent ? currentInfo.urlIndex : -1, 'URL')
  details.push(...urlLines)

  // 格式化模型显示
  const modelLines = await formatFieldDisplay(config.model, isCurrent ? currentInfo.modelIndex : -1, 'Model')
  details.push(...modelLines)

  // 格式化快速模型显示
  if (config.fast) {
    const fastLines = await formatFieldDisplay(config.fast, isCurrent ? currentInfo.fastIndex : -1, 'Fast')
    details.push(...fastLines)
  }

  // 格式化 Key 显示
  if (config.key) {
    const keyLines = await formatFieldDisplay(
      config.key,
      isCurrent ? currentInfo.keyIndex : -1,
      'Key',
      true // 需要脱敏
    )
    details.push(...keyLines)
  }

  // 格式化 Token 显示
  if (config.token) {
    const tokenLines = await formatFieldDisplay(
      config.token,
      isCurrent ? currentInfo.tokenIndex : -1,
      'Token',
      true // 需要脱敏
    )
    details.push(...tokenLines)
  }

  if (config.http) {
    details.push(`HTTP: ${chalk.cyan(config.http)}`)
  }

  if (config.https) {
    details.push(`HTTPS: ${chalk.cyan(config.https)}`)
  }

  console.log(`${prefix}${nameDisplay}`)
  details.forEach((detail) => {
    console.log(`    ${detail}`)
  })
}

/**
 * 列举配置命令
 */
async function listConfigs() {
  try {
    // 验证配置
    const config = await validateConfig()

    // 读取API配置文件
    const apiConfig = await readConfigFile(config.apiConfigPath)
    if (!validateApiConfig(apiConfig)) {
      console.error(chalk.red(await t('common.PARAMETER_ERROR')), await t('listDisplay.API_FORMAT_ERROR'))
      return
    }

    // 读取settings.json文件
    const settingsData = await readConfigFile(config.settingsPath)
    if (!validateSettingsConfig(settingsData)) {
      console.error(chalk.red(await t('common.PARAMETER_ERROR')), await t('listDisplay.SETTINGS_FORMAT_ERROR'))
      return
    }

    // 获取当前使用的配置信息
    const currentConfigInfo = getCurrentConfigInfo(settingsData, apiConfig)

    // 显示配置列表
    console.log(chalk.green.bold(await t('listDisplay.AVAILABLE_API_CONFIGS')))

    const configNames = Object.keys(apiConfig)
    if (configNames.length === 0) {
      console.log(chalk.yellow(await t('listDisplay.NO_CONFIGS_AVAILABLE')))
      return
    }

    // 按名称排序显示
    for (const name of configNames.sort()) {
      await formatConfigDisplay(name, apiConfig[name], currentConfigInfo)
      console.log() // 空行分隔
    }

    // 显示当前状态
    if (currentConfigInfo.name) {
      console.log(chalk.green.bold(await t('listDisplay.CURRENT_CONFIG', currentConfigInfo.name)))
    } else {
      console.log(chalk.yellow(await t('listDisplay.NO_CURRENT_CONFIG')))
    }
  } catch (error) {
    const no = error.message.includes('未设置') || error.message.includes('不存在') || error.message.includes('Not set')
    if (no) {
      console.error(chalk.red(await t('common.CONFIG_ERROR')), error.message)
      console.log(await t('listDisplay.USE_SET_CMD', chalk.cyan('ccapi set')))
    } else {
      console.error(chalk.red(await t('listDisplay.LIST_FAILED')), error.message)
    }
    process.exit(1)
  }
}

/**
 * 检查是否为当前配置
 */
function isCurrentConfig(settingsData, targetConfig) {
  const env = settingsData.env || {}

  return env[CLAUDE_ENV_KEYS.url] === targetConfig.url && env[CLAUDE_ENV_KEYS.model] === targetConfig.model
}

/**
 * 更新settings.json中的环境变量
 */
function updateSettingsEnv(settingsData, targetConfig) {
  // 确保env对象存在
  if (!settingsData.env) {
    settingsData.env = {}
  }

  const env = settingsData.env

  // 更新URL（必需）
  env[CLAUDE_ENV_KEYS.url] = targetConfig.url

  // 更新Model（可选）
  env[CLAUDE_ENV_KEYS.model] = targetConfig.model

  // 轻量模型（可选）
  if (targetConfig.fast) {
    env[CLAUDE_ENV_KEYS.fast] = targetConfig.fast
  } else {
    delete env[CLAUDE_ENV_KEYS.fast]
  }

  // API请求超时时间（可选）
  if (targetConfig.timeout) {
    env[CLAUDE_ENV_KEYS.timeout] = targetConfig.timeout
  } else {
    delete env[CLAUDE_ENV_KEYS.timeout]
  }

  if (targetConfig.tokens) {
    env[CLAUDE_ENV_KEYS.tokens] = targetConfig.tokens
  } else {
    delete env[CLAUDE_ENV_KEYS.tokens]
  }

  if (targetConfig.key && targetConfig.token) {
    env[CLAUDE_ENV_KEYS.key] = targetConfig.key
    env[CLAUDE_ENV_KEYS.token] = targetConfig.token
  } else {
    // 更新Key（如果有值）
    if (targetConfig.key) {
      env[CLAUDE_ENV_KEYS.key] = targetConfig.key
      delete env[CLAUDE_ENV_KEYS.token]
    }

    // 更新Token（如果有值）
    if (targetConfig.token) {
      env[CLAUDE_ENV_KEYS.token] = targetConfig.token
      delete env[CLAUDE_ENV_KEYS.key]
    }
  }

  if (targetConfig.http) {
    // HTTP代理（可选）
    env[CLAUDE_ENV_KEYS.http] = targetConfig.http
  } else {
    delete env[CLAUDE_ENV_KEYS.http]
  }
  if (targetConfig.https) {
    // HTTPS代理（可选）
    env[CLAUDE_ENV_KEYS.https] = targetConfig.https
  } else {
    delete env[CLAUDE_ENV_KEYS.https]
  }
  return settingsData
}

/**
 * 解析和选择字段值（支持 URL、Key、Token、Model、Fast）
 */
async function selectFieldValue(fieldValue, selectedIndex, defaultValue) {
  if (Array.isArray(fieldValue)) {
    // 数组情况：选择指定索引的值，默认为第一个
    const index = selectedIndex > 0 ? selectedIndex - 1 : 0
    if (index >= fieldValue.length) {
      throw new Error(await t('common.INDEX_OUT_OF_RANGE', selectedIndex, `1-${fieldValue.length}`))
    }
    return fieldValue[index]
  } else {
    // 字符串情况：直接返回，忽略索引参数
    return fieldValue || defaultValue
  }
}

/**
 * 使用指定配置命令
 */
async function claudeCommand(provider) {
  try {
    // 如果没有提供provider名称，显示当前配置和可用选项
    if (!provider) {
      console.log(chalk.green('当前claude配置:'))

      try {
        // 验证配置
        const config = await validateConfig()

        // 读取API配置文件
        const apiConfig = await readConfigFile(config.apiConfigPath)
        if (!validateApiConfig(apiConfig)) {
          console.error(chalk.red(await t('common.PARAMETER_ERROR')), await t('claude.API_FORMAT_ERROR'))
          return
        }

        // 显示当前配置
        console.log(`  配置文件: ${chalk.cyan(config.apiConfigPath)}`)

        // 读取settings.json文件获取当前激活的配置
        const settingsData = await readConfigFile(config.settingsPath)
        if (validateSettingsConfig(settingsData)) {
          const currentConfigInfo = getCurrentConfigInfo(settingsData, apiConfig)
          const currentProvider = currentConfigInfo.name || '未设置'
          console.log(`  当前provider: ${chalk.yellow(currentProvider)}`)
        } else {
          console.log(`  当前provider: ${chalk.yellow('未设置')}`)
        }

        // 获取可用的配置列表
        const availableProviders = Object.keys(apiConfig)
        if (availableProviders.length > 0) {
          console.log(`  可用的providers: ${chalk.cyan(availableProviders.join(', '))}`)
        } else {
          console.log(`  ${chalk.yellow('未找到可用的provider配置')}`)
        }

        console.log()
        console.log('使用方法:')
        console.log(`  ${chalk.cyan('ccapi claude <provider_name>')} - 切换到指定的provider`)
        console.log(`  例如: ${chalk.cyan('ccapi claude default')}`)

      } catch (error) {
        console.error(chalk.red('读取claude配置失败:'), error.message)
      }
      return
    }

    // 验证配置
    const config = await validateConfig()

    // 读取API配置文件
    const apiConfig = await readConfigFile(config.apiConfigPath)
    if (!validateApiConfig(apiConfig)) {
      console.error(chalk.red(await t('common.PARAMETER_ERROR')), await t('claude.API_FORMAT_ERROR'))
      return
    }

    // 验证配置名称是否存在
    if (!validateConfigName(apiConfig, provider)) {
      console.error(chalk.red(await t('common.CONFIG_ERROR')), `${await t(ERROR_MESSAGES.CONFIG_NAME_NOT_FOUND)}: ${provider}`)
      console.log(chalk.green(await t('common.AVAILABLE_CONFIGS')), Object.keys(apiConfig).join(', '))
      return
    }

    // 读取settings.json文件
    const settingsData = await readConfigFile(config.settingsPath)
    if (!validateSettingsConfig(settingsData)) {
      console.error(chalk.red(await t('common.PARAMETER_ERROR')), await t('claude.SETTINGS_FORMAT_ERROR'))
      return
    }

    const originalConfig = apiConfig[provider]

    // 创建配置副本用于修改
    const targetConfig = { ...originalConfig }

    // 设置默认值
    targetConfig.model = targetConfig.model || 'claude-sonnet-4-20250514'

    // 备份settings.json
    const backupPath = await backupFile(config.settingsPath)
    console.log(await t(SUCCESS_MESSAGES.BACKUP_CREATED), `(${backupPath})`)

    // 更新配置
    console.log(await t('claude.SWITCHING_CONFIG', provider))
    const updatedSettings = updateSettingsEnv(settingsData, targetConfig)

    // 保存更新后的settings.json
    await writeConfigFile(config.settingsPath, updatedSettings)

    // 同步设置到系统环境变量
    let success = false
    const configData = await readConfig()
    const updateEnv = configData.useNoEnv !== void 0 ? configData.useNoEnv : true
    if (updateEnv) {
      try {
        success = await setSystemEnvVars(targetConfig, provider, false)
      } catch (error) {
        console.log(chalk.red(await t('claude.SETTINGS_SUCCESS_ENV_FAILED')))
      }
    }

    // 显示成功信息
    console.log()
    console.log(
      chalk.green.bold(await t(SUCCESS_MESSAGES.CONFIG_SWITCHED)) + chalk.yellow.bold(await t(SUCCESS_MESSAGES.RESTART_TERMINAL))
    )
    if (success) {
      console.log(chalk.cyan(await t('claude.CONFIG_SYNCED')))
    }
    console.log()
    console.log(chalk.green.bold(await t('claude.CURRENT_CONFIG_DETAILS')))
    console.log(await t('claude.NAME_LABEL', chalk.cyan(provider)))
    console.log(await t('claude.URL_LABEL', chalk.cyan(targetConfig.url)))

    // 显示选中的模型信息
    console.log(await t('claude.MODEL_LABEL', chalk.cyan(targetConfig.model)))

    if (targetConfig.fast) {
      console.log(await t('claude.FAST_LABEL', chalk.cyan(targetConfig.fast)))
    }

    if (targetConfig.key) {
      const maskedKey = targetConfig.key.length > 25 ? targetConfig.key.slice(0, 25) + '...' : targetConfig.key
      console.log(await t('claude.KEY_LABEL', chalk.cyan(maskedKey)))
    }
    if (targetConfig.token) {
      const maskedToken = targetConfig.token.length > 25 ? targetConfig.token.slice(0, 25) + '...' : targetConfig.token
      console.log(await t('claude.TOKEN_LABEL', chalk.cyan(maskedToken)))
    }
    if (targetConfig.http) {
      console.log(await t('claude.HTTP_LABEL', chalk.cyan(targetConfig.http)))
    }
    if (targetConfig.https) {
      console.log(await t('claude.HTTPS_LABEL', chalk.cyan(targetConfig.https)))
    }
    console.log()
  } catch (error) {
    const no = error.message.includes('未设置') || error.message.includes('不存在') || error.message.includes('Not set')
    if (no) {
      console.error(chalk.red(await t('common.CONFIG_ERROR')), error.message)
      console.log(await t('claude.USE_SET_CMD', chalk.cyan('ccapi set')))
    } else {
      console.error(chalk.red(await t('claude.SWITCH_CONFIG_FAILED')), error.message)
    }
    process.exit(1)
  }
}

module.exports = claudeCommand
