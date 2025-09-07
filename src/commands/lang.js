const chalk = require('chalk')
const { getCurrentLang, setLang, getSupportedLanguages, isLanguageSupported, t } = require('../utils/i18n')

/**
 * 语言管理命令
 * @param {string} lang 可选的语言代码
 */
async function langCommand(lang) {
  try {
    // 如果没有提供参数，显示当前语言设置
    if (!lang) {
      const currentLang = await getCurrentLang()
      const supportedLanguages = getSupportedLanguages()

      console.log(
        chalk.green(await t('commands.lang.current')) + ':',
        chalk.cyan(`${currentLang} (${supportedLanguages[currentLang]})`)
      )
      console.log()
      console.log(chalk.blue(await t('commands.lang.available')) + ':')
      Object.entries(supportedLanguages).forEach(([code, name]) => {
        const isCurrent = code === currentLang
        const prefix = isCurrent ? chalk.green('* ') : '  '
        console.log(`${prefix}${code} - ${name}`)
      })
      console.log()
      console.log(await t('commands.lang.examples'))
      return
    }

    // 验证语言代码
    if (!isLanguageSupported(lang)) {
      console.error(chalk.red(await t('errors.INVALID_LANGUAGE')))
      return
    }

    // 获取当前语言，如果已经是目标语言则提示
    const currentLang = await getCurrentLang()
    if (currentLang === lang) {
      console.log(chalk.yellow(await t('errors.SAME_CONFIG')))
      return
    }

    // 设置新语言
    await setLang(lang)

    // 使用新语言显示成功消息
    console.log(chalk.green(await t('success.LANGUAGE_SWITCHED')))
  } catch (error) {
    console.error(chalk.red((await t('errors.SET_FAILED')) + ':'), error.message)
    process.exit(1)
  }
}

module.exports = langCommand
