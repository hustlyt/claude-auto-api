const chalk = require('chalk')
const { validateSetCommand } = require('../utils/validator')
const { setSettingsPath, setApiConfigPath, getSettingsPath, getApiConfigPath } = require('../utils/config')
const { fileExists } = require('../utils/file')
const { SUCCESS_MESSAGES } = require('../constants')

/**
 * 设置配置文件路径命令
 */
async function setCommand(options) {
  try {
    const { settings, api } = options
    // 如果没有提供任何参数，显示当前配置路径
    if (!settings && !api) {
      console.log(chalk.green('当前配置路径:'))

      try {
        const currentSettingsPath = await getSettingsPath()
        const currentApiPath = await getApiConfigPath()

        if (currentSettingsPath) {
          const settingsExists = await fileExists(currentSettingsPath)
          const statusIcon = settingsExists ? chalk.green('✓') : chalk.red('✗')
          console.log(`  settings.json: ${statusIcon} ${chalk.cyan(currentSettingsPath)}`)
          if (!settingsExists) {
            console.log(`    ${chalk.yellow('警告: 当前路径文件不存在')}`)
          }
        } else {
          console.log(`  settings.json: ${chalk.yellow('未设置')}`)
        }

        if (currentApiPath) {
          const apiExists = await fileExists(currentApiPath)
          const statusIcon = apiExists ? chalk.green('✓') : chalk.red('✗')
          console.log(`  api.json: ${statusIcon} ${chalk.cyan(currentApiPath)}`)
          if (!apiExists) {
            console.log(`    ${chalk.yellow('警告: 当前路径文件不存在')}`)
          }
        } else {
          console.log(`  api.json: ${chalk.yellow('未设置')}`)
        }

        console.log()
        console.log('使用以下命令设置路径:')
        console.log(`  ${chalk.cyan('ccapi set --settings <path>')} - 设置 settings.json 路径`)
        console.log(`  ${chalk.cyan('ccapi set --api <path>')} - 设置 api.json 路径`)
      } catch (error) {
        console.error(chalk.red('读取配置失败:'), error.message)
      }
      return
    }

    // 验证命令参数
    const validation = validateSetCommand(options)
    if (!validation.valid) {
      console.error(chalk.red('参数错误:'), validation.error)
      return
    }

    const results = []

    // 设置settings.json路径
    if (settings) {
      // 检查文件是否存在
      if (!(await fileExists(settings))) {
        console.warn(chalk.yellow('警告:'), `settings.json文件不存在: ${settings}`)
        console.log('路径已保存，请确保文件存在后再使用其他命令')
      }

      await setSettingsPath(settings)
      results.push(`settings.json 路径: ${chalk.green(settings)}`)
    }

    // 设置api.json路径
    if (api) {
      // 检查文件是否存在
      if (!(await fileExists(api))) {
        console.warn(chalk.yellow('警告:'), `api.json文件不存在: ${api}`)
        console.log('路径已保存，请确保文件存在后再使用其他命令')
      }

      await setApiConfigPath(api)
      results.push(`api.json 路径: ${chalk.green(api)}`)
    }

    // 显示结果
    console.log(chalk.blue(SUCCESS_MESSAGES.CONFIG_SAVED))
    results.forEach((result) => console.log(`  ${result}`))
  } catch (error) {
    console.error(chalk.red('设置失败:'), error.message)
    process.exit(1)
  }
}

module.exports = setCommand
