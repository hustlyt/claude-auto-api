const { readConfig, writeConfig } = require('./config')
const path = require('path')
const zhMessages = require('../i18n/zh')
const enMessages = require('../i18n/en')

// 缓存语言消息和当前语言
let currentMessages = null
let currentLang = null

// 支持的语言列表
const SUPPORTED_LANGUAGES = {
  zh: '中文',
  en: 'English'
}

/**
 * 获取当前语言设置
 * @returns {string} 语言代码
 */
async function getCurrentLang() {
  if (currentLang) {
    return currentLang
  }
  
  try {
    const config = await readConfig()
    currentLang = config.lang || 'zh' // 默认中文
    return currentLang
  } catch (error) {
    // 读取配置失败时使用默认语言
    currentLang = 'zh'
    return currentLang
  }
}

/**
 * 设置语言
 * @param {string} lang 语言代码
 */
async function setLang(lang) {
  if (!SUPPORTED_LANGUAGES[lang]) {
    const supportedList = Object.keys(SUPPORTED_LANGUAGES).map(k => `${k} (${SUPPORTED_LANGUAGES[k]})`).join(', ')
    throw new Error(await t('utils.UNSUPPORTED_LANGUAGE', supportedList))
  }
  
  const config = await readConfig()
  config.lang = lang
  await writeConfig(config)
  
  // 清除缓存，强制重新加载
  currentLang = lang
  currentMessages = null
}

/**
 * 加载语言消息文件
 * @param {string} lang 语言代码
 * @returns {object} 语言消息对象
 */
function loadMessages(lang = 'zh') {
  const messagesMap = {
    zh: zhMessages,
    en: enMessages
  }
  
  if (messagesMap[lang]) {
    return messagesMap[lang]
  }
  
  // 如果请求的语言不存在，回退到中文
  if (lang !== 'zh') {
    console.warn(`Warning: Cannot load language file ${lang}.js, falling back to Chinese`)
    return zhMessages
  }
  
  throw new Error(`Unable to load language file: ${lang}`)
}

/**
 * 获取翻译文本
 * @param {string} key 键名，支持点分隔的嵌套键
 * @param {...any} args 参数，用于字符串替换 {0}, {1} 等
 * @returns {string} 翻译后的文本
 */
async function t(key, ...args) {
  try {
    // 获取当前语言和消息
    const lang = await getCurrentLang()
    
    if (!currentMessages || currentLang !== lang) {
      currentMessages = loadMessages(lang)
      currentLang = lang
    }
    
    // 解析嵌套键
    const keys = key.split('.')
    let value = currentMessages
    
    for (const k of keys) {
      if (value && typeof value === 'object' && value.hasOwnProperty(k)) {
        value = value[k]
      } else {
        // 键不存在时返回键名
        console.warn(`Warning: Translation key "${key}" does not exist`)
        return key
      }
    }
    
    // 如果值不是字符串，返回键名
    if (typeof value !== 'string') {
      console.warn(`Warning: Translation key "${key}" value is not a string`)
      return key
    }
    
    // 参数替换
    let result = value
    args.forEach((arg, index) => {
      result = result.replace(new RegExp(`\\{${index}\\}`, 'g'), arg)
    })
    
    return result
  } catch (error) {
    console.warn(`Warning: Translation failed: ${error.message}`)
    return key
  }
}

/**
 * 获取支持的语言列表
 * @returns {object} 支持的语言对象
 */
function getSupportedLanguages() {
  return SUPPORTED_LANGUAGES
}

/**
 * 检查语言是否支持
 * @param {string} lang 语言代码
 * @returns {boolean} 是否支持
 */
function isLanguageSupported(lang) {
  return SUPPORTED_LANGUAGES.hasOwnProperty(lang)
}

/**
 * 清除缓存（主要用于测试）
 */
function clearCache() {
  currentMessages = null
  currentLang = null
}

module.exports = {
  getCurrentLang,
  setLang,
  loadMessages,
  t,
  getSupportedLanguages,
  isLanguageSupported,
  clearCache
}
