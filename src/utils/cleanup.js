const fs = require('fs')
const os = require('os')
const path = require('path')

/**
 * 获取 Claude 配置文件路径（跨平台兼容）
 */
function getClaudeConfigPath() {
  // Claude Code 在所有平台都使用用户主目录下的 .claude.json
  return path.join(os.homedir(), '.claude.json')
}

/**
 * 检查项目路径是否为临时测试项目（跨平台兼容）
 */
function isTempTestProject(projectPath) {
  // 规范化路径，统一处理路径分隔符
  const normalizedPath = path.normalize(projectPath)
  
  // 检查路径中是否包含临时测试标识
  // 使用 path.sep 确保在所有平台上正确识别
  return normalizedPath.includes('ccapi-test-') && 
         (normalizedPath.includes(path.join('tmp', '')) || 
          normalizedPath.includes(path.join('Temp', '')) ||
          normalizedPath.includes(path.join('temp', '')) ||
          normalizedPath.includes('var' + path.sep + 'folders') ||
          normalizedPath.includes('AppData'))
}

/**
 * 清理.claude.json中所有临时测试项目记录的工具（跨平台兼容）
 */
function cleanupAllTempProjects() {
  const claudeJsonPath = getClaudeConfigPath()
  
  if (!fs.existsSync(claudeJsonPath)) {
    return 0
  }

  try {
    const claudeConfig = JSON.parse(fs.readFileSync(claudeJsonPath, 'utf8'))
    
    if (!claudeConfig.projects) {
      return 0
    }

    // 查找所有临时测试项目记录（跨平台兼容）
    const tempProjects = []
    Object.keys(claudeConfig.projects).forEach(projectPath => {
      if (isTempTestProject(projectPath)) {
        tempProjects.push(projectPath)
      }
    })

    if (tempProjects.length === 0) {
      return 0
    }

    // 删除所有临时项目记录
    tempProjects.forEach(project => {
      delete claudeConfig.projects[project]
    })

    // 写回配置文件
    fs.writeFileSync(claudeJsonPath, JSON.stringify(claudeConfig, null, 2))
    return tempProjects.length

  } catch (error) {
    return 0
  }
}

module.exports = { 
  cleanupAllTempProjects,
  getClaudeConfigPath,
  isTempTestProject
}