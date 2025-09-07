const { exec } = require('child_process')
const https = require('https')
const http = require('http')
const { URL } = require('url')
const os = require('os')
const { t } = require('./i18n')

/**
 * 跨平台延迟测试工具类
 * 支持 curl 优先策略，不可用时降级到 Node.js HTTP 请求
 */
class LatencyTester {
  /**
   * 测试 URL 延迟
   * @param {string} url - 要测试的URL
   * @param {string} method - 测试方法 ('auto', 'curl', 'http')
   * @param {number} timeout - 超时时间（毫秒），默认5000ms
   * @returns {Promise<number>} 延迟时间（毫秒）
   */
  static async testUrl(url, method = 'auto', timeout = 5000) {
    if (method === 'curl' || (method === 'auto' && (await this.isCurlAvailable()))) {
      return this.testWithCurl(url, timeout)
    } else {
      return this.testWithNodeHttp(url, timeout)
    }
  }

  /**
   * 检查 curl 是否可用
   * @returns {Promise<boolean>}
   */
  static async isCurlAvailable() {
    return new Promise((resolve) => {
      exec('curl --version', { timeout: 3000 }, (error) => {
        resolve(!error)
      })
    })
  }

  /**
   * 使用 curl 测试延迟
   * @param {string} url - 要测试的URL
   * @param {number} timeout - 超时时间（毫秒）
   * @returns {Promise<number>} 延迟时间（毫秒）
   */
  static async testWithCurl(url, timeout = 5000) {
    // 预先获取所有可能需要的错误信息
    const errorMessages = {
      timeout: await t('utils.CONNECTION_TIMEOUT'),
      dns: await t('utils.DNS_RESOLUTION_FAILED'),
      invalid: await t('utils.INVALID_LATENCY_DATA', '{0}'),
      failed: await t('utils.TEST_FAILED', '{0}')
    }
    
    const nullDevice = os.platform() === 'win32' ? 'nul' : '/dev/null'
    const timeoutSeconds = Math.ceil(timeout / 1000)
    const curlCommand = `curl -o ${nullDevice} -s -w "%{time_total}" --connect-timeout ${timeoutSeconds} --max-time ${timeoutSeconds + 2} "${url}"`

    return new Promise((resolve, reject) => {
      exec(curlCommand, { timeout: timeout + 2000 }, (error, stdout) => {
        if (error) {
          // 如果是超时或网络错误，返回适当的错误信息
          const errorMsg = error.message.toLowerCase()
          if (errorMsg.includes('timeout') || errorMsg.includes('timed out')) {
            reject(new Error(errorMessages.timeout))
          } else if (errorMsg.includes('could not resolve host')) {
            reject(new Error(errorMessages.dns))
          } else {
            reject(new Error(errorMessages.failed.replace('{0}', error.message)))
          }
          return
        }

        const timeInSeconds = parseFloat(stdout.trim())
        if (isNaN(timeInSeconds) || timeInSeconds < 0) {
          reject(new Error(errorMessages.invalid.replace('{0}', stdout)))
          return
        }

        resolve(Math.round(timeInSeconds * 1000))
      })
    })
  }

  /**
   * 使用 Node.js HTTP 请求测试延迟
   * @param {string} url - 要测试的URL
   * @param {number} timeout - 超时时间（毫秒）
   * @returns {Promise<number>} 延迟时间（毫秒）
   */
  static async testWithNodeHttp(url, timeout = 5000) {
    // 预先获取所有可能需要的错误信息
    const errorMessages = {
      timeout: await t('utils.CONNECTION_TIMEOUT'),
      dns: await t('utils.DNS_RESOLUTION_FAILED'),
      refused: await t('utils.CONNECTION_REFUSED'),
      reset: await t('utils.CONNECTION_RESET'),
      httpFailed: await t('utils.HTTP_TEST_FAILED', '{0}'),
      requestTimeout: await t('utils.REQUEST_TIMEOUT'),
      urlParsing: await t('utils.URL_PARSING_ERROR', '{0}')
    }
    
    return new Promise((resolve, reject) => {
      const startTime = Date.now()

      try {
        const urlObj = new URL(url)
        const client = urlObj.protocol === 'https:' ? https : http

        const req = client.get(
          url,
          {
            timeout: timeout,
            headers: {
              'User-Agent': 'ccapi-ping/1.0',
              Connection: 'close'
            }
          },
          (res) => {
            const latency = Date.now() - startTime
            res.destroy() // 立即关闭响应流，不需要读取完整内容
            resolve(latency)
          }
        )

        req.on('error', (error) => {
          const errorMsg = error.message.toLowerCase()
          if (errorMsg.includes('timeout') || error.code === 'ETIMEDOUT') {
            reject(new Error(errorMessages.timeout))
          } else if (errorMsg.includes('getaddrinfo') || error.code === 'ENOTFOUND') {
            reject(new Error(errorMessages.dns))
          } else if (error.code === 'ECONNREFUSED') {
            reject(new Error(errorMessages.refused))
          } else if (error.code === 'ECONNRESET') {
            reject(new Error(errorMessages.reset))
          } else {
            reject(new Error(errorMessages.httpFailed.replace('{0}', error.message)))
          }
        })

        req.on('timeout', () => {
          req.destroy()
          reject(new Error(errorMessages.requestTimeout))
        })

        // 设置额外的超时保护
        const timeoutId = setTimeout(() => {
          req.destroy()
          reject(new Error(errorMessages.requestTimeout))
        }, timeout)

        req.on('response', () => {
          clearTimeout(timeoutId)
        })

        req.on('error', () => {
          clearTimeout(timeoutId)
        })
      } catch (error) {
        reject(new Error(errorMessages.urlParsing.replace('{0}', error.message)))
      }
    })
  }

  /**
   * 批量测试多个URL的延迟
   * @param {Array<string>} urls - URL列表
   * @param {string} method - 测试方法
   * @param {number} timeout - 超时时间（毫秒）
   * @returns {Promise<Array<{url: string, latency: number|string, error: string|null}>>}
   */
  static async testMultipleUrls(urls, method = 'auto', timeout = 5000) {
    const testPromises = urls.map(async (url, index) => {
      try {
        const latency = await this.testUrl(url, method, timeout)
        return {
          url,
          latency,
          error: null,
          index,
          success: true
        }
      } catch (error) {
        return {
          url,
          latency: 'error',
          error: error.message,
          index,
          success: false
        }
      }
    })

    return Promise.all(testPromises)
  }

  /**
   * 获取测试方法信息
   * @returns {Promise<{method: string, available: boolean}>}
   */
  static async getTestMethodInfo() {
    const curlAvailable = await this.isCurlAvailable()
    return {
      curl: curlAvailable,
      http: true, // Node.js HTTP 总是可用
      recommended: curlAvailable ? 'curl' : 'http'
    }
  }
}

module.exports = LatencyTester
