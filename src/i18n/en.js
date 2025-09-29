// English language file
module.exports = {
  // CLI basic information
  cli: {
    description:
      'A tool for quickly switching Claude Code configurations, supporting URL, API_KEY, AUTH_TOKEN, MODEL quick switching, one-click management of system environment variables, delay speed measurement, automatic optimal line selection, and internationalization support',
    version: 'Show version information'
  },

  // Command descriptions
  commands: {
    set: {
      description: 'Set configuration file paths',
      settingsOption: 'Claude Code settings.json file path',
      apiOption: 'Custom API configuration file path'
    },
    list: {
      description: 'Display current API configuration list',
      alias: 'list'
    },
    claude: {
      description: 'Switch to specified API configuration',
      urlOption: 'Specify URL index to switch to (starting from 1, only valid for array type url)',
      keyOption: 'Specify Key index to switch to (starting from 1, only valid for array type key)',
      tokenOption: 'Specify Token index to switch to (starting from 1, only valid for array type token)',
      modelOption: 'Specify model index to switch to (starting from 1, only valid for array type model)',
      fastOption: 'Specify fast model index to switch to (starting from 1, only valid for array type fast)'
    },
    update: {
      description: 'Update ccapi to latest version'
    },
    env: {
      description: 'Environment variable management: set/view/clear system environment variables',
      urlOption: 'Specify URL index to use (starting from 1, only valid for array type url)',
      keyOption: 'Specify Key index to use (starting from 1, only valid for array type key)',
      tokenOption: 'Specify Token index to use (starting from 1, only valid for array type token)',
      modelOption: 'Specify model index to use (starting from 1, only valid for array type model)',
      fastOption: 'Specify fast model index to use (starting from 1, only valid for array type fast)'
    },
    clear: {
      description:
        'Completely clear configuration: clear both settings.json and system environment variables related API configuration'
    },
    lang: {
      description: 'View or set language',
      current: 'Current language',
      available: 'Available languages',
      usage: 'Usage: ccapi lang [language_code]',
      examples:
        'Examples:\n  ccapi lang     # View current language\n  ccapi lang zh  # Set to Chinese\n  ccapi lang en  # Set to English'
    }
  },

  // Error messages
  errors: {
    CONFIG_NOT_FOUND: 'Configuration file not found, please use ccapi set to set path first',
    SETTINGS_NOT_FOUND: 'settings file does not exist, please check path setting',
    API_CONFIG_NOT_FOUND:
      'api configuration file does not exist, please check path setting (supports JSON, JSON5, YAML, TOML formats)',
    INVALID_JSON: 'JSON file format error',
    INVALID_YAML: 'YAML file format error',
    INVALID_TOML: 'TOML file format error',
    CONFIG_NAME_NOT_FOUND: 'Configuration does not exist',
    SAME_CONFIG: 'Currently already using this configuration',
    BACKUP_FAILED: 'settings file backup failed',
    ENV_SET_FAILED: 'Environment variable setting failed',
    ENV_CLEAR_FAILED: 'Environment variable clearing failed',
    PERMISSION_DENIED: 'Insufficient permissions, cannot modify system environment variables',
    ENV_NOT_FOUND: 'Related environment variable configuration not found',
    PLATFORM_NOT_SUPPORTED: 'Current operating system not supported',
    PROGRAM_ERROR: 'Program error',
    UNHANDLED_PROMISE: 'Unhandled Promise error',
    READ_CONFIG_FAILED: 'Failed to read configuration',
    SAVE_CONFIG_FAILED: 'Failed to save configuration',
    PARAM_ERROR: 'Parameter error',
    SET_FAILED: 'Setting failed',
    INVALID_LANGUAGE: 'Unsupported language code. Supported languages: zh (Chinese), en (English)'
  },

  // Success messages
  success: {
    CONFIG_SAVED: 'Configuration path saved',
    CONFIG_SWITCHED: 'Configuration switched successfully',
    RESTART_TERMINAL: '(Note: Restart Claude Code terminal for configuration to take effect!)',
    BACKUP_CREATED: 'settings file backed up',
    ENV_SET_SUCCESS: 'Environment variable set successfully',
    ENV_CLEAR_SUCCESS: 'Environment variable cleared successfully',
    FULL_CLEAR_SUCCESS: 'Configuration completely cleared successfully',
    ENV_SYNC_SUCCESS: 'Configuration synchronized to environment variables',
    LANGUAGE_SWITCHED: 'Language switched to English'
  },

  // Common prompts
  prompts: {
    CURRENT_CONFIG_PATHS: 'Current configuration paths:',
    WARNING: 'Warning',
    FILE_NOT_EXISTS: 'Current path file does not exist',
    NOT_SET: 'Not set',
    SET_PATHS_HELP: 'Use the following commands to set paths:',
    SET_SETTINGS_HELP: 'Set settings.json path',
    SET_API_HELP: 'Set api.json path',
    PATH_SAVED_ENSURE_EXISTS: 'Path saved, please ensure file exists before using other commands',
    NEW_VERSION_AVAILABLE: '【New version v{0} available, run {1} to update】'
  },

  // List display related
  list: {
    URL: 'URL',
    Model: 'Model',
    Fast: 'Fast',
    Key: 'Key',
    Token: 'Token'
  },


  // Environment variable related
  env: {
    CURRENT_ENV_VARS: 'Current environment variables:',
    NO_ENV_VARS: 'No environment variables set',
    SET_SUCCESS: 'Environment variable set successfully',
    CLEAR_SUCCESS: 'Environment variable cleared successfully',
    CLEAR_ALL_SUCCESS: 'All environment variables cleared successfully',
    PLATFORM_NOT_SUPPORTED: 'Unsupported system: {0} (only supports Windows, macOS, Linux)',
    ENV_SET_FAILED: 'Environment variable setting failed:',
    ENV_DELETE_FAILED: 'Environment variable deletion failed:',
    ENV_SET_SUCCESS_MSG: '{0} set successfully',
    ENV_SET_FAILED_MSG: '❌ Environment variable setting failed',
    ENV_CLEAR_SUCCESS_MSG: 'Environment variables cleared',
    ENV_CLEAR_FAILED: 'Environment variable clearing failed:'
  },

  // Update related
  update: {
    UPDATING_PACKAGE: 'Updating {0}...',
    UPDATE_COMPLETE: '🎉 Update complete, recommend restarting terminal to use new version',
    UPDATE_FAILED: '❌ Update failed',
    MANUAL_UPDATE_CMD: 'Manual update command: npm install -g {0}',
    CHANGELOG_TITLE: '📋 Update contents:',
    NPM_NOT_FOUND: '💡 Tip: npm command not found, please ensure Node.js and npm are installed',
    NPM_UPDATE_FAILED: 'npm update failed: {0}'
  },

  // Environment variable management related
  envManagement: {
    CURRENT_SYSTEM_ENV: 'Current system environment variables: {0}',
    ENV_NOT_DETECTED: 'Current configuration has no environment variables detected',
    USE_CMD_TO_SET: 'Use {0} to set configuration to environment variables',
    GET_ENV_FAILED: 'Failed to get current configuration environment variables:',
    CONFIG_FORMAT_ERROR: 'API configuration file format error',
    INDEX_OUT_OF_RANGE: '{0} index out of range, available range: 1-{1}',
    NO_ENV_VARS_SET: 'No related environment variables currently set',
    WILL_CLEAR_ENV_VARS: 'Will clear environment variables for current configuration {0}: ',
    SET_ENV_SUCCESS: '{0} set successfully',
    CLEAR_ENV_FAILED: 'Failed to clear environment variables:',
    ENV_CMD_FAILED: 'Environment variable command execution failed:'
  },



  // Claude configuration related
  claude: {
    API_FORMAT_ERROR: 'api.json file format error',
    SETTINGS_FORMAT_ERROR: 'settings.json file format error',
    SWITCHING_CONFIG: 'Switching configuration: {0}',
    SWITCHING_ENV: 'Setting system environment variables...',
    SETTINGS_SUCCESS_ENV_FAILED: 'settings.json updated successfully, environment variable update failed',
    CONFIG_SYNCED: 'Configuration synchronized to both settings.json and system environment variables',
    CURRENT_CONFIG_DETAILS: 'Current configuration details:',
    NAME_LABEL: 'Name: {0}',
    URL_LABEL: 'URL: {0}',
    MODEL_LABEL: 'Model: {0}',
    FAST_LABEL: 'Fast: {0}',
    KEY_LABEL: 'Key: {0}',
    TOKEN_LABEL: 'Token: {0}',
    HTTP_LABEL: 'HTTP: {0}',
    HTTPS_LABEL: 'HTTPS: {0}',
    USE_SET_CMD: 'Please use {0} command to set configuration file path first',
    SWITCH_CONFIG_FAILED: 'Switch configuration failed:'
  },

  // List related
  listDisplay: {
    AVAILABLE_API_CONFIGS: 'Available API configurations:',
    NO_CONFIGS_AVAILABLE: 'No configurations available',
    CURRENT_CONFIG: 'Currently using configuration: {0}',
    NO_CURRENT_CONFIG: 'Currently not using any configuration',
    LIST_FAILED: 'List configurations failed:',
    USE_SET_CMD: 'Please use {0} command to set configuration file path first',
    API_FORMAT_ERROR: 'api configuration file format error',
    SETTINGS_FORMAT_ERROR: 'settings.json file format error'
  },

  // Set paths related
  setPaths: {
    SETTINGS_FILE_NOT_EXIST: 'settings.json file does not exist: {0}',
    API_FILE_NOT_EXIST: 'api.json file does not exist: {0}'
  },

  // Clear related
  clear: {
    CONFIRM:
      'This will clear all API configurations in settings.json and system environment variables please enter ? (y/n):',
    ENV_CONFIRM: 'This will clear all API configurations in system environment variables please enter ? (y/n):',
    CANCELLED: 'Operation cancelled',
    SUCCESS: 'Configuration completely cleared successfully',
    SETTINGS_CLEARED: 'API configuration in settings.json cleared',
    ENV_CLEARED: 'API configuration in system environment variables cleared',
    PREPARE_TO_CLEAR: 'Preparing to clear the following content:',
    SETTINGS_ENV_CONFIG: 'Environment variable configuration in settings.json:',
    NO_SETTINGS_CONFIG: 'No related configuration detected in settings.json',
    SYSTEM_ENV_VARS: 'System environment variables:',
    NO_SYSTEM_ENV_VARS: 'No related configuration detected in system environment variables',
    CLEAR_PREVIEW_FAILED: 'Failed to get clear preview:',
    NO_CONFIG_TO_CLEAR: 'No configuration detected that needs to be cleared',
    WARNING_CLEAR_ALL: '⚠️ Warning: This operation will completely clear all related configurations',
    WILL_CLEAR_SETTINGS: '• Clear environment variable configuration in settings.json',
    WILL_CLEAR_SYSTEM: '• Clear related environment variables in system',
    SETTINGS_BACKED_UP: 'settings.json backed up to: {0}',
    SETTINGS_CONFIG_CLEARED: '✓ settings.json configuration cleared',
    SETTINGS_CLEAR_FAILED: 'Warning: settings.json cleanup failed',
    CLEAR_CMD_FAILED: 'Clear command execution failed:',
    CANT_READ_SETTINGS: 'Warning: Cannot read settings.json file'
  },

  // Common messages
  common: {
    PARAMETER_ERROR: 'Parameter error:',
    CONFIG_ERROR: 'Configuration error:',
    AVAILABLE_CONFIGS: 'Currently available configurations:',
    INDEX_ERROR: 'Index error:',
    NONE: 'None',
    INDEX_OUT_OF_RANGE: 'Index {0} out of range, available range: {1}'
  },

  // Utils related errors
  utils: {
    READ_CONFIG_FAILED: 'Failed to read configuration: {0}',
    SAVE_CONFIG_FAILED: 'Failed to save configuration: {0}',
    SETTINGS_PATH_NOT_SET: 'settings.json file path not set',
    API_CONFIG_PATH_NOT_SET: 'API configuration file path not set',
    FILE_NOT_EXISTS: 'File does not exist: {0}',
    UNSUPPORTED_CONFIG_FORMAT: 'Unsupported configuration file format: {0}',
    UNIMPLEMENTED_CONFIG_FORMAT: 'Unimplemented configuration file format: {0}',
    WRITE_FILE_FAILED: 'Failed to write file: {0} - {1}',
    UNSUPPORTED_LANGUAGE: 'Unsupported language code. Supported languages: {0}',
    PLATFORM_NOT_SUPPORTED: 'Unsupported system: {0} (only supports Windows, macOS, Linux)',
    // Latency tester errors
    CONNECTION_TIMEOUT: 'Connection timeout',
    DNS_RESOLUTION_FAILED: 'DNS resolution failed',
    TEST_FAILED: 'Test failed: {0}',
    INVALID_LATENCY_DATA: 'Invalid latency data: {0}',
    CONNECTION_REFUSED: 'Connection refused',
    CONNECTION_RESET: 'Connection reset',
    HTTP_TEST_FAILED: 'HTTP test failed: {0}',
    REQUEST_TIMEOUT: 'Request timeout',
    URL_PARSING_ERROR: 'URL parsing error: {0}',
    // Environment variable messages
    ENV_SET_FAILED: 'Environment variable setting failed:',
    ENV_SET_FAILED_KEY: 'Environment variable setting failed {0}:',
    ENV_SET_SUCCESS_MSG: '{0} set successfully',
    ENV_DELETE_FAILED: 'Environment variable deletion failed:',
    ENV_CLEAR_FAILED: 'Environment variable clearing failed:',
    ENV_CLEAR_SUCCESS: 'Environment variables cleared',
    // Validator errors
    SETTINGS_PATH_FORMAT_ERROR: 'settings path format error, please provide absolute path to settings.json file',
    API_PATH_FORMAT_ERROR:
      'api path format error, please provide absolute path to configuration file (supports .json, .json5, .jsonc, .yaml, .yml)'
  }
}
