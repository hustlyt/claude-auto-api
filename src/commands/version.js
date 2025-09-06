const chalk = require('chalk')
const packageJson = require('../../package.json')

/**
 * 显示版本信息
 */
async function versionCommand() {
  console.log(chalk.green.bold(`${packageJson.name} v${packageJson.version}`))
}

module.exports = versionCommand
