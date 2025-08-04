const fs = require('fs-extra');
const path = require('path');
const { ERROR_MESSAGES } = require('../constants');

/**
 * 安全读取JSON文件
 */
async function readJsonFile(filePath) {
  try {
    if (!await fs.pathExists(filePath)) {
      throw new Error(`文件不存在: ${filePath}`);
    }
    
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    if (error.message.includes('JSON')) {
      throw new Error(`${ERROR_MESSAGES.INVALID_JSON}: ${filePath}`);
    }
    throw error;
  }
}

/**
 * 安全写入JSON文件
 */
async function writeJsonFile(filePath, data) {
  try {
    // 确保目录存在
    await fs.ensureDir(path.dirname(filePath));
    
    // 格式化JSON输出
    const content = JSON.stringify(data, null, 2);
    await fs.writeFile(filePath, content, 'utf8');
  } catch (error) {
    throw new Error(`写入文件失败: ${filePath} - ${error.message}`);
  }
}

/**
 * 备份文件
 */
async function backupFile(filePath) {
  try {
    const backupPath = `${filePath}.backup`;
    await fs.copy(filePath, backupPath);
    return backupPath;
  } catch (error) {
    throw new Error(`${ERROR_MESSAGES.BACKUP_FAILED}: ${error.message}`);
  }
}

/**
 * 检查文件是否存在
 */
async function fileExists(filePath) {
  return await fs.pathExists(filePath);
}

/**
 * 验证路径格式
 */
function validatePath(filePath) {
  if (!filePath || typeof filePath !== 'string') {
    return false;
  }
  
  // 检查是否为绝对路径
  if (!path.isAbsolute(filePath)) {
    return false;
  }
  
  // 检查文件扩展名
  const ext = path.extname(filePath).toLowerCase();
  return ext === '.json';
}

module.exports = {
  readJsonFile,
  writeJsonFile,
  backupFile,
  fileExists,
  validatePath
};