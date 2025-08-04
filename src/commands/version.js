const chalk = require('chalk');
const packageJson = require('../../package.json');

/**
 * 显示版本信息
 */
function versionCommand() {
  console.log(chalk.blue(`${packageJson.name} v${packageJson.version}`));
  console.log(chalk.gray(packageJson.description));
}

module.exports = versionCommand;