const { spawn, exec } = require("child_process");
const { promisify } = require("util");

const execAsync = promisify(exec);

/**
 * 设置Windows用户环境变量
 * @param {string} name - 环境变量名
 * @param {string} value - 环境变量值
 * @returns {Promise<boolean>} - 是否设置成功
 */
async function setUserEnvVar(name, value) {
  try {
    // 使用setx命令设置用户环境变量
    const command = `setx "${name}" "${value}"`;
    const { stdout, stderr } = await execAsync(command, { encoding: "utf8" });

    // 检查stderr，如果没有错误信息，认为设置成功
    // setx命令成功时会在stdout输出成功信息，即使是中文编码问题也不影响
    const hasError = stderr && stderr.trim().length > 0;
    const isSuccess = !hasError;
    
    return isSuccess;
  } catch (error) {
    console.error(`设置环境变量 ${name} 失败:`, error.message);
    return false;
  }
}

/**
 * 获取Windows用户环境变量
 * @param {string} name - 环境变量名
 * @returns {Promise<string|null>} - 环境变量值，如果不存在则返回null
 */
async function getUserEnvVar(name) {
  try {
    // 使用reg query命令查询用户环境变量
    const command = `reg query "HKCU\\Environment" /v "${name}"`;
    const { stdout } = await execAsync(command, { encoding: "utf8" });

    // 解析输出，提取环境变量值
    const lines = stdout.split("\n");
    for (const line of lines) {
      if (line.trim().startsWith(name)) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 3) {
          // 返回第3部分及之后的内容（环境变量值可能包含空格）
          return parts.slice(2).join(" ");
        }
      }
    }
    return null;
  } catch (error) {
    // 如果环境变量不存在，reg query会返回错误，这是正常情况
    return null;
  }
}

/**
 * 删除Windows用户环境变量
 * @param {string} name - 环境变量名
 * @returns {Promise<boolean>} - 是否删除成功
 */
async function deleteUserEnvVar(name) {
  try {
    // 先检查环境变量是否存在
    const exists = await getUserEnvVar(name);
    if (!exists) {
      // 如果不存在，认为删除成功（幂等操作）
      return true;
    }
    
    // 使用reg delete命令删除用户环境变量
    const command = `reg delete "HKCU\\Environment" /v "${name}" /f`;
    await execAsync(command, { encoding: "utf8" });
    return true;
  } catch (error) {
    // 只有在确实存在但删除失败时才报错
    const exists = await getUserEnvVar(name);
    if (exists) {
      console.error(`删除环境变量 ${name} 失败:`, error.message);
      return false;
    }
    // 如果删除后检查不存在了，认为成功
    return true;
  }
}

/**
 * 批量设置多个环境变量
 * @param {Object} envVars - 环境变量键值对对象
 * @returns {Promise<{success: string[], failed: string[]}>} - 设置结果
 */
async function setBatchUserEnvVars(envVars) {
  const success = [];
  const failed = [];

  for (const [name, value] of Object.entries(envVars)) {
    const result = await setUserEnvVar(name, value);
    if (result) {
      success.push(name);
    } else {
      failed.push(name);
    }
  }

  return { success, failed };
}

/**
 * 清除所有Claude相关环境变量
 * @returns {Promise<{success: string[], failed: string[]}>} - 清除结果
 */
async function clearAllClaudeEnvVars() {
  const envVarsToClean = [
    "ANTHROPIC_BASE_URL",
    "ANTHROPIC_API_KEY", 
    "ANTHROPIC_AUTH_TOKEN",
    "ANTHROPIC_MODEL",
    "ANTHROPIC_SMALL_FAST_MODEL",
    "API_TIMEOUT_MS",
    "CLAUDE_CODE_MAX_OUTPUT_TOKENS",
    "HTTP_PROXY",
    "HTTPS_PROXY",
    "CLAUDE_CURRENT_CONFIG",
    // 兼容老版本的环境变量
    "CLAUDE_API_URL",
    "CLAUDE_API_TOKEN",
    "CLAUDE_MODEL",
    "CLAUDE_FAST_MODEL",
    "CLAUDE_TIMEOUT",
    "CLAUDE_MAX_TOKENS"
  ];
  
  const results = { success: [], failed: [] };
  
  for (const envVar of envVarsToClean) {
    const success = await deleteUserEnvVar(envVar);
    if (success) {
      results.success.push(envVar);
    } else {
      results.failed.push(envVar);
    }
  }
  
  return results;
}

/**
 * 从API配置中提取并设置环境变量
 * @param {Object} apiConfig - API配置对象
 * @param {string} configName - 要应用的配置名称
 * @param {boolean} clearFirst - 是否先清除现有环境变量，默认为true
 * @returns {Promise<{success: string[], failed: string[], cleared: string[]}>} - 设置结果
 */
async function applyApiConfigToEnv(apiConfig, configName, clearFirst = true) {
  if (!apiConfig || !apiConfig[configName]) {
    throw new Error(`配置 ${configName} 不存在`);
  }

  let clearResults = { success: [], failed: [] };
  
  // 先清除所有现有的环境变量以避免冲突
  if (clearFirst) {
    console.log('正在清除现有的Claude环境变量...');
    clearResults = await clearAllClaudeEnvVars();
  }

  const config = apiConfig[configName];
  const envVars = {};

  // 映射API配置字段到环境变量
  const fieldMappings = {
    url: "ANTHROPIC_BASE_URL",
    key: "ANTHROPIC_API_KEY",
    token: "ANTHROPIC_AUTH_TOKEN",
    model: "ANTHROPIC_MODEL",
    fast: "ANTHROPIC_SMALL_FAST_MODEL", 
    timeout: "API_TIMEOUT_MS",
    tokens: "CLAUDE_CODE_MAX_OUTPUT_TOKENS",
    http: "HTTP_PROXY",
    https: "HTTPS_PROXY",
  };

  // 处理单一配置
  if (typeof config.url === "string") {
    for (const [field, envName] of Object.entries(fieldMappings)) {
      if (config[field] !== undefined) {
        envVars[envName] = String(config[field]);
      }
    }
  }
  // 处理多配置数组（使用第一个配置）
  else if (Array.isArray(config.url) && config.url.length > 0) {
    // 使用第一个URL配置
    envVars["ANTHROPIC_BASE_URL"] = config.url[0];

    // 如果有对应的token数组，使用第一个token
    if (Array.isArray(config.token) && config.token.length > 0) {
      envVars["ANTHROPIC_AUTH_TOKEN"] = config.token[0];
    } else if (typeof config.token === "string") {
      envVars["ANTHROPIC_AUTH_TOKEN"] = config.token;
    }
    
    // 如果有对应的key数组，使用第一个key
    if (Array.isArray(config.key) && config.key.length > 0) {
      envVars["ANTHROPIC_API_KEY"] = config.key[0];
    } else if (typeof config.key === "string") {
      envVars["ANTHROPIC_API_KEY"] = config.key;
    }

    // 处理其他字段
    for (const [field, envName] of Object.entries(fieldMappings)) {
      if (field !== "url" && field !== "token" && field !== "key" && config[field] !== undefined) {
        envVars[envName] = String(config[field]);
      }
    }
  }

  // 确保只设置一种认证方式，避免冲突
  if (envVars["ANTHROPIC_API_KEY"] && envVars["ANTHROPIC_AUTH_TOKEN"]) {
    // 如果配置中同时有key和token，优先使用token（因为通常token是更新的认证方式）
    console.log('检测到同时存在API Key和Token，优先使用Token认证方式');
    delete envVars["ANTHROPIC_API_KEY"];
  }

  // 设置配置名称到环境变量
  envVars["CLAUDE_CURRENT_CONFIG"] = configName;

  const setResults = await setBatchUserEnvVars(envVars);
  
  return {
    success: setResults.success,
    failed: setResults.failed,
    cleared: clearResults.success
  };
}

module.exports = {
  setUserEnvVar,
  getUserEnvVar,
  deleteUserEnvVar,
  setBatchUserEnvVars,
  applyApiConfigToEnv,
  clearAllClaudeEnvVars
};
