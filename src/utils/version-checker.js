const { exec } = require('child_process')
const { promisify } = require('util')
const packageJson = require('../../package.json')

const execPromise = promisify(exec)

/**
 * 从npm registry获取最新版本信息
 * @param {string} packageName - 包名
 * @returns {Promise<string>} 最新版本号
 */
async function fetchLatestVersion(packageName) {
  const { stdout } = await execPromise(`npm view ${packageName} version`)
  return stdout.trim()
}

/**
 * 比较两个版本号
 * @param {string} version1 - 版本1 (当前版本)
 * @param {string} version2 - 版本2 (最新版本)
 * @returns {number} -1: version1 < version2, 0: 相等, 1: version1 > version2
 */
function compareVersions(version1, version2) {
  const v1 = version1
    .replace(/^v/, '')
    .split('.')
    .map((num) => parseInt(num, 10))
  const v2 = version2
    .replace(/^v/, '')
    .split('.')
    .map((num) => parseInt(num, 10))

  const maxLength = Math.max(v1.length, v2.length)

  for (let i = 0; i < maxLength; i++) {
    const num1 = v1[i] || 0
    const num2 = v2[i] || 0

    if (num1 < num2) return -1
    if (num1 > num2) return 1
  }

  return 0
}

/**
 * 检查是否需要更新
 * @param {string} currentVersion - 当前版本
 * @param {string} latestVersion - 最新版本
 * @returns {boolean} 是否需要更新
 */
function needsUpdate(currentVersion, latestVersion) {
  return compareVersions(currentVersion, latestVersion) < 0
}

/**
 * 静默检查版本更新（仅用于提示）
 * @returns {Promise<{needsUpdate: boolean, latestVersion?: string}>}
 */
async function checkUpdateQuietly() {
  const currentVersion = packageJson.version

  try {
    const latestVersion = await fetchLatestVersion(packageJson.name)
    const shouldUpdate = needsUpdate(currentVersion, latestVersion)

    return {
      needsUpdate: shouldUpdate,
      currentVersion,
      latestVersion
    }
  } catch (error) {
    // 静默失败，不输出错误信息
    return {
      needsUpdate: false,
      currentVersion,
      latestVersion: currentVersion
    }
  }
}

module.exports = {
  fetchLatestVersion,
  compareVersions,
  needsUpdate,
  checkUpdateQuietly
}
