const { Command } = require('commander')
const chalk = require('chalk')
const packageJson = require('../package.json')
const { checkUpdateQuietly } = require('./utils/version-checker')
const { readConfig } = require('./utils/config')
const { t } = require('./utils/i18n')

// 导入命令处理模块
const versionCommand = require('./commands/version')
const setCommand = require('./commands/set')
const claudeCommand = require('./commands/claude')
const updateCommand = require('./commands/update')
const envCommand = require('./commands/env')
const clearCommand = require('./commands/clear')
const langCommand = require('./commands/lang')
const codexCommand = require('./commands/codex')

const program = new Command()

async function checkVersionInBackground() {
  try {
    const configData = await readConfig()
    const update = configData.update !== void 0 ? configData.update : true
    if (process.argv.includes('update') || !update) {
      return
    }
    const versionInfo = await checkUpdateQuietly()
    if (versionInfo.needsUpdate) {
      console.log(
        chalk.yellow(await t('prompts.NEW_VERSION_AVAILABLE', versionInfo.latestVersion, chalk.bold('`ccapi update`')))
      )
    }
  } catch (error) {}
}

// 异步初始化程序和命令
async function initializeProgram() {
  // 设置基本信息
  program
    .name('ccapi')
    .description(await t('cli.description'))
    .version(packageJson.version)

  // 版本命令
  program.option('-v, --version', await t('cli.version')).action(async () => {
    await versionCommand()
    await checkVersionInBackground()
  })

  // claude 命令
  program
    .command('claude [provider]')
    .description(await t('commands.claude.description'))
    .action(async (provider) => {
      await claudeCommand(provider)
      await checkVersionInBackground()
    })

  // codex 命令
  program
    .command('codex [provider]')
    .description('切换Codex配置中的model_provider')
    .action(async (provider) => {
      await codexCommand(provider)
      await checkVersionInBackground()
    })

  // env 命令
  program
    .command('env [name]')
    .description(await t('commands.env.description'))
    .option('-u, --url <index>', await t('commands.env.urlOption'))
    .option('-k, --key <index>', await t('commands.env.keyOption'))
    .option('-t, --token <index>', await t('commands.env.tokenOption'))
    .option('-m, --model <index>', await t('commands.env.modelOption'))
    .option('-f, --fast <index>', await t('commands.env.fastOption'))
    .action(async (name, options) => {
      await envCommand(name, options)
      await checkVersionInBackground()
    })


  // clear 命令
  program
    .command('clear')
    .description(await t('commands.clear.description'))
    .action(async () => {
      await clearCommand()
      await checkVersionInBackground()
    })

  // lang 命令
  program
    .command('lang [language]')
    .description(await t('commands.lang.description'))
    .action(async (language) => {
      await langCommand(language)
    })

  // update 命令
  program
    .command('update')
    .description(await t('commands.update.description'))
    .action(() => {
      updateCommand()
    })

  // 设置命令
  program
    .command('set')
    .description(await t('commands.set.description'))
    .option('--settings <path>', await t('commands.set.settingsOption'))
    .option('--api <path>', await t('commands.set.apiOption'))
    .action(async (options) => {
      await setCommand(options)
      await checkVersionInBackground()
    })




  return program
}

// 全局错误处理
process.on('uncaughtException', async (error) => {
  console.error(chalk.red(await t('errors.PROGRAM_ERROR') + ':'), error.message)
  if (process.env.NODE_ENV === 'development') {
    console.error(error.stack)
  }
  process.exit(1)
})

process.on('unhandledRejection', async (reason, promise) => {
  console.error(chalk.red(await t('errors.UNHANDLED_PROMISE') + ':'), reason)
  if (process.env.NODE_ENV === 'development') {
    console.error('Promise:', promise)
  }
  process.exit(1)
})

// 主函数 - 异步初始化并运行程序
async function main() {
  try {
    const program = await initializeProgram()
    
    // 解析命令行参数
    program.parse(process.argv)
    
    // 如果没有提供任何参数，显示帮助信息
    if (!process.argv.slice(2).length) {
      program.outputHelp()
    }
  } catch (error) {
    console.error(chalk.red('Program initialization failed:'), error.message)
    process.exit(1)
  }
}

// 运行主函数
main()
