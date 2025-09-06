const { spawn } = require('child_process')
const chalk = require('chalk')
const packageJson = require('../../package.json')

/**
 * 执行npm update命令
 * @param {string} packageName - 包名
 * @returns {Promise<boolean>} 更新是否成功
 */
function executeNpmUpdate(packageName) {
  return new Promise((resolve, reject) => {
    console.log(chalk.blue.bold(`正在更新${packageName}...`))
    
    const npmProcess = spawn('npm', ['install', '-g', packageName], {
      stdio: ['inherit', 'pipe', 'pipe']
    })
    
    let stderr = ''
    
    npmProcess.on('close', (code) => {
      if (code === 0) {
        resolve(true)
      } else {
        reject(new Error(`npm update失败: ${stderr}`))
      }
    })
    
    npmProcess.on('error', (error) => {
      if (error.code === 'ENOENT') {
        console.log(chalk.yellow('💡 提示: 未找到npm命令，请确保已安装Node.js和npm'))
      }
      
      reject(error)
    })
  })
}

/**
 * 更新命令处理函数
 */
async function updateCommand() {
  try {
    await executeNpmUpdate(packageJson.name)
    
    console.log()
    console.log(chalk.green.bold('🎉 更新完成，建议重启终端以使用新版本'))
    
    // 显示最新版本的更新日志
    showLatestUpdateLogs()
    
  } catch (error) {
    console.log()
    console.log(chalk.red.bold('❌ 更新失败'))
    console.log()
    console.log(chalk.cyan(`手动更新命令: npm install -g ${packageJson.name}`))
    
    process.exit(1)
  }
}

/**
 * 显示最新版本的更新内容
 */
function showLatestUpdateLogs() {
  const updateLogs = packageJson.updateLogs || []
  
  if (updateLogs.length === 0) {
    return
  }
  
  console.log()
  console.log(chalk.cyan.bold('📋 本次更新内容:'))
  updateLogs.forEach(log => {
    console.log(`   ${log}`)
  })
}

module.exports = updateCommand