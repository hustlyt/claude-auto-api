const chalk = require('chalk');
const { validateConfig } = require('../utils/config');
const { readConfigFile } = require('../utils/file');
const { validateApiConfig, validateConfigName } = require('../utils/validator');
const { ERROR_MESSAGES } = require('../constants');
const { 
  applyApiConfigToEnv, 
  getUserEnvVar, 
  deleteUserEnvVar,
  setUserEnvVar,
  clearAllClaudeEnvVars
} = require('../utils/env-vars');

/**
 * 显示当前环境变量状态
 */
async function showEnvStatus() {
  console.log(chalk.green.bold('当前Claude环境变量状态:'));
  console.log();
  
  const envVars = [
    'CLAUDE_API_URL',
    'CLAUDE_API_TOKEN', 
    'CLAUDE_MODEL',
    'CLAUDE_FAST_MODEL',
    'CLAUDE_TIMEOUT',
    'CLAUDE_MAX_TOKENS',
    'CLAUDE_CURRENT_CONFIG'
  ];
  
  for (const envVar of envVars) {
    const value = await getUserEnvVar(envVar);
    if (value) {
      // 对敏感信息进行脱敏处理
      let displayValue = value;
      if (envVar.includes('TOKEN') || envVar.includes('KEY')) {
        displayValue = value.length > 25 
          ? value.slice(0, 25) + '...' 
          : value;
      }
      console.log(`  ${envVar}: ${chalk.cyan(displayValue)}`);
    } else {
      console.log(`  ${envVar}: ${chalk.gray('未设置')}`);
    }
  }
  console.log();
}


/**
 * 环境变量管理命令
 */
async function envCommand(action, configName, options = {}) {
  try {
    switch (action) {
      case 'status':
      case 'show':
        await showEnvStatus();
        break;
        
      case 'clear':
        const clearResult = await clearAllClaudeEnvVars();
        
        if (clearResult.success.length > 0) {
          console.log(chalk.green('✓'), `成功清除环境变量: ${clearResult.success.join(', ')}`);
        }
        
        if (clearResult.failed.length > 0) {
          console.warn(chalk.yellow('⚠'), `清除失败的环境变量: ${clearResult.failed.join(', ')}`);
        }
        
        console.log();
        console.log(chalk.yellow.bold('注意: 需要重启终端或重新登录才能生效'));
        break;
        
      case 'set':
        if (!configName) {
          console.error(chalk.red('错误:'), '请指定配置名称');
          console.log(`用法: ${chalk.cyan('ccapi env set <配置名称>')}`);
          return;
        }
        
        // 验证配置
        const config = await validateConfig();
        
        // 读取API配置文件
        const apiConfig = await readConfigFile(config.apiConfigPath);
        if (!validateApiConfig(apiConfig)) {
          console.error(chalk.red('错误:'), 'api.json文件格式不正确');
          return;
        }
        
        // 验证配置名称是否存在
        if (!validateConfigName(apiConfig, configName)) {
          console.error(chalk.red('设置错误:'), `${ERROR_MESSAGES.CONFIG_NAME_NOT_FOUND}: ${configName}`);
          console.log(chalk.green('当前可用的配置:'), Object.keys(apiConfig).join(', '));
          return;
        }
        
        console.log(`正在将配置 '${configName}' 设置到环境变量...`);
        
        const envResult = await applyApiConfigToEnv(apiConfig, configName);
        
        if (envResult.cleared.length > 0) {
          console.log(chalk.blue('🧹'), `已清除旧环境变量: ${envResult.cleared.length} 个`);
        }
        
        if (envResult.success.length > 0) {
          console.log(chalk.green('✓'), `成功设置环境变量: ${envResult.success.join(', ')}`);
        }
        
        if (envResult.failed.length > 0) {
          console.warn(chalk.yellow('⚠'), `设置失败的环境变量: ${envResult.failed.join(', ')}`);
        }
        
        console.log();
        console.log(chalk.yellow.bold('注意: 需要重启终端或重新登录才能生效'));
        break;
        
      case 'debug':
        // 调试单个环境变量设置
        if (!configName) {
          console.error(chalk.red('错误:'), '请指定要测试的环境变量名');
          console.log(`用法: ${chalk.cyan('ccapi env debug <环境变量名>')}`);
          return;
        }
        
        console.log(`正在测试设置环境变量: ${configName}`);
        const testResult = await setUserEnvVar(configName, 'test_value');
        
        if (testResult) {
          console.log(chalk.green('✓'), `成功设置环境变量: ${configName}`);
          // 验证是否真的设置成功
          const readBack = await getUserEnvVar(configName);
          console.log(`读取到的值: ${chalk.cyan(readBack || '(空)')}`);
        } else {
          console.log(chalk.red('✗'), `设置环境变量失败: ${configName}`);
        }
        break;
        
      case 'test':
        // 测试环境变量是否可以被读取
        console.log('测试环境变量可用性...');
        const testVars = ['CLAUDE_API_URL', 'CLAUDE_API_TOKEN', 'CLAUDE_MODEL'];
        let allPresent = true;
        
        for (const envVar of testVars) {
          const value = process.env[envVar];
          if (value) {
            console.log(chalk.green('✓'), `${envVar}: 已设置`);
          } else {
            console.log(chalk.red('✗'), `${envVar}: 未设置`);
            allPresent = false;
          }
        }
        
        if (allPresent) {
          console.log();
          console.log(chalk.green.bold('环境变量配置完整，可以正常使用'));
        } else {
          console.log();
          console.log(chalk.yellow.bold('部分环境变量缺失，请先运行 ccapi env set <配置名>'));
        }
        break;
        
      default:
        console.log(chalk.blue.bold('环境变量管理命令用法:'));
        console.log();
        console.log(`  ${chalk.cyan('ccapi env status')} - 显示当前环境变量状态`);
        console.log(`  ${chalk.cyan('ccapi env set <配置名>')} - 将指定配置设置到环境变量`);
        console.log(`  ${chalk.cyan('ccapi env clear')} - 清除所有Claude环境变量`);
        console.log(`  ${chalk.cyan('ccapi env test')} - 测试环境变量可用性`);
        console.log(`  ${chalk.cyan('ccapi env debug <变量名>')} - 调试环境变量设置`);
        console.log();
        console.log('示例:');
        console.log(`  ${chalk.gray('ccapi env status')}`);
        console.log(`  ${chalk.gray('ccapi env set openrouter')}`);
        console.log(`  ${chalk.gray('ccapi env clear')}`);
        break;
    }
    
  } catch (error) {
    console.error(chalk.red('环境变量操作失败:'), error.message);
    process.exit(1);
  }
}

module.exports = envCommand;