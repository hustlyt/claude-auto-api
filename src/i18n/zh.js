// 中文语言文件
module.exports = {
  // CLI 基础信息
  cli: {
    description:
      '一个快速切换Claude Code配置的工具，支持URL、API_KEY、AUTH_TOKEN、MODEL快速切换、系统环境变量一键管理、延迟测速、自动择优线路、国际化支持',
    version: '显示版本信息'
  },

  // 命令描述
  commands: {
    set: {
      description: '设置配置文件路径',
      settingsOption: 'Claude Code settings.json文件路径',
      apiOption: '自定义API配置文件路径'
    },
    list: {
      description: '显示当前API配置列表',
      alias: '列举'
    },
    claude: {
      description: '切换到指定的API配置',
      urlOption: '指定要切换的URL索引（从1开始，仅对数组类型url有效）',
      keyOption: '指定要切换的Key索引（从1开始，仅对数组类型key有效）',
      tokenOption: '指定要切换的Token索引（从1开始，仅对数组类型token有效）',
      modelOption: '指定要切换的模型索引（从1开始，仅对数组类型model有效）',
      fastOption: '指定要切换的快速模型索引（从1开始，仅对数组类型fast有效）'
    },
    update: {
      description: '更新ccapi到最新版本'
    },
    env: {
      description: '环境变量管理：设置/查看/清除系统环境变量',
      urlOption: '指定要使用的URL索引（从1开始，仅对数组类型url有效）',
      keyOption: '指定要使用的Key索引（从1开始，仅对数组类型key有效）',
      tokenOption: '指定要使用的Token索引（从1开始，仅对数组类型token有效）',
      modelOption: '指定要使用的模型索引（从1开始，仅对数组类型model有效）',
      fastOption: '指定要使用的快速模型索引（从1开始，仅对数组类型fast有效）'
    },
    clear: {
      description: '完全清除配置：同时清除settings.json和系统环境变量相关API配置'
    },
    lang: {
      description: '查看或设置语言',
      current: '当前语言',
      available: '可用语言',
      usage: '用法：ccapi lang [语言代码]',
      examples: '示例：\n  ccapi lang     # 查看当前语言\n  ccapi lang zh  # 设置为中文\n  ccapi lang en  # 设置为英文'
    }
  },

  // 错误消息
  errors: {
    CONFIG_NOT_FOUND: '配置文件未找到，请先使用 ccapi set 设置路径',
    SETTINGS_NOT_FOUND: 'settings文件不存在，请检查路径设置',
    API_CONFIG_NOT_FOUND: 'api配置文件不存在，请检查路径设置(支持JSON,JSON5,YAML,TOML格式)',
    INVALID_JSON: 'JSON文件格式错误',
    INVALID_YAML: 'YAML文件格式错误',
    INVALID_TOML: 'TOML文件格式错误',
    CONFIG_NAME_NOT_FOUND: '配置不存在',
    SAME_CONFIG: '当前已使用该配置',
    BACKUP_FAILED: 'settings文件备份失败',
    ENV_SET_FAILED: '环境变量设置失败',
    ENV_CLEAR_FAILED: '环境变量清除失败',
    PERMISSION_DENIED: '权限不足，无法修改系统环境变量',
    ENV_NOT_FOUND: '未找到相关的环境变量配置',
    PLATFORM_NOT_SUPPORTED: '不支持当前操作系统',
    PROGRAM_ERROR: '程序错误',
    UNHANDLED_PROMISE: '未处理的Promise错误',
    READ_CONFIG_FAILED: '读取配置失败',
    SAVE_CONFIG_FAILED: '保存配置失败',
    PARAM_ERROR: '参数错误',
    SET_FAILED: '设置失败',
    INVALID_LANGUAGE: '不支持的语言代码。支持的语言：zh (中文), en (English)'
  },

  // 成功消息
  success: {
    CONFIG_SAVED: '配置路径已保存',
    CONFIG_SWITCHED: '配置切换成功',
    RESTART_TERMINAL: '(提示: [settings.json中环境变量 > 系统环境变量] & 重启Claude Code终端后配置生效!)',
    BACKUP_CREATED: 'settings文件已备份',
    ENV_SET_SUCCESS: '环境变量设置成功',
    ENV_CLEAR_SUCCESS: '环境变量清除成功',
    FULL_CLEAR_SUCCESS: '配置完全清除成功',
    ENV_SYNC_SUCCESS: '配置已同步到环境变量',
    LANGUAGE_SWITCHED: '语言已切换为中文'
  },

  // 通用提示
  prompts: {
    CURRENT_CONFIG_PATHS: '当前配置路径:',
    WARNING: '警告',
    FILE_NOT_EXISTS: '当前路径文件不存在',
    NOT_SET: '未设置',
    SET_PATHS_HELP: '使用以下命令设置路径:',
    SET_SETTINGS_HELP: '设置settings.json文件路径',
    SET_API_HELP: '设置api配置文件路径',
    PATH_SAVED_ENSURE_EXISTS: '路径已保存，请确保文件存在后再使用其他命令',
    NEW_VERSION_AVAILABLE: '【新版本v{0}可用，可执行 {1} 进行更新】'
  },

  // 列表显示相关
  list: {
    URL: 'URL',
    Model: 'Model',
    Fast: 'Fast',
    Key: 'Key',
    Token: 'Token'
  },


  // 环境变量相关
  env: {
    CURRENT_ENV_VARS: '当前环境变量:',
    NO_ENV_VARS: '未设置环境变量',
    SET_SUCCESS: '环境变量设置成功',
    CLEAR_SUCCESS: '环境变量清除成功',
    CLEAR_ALL_SUCCESS: '所有环境变量清除成功',
    PLATFORM_NOT_SUPPORTED: '不支持该系统: {0} (仅支持 Windows、macOS、Linux)',
    ENV_SET_FAILED: '环境变量设置失败:',
    ENV_DELETE_FAILED: '环境变量删除失败:',
    ENV_SET_SUCCESS_MSG: '{0}设置成功',
    ENV_SET_FAILED_MSG: '❌ 环境变量设置失败',
    ENV_CLEAR_SUCCESS_MSG: '环境变量已清除',
    ENV_CLEAR_FAILED: '环境变量清除失败:'
  },

  // 更新相关
  update: {
    UPDATING_PACKAGE: '正在更新{0}...',
    UPDATE_COMPLETE: '🎉 更新完成，建议重启终端以使用新版本',
    UPDATE_FAILED: '❌ 更新失败',
    MANUAL_UPDATE_CMD: '手动更新命令: npm install -g {0}',
    CHANGELOG_TITLE: '📋 本次更新内容:',
    NPM_NOT_FOUND: '💡 提示: 未找到npm命令，请确保已安装Node.js和npm',
    NPM_UPDATE_FAILED: 'npm update失败: {0}'
  },

  // 环境变量管理相关
  envManagement: {
    CURRENT_SYSTEM_ENV: '当前系统环境变量: {0}',
    ENV_NOT_DETECTED: '当前配置未检测出环境变量',
    USE_CMD_TO_SET: '使用 {0} 将配置设置到环境变量',
    GET_ENV_FAILED: '获取当前配置环境变量失败:',
    CONFIG_FORMAT_ERROR: 'API配置文件格式不正确',
    INDEX_OUT_OF_RANGE: '{0} 索引超出范围，可用范围: 1-{1}',
    NO_ENV_VARS_SET: '当前没有设置任何相关环境变量',
    WILL_CLEAR_ENV_VARS: '将要清除当前配置{0}的环境变量: ',
    SET_ENV_SUCCESS: '{0}设置成功',
    CLEAR_ENV_FAILED: '清除环境变量失败:',
    ENV_CMD_FAILED: '环境变量命令执行失败:'
  },



  // Claude 配置相关
  claude: {
    API_FORMAT_ERROR: 'api.json文件格式不正确',
    SETTINGS_FORMAT_ERROR: 'settings.json文件格式不正确',
    SWITCHING_CONFIG: '正在切换配置: {0}',
    SWITCHING_ENV: '正在设置系统环境变量...',
    SETTINGS_SUCCESS_ENV_FAILED: 'settings.json更新成功，环境变量更新失败',
    CONFIG_SYNCED: '配置已同步更新到settings.json和系统环境变量',
    CURRENT_CONFIG_DETAILS: '当前配置详情:',
    NAME_LABEL: '名称: {0}',
    URL_LABEL: 'URL: {0}',
    MODEL_LABEL: 'Model: {0}',
    FAST_LABEL: 'Fast: {0}',
    KEY_LABEL: 'Key: {0}',
    TOKEN_LABEL: 'Token: {0}',
    HTTP_LABEL: 'HTTP: {0}',
    HTTPS_LABEL: 'HTTPS: {0}',
    USE_SET_CMD: '请先使用 {0} 命令设置配置文件路径',
    SWITCH_CONFIG_FAILED: '切换配置失败:'
  },

  // 列表相关
  listDisplay: {
    AVAILABLE_API_CONFIGS: '可用的API配置:',
    NO_CONFIGS_AVAILABLE: '暂无可用配置',
    CURRENT_CONFIG: '当前使用的配置: {0}',
    NO_CURRENT_CONFIG: '当前未进行任何配置',
    LIST_FAILED: '列举配置失败:',
    USE_SET_CMD: '请先使用 {0} 命令设置配置文件路径',
    API_FORMAT_ERROR: 'api配置文件格式不正确',
    SETTINGS_FORMAT_ERROR: 'settings.json文件格式不正确'
  },

  // 设置路径相关
  setPaths: {
    SETTINGS_FILE_NOT_EXIST: 'settings.json文件不存在: {0}',
    API_FILE_NOT_EXIST: 'api配置文件不存在: {0}'
  },

  // 清理相关
  clear: {
    CONFIRM: '确认清除所有配置？将清除 settings.json 和系统环境变量中的所有API配置 (y/n):',
    ENV_CONFIRM: '将清除系统环境变量中的所有API配置 请输入 (y/n):',
    CANCELLED: '操作已取消',
    SUCCESS: '配置完全清除成功',
    SETTINGS_CLEARED: 'settings.json中的API配置已清除',
    ENV_CLEARED: '系统环境变量中的API配置已清除',
    PREPARE_TO_CLEAR: '准备清除以下内容:',
    SETTINGS_ENV_CONFIG: 'settings.json 中的环境变量配置:',
    NO_SETTINGS_CONFIG: 'settings.json 中未检测到相关配置',
    SYSTEM_ENV_VARS: '系统环境变量:',
    NO_SYSTEM_ENV_VARS: '系统环境变量中未检测到相关配置',
    CLEAR_PREVIEW_FAILED: '获取清除预览失败:',
    NO_CONFIG_TO_CLEAR: '未检测到任何需要清除的配置',
    WARNING_CLEAR_ALL: '⚠️ 警告: 此操作将完全清除所有相关配置',
    WILL_CLEAR_SETTINGS: '• 清除 settings.json 中的环境变量配置',
    WILL_CLEAR_SYSTEM: '• 清除系统中的相关环境变量',
    SETTINGS_BACKED_UP: 'settings.json 已备份到: {0}',
    SETTINGS_CONFIG_CLEARED: '✓ settings.json 配置已清除',
    SETTINGS_CLEAR_FAILED: '警告: settings.json 清理失败',
    CLEAR_CMD_FAILED: '清理命令执行失败:',
    CANT_READ_SETTINGS: '警告: 无法读取 settings.json 文件'
  },

  // 通用消息
  common: {
    PARAMETER_ERROR: '参数错误:',
    CONFIG_ERROR: '配置错误:',
    AVAILABLE_CONFIGS: '当前可用的配置:',
    INDEX_ERROR: '索引错误:',
    NONE: '无',
    INDEX_OUT_OF_RANGE: '索引 {0} 超出范围，可用范围: {1}'
  },

  // Utils 相关错误
  utils: {
    READ_CONFIG_FAILED: '读取配置失败: {0}',
    SAVE_CONFIG_FAILED: '保存配置失败: {0}',
    SETTINGS_PATH_NOT_SET: '未设置settings.json文件路径',
    API_CONFIG_PATH_NOT_SET: '未设置api配置文件路径',
    FILE_NOT_EXISTS: '文件不存在: {0}',
    UNSUPPORTED_CONFIG_FORMAT: '不支持的配置文件格式: {0}',
    UNIMPLEMENTED_CONFIG_FORMAT: '未实现的配置文件格式: {0}',
    WRITE_FILE_FAILED: '写入文件失败: {0} - {1}',
    UNSUPPORTED_LANGUAGE: '不支持的语言代码。支持的语言：{0}',
    PLATFORM_NOT_SUPPORTED: '不支持该系统: {0} (仅支持 Windows、macOS、Linux)',
    // Latency tester errors
    CONNECTION_TIMEOUT: '连接超时',
    DNS_RESOLUTION_FAILED: '域名解析失败',
    TEST_FAILED: '测试失败: {0}',
    INVALID_LATENCY_DATA: '无效的延迟数据: {0}',
    CONNECTION_REFUSED: '连接被拒绝',
    CONNECTION_RESET: '连接重置',
    HTTP_TEST_FAILED: 'HTTP 测试失败: {0}',
    REQUEST_TIMEOUT: '请求超时',
    URL_PARSING_ERROR: 'URL解析错误: {0}',
    // Environment variable messages
    ENV_SET_FAILED: '环境变量设置失败:',
    ENV_SET_FAILED_KEY: '环境变量设置失败 {0}:',
    ENV_SET_SUCCESS_MSG: '{0}设置成功',
    ENV_DELETE_FAILED: '环境变量删除失败:',
    ENV_CLEAR_FAILED: '环境变量清除失败:',
    ENV_CLEAR_SUCCESS: '环境变量已清除',
    // Validator errors
    SETTINGS_PATH_FORMAT_ERROR: 'settings路径格式错误，请提供绝对路径的settings.json文件',
    API_PATH_FORMAT_ERROR: 'api路径格式错误，请提供绝对路径的配置文件（支持 .json、.json5、.jsonc、.yaml、.yml）'
  }
}
