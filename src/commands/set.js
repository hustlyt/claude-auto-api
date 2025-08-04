const chalk = require('chalk');
const { validateSetCommand } = require('../utils/validator');
const { setSettingsPath, setApiConfigPath } = require('../utils/config');
const { fileExists } = require('../utils/file');
const { SUCCESS_MESSAGES } = require('../constants');

/**
 * 设置配置文件路径命令
 */
async function setCommand(options) {
  try {
    // 验证命令参数
    const validation = validateSetCommand(options);
    if (!validation.valid) {
      console.error(chalk.red('参数错误:'), validation.error);
      return;
    }
    
    const { settings, api } = options;
    const results = [];
    
    // 设置settings.json路径
    if (settings) {
      // 检查文件是否存在
      if (!await fileExists(settings)) {
        console.warn(chalk.yellow('警告:'), `settings.json文件不存在: ${settings}`);
        console.log(chalk.gray('路径已保存，请确保文件存在后再使用其他命令'));
      }
      
      await setSettingsPath(settings);
      results.push(`settings.json 路径: ${chalk.green(settings)}`);
    }
    
    // 设置api.json路径
    if (api) {
      // 检查文件是否存在
      if (!await fileExists(api)) {
        console.warn(chalk.yellow('警告:'), `api.json文件不存在: ${api}`);
        console.log(chalk.gray('路径已保存，请确保文件存在后再使用其他命令'));
      }
      
      await setApiConfigPath(api);
      results.push(`api.json 路径: ${chalk.green(api)}`);
    }
    
    // 显示结果
    console.log(chalk.blue(SUCCESS_MESSAGES.CONFIG_SAVED));
    results.forEach(result => console.log(`  ${result}`));
    
  } catch (error) {
    console.error(chalk.red('设置失败:'), error.message);
    process.exit(1);
  }
}

module.exports = setCommand;