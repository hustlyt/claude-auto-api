#!/usr/bin/env node
'use strict';

var require$$0$1 = require('events');
var require$$0$2 = require('child_process');
var require$$1 = require('path');
var require$$3 = require('fs');
var require$$4 = require('process');
var require$$0$3 = require('os');
var require$$1$1 = require('tty');
var require$$4$1 = require('util');
var require$$0$4 = require('constants');
var require$$0$5 = require('stream');
var require$$5 = require('assert');
var require$$1$2 = require('readline');

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

function getAugmentedNamespace(n) {
  if (n.__esModule) return n;
  var f = n.default;
	if (typeof f == "function") {
		var a = function a () {
			if (this instanceof a) {
        return Reflect.construct(f, arguments, this.constructor);
			}
			return f.apply(this, arguments);
		};
		a.prototype = f.prototype;
  } else a = {};
  Object.defineProperty(a, '__esModule', {value: true});
	Object.keys(n).forEach(function (k) {
		var d = Object.getOwnPropertyDescriptor(n, k);
		Object.defineProperty(a, k, d.get ? d : {
			enumerable: true,
			get: function () {
				return n[k];
			}
		});
	});
	return a;
}

var src$1 = {};

var commander = {exports: {}};

var argument = {};

var error = {};

/**
 * CommanderError class
 * @class
 */

let CommanderError$1 = class CommanderError extends Error {
  /**
   * Constructs the CommanderError class
   * @param {number} exitCode suggested exit code which could be used with process.exit
   * @param {string} code an id string representing the error
   * @param {string} message human-readable description of the error
   * @constructor
   */
  constructor(exitCode, code, message) {
    super(message);
    // properly capture stack trace in Node.js
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
    this.code = code;
    this.exitCode = exitCode;
    this.nestedError = undefined;
  }
};

/**
 * InvalidArgumentError class
 * @class
 */
let InvalidArgumentError$2 = class InvalidArgumentError extends CommanderError$1 {
  /**
   * Constructs the InvalidArgumentError class
   * @param {string} [message] explanation of why argument is invalid
   * @constructor
   */
  constructor(message) {
    super(1, 'commander.invalidArgument', message);
    // properly capture stack trace in Node.js
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
  }
};

error.CommanderError = CommanderError$1;
error.InvalidArgumentError = InvalidArgumentError$2;

const { InvalidArgumentError: InvalidArgumentError$1 } = error;

let Argument$1 = class Argument {
  /**
   * Initialize a new command argument with the given name and description.
   * The default is that the argument is required, and you can explicitly
   * indicate this with <> around the name. Put [] around the name for an optional argument.
   *
   * @param {string} name
   * @param {string} [description]
   */

  constructor(name, description) {
    this.description = description || '';
    this.variadic = false;
    this.parseArg = undefined;
    this.defaultValue = undefined;
    this.defaultValueDescription = undefined;
    this.argChoices = undefined;

    switch (name[0]) {
      case '<': // e.g. <required>
        this.required = true;
        this._name = name.slice(1, -1);
        break;
      case '[': // e.g. [optional]
        this.required = false;
        this._name = name.slice(1, -1);
        break;
      default:
        this.required = true;
        this._name = name;
        break;
    }

    if (this._name.length > 3 && this._name.slice(-3) === '...') {
      this.variadic = true;
      this._name = this._name.slice(0, -3);
    }
  }

  /**
   * Return argument name.
   *
   * @return {string}
   */

  name() {
    return this._name;
  }

  /**
   * @api private
   */

  _concatValue(value, previous) {
    if (previous === this.defaultValue || !Array.isArray(previous)) {
      return [value];
    }

    return previous.concat(value);
  }

  /**
   * Set the default value, and optionally supply the description to be displayed in the help.
   *
   * @param {*} value
   * @param {string} [description]
   * @return {Argument}
   */

  default(value, description) {
    this.defaultValue = value;
    this.defaultValueDescription = description;
    return this;
  }

  /**
   * Set the custom handler for processing CLI command arguments into argument values.
   *
   * @param {Function} [fn]
   * @return {Argument}
   */

  argParser(fn) {
    this.parseArg = fn;
    return this;
  }

  /**
   * Only allow argument value to be one of choices.
   *
   * @param {string[]} values
   * @return {Argument}
   */

  choices(values) {
    this.argChoices = values.slice();
    this.parseArg = (arg, previous) => {
      if (!this.argChoices.includes(arg)) {
        throw new InvalidArgumentError$1(`Allowed choices are ${this.argChoices.join(', ')}.`);
      }
      if (this.variadic) {
        return this._concatValue(arg, previous);
      }
      return arg;
    };
    return this;
  }

  /**
   * Make argument required.
   */
  argRequired() {
    this.required = true;
    return this;
  }

  /**
   * Make argument optional.
   */
  argOptional() {
    this.required = false;
    return this;
  }
};

/**
 * Takes an argument and returns its human readable equivalent for help usage.
 *
 * @param {Argument} arg
 * @return {string}
 * @api private
 */

function humanReadableArgName$2(arg) {
  const nameOutput = arg.name() + (arg.variadic === true ? '...' : '');

  return arg.required
    ? '<' + nameOutput + '>'
    : '[' + nameOutput + ']';
}

argument.Argument = Argument$1;
argument.humanReadableArgName = humanReadableArgName$2;

var command = {};

var help = {};

const { humanReadableArgName: humanReadableArgName$1 } = argument;

/**
 * TypeScript import types for JSDoc, used by Visual Studio Code IntelliSense and `npm run typescript-checkJS`
 * https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html#import-types
 * @typedef { import("./argument.js").Argument } Argument
 * @typedef { import("./command.js").Command } Command
 * @typedef { import("./option.js").Option } Option
 */

// Although this is a class, methods are static in style to allow override using subclass or just functions.
let Help$1 = class Help {
  constructor() {
    this.helpWidth = undefined;
    this.sortSubcommands = false;
    this.sortOptions = false;
    this.showGlobalOptions = false;
  }

  /**
   * Get an array of the visible subcommands. Includes a placeholder for the implicit help command, if there is one.
   *
   * @param {Command} cmd
   * @returns {Command[]}
   */

  visibleCommands(cmd) {
    const visibleCommands = cmd.commands.filter(cmd => !cmd._hidden);
    if (cmd._hasImplicitHelpCommand()) {
      // Create a command matching the implicit help command.
      const [, helpName, helpArgs] = cmd._helpCommandnameAndArgs.match(/([^ ]+) *(.*)/);
      const helpCommand = cmd.createCommand(helpName)
        .helpOption(false);
      helpCommand.description(cmd._helpCommandDescription);
      if (helpArgs) helpCommand.arguments(helpArgs);
      visibleCommands.push(helpCommand);
    }
    if (this.sortSubcommands) {
      visibleCommands.sort((a, b) => {
        // @ts-ignore: overloaded return type
        return a.name().localeCompare(b.name());
      });
    }
    return visibleCommands;
  }

  /**
   * Compare options for sort.
   *
   * @param {Option} a
   * @param {Option} b
   * @returns number
   */
  compareOptions(a, b) {
    const getSortKey = (option) => {
      // WYSIWYG for order displayed in help. Short used for comparison if present. No special handling for negated.
      return option.short ? option.short.replace(/^-/, '') : option.long.replace(/^--/, '');
    };
    return getSortKey(a).localeCompare(getSortKey(b));
  }

  /**
   * Get an array of the visible options. Includes a placeholder for the implicit help option, if there is one.
   *
   * @param {Command} cmd
   * @returns {Option[]}
   */

  visibleOptions(cmd) {
    const visibleOptions = cmd.options.filter((option) => !option.hidden);
    // Implicit help
    const showShortHelpFlag = cmd._hasHelpOption && cmd._helpShortFlag && !cmd._findOption(cmd._helpShortFlag);
    const showLongHelpFlag = cmd._hasHelpOption && !cmd._findOption(cmd._helpLongFlag);
    if (showShortHelpFlag || showLongHelpFlag) {
      let helpOption;
      if (!showShortHelpFlag) {
        helpOption = cmd.createOption(cmd._helpLongFlag, cmd._helpDescription);
      } else if (!showLongHelpFlag) {
        helpOption = cmd.createOption(cmd._helpShortFlag, cmd._helpDescription);
      } else {
        helpOption = cmd.createOption(cmd._helpFlags, cmd._helpDescription);
      }
      visibleOptions.push(helpOption);
    }
    if (this.sortOptions) {
      visibleOptions.sort(this.compareOptions);
    }
    return visibleOptions;
  }

  /**
   * Get an array of the visible global options. (Not including help.)
   *
   * @param {Command} cmd
   * @returns {Option[]}
   */

  visibleGlobalOptions(cmd) {
    if (!this.showGlobalOptions) return [];

    const globalOptions = [];
    for (let ancestorCmd = cmd.parent; ancestorCmd; ancestorCmd = ancestorCmd.parent) {
      const visibleOptions = ancestorCmd.options.filter((option) => !option.hidden);
      globalOptions.push(...visibleOptions);
    }
    if (this.sortOptions) {
      globalOptions.sort(this.compareOptions);
    }
    return globalOptions;
  }

  /**
   * Get an array of the arguments if any have a description.
   *
   * @param {Command} cmd
   * @returns {Argument[]}
   */

  visibleArguments(cmd) {
    // Side effect! Apply the legacy descriptions before the arguments are displayed.
    if (cmd._argsDescription) {
      cmd.registeredArguments.forEach(argument => {
        argument.description = argument.description || cmd._argsDescription[argument.name()] || '';
      });
    }

    // If there are any arguments with a description then return all the arguments.
    if (cmd.registeredArguments.find(argument => argument.description)) {
      return cmd.registeredArguments;
    }
    return [];
  }

  /**
   * Get the command term to show in the list of subcommands.
   *
   * @param {Command} cmd
   * @returns {string}
   */

  subcommandTerm(cmd) {
    // Legacy. Ignores custom usage string, and nested commands.
    const args = cmd.registeredArguments.map(arg => humanReadableArgName$1(arg)).join(' ');
    return cmd._name +
      (cmd._aliases[0] ? '|' + cmd._aliases[0] : '') +
      (cmd.options.length ? ' [options]' : '') + // simplistic check for non-help option
      (args ? ' ' + args : '');
  }

  /**
   * Get the option term to show in the list of options.
   *
   * @param {Option} option
   * @returns {string}
   */

  optionTerm(option) {
    return option.flags;
  }

  /**
   * Get the argument term to show in the list of arguments.
   *
   * @param {Argument} argument
   * @returns {string}
   */

  argumentTerm(argument) {
    return argument.name();
  }

  /**
   * Get the longest command term length.
   *
   * @param {Command} cmd
   * @param {Help} helper
   * @returns {number}
   */

  longestSubcommandTermLength(cmd, helper) {
    return helper.visibleCommands(cmd).reduce((max, command) => {
      return Math.max(max, helper.subcommandTerm(command).length);
    }, 0);
  }

  /**
   * Get the longest option term length.
   *
   * @param {Command} cmd
   * @param {Help} helper
   * @returns {number}
   */

  longestOptionTermLength(cmd, helper) {
    return helper.visibleOptions(cmd).reduce((max, option) => {
      return Math.max(max, helper.optionTerm(option).length);
    }, 0);
  }

  /**
   * Get the longest global option term length.
   *
   * @param {Command} cmd
   * @param {Help} helper
   * @returns {number}
   */

  longestGlobalOptionTermLength(cmd, helper) {
    return helper.visibleGlobalOptions(cmd).reduce((max, option) => {
      return Math.max(max, helper.optionTerm(option).length);
    }, 0);
  }

  /**
   * Get the longest argument term length.
   *
   * @param {Command} cmd
   * @param {Help} helper
   * @returns {number}
   */

  longestArgumentTermLength(cmd, helper) {
    return helper.visibleArguments(cmd).reduce((max, argument) => {
      return Math.max(max, helper.argumentTerm(argument).length);
    }, 0);
  }

  /**
   * Get the command usage to be displayed at the top of the built-in help.
   *
   * @param {Command} cmd
   * @returns {string}
   */

  commandUsage(cmd) {
    // Usage
    let cmdName = cmd._name;
    if (cmd._aliases[0]) {
      cmdName = cmdName + '|' + cmd._aliases[0];
    }
    let ancestorCmdNames = '';
    for (let ancestorCmd = cmd.parent; ancestorCmd; ancestorCmd = ancestorCmd.parent) {
      ancestorCmdNames = ancestorCmd.name() + ' ' + ancestorCmdNames;
    }
    return ancestorCmdNames + cmdName + ' ' + cmd.usage();
  }

  /**
   * Get the description for the command.
   *
   * @param {Command} cmd
   * @returns {string}
   */

  commandDescription(cmd) {
    // @ts-ignore: overloaded return type
    return cmd.description();
  }

  /**
   * Get the subcommand summary to show in the list of subcommands.
   * (Fallback to description for backwards compatibility.)
   *
   * @param {Command} cmd
   * @returns {string}
   */

  subcommandDescription(cmd) {
    // @ts-ignore: overloaded return type
    return cmd.summary() || cmd.description();
  }

  /**
   * Get the option description to show in the list of options.
   *
   * @param {Option} option
   * @return {string}
   */

  optionDescription(option) {
    const extraInfo = [];

    if (option.argChoices) {
      extraInfo.push(
        // use stringify to match the display of the default value
        `choices: ${option.argChoices.map((choice) => JSON.stringify(choice)).join(', ')}`);
    }
    if (option.defaultValue !== undefined) {
      // default for boolean and negated more for programmer than end user,
      // but show true/false for boolean option as may be for hand-rolled env or config processing.
      const showDefault = option.required || option.optional ||
        (option.isBoolean() && typeof option.defaultValue === 'boolean');
      if (showDefault) {
        extraInfo.push(`default: ${option.defaultValueDescription || JSON.stringify(option.defaultValue)}`);
      }
    }
    // preset for boolean and negated are more for programmer than end user
    if (option.presetArg !== undefined && option.optional) {
      extraInfo.push(`preset: ${JSON.stringify(option.presetArg)}`);
    }
    if (option.envVar !== undefined) {
      extraInfo.push(`env: ${option.envVar}`);
    }
    if (extraInfo.length > 0) {
      return `${option.description} (${extraInfo.join(', ')})`;
    }

    return option.description;
  }

  /**
   * Get the argument description to show in the list of arguments.
   *
   * @param {Argument} argument
   * @return {string}
   */

  argumentDescription(argument) {
    const extraInfo = [];
    if (argument.argChoices) {
      extraInfo.push(
        // use stringify to match the display of the default value
        `choices: ${argument.argChoices.map((choice) => JSON.stringify(choice)).join(', ')}`);
    }
    if (argument.defaultValue !== undefined) {
      extraInfo.push(`default: ${argument.defaultValueDescription || JSON.stringify(argument.defaultValue)}`);
    }
    if (extraInfo.length > 0) {
      const extraDescripton = `(${extraInfo.join(', ')})`;
      if (argument.description) {
        return `${argument.description} ${extraDescripton}`;
      }
      return extraDescripton;
    }
    return argument.description;
  }

  /**
   * Generate the built-in help text.
   *
   * @param {Command} cmd
   * @param {Help} helper
   * @returns {string}
   */

  formatHelp(cmd, helper) {
    const termWidth = helper.padWidth(cmd, helper);
    const helpWidth = helper.helpWidth || 80;
    const itemIndentWidth = 2;
    const itemSeparatorWidth = 2; // between term and description
    function formatItem(term, description) {
      if (description) {
        const fullText = `${term.padEnd(termWidth + itemSeparatorWidth)}${description}`;
        return helper.wrap(fullText, helpWidth - itemIndentWidth, termWidth + itemSeparatorWidth);
      }
      return term;
    }
    function formatList(textArray) {
      return textArray.join('\n').replace(/^/gm, ' '.repeat(itemIndentWidth));
    }

    // Usage
    let output = [`Usage: ${helper.commandUsage(cmd)}`, ''];

    // Description
    const commandDescription = helper.commandDescription(cmd);
    if (commandDescription.length > 0) {
      output = output.concat([helper.wrap(commandDescription, helpWidth, 0), '']);
    }

    // Arguments
    const argumentList = helper.visibleArguments(cmd).map((argument) => {
      return formatItem(helper.argumentTerm(argument), helper.argumentDescription(argument));
    });
    if (argumentList.length > 0) {
      output = output.concat(['Arguments:', formatList(argumentList), '']);
    }

    // Options
    const optionList = helper.visibleOptions(cmd).map((option) => {
      return formatItem(helper.optionTerm(option), helper.optionDescription(option));
    });
    if (optionList.length > 0) {
      output = output.concat(['Options:', formatList(optionList), '']);
    }

    if (this.showGlobalOptions) {
      const globalOptionList = helper.visibleGlobalOptions(cmd).map((option) => {
        return formatItem(helper.optionTerm(option), helper.optionDescription(option));
      });
      if (globalOptionList.length > 0) {
        output = output.concat(['Global Options:', formatList(globalOptionList), '']);
      }
    }

    // Commands
    const commandList = helper.visibleCommands(cmd).map((cmd) => {
      return formatItem(helper.subcommandTerm(cmd), helper.subcommandDescription(cmd));
    });
    if (commandList.length > 0) {
      output = output.concat(['Commands:', formatList(commandList), '']);
    }

    return output.join('\n');
  }

  /**
   * Calculate the pad width from the maximum term length.
   *
   * @param {Command} cmd
   * @param {Help} helper
   * @returns {number}
   */

  padWidth(cmd, helper) {
    return Math.max(
      helper.longestOptionTermLength(cmd, helper),
      helper.longestGlobalOptionTermLength(cmd, helper),
      helper.longestSubcommandTermLength(cmd, helper),
      helper.longestArgumentTermLength(cmd, helper)
    );
  }

  /**
   * Wrap the given string to width characters per line, with lines after the first indented.
   * Do not wrap if insufficient room for wrapping (minColumnWidth), or string is manually formatted.
   *
   * @param {string} str
   * @param {number} width
   * @param {number} indent
   * @param {number} [minColumnWidth=40]
   * @return {string}
   *
   */

  wrap(str, width, indent, minColumnWidth = 40) {
    // Full \s characters, minus the linefeeds.
    const indents = ' \\f\\t\\v\u00a0\u1680\u2000-\u200a\u202f\u205f\u3000\ufeff';
    // Detect manually wrapped and indented strings by searching for line break followed by spaces.
    const manualIndent = new RegExp(`[\\n][${indents}]+`);
    if (str.match(manualIndent)) return str;
    // Do not wrap if not enough room for a wrapped column of text (as could end up with a word per line).
    const columnWidth = width - indent;
    if (columnWidth < minColumnWidth) return str;

    const leadingStr = str.slice(0, indent);
    const columnText = str.slice(indent).replace('\r\n', '\n');
    const indentString = ' '.repeat(indent);
    const zeroWidthSpace = '\u200B';
    const breaks = `\\s${zeroWidthSpace}`;
    // Match line end (so empty lines don't collapse),
    // or as much text as will fit in column, or excess text up to first break.
    const regex = new RegExp(`\n|.{1,${columnWidth - 1}}([${breaks}]|$)|[^${breaks}]+?([${breaks}]|$)`, 'g');
    const lines = columnText.match(regex) || [];
    return leadingStr + lines.map((line, i) => {
      if (line === '\n') return ''; // preserve empty lines
      return ((i > 0) ? indentString : '') + line.trimEnd();
    }).join('\n');
  }
};

help.Help = Help$1;

var option = {};

const { InvalidArgumentError } = error;

let Option$1 = class Option {
  /**
   * Initialize a new `Option` with the given `flags` and `description`.
   *
   * @param {string} flags
   * @param {string} [description]
   */

  constructor(flags, description) {
    this.flags = flags;
    this.description = description || '';

    this.required = flags.includes('<'); // A value must be supplied when the option is specified.
    this.optional = flags.includes('['); // A value is optional when the option is specified.
    // variadic test ignores <value,...> et al which might be used to describe custom splitting of single argument
    this.variadic = /\w\.\.\.[>\]]$/.test(flags); // The option can take multiple values.
    this.mandatory = false; // The option must have a value after parsing, which usually means it must be specified on command line.
    const optionFlags = splitOptionFlags$1(flags);
    this.short = optionFlags.shortFlag;
    this.long = optionFlags.longFlag;
    this.negate = false;
    if (this.long) {
      this.negate = this.long.startsWith('--no-');
    }
    this.defaultValue = undefined;
    this.defaultValueDescription = undefined;
    this.presetArg = undefined;
    this.envVar = undefined;
    this.parseArg = undefined;
    this.hidden = false;
    this.argChoices = undefined;
    this.conflictsWith = [];
    this.implied = undefined;
  }

  /**
   * Set the default value, and optionally supply the description to be displayed in the help.
   *
   * @param {*} value
   * @param {string} [description]
   * @return {Option}
   */

  default(value, description) {
    this.defaultValue = value;
    this.defaultValueDescription = description;
    return this;
  }

  /**
   * Preset to use when option used without option-argument, especially optional but also boolean and negated.
   * The custom processing (parseArg) is called.
   *
   * @example
   * new Option('--color').default('GREYSCALE').preset('RGB');
   * new Option('--donate [amount]').preset('20').argParser(parseFloat);
   *
   * @param {*} arg
   * @return {Option}
   */

  preset(arg) {
    this.presetArg = arg;
    return this;
  }

  /**
   * Add option name(s) that conflict with this option.
   * An error will be displayed if conflicting options are found during parsing.
   *
   * @example
   * new Option('--rgb').conflicts('cmyk');
   * new Option('--js').conflicts(['ts', 'jsx']);
   *
   * @param {string | string[]} names
   * @return {Option}
   */

  conflicts(names) {
    this.conflictsWith = this.conflictsWith.concat(names);
    return this;
  }

  /**
   * Specify implied option values for when this option is set and the implied options are not.
   *
   * The custom processing (parseArg) is not called on the implied values.
   *
   * @example
   * program
   *   .addOption(new Option('--log', 'write logging information to file'))
   *   .addOption(new Option('--trace', 'log extra details').implies({ log: 'trace.txt' }));
   *
   * @param {Object} impliedOptionValues
   * @return {Option}
   */
  implies(impliedOptionValues) {
    let newImplied = impliedOptionValues;
    if (typeof impliedOptionValues === 'string') {
      // string is not documented, but easy mistake and we can do what user probably intended.
      newImplied = { [impliedOptionValues]: true };
    }
    this.implied = Object.assign(this.implied || {}, newImplied);
    return this;
  }

  /**
   * Set environment variable to check for option value.
   *
   * An environment variable is only used if when processed the current option value is
   * undefined, or the source of the current value is 'default' or 'config' or 'env'.
   *
   * @param {string} name
   * @return {Option}
   */

  env(name) {
    this.envVar = name;
    return this;
  }

  /**
   * Set the custom handler for processing CLI option arguments into option values.
   *
   * @param {Function} [fn]
   * @return {Option}
   */

  argParser(fn) {
    this.parseArg = fn;
    return this;
  }

  /**
   * Whether the option is mandatory and must have a value after parsing.
   *
   * @param {boolean} [mandatory=true]
   * @return {Option}
   */

  makeOptionMandatory(mandatory = true) {
    this.mandatory = !!mandatory;
    return this;
  }

  /**
   * Hide option in help.
   *
   * @param {boolean} [hide=true]
   * @return {Option}
   */

  hideHelp(hide = true) {
    this.hidden = !!hide;
    return this;
  }

  /**
   * @api private
   */

  _concatValue(value, previous) {
    if (previous === this.defaultValue || !Array.isArray(previous)) {
      return [value];
    }

    return previous.concat(value);
  }

  /**
   * Only allow option value to be one of choices.
   *
   * @param {string[]} values
   * @return {Option}
   */

  choices(values) {
    this.argChoices = values.slice();
    this.parseArg = (arg, previous) => {
      if (!this.argChoices.includes(arg)) {
        throw new InvalidArgumentError(`Allowed choices are ${this.argChoices.join(', ')}.`);
      }
      if (this.variadic) {
        return this._concatValue(arg, previous);
      }
      return arg;
    };
    return this;
  }

  /**
   * Return option name.
   *
   * @return {string}
   */

  name() {
    if (this.long) {
      return this.long.replace(/^--/, '');
    }
    return this.short.replace(/^-/, '');
  }

  /**
   * Return option name, in a camelcase format that can be used
   * as a object attribute key.
   *
   * @return {string}
   * @api private
   */

  attributeName() {
    return camelcase(this.name().replace(/^no-/, ''));
  }

  /**
   * Check if `arg` matches the short or long flag.
   *
   * @param {string} arg
   * @return {boolean}
   * @api private
   */

  is(arg) {
    return this.short === arg || this.long === arg;
  }

  /**
   * Return whether a boolean option.
   *
   * Options are one of boolean, negated, required argument, or optional argument.
   *
   * @return {boolean}
   * @api private
   */

  isBoolean() {
    return !this.required && !this.optional && !this.negate;
  }
};

/**
 * This class is to make it easier to work with dual options, without changing the existing
 * implementation. We support separate dual options for separate positive and negative options,
 * like `--build` and `--no-build`, which share a single option value. This works nicely for some
 * use cases, but is tricky for others where we want separate behaviours despite
 * the single shared option value.
 */
let DualOptions$1 = class DualOptions {
  /**
   * @param {Option[]} options
   */
  constructor(options) {
    this.positiveOptions = new Map();
    this.negativeOptions = new Map();
    this.dualOptions = new Set();
    options.forEach(option => {
      if (option.negate) {
        this.negativeOptions.set(option.attributeName(), option);
      } else {
        this.positiveOptions.set(option.attributeName(), option);
      }
    });
    this.negativeOptions.forEach((value, key) => {
      if (this.positiveOptions.has(key)) {
        this.dualOptions.add(key);
      }
    });
  }

  /**
   * Did the value come from the option, and not from possible matching dual option?
   *
   * @param {*} value
   * @param {Option} option
   * @returns {boolean}
   */
  valueFromOption(value, option) {
    const optionKey = option.attributeName();
    if (!this.dualOptions.has(optionKey)) return true;

    // Use the value to deduce if (probably) came from the option.
    const preset = this.negativeOptions.get(optionKey).presetArg;
    const negativeValue = (preset !== undefined) ? preset : false;
    return option.negate === (negativeValue === value);
  }
};

/**
 * Convert string from kebab-case to camelCase.
 *
 * @param {string} str
 * @return {string}
 * @api private
 */

function camelcase(str) {
  return str.split('-').reduce((str, word) => {
    return str + word[0].toUpperCase() + word.slice(1);
  });
}

/**
 * Split the short and long flag out of something like '-m,--mixed <value>'
 *
 * @api private
 */

function splitOptionFlags$1(flags) {
  let shortFlag;
  let longFlag;
  // Use original very loose parsing to maintain backwards compatibility for now,
  // which allowed for example unintended `-sw, --short-word` [sic].
  const flagParts = flags.split(/[ |,]+/);
  if (flagParts.length > 1 && !/^[[<]/.test(flagParts[1])) shortFlag = flagParts.shift();
  longFlag = flagParts.shift();
  // Add support for lone short flag without significantly changing parsing!
  if (!shortFlag && /^-[^-]$/.test(longFlag)) {
    shortFlag = longFlag;
    longFlag = undefined;
  }
  return { shortFlag, longFlag };
}

option.Option = Option$1;
option.splitOptionFlags = splitOptionFlags$1;
option.DualOptions = DualOptions$1;

var suggestSimilar$2 = {};

const maxDistance = 3;

function editDistance(a, b) {
  // https://en.wikipedia.org/wiki/Damerau–Levenshtein_distance
  // Calculating optimal string alignment distance, no substring is edited more than once.
  // (Simple implementation.)

  // Quick early exit, return worst case.
  if (Math.abs(a.length - b.length) > maxDistance) return Math.max(a.length, b.length);

  // distance between prefix substrings of a and b
  const d = [];

  // pure deletions turn a into empty string
  for (let i = 0; i <= a.length; i++) {
    d[i] = [i];
  }
  // pure insertions turn empty string into b
  for (let j = 0; j <= b.length; j++) {
    d[0][j] = j;
  }

  // fill matrix
  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      let cost = 1;
      if (a[i - 1] === b[j - 1]) {
        cost = 0;
      } else {
        cost = 1;
      }
      d[i][j] = Math.min(
        d[i - 1][j] + 1, // deletion
        d[i][j - 1] + 1, // insertion
        d[i - 1][j - 1] + cost // substitution
      );
      // transposition
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }

  return d[a.length][b.length];
}

/**
 * Find close matches, restricted to same number of edits.
 *
 * @param {string} word
 * @param {string[]} candidates
 * @returns {string}
 */

function suggestSimilar$1(word, candidates) {
  if (!candidates || candidates.length === 0) return '';
  // remove possible duplicates
  candidates = Array.from(new Set(candidates));

  const searchingOptions = word.startsWith('--');
  if (searchingOptions) {
    word = word.slice(2);
    candidates = candidates.map(candidate => candidate.slice(2));
  }

  let similar = [];
  let bestDistance = maxDistance;
  const minSimilarity = 0.4;
  candidates.forEach((candidate) => {
    if (candidate.length <= 1) return; // no one character guesses

    const distance = editDistance(word, candidate);
    const length = Math.max(word.length, candidate.length);
    const similarity = (length - distance) / length;
    if (similarity > minSimilarity) {
      if (distance < bestDistance) {
        // better edit distance, throw away previous worse matches
        bestDistance = distance;
        similar = [candidate];
      } else if (distance === bestDistance) {
        similar.push(candidate);
      }
    }
  });

  similar.sort((a, b) => a.localeCompare(b));
  if (searchingOptions) {
    similar = similar.map(candidate => `--${candidate}`);
  }

  if (similar.length > 1) {
    return `\n(Did you mean one of ${similar.join(', ')}?)`;
  }
  if (similar.length === 1) {
    return `\n(Did you mean ${similar[0]}?)`;
  }
  return '';
}

suggestSimilar$2.suggestSimilar = suggestSimilar$1;

const EventEmitter = require$$0$1.EventEmitter;
const childProcess = require$$0$2;
const path$i = require$$1;
const fs$l = require$$3;
const process$1 = require$$4;

const { Argument, humanReadableArgName } = argument;
const { CommanderError } = error;
const { Help } = help;
const { Option, splitOptionFlags, DualOptions } = option;
const { suggestSimilar } = suggestSimilar$2;

let Command$1 = class Command extends EventEmitter {
  /**
   * Initialize a new `Command`.
   *
   * @param {string} [name]
   */

  constructor(name) {
    super();
    /** @type {Command[]} */
    this.commands = [];
    /** @type {Option[]} */
    this.options = [];
    this.parent = null;
    this._allowUnknownOption = false;
    this._allowExcessArguments = true;
    /** @type {Argument[]} */
    this.registeredArguments = [];
    this._args = this.registeredArguments; // deprecated old name
    /** @type {string[]} */
    this.args = []; // cli args with options removed
    this.rawArgs = [];
    this.processedArgs = []; // like .args but after custom processing and collecting variadic
    this._scriptPath = null;
    this._name = name || '';
    this._optionValues = {};
    this._optionValueSources = {}; // default, env, cli etc
    this._storeOptionsAsProperties = false;
    this._actionHandler = null;
    this._executableHandler = false;
    this._executableFile = null; // custom name for executable
    this._executableDir = null; // custom search directory for subcommands
    this._defaultCommandName = null;
    this._exitCallback = null;
    this._aliases = [];
    this._combineFlagAndOptionalValue = true;
    this._description = '';
    this._summary = '';
    this._argsDescription = undefined; // legacy
    this._enablePositionalOptions = false;
    this._passThroughOptions = false;
    this._lifeCycleHooks = {}; // a hash of arrays
    /** @type {boolean | string} */
    this._showHelpAfterError = false;
    this._showSuggestionAfterError = true;

    // see .configureOutput() for docs
    this._outputConfiguration = {
      writeOut: (str) => process$1.stdout.write(str),
      writeErr: (str) => process$1.stderr.write(str),
      getOutHelpWidth: () => process$1.stdout.isTTY ? process$1.stdout.columns : undefined,
      getErrHelpWidth: () => process$1.stderr.isTTY ? process$1.stderr.columns : undefined,
      outputError: (str, write) => write(str)
    };

    this._hidden = false;
    this._hasHelpOption = true;
    this._helpFlags = '-h, --help';
    this._helpDescription = 'display help for command';
    this._helpShortFlag = '-h';
    this._helpLongFlag = '--help';
    this._addImplicitHelpCommand = undefined; // Deliberately undefined, not decided whether true or false
    this._helpCommandName = 'help';
    this._helpCommandnameAndArgs = 'help [command]';
    this._helpCommandDescription = 'display help for command';
    this._helpConfiguration = {};
  }

  /**
   * Copy settings that are useful to have in common across root command and subcommands.
   *
   * (Used internally when adding a command using `.command()` so subcommands inherit parent settings.)
   *
   * @param {Command} sourceCommand
   * @return {Command} `this` command for chaining
   */
  copyInheritedSettings(sourceCommand) {
    this._outputConfiguration = sourceCommand._outputConfiguration;
    this._hasHelpOption = sourceCommand._hasHelpOption;
    this._helpFlags = sourceCommand._helpFlags;
    this._helpDescription = sourceCommand._helpDescription;
    this._helpShortFlag = sourceCommand._helpShortFlag;
    this._helpLongFlag = sourceCommand._helpLongFlag;
    this._helpCommandName = sourceCommand._helpCommandName;
    this._helpCommandnameAndArgs = sourceCommand._helpCommandnameAndArgs;
    this._helpCommandDescription = sourceCommand._helpCommandDescription;
    this._helpConfiguration = sourceCommand._helpConfiguration;
    this._exitCallback = sourceCommand._exitCallback;
    this._storeOptionsAsProperties = sourceCommand._storeOptionsAsProperties;
    this._combineFlagAndOptionalValue = sourceCommand._combineFlagAndOptionalValue;
    this._allowExcessArguments = sourceCommand._allowExcessArguments;
    this._enablePositionalOptions = sourceCommand._enablePositionalOptions;
    this._showHelpAfterError = sourceCommand._showHelpAfterError;
    this._showSuggestionAfterError = sourceCommand._showSuggestionAfterError;

    return this;
  }

  /**
   * @returns {Command[]}
   * @api private
   */

  _getCommandAndAncestors() {
    const result = [];
    for (let command = this; command; command = command.parent) {
      result.push(command);
    }
    return result;
  }

  /**
   * Define a command.
   *
   * There are two styles of command: pay attention to where to put the description.
   *
   * @example
   * // Command implemented using action handler (description is supplied separately to `.command`)
   * program
   *   .command('clone <source> [destination]')
   *   .description('clone a repository into a newly created directory')
   *   .action((source, destination) => {
   *     console.log('clone command called');
   *   });
   *
   * // Command implemented using separate executable file (description is second parameter to `.command`)
   * program
   *   .command('start <service>', 'start named service')
   *   .command('stop [service]', 'stop named service, or all if no name supplied');
   *
   * @param {string} nameAndArgs - command name and arguments, args are `<required>` or `[optional]` and last may also be `variadic...`
   * @param {Object|string} [actionOptsOrExecDesc] - configuration options (for action), or description (for executable)
   * @param {Object} [execOpts] - configuration options (for executable)
   * @return {Command} returns new command for action handler, or `this` for executable command
   */

  command(nameAndArgs, actionOptsOrExecDesc, execOpts) {
    let desc = actionOptsOrExecDesc;
    let opts = execOpts;
    if (typeof desc === 'object' && desc !== null) {
      opts = desc;
      desc = null;
    }
    opts = opts || {};
    const [, name, args] = nameAndArgs.match(/([^ ]+) *(.*)/);

    const cmd = this.createCommand(name);
    if (desc) {
      cmd.description(desc);
      cmd._executableHandler = true;
    }
    if (opts.isDefault) this._defaultCommandName = cmd._name;
    cmd._hidden = !!(opts.noHelp || opts.hidden); // noHelp is deprecated old name for hidden
    cmd._executableFile = opts.executableFile || null; // Custom name for executable file, set missing to null to match constructor
    if (args) cmd.arguments(args);
    this.commands.push(cmd);
    cmd.parent = this;
    cmd.copyInheritedSettings(this);

    if (desc) return this;
    return cmd;
  }

  /**
   * Factory routine to create a new unattached command.
   *
   * See .command() for creating an attached subcommand, which uses this routine to
   * create the command. You can override createCommand to customise subcommands.
   *
   * @param {string} [name]
   * @return {Command} new command
   */

  createCommand(name) {
    return new Command(name);
  }

  /**
   * You can customise the help with a subclass of Help by overriding createHelp,
   * or by overriding Help properties using configureHelp().
   *
   * @return {Help}
   */

  createHelp() {
    return Object.assign(new Help(), this.configureHelp());
  }

  /**
   * You can customise the help by overriding Help properties using configureHelp(),
   * or with a subclass of Help by overriding createHelp().
   *
   * @param {Object} [configuration] - configuration options
   * @return {Command|Object} `this` command for chaining, or stored configuration
   */

  configureHelp(configuration) {
    if (configuration === undefined) return this._helpConfiguration;

    this._helpConfiguration = configuration;
    return this;
  }

  /**
   * The default output goes to stdout and stderr. You can customise this for special
   * applications. You can also customise the display of errors by overriding outputError.
   *
   * The configuration properties are all functions:
   *
   *     // functions to change where being written, stdout and stderr
   *     writeOut(str)
   *     writeErr(str)
   *     // matching functions to specify width for wrapping help
   *     getOutHelpWidth()
   *     getErrHelpWidth()
   *     // functions based on what is being written out
   *     outputError(str, write) // used for displaying errors, and not used for displaying help
   *
   * @param {Object} [configuration] - configuration options
   * @return {Command|Object} `this` command for chaining, or stored configuration
   */

  configureOutput(configuration) {
    if (configuration === undefined) return this._outputConfiguration;

    Object.assign(this._outputConfiguration, configuration);
    return this;
  }

  /**
   * Display the help or a custom message after an error occurs.
   *
   * @param {boolean|string} [displayHelp]
   * @return {Command} `this` command for chaining
   */
  showHelpAfterError(displayHelp = true) {
    if (typeof displayHelp !== 'string') displayHelp = !!displayHelp;
    this._showHelpAfterError = displayHelp;
    return this;
  }

  /**
   * Display suggestion of similar commands for unknown commands, or options for unknown options.
   *
   * @param {boolean} [displaySuggestion]
   * @return {Command} `this` command for chaining
   */
  showSuggestionAfterError(displaySuggestion = true) {
    this._showSuggestionAfterError = !!displaySuggestion;
    return this;
  }

  /**
   * Add a prepared subcommand.
   *
   * See .command() for creating an attached subcommand which inherits settings from its parent.
   *
   * @param {Command} cmd - new subcommand
   * @param {Object} [opts] - configuration options
   * @return {Command} `this` command for chaining
   */

  addCommand(cmd, opts) {
    if (!cmd._name) {
      throw new Error(`Command passed to .addCommand() must have a name
- specify the name in Command constructor or using .name()`);
    }

    opts = opts || {};
    if (opts.isDefault) this._defaultCommandName = cmd._name;
    if (opts.noHelp || opts.hidden) cmd._hidden = true; // modifying passed command due to existing implementation

    this.commands.push(cmd);
    cmd.parent = this;
    return this;
  }

  /**
   * Factory routine to create a new unattached argument.
   *
   * See .argument() for creating an attached argument, which uses this routine to
   * create the argument. You can override createArgument to return a custom argument.
   *
   * @param {string} name
   * @param {string} [description]
   * @return {Argument} new argument
   */

  createArgument(name, description) {
    return new Argument(name, description);
  }

  /**
   * Define argument syntax for command.
   *
   * The default is that the argument is required, and you can explicitly
   * indicate this with <> around the name. Put [] around the name for an optional argument.
   *
   * @example
   * program.argument('<input-file>');
   * program.argument('[output-file]');
   *
   * @param {string} name
   * @param {string} [description]
   * @param {Function|*} [fn] - custom argument processing function
   * @param {*} [defaultValue]
   * @return {Command} `this` command for chaining
   */
  argument(name, description, fn, defaultValue) {
    const argument = this.createArgument(name, description);
    if (typeof fn === 'function') {
      argument.default(defaultValue).argParser(fn);
    } else {
      argument.default(fn);
    }
    this.addArgument(argument);
    return this;
  }

  /**
   * Define argument syntax for command, adding multiple at once (without descriptions).
   *
   * See also .argument().
   *
   * @example
   * program.arguments('<cmd> [env]');
   *
   * @param {string} names
   * @return {Command} `this` command for chaining
   */

  arguments(names) {
    names.trim().split(/ +/).forEach((detail) => {
      this.argument(detail);
    });
    return this;
  }

  /**
   * Define argument syntax for command, adding a prepared argument.
   *
   * @param {Argument} argument
   * @return {Command} `this` command for chaining
   */
  addArgument(argument) {
    const previousArgument = this.registeredArguments.slice(-1)[0];
    if (previousArgument && previousArgument.variadic) {
      throw new Error(`only the last argument can be variadic '${previousArgument.name()}'`);
    }
    if (argument.required && argument.defaultValue !== undefined && argument.parseArg === undefined) {
      throw new Error(`a default value for a required argument is never used: '${argument.name()}'`);
    }
    this.registeredArguments.push(argument);
    return this;
  }

  /**
   * Override default decision whether to add implicit help command.
   *
   *    addHelpCommand() // force on
   *    addHelpCommand(false); // force off
   *    addHelpCommand('help [cmd]', 'display help for [cmd]'); // force on with custom details
   *
   * @return {Command} `this` command for chaining
   */

  addHelpCommand(enableOrNameAndArgs, description) {
    if (enableOrNameAndArgs === false) {
      this._addImplicitHelpCommand = false;
    } else {
      this._addImplicitHelpCommand = true;
      if (typeof enableOrNameAndArgs === 'string') {
        this._helpCommandName = enableOrNameAndArgs.split(' ')[0];
        this._helpCommandnameAndArgs = enableOrNameAndArgs;
      }
      this._helpCommandDescription = description || this._helpCommandDescription;
    }
    return this;
  }

  /**
   * @return {boolean}
   * @api private
   */

  _hasImplicitHelpCommand() {
    if (this._addImplicitHelpCommand === undefined) {
      return this.commands.length && !this._actionHandler && !this._findCommand('help');
    }
    return this._addImplicitHelpCommand;
  }

  /**
   * Add hook for life cycle event.
   *
   * @param {string} event
   * @param {Function} listener
   * @return {Command} `this` command for chaining
   */

  hook(event, listener) {
    const allowedValues = ['preSubcommand', 'preAction', 'postAction'];
    if (!allowedValues.includes(event)) {
      throw new Error(`Unexpected value for event passed to hook : '${event}'.
Expecting one of '${allowedValues.join("', '")}'`);
    }
    if (this._lifeCycleHooks[event]) {
      this._lifeCycleHooks[event].push(listener);
    } else {
      this._lifeCycleHooks[event] = [listener];
    }
    return this;
  }

  /**
   * Register callback to use as replacement for calling process.exit.
   *
   * @param {Function} [fn] optional callback which will be passed a CommanderError, defaults to throwing
   * @return {Command} `this` command for chaining
   */

  exitOverride(fn) {
    if (fn) {
      this._exitCallback = fn;
    } else {
      this._exitCallback = (err) => {
        if (err.code !== 'commander.executeSubCommandAsync') {
          throw err;
        }
      };
    }
    return this;
  }

  /**
   * Call process.exit, and _exitCallback if defined.
   *
   * @param {number} exitCode exit code for using with process.exit
   * @param {string} code an id string representing the error
   * @param {string} message human-readable description of the error
   * @return never
   * @api private
   */

  _exit(exitCode, code, message) {
    if (this._exitCallback) {
      this._exitCallback(new CommanderError(exitCode, code, message));
      // Expecting this line is not reached.
    }
    process$1.exit(exitCode);
  }

  /**
   * Register callback `fn` for the command.
   *
   * @example
   * program
   *   .command('serve')
   *   .description('start service')
   *   .action(function() {
   *      // do work here
   *   });
   *
   * @param {Function} fn
   * @return {Command} `this` command for chaining
   */

  action(fn) {
    const listener = (args) => {
      // The .action callback takes an extra parameter which is the command or options.
      const expectedArgsCount = this.registeredArguments.length;
      const actionArgs = args.slice(0, expectedArgsCount);
      if (this._storeOptionsAsProperties) {
        actionArgs[expectedArgsCount] = this; // backwards compatible "options"
      } else {
        actionArgs[expectedArgsCount] = this.opts();
      }
      actionArgs.push(this);

      return fn.apply(this, actionArgs);
    };
    this._actionHandler = listener;
    return this;
  }

  /**
   * Factory routine to create a new unattached option.
   *
   * See .option() for creating an attached option, which uses this routine to
   * create the option. You can override createOption to return a custom option.
   *
   * @param {string} flags
   * @param {string} [description]
   * @return {Option} new option
   */

  createOption(flags, description) {
    return new Option(flags, description);
  }

  /**
   * Wrap parseArgs to catch 'commander.invalidArgument'.
   *
   * @param {Option | Argument} target
   * @param {string} value
   * @param {*} previous
   * @param {string} invalidArgumentMessage
   * @api private
   */

  _callParseArg(target, value, previous, invalidArgumentMessage) {
    try {
      return target.parseArg(value, previous);
    } catch (err) {
      if (err.code === 'commander.invalidArgument') {
        const message = `${invalidArgumentMessage} ${err.message}`;
        this.error(message, { exitCode: err.exitCode, code: err.code });
      }
      throw err;
    }
  }

  /**
   * Add an option.
   *
   * @param {Option} option
   * @return {Command} `this` command for chaining
   */
  addOption(option) {
    const oname = option.name();
    const name = option.attributeName();

    // store default value
    if (option.negate) {
      // --no-foo is special and defaults foo to true, unless a --foo option is already defined
      const positiveLongFlag = option.long.replace(/^--no-/, '--');
      if (!this._findOption(positiveLongFlag)) {
        this.setOptionValueWithSource(name, option.defaultValue === undefined ? true : option.defaultValue, 'default');
      }
    } else if (option.defaultValue !== undefined) {
      this.setOptionValueWithSource(name, option.defaultValue, 'default');
    }

    // register the option
    this.options.push(option);

    // handler for cli and env supplied values
    const handleOptionValue = (val, invalidValueMessage, valueSource) => {
      // val is null for optional option used without an optional-argument.
      // val is undefined for boolean and negated option.
      if (val == null && option.presetArg !== undefined) {
        val = option.presetArg;
      }

      // custom processing
      const oldValue = this.getOptionValue(name);
      if (val !== null && option.parseArg) {
        val = this._callParseArg(option, val, oldValue, invalidValueMessage);
      } else if (val !== null && option.variadic) {
        val = option._concatValue(val, oldValue);
      }

      // Fill-in appropriate missing values. Long winded but easy to follow.
      if (val == null) {
        if (option.negate) {
          val = false;
        } else if (option.isBoolean() || option.optional) {
          val = true;
        } else {
          val = ''; // not normal, parseArg might have failed or be a mock function for testing
        }
      }
      this.setOptionValueWithSource(name, val, valueSource);
    };

    this.on('option:' + oname, (val) => {
      const invalidValueMessage = `error: option '${option.flags}' argument '${val}' is invalid.`;
      handleOptionValue(val, invalidValueMessage, 'cli');
    });

    if (option.envVar) {
      this.on('optionEnv:' + oname, (val) => {
        const invalidValueMessage = `error: option '${option.flags}' value '${val}' from env '${option.envVar}' is invalid.`;
        handleOptionValue(val, invalidValueMessage, 'env');
      });
    }

    return this;
  }

  /**
   * Internal implementation shared by .option() and .requiredOption()
   *
   * @api private
   */
  _optionEx(config, flags, description, fn, defaultValue) {
    if (typeof flags === 'object' && flags instanceof Option) {
      throw new Error('To add an Option object use addOption() instead of option() or requiredOption()');
    }
    const option = this.createOption(flags, description);
    option.makeOptionMandatory(!!config.mandatory);
    if (typeof fn === 'function') {
      option.default(defaultValue).argParser(fn);
    } else if (fn instanceof RegExp) {
      // deprecated
      const regex = fn;
      fn = (val, def) => {
        const m = regex.exec(val);
        return m ? m[0] : def;
      };
      option.default(defaultValue).argParser(fn);
    } else {
      option.default(fn);
    }

    return this.addOption(option);
  }

  /**
   * Define option with `flags`, `description`, and optional argument parsing function or `defaultValue` or both.
   *
   * The `flags` string contains the short and/or long flags, separated by comma, a pipe or space. A required
   * option-argument is indicated by `<>` and an optional option-argument by `[]`.
   *
   * See the README for more details, and see also addOption() and requiredOption().
   *
   * @example
   * program
   *     .option('-p, --pepper', 'add pepper')
   *     .option('-p, --pizza-type <TYPE>', 'type of pizza') // required option-argument
   *     .option('-c, --cheese [CHEESE]', 'add extra cheese', 'mozzarella') // optional option-argument with default
   *     .option('-t, --tip <VALUE>', 'add tip to purchase cost', parseFloat) // custom parse function
   *
   * @param {string} flags
   * @param {string} [description]
   * @param {Function|*} [parseArg] - custom option processing function or default value
   * @param {*} [defaultValue]
   * @return {Command} `this` command for chaining
   */

  option(flags, description, parseArg, defaultValue) {
    return this._optionEx({}, flags, description, parseArg, defaultValue);
  }

  /**
  * Add a required option which must have a value after parsing. This usually means
  * the option must be specified on the command line. (Otherwise the same as .option().)
  *
  * The `flags` string contains the short and/or long flags, separated by comma, a pipe or space.
  *
  * @param {string} flags
  * @param {string} [description]
  * @param {Function|*} [parseArg] - custom option processing function or default value
  * @param {*} [defaultValue]
  * @return {Command} `this` command for chaining
  */

  requiredOption(flags, description, parseArg, defaultValue) {
    return this._optionEx({ mandatory: true }, flags, description, parseArg, defaultValue);
  }

  /**
   * Alter parsing of short flags with optional values.
   *
   * @example
   * // for `.option('-f,--flag [value]'):
   * program.combineFlagAndOptionalValue(true);  // `-f80` is treated like `--flag=80`, this is the default behaviour
   * program.combineFlagAndOptionalValue(false) // `-fb` is treated like `-f -b`
   *
   * @param {Boolean} [combine=true] - if `true` or omitted, an optional value can be specified directly after the flag.
   */
  combineFlagAndOptionalValue(combine = true) {
    this._combineFlagAndOptionalValue = !!combine;
    return this;
  }

  /**
   * Allow unknown options on the command line.
   *
   * @param {Boolean} [allowUnknown=true] - if `true` or omitted, no error will be thrown
   * for unknown options.
   */
  allowUnknownOption(allowUnknown = true) {
    this._allowUnknownOption = !!allowUnknown;
    return this;
  }

  /**
   * Allow excess command-arguments on the command line. Pass false to make excess arguments an error.
   *
   * @param {Boolean} [allowExcess=true] - if `true` or omitted, no error will be thrown
   * for excess arguments.
   */
  allowExcessArguments(allowExcess = true) {
    this._allowExcessArguments = !!allowExcess;
    return this;
  }

  /**
   * Enable positional options. Positional means global options are specified before subcommands which lets
   * subcommands reuse the same option names, and also enables subcommands to turn on passThroughOptions.
   * The default behaviour is non-positional and global options may appear anywhere on the command line.
   *
   * @param {Boolean} [positional=true]
   */
  enablePositionalOptions(positional = true) {
    this._enablePositionalOptions = !!positional;
    return this;
  }

  /**
   * Pass through options that come after command-arguments rather than treat them as command-options,
   * so actual command-options come before command-arguments. Turning this on for a subcommand requires
   * positional options to have been enabled on the program (parent commands).
   * The default behaviour is non-positional and options may appear before or after command-arguments.
   *
   * @param {Boolean} [passThrough=true]
   * for unknown options.
   */
  passThroughOptions(passThrough = true) {
    this._passThroughOptions = !!passThrough;
    if (!!this.parent && passThrough && !this.parent._enablePositionalOptions) {
      throw new Error('passThroughOptions can not be used without turning on enablePositionalOptions for parent command(s)');
    }
    return this;
  }

  /**
    * Whether to store option values as properties on command object,
    * or store separately (specify false). In both cases the option values can be accessed using .opts().
    *
    * @param {boolean} [storeAsProperties=true]
    * @return {Command} `this` command for chaining
    */

  storeOptionsAsProperties(storeAsProperties = true) {
    if (this.options.length) {
      throw new Error('call .storeOptionsAsProperties() before adding options');
    }
    // if (Object.keys(this._optionValues).length) {
    //   throw new Error('call .storeOptionsAsProperties() before setting option values');
    // }
    this._storeOptionsAsProperties = !!storeAsProperties;
    return this;
  }

  /**
   * Retrieve option value.
   *
   * @param {string} key
   * @return {Object} value
   */

  getOptionValue(key) {
    if (this._storeOptionsAsProperties) {
      return this[key];
    }
    return this._optionValues[key];
  }

  /**
   * Store option value.
   *
   * @param {string} key
   * @param {Object} value
   * @return {Command} `this` command for chaining
   */

  setOptionValue(key, value) {
    return this.setOptionValueWithSource(key, value, undefined);
  }

  /**
    * Store option value and where the value came from.
    *
    * @param {string} key
    * @param {Object} value
    * @param {string} source - expected values are default/config/env/cli/implied
    * @return {Command} `this` command for chaining
    */

  setOptionValueWithSource(key, value, source) {
    if (this._storeOptionsAsProperties) {
      this[key] = value;
    } else {
      this._optionValues[key] = value;
    }
    this._optionValueSources[key] = source;
    return this;
  }

  /**
    * Get source of option value.
    * Expected values are default | config | env | cli | implied
    *
    * @param {string} key
    * @return {string}
    */

  getOptionValueSource(key) {
    return this._optionValueSources[key];
  }

  /**
    * Get source of option value. See also .optsWithGlobals().
    * Expected values are default | config | env | cli | implied
    *
    * @param {string} key
    * @return {string}
    */

  getOptionValueSourceWithGlobals(key) {
    // global overwrites local, like optsWithGlobals
    let source;
    this._getCommandAndAncestors().forEach((cmd) => {
      if (cmd.getOptionValueSource(key) !== undefined) {
        source = cmd.getOptionValueSource(key);
      }
    });
    return source;
  }

  /**
   * Get user arguments from implied or explicit arguments.
   * Side-effects: set _scriptPath if args included script. Used for default program name, and subcommand searches.
   *
   * @api private
   */

  _prepareUserArgs(argv, parseOptions) {
    if (argv !== undefined && !Array.isArray(argv)) {
      throw new Error('first parameter to parse must be array or undefined');
    }
    parseOptions = parseOptions || {};

    // Default to using process.argv
    if (argv === undefined) {
      argv = process$1.argv;
      // @ts-ignore: unknown property
      if (process$1.versions && process$1.versions.electron) {
        parseOptions.from = 'electron';
      }
    }
    this.rawArgs = argv.slice();

    // make it a little easier for callers by supporting various argv conventions
    let userArgs;
    switch (parseOptions.from) {
      case undefined:
      case 'node':
        this._scriptPath = argv[1];
        userArgs = argv.slice(2);
        break;
      case 'electron':
        // @ts-ignore: unknown property
        if (process$1.defaultApp) {
          this._scriptPath = argv[1];
          userArgs = argv.slice(2);
        } else {
          userArgs = argv.slice(1);
        }
        break;
      case 'user':
        userArgs = argv.slice(0);
        break;
      default:
        throw new Error(`unexpected parse option { from: '${parseOptions.from}' }`);
    }

    // Find default name for program from arguments.
    if (!this._name && this._scriptPath) this.nameFromFilename(this._scriptPath);
    this._name = this._name || 'program';

    return userArgs;
  }

  /**
   * Parse `argv`, setting options and invoking commands when defined.
   *
   * The default expectation is that the arguments are from node and have the application as argv[0]
   * and the script being run in argv[1], with user parameters after that.
   *
   * @example
   * program.parse(process.argv);
   * program.parse(); // implicitly use process.argv and auto-detect node vs electron conventions
   * program.parse(my-args, { from: 'user' }); // just user supplied arguments, nothing special about argv[0]
   *
   * @param {string[]} [argv] - optional, defaults to process.argv
   * @param {Object} [parseOptions] - optionally specify style of options with from: node/user/electron
   * @param {string} [parseOptions.from] - where the args are from: 'node', 'user', 'electron'
   * @return {Command} `this` command for chaining
   */

  parse(argv, parseOptions) {
    const userArgs = this._prepareUserArgs(argv, parseOptions);
    this._parseCommand([], userArgs);

    return this;
  }

  /**
   * Parse `argv`, setting options and invoking commands when defined.
   *
   * Use parseAsync instead of parse if any of your action handlers are async. Returns a Promise.
   *
   * The default expectation is that the arguments are from node and have the application as argv[0]
   * and the script being run in argv[1], with user parameters after that.
   *
   * @example
   * await program.parseAsync(process.argv);
   * await program.parseAsync(); // implicitly use process.argv and auto-detect node vs electron conventions
   * await program.parseAsync(my-args, { from: 'user' }); // just user supplied arguments, nothing special about argv[0]
   *
   * @param {string[]} [argv]
   * @param {Object} [parseOptions]
   * @param {string} parseOptions.from - where the args are from: 'node', 'user', 'electron'
   * @return {Promise}
   */

  async parseAsync(argv, parseOptions) {
    const userArgs = this._prepareUserArgs(argv, parseOptions);
    await this._parseCommand([], userArgs);

    return this;
  }

  /**
   * Execute a sub-command executable.
   *
   * @api private
   */

  _executeSubCommand(subcommand, args) {
    args = args.slice();
    let launchWithNode = false; // Use node for source targets so do not need to get permissions correct, and on Windows.
    const sourceExt = ['.js', '.ts', '.tsx', '.mjs', '.cjs'];

    function findFile(baseDir, baseName) {
      // Look for specified file
      const localBin = path$i.resolve(baseDir, baseName);
      if (fs$l.existsSync(localBin)) return localBin;

      // Stop looking if candidate already has an expected extension.
      if (sourceExt.includes(path$i.extname(baseName))) return undefined;

      // Try all the extensions.
      const foundExt = sourceExt.find(ext => fs$l.existsSync(`${localBin}${ext}`));
      if (foundExt) return `${localBin}${foundExt}`;

      return undefined;
    }

    // Not checking for help first. Unlikely to have mandatory and executable, and can't robustly test for help flags in external command.
    this._checkForMissingMandatoryOptions();
    this._checkForConflictingOptions();

    // executableFile and executableDir might be full path, or just a name
    let executableFile = subcommand._executableFile || `${this._name}-${subcommand._name}`;
    let executableDir = this._executableDir || '';
    if (this._scriptPath) {
      let resolvedScriptPath; // resolve possible symlink for installed npm binary
      try {
        resolvedScriptPath = fs$l.realpathSync(this._scriptPath);
      } catch (err) {
        resolvedScriptPath = this._scriptPath;
      }
      executableDir = path$i.resolve(path$i.dirname(resolvedScriptPath), executableDir);
    }

    // Look for a local file in preference to a command in PATH.
    if (executableDir) {
      let localFile = findFile(executableDir, executableFile);

      // Legacy search using prefix of script name instead of command name
      if (!localFile && !subcommand._executableFile && this._scriptPath) {
        const legacyName = path$i.basename(this._scriptPath, path$i.extname(this._scriptPath));
        if (legacyName !== this._name) {
          localFile = findFile(executableDir, `${legacyName}-${subcommand._name}`);
        }
      }
      executableFile = localFile || executableFile;
    }

    launchWithNode = sourceExt.includes(path$i.extname(executableFile));

    let proc;
    if (process$1.platform !== 'win32') {
      if (launchWithNode) {
        args.unshift(executableFile);
        // add executable arguments to spawn
        args = incrementNodeInspectorPort(process$1.execArgv).concat(args);

        proc = childProcess.spawn(process$1.argv[0], args, { stdio: 'inherit' });
      } else {
        proc = childProcess.spawn(executableFile, args, { stdio: 'inherit' });
      }
    } else {
      args.unshift(executableFile);
      // add executable arguments to spawn
      args = incrementNodeInspectorPort(process$1.execArgv).concat(args);
      proc = childProcess.spawn(process$1.execPath, args, { stdio: 'inherit' });
    }

    if (!proc.killed) { // testing mainly to avoid leak warnings during unit tests with mocked spawn
      const signals = ['SIGUSR1', 'SIGUSR2', 'SIGTERM', 'SIGINT', 'SIGHUP'];
      signals.forEach((signal) => {
        // @ts-ignore
        process$1.on(signal, () => {
          if (proc.killed === false && proc.exitCode === null) {
            proc.kill(signal);
          }
        });
      });
    }

    // By default terminate process when spawned process terminates.
    // Suppressing the exit if exitCallback defined is a bit messy and of limited use, but does allow process to stay running!
    const exitCallback = this._exitCallback;
    if (!exitCallback) {
      proc.on('close', process$1.exit.bind(process$1));
    } else {
      proc.on('close', () => {
        exitCallback(new CommanderError(process$1.exitCode || 0, 'commander.executeSubCommandAsync', '(close)'));
      });
    }
    proc.on('error', (err) => {
      // @ts-ignore
      if (err.code === 'ENOENT') {
        const executableDirMessage = executableDir
          ? `searched for local subcommand relative to directory '${executableDir}'`
          : 'no directory for search for local subcommand, use .executableDir() to supply a custom directory';
        const executableMissing = `'${executableFile}' does not exist
 - if '${subcommand._name}' is not meant to be an executable command, remove description parameter from '.command()' and use '.description()' instead
 - if the default executable name is not suitable, use the executableFile option to supply a custom name or path
 - ${executableDirMessage}`;
        throw new Error(executableMissing);
      // @ts-ignore
      } else if (err.code === 'EACCES') {
        throw new Error(`'${executableFile}' not executable`);
      }
      if (!exitCallback) {
        process$1.exit(1);
      } else {
        const wrappedError = new CommanderError(1, 'commander.executeSubCommandAsync', '(error)');
        wrappedError.nestedError = err;
        exitCallback(wrappedError);
      }
    });

    // Store the reference to the child process
    this.runningCommand = proc;
  }

  /**
   * @api private
   */

  _dispatchSubcommand(commandName, operands, unknown) {
    const subCommand = this._findCommand(commandName);
    if (!subCommand) this.help({ error: true });

    let promiseChain;
    promiseChain = this._chainOrCallSubCommandHook(promiseChain, subCommand, 'preSubcommand');
    promiseChain = this._chainOrCall(promiseChain, () => {
      if (subCommand._executableHandler) {
        this._executeSubCommand(subCommand, operands.concat(unknown));
      } else {
        return subCommand._parseCommand(operands, unknown);
      }
    });
    return promiseChain;
  }

  /**
   * Invoke help directly if possible, or dispatch if necessary.
   * e.g. help foo
   *
   * @api private
   */

  _dispatchHelpCommand(subcommandName) {
    if (!subcommandName) {
      this.help();
    }
    const subCommand = this._findCommand(subcommandName);
    if (subCommand && !subCommand._executableHandler) {
      subCommand.help();
    }

    // Fallback to parsing the help flag to invoke the help.
    return this._dispatchSubcommand(subcommandName, [], [
      this._helpLongFlag || this._helpShortFlag
    ]);
  }

  /**
   * Check this.args against expected this.registeredArguments.
   *
   * @api private
   */

  _checkNumberOfArguments() {
    // too few
    this.registeredArguments.forEach((arg, i) => {
      if (arg.required && this.args[i] == null) {
        this.missingArgument(arg.name());
      }
    });
    // too many
    if (this.registeredArguments.length > 0 && this.registeredArguments[this.registeredArguments.length - 1].variadic) {
      return;
    }
    if (this.args.length > this.registeredArguments.length) {
      this._excessArguments(this.args);
    }
  }

  /**
   * Process this.args using this.registeredArguments and save as this.processedArgs!
   *
   * @api private
   */

  _processArguments() {
    const myParseArg = (argument, value, previous) => {
      // Extra processing for nice error message on parsing failure.
      let parsedValue = value;
      if (value !== null && argument.parseArg) {
        const invalidValueMessage = `error: command-argument value '${value}' is invalid for argument '${argument.name()}'.`;
        parsedValue = this._callParseArg(argument, value, previous, invalidValueMessage);
      }
      return parsedValue;
    };

    this._checkNumberOfArguments();

    const processedArgs = [];
    this.registeredArguments.forEach((declaredArg, index) => {
      let value = declaredArg.defaultValue;
      if (declaredArg.variadic) {
        // Collect together remaining arguments for passing together as an array.
        if (index < this.args.length) {
          value = this.args.slice(index);
          if (declaredArg.parseArg) {
            value = value.reduce((processed, v) => {
              return myParseArg(declaredArg, v, processed);
            }, declaredArg.defaultValue);
          }
        } else if (value === undefined) {
          value = [];
        }
      } else if (index < this.args.length) {
        value = this.args[index];
        if (declaredArg.parseArg) {
          value = myParseArg(declaredArg, value, declaredArg.defaultValue);
        }
      }
      processedArgs[index] = value;
    });
    this.processedArgs = processedArgs;
  }

  /**
   * Once we have a promise we chain, but call synchronously until then.
   *
   * @param {Promise|undefined} promise
   * @param {Function} fn
   * @return {Promise|undefined}
   * @api private
   */

  _chainOrCall(promise, fn) {
    // thenable
    if (promise && promise.then && typeof promise.then === 'function') {
      // already have a promise, chain callback
      return promise.then(() => fn());
    }
    // callback might return a promise
    return fn();
  }

  /**
   *
   * @param {Promise|undefined} promise
   * @param {string} event
   * @return {Promise|undefined}
   * @api private
   */

  _chainOrCallHooks(promise, event) {
    let result = promise;
    const hooks = [];
    this._getCommandAndAncestors()
      .reverse()
      .filter(cmd => cmd._lifeCycleHooks[event] !== undefined)
      .forEach(hookedCommand => {
        hookedCommand._lifeCycleHooks[event].forEach((callback) => {
          hooks.push({ hookedCommand, callback });
        });
      });
    if (event === 'postAction') {
      hooks.reverse();
    }

    hooks.forEach((hookDetail) => {
      result = this._chainOrCall(result, () => {
        return hookDetail.callback(hookDetail.hookedCommand, this);
      });
    });
    return result;
  }

  /**
   *
   * @param {Promise|undefined} promise
   * @param {Command} subCommand
   * @param {string} event
   * @return {Promise|undefined}
   * @api private
   */

  _chainOrCallSubCommandHook(promise, subCommand, event) {
    let result = promise;
    if (this._lifeCycleHooks[event] !== undefined) {
      this._lifeCycleHooks[event].forEach((hook) => {
        result = this._chainOrCall(result, () => {
          return hook(this, subCommand);
        });
      });
    }
    return result;
  }

  /**
   * Process arguments in context of this command.
   * Returns action result, in case it is a promise.
   *
   * @api private
   */

  _parseCommand(operands, unknown) {
    const parsed = this.parseOptions(unknown);
    this._parseOptionsEnv(); // after cli, so parseArg not called on both cli and env
    this._parseOptionsImplied();
    operands = operands.concat(parsed.operands);
    unknown = parsed.unknown;
    this.args = operands.concat(unknown);

    if (operands && this._findCommand(operands[0])) {
      return this._dispatchSubcommand(operands[0], operands.slice(1), unknown);
    }
    if (this._hasImplicitHelpCommand() && operands[0] === this._helpCommandName) {
      return this._dispatchHelpCommand(operands[1]);
    }
    if (this._defaultCommandName) {
      outputHelpIfRequested(this, unknown); // Run the help for default command from parent rather than passing to default command
      return this._dispatchSubcommand(this._defaultCommandName, operands, unknown);
    }
    if (this.commands.length && this.args.length === 0 && !this._actionHandler && !this._defaultCommandName) {
      // probably missing subcommand and no handler, user needs help (and exit)
      this.help({ error: true });
    }

    outputHelpIfRequested(this, parsed.unknown);
    this._checkForMissingMandatoryOptions();
    this._checkForConflictingOptions();

    // We do not always call this check to avoid masking a "better" error, like unknown command.
    const checkForUnknownOptions = () => {
      if (parsed.unknown.length > 0) {
        this.unknownOption(parsed.unknown[0]);
      }
    };

    const commandEvent = `command:${this.name()}`;
    if (this._actionHandler) {
      checkForUnknownOptions();
      this._processArguments();

      let promiseChain;
      promiseChain = this._chainOrCallHooks(promiseChain, 'preAction');
      promiseChain = this._chainOrCall(promiseChain, () => this._actionHandler(this.processedArgs));
      if (this.parent) {
        promiseChain = this._chainOrCall(promiseChain, () => {
          this.parent.emit(commandEvent, operands, unknown); // legacy
        });
      }
      promiseChain = this._chainOrCallHooks(promiseChain, 'postAction');
      return promiseChain;
    }
    if (this.parent && this.parent.listenerCount(commandEvent)) {
      checkForUnknownOptions();
      this._processArguments();
      this.parent.emit(commandEvent, operands, unknown); // legacy
    } else if (operands.length) {
      if (this._findCommand('*')) { // legacy default command
        return this._dispatchSubcommand('*', operands, unknown);
      }
      if (this.listenerCount('command:*')) {
        // skip option check, emit event for possible misspelling suggestion
        this.emit('command:*', operands, unknown);
      } else if (this.commands.length) {
        this.unknownCommand();
      } else {
        checkForUnknownOptions();
        this._processArguments();
      }
    } else if (this.commands.length) {
      checkForUnknownOptions();
      // This command has subcommands and nothing hooked up at this level, so display help (and exit).
      this.help({ error: true });
    } else {
      checkForUnknownOptions();
      this._processArguments();
      // fall through for caller to handle after calling .parse()
    }
  }

  /**
   * Find matching command.
   *
   * @api private
   */
  _findCommand(name) {
    if (!name) return undefined;
    return this.commands.find(cmd => cmd._name === name || cmd._aliases.includes(name));
  }

  /**
   * Return an option matching `arg` if any.
   *
   * @param {string} arg
   * @return {Option}
   * @api private
   */

  _findOption(arg) {
    return this.options.find(option => option.is(arg));
  }

  /**
   * Display an error message if a mandatory option does not have a value.
   * Called after checking for help flags in leaf subcommand.
   *
   * @api private
   */

  _checkForMissingMandatoryOptions() {
    // Walk up hierarchy so can call in subcommand after checking for displaying help.
    this._getCommandAndAncestors().forEach((cmd) => {
      cmd.options.forEach((anOption) => {
        if (anOption.mandatory && (cmd.getOptionValue(anOption.attributeName()) === undefined)) {
          cmd.missingMandatoryOptionValue(anOption);
        }
      });
    });
  }

  /**
   * Display an error message if conflicting options are used together in this.
   *
   * @api private
   */
  _checkForConflictingLocalOptions() {
    const definedNonDefaultOptions = this.options.filter(
      (option) => {
        const optionKey = option.attributeName();
        if (this.getOptionValue(optionKey) === undefined) {
          return false;
        }
        return this.getOptionValueSource(optionKey) !== 'default';
      }
    );

    const optionsWithConflicting = definedNonDefaultOptions.filter(
      (option) => option.conflictsWith.length > 0
    );

    optionsWithConflicting.forEach((option) => {
      const conflictingAndDefined = definedNonDefaultOptions.find((defined) =>
        option.conflictsWith.includes(defined.attributeName())
      );
      if (conflictingAndDefined) {
        this._conflictingOption(option, conflictingAndDefined);
      }
    });
  }

  /**
   * Display an error message if conflicting options are used together.
   * Called after checking for help flags in leaf subcommand.
   *
   * @api private
   */
  _checkForConflictingOptions() {
    // Walk up hierarchy so can call in subcommand after checking for displaying help.
    this._getCommandAndAncestors().forEach((cmd) => {
      cmd._checkForConflictingLocalOptions();
    });
  }

  /**
   * Parse options from `argv` removing known options,
   * and return argv split into operands and unknown arguments.
   *
   * Examples:
   *
   *     argv => operands, unknown
   *     --known kkk op => [op], []
   *     op --known kkk => [op], []
   *     sub --unknown uuu op => [sub], [--unknown uuu op]
   *     sub -- --unknown uuu op => [sub --unknown uuu op], []
   *
   * @param {String[]} argv
   * @return {{operands: String[], unknown: String[]}}
   */

  parseOptions(argv) {
    const operands = []; // operands, not options or values
    const unknown = []; // first unknown option and remaining unknown args
    let dest = operands;
    const args = argv.slice();

    function maybeOption(arg) {
      return arg.length > 1 && arg[0] === '-';
    }

    // parse options
    let activeVariadicOption = null;
    while (args.length) {
      const arg = args.shift();

      // literal
      if (arg === '--') {
        if (dest === unknown) dest.push(arg);
        dest.push(...args);
        break;
      }

      if (activeVariadicOption && !maybeOption(arg)) {
        this.emit(`option:${activeVariadicOption.name()}`, arg);
        continue;
      }
      activeVariadicOption = null;

      if (maybeOption(arg)) {
        const option = this._findOption(arg);
        // recognised option, call listener to assign value with possible custom processing
        if (option) {
          if (option.required) {
            const value = args.shift();
            if (value === undefined) this.optionMissingArgument(option);
            this.emit(`option:${option.name()}`, value);
          } else if (option.optional) {
            let value = null;
            // historical behaviour is optional value is following arg unless an option
            if (args.length > 0 && !maybeOption(args[0])) {
              value = args.shift();
            }
            this.emit(`option:${option.name()}`, value);
          } else { // boolean flag
            this.emit(`option:${option.name()}`);
          }
          activeVariadicOption = option.variadic ? option : null;
          continue;
        }
      }

      // Look for combo options following single dash, eat first one if known.
      if (arg.length > 2 && arg[0] === '-' && arg[1] !== '-') {
        const option = this._findOption(`-${arg[1]}`);
        if (option) {
          if (option.required || (option.optional && this._combineFlagAndOptionalValue)) {
            // option with value following in same argument
            this.emit(`option:${option.name()}`, arg.slice(2));
          } else {
            // boolean option, emit and put back remainder of arg for further processing
            this.emit(`option:${option.name()}`);
            args.unshift(`-${arg.slice(2)}`);
          }
          continue;
        }
      }

      // Look for known long flag with value, like --foo=bar
      if (/^--[^=]+=/.test(arg)) {
        const index = arg.indexOf('=');
        const option = this._findOption(arg.slice(0, index));
        if (option && (option.required || option.optional)) {
          this.emit(`option:${option.name()}`, arg.slice(index + 1));
          continue;
        }
      }

      // Not a recognised option by this command.
      // Might be a command-argument, or subcommand option, or unknown option, or help command or option.

      // An unknown option means further arguments also classified as unknown so can be reprocessed by subcommands.
      if (maybeOption(arg)) {
        dest = unknown;
      }

      // If using positionalOptions, stop processing our options at subcommand.
      if ((this._enablePositionalOptions || this._passThroughOptions) && operands.length === 0 && unknown.length === 0) {
        if (this._findCommand(arg)) {
          operands.push(arg);
          if (args.length > 0) unknown.push(...args);
          break;
        } else if (arg === this._helpCommandName && this._hasImplicitHelpCommand()) {
          operands.push(arg);
          if (args.length > 0) operands.push(...args);
          break;
        } else if (this._defaultCommandName) {
          unknown.push(arg);
          if (args.length > 0) unknown.push(...args);
          break;
        }
      }

      // If using passThroughOptions, stop processing options at first command-argument.
      if (this._passThroughOptions) {
        dest.push(arg);
        if (args.length > 0) dest.push(...args);
        break;
      }

      // add arg
      dest.push(arg);
    }

    return { operands, unknown };
  }

  /**
   * Return an object containing local option values as key-value pairs.
   *
   * @return {Object}
   */
  opts() {
    if (this._storeOptionsAsProperties) {
      // Preserve original behaviour so backwards compatible when still using properties
      const result = {};
      const len = this.options.length;

      for (let i = 0; i < len; i++) {
        const key = this.options[i].attributeName();
        result[key] = key === this._versionOptionName ? this._version : this[key];
      }
      return result;
    }

    return this._optionValues;
  }

  /**
   * Return an object containing merged local and global option values as key-value pairs.
   *
   * @return {Object}
   */
  optsWithGlobals() {
    // globals overwrite locals
    return this._getCommandAndAncestors().reduce(
      (combinedOptions, cmd) => Object.assign(combinedOptions, cmd.opts()),
      {}
    );
  }

  /**
   * Display error message and exit (or call exitOverride).
   *
   * @param {string} message
   * @param {Object} [errorOptions]
   * @param {string} [errorOptions.code] - an id string representing the error
   * @param {number} [errorOptions.exitCode] - used with process.exit
   */
  error(message, errorOptions) {
    // output handling
    this._outputConfiguration.outputError(`${message}\n`, this._outputConfiguration.writeErr);
    if (typeof this._showHelpAfterError === 'string') {
      this._outputConfiguration.writeErr(`${this._showHelpAfterError}\n`);
    } else if (this._showHelpAfterError) {
      this._outputConfiguration.writeErr('\n');
      this.outputHelp({ error: true });
    }

    // exit handling
    const config = errorOptions || {};
    const exitCode = config.exitCode || 1;
    const code = config.code || 'commander.error';
    this._exit(exitCode, code, message);
  }

  /**
   * Apply any option related environment variables, if option does
   * not have a value from cli or client code.
   *
   * @api private
   */
  _parseOptionsEnv() {
    this.options.forEach((option) => {
      if (option.envVar && option.envVar in process$1.env) {
        const optionKey = option.attributeName();
        // Priority check. Do not overwrite cli or options from unknown source (client-code).
        if (this.getOptionValue(optionKey) === undefined || ['default', 'config', 'env'].includes(this.getOptionValueSource(optionKey))) {
          if (option.required || option.optional) { // option can take a value
            // keep very simple, optional always takes value
            this.emit(`optionEnv:${option.name()}`, process$1.env[option.envVar]);
          } else { // boolean
            // keep very simple, only care that envVar defined and not the value
            this.emit(`optionEnv:${option.name()}`);
          }
        }
      }
    });
  }

  /**
   * Apply any implied option values, if option is undefined or default value.
   *
   * @api private
   */
  _parseOptionsImplied() {
    const dualHelper = new DualOptions(this.options);
    const hasCustomOptionValue = (optionKey) => {
      return this.getOptionValue(optionKey) !== undefined && !['default', 'implied'].includes(this.getOptionValueSource(optionKey));
    };
    this.options
      .filter(option => (option.implied !== undefined) &&
        hasCustomOptionValue(option.attributeName()) &&
        dualHelper.valueFromOption(this.getOptionValue(option.attributeName()), option))
      .forEach((option) => {
        Object.keys(option.implied)
          .filter(impliedKey => !hasCustomOptionValue(impliedKey))
          .forEach(impliedKey => {
            this.setOptionValueWithSource(impliedKey, option.implied[impliedKey], 'implied');
          });
      });
  }

  /**
   * Argument `name` is missing.
   *
   * @param {string} name
   * @api private
   */

  missingArgument(name) {
    const message = `error: missing required argument '${name}'`;
    this.error(message, { code: 'commander.missingArgument' });
  }

  /**
   * `Option` is missing an argument.
   *
   * @param {Option} option
   * @api private
   */

  optionMissingArgument(option) {
    const message = `error: option '${option.flags}' argument missing`;
    this.error(message, { code: 'commander.optionMissingArgument' });
  }

  /**
   * `Option` does not have a value, and is a mandatory option.
   *
   * @param {Option} option
   * @api private
   */

  missingMandatoryOptionValue(option) {
    const message = `error: required option '${option.flags}' not specified`;
    this.error(message, { code: 'commander.missingMandatoryOptionValue' });
  }

  /**
   * `Option` conflicts with another option.
   *
   * @param {Option} option
   * @param {Option} conflictingOption
   * @api private
   */
  _conflictingOption(option, conflictingOption) {
    // The calling code does not know whether a negated option is the source of the
    // value, so do some work to take an educated guess.
    const findBestOptionFromValue = (option) => {
      const optionKey = option.attributeName();
      const optionValue = this.getOptionValue(optionKey);
      const negativeOption = this.options.find(target => target.negate && optionKey === target.attributeName());
      const positiveOption = this.options.find(target => !target.negate && optionKey === target.attributeName());
      if (negativeOption && (
        (negativeOption.presetArg === undefined && optionValue === false) ||
        (negativeOption.presetArg !== undefined && optionValue === negativeOption.presetArg)
      )) {
        return negativeOption;
      }
      return positiveOption || option;
    };

    const getErrorMessage = (option) => {
      const bestOption = findBestOptionFromValue(option);
      const optionKey = bestOption.attributeName();
      const source = this.getOptionValueSource(optionKey);
      if (source === 'env') {
        return `environment variable '${bestOption.envVar}'`;
      }
      return `option '${bestOption.flags}'`;
    };

    const message = `error: ${getErrorMessage(option)} cannot be used with ${getErrorMessage(conflictingOption)}`;
    this.error(message, { code: 'commander.conflictingOption' });
  }

  /**
   * Unknown option `flag`.
   *
   * @param {string} flag
   * @api private
   */

  unknownOption(flag) {
    if (this._allowUnknownOption) return;
    let suggestion = '';

    if (flag.startsWith('--') && this._showSuggestionAfterError) {
      // Looping to pick up the global options too
      let candidateFlags = [];
      let command = this;
      do {
        const moreFlags = command.createHelp().visibleOptions(command)
          .filter(option => option.long)
          .map(option => option.long);
        candidateFlags = candidateFlags.concat(moreFlags);
        command = command.parent;
      } while (command && !command._enablePositionalOptions);
      suggestion = suggestSimilar(flag, candidateFlags);
    }

    const message = `error: unknown option '${flag}'${suggestion}`;
    this.error(message, { code: 'commander.unknownOption' });
  }

  /**
   * Excess arguments, more than expected.
   *
   * @param {string[]} receivedArgs
   * @api private
   */

  _excessArguments(receivedArgs) {
    if (this._allowExcessArguments) return;

    const expected = this.registeredArguments.length;
    const s = (expected === 1) ? '' : 's';
    const forSubcommand = this.parent ? ` for '${this.name()}'` : '';
    const message = `error: too many arguments${forSubcommand}. Expected ${expected} argument${s} but got ${receivedArgs.length}.`;
    this.error(message, { code: 'commander.excessArguments' });
  }

  /**
   * Unknown command.
   *
   * @api private
   */

  unknownCommand() {
    const unknownName = this.args[0];
    let suggestion = '';

    if (this._showSuggestionAfterError) {
      const candidateNames = [];
      this.createHelp().visibleCommands(this).forEach((command) => {
        candidateNames.push(command.name());
        // just visible alias
        if (command.alias()) candidateNames.push(command.alias());
      });
      suggestion = suggestSimilar(unknownName, candidateNames);
    }

    const message = `error: unknown command '${unknownName}'${suggestion}`;
    this.error(message, { code: 'commander.unknownCommand' });
  }

  /**
   * Get or set the program version.
   *
   * This method auto-registers the "-V, --version" option which will print the version number.
   *
   * You can optionally supply the flags and description to override the defaults.
   *
   * @param {string} [str]
   * @param {string} [flags]
   * @param {string} [description]
   * @return {this | string | undefined} `this` command for chaining, or version string if no arguments
   */

  version(str, flags, description) {
    if (str === undefined) return this._version;
    this._version = str;
    flags = flags || '-V, --version';
    description = description || 'output the version number';
    const versionOption = this.createOption(flags, description);
    this._versionOptionName = versionOption.attributeName(); // [sic] not defined in constructor, partly legacy, partly only needed at root
    this.options.push(versionOption);
    this.on('option:' + versionOption.name(), () => {
      this._outputConfiguration.writeOut(`${str}\n`);
      this._exit(0, 'commander.version', str);
    });
    return this;
  }

  /**
   * Set the description.
   *
   * @param {string} [str]
   * @param {Object} [argsDescription]
   * @return {string|Command}
   */
  description(str, argsDescription) {
    if (str === undefined && argsDescription === undefined) return this._description;
    this._description = str;
    if (argsDescription) {
      this._argsDescription = argsDescription;
    }
    return this;
  }

  /**
   * Set the summary. Used when listed as subcommand of parent.
   *
   * @param {string} [str]
   * @return {string|Command}
   */
  summary(str) {
    if (str === undefined) return this._summary;
    this._summary = str;
    return this;
  }

  /**
   * Set an alias for the command.
   *
   * You may call more than once to add multiple aliases. Only the first alias is shown in the auto-generated help.
   *
   * @param {string} [alias]
   * @return {string|Command}
   */

  alias(alias) {
    if (alias === undefined) return this._aliases[0]; // just return first, for backwards compatibility

    /** @type {Command} */
    let command = this;
    if (this.commands.length !== 0 && this.commands[this.commands.length - 1]._executableHandler) {
      // assume adding alias for last added executable subcommand, rather than this
      command = this.commands[this.commands.length - 1];
    }

    if (alias === command._name) throw new Error('Command alias can\'t be the same as its name');

    command._aliases.push(alias);
    return this;
  }

  /**
   * Set aliases for the command.
   *
   * Only the first alias is shown in the auto-generated help.
   *
   * @param {string[]} [aliases]
   * @return {string[]|Command}
   */

  aliases(aliases) {
    // Getter for the array of aliases is the main reason for having aliases() in addition to alias().
    if (aliases === undefined) return this._aliases;

    aliases.forEach((alias) => this.alias(alias));
    return this;
  }

  /**
   * Set / get the command usage `str`.
   *
   * @param {string} [str]
   * @return {String|Command}
   */

  usage(str) {
    if (str === undefined) {
      if (this._usage) return this._usage;

      const args = this.registeredArguments.map((arg) => {
        return humanReadableArgName(arg);
      });
      return [].concat(
        (this.options.length || this._hasHelpOption ? '[options]' : []),
        (this.commands.length ? '[command]' : []),
        (this.registeredArguments.length ? args : [])
      ).join(' ');
    }

    this._usage = str;
    return this;
  }

  /**
   * Get or set the name of the command.
   *
   * @param {string} [str]
   * @return {string|Command}
   */

  name(str) {
    if (str === undefined) return this._name;
    this._name = str;
    return this;
  }

  /**
   * Set the name of the command from script filename, such as process.argv[1],
   * or require.main.filename, or __filename.
   *
   * (Used internally and public although not documented in README.)
   *
   * @example
   * program.nameFromFilename(require.main.filename);
   *
   * @param {string} filename
   * @return {Command}
   */

  nameFromFilename(filename) {
    this._name = path$i.basename(filename, path$i.extname(filename));

    return this;
  }

  /**
   * Get or set the directory for searching for executable subcommands of this command.
   *
   * @example
   * program.executableDir(__dirname);
   * // or
   * program.executableDir('subcommands');
   *
   * @param {string} [path]
   * @return {string|null|Command}
   */

  executableDir(path) {
    if (path === undefined) return this._executableDir;
    this._executableDir = path;
    return this;
  }

  /**
   * Return program help documentation.
   *
   * @param {{ error: boolean }} [contextOptions] - pass {error:true} to wrap for stderr instead of stdout
   * @return {string}
   */

  helpInformation(contextOptions) {
    const helper = this.createHelp();
    if (helper.helpWidth === undefined) {
      helper.helpWidth = (contextOptions && contextOptions.error) ? this._outputConfiguration.getErrHelpWidth() : this._outputConfiguration.getOutHelpWidth();
    }
    return helper.formatHelp(this, helper);
  }

  /**
   * @api private
   */

  _getHelpContext(contextOptions) {
    contextOptions = contextOptions || {};
    const context = { error: !!contextOptions.error };
    let write;
    if (context.error) {
      write = (arg) => this._outputConfiguration.writeErr(arg);
    } else {
      write = (arg) => this._outputConfiguration.writeOut(arg);
    }
    context.write = contextOptions.write || write;
    context.command = this;
    return context;
  }

  /**
   * Output help information for this command.
   *
   * Outputs built-in help, and custom text added using `.addHelpText()`.
   *
   * @param {{ error: boolean } | Function} [contextOptions] - pass {error:true} to write to stderr instead of stdout
   */

  outputHelp(contextOptions) {
    let deprecatedCallback;
    if (typeof contextOptions === 'function') {
      deprecatedCallback = contextOptions;
      contextOptions = undefined;
    }
    const context = this._getHelpContext(contextOptions);

    this._getCommandAndAncestors().reverse().forEach(command => command.emit('beforeAllHelp', context));
    this.emit('beforeHelp', context);

    let helpInformation = this.helpInformation(context);
    if (deprecatedCallback) {
      helpInformation = deprecatedCallback(helpInformation);
      if (typeof helpInformation !== 'string' && !Buffer.isBuffer(helpInformation)) {
        throw new Error('outputHelp callback must return a string or a Buffer');
      }
    }
    context.write(helpInformation);

    if (this._helpLongFlag) {
      this.emit(this._helpLongFlag); // deprecated
    }
    this.emit('afterHelp', context);
    this._getCommandAndAncestors().forEach(command => command.emit('afterAllHelp', context));
  }

  /**
   * You can pass in flags and a description to override the help
   * flags and help description for your command. Pass in false to
   * disable the built-in help option.
   *
   * @param {string | boolean} [flags]
   * @param {string} [description]
   * @return {Command} `this` command for chaining
   */

  helpOption(flags, description) {
    if (typeof flags === 'boolean') {
      this._hasHelpOption = flags;
      return this;
    }
    this._helpFlags = flags || this._helpFlags;
    this._helpDescription = description || this._helpDescription;

    const helpFlags = splitOptionFlags(this._helpFlags);
    this._helpShortFlag = helpFlags.shortFlag;
    this._helpLongFlag = helpFlags.longFlag;

    return this;
  }

  /**
   * Output help information and exit.
   *
   * Outputs built-in help, and custom text added using `.addHelpText()`.
   *
   * @param {{ error: boolean }} [contextOptions] - pass {error:true} to write to stderr instead of stdout
   */

  help(contextOptions) {
    this.outputHelp(contextOptions);
    let exitCode = process$1.exitCode || 0;
    if (exitCode === 0 && contextOptions && typeof contextOptions !== 'function' && contextOptions.error) {
      exitCode = 1;
    }
    // message: do not have all displayed text available so only passing placeholder.
    this._exit(exitCode, 'commander.help', '(outputHelp)');
  }

  /**
   * Add additional text to be displayed with the built-in help.
   *
   * Position is 'before' or 'after' to affect just this command,
   * and 'beforeAll' or 'afterAll' to affect this command and all its subcommands.
   *
   * @param {string} position - before or after built-in help
   * @param {string | Function} text - string to add, or a function returning a string
   * @return {Command} `this` command for chaining
   */
  addHelpText(position, text) {
    const allowedValues = ['beforeAll', 'before', 'after', 'afterAll'];
    if (!allowedValues.includes(position)) {
      throw new Error(`Unexpected value for position to addHelpText.
Expecting one of '${allowedValues.join("', '")}'`);
    }
    const helpEvent = `${position}Help`;
    this.on(helpEvent, (context) => {
      let helpStr;
      if (typeof text === 'function') {
        helpStr = text({ error: context.error, command: context.command });
      } else {
        helpStr = text;
      }
      // Ignore falsy value when nothing to output.
      if (helpStr) {
        context.write(`${helpStr}\n`);
      }
    });
    return this;
  }
};

/**
 * Output help information if help flags specified
 *
 * @param {Command} cmd - command to output help for
 * @param {Array} args - array of options to search for help flags
 * @api private
 */

function outputHelpIfRequested(cmd, args) {
  const helpOption = cmd._hasHelpOption && args.find(arg => arg === cmd._helpLongFlag || arg === cmd._helpShortFlag);
  if (helpOption) {
    cmd.outputHelp();
    // (Do not have all displayed text available so only passing placeholder.)
    cmd._exit(0, 'commander.helpDisplayed', '(outputHelp)');
  }
}

/**
 * Scan arguments and increment port number for inspect calls (to avoid conflicts when spawning new command).
 *
 * @param {string[]} args - array of arguments from node.execArgv
 * @returns {string[]}
 * @api private
 */

function incrementNodeInspectorPort(args) {
  // Testing for these options:
  //  --inspect[=[host:]port]
  //  --inspect-brk[=[host:]port]
  //  --inspect-port=[host:]port
  return args.map((arg) => {
    if (!arg.startsWith('--inspect')) {
      return arg;
    }
    let debugOption;
    let debugHost = '127.0.0.1';
    let debugPort = '9229';
    let match;
    if ((match = arg.match(/^(--inspect(-brk)?)$/)) !== null) {
      // e.g. --inspect
      debugOption = match[1];
    } else if ((match = arg.match(/^(--inspect(-brk|-port)?)=([^:]+)$/)) !== null) {
      debugOption = match[1];
      if (/^\d+$/.test(match[3])) {
        // e.g. --inspect=1234
        debugPort = match[3];
      } else {
        // e.g. --inspect=localhost
        debugHost = match[3];
      }
    } else if ((match = arg.match(/^(--inspect(-brk|-port)?)=([^:]+):(\d+)$/)) !== null) {
      // e.g. --inspect=localhost:1234
      debugOption = match[1];
      debugHost = match[3];
      debugPort = match[4];
    }

    if (debugOption && debugPort !== '0') {
      return `${debugOption}=${debugHost}:${parseInt(debugPort) + 1}`;
    }
    return arg;
  });
}

command.Command = Command$1;

(function (module, exports) {
	const { Argument } = argument;
	const { Command } = command;
	const { CommanderError, InvalidArgumentError } = error;
	const { Help } = help;
	const { Option } = option;

	/**
	 * Expose the root command.
	 */

	exports = module.exports = new Command();
	exports.program = exports; // More explicit access to global command.
	// createArgument, createCommand, and createOption are implicitly available as they are methods on program.

	/**
	 * Expose classes
	 */

	exports.Command = Command;
	exports.Option = Option;
	exports.Argument = Argument;
	exports.Help = Help;

	exports.CommanderError = CommanderError;
	exports.InvalidArgumentError = InvalidArgumentError;
	exports.InvalidOptionArgumentError = InvalidArgumentError; // Deprecated 
} (commander, commander.exports));

var commanderExports = commander.exports;

var ansiStyles$1 = {exports: {}};

var colorName;
var hasRequiredColorName;

function requireColorName () {
	if (hasRequiredColorName) return colorName;
	hasRequiredColorName = 1;

	colorName = {
		"aliceblue": [240, 248, 255],
		"antiquewhite": [250, 235, 215],
		"aqua": [0, 255, 255],
		"aquamarine": [127, 255, 212],
		"azure": [240, 255, 255],
		"beige": [245, 245, 220],
		"bisque": [255, 228, 196],
		"black": [0, 0, 0],
		"blanchedalmond": [255, 235, 205],
		"blue": [0, 0, 255],
		"blueviolet": [138, 43, 226],
		"brown": [165, 42, 42],
		"burlywood": [222, 184, 135],
		"cadetblue": [95, 158, 160],
		"chartreuse": [127, 255, 0],
		"chocolate": [210, 105, 30],
		"coral": [255, 127, 80],
		"cornflowerblue": [100, 149, 237],
		"cornsilk": [255, 248, 220],
		"crimson": [220, 20, 60],
		"cyan": [0, 255, 255],
		"darkblue": [0, 0, 139],
		"darkcyan": [0, 139, 139],
		"darkgoldenrod": [184, 134, 11],
		"darkgray": [169, 169, 169],
		"darkgreen": [0, 100, 0],
		"darkgrey": [169, 169, 169],
		"darkkhaki": [189, 183, 107],
		"darkmagenta": [139, 0, 139],
		"darkolivegreen": [85, 107, 47],
		"darkorange": [255, 140, 0],
		"darkorchid": [153, 50, 204],
		"darkred": [139, 0, 0],
		"darksalmon": [233, 150, 122],
		"darkseagreen": [143, 188, 143],
		"darkslateblue": [72, 61, 139],
		"darkslategray": [47, 79, 79],
		"darkslategrey": [47, 79, 79],
		"darkturquoise": [0, 206, 209],
		"darkviolet": [148, 0, 211],
		"deeppink": [255, 20, 147],
		"deepskyblue": [0, 191, 255],
		"dimgray": [105, 105, 105],
		"dimgrey": [105, 105, 105],
		"dodgerblue": [30, 144, 255],
		"firebrick": [178, 34, 34],
		"floralwhite": [255, 250, 240],
		"forestgreen": [34, 139, 34],
		"fuchsia": [255, 0, 255],
		"gainsboro": [220, 220, 220],
		"ghostwhite": [248, 248, 255],
		"gold": [255, 215, 0],
		"goldenrod": [218, 165, 32],
		"gray": [128, 128, 128],
		"green": [0, 128, 0],
		"greenyellow": [173, 255, 47],
		"grey": [128, 128, 128],
		"honeydew": [240, 255, 240],
		"hotpink": [255, 105, 180],
		"indianred": [205, 92, 92],
		"indigo": [75, 0, 130],
		"ivory": [255, 255, 240],
		"khaki": [240, 230, 140],
		"lavender": [230, 230, 250],
		"lavenderblush": [255, 240, 245],
		"lawngreen": [124, 252, 0],
		"lemonchiffon": [255, 250, 205],
		"lightblue": [173, 216, 230],
		"lightcoral": [240, 128, 128],
		"lightcyan": [224, 255, 255],
		"lightgoldenrodyellow": [250, 250, 210],
		"lightgray": [211, 211, 211],
		"lightgreen": [144, 238, 144],
		"lightgrey": [211, 211, 211],
		"lightpink": [255, 182, 193],
		"lightsalmon": [255, 160, 122],
		"lightseagreen": [32, 178, 170],
		"lightskyblue": [135, 206, 250],
		"lightslategray": [119, 136, 153],
		"lightslategrey": [119, 136, 153],
		"lightsteelblue": [176, 196, 222],
		"lightyellow": [255, 255, 224],
		"lime": [0, 255, 0],
		"limegreen": [50, 205, 50],
		"linen": [250, 240, 230],
		"magenta": [255, 0, 255],
		"maroon": [128, 0, 0],
		"mediumaquamarine": [102, 205, 170],
		"mediumblue": [0, 0, 205],
		"mediumorchid": [186, 85, 211],
		"mediumpurple": [147, 112, 219],
		"mediumseagreen": [60, 179, 113],
		"mediumslateblue": [123, 104, 238],
		"mediumspringgreen": [0, 250, 154],
		"mediumturquoise": [72, 209, 204],
		"mediumvioletred": [199, 21, 133],
		"midnightblue": [25, 25, 112],
		"mintcream": [245, 255, 250],
		"mistyrose": [255, 228, 225],
		"moccasin": [255, 228, 181],
		"navajowhite": [255, 222, 173],
		"navy": [0, 0, 128],
		"oldlace": [253, 245, 230],
		"olive": [128, 128, 0],
		"olivedrab": [107, 142, 35],
		"orange": [255, 165, 0],
		"orangered": [255, 69, 0],
		"orchid": [218, 112, 214],
		"palegoldenrod": [238, 232, 170],
		"palegreen": [152, 251, 152],
		"paleturquoise": [175, 238, 238],
		"palevioletred": [219, 112, 147],
		"papayawhip": [255, 239, 213],
		"peachpuff": [255, 218, 185],
		"peru": [205, 133, 63],
		"pink": [255, 192, 203],
		"plum": [221, 160, 221],
		"powderblue": [176, 224, 230],
		"purple": [128, 0, 128],
		"rebeccapurple": [102, 51, 153],
		"red": [255, 0, 0],
		"rosybrown": [188, 143, 143],
		"royalblue": [65, 105, 225],
		"saddlebrown": [139, 69, 19],
		"salmon": [250, 128, 114],
		"sandybrown": [244, 164, 96],
		"seagreen": [46, 139, 87],
		"seashell": [255, 245, 238],
		"sienna": [160, 82, 45],
		"silver": [192, 192, 192],
		"skyblue": [135, 206, 235],
		"slateblue": [106, 90, 205],
		"slategray": [112, 128, 144],
		"slategrey": [112, 128, 144],
		"snow": [255, 250, 250],
		"springgreen": [0, 255, 127],
		"steelblue": [70, 130, 180],
		"tan": [210, 180, 140],
		"teal": [0, 128, 128],
		"thistle": [216, 191, 216],
		"tomato": [255, 99, 71],
		"turquoise": [64, 224, 208],
		"violet": [238, 130, 238],
		"wheat": [245, 222, 179],
		"white": [255, 255, 255],
		"whitesmoke": [245, 245, 245],
		"yellow": [255, 255, 0],
		"yellowgreen": [154, 205, 50]
	};
	return colorName;
}

/* MIT license */

var conversions;
var hasRequiredConversions;

function requireConversions () {
	if (hasRequiredConversions) return conversions;
	hasRequiredConversions = 1;
	/* eslint-disable no-mixed-operators */
	const cssKeywords = requireColorName();

	// NOTE: conversions should only return primitive values (i.e. arrays, or
	//       values that give correct `typeof` results).
	//       do not use box values types (i.e. Number(), String(), etc.)

	const reverseKeywords = {};
	for (const key of Object.keys(cssKeywords)) {
		reverseKeywords[cssKeywords[key]] = key;
	}

	const convert = {
		rgb: {channels: 3, labels: 'rgb'},
		hsl: {channels: 3, labels: 'hsl'},
		hsv: {channels: 3, labels: 'hsv'},
		hwb: {channels: 3, labels: 'hwb'},
		cmyk: {channels: 4, labels: 'cmyk'},
		xyz: {channels: 3, labels: 'xyz'},
		lab: {channels: 3, labels: 'lab'},
		lch: {channels: 3, labels: 'lch'},
		hex: {channels: 1, labels: ['hex']},
		keyword: {channels: 1, labels: ['keyword']},
		ansi16: {channels: 1, labels: ['ansi16']},
		ansi256: {channels: 1, labels: ['ansi256']},
		hcg: {channels: 3, labels: ['h', 'c', 'g']},
		apple: {channels: 3, labels: ['r16', 'g16', 'b16']},
		gray: {channels: 1, labels: ['gray']}
	};

	conversions = convert;

	// Hide .channels and .labels properties
	for (const model of Object.keys(convert)) {
		if (!('channels' in convert[model])) {
			throw new Error('missing channels property: ' + model);
		}

		if (!('labels' in convert[model])) {
			throw new Error('missing channel labels property: ' + model);
		}

		if (convert[model].labels.length !== convert[model].channels) {
			throw new Error('channel and label counts mismatch: ' + model);
		}

		const {channels, labels} = convert[model];
		delete convert[model].channels;
		delete convert[model].labels;
		Object.defineProperty(convert[model], 'channels', {value: channels});
		Object.defineProperty(convert[model], 'labels', {value: labels});
	}

	convert.rgb.hsl = function (rgb) {
		const r = rgb[0] / 255;
		const g = rgb[1] / 255;
		const b = rgb[2] / 255;
		const min = Math.min(r, g, b);
		const max = Math.max(r, g, b);
		const delta = max - min;
		let h;
		let s;

		if (max === min) {
			h = 0;
		} else if (r === max) {
			h = (g - b) / delta;
		} else if (g === max) {
			h = 2 + (b - r) / delta;
		} else if (b === max) {
			h = 4 + (r - g) / delta;
		}

		h = Math.min(h * 60, 360);

		if (h < 0) {
			h += 360;
		}

		const l = (min + max) / 2;

		if (max === min) {
			s = 0;
		} else if (l <= 0.5) {
			s = delta / (max + min);
		} else {
			s = delta / (2 - max - min);
		}

		return [h, s * 100, l * 100];
	};

	convert.rgb.hsv = function (rgb) {
		let rdif;
		let gdif;
		let bdif;
		let h;
		let s;

		const r = rgb[0] / 255;
		const g = rgb[1] / 255;
		const b = rgb[2] / 255;
		const v = Math.max(r, g, b);
		const diff = v - Math.min(r, g, b);
		const diffc = function (c) {
			return (v - c) / 6 / diff + 1 / 2;
		};

		if (diff === 0) {
			h = 0;
			s = 0;
		} else {
			s = diff / v;
			rdif = diffc(r);
			gdif = diffc(g);
			bdif = diffc(b);

			if (r === v) {
				h = bdif - gdif;
			} else if (g === v) {
				h = (1 / 3) + rdif - bdif;
			} else if (b === v) {
				h = (2 / 3) + gdif - rdif;
			}

			if (h < 0) {
				h += 1;
			} else if (h > 1) {
				h -= 1;
			}
		}

		return [
			h * 360,
			s * 100,
			v * 100
		];
	};

	convert.rgb.hwb = function (rgb) {
		const r = rgb[0];
		const g = rgb[1];
		let b = rgb[2];
		const h = convert.rgb.hsl(rgb)[0];
		const w = 1 / 255 * Math.min(r, Math.min(g, b));

		b = 1 - 1 / 255 * Math.max(r, Math.max(g, b));

		return [h, w * 100, b * 100];
	};

	convert.rgb.cmyk = function (rgb) {
		const r = rgb[0] / 255;
		const g = rgb[1] / 255;
		const b = rgb[2] / 255;

		const k = Math.min(1 - r, 1 - g, 1 - b);
		const c = (1 - r - k) / (1 - k) || 0;
		const m = (1 - g - k) / (1 - k) || 0;
		const y = (1 - b - k) / (1 - k) || 0;

		return [c * 100, m * 100, y * 100, k * 100];
	};

	function comparativeDistance(x, y) {
		/*
			See https://en.m.wikipedia.org/wiki/Euclidean_distance#Squared_Euclidean_distance
		*/
		return (
			((x[0] - y[0]) ** 2) +
			((x[1] - y[1]) ** 2) +
			((x[2] - y[2]) ** 2)
		);
	}

	convert.rgb.keyword = function (rgb) {
		const reversed = reverseKeywords[rgb];
		if (reversed) {
			return reversed;
		}

		let currentClosestDistance = Infinity;
		let currentClosestKeyword;

		for (const keyword of Object.keys(cssKeywords)) {
			const value = cssKeywords[keyword];

			// Compute comparative distance
			const distance = comparativeDistance(rgb, value);

			// Check if its less, if so set as closest
			if (distance < currentClosestDistance) {
				currentClosestDistance = distance;
				currentClosestKeyword = keyword;
			}
		}

		return currentClosestKeyword;
	};

	convert.keyword.rgb = function (keyword) {
		return cssKeywords[keyword];
	};

	convert.rgb.xyz = function (rgb) {
		let r = rgb[0] / 255;
		let g = rgb[1] / 255;
		let b = rgb[2] / 255;

		// Assume sRGB
		r = r > 0.04045 ? (((r + 0.055) / 1.055) ** 2.4) : (r / 12.92);
		g = g > 0.04045 ? (((g + 0.055) / 1.055) ** 2.4) : (g / 12.92);
		b = b > 0.04045 ? (((b + 0.055) / 1.055) ** 2.4) : (b / 12.92);

		const x = (r * 0.4124) + (g * 0.3576) + (b * 0.1805);
		const y = (r * 0.2126) + (g * 0.7152) + (b * 0.0722);
		const z = (r * 0.0193) + (g * 0.1192) + (b * 0.9505);

		return [x * 100, y * 100, z * 100];
	};

	convert.rgb.lab = function (rgb) {
		const xyz = convert.rgb.xyz(rgb);
		let x = xyz[0];
		let y = xyz[1];
		let z = xyz[2];

		x /= 95.047;
		y /= 100;
		z /= 108.883;

		x = x > 0.008856 ? (x ** (1 / 3)) : (7.787 * x) + (16 / 116);
		y = y > 0.008856 ? (y ** (1 / 3)) : (7.787 * y) + (16 / 116);
		z = z > 0.008856 ? (z ** (1 / 3)) : (7.787 * z) + (16 / 116);

		const l = (116 * y) - 16;
		const a = 500 * (x - y);
		const b = 200 * (y - z);

		return [l, a, b];
	};

	convert.hsl.rgb = function (hsl) {
		const h = hsl[0] / 360;
		const s = hsl[1] / 100;
		const l = hsl[2] / 100;
		let t2;
		let t3;
		let val;

		if (s === 0) {
			val = l * 255;
			return [val, val, val];
		}

		if (l < 0.5) {
			t2 = l * (1 + s);
		} else {
			t2 = l + s - l * s;
		}

		const t1 = 2 * l - t2;

		const rgb = [0, 0, 0];
		for (let i = 0; i < 3; i++) {
			t3 = h + 1 / 3 * -(i - 1);
			if (t3 < 0) {
				t3++;
			}

			if (t3 > 1) {
				t3--;
			}

			if (6 * t3 < 1) {
				val = t1 + (t2 - t1) * 6 * t3;
			} else if (2 * t3 < 1) {
				val = t2;
			} else if (3 * t3 < 2) {
				val = t1 + (t2 - t1) * (2 / 3 - t3) * 6;
			} else {
				val = t1;
			}

			rgb[i] = val * 255;
		}

		return rgb;
	};

	convert.hsl.hsv = function (hsl) {
		const h = hsl[0];
		let s = hsl[1] / 100;
		let l = hsl[2] / 100;
		let smin = s;
		const lmin = Math.max(l, 0.01);

		l *= 2;
		s *= (l <= 1) ? l : 2 - l;
		smin *= lmin <= 1 ? lmin : 2 - lmin;
		const v = (l + s) / 2;
		const sv = l === 0 ? (2 * smin) / (lmin + smin) : (2 * s) / (l + s);

		return [h, sv * 100, v * 100];
	};

	convert.hsv.rgb = function (hsv) {
		const h = hsv[0] / 60;
		const s = hsv[1] / 100;
		let v = hsv[2] / 100;
		const hi = Math.floor(h) % 6;

		const f = h - Math.floor(h);
		const p = 255 * v * (1 - s);
		const q = 255 * v * (1 - (s * f));
		const t = 255 * v * (1 - (s * (1 - f)));
		v *= 255;

		switch (hi) {
			case 0:
				return [v, t, p];
			case 1:
				return [q, v, p];
			case 2:
				return [p, v, t];
			case 3:
				return [p, q, v];
			case 4:
				return [t, p, v];
			case 5:
				return [v, p, q];
		}
	};

	convert.hsv.hsl = function (hsv) {
		const h = hsv[0];
		const s = hsv[1] / 100;
		const v = hsv[2] / 100;
		const vmin = Math.max(v, 0.01);
		let sl;
		let l;

		l = (2 - s) * v;
		const lmin = (2 - s) * vmin;
		sl = s * vmin;
		sl /= (lmin <= 1) ? lmin : 2 - lmin;
		sl = sl || 0;
		l /= 2;

		return [h, sl * 100, l * 100];
	};

	// http://dev.w3.org/csswg/css-color/#hwb-to-rgb
	convert.hwb.rgb = function (hwb) {
		const h = hwb[0] / 360;
		let wh = hwb[1] / 100;
		let bl = hwb[2] / 100;
		const ratio = wh + bl;
		let f;

		// Wh + bl cant be > 1
		if (ratio > 1) {
			wh /= ratio;
			bl /= ratio;
		}

		const i = Math.floor(6 * h);
		const v = 1 - bl;
		f = 6 * h - i;

		if ((i & 0x01) !== 0) {
			f = 1 - f;
		}

		const n = wh + f * (v - wh); // Linear interpolation

		let r;
		let g;
		let b;
		/* eslint-disable max-statements-per-line,no-multi-spaces */
		switch (i) {
			default:
			case 6:
			case 0: r = v;  g = n;  b = wh; break;
			case 1: r = n;  g = v;  b = wh; break;
			case 2: r = wh; g = v;  b = n; break;
			case 3: r = wh; g = n;  b = v; break;
			case 4: r = n;  g = wh; b = v; break;
			case 5: r = v;  g = wh; b = n; break;
		}
		/* eslint-enable max-statements-per-line,no-multi-spaces */

		return [r * 255, g * 255, b * 255];
	};

	convert.cmyk.rgb = function (cmyk) {
		const c = cmyk[0] / 100;
		const m = cmyk[1] / 100;
		const y = cmyk[2] / 100;
		const k = cmyk[3] / 100;

		const r = 1 - Math.min(1, c * (1 - k) + k);
		const g = 1 - Math.min(1, m * (1 - k) + k);
		const b = 1 - Math.min(1, y * (1 - k) + k);

		return [r * 255, g * 255, b * 255];
	};

	convert.xyz.rgb = function (xyz) {
		const x = xyz[0] / 100;
		const y = xyz[1] / 100;
		const z = xyz[2] / 100;
		let r;
		let g;
		let b;

		r = (x * 3.2406) + (y * -1.5372) + (z * -0.4986);
		g = (x * -0.9689) + (y * 1.8758) + (z * 0.0415);
		b = (x * 0.0557) + (y * -0.204) + (z * 1.0570);

		// Assume sRGB
		r = r > 0.0031308
			? ((1.055 * (r ** (1.0 / 2.4))) - 0.055)
			: r * 12.92;

		g = g > 0.0031308
			? ((1.055 * (g ** (1.0 / 2.4))) - 0.055)
			: g * 12.92;

		b = b > 0.0031308
			? ((1.055 * (b ** (1.0 / 2.4))) - 0.055)
			: b * 12.92;

		r = Math.min(Math.max(0, r), 1);
		g = Math.min(Math.max(0, g), 1);
		b = Math.min(Math.max(0, b), 1);

		return [r * 255, g * 255, b * 255];
	};

	convert.xyz.lab = function (xyz) {
		let x = xyz[0];
		let y = xyz[1];
		let z = xyz[2];

		x /= 95.047;
		y /= 100;
		z /= 108.883;

		x = x > 0.008856 ? (x ** (1 / 3)) : (7.787 * x) + (16 / 116);
		y = y > 0.008856 ? (y ** (1 / 3)) : (7.787 * y) + (16 / 116);
		z = z > 0.008856 ? (z ** (1 / 3)) : (7.787 * z) + (16 / 116);

		const l = (116 * y) - 16;
		const a = 500 * (x - y);
		const b = 200 * (y - z);

		return [l, a, b];
	};

	convert.lab.xyz = function (lab) {
		const l = lab[0];
		const a = lab[1];
		const b = lab[2];
		let x;
		let y;
		let z;

		y = (l + 16) / 116;
		x = a / 500 + y;
		z = y - b / 200;

		const y2 = y ** 3;
		const x2 = x ** 3;
		const z2 = z ** 3;
		y = y2 > 0.008856 ? y2 : (y - 16 / 116) / 7.787;
		x = x2 > 0.008856 ? x2 : (x - 16 / 116) / 7.787;
		z = z2 > 0.008856 ? z2 : (z - 16 / 116) / 7.787;

		x *= 95.047;
		y *= 100;
		z *= 108.883;

		return [x, y, z];
	};

	convert.lab.lch = function (lab) {
		const l = lab[0];
		const a = lab[1];
		const b = lab[2];
		let h;

		const hr = Math.atan2(b, a);
		h = hr * 360 / 2 / Math.PI;

		if (h < 0) {
			h += 360;
		}

		const c = Math.sqrt(a * a + b * b);

		return [l, c, h];
	};

	convert.lch.lab = function (lch) {
		const l = lch[0];
		const c = lch[1];
		const h = lch[2];

		const hr = h / 360 * 2 * Math.PI;
		const a = c * Math.cos(hr);
		const b = c * Math.sin(hr);

		return [l, a, b];
	};

	convert.rgb.ansi16 = function (args, saturation = null) {
		const [r, g, b] = args;
		let value = saturation === null ? convert.rgb.hsv(args)[2] : saturation; // Hsv -> ansi16 optimization

		value = Math.round(value / 50);

		if (value === 0) {
			return 30;
		}

		let ansi = 30
			+ ((Math.round(b / 255) << 2)
			| (Math.round(g / 255) << 1)
			| Math.round(r / 255));

		if (value === 2) {
			ansi += 60;
		}

		return ansi;
	};

	convert.hsv.ansi16 = function (args) {
		// Optimization here; we already know the value and don't need to get
		// it converted for us.
		return convert.rgb.ansi16(convert.hsv.rgb(args), args[2]);
	};

	convert.rgb.ansi256 = function (args) {
		const r = args[0];
		const g = args[1];
		const b = args[2];

		// We use the extended greyscale palette here, with the exception of
		// black and white. normal palette only has 4 greyscale shades.
		if (r === g && g === b) {
			if (r < 8) {
				return 16;
			}

			if (r > 248) {
				return 231;
			}

			return Math.round(((r - 8) / 247) * 24) + 232;
		}

		const ansi = 16
			+ (36 * Math.round(r / 255 * 5))
			+ (6 * Math.round(g / 255 * 5))
			+ Math.round(b / 255 * 5);

		return ansi;
	};

	convert.ansi16.rgb = function (args) {
		let color = args % 10;

		// Handle greyscale
		if (color === 0 || color === 7) {
			if (args > 50) {
				color += 3.5;
			}

			color = color / 10.5 * 255;

			return [color, color, color];
		}

		const mult = (~~(args > 50) + 1) * 0.5;
		const r = ((color & 1) * mult) * 255;
		const g = (((color >> 1) & 1) * mult) * 255;
		const b = (((color >> 2) & 1) * mult) * 255;

		return [r, g, b];
	};

	convert.ansi256.rgb = function (args) {
		// Handle greyscale
		if (args >= 232) {
			const c = (args - 232) * 10 + 8;
			return [c, c, c];
		}

		args -= 16;

		let rem;
		const r = Math.floor(args / 36) / 5 * 255;
		const g = Math.floor((rem = args % 36) / 6) / 5 * 255;
		const b = (rem % 6) / 5 * 255;

		return [r, g, b];
	};

	convert.rgb.hex = function (args) {
		const integer = ((Math.round(args[0]) & 0xFF) << 16)
			+ ((Math.round(args[1]) & 0xFF) << 8)
			+ (Math.round(args[2]) & 0xFF);

		const string = integer.toString(16).toUpperCase();
		return '000000'.substring(string.length) + string;
	};

	convert.hex.rgb = function (args) {
		const match = args.toString(16).match(/[a-f0-9]{6}|[a-f0-9]{3}/i);
		if (!match) {
			return [0, 0, 0];
		}

		let colorString = match[0];

		if (match[0].length === 3) {
			colorString = colorString.split('').map(char => {
				return char + char;
			}).join('');
		}

		const integer = parseInt(colorString, 16);
		const r = (integer >> 16) & 0xFF;
		const g = (integer >> 8) & 0xFF;
		const b = integer & 0xFF;

		return [r, g, b];
	};

	convert.rgb.hcg = function (rgb) {
		const r = rgb[0] / 255;
		const g = rgb[1] / 255;
		const b = rgb[2] / 255;
		const max = Math.max(Math.max(r, g), b);
		const min = Math.min(Math.min(r, g), b);
		const chroma = (max - min);
		let grayscale;
		let hue;

		if (chroma < 1) {
			grayscale = min / (1 - chroma);
		} else {
			grayscale = 0;
		}

		if (chroma <= 0) {
			hue = 0;
		} else
		if (max === r) {
			hue = ((g - b) / chroma) % 6;
		} else
		if (max === g) {
			hue = 2 + (b - r) / chroma;
		} else {
			hue = 4 + (r - g) / chroma;
		}

		hue /= 6;
		hue %= 1;

		return [hue * 360, chroma * 100, grayscale * 100];
	};

	convert.hsl.hcg = function (hsl) {
		const s = hsl[1] / 100;
		const l = hsl[2] / 100;

		const c = l < 0.5 ? (2.0 * s * l) : (2.0 * s * (1.0 - l));

		let f = 0;
		if (c < 1.0) {
			f = (l - 0.5 * c) / (1.0 - c);
		}

		return [hsl[0], c * 100, f * 100];
	};

	convert.hsv.hcg = function (hsv) {
		const s = hsv[1] / 100;
		const v = hsv[2] / 100;

		const c = s * v;
		let f = 0;

		if (c < 1.0) {
			f = (v - c) / (1 - c);
		}

		return [hsv[0], c * 100, f * 100];
	};

	convert.hcg.rgb = function (hcg) {
		const h = hcg[0] / 360;
		const c = hcg[1] / 100;
		const g = hcg[2] / 100;

		if (c === 0.0) {
			return [g * 255, g * 255, g * 255];
		}

		const pure = [0, 0, 0];
		const hi = (h % 1) * 6;
		const v = hi % 1;
		const w = 1 - v;
		let mg = 0;

		/* eslint-disable max-statements-per-line */
		switch (Math.floor(hi)) {
			case 0:
				pure[0] = 1; pure[1] = v; pure[2] = 0; break;
			case 1:
				pure[0] = w; pure[1] = 1; pure[2] = 0; break;
			case 2:
				pure[0] = 0; pure[1] = 1; pure[2] = v; break;
			case 3:
				pure[0] = 0; pure[1] = w; pure[2] = 1; break;
			case 4:
				pure[0] = v; pure[1] = 0; pure[2] = 1; break;
			default:
				pure[0] = 1; pure[1] = 0; pure[2] = w;
		}
		/* eslint-enable max-statements-per-line */

		mg = (1.0 - c) * g;

		return [
			(c * pure[0] + mg) * 255,
			(c * pure[1] + mg) * 255,
			(c * pure[2] + mg) * 255
		];
	};

	convert.hcg.hsv = function (hcg) {
		const c = hcg[1] / 100;
		const g = hcg[2] / 100;

		const v = c + g * (1.0 - c);
		let f = 0;

		if (v > 0.0) {
			f = c / v;
		}

		return [hcg[0], f * 100, v * 100];
	};

	convert.hcg.hsl = function (hcg) {
		const c = hcg[1] / 100;
		const g = hcg[2] / 100;

		const l = g * (1.0 - c) + 0.5 * c;
		let s = 0;

		if (l > 0.0 && l < 0.5) {
			s = c / (2 * l);
		} else
		if (l >= 0.5 && l < 1.0) {
			s = c / (2 * (1 - l));
		}

		return [hcg[0], s * 100, l * 100];
	};

	convert.hcg.hwb = function (hcg) {
		const c = hcg[1] / 100;
		const g = hcg[2] / 100;
		const v = c + g * (1.0 - c);
		return [hcg[0], (v - c) * 100, (1 - v) * 100];
	};

	convert.hwb.hcg = function (hwb) {
		const w = hwb[1] / 100;
		const b = hwb[2] / 100;
		const v = 1 - b;
		const c = v - w;
		let g = 0;

		if (c < 1) {
			g = (v - c) / (1 - c);
		}

		return [hwb[0], c * 100, g * 100];
	};

	convert.apple.rgb = function (apple) {
		return [(apple[0] / 65535) * 255, (apple[1] / 65535) * 255, (apple[2] / 65535) * 255];
	};

	convert.rgb.apple = function (rgb) {
		return [(rgb[0] / 255) * 65535, (rgb[1] / 255) * 65535, (rgb[2] / 255) * 65535];
	};

	convert.gray.rgb = function (args) {
		return [args[0] / 100 * 255, args[0] / 100 * 255, args[0] / 100 * 255];
	};

	convert.gray.hsl = function (args) {
		return [0, 0, args[0]];
	};

	convert.gray.hsv = convert.gray.hsl;

	convert.gray.hwb = function (gray) {
		return [0, 100, gray[0]];
	};

	convert.gray.cmyk = function (gray) {
		return [0, 0, 0, gray[0]];
	};

	convert.gray.lab = function (gray) {
		return [gray[0], 0, 0];
	};

	convert.gray.hex = function (gray) {
		const val = Math.round(gray[0] / 100 * 255) & 0xFF;
		const integer = (val << 16) + (val << 8) + val;

		const string = integer.toString(16).toUpperCase();
		return '000000'.substring(string.length) + string;
	};

	convert.rgb.gray = function (rgb) {
		const val = (rgb[0] + rgb[1] + rgb[2]) / 3;
		return [val / 255 * 100];
	};
	return conversions;
}

var route;
var hasRequiredRoute;

function requireRoute () {
	if (hasRequiredRoute) return route;
	hasRequiredRoute = 1;
	const conversions = requireConversions();

	/*
		This function routes a model to all other models.

		all functions that are routed have a property `.conversion` attached
		to the returned synthetic function. This property is an array
		of strings, each with the steps in between the 'from' and 'to'
		color models (inclusive).

		conversions that are not possible simply are not included.
	*/

	function buildGraph() {
		const graph = {};
		// https://jsperf.com/object-keys-vs-for-in-with-closure/3
		const models = Object.keys(conversions);

		for (let len = models.length, i = 0; i < len; i++) {
			graph[models[i]] = {
				// http://jsperf.com/1-vs-infinity
				// micro-opt, but this is simple.
				distance: -1,
				parent: null
			};
		}

		return graph;
	}

	// https://en.wikipedia.org/wiki/Breadth-first_search
	function deriveBFS(fromModel) {
		const graph = buildGraph();
		const queue = [fromModel]; // Unshift -> queue -> pop

		graph[fromModel].distance = 0;

		while (queue.length) {
			const current = queue.pop();
			const adjacents = Object.keys(conversions[current]);

			for (let len = adjacents.length, i = 0; i < len; i++) {
				const adjacent = adjacents[i];
				const node = graph[adjacent];

				if (node.distance === -1) {
					node.distance = graph[current].distance + 1;
					node.parent = current;
					queue.unshift(adjacent);
				}
			}
		}

		return graph;
	}

	function link(from, to) {
		return function (args) {
			return to(from(args));
		};
	}

	function wrapConversion(toModel, graph) {
		const path = [graph[toModel].parent, toModel];
		let fn = conversions[graph[toModel].parent][toModel];

		let cur = graph[toModel].parent;
		while (graph[cur].parent) {
			path.unshift(graph[cur].parent);
			fn = link(conversions[graph[cur].parent][cur], fn);
			cur = graph[cur].parent;
		}

		fn.conversion = path;
		return fn;
	}

	route = function (fromModel) {
		const graph = deriveBFS(fromModel);
		const conversion = {};

		const models = Object.keys(graph);
		for (let len = models.length, i = 0; i < len; i++) {
			const toModel = models[i];
			const node = graph[toModel];

			if (node.parent === null) {
				// No possible conversion, or this node is the source model.
				continue;
			}

			conversion[toModel] = wrapConversion(toModel, graph);
		}

		return conversion;
	};
	return route;
}

var colorConvert;
var hasRequiredColorConvert;

function requireColorConvert () {
	if (hasRequiredColorConvert) return colorConvert;
	hasRequiredColorConvert = 1;
	const conversions = requireConversions();
	const route = requireRoute();

	const convert = {};

	const models = Object.keys(conversions);

	function wrapRaw(fn) {
		const wrappedFn = function (...args) {
			const arg0 = args[0];
			if (arg0 === undefined || arg0 === null) {
				return arg0;
			}

			if (arg0.length > 1) {
				args = arg0;
			}

			return fn(args);
		};

		// Preserve .conversion property if there is one
		if ('conversion' in fn) {
			wrappedFn.conversion = fn.conversion;
		}

		return wrappedFn;
	}

	function wrapRounded(fn) {
		const wrappedFn = function (...args) {
			const arg0 = args[0];

			if (arg0 === undefined || arg0 === null) {
				return arg0;
			}

			if (arg0.length > 1) {
				args = arg0;
			}

			const result = fn(args);

			// We're assuming the result is an array here.
			// see notice in conversions.js; don't use box types
			// in conversion functions.
			if (typeof result === 'object') {
				for (let len = result.length, i = 0; i < len; i++) {
					result[i] = Math.round(result[i]);
				}
			}

			return result;
		};

		// Preserve .conversion property if there is one
		if ('conversion' in fn) {
			wrappedFn.conversion = fn.conversion;
		}

		return wrappedFn;
	}

	models.forEach(fromModel => {
		convert[fromModel] = {};

		Object.defineProperty(convert[fromModel], 'channels', {value: conversions[fromModel].channels});
		Object.defineProperty(convert[fromModel], 'labels', {value: conversions[fromModel].labels});

		const routes = route(fromModel);
		const routeModels = Object.keys(routes);

		routeModels.forEach(toModel => {
			const fn = routes[toModel];

			convert[fromModel][toModel] = wrapRounded(fn);
			convert[fromModel][toModel].raw = wrapRaw(fn);
		});
	});

	colorConvert = convert;
	return colorConvert;
}

ansiStyles$1.exports;

(function (module) {

	const wrapAnsi16 = (fn, offset) => (...args) => {
		const code = fn(...args);
		return `\u001B[${code + offset}m`;
	};

	const wrapAnsi256 = (fn, offset) => (...args) => {
		const code = fn(...args);
		return `\u001B[${38 + offset};5;${code}m`;
	};

	const wrapAnsi16m = (fn, offset) => (...args) => {
		const rgb = fn(...args);
		return `\u001B[${38 + offset};2;${rgb[0]};${rgb[1]};${rgb[2]}m`;
	};

	const ansi2ansi = n => n;
	const rgb2rgb = (r, g, b) => [r, g, b];

	const setLazyProperty = (object, property, get) => {
		Object.defineProperty(object, property, {
			get: () => {
				const value = get();

				Object.defineProperty(object, property, {
					value,
					enumerable: true,
					configurable: true
				});

				return value;
			},
			enumerable: true,
			configurable: true
		});
	};

	/** @type {typeof import('color-convert')} */
	let colorConvert;
	const makeDynamicStyles = (wrap, targetSpace, identity, isBackground) => {
		if (colorConvert === undefined) {
			colorConvert = requireColorConvert();
		}

		const offset = isBackground ? 10 : 0;
		const styles = {};

		for (const [sourceSpace, suite] of Object.entries(colorConvert)) {
			const name = sourceSpace === 'ansi16' ? 'ansi' : sourceSpace;
			if (sourceSpace === targetSpace) {
				styles[name] = wrap(identity, offset);
			} else if (typeof suite === 'object') {
				styles[name] = wrap(suite[targetSpace], offset);
			}
		}

		return styles;
	};

	function assembleStyles() {
		const codes = new Map();
		const styles = {
			modifier: {
				reset: [0, 0],
				// 21 isn't widely supported and 22 does the same thing
				bold: [1, 22],
				dim: [2, 22],
				italic: [3, 23],
				underline: [4, 24],
				inverse: [7, 27],
				hidden: [8, 28],
				strikethrough: [9, 29]
			},
			color: {
				black: [30, 39],
				red: [31, 39],
				green: [32, 39],
				yellow: [33, 39],
				blue: [34, 39],
				magenta: [35, 39],
				cyan: [36, 39],
				white: [37, 39],

				// Bright color
				blackBright: [90, 39],
				redBright: [91, 39],
				greenBright: [92, 39],
				yellowBright: [93, 39],
				blueBright: [94, 39],
				magentaBright: [95, 39],
				cyanBright: [96, 39],
				whiteBright: [97, 39]
			},
			bgColor: {
				bgBlack: [40, 49],
				bgRed: [41, 49],
				bgGreen: [42, 49],
				bgYellow: [43, 49],
				bgBlue: [44, 49],
				bgMagenta: [45, 49],
				bgCyan: [46, 49],
				bgWhite: [47, 49],

				// Bright color
				bgBlackBright: [100, 49],
				bgRedBright: [101, 49],
				bgGreenBright: [102, 49],
				bgYellowBright: [103, 49],
				bgBlueBright: [104, 49],
				bgMagentaBright: [105, 49],
				bgCyanBright: [106, 49],
				bgWhiteBright: [107, 49]
			}
		};

		// Alias bright black as gray (and grey)
		styles.color.gray = styles.color.blackBright;
		styles.bgColor.bgGray = styles.bgColor.bgBlackBright;
		styles.color.grey = styles.color.blackBright;
		styles.bgColor.bgGrey = styles.bgColor.bgBlackBright;

		for (const [groupName, group] of Object.entries(styles)) {
			for (const [styleName, style] of Object.entries(group)) {
				styles[styleName] = {
					open: `\u001B[${style[0]}m`,
					close: `\u001B[${style[1]}m`
				};

				group[styleName] = styles[styleName];

				codes.set(style[0], style[1]);
			}

			Object.defineProperty(styles, groupName, {
				value: group,
				enumerable: false
			});
		}

		Object.defineProperty(styles, 'codes', {
			value: codes,
			enumerable: false
		});

		styles.color.close = '\u001B[39m';
		styles.bgColor.close = '\u001B[49m';

		setLazyProperty(styles.color, 'ansi', () => makeDynamicStyles(wrapAnsi16, 'ansi16', ansi2ansi, false));
		setLazyProperty(styles.color, 'ansi256', () => makeDynamicStyles(wrapAnsi256, 'ansi256', ansi2ansi, false));
		setLazyProperty(styles.color, 'ansi16m', () => makeDynamicStyles(wrapAnsi16m, 'rgb', rgb2rgb, false));
		setLazyProperty(styles.bgColor, 'ansi', () => makeDynamicStyles(wrapAnsi16, 'ansi16', ansi2ansi, true));
		setLazyProperty(styles.bgColor, 'ansi256', () => makeDynamicStyles(wrapAnsi256, 'ansi256', ansi2ansi, true));
		setLazyProperty(styles.bgColor, 'ansi16m', () => makeDynamicStyles(wrapAnsi16m, 'rgb', rgb2rgb, true));

		return styles;
	}

	// Make the export immutable
	Object.defineProperty(module, 'exports', {
		enumerable: true,
		get: assembleStyles
	}); 
} (ansiStyles$1));

var ansiStylesExports = ansiStyles$1.exports;

var hasFlag$1 = (flag, argv = process.argv) => {
	const prefix = flag.startsWith('-') ? '' : (flag.length === 1 ? '-' : '--');
	const position = argv.indexOf(prefix + flag);
	const terminatorPosition = argv.indexOf('--');
	return position !== -1 && (terminatorPosition === -1 || position < terminatorPosition);
};

const os$4 = require$$0$3;
const tty = require$$1$1;
const hasFlag = hasFlag$1;

const {env: env$2} = process;

let forceColor;
if (hasFlag('no-color') ||
	hasFlag('no-colors') ||
	hasFlag('color=false') ||
	hasFlag('color=never')) {
	forceColor = 0;
} else if (hasFlag('color') ||
	hasFlag('colors') ||
	hasFlag('color=true') ||
	hasFlag('color=always')) {
	forceColor = 1;
}

if ('FORCE_COLOR' in env$2) {
	if (env$2.FORCE_COLOR === 'true') {
		forceColor = 1;
	} else if (env$2.FORCE_COLOR === 'false') {
		forceColor = 0;
	} else {
		forceColor = env$2.FORCE_COLOR.length === 0 ? 1 : Math.min(parseInt(env$2.FORCE_COLOR, 10), 3);
	}
}

function translateLevel(level) {
	if (level === 0) {
		return false;
	}

	return {
		level,
		hasBasic: true,
		has256: level >= 2,
		has16m: level >= 3
	};
}

function supportsColor(haveStream, streamIsTTY) {
	if (forceColor === 0) {
		return 0;
	}

	if (hasFlag('color=16m') ||
		hasFlag('color=full') ||
		hasFlag('color=truecolor')) {
		return 3;
	}

	if (hasFlag('color=256')) {
		return 2;
	}

	if (!streamIsTTY && forceColor === undefined) {
		return 0;
	}

	const min = forceColor || 0;

	if (env$2.TERM === 'dumb') {
		return min;
	}

	if (process.platform === 'win32') {
		// Windows 10 build 10586 is the first Windows release that supports 256 colors.
		// Windows 10 build 14931 is the first release that supports 16m/TrueColor.
		const osRelease = os$4.release().split('.');
		if (
			Number(osRelease[0]) >= 10 &&
			Number(osRelease[2]) >= 10586
		) {
			return Number(osRelease[2]) >= 14931 ? 3 : 2;
		}

		return 1;
	}

	if ('CI' in env$2) {
		if (['TRAVIS', 'CIRCLECI', 'APPVEYOR', 'GITLAB_CI', 'GITHUB_ACTIONS', 'BUILDKITE'].some(sign => sign in env$2) || env$2.CI_NAME === 'codeship') {
			return 1;
		}

		return min;
	}

	if ('TEAMCITY_VERSION' in env$2) {
		return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(env$2.TEAMCITY_VERSION) ? 1 : 0;
	}

	if (env$2.COLORTERM === 'truecolor') {
		return 3;
	}

	if ('TERM_PROGRAM' in env$2) {
		const version = parseInt((env$2.TERM_PROGRAM_VERSION || '').split('.')[0], 10);

		switch (env$2.TERM_PROGRAM) {
			case 'iTerm.app':
				return version >= 3 ? 3 : 2;
			case 'Apple_Terminal':
				return 2;
			// No default
		}
	}

	if (/-256(color)?$/i.test(env$2.TERM)) {
		return 2;
	}

	if (/^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(env$2.TERM)) {
		return 1;
	}

	if ('COLORTERM' in env$2) {
		return 1;
	}

	return min;
}

var supportsColor_1 = {
	stdout: translateLevel(supportsColor(true, tty.isatty(1))),
	stderr: translateLevel(supportsColor(true, tty.isatty(2)))
};

const stringReplaceAll$1 = (string, substring, replacer) => {
	let index = string.indexOf(substring);
	if (index === -1) {
		return string;
	}

	const substringLength = substring.length;
	let endIndex = 0;
	let returnValue = '';
	do {
		returnValue += string.substr(endIndex, index - endIndex) + substring + replacer;
		endIndex = index + substringLength;
		index = string.indexOf(substring, endIndex);
	} while (index !== -1);

	returnValue += string.substr(endIndex);
	return returnValue;
};

const stringEncaseCRLFWithFirstIndex$1 = (string, prefix, postfix, index) => {
	let endIndex = 0;
	let returnValue = '';
	do {
		const gotCR = string[index - 1] === '\r';
		returnValue += string.substr(endIndex, (gotCR ? index - 1 : index) - endIndex) + prefix + (gotCR ? '\r\n' : '\n') + postfix;
		endIndex = index + 1;
		index = string.indexOf('\n', endIndex);
	} while (index !== -1);

	returnValue += string.substr(endIndex);
	return returnValue;
};

var util$2 = {
	stringReplaceAll: stringReplaceAll$1,
	stringEncaseCRLFWithFirstIndex: stringEncaseCRLFWithFirstIndex$1
};

var templates;
var hasRequiredTemplates;

function requireTemplates () {
	if (hasRequiredTemplates) return templates;
	hasRequiredTemplates = 1;
	const TEMPLATE_REGEX = /(?:\\(u(?:[a-f\d]{4}|\{[a-f\d]{1,6}\})|x[a-f\d]{2}|.))|(?:\{(~)?(\w+(?:\([^)]*\))?(?:\.\w+(?:\([^)]*\))?)*)(?:[ \t]|(?=\r?\n)))|(\})|((?:.|[\r\n\f])+?)/gi;
	const STYLE_REGEX = /(?:^|\.)(\w+)(?:\(([^)]*)\))?/g;
	const STRING_REGEX = /^(['"])((?:\\.|(?!\1)[^\\])*)\1$/;
	const ESCAPE_REGEX = /\\(u(?:[a-f\d]{4}|{[a-f\d]{1,6}})|x[a-f\d]{2}|.)|([^\\])/gi;

	const ESCAPES = new Map([
		['n', '\n'],
		['r', '\r'],
		['t', '\t'],
		['b', '\b'],
		['f', '\f'],
		['v', '\v'],
		['0', '\0'],
		['\\', '\\'],
		['e', '\u001B'],
		['a', '\u0007']
	]);

	function unescape(c) {
		const u = c[0] === 'u';
		const bracket = c[1] === '{';

		if ((u && !bracket && c.length === 5) || (c[0] === 'x' && c.length === 3)) {
			return String.fromCharCode(parseInt(c.slice(1), 16));
		}

		if (u && bracket) {
			return String.fromCodePoint(parseInt(c.slice(2, -1), 16));
		}

		return ESCAPES.get(c) || c;
	}

	function parseArguments(name, arguments_) {
		const results = [];
		const chunks = arguments_.trim().split(/\s*,\s*/g);
		let matches;

		for (const chunk of chunks) {
			const number = Number(chunk);
			if (!Number.isNaN(number)) {
				results.push(number);
			} else if ((matches = chunk.match(STRING_REGEX))) {
				results.push(matches[2].replace(ESCAPE_REGEX, (m, escape, character) => escape ? unescape(escape) : character));
			} else {
				throw new Error(`Invalid Chalk template style argument: ${chunk} (in style '${name}')`);
			}
		}

		return results;
	}

	function parseStyle(style) {
		STYLE_REGEX.lastIndex = 0;

		const results = [];
		let matches;

		while ((matches = STYLE_REGEX.exec(style)) !== null) {
			const name = matches[1];

			if (matches[2]) {
				const args = parseArguments(name, matches[2]);
				results.push([name].concat(args));
			} else {
				results.push([name]);
			}
		}

		return results;
	}

	function buildStyle(chalk, styles) {
		const enabled = {};

		for (const layer of styles) {
			for (const style of layer.styles) {
				enabled[style[0]] = layer.inverse ? null : style.slice(1);
			}
		}

		let current = chalk;
		for (const [styleName, styles] of Object.entries(enabled)) {
			if (!Array.isArray(styles)) {
				continue;
			}

			if (!(styleName in current)) {
				throw new Error(`Unknown Chalk style: ${styleName}`);
			}

			current = styles.length > 0 ? current[styleName](...styles) : current[styleName];
		}

		return current;
	}

	templates = (chalk, temporary) => {
		const styles = [];
		const chunks = [];
		let chunk = [];

		// eslint-disable-next-line max-params
		temporary.replace(TEMPLATE_REGEX, (m, escapeCharacter, inverse, style, close, character) => {
			if (escapeCharacter) {
				chunk.push(unescape(escapeCharacter));
			} else if (style) {
				const string = chunk.join('');
				chunk = [];
				chunks.push(styles.length === 0 ? string : buildStyle(chalk, styles)(string));
				styles.push({inverse, styles: parseStyle(style)});
			} else if (close) {
				if (styles.length === 0) {
					throw new Error('Found extraneous } in Chalk template literal');
				}

				chunks.push(buildStyle(chalk, styles)(chunk.join('')));
				chunk = [];
				styles.pop();
			} else {
				chunk.push(character);
			}
		});

		chunks.push(chunk.join(''));

		if (styles.length > 0) {
			const errMessage = `Chalk template literal is missing ${styles.length} closing bracket${styles.length === 1 ? '' : 's'} (\`}\`)`;
			throw new Error(errMessage);
		}

		return chunks.join('');
	};
	return templates;
}

const ansiStyles = ansiStylesExports;
const {stdout: stdoutColor, stderr: stderrColor} = supportsColor_1;
const {
	stringReplaceAll,
	stringEncaseCRLFWithFirstIndex
} = util$2;

const {isArray} = Array;

// `supportsColor.level` → `ansiStyles.color[name]` mapping
const levelMapping = [
	'ansi',
	'ansi',
	'ansi256',
	'ansi16m'
];

const styles = Object.create(null);

const applyOptions = (object, options = {}) => {
	if (options.level && !(Number.isInteger(options.level) && options.level >= 0 && options.level <= 3)) {
		throw new Error('The `level` option should be an integer from 0 to 3');
	}

	// Detect level if not set manually
	const colorLevel = stdoutColor ? stdoutColor.level : 0;
	object.level = options.level === undefined ? colorLevel : options.level;
};

class ChalkClass {
	constructor(options) {
		// eslint-disable-next-line no-constructor-return
		return chalkFactory(options);
	}
}

const chalkFactory = options => {
	const chalk = {};
	applyOptions(chalk, options);

	chalk.template = (...arguments_) => chalkTag(chalk.template, ...arguments_);

	Object.setPrototypeOf(chalk, Chalk.prototype);
	Object.setPrototypeOf(chalk.template, chalk);

	chalk.template.constructor = () => {
		throw new Error('`chalk.constructor()` is deprecated. Use `new chalk.Instance()` instead.');
	};

	chalk.template.Instance = ChalkClass;

	return chalk.template;
};

function Chalk(options) {
	return chalkFactory(options);
}

for (const [styleName, style] of Object.entries(ansiStyles)) {
	styles[styleName] = {
		get() {
			const builder = createBuilder(this, createStyler(style.open, style.close, this._styler), this._isEmpty);
			Object.defineProperty(this, styleName, {value: builder});
			return builder;
		}
	};
}

styles.visible = {
	get() {
		const builder = createBuilder(this, this._styler, true);
		Object.defineProperty(this, 'visible', {value: builder});
		return builder;
	}
};

const usedModels = ['rgb', 'hex', 'keyword', 'hsl', 'hsv', 'hwb', 'ansi', 'ansi256'];

for (const model of usedModels) {
	styles[model] = {
		get() {
			const {level} = this;
			return function (...arguments_) {
				const styler = createStyler(ansiStyles.color[levelMapping[level]][model](...arguments_), ansiStyles.color.close, this._styler);
				return createBuilder(this, styler, this._isEmpty);
			};
		}
	};
}

for (const model of usedModels) {
	const bgModel = 'bg' + model[0].toUpperCase() + model.slice(1);
	styles[bgModel] = {
		get() {
			const {level} = this;
			return function (...arguments_) {
				const styler = createStyler(ansiStyles.bgColor[levelMapping[level]][model](...arguments_), ansiStyles.bgColor.close, this._styler);
				return createBuilder(this, styler, this._isEmpty);
			};
		}
	};
}

const proto = Object.defineProperties(() => {}, {
	...styles,
	level: {
		enumerable: true,
		get() {
			return this._generator.level;
		},
		set(level) {
			this._generator.level = level;
		}
	}
});

const createStyler = (open, close, parent) => {
	let openAll;
	let closeAll;
	if (parent === undefined) {
		openAll = open;
		closeAll = close;
	} else {
		openAll = parent.openAll + open;
		closeAll = close + parent.closeAll;
	}

	return {
		open,
		close,
		openAll,
		closeAll,
		parent
	};
};

const createBuilder = (self, _styler, _isEmpty) => {
	const builder = (...arguments_) => {
		if (isArray(arguments_[0]) && isArray(arguments_[0].raw)) {
			// Called as a template literal, for example: chalk.red`2 + 3 = {bold ${2+3}}`
			return applyStyle(builder, chalkTag(builder, ...arguments_));
		}

		// Single argument is hot path, implicit coercion is faster than anything
		// eslint-disable-next-line no-implicit-coercion
		return applyStyle(builder, (arguments_.length === 1) ? ('' + arguments_[0]) : arguments_.join(' '));
	};

	// We alter the prototype because we must return a function, but there is
	// no way to create a function with a different prototype
	Object.setPrototypeOf(builder, proto);

	builder._generator = self;
	builder._styler = _styler;
	builder._isEmpty = _isEmpty;

	return builder;
};

const applyStyle = (self, string) => {
	if (self.level <= 0 || !string) {
		return self._isEmpty ? '' : string;
	}

	let styler = self._styler;

	if (styler === undefined) {
		return string;
	}

	const {openAll, closeAll} = styler;
	if (string.indexOf('\u001B') !== -1) {
		while (styler !== undefined) {
			// Replace any instances already present with a re-opening code
			// otherwise only the part of the string until said closing code
			// will be colored, and the rest will simply be 'plain'.
			string = stringReplaceAll(string, styler.close, styler.open);

			styler = styler.parent;
		}
	}

	// We can move both next actions out of loop, because remaining actions in loop won't have
	// any/visible effect on parts we add here. Close the styling before a linebreak and reopen
	// after next line to fix a bleed issue on macOS: https://github.com/chalk/chalk/pull/92
	const lfIndex = string.indexOf('\n');
	if (lfIndex !== -1) {
		string = stringEncaseCRLFWithFirstIndex(string, closeAll, openAll, lfIndex);
	}

	return openAll + string + closeAll;
};

let template;
const chalkTag = (chalk, ...strings) => {
	const [firstString] = strings;

	if (!isArray(firstString) || !isArray(firstString.raw)) {
		// If chalk() was called by itself or with a string,
		// return the string itself as a string.
		return strings.join(' ');
	}

	const arguments_ = strings.slice(1);
	const parts = [firstString.raw[0]];

	for (let i = 1; i < firstString.length; i++) {
		parts.push(
			String(arguments_[i - 1]).replace(/[{}\\]/g, '\\$&'),
			String(firstString.raw[i])
		);
	}

	if (template === undefined) {
		template = requireTemplates();
	}

	return template(chalk, parts.join(''));
};

Object.defineProperties(Chalk.prototype, styles);

const chalk$a = Chalk(); // eslint-disable-line new-cap
chalk$a.supportsColor = stdoutColor;
chalk$a.stderr = Chalk({level: stderrColor ? stderrColor.level : 0}); // eslint-disable-line new-cap
chalk$a.stderr.supportsColor = stderrColor;

var source$1 = chalk$a;

var name = "@silencetao/ccapi";
var version$1 = "1.0.11";
var author = "4xian (https://github.com/4xian)";
var description = "A tool for quickly switching Claude Code configurations, supporting URL, API_KEY, AUTH_TOKEN, MODEL quick switching, one-click management of system environment variables, delay speed measurement, automatic optimal line selection, and internationalization support";
var repository = {
	url: "git+https://github.com/4xian/claude-auto-api.git"
};
var homepage = "https://github.com/4xian";
var main$1 = "dist/index.js";
var bin = {
	ccapi: "bin/ccapi"
};
var scripts$2 = {
	build: "rollup -c",
	dev: "rollup -c -w",
	format: "prettier --write \"src/**/*.js\"",
	prepare: "husky install",
	prepublishOnly: "npm run build"
};
var keywords = [
	"claude",
	"claude code",
	"ccapi",
	"AI",
	"config",
	"settings.json"
];
var license = "MIT";
var dependencies = {
	"@iarna/toml": "^2.2.5",
	chalk: "^4.1.2",
	commander: "^11.1.0",
	"cross-spawn": "^7.0.6",
	"fs-extra": "^11.2.0",
	"js-toml": "^1.0.2",
	"js-yaml": "^4.1.0",
	json5: "^2.2.3"
};
var devDependencies = {
	"@rollup/plugin-commonjs": "^25.0.7",
	"@rollup/plugin-json": "^6.0.1",
	"@rollup/plugin-node-resolve": "^15.2.3",
	"@rollup/plugin-terser": "^0.4.4",
	husky: "^8.0.3",
	"lint-staged": "^15.2.0",
	prettier: "^3.1.1",
	rollup: "^4.9.0"
};
var engines = {
	node: ">=18.0.0"
};
var updateLogs = [
	"1. Modify the test command to support both API mock and CLI. API testing is used by default.",
	"2. 调整ccapi test有效性测试命令，支持API模拟和CLI两种测试方式，默认使用API测试(API测试快速，准确性较高[ccapi test]；CLI测试准确较慢[ccapi test -c])"
];
var files = [
	"dist",
	"bin",
	"README.md"
];
var require$$2$1 = {
	name: name,
	version: version$1,
	author: author,
	description: description,
	repository: repository,
	homepage: homepage,
	main: main$1,
	bin: bin,
	scripts: scripts$2,
	keywords: keywords,
	license: license,
	dependencies: dependencies,
	devDependencies: devDependencies,
	engines: engines,
	updateLogs: updateLogs,
	files: files,
	"lint-staged": {
	"src/**/*.js": [
		"prettier --write"
	]
}
};

const { exec: exec$1 } = require$$0$2;
const { promisify: promisify$1 } = require$$4$1;
const packageJson$3 = require$$2$1;

const execPromise = promisify$1(exec$1);

/**
 * 从npm registry获取最新版本信息
 * @param {string} packageName - 包名
 * @returns {Promise<string>} 最新版本号
 */
async function fetchLatestVersion(packageName) {
  const { stdout } = await execPromise(`npm view ${packageName} version`);
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
    .map((num) => parseInt(num, 10));
  const v2 = version2
    .replace(/^v/, '')
    .split('.')
    .map((num) => parseInt(num, 10));

  const maxLength = Math.max(v1.length, v2.length);

  for (let i = 0; i < maxLength; i++) {
    const num1 = v1[i] || 0;
    const num2 = v2[i] || 0;

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
async function checkUpdateQuietly$1() {
  const currentVersion = packageJson$3.version;

  try {
    const latestVersion = await fetchLatestVersion(packageJson$3.name);
    const shouldUpdate = needsUpdate(currentVersion, latestVersion);

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

var versionChecker = {
  checkUpdateQuietly: checkUpdateQuietly$1
};

var fs$k = {};

var universalify$1 = {};

universalify$1.fromCallback = function (fn) {
  return Object.defineProperty(function (...args) {
    if (typeof args[args.length - 1] === 'function') fn.apply(this, args);
    else {
      return new Promise((resolve, reject) => {
        args.push((err, res) => (err != null) ? reject(err) : resolve(res));
        fn.apply(this, args);
      })
    }
  }, 'name', { value: fn.name })
};

universalify$1.fromPromise = function (fn) {
  return Object.defineProperty(function (...args) {
    const cb = args[args.length - 1];
    if (typeof cb !== 'function') return fn.apply(this, args)
    else {
      args.pop();
      fn.apply(this, args).then(r => cb(null, r), cb);
    }
  }, 'name', { value: fn.name })
};

var constants$1 = require$$0$4;

var origCwd = process.cwd;
var cwd = null;

var platform = process.env.GRACEFUL_FS_PLATFORM || process.platform;

process.cwd = function() {
  if (!cwd)
    cwd = origCwd.call(process);
  return cwd
};
try {
  process.cwd();
} catch (er) {}

// This check is needed until node.js 12 is required
if (typeof process.chdir === 'function') {
  var chdir = process.chdir;
  process.chdir = function (d) {
    cwd = null;
    chdir.call(process, d);
  };
  if (Object.setPrototypeOf) Object.setPrototypeOf(process.chdir, chdir);
}

var polyfills$1 = patch$1;

function patch$1 (fs) {
  // (re-)implement some things that are known busted or missing.

  // lchmod, broken prior to 0.6.2
  // back-port the fix here.
  if (constants$1.hasOwnProperty('O_SYMLINK') &&
      process.version.match(/^v0\.6\.[0-2]|^v0\.5\./)) {
    patchLchmod(fs);
  }

  // lutimes implementation, or no-op
  if (!fs.lutimes) {
    patchLutimes(fs);
  }

  // https://github.com/isaacs/node-graceful-fs/issues/4
  // Chown should not fail on einval or eperm if non-root.
  // It should not fail on enosys ever, as this just indicates
  // that a fs doesn't support the intended operation.

  fs.chown = chownFix(fs.chown);
  fs.fchown = chownFix(fs.fchown);
  fs.lchown = chownFix(fs.lchown);

  fs.chmod = chmodFix(fs.chmod);
  fs.fchmod = chmodFix(fs.fchmod);
  fs.lchmod = chmodFix(fs.lchmod);

  fs.chownSync = chownFixSync(fs.chownSync);
  fs.fchownSync = chownFixSync(fs.fchownSync);
  fs.lchownSync = chownFixSync(fs.lchownSync);

  fs.chmodSync = chmodFixSync(fs.chmodSync);
  fs.fchmodSync = chmodFixSync(fs.fchmodSync);
  fs.lchmodSync = chmodFixSync(fs.lchmodSync);

  fs.stat = statFix(fs.stat);
  fs.fstat = statFix(fs.fstat);
  fs.lstat = statFix(fs.lstat);

  fs.statSync = statFixSync(fs.statSync);
  fs.fstatSync = statFixSync(fs.fstatSync);
  fs.lstatSync = statFixSync(fs.lstatSync);

  // if lchmod/lchown do not exist, then make them no-ops
  if (fs.chmod && !fs.lchmod) {
    fs.lchmod = function (path, mode, cb) {
      if (cb) process.nextTick(cb);
    };
    fs.lchmodSync = function () {};
  }
  if (fs.chown && !fs.lchown) {
    fs.lchown = function (path, uid, gid, cb) {
      if (cb) process.nextTick(cb);
    };
    fs.lchownSync = function () {};
  }

  // on Windows, A/V software can lock the directory, causing this
  // to fail with an EACCES or EPERM if the directory contains newly
  // created files.  Try again on failure, for up to 60 seconds.

  // Set the timeout this long because some Windows Anti-Virus, such as Parity
  // bit9, may lock files for up to a minute, causing npm package install
  // failures. Also, take care to yield the scheduler. Windows scheduling gives
  // CPU to a busy looping process, which can cause the program causing the lock
  // contention to be starved of CPU by node, so the contention doesn't resolve.
  if (platform === "win32") {
    fs.rename = typeof fs.rename !== 'function' ? fs.rename
    : (function (fs$rename) {
      function rename (from, to, cb) {
        var start = Date.now();
        var backoff = 0;
        fs$rename(from, to, function CB (er) {
          if (er
              && (er.code === "EACCES" || er.code === "EPERM" || er.code === "EBUSY")
              && Date.now() - start < 60000) {
            setTimeout(function() {
              fs.stat(to, function (stater, st) {
                if (stater && stater.code === "ENOENT")
                  fs$rename(from, to, CB);
                else
                  cb(er);
              });
            }, backoff);
            if (backoff < 100)
              backoff += 10;
            return;
          }
          if (cb) cb(er);
        });
      }
      if (Object.setPrototypeOf) Object.setPrototypeOf(rename, fs$rename);
      return rename
    })(fs.rename);
  }

  // if read() returns EAGAIN, then just try it again.
  fs.read = typeof fs.read !== 'function' ? fs.read
  : (function (fs$read) {
    function read (fd, buffer, offset, length, position, callback_) {
      var callback;
      if (callback_ && typeof callback_ === 'function') {
        var eagCounter = 0;
        callback = function (er, _, __) {
          if (er && er.code === 'EAGAIN' && eagCounter < 10) {
            eagCounter ++;
            return fs$read.call(fs, fd, buffer, offset, length, position, callback)
          }
          callback_.apply(this, arguments);
        };
      }
      return fs$read.call(fs, fd, buffer, offset, length, position, callback)
    }

    // This ensures `util.promisify` works as it does for native `fs.read`.
    if (Object.setPrototypeOf) Object.setPrototypeOf(read, fs$read);
    return read
  })(fs.read);

  fs.readSync = typeof fs.readSync !== 'function' ? fs.readSync
  : (function (fs$readSync) { return function (fd, buffer, offset, length, position) {
    var eagCounter = 0;
    while (true) {
      try {
        return fs$readSync.call(fs, fd, buffer, offset, length, position)
      } catch (er) {
        if (er.code === 'EAGAIN' && eagCounter < 10) {
          eagCounter ++;
          continue
        }
        throw er
      }
    }
  }})(fs.readSync);

  function patchLchmod (fs) {
    fs.lchmod = function (path, mode, callback) {
      fs.open( path
             , constants$1.O_WRONLY | constants$1.O_SYMLINK
             , mode
             , function (err, fd) {
        if (err) {
          if (callback) callback(err);
          return
        }
        // prefer to return the chmod error, if one occurs,
        // but still try to close, and report closing errors if they occur.
        fs.fchmod(fd, mode, function (err) {
          fs.close(fd, function(err2) {
            if (callback) callback(err || err2);
          });
        });
      });
    };

    fs.lchmodSync = function (path, mode) {
      var fd = fs.openSync(path, constants$1.O_WRONLY | constants$1.O_SYMLINK, mode);

      // prefer to return the chmod error, if one occurs,
      // but still try to close, and report closing errors if they occur.
      var threw = true;
      var ret;
      try {
        ret = fs.fchmodSync(fd, mode);
        threw = false;
      } finally {
        if (threw) {
          try {
            fs.closeSync(fd);
          } catch (er) {}
        } else {
          fs.closeSync(fd);
        }
      }
      return ret
    };
  }

  function patchLutimes (fs) {
    if (constants$1.hasOwnProperty("O_SYMLINK") && fs.futimes) {
      fs.lutimes = function (path, at, mt, cb) {
        fs.open(path, constants$1.O_SYMLINK, function (er, fd) {
          if (er) {
            if (cb) cb(er);
            return
          }
          fs.futimes(fd, at, mt, function (er) {
            fs.close(fd, function (er2) {
              if (cb) cb(er || er2);
            });
          });
        });
      };

      fs.lutimesSync = function (path, at, mt) {
        var fd = fs.openSync(path, constants$1.O_SYMLINK);
        var ret;
        var threw = true;
        try {
          ret = fs.futimesSync(fd, at, mt);
          threw = false;
        } finally {
          if (threw) {
            try {
              fs.closeSync(fd);
            } catch (er) {}
          } else {
            fs.closeSync(fd);
          }
        }
        return ret
      };

    } else if (fs.futimes) {
      fs.lutimes = function (_a, _b, _c, cb) { if (cb) process.nextTick(cb); };
      fs.lutimesSync = function () {};
    }
  }

  function chmodFix (orig) {
    if (!orig) return orig
    return function (target, mode, cb) {
      return orig.call(fs, target, mode, function (er) {
        if (chownErOk(er)) er = null;
        if (cb) cb.apply(this, arguments);
      })
    }
  }

  function chmodFixSync (orig) {
    if (!orig) return orig
    return function (target, mode) {
      try {
        return orig.call(fs, target, mode)
      } catch (er) {
        if (!chownErOk(er)) throw er
      }
    }
  }


  function chownFix (orig) {
    if (!orig) return orig
    return function (target, uid, gid, cb) {
      return orig.call(fs, target, uid, gid, function (er) {
        if (chownErOk(er)) er = null;
        if (cb) cb.apply(this, arguments);
      })
    }
  }

  function chownFixSync (orig) {
    if (!orig) return orig
    return function (target, uid, gid) {
      try {
        return orig.call(fs, target, uid, gid)
      } catch (er) {
        if (!chownErOk(er)) throw er
      }
    }
  }

  function statFix (orig) {
    if (!orig) return orig
    // Older versions of Node erroneously returned signed integers for
    // uid + gid.
    return function (target, options, cb) {
      if (typeof options === 'function') {
        cb = options;
        options = null;
      }
      function callback (er, stats) {
        if (stats) {
          if (stats.uid < 0) stats.uid += 0x100000000;
          if (stats.gid < 0) stats.gid += 0x100000000;
        }
        if (cb) cb.apply(this, arguments);
      }
      return options ? orig.call(fs, target, options, callback)
        : orig.call(fs, target, callback)
    }
  }

  function statFixSync (orig) {
    if (!orig) return orig
    // Older versions of Node erroneously returned signed integers for
    // uid + gid.
    return function (target, options) {
      var stats = options ? orig.call(fs, target, options)
        : orig.call(fs, target);
      if (stats) {
        if (stats.uid < 0) stats.uid += 0x100000000;
        if (stats.gid < 0) stats.gid += 0x100000000;
      }
      return stats;
    }
  }

  // ENOSYS means that the fs doesn't support the op. Just ignore
  // that, because it doesn't matter.
  //
  // if there's no getuid, or if getuid() is something other
  // than 0, and the error is EINVAL or EPERM, then just ignore
  // it.
  //
  // This specific case is a silent failure in cp, install, tar,
  // and most other unix tools that manage permissions.
  //
  // When running as root, or if other types of errors are
  // encountered, then it's strict.
  function chownErOk (er) {
    if (!er)
      return true

    if (er.code === "ENOSYS")
      return true

    var nonroot = !process.getuid || process.getuid() !== 0;
    if (nonroot) {
      if (er.code === "EINVAL" || er.code === "EPERM")
        return true
    }

    return false
  }
}

var Stream = require$$0$5.Stream;

var legacyStreams = legacy$1;

function legacy$1 (fs) {
  return {
    ReadStream: ReadStream,
    WriteStream: WriteStream
  }

  function ReadStream (path, options) {
    if (!(this instanceof ReadStream)) return new ReadStream(path, options);

    Stream.call(this);

    var self = this;

    this.path = path;
    this.fd = null;
    this.readable = true;
    this.paused = false;

    this.flags = 'r';
    this.mode = 438; /*=0666*/
    this.bufferSize = 64 * 1024;

    options = options || {};

    // Mixin options into this
    var keys = Object.keys(options);
    for (var index = 0, length = keys.length; index < length; index++) {
      var key = keys[index];
      this[key] = options[key];
    }

    if (this.encoding) this.setEncoding(this.encoding);

    if (this.start !== undefined) {
      if ('number' !== typeof this.start) {
        throw TypeError('start must be a Number');
      }
      if (this.end === undefined) {
        this.end = Infinity;
      } else if ('number' !== typeof this.end) {
        throw TypeError('end must be a Number');
      }

      if (this.start > this.end) {
        throw new Error('start must be <= end');
      }

      this.pos = this.start;
    }

    if (this.fd !== null) {
      process.nextTick(function() {
        self._read();
      });
      return;
    }

    fs.open(this.path, this.flags, this.mode, function (err, fd) {
      if (err) {
        self.emit('error', err);
        self.readable = false;
        return;
      }

      self.fd = fd;
      self.emit('open', fd);
      self._read();
    });
  }

  function WriteStream (path, options) {
    if (!(this instanceof WriteStream)) return new WriteStream(path, options);

    Stream.call(this);

    this.path = path;
    this.fd = null;
    this.writable = true;

    this.flags = 'w';
    this.encoding = 'binary';
    this.mode = 438; /*=0666*/
    this.bytesWritten = 0;

    options = options || {};

    // Mixin options into this
    var keys = Object.keys(options);
    for (var index = 0, length = keys.length; index < length; index++) {
      var key = keys[index];
      this[key] = options[key];
    }

    if (this.start !== undefined) {
      if ('number' !== typeof this.start) {
        throw TypeError('start must be a Number');
      }
      if (this.start < 0) {
        throw new Error('start must be >= zero');
      }

      this.pos = this.start;
    }

    this.busy = false;
    this._queue = [];

    if (this.fd === null) {
      this._open = fs.open;
      this._queue.push([this._open, this.path, this.flags, this.mode, undefined]);
      this.flush();
    }
  }
}

var clone_1 = clone$1;

var getPrototypeOf = Object.getPrototypeOf || function (obj) {
  return obj.__proto__
};

function clone$1 (obj) {
  if (obj === null || typeof obj !== 'object')
    return obj

  if (obj instanceof Object)
    var copy = { __proto__: getPrototypeOf(obj) };
  else
    var copy = Object.create(null);

  Object.getOwnPropertyNames(obj).forEach(function (key) {
    Object.defineProperty(copy, key, Object.getOwnPropertyDescriptor(obj, key));
  });

  return copy
}

var fs$j = require$$3;
var polyfills = polyfills$1;
var legacy = legacyStreams;
var clone = clone_1;

var util$1 = require$$4$1;

/* istanbul ignore next - node 0.x polyfill */
var gracefulQueue;
var previousSymbol;

/* istanbul ignore else - node 0.x polyfill */
if (typeof Symbol === 'function' && typeof Symbol.for === 'function') {
  gracefulQueue = Symbol.for('graceful-fs.queue');
  // This is used in testing by future versions
  previousSymbol = Symbol.for('graceful-fs.previous');
} else {
  gracefulQueue = '___graceful-fs.queue';
  previousSymbol = '___graceful-fs.previous';
}

function noop () {}

function publishQueue(context, queue) {
  Object.defineProperty(context, gracefulQueue, {
    get: function() {
      return queue
    }
  });
}

var debug = noop;
if (util$1.debuglog)
  debug = util$1.debuglog('gfs4');
else if (/\bgfs4\b/i.test(process.env.NODE_DEBUG || ''))
  debug = function() {
    var m = util$1.format.apply(util$1, arguments);
    m = 'GFS4: ' + m.split(/\n/).join('\nGFS4: ');
    console.error(m);
  };

// Once time initialization
if (!fs$j[gracefulQueue]) {
  // This queue can be shared by multiple loaded instances
  var queue = commonjsGlobal[gracefulQueue] || [];
  publishQueue(fs$j, queue);

  // Patch fs.close/closeSync to shared queue version, because we need
  // to retry() whenever a close happens *anywhere* in the program.
  // This is essential when multiple graceful-fs instances are
  // in play at the same time.
  fs$j.close = (function (fs$close) {
    function close (fd, cb) {
      return fs$close.call(fs$j, fd, function (err) {
        // This function uses the graceful-fs shared queue
        if (!err) {
          resetQueue();
        }

        if (typeof cb === 'function')
          cb.apply(this, arguments);
      })
    }

    Object.defineProperty(close, previousSymbol, {
      value: fs$close
    });
    return close
  })(fs$j.close);

  fs$j.closeSync = (function (fs$closeSync) {
    function closeSync (fd) {
      // This function uses the graceful-fs shared queue
      fs$closeSync.apply(fs$j, arguments);
      resetQueue();
    }

    Object.defineProperty(closeSync, previousSymbol, {
      value: fs$closeSync
    });
    return closeSync
  })(fs$j.closeSync);

  if (/\bgfs4\b/i.test(process.env.NODE_DEBUG || '')) {
    process.on('exit', function() {
      debug(fs$j[gracefulQueue]);
      require$$5.equal(fs$j[gracefulQueue].length, 0);
    });
  }
}

if (!commonjsGlobal[gracefulQueue]) {
  publishQueue(commonjsGlobal, fs$j[gracefulQueue]);
}

var gracefulFs = patch(clone(fs$j));
if (process.env.TEST_GRACEFUL_FS_GLOBAL_PATCH && !fs$j.__patched) {
    gracefulFs = patch(fs$j);
    fs$j.__patched = true;
}

function patch (fs) {
  // Everything that references the open() function needs to be in here
  polyfills(fs);
  fs.gracefulify = patch;

  fs.createReadStream = createReadStream;
  fs.createWriteStream = createWriteStream;
  var fs$readFile = fs.readFile;
  fs.readFile = readFile;
  function readFile (path, options, cb) {
    if (typeof options === 'function')
      cb = options, options = null;

    return go$readFile(path, options, cb)

    function go$readFile (path, options, cb, startTime) {
      return fs$readFile(path, options, function (err) {
        if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
          enqueue([go$readFile, [path, options, cb], err, startTime || Date.now(), Date.now()]);
        else {
          if (typeof cb === 'function')
            cb.apply(this, arguments);
        }
      })
    }
  }

  var fs$writeFile = fs.writeFile;
  fs.writeFile = writeFile;
  function writeFile (path, data, options, cb) {
    if (typeof options === 'function')
      cb = options, options = null;

    return go$writeFile(path, data, options, cb)

    function go$writeFile (path, data, options, cb, startTime) {
      return fs$writeFile(path, data, options, function (err) {
        if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
          enqueue([go$writeFile, [path, data, options, cb], err, startTime || Date.now(), Date.now()]);
        else {
          if (typeof cb === 'function')
            cb.apply(this, arguments);
        }
      })
    }
  }

  var fs$appendFile = fs.appendFile;
  if (fs$appendFile)
    fs.appendFile = appendFile;
  function appendFile (path, data, options, cb) {
    if (typeof options === 'function')
      cb = options, options = null;

    return go$appendFile(path, data, options, cb)

    function go$appendFile (path, data, options, cb, startTime) {
      return fs$appendFile(path, data, options, function (err) {
        if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
          enqueue([go$appendFile, [path, data, options, cb], err, startTime || Date.now(), Date.now()]);
        else {
          if (typeof cb === 'function')
            cb.apply(this, arguments);
        }
      })
    }
  }

  var fs$copyFile = fs.copyFile;
  if (fs$copyFile)
    fs.copyFile = copyFile;
  function copyFile (src, dest, flags, cb) {
    if (typeof flags === 'function') {
      cb = flags;
      flags = 0;
    }
    return go$copyFile(src, dest, flags, cb)

    function go$copyFile (src, dest, flags, cb, startTime) {
      return fs$copyFile(src, dest, flags, function (err) {
        if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
          enqueue([go$copyFile, [src, dest, flags, cb], err, startTime || Date.now(), Date.now()]);
        else {
          if (typeof cb === 'function')
            cb.apply(this, arguments);
        }
      })
    }
  }

  var fs$readdir = fs.readdir;
  fs.readdir = readdir;
  var noReaddirOptionVersions = /^v[0-5]\./;
  function readdir (path, options, cb) {
    if (typeof options === 'function')
      cb = options, options = null;

    var go$readdir = noReaddirOptionVersions.test(process.version)
      ? function go$readdir (path, options, cb, startTime) {
        return fs$readdir(path, fs$readdirCallback(
          path, options, cb, startTime
        ))
      }
      : function go$readdir (path, options, cb, startTime) {
        return fs$readdir(path, options, fs$readdirCallback(
          path, options, cb, startTime
        ))
      };

    return go$readdir(path, options, cb)

    function fs$readdirCallback (path, options, cb, startTime) {
      return function (err, files) {
        if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
          enqueue([
            go$readdir,
            [path, options, cb],
            err,
            startTime || Date.now(),
            Date.now()
          ]);
        else {
          if (files && files.sort)
            files.sort();

          if (typeof cb === 'function')
            cb.call(this, err, files);
        }
      }
    }
  }

  if (process.version.substr(0, 4) === 'v0.8') {
    var legStreams = legacy(fs);
    ReadStream = legStreams.ReadStream;
    WriteStream = legStreams.WriteStream;
  }

  var fs$ReadStream = fs.ReadStream;
  if (fs$ReadStream) {
    ReadStream.prototype = Object.create(fs$ReadStream.prototype);
    ReadStream.prototype.open = ReadStream$open;
  }

  var fs$WriteStream = fs.WriteStream;
  if (fs$WriteStream) {
    WriteStream.prototype = Object.create(fs$WriteStream.prototype);
    WriteStream.prototype.open = WriteStream$open;
  }

  Object.defineProperty(fs, 'ReadStream', {
    get: function () {
      return ReadStream
    },
    set: function (val) {
      ReadStream = val;
    },
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(fs, 'WriteStream', {
    get: function () {
      return WriteStream
    },
    set: function (val) {
      WriteStream = val;
    },
    enumerable: true,
    configurable: true
  });

  // legacy names
  var FileReadStream = ReadStream;
  Object.defineProperty(fs, 'FileReadStream', {
    get: function () {
      return FileReadStream
    },
    set: function (val) {
      FileReadStream = val;
    },
    enumerable: true,
    configurable: true
  });
  var FileWriteStream = WriteStream;
  Object.defineProperty(fs, 'FileWriteStream', {
    get: function () {
      return FileWriteStream
    },
    set: function (val) {
      FileWriteStream = val;
    },
    enumerable: true,
    configurable: true
  });

  function ReadStream (path, options) {
    if (this instanceof ReadStream)
      return fs$ReadStream.apply(this, arguments), this
    else
      return ReadStream.apply(Object.create(ReadStream.prototype), arguments)
  }

  function ReadStream$open () {
    var that = this;
    open(that.path, that.flags, that.mode, function (err, fd) {
      if (err) {
        if (that.autoClose)
          that.destroy();

        that.emit('error', err);
      } else {
        that.fd = fd;
        that.emit('open', fd);
        that.read();
      }
    });
  }

  function WriteStream (path, options) {
    if (this instanceof WriteStream)
      return fs$WriteStream.apply(this, arguments), this
    else
      return WriteStream.apply(Object.create(WriteStream.prototype), arguments)
  }

  function WriteStream$open () {
    var that = this;
    open(that.path, that.flags, that.mode, function (err, fd) {
      if (err) {
        that.destroy();
        that.emit('error', err);
      } else {
        that.fd = fd;
        that.emit('open', fd);
      }
    });
  }

  function createReadStream (path, options) {
    return new fs.ReadStream(path, options)
  }

  function createWriteStream (path, options) {
    return new fs.WriteStream(path, options)
  }

  var fs$open = fs.open;
  fs.open = open;
  function open (path, flags, mode, cb) {
    if (typeof mode === 'function')
      cb = mode, mode = null;

    return go$open(path, flags, mode, cb)

    function go$open (path, flags, mode, cb, startTime) {
      return fs$open(path, flags, mode, function (err, fd) {
        if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
          enqueue([go$open, [path, flags, mode, cb], err, startTime || Date.now(), Date.now()]);
        else {
          if (typeof cb === 'function')
            cb.apply(this, arguments);
        }
      })
    }
  }

  return fs
}

function enqueue (elem) {
  debug('ENQUEUE', elem[0].name, elem[1]);
  fs$j[gracefulQueue].push(elem);
  retry();
}

// keep track of the timeout between retry() calls
var retryTimer;

// reset the startTime and lastTime to now
// this resets the start of the 60 second overall timeout as well as the
// delay between attempts so that we'll retry these jobs sooner
function resetQueue () {
  var now = Date.now();
  for (var i = 0; i < fs$j[gracefulQueue].length; ++i) {
    // entries that are only a length of 2 are from an older version, don't
    // bother modifying those since they'll be retried anyway.
    if (fs$j[gracefulQueue][i].length > 2) {
      fs$j[gracefulQueue][i][3] = now; // startTime
      fs$j[gracefulQueue][i][4] = now; // lastTime
    }
  }
  // call retry to make sure we're actively processing the queue
  retry();
}

function retry () {
  // clear the timer and remove it to help prevent unintended concurrency
  clearTimeout(retryTimer);
  retryTimer = undefined;

  if (fs$j[gracefulQueue].length === 0)
    return

  var elem = fs$j[gracefulQueue].shift();
  var fn = elem[0];
  var args = elem[1];
  // these items may be unset if they were added by an older graceful-fs
  var err = elem[2];
  var startTime = elem[3];
  var lastTime = elem[4];

  // if we don't have a startTime we have no way of knowing if we've waited
  // long enough, so go ahead and retry this item now
  if (startTime === undefined) {
    debug('RETRY', fn.name, args);
    fn.apply(null, args);
  } else if (Date.now() - startTime >= 60000) {
    // it's been more than 60 seconds total, bail now
    debug('TIMEOUT', fn.name, args);
    var cb = args.pop();
    if (typeof cb === 'function')
      cb.call(null, err);
  } else {
    // the amount of time between the last attempt and right now
    var sinceAttempt = Date.now() - lastTime;
    // the amount of time between when we first tried, and when we last tried
    // rounded up to at least 1
    var sinceStart = Math.max(lastTime - startTime, 1);
    // backoff. wait longer than the total time we've been retrying, but only
    // up to a maximum of 100ms
    var desiredDelay = Math.min(sinceStart * 1.2, 100);
    // it's been long enough since the last retry, do it again
    if (sinceAttempt >= desiredDelay) {
      debug('RETRY', fn.name, args);
      fn.apply(null, args.concat([startTime]));
    } else {
      // if we can't do this job yet, push it to the end of the queue
      // and let the next iteration check again
      fs$j[gracefulQueue].push(elem);
    }
  }

  // schedule our next run if one isn't already scheduled
  if (retryTimer === undefined) {
    retryTimer = setTimeout(retry, 0);
  }
}

(function (exports) {
	// This is adapted from https://github.com/normalize/mz
	// Copyright (c) 2014-2016 Jonathan Ong me@jongleberry.com and Contributors
	const u = universalify$1.fromCallback;
	const fs = gracefulFs;

	const api = [
	  'access',
	  'appendFile',
	  'chmod',
	  'chown',
	  'close',
	  'copyFile',
	  'cp',
	  'fchmod',
	  'fchown',
	  'fdatasync',
	  'fstat',
	  'fsync',
	  'ftruncate',
	  'futimes',
	  'glob',
	  'lchmod',
	  'lchown',
	  'lutimes',
	  'link',
	  'lstat',
	  'mkdir',
	  'mkdtemp',
	  'open',
	  'opendir',
	  'readdir',
	  'readFile',
	  'readlink',
	  'realpath',
	  'rename',
	  'rm',
	  'rmdir',
	  'stat',
	  'statfs',
	  'symlink',
	  'truncate',
	  'unlink',
	  'utimes',
	  'writeFile'
	].filter(key => {
	  // Some commands are not available on some systems. Ex:
	  // fs.cp was added in Node.js v16.7.0
	  // fs.statfs was added in Node v19.6.0, v18.15.0
	  // fs.glob was added in Node.js v22.0.0
	  // fs.lchown is not available on at least some Linux
	  return typeof fs[key] === 'function'
	});

	// Export cloned fs:
	Object.assign(exports, fs);

	// Universalify async methods:
	api.forEach(method => {
	  exports[method] = u(fs[method]);
	});

	// We differ from mz/fs in that we still ship the old, broken, fs.exists()
	// since we are a drop-in replacement for the native module
	exports.exists = function (filename, callback) {
	  if (typeof callback === 'function') {
	    return fs.exists(filename, callback)
	  }
	  return new Promise(resolve => {
	    return fs.exists(filename, resolve)
	  })
	};

	// fs.read(), fs.write(), fs.readv(), & fs.writev() need special treatment due to multiple callback args

	exports.read = function (fd, buffer, offset, length, position, callback) {
	  if (typeof callback === 'function') {
	    return fs.read(fd, buffer, offset, length, position, callback)
	  }
	  return new Promise((resolve, reject) => {
	    fs.read(fd, buffer, offset, length, position, (err, bytesRead, buffer) => {
	      if (err) return reject(err)
	      resolve({ bytesRead, buffer });
	    });
	  })
	};

	// Function signature can be
	// fs.write(fd, buffer[, offset[, length[, position]]], callback)
	// OR
	// fs.write(fd, string[, position[, encoding]], callback)
	// We need to handle both cases, so we use ...args
	exports.write = function (fd, buffer, ...args) {
	  if (typeof args[args.length - 1] === 'function') {
	    return fs.write(fd, buffer, ...args)
	  }

	  return new Promise((resolve, reject) => {
	    fs.write(fd, buffer, ...args, (err, bytesWritten, buffer) => {
	      if (err) return reject(err)
	      resolve({ bytesWritten, buffer });
	    });
	  })
	};

	// Function signature is
	// s.readv(fd, buffers[, position], callback)
	// We need to handle the optional arg, so we use ...args
	exports.readv = function (fd, buffers, ...args) {
	  if (typeof args[args.length - 1] === 'function') {
	    return fs.readv(fd, buffers, ...args)
	  }

	  return new Promise((resolve, reject) => {
	    fs.readv(fd, buffers, ...args, (err, bytesRead, buffers) => {
	      if (err) return reject(err)
	      resolve({ bytesRead, buffers });
	    });
	  })
	};

	// Function signature is
	// s.writev(fd, buffers[, position], callback)
	// We need to handle the optional arg, so we use ...args
	exports.writev = function (fd, buffers, ...args) {
	  if (typeof args[args.length - 1] === 'function') {
	    return fs.writev(fd, buffers, ...args)
	  }

	  return new Promise((resolve, reject) => {
	    fs.writev(fd, buffers, ...args, (err, bytesWritten, buffers) => {
	      if (err) return reject(err)
	      resolve({ bytesWritten, buffers });
	    });
	  })
	};

	// fs.realpath.native sometimes not available if fs is monkey-patched
	if (typeof fs.realpath.native === 'function') {
	  exports.realpath.native = u(fs.realpath.native);
	} else {
	  process.emitWarning(
	    'fs.realpath.native is not a function. Is fs being monkey-patched?',
	    'Warning', 'fs-extra-WARN0003'
	  );
	} 
} (fs$k));

var makeDir$1 = {};

var utils$1 = {};

const path$h = require$$1;

// https://github.com/nodejs/node/issues/8987
// https://github.com/libuv/libuv/pull/1088
utils$1.checkPath = function checkPath (pth) {
  if (process.platform === 'win32') {
    const pathHasInvalidWinCharacters = /[<>:"|?*]/.test(pth.replace(path$h.parse(pth).root, ''));

    if (pathHasInvalidWinCharacters) {
      const error = new Error(`Path contains invalid characters: ${pth}`);
      error.code = 'EINVAL';
      throw error
    }
  }
};

const fs$i = fs$k;
const { checkPath } = utils$1;

const getMode = options => {
  const defaults = { mode: 0o777 };
  if (typeof options === 'number') return options
  return ({ ...defaults, ...options }).mode
};

makeDir$1.makeDir = async (dir, options) => {
  checkPath(dir);

  return fs$i.mkdir(dir, {
    mode: getMode(options),
    recursive: true
  })
};

makeDir$1.makeDirSync = (dir, options) => {
  checkPath(dir);

  return fs$i.mkdirSync(dir, {
    mode: getMode(options),
    recursive: true
  })
};

const u$e = universalify$1.fromPromise;
const { makeDir: _makeDir, makeDirSync } = makeDir$1;
const makeDir = u$e(_makeDir);

var mkdirs$2 = {
  mkdirs: makeDir,
  mkdirsSync: makeDirSync,
  // alias
  mkdirp: makeDir,
  mkdirpSync: makeDirSync,
  ensureDir: makeDir,
  ensureDirSync: makeDirSync
};

const u$d = universalify$1.fromPromise;
const fs$h = fs$k;

function pathExists$6 (path) {
  return fs$h.access(path).then(() => true).catch(() => false)
}

var pathExists_1 = {
  pathExists: u$d(pathExists$6),
  pathExistsSync: fs$h.existsSync
};

const fs$g = fs$k;
const u$c = universalify$1.fromPromise;

async function utimesMillis$1 (path, atime, mtime) {
  // if (!HAS_MILLIS_RES) return fs.utimes(path, atime, mtime, callback)
  const fd = await fs$g.open(path, 'r+');

  let closeErr = null;

  try {
    await fs$g.futimes(fd, atime, mtime);
  } finally {
    try {
      await fs$g.close(fd);
    } catch (e) {
      closeErr = e;
    }
  }

  if (closeErr) {
    throw closeErr
  }
}

function utimesMillisSync$1 (path, atime, mtime) {
  const fd = fs$g.openSync(path, 'r+');
  fs$g.futimesSync(fd, atime, mtime);
  return fs$g.closeSync(fd)
}

var utimes = {
  utimesMillis: u$c(utimesMillis$1),
  utimesMillisSync: utimesMillisSync$1
};

const fs$f = fs$k;
const path$g = require$$1;
const u$b = universalify$1.fromPromise;

function getStats$1 (src, dest, opts) {
  const statFunc = opts.dereference
    ? (file) => fs$f.stat(file, { bigint: true })
    : (file) => fs$f.lstat(file, { bigint: true });
  return Promise.all([
    statFunc(src),
    statFunc(dest).catch(err => {
      if (err.code === 'ENOENT') return null
      throw err
    })
  ]).then(([srcStat, destStat]) => ({ srcStat, destStat }))
}

function getStatsSync (src, dest, opts) {
  let destStat;
  const statFunc = opts.dereference
    ? (file) => fs$f.statSync(file, { bigint: true })
    : (file) => fs$f.lstatSync(file, { bigint: true });
  const srcStat = statFunc(src);
  try {
    destStat = statFunc(dest);
  } catch (err) {
    if (err.code === 'ENOENT') return { srcStat, destStat: null }
    throw err
  }
  return { srcStat, destStat }
}

async function checkPaths (src, dest, funcName, opts) {
  const { srcStat, destStat } = await getStats$1(src, dest, opts);
  if (destStat) {
    if (areIdentical$2(srcStat, destStat)) {
      const srcBaseName = path$g.basename(src);
      const destBaseName = path$g.basename(dest);
      if (funcName === 'move' &&
        srcBaseName !== destBaseName &&
        srcBaseName.toLowerCase() === destBaseName.toLowerCase()) {
        return { srcStat, destStat, isChangingCase: true }
      }
      throw new Error('Source and destination must not be the same.')
    }
    if (srcStat.isDirectory() && !destStat.isDirectory()) {
      throw new Error(`Cannot overwrite non-directory '${dest}' with directory '${src}'.`)
    }
    if (!srcStat.isDirectory() && destStat.isDirectory()) {
      throw new Error(`Cannot overwrite directory '${dest}' with non-directory '${src}'.`)
    }
  }

  if (srcStat.isDirectory() && isSrcSubdir(src, dest)) {
    throw new Error(errMsg(src, dest, funcName))
  }

  return { srcStat, destStat }
}

function checkPathsSync (src, dest, funcName, opts) {
  const { srcStat, destStat } = getStatsSync(src, dest, opts);

  if (destStat) {
    if (areIdentical$2(srcStat, destStat)) {
      const srcBaseName = path$g.basename(src);
      const destBaseName = path$g.basename(dest);
      if (funcName === 'move' &&
        srcBaseName !== destBaseName &&
        srcBaseName.toLowerCase() === destBaseName.toLowerCase()) {
        return { srcStat, destStat, isChangingCase: true }
      }
      throw new Error('Source and destination must not be the same.')
    }
    if (srcStat.isDirectory() && !destStat.isDirectory()) {
      throw new Error(`Cannot overwrite non-directory '${dest}' with directory '${src}'.`)
    }
    if (!srcStat.isDirectory() && destStat.isDirectory()) {
      throw new Error(`Cannot overwrite directory '${dest}' with non-directory '${src}'.`)
    }
  }

  if (srcStat.isDirectory() && isSrcSubdir(src, dest)) {
    throw new Error(errMsg(src, dest, funcName))
  }
  return { srcStat, destStat }
}

// recursively check if dest parent is a subdirectory of src.
// It works for all file types including symlinks since it
// checks the src and dest inodes. It starts from the deepest
// parent and stops once it reaches the src parent or the root path.
async function checkParentPaths (src, srcStat, dest, funcName) {
  const srcParent = path$g.resolve(path$g.dirname(src));
  const destParent = path$g.resolve(path$g.dirname(dest));
  if (destParent === srcParent || destParent === path$g.parse(destParent).root) return

  let destStat;
  try {
    destStat = await fs$f.stat(destParent, { bigint: true });
  } catch (err) {
    if (err.code === 'ENOENT') return
    throw err
  }

  if (areIdentical$2(srcStat, destStat)) {
    throw new Error(errMsg(src, dest, funcName))
  }

  return checkParentPaths(src, srcStat, destParent, funcName)
}

function checkParentPathsSync (src, srcStat, dest, funcName) {
  const srcParent = path$g.resolve(path$g.dirname(src));
  const destParent = path$g.resolve(path$g.dirname(dest));
  if (destParent === srcParent || destParent === path$g.parse(destParent).root) return
  let destStat;
  try {
    destStat = fs$f.statSync(destParent, { bigint: true });
  } catch (err) {
    if (err.code === 'ENOENT') return
    throw err
  }
  if (areIdentical$2(srcStat, destStat)) {
    throw new Error(errMsg(src, dest, funcName))
  }
  return checkParentPathsSync(src, srcStat, destParent, funcName)
}

function areIdentical$2 (srcStat, destStat) {
  return destStat.ino && destStat.dev && destStat.ino === srcStat.ino && destStat.dev === srcStat.dev
}

// return true if dest is a subdir of src, otherwise false.
// It only checks the path strings.
function isSrcSubdir (src, dest) {
  const srcArr = path$g.resolve(src).split(path$g.sep).filter(i => i);
  const destArr = path$g.resolve(dest).split(path$g.sep).filter(i => i);
  return srcArr.every((cur, i) => destArr[i] === cur)
}

function errMsg (src, dest, funcName) {
  return `Cannot ${funcName} '${src}' to a subdirectory of itself, '${dest}'.`
}

var stat$4 = {
  // checkPaths
  checkPaths: u$b(checkPaths),
  checkPathsSync,
  // checkParent
  checkParentPaths: u$b(checkParentPaths),
  checkParentPathsSync,
  // Misc
  isSrcSubdir,
  areIdentical: areIdentical$2
};

const fs$e = fs$k;
const path$f = require$$1;
const { mkdirs: mkdirs$1 } = mkdirs$2;
const { pathExists: pathExists$5 } = pathExists_1;
const { utimesMillis } = utimes;
const stat$3 = stat$4;

async function copy$2 (src, dest, opts = {}) {
  if (typeof opts === 'function') {
    opts = { filter: opts };
  }

  opts.clobber = 'clobber' in opts ? !!opts.clobber : true; // default to true for now
  opts.overwrite = 'overwrite' in opts ? !!opts.overwrite : opts.clobber; // overwrite falls back to clobber

  // Warn about using preserveTimestamps on 32-bit node
  if (opts.preserveTimestamps && process.arch === 'ia32') {
    process.emitWarning(
      'Using the preserveTimestamps option in 32-bit node is not recommended;\n\n' +
      '\tsee https://github.com/jprichardson/node-fs-extra/issues/269',
      'Warning', 'fs-extra-WARN0001'
    );
  }

  const { srcStat, destStat } = await stat$3.checkPaths(src, dest, 'copy', opts);

  await stat$3.checkParentPaths(src, srcStat, dest, 'copy');

  const include = await runFilter(src, dest, opts);

  if (!include) return

  // check if the parent of dest exists, and create it if it doesn't exist
  const destParent = path$f.dirname(dest);
  const dirExists = await pathExists$5(destParent);
  if (!dirExists) {
    await mkdirs$1(destParent);
  }

  await getStatsAndPerformCopy(destStat, src, dest, opts);
}

async function runFilter (src, dest, opts) {
  if (!opts.filter) return true
  return opts.filter(src, dest)
}

async function getStatsAndPerformCopy (destStat, src, dest, opts) {
  const statFn = opts.dereference ? fs$e.stat : fs$e.lstat;
  const srcStat = await statFn(src);

  if (srcStat.isDirectory()) return onDir$1(srcStat, destStat, src, dest, opts)

  if (
    srcStat.isFile() ||
    srcStat.isCharacterDevice() ||
    srcStat.isBlockDevice()
  ) return onFile$1(srcStat, destStat, src, dest, opts)

  if (srcStat.isSymbolicLink()) return onLink$1(destStat, src, dest, opts)
  if (srcStat.isSocket()) throw new Error(`Cannot copy a socket file: ${src}`)
  if (srcStat.isFIFO()) throw new Error(`Cannot copy a FIFO pipe: ${src}`)
  throw new Error(`Unknown file: ${src}`)
}

async function onFile$1 (srcStat, destStat, src, dest, opts) {
  if (!destStat) return copyFile$1(srcStat, src, dest, opts)

  if (opts.overwrite) {
    await fs$e.unlink(dest);
    return copyFile$1(srcStat, src, dest, opts)
  }
  if (opts.errorOnExist) {
    throw new Error(`'${dest}' already exists`)
  }
}

async function copyFile$1 (srcStat, src, dest, opts) {
  await fs$e.copyFile(src, dest);
  if (opts.preserveTimestamps) {
    // Make sure the file is writable before setting the timestamp
    // otherwise open fails with EPERM when invoked with 'r+'
    // (through utimes call)
    if (fileIsNotWritable$1(srcStat.mode)) {
      await makeFileWritable$1(dest, srcStat.mode);
    }

    // Set timestamps and mode correspondingly

    // Note that The initial srcStat.atime cannot be trusted
    // because it is modified by the read(2) system call
    // (See https://nodejs.org/api/fs.html#fs_stat_time_values)
    const updatedSrcStat = await fs$e.stat(src);
    await utimesMillis(dest, updatedSrcStat.atime, updatedSrcStat.mtime);
  }

  return fs$e.chmod(dest, srcStat.mode)
}

function fileIsNotWritable$1 (srcMode) {
  return (srcMode & 0o200) === 0
}

function makeFileWritable$1 (dest, srcMode) {
  return fs$e.chmod(dest, srcMode | 0o200)
}

async function onDir$1 (srcStat, destStat, src, dest, opts) {
  // the dest directory might not exist, create it
  if (!destStat) {
    await fs$e.mkdir(dest);
  }

  const promises = [];

  // loop through the files in the current directory to copy everything
  for await (const item of await fs$e.opendir(src)) {
    const srcItem = path$f.join(src, item.name);
    const destItem = path$f.join(dest, item.name);

    promises.push(
      runFilter(srcItem, destItem, opts).then(include => {
        if (include) {
          // only copy the item if it matches the filter function
          return stat$3.checkPaths(srcItem, destItem, 'copy', opts).then(({ destStat }) => {
            // If the item is a copyable file, `getStatsAndPerformCopy` will copy it
            // If the item is a directory, `getStatsAndPerformCopy` will call `onDir` recursively
            return getStatsAndPerformCopy(destStat, srcItem, destItem, opts)
          })
        }
      })
    );
  }

  await Promise.all(promises);

  if (!destStat) {
    await fs$e.chmod(dest, srcStat.mode);
  }
}

async function onLink$1 (destStat, src, dest, opts) {
  let resolvedSrc = await fs$e.readlink(src);
  if (opts.dereference) {
    resolvedSrc = path$f.resolve(process.cwd(), resolvedSrc);
  }
  if (!destStat) {
    return fs$e.symlink(resolvedSrc, dest)
  }

  let resolvedDest = null;
  try {
    resolvedDest = await fs$e.readlink(dest);
  } catch (e) {
    // dest exists and is a regular file or directory,
    // Windows may throw UNKNOWN error. If dest already exists,
    // fs throws error anyway, so no need to guard against it here.
    if (e.code === 'EINVAL' || e.code === 'UNKNOWN') return fs$e.symlink(resolvedSrc, dest)
    throw e
  }
  if (opts.dereference) {
    resolvedDest = path$f.resolve(process.cwd(), resolvedDest);
  }
  if (stat$3.isSrcSubdir(resolvedSrc, resolvedDest)) {
    throw new Error(`Cannot copy '${resolvedSrc}' to a subdirectory of itself, '${resolvedDest}'.`)
  }

  // do not copy if src is a subdir of dest since unlinking
  // dest in this case would result in removing src contents
  // and therefore a broken symlink would be created.
  if (stat$3.isSrcSubdir(resolvedDest, resolvedSrc)) {
    throw new Error(`Cannot overwrite '${resolvedDest}' with '${resolvedSrc}'.`)
  }

  // copy the link
  await fs$e.unlink(dest);
  return fs$e.symlink(resolvedSrc, dest)
}

var copy_1 = copy$2;

const fs$d = gracefulFs;
const path$e = require$$1;
const mkdirsSync$1 = mkdirs$2.mkdirsSync;
const utimesMillisSync = utimes.utimesMillisSync;
const stat$2 = stat$4;

function copySync$1 (src, dest, opts) {
  if (typeof opts === 'function') {
    opts = { filter: opts };
  }

  opts = opts || {};
  opts.clobber = 'clobber' in opts ? !!opts.clobber : true; // default to true for now
  opts.overwrite = 'overwrite' in opts ? !!opts.overwrite : opts.clobber; // overwrite falls back to clobber

  // Warn about using preserveTimestamps on 32-bit node
  if (opts.preserveTimestamps && process.arch === 'ia32') {
    process.emitWarning(
      'Using the preserveTimestamps option in 32-bit node is not recommended;\n\n' +
      '\tsee https://github.com/jprichardson/node-fs-extra/issues/269',
      'Warning', 'fs-extra-WARN0002'
    );
  }

  const { srcStat, destStat } = stat$2.checkPathsSync(src, dest, 'copy', opts);
  stat$2.checkParentPathsSync(src, srcStat, dest, 'copy');
  if (opts.filter && !opts.filter(src, dest)) return
  const destParent = path$e.dirname(dest);
  if (!fs$d.existsSync(destParent)) mkdirsSync$1(destParent);
  return getStats(destStat, src, dest, opts)
}

function getStats (destStat, src, dest, opts) {
  const statSync = opts.dereference ? fs$d.statSync : fs$d.lstatSync;
  const srcStat = statSync(src);

  if (srcStat.isDirectory()) return onDir(srcStat, destStat, src, dest, opts)
  else if (srcStat.isFile() ||
           srcStat.isCharacterDevice() ||
           srcStat.isBlockDevice()) return onFile(srcStat, destStat, src, dest, opts)
  else if (srcStat.isSymbolicLink()) return onLink(destStat, src, dest, opts)
  else if (srcStat.isSocket()) throw new Error(`Cannot copy a socket file: ${src}`)
  else if (srcStat.isFIFO()) throw new Error(`Cannot copy a FIFO pipe: ${src}`)
  throw new Error(`Unknown file: ${src}`)
}

function onFile (srcStat, destStat, src, dest, opts) {
  if (!destStat) return copyFile(srcStat, src, dest, opts)
  return mayCopyFile(srcStat, src, dest, opts)
}

function mayCopyFile (srcStat, src, dest, opts) {
  if (opts.overwrite) {
    fs$d.unlinkSync(dest);
    return copyFile(srcStat, src, dest, opts)
  } else if (opts.errorOnExist) {
    throw new Error(`'${dest}' already exists`)
  }
}

function copyFile (srcStat, src, dest, opts) {
  fs$d.copyFileSync(src, dest);
  if (opts.preserveTimestamps) handleTimestamps(srcStat.mode, src, dest);
  return setDestMode(dest, srcStat.mode)
}

function handleTimestamps (srcMode, src, dest) {
  // Make sure the file is writable before setting the timestamp
  // otherwise open fails with EPERM when invoked with 'r+'
  // (through utimes call)
  if (fileIsNotWritable(srcMode)) makeFileWritable(dest, srcMode);
  return setDestTimestamps(src, dest)
}

function fileIsNotWritable (srcMode) {
  return (srcMode & 0o200) === 0
}

function makeFileWritable (dest, srcMode) {
  return setDestMode(dest, srcMode | 0o200)
}

function setDestMode (dest, srcMode) {
  return fs$d.chmodSync(dest, srcMode)
}

function setDestTimestamps (src, dest) {
  // The initial srcStat.atime cannot be trusted
  // because it is modified by the read(2) system call
  // (See https://nodejs.org/api/fs.html#fs_stat_time_values)
  const updatedSrcStat = fs$d.statSync(src);
  return utimesMillisSync(dest, updatedSrcStat.atime, updatedSrcStat.mtime)
}

function onDir (srcStat, destStat, src, dest, opts) {
  if (!destStat) return mkDirAndCopy(srcStat.mode, src, dest, opts)
  return copyDir(src, dest, opts)
}

function mkDirAndCopy (srcMode, src, dest, opts) {
  fs$d.mkdirSync(dest);
  copyDir(src, dest, opts);
  return setDestMode(dest, srcMode)
}

function copyDir (src, dest, opts) {
  const dir = fs$d.opendirSync(src);

  try {
    let dirent;

    while ((dirent = dir.readSync()) !== null) {
      copyDirItem(dirent.name, src, dest, opts);
    }
  } finally {
    dir.closeSync();
  }
}

function copyDirItem (item, src, dest, opts) {
  const srcItem = path$e.join(src, item);
  const destItem = path$e.join(dest, item);
  if (opts.filter && !opts.filter(srcItem, destItem)) return
  const { destStat } = stat$2.checkPathsSync(srcItem, destItem, 'copy', opts);
  return getStats(destStat, srcItem, destItem, opts)
}

function onLink (destStat, src, dest, opts) {
  let resolvedSrc = fs$d.readlinkSync(src);
  if (opts.dereference) {
    resolvedSrc = path$e.resolve(process.cwd(), resolvedSrc);
  }

  if (!destStat) {
    return fs$d.symlinkSync(resolvedSrc, dest)
  } else {
    let resolvedDest;
    try {
      resolvedDest = fs$d.readlinkSync(dest);
    } catch (err) {
      // dest exists and is a regular file or directory,
      // Windows may throw UNKNOWN error. If dest already exists,
      // fs throws error anyway, so no need to guard against it here.
      if (err.code === 'EINVAL' || err.code === 'UNKNOWN') return fs$d.symlinkSync(resolvedSrc, dest)
      throw err
    }
    if (opts.dereference) {
      resolvedDest = path$e.resolve(process.cwd(), resolvedDest);
    }
    if (stat$2.isSrcSubdir(resolvedSrc, resolvedDest)) {
      throw new Error(`Cannot copy '${resolvedSrc}' to a subdirectory of itself, '${resolvedDest}'.`)
    }

    // prevent copy if src is a subdir of dest since unlinking
    // dest in this case would result in removing src contents
    // and therefore a broken symlink would be created.
    if (stat$2.isSrcSubdir(resolvedDest, resolvedSrc)) {
      throw new Error(`Cannot overwrite '${resolvedDest}' with '${resolvedSrc}'.`)
    }
    return copyLink(resolvedSrc, dest)
  }
}

function copyLink (resolvedSrc, dest) {
  fs$d.unlinkSync(dest);
  return fs$d.symlinkSync(resolvedSrc, dest)
}

var copySync_1 = copySync$1;

const u$a = universalify$1.fromPromise;
var copy$1 = {
  copy: u$a(copy_1),
  copySync: copySync_1
};

const fs$c = gracefulFs;
const u$9 = universalify$1.fromCallback;

function remove$2 (path, callback) {
  fs$c.rm(path, { recursive: true, force: true }, callback);
}

function removeSync$1 (path) {
  fs$c.rmSync(path, { recursive: true, force: true });
}

var remove_1 = {
  remove: u$9(remove$2),
  removeSync: removeSync$1
};

const u$8 = universalify$1.fromPromise;
const fs$b = fs$k;
const path$d = require$$1;
const mkdir$3 = mkdirs$2;
const remove$1 = remove_1;

const emptyDir = u$8(async function emptyDir (dir) {
  let items;
  try {
    items = await fs$b.readdir(dir);
  } catch {
    return mkdir$3.mkdirs(dir)
  }

  return Promise.all(items.map(item => remove$1.remove(path$d.join(dir, item))))
});

function emptyDirSync (dir) {
  let items;
  try {
    items = fs$b.readdirSync(dir);
  } catch {
    return mkdir$3.mkdirsSync(dir)
  }

  items.forEach(item => {
    item = path$d.join(dir, item);
    remove$1.removeSync(item);
  });
}

var empty = {
  emptyDirSync,
  emptydirSync: emptyDirSync,
  emptyDir,
  emptydir: emptyDir
};

const u$7 = universalify$1.fromPromise;
const path$c = require$$1;
const fs$a = fs$k;
const mkdir$2 = mkdirs$2;

async function createFile$1 (file) {
  let stats;
  try {
    stats = await fs$a.stat(file);
  } catch { }
  if (stats && stats.isFile()) return

  const dir = path$c.dirname(file);

  let dirStats = null;
  try {
    dirStats = await fs$a.stat(dir);
  } catch (err) {
    // if the directory doesn't exist, make it
    if (err.code === 'ENOENT') {
      await mkdir$2.mkdirs(dir);
      await fs$a.writeFile(file, '');
      return
    } else {
      throw err
    }
  }

  if (dirStats.isDirectory()) {
    await fs$a.writeFile(file, '');
  } else {
    // parent is not a directory
    // This is just to cause an internal ENOTDIR error to be thrown
    await fs$a.readdir(dir);
  }
}

function createFileSync$1 (file) {
  let stats;
  try {
    stats = fs$a.statSync(file);
  } catch { }
  if (stats && stats.isFile()) return

  const dir = path$c.dirname(file);
  try {
    if (!fs$a.statSync(dir).isDirectory()) {
      // parent is not a directory
      // This is just to cause an internal ENOTDIR error to be thrown
      fs$a.readdirSync(dir);
    }
  } catch (err) {
    // If the stat call above failed because the directory doesn't exist, create it
    if (err && err.code === 'ENOENT') mkdir$2.mkdirsSync(dir);
    else throw err
  }

  fs$a.writeFileSync(file, '');
}

var file$1 = {
  createFile: u$7(createFile$1),
  createFileSync: createFileSync$1
};

const u$6 = universalify$1.fromPromise;
const path$b = require$$1;
const fs$9 = fs$k;
const mkdir$1 = mkdirs$2;
const { pathExists: pathExists$4 } = pathExists_1;
const { areIdentical: areIdentical$1 } = stat$4;

async function createLink$1 (srcpath, dstpath) {
  let dstStat;
  try {
    dstStat = await fs$9.lstat(dstpath);
  } catch {
    // ignore error
  }

  let srcStat;
  try {
    srcStat = await fs$9.lstat(srcpath);
  } catch (err) {
    err.message = err.message.replace('lstat', 'ensureLink');
    throw err
  }

  if (dstStat && areIdentical$1(srcStat, dstStat)) return

  const dir = path$b.dirname(dstpath);

  const dirExists = await pathExists$4(dir);

  if (!dirExists) {
    await mkdir$1.mkdirs(dir);
  }

  await fs$9.link(srcpath, dstpath);
}

function createLinkSync$1 (srcpath, dstpath) {
  let dstStat;
  try {
    dstStat = fs$9.lstatSync(dstpath);
  } catch {}

  try {
    const srcStat = fs$9.lstatSync(srcpath);
    if (dstStat && areIdentical$1(srcStat, dstStat)) return
  } catch (err) {
    err.message = err.message.replace('lstat', 'ensureLink');
    throw err
  }

  const dir = path$b.dirname(dstpath);
  const dirExists = fs$9.existsSync(dir);
  if (dirExists) return fs$9.linkSync(srcpath, dstpath)
  mkdir$1.mkdirsSync(dir);

  return fs$9.linkSync(srcpath, dstpath)
}

var link = {
  createLink: u$6(createLink$1),
  createLinkSync: createLinkSync$1
};

const path$a = require$$1;
const fs$8 = fs$k;
const { pathExists: pathExists$3 } = pathExists_1;

const u$5 = universalify$1.fromPromise;

/**
 * Function that returns two types of paths, one relative to symlink, and one
 * relative to the current working directory. Checks if path is absolute or
 * relative. If the path is relative, this function checks if the path is
 * relative to symlink or relative to current working directory. This is an
 * initiative to find a smarter `srcpath` to supply when building symlinks.
 * This allows you to determine which path to use out of one of three possible
 * types of source paths. The first is an absolute path. This is detected by
 * `path.isAbsolute()`. When an absolute path is provided, it is checked to
 * see if it exists. If it does it's used, if not an error is returned
 * (callback)/ thrown (sync). The other two options for `srcpath` are a
 * relative url. By default Node's `fs.symlink` works by creating a symlink
 * using `dstpath` and expects the `srcpath` to be relative to the newly
 * created symlink. If you provide a `srcpath` that does not exist on the file
 * system it results in a broken symlink. To minimize this, the function
 * checks to see if the 'relative to symlink' source file exists, and if it
 * does it will use it. If it does not, it checks if there's a file that
 * exists that is relative to the current working directory, if does its used.
 * This preserves the expectations of the original fs.symlink spec and adds
 * the ability to pass in `relative to current working direcotry` paths.
 */

async function symlinkPaths$1 (srcpath, dstpath) {
  if (path$a.isAbsolute(srcpath)) {
    try {
      await fs$8.lstat(srcpath);
    } catch (err) {
      err.message = err.message.replace('lstat', 'ensureSymlink');
      throw err
    }

    return {
      toCwd: srcpath,
      toDst: srcpath
    }
  }

  const dstdir = path$a.dirname(dstpath);
  const relativeToDst = path$a.join(dstdir, srcpath);

  const exists = await pathExists$3(relativeToDst);
  if (exists) {
    return {
      toCwd: relativeToDst,
      toDst: srcpath
    }
  }

  try {
    await fs$8.lstat(srcpath);
  } catch (err) {
    err.message = err.message.replace('lstat', 'ensureSymlink');
    throw err
  }

  return {
    toCwd: srcpath,
    toDst: path$a.relative(dstdir, srcpath)
  }
}

function symlinkPathsSync$1 (srcpath, dstpath) {
  if (path$a.isAbsolute(srcpath)) {
    const exists = fs$8.existsSync(srcpath);
    if (!exists) throw new Error('absolute srcpath does not exist')
    return {
      toCwd: srcpath,
      toDst: srcpath
    }
  }

  const dstdir = path$a.dirname(dstpath);
  const relativeToDst = path$a.join(dstdir, srcpath);
  const exists = fs$8.existsSync(relativeToDst);
  if (exists) {
    return {
      toCwd: relativeToDst,
      toDst: srcpath
    }
  }

  const srcExists = fs$8.existsSync(srcpath);
  if (!srcExists) throw new Error('relative srcpath does not exist')
  return {
    toCwd: srcpath,
    toDst: path$a.relative(dstdir, srcpath)
  }
}

var symlinkPaths_1 = {
  symlinkPaths: u$5(symlinkPaths$1),
  symlinkPathsSync: symlinkPathsSync$1
};

const fs$7 = fs$k;
const u$4 = universalify$1.fromPromise;

async function symlinkType$1 (srcpath, type) {
  if (type) return type

  let stats;
  try {
    stats = await fs$7.lstat(srcpath);
  } catch {
    return 'file'
  }

  return (stats && stats.isDirectory()) ? 'dir' : 'file'
}

function symlinkTypeSync$1 (srcpath, type) {
  if (type) return type

  let stats;
  try {
    stats = fs$7.lstatSync(srcpath);
  } catch {
    return 'file'
  }
  return (stats && stats.isDirectory()) ? 'dir' : 'file'
}

var symlinkType_1 = {
  symlinkType: u$4(symlinkType$1),
  symlinkTypeSync: symlinkTypeSync$1
};

const u$3 = universalify$1.fromPromise;
const path$9 = require$$1;
const fs$6 = fs$k;

const { mkdirs, mkdirsSync } = mkdirs$2;

const { symlinkPaths, symlinkPathsSync } = symlinkPaths_1;
const { symlinkType, symlinkTypeSync } = symlinkType_1;

const { pathExists: pathExists$2 } = pathExists_1;

const { areIdentical } = stat$4;

async function createSymlink$1 (srcpath, dstpath, type) {
  let stats;
  try {
    stats = await fs$6.lstat(dstpath);
  } catch { }

  if (stats && stats.isSymbolicLink()) {
    const [srcStat, dstStat] = await Promise.all([
      fs$6.stat(srcpath),
      fs$6.stat(dstpath)
    ]);

    if (areIdentical(srcStat, dstStat)) return
  }

  const relative = await symlinkPaths(srcpath, dstpath);
  srcpath = relative.toDst;
  const toType = await symlinkType(relative.toCwd, type);
  const dir = path$9.dirname(dstpath);

  if (!(await pathExists$2(dir))) {
    await mkdirs(dir);
  }

  return fs$6.symlink(srcpath, dstpath, toType)
}

function createSymlinkSync$1 (srcpath, dstpath, type) {
  let stats;
  try {
    stats = fs$6.lstatSync(dstpath);
  } catch { }
  if (stats && stats.isSymbolicLink()) {
    const srcStat = fs$6.statSync(srcpath);
    const dstStat = fs$6.statSync(dstpath);
    if (areIdentical(srcStat, dstStat)) return
  }

  const relative = symlinkPathsSync(srcpath, dstpath);
  srcpath = relative.toDst;
  type = symlinkTypeSync(relative.toCwd, type);
  const dir = path$9.dirname(dstpath);
  const exists = fs$6.existsSync(dir);
  if (exists) return fs$6.symlinkSync(srcpath, dstpath, type)
  mkdirsSync(dir);
  return fs$6.symlinkSync(srcpath, dstpath, type)
}

var symlink = {
  createSymlink: u$3(createSymlink$1),
  createSymlinkSync: createSymlinkSync$1
};

const { createFile, createFileSync } = file$1;
const { createLink, createLinkSync } = link;
const { createSymlink, createSymlinkSync } = symlink;

var ensure = {
  // file
  createFile,
  createFileSync,
  ensureFile: createFile,
  ensureFileSync: createFileSync,
  // link
  createLink,
  createLinkSync,
  ensureLink: createLink,
  ensureLinkSync: createLinkSync,
  // symlink
  createSymlink,
  createSymlinkSync,
  ensureSymlink: createSymlink,
  ensureSymlinkSync: createSymlinkSync
};

function stringify$6 (obj, { EOL = '\n', finalEOL = true, replacer = null, spaces } = {}) {
  const EOF = finalEOL ? EOL : '';
  const str = JSON.stringify(obj, replacer, spaces);

  return str.replace(/\n/g, EOL) + EOF
}

function stripBom$1 (content) {
  // we do this because JSON.parse would convert it to a utf8 string if encoding wasn't specified
  if (Buffer.isBuffer(content)) content = content.toString('utf8');
  return content.replace(/^\uFEFF/, '')
}

var utils = { stringify: stringify$6, stripBom: stripBom$1 };

let _fs;
try {
  _fs = gracefulFs;
} catch (_) {
  _fs = require$$3;
}
const universalify = universalify$1;
const { stringify: stringify$5, stripBom } = utils;

async function _readFile (file, options = {}) {
  if (typeof options === 'string') {
    options = { encoding: options };
  }

  const fs = options.fs || _fs;

  const shouldThrow = 'throws' in options ? options.throws : true;

  let data = await universalify.fromCallback(fs.readFile)(file, options);

  data = stripBom(data);

  let obj;
  try {
    obj = JSON.parse(data, options ? options.reviver : null);
  } catch (err) {
    if (shouldThrow) {
      err.message = `${file}: ${err.message}`;
      throw err
    } else {
      return null
    }
  }

  return obj
}

const readFile$1 = universalify.fromPromise(_readFile);

function readFileSync (file, options = {}) {
  if (typeof options === 'string') {
    options = { encoding: options };
  }

  const fs = options.fs || _fs;

  const shouldThrow = 'throws' in options ? options.throws : true;

  try {
    let content = fs.readFileSync(file, options);
    content = stripBom(content);
    return JSON.parse(content, options.reviver)
  } catch (err) {
    if (shouldThrow) {
      err.message = `${file}: ${err.message}`;
      throw err
    } else {
      return null
    }
  }
}

async function _writeFile (file, obj, options = {}) {
  const fs = options.fs || _fs;

  const str = stringify$5(obj, options);

  await universalify.fromCallback(fs.writeFile)(file, str, options);
}

const writeFile$1 = universalify.fromPromise(_writeFile);

function writeFileSync (file, obj, options = {}) {
  const fs = options.fs || _fs;

  const str = stringify$5(obj, options);
  // not sure if fs.writeFileSync returns anything, but just in case
  return fs.writeFileSync(file, str, options)
}

const jsonfile$1 = {
  readFile: readFile$1,
  readFileSync,
  writeFile: writeFile$1,
  writeFileSync
};

var jsonfile_1 = jsonfile$1;

const jsonFile$1 = jsonfile_1;

var jsonfile = {
  // jsonfile exports
  readJson: jsonFile$1.readFile,
  readJsonSync: jsonFile$1.readFileSync,
  writeJson: jsonFile$1.writeFile,
  writeJsonSync: jsonFile$1.writeFileSync
};

const u$2 = universalify$1.fromPromise;
const fs$5 = fs$k;
const path$8 = require$$1;
const mkdir = mkdirs$2;
const pathExists$1 = pathExists_1.pathExists;

async function outputFile$1 (file, data, encoding = 'utf-8') {
  const dir = path$8.dirname(file);

  if (!(await pathExists$1(dir))) {
    await mkdir.mkdirs(dir);
  }

  return fs$5.writeFile(file, data, encoding)
}

function outputFileSync$1 (file, ...args) {
  const dir = path$8.dirname(file);
  if (!fs$5.existsSync(dir)) {
    mkdir.mkdirsSync(dir);
  }

  fs$5.writeFileSync(file, ...args);
}

var outputFile_1 = {
  outputFile: u$2(outputFile$1),
  outputFileSync: outputFileSync$1
};

const { stringify: stringify$4 } = utils;
const { outputFile } = outputFile_1;

async function outputJson (file, data, options = {}) {
  const str = stringify$4(data, options);

  await outputFile(file, str, options);
}

var outputJson_1 = outputJson;

const { stringify: stringify$3 } = utils;
const { outputFileSync } = outputFile_1;

function outputJsonSync (file, data, options) {
  const str = stringify$3(data, options);

  outputFileSync(file, str, options);
}

var outputJsonSync_1 = outputJsonSync;

const u$1 = universalify$1.fromPromise;
const jsonFile = jsonfile;

jsonFile.outputJson = u$1(outputJson_1);
jsonFile.outputJsonSync = outputJsonSync_1;
// aliases
jsonFile.outputJSON = jsonFile.outputJson;
jsonFile.outputJSONSync = jsonFile.outputJsonSync;
jsonFile.writeJSON = jsonFile.writeJson;
jsonFile.writeJSONSync = jsonFile.writeJsonSync;
jsonFile.readJSON = jsonFile.readJson;
jsonFile.readJSONSync = jsonFile.readJsonSync;

var json$1 = jsonFile;

const fs$4 = fs$k;
const path$7 = require$$1;
const { copy } = copy$1;
const { remove } = remove_1;
const { mkdirp } = mkdirs$2;
const { pathExists } = pathExists_1;
const stat$1 = stat$4;

async function move$1 (src, dest, opts = {}) {
  const overwrite = opts.overwrite || opts.clobber || false;

  const { srcStat, isChangingCase = false } = await stat$1.checkPaths(src, dest, 'move', opts);

  await stat$1.checkParentPaths(src, srcStat, dest, 'move');

  // If the parent of dest is not root, make sure it exists before proceeding
  const destParent = path$7.dirname(dest);
  const parsedParentPath = path$7.parse(destParent);
  if (parsedParentPath.root !== destParent) {
    await mkdirp(destParent);
  }

  return doRename$1(src, dest, overwrite, isChangingCase)
}

async function doRename$1 (src, dest, overwrite, isChangingCase) {
  if (!isChangingCase) {
    if (overwrite) {
      await remove(dest);
    } else if (await pathExists(dest)) {
      throw new Error('dest already exists.')
    }
  }

  try {
    // Try w/ rename first, and try copy + remove if EXDEV
    await fs$4.rename(src, dest);
  } catch (err) {
    if (err.code !== 'EXDEV') {
      throw err
    }
    await moveAcrossDevice$1(src, dest, overwrite);
  }
}

async function moveAcrossDevice$1 (src, dest, overwrite) {
  const opts = {
    overwrite,
    errorOnExist: true,
    preserveTimestamps: true
  };

  await copy(src, dest, opts);
  return remove(src)
}

var move_1 = move$1;

const fs$3 = gracefulFs;
const path$6 = require$$1;
const copySync = copy$1.copySync;
const removeSync = remove_1.removeSync;
const mkdirpSync = mkdirs$2.mkdirpSync;
const stat = stat$4;

function moveSync (src, dest, opts) {
  opts = opts || {};
  const overwrite = opts.overwrite || opts.clobber || false;

  const { srcStat, isChangingCase = false } = stat.checkPathsSync(src, dest, 'move', opts);
  stat.checkParentPathsSync(src, srcStat, dest, 'move');
  if (!isParentRoot(dest)) mkdirpSync(path$6.dirname(dest));
  return doRename(src, dest, overwrite, isChangingCase)
}

function isParentRoot (dest) {
  const parent = path$6.dirname(dest);
  const parsedPath = path$6.parse(parent);
  return parsedPath.root === parent
}

function doRename (src, dest, overwrite, isChangingCase) {
  if (isChangingCase) return rename(src, dest, overwrite)
  if (overwrite) {
    removeSync(dest);
    return rename(src, dest, overwrite)
  }
  if (fs$3.existsSync(dest)) throw new Error('dest already exists.')
  return rename(src, dest, overwrite)
}

function rename (src, dest, overwrite) {
  try {
    fs$3.renameSync(src, dest);
  } catch (err) {
    if (err.code !== 'EXDEV') throw err
    return moveAcrossDevice(src, dest, overwrite)
  }
}

function moveAcrossDevice (src, dest, overwrite) {
  const opts = {
    overwrite,
    errorOnExist: true,
    preserveTimestamps: true
  };
  copySync(src, dest, opts);
  return removeSync(src)
}

var moveSync_1 = moveSync;

const u = universalify$1.fromPromise;
var move = {
  move: u(move_1),
  moveSync: moveSync_1
};

var lib$1 = {
  // Export promiseified graceful-fs:
  ...fs$k,
  // Export extra methods:
  ...copy$1,
  ...empty,
  ...ensure,
  ...json$1,
  ...mkdirs$2,
  ...move,
  ...outputFile_1,
  ...pathExists_1,
  ...remove_1
};

// This is a generated file. Do not edit.
var Space_Separator = /[\u1680\u2000-\u200A\u202F\u205F\u3000]/;
var ID_Start = /[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u0860-\u086A\u08A0-\u08B4\u08B6-\u08BD\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u09FC\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0AF9\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58-\u0C5A\u0C60\u0C61\u0C80\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D54-\u0D56\u0D5F-\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u1884\u1887-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1C80-\u1C88\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312E\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FEA\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA7AE\uA7B0-\uA7B7\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA8FD\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDE80-\uDE9C\uDEA0-\uDED0\uDF00-\uDF1F\uDF2D-\uDF4A\uDF50-\uDF75\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDCB0-\uDCD3\uDCD8-\uDCFB\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDCE0-\uDCF2\uDCF4\uDCF5\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00\uDE10-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE4\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48\uDC80-\uDCB2\uDCC0-\uDCF2]|\uD804[\uDC03-\uDC37\uDC83-\uDCAF\uDCD0-\uDCE8\uDD03-\uDD26\uDD50-\uDD72\uDD76\uDD83-\uDDB2\uDDC1-\uDDC4\uDDDA\uDDDC\uDE00-\uDE11\uDE13-\uDE2B\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEDE\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3D\uDF50\uDF5D-\uDF61]|\uD805[\uDC00-\uDC34\uDC47-\uDC4A\uDC80-\uDCAF\uDCC4\uDCC5\uDCC7\uDD80-\uDDAE\uDDD8-\uDDDB\uDE00-\uDE2F\uDE44\uDE80-\uDEAA\uDF00-\uDF19]|\uD806[\uDCA0-\uDCDF\uDCFF\uDE00\uDE0B-\uDE32\uDE3A\uDE50\uDE5C-\uDE83\uDE86-\uDE89\uDEC0-\uDEF8]|\uD807[\uDC00-\uDC08\uDC0A-\uDC2E\uDC40\uDC72-\uDC8F\uDD00-\uDD06\uDD08\uDD09\uDD0B-\uDD30\uDD46]|\uD808[\uDC00-\uDF99]|\uD809[\uDC00-\uDC6E\uDC80-\uDD43]|[\uD80C\uD81C-\uD820\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872\uD874-\uD879][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD811[\uDC00-\uDE46]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDED0-\uDEED\uDF00-\uDF2F\uDF40-\uDF43\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50\uDF93-\uDF9F\uDFE0\uDFE1]|\uD821[\uDC00-\uDFEC]|\uD822[\uDC00-\uDEF2]|\uD82C[\uDC00-\uDD1E\uDD70-\uDEFB]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB]|\uD83A[\uDC00-\uDCC4\uDD00-\uDD43]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1\uDEB0-\uDFFF]|\uD87A[\uDC00-\uDFE0]|\uD87E[\uDC00-\uDE1D]/;
var ID_Continue = /[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0300-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u0483-\u0487\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u05D0-\u05EA\u05F0-\u05F2\u0610-\u061A\u0620-\u0669\u066E-\u06D3\u06D5-\u06DC\u06DF-\u06E8\u06EA-\u06FC\u06FF\u0710-\u074A\u074D-\u07B1\u07C0-\u07F5\u07FA\u0800-\u082D\u0840-\u085B\u0860-\u086A\u08A0-\u08B4\u08B6-\u08BD\u08D4-\u08E1\u08E3-\u0963\u0966-\u096F\u0971-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7\u09C8\u09CB-\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09E6-\u09F1\u09FC\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AEF\u0AF9-\u0AFF\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B66-\u0B6F\u0B71\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BEF\u0C00-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C58-\u0C5A\u0C60-\u0C63\u0C66-\u0C6F\u0C80-\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2\u0D00-\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D44\u0D46-\u0D48\u0D4A-\u0D4E\u0D54-\u0D57\u0D5F-\u0D63\u0D66-\u0D6F\u0D7A-\u0D7F\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2\u0DF3\u0E01-\u0E3A\u0E40-\u0E4E\u0E50-\u0E59\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E-\u0F47\u0F49-\u0F6C\u0F71-\u0F84\u0F86-\u0F97\u0F99-\u0FBC\u0FC6\u1000-\u1049\u1050-\u109D\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u135F\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772\u1773\u1780-\u17D3\u17D7\u17DC\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u1820-\u1877\u1880-\u18AA\u18B0-\u18F5\u1900-\u191E\u1920-\u192B\u1930-\u193B\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19D9\u1A00-\u1A1B\u1A20-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA7\u1AB0-\u1ABD\u1B00-\u1B4B\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1BF3\u1C00-\u1C37\u1C40-\u1C49\u1C4D-\u1C7D\u1C80-\u1C88\u1CD0-\u1CD2\u1CD4-\u1CF9\u1D00-\u1DF9\u1DFB-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u203F\u2040\u2054\u2071\u207F\u2090-\u209C\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D7F-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u2E2F\u3005-\u3007\u3021-\u302F\u3031-\u3035\u3038-\u303C\u3041-\u3096\u3099\u309A\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312E\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FEA\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66F\uA674-\uA67D\uA67F-\uA6F1\uA717-\uA71F\uA722-\uA788\uA78B-\uA7AE\uA7B0-\uA7B7\uA7F7-\uA827\uA840-\uA873\uA880-\uA8C5\uA8D0-\uA8D9\uA8E0-\uA8F7\uA8FB\uA8FD\uA900-\uA92D\uA930-\uA953\uA960-\uA97C\uA980-\uA9C0\uA9CF-\uA9D9\uA9E0-\uA9FE\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA60-\uAA76\uAA7A-\uAAC2\uAADB-\uAADD\uAAE0-\uAAEF\uAAF2-\uAAF6\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABEA\uABEC\uABED\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE00-\uFE0F\uFE20-\uFE2F\uFE33\uFE34\uFE4D-\uFE4F\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF3F\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDDFD\uDE80-\uDE9C\uDEA0-\uDED0\uDEE0\uDF00-\uDF1F\uDF2D-\uDF4A\uDF50-\uDF7A\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDCA0-\uDCA9\uDCB0-\uDCD3\uDCD8-\uDCFB\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDCE0-\uDCF2\uDCF4\uDCF5\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00-\uDE03\uDE05\uDE06\uDE0C-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE38-\uDE3A\uDE3F\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE6\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48\uDC80-\uDCB2\uDCC0-\uDCF2]|\uD804[\uDC00-\uDC46\uDC66-\uDC6F\uDC7F-\uDCBA\uDCD0-\uDCE8\uDCF0-\uDCF9\uDD00-\uDD34\uDD36-\uDD3F\uDD50-\uDD73\uDD76\uDD80-\uDDC4\uDDCA-\uDDCC\uDDD0-\uDDDA\uDDDC\uDE00-\uDE11\uDE13-\uDE37\uDE3E\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEEA\uDEF0-\uDEF9\uDF00-\uDF03\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3C-\uDF44\uDF47\uDF48\uDF4B-\uDF4D\uDF50\uDF57\uDF5D-\uDF63\uDF66-\uDF6C\uDF70-\uDF74]|\uD805[\uDC00-\uDC4A\uDC50-\uDC59\uDC80-\uDCC5\uDCC7\uDCD0-\uDCD9\uDD80-\uDDB5\uDDB8-\uDDC0\uDDD8-\uDDDD\uDE00-\uDE40\uDE44\uDE50-\uDE59\uDE80-\uDEB7\uDEC0-\uDEC9\uDF00-\uDF19\uDF1D-\uDF2B\uDF30-\uDF39]|\uD806[\uDCA0-\uDCE9\uDCFF\uDE00-\uDE3E\uDE47\uDE50-\uDE83\uDE86-\uDE99\uDEC0-\uDEF8]|\uD807[\uDC00-\uDC08\uDC0A-\uDC36\uDC38-\uDC40\uDC50-\uDC59\uDC72-\uDC8F\uDC92-\uDCA7\uDCA9-\uDCB6\uDD00-\uDD06\uDD08\uDD09\uDD0B-\uDD36\uDD3A\uDD3C\uDD3D\uDD3F-\uDD47\uDD50-\uDD59]|\uD808[\uDC00-\uDF99]|\uD809[\uDC00-\uDC6E\uDC80-\uDD43]|[\uD80C\uD81C-\uD820\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872\uD874-\uD879][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD811[\uDC00-\uDE46]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDE60-\uDE69\uDED0-\uDEED\uDEF0-\uDEF4\uDF00-\uDF36\uDF40-\uDF43\uDF50-\uDF59\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50-\uDF7E\uDF8F-\uDF9F\uDFE0\uDFE1]|\uD821[\uDC00-\uDFEC]|\uD822[\uDC00-\uDEF2]|\uD82C[\uDC00-\uDD1E\uDD70-\uDEFB]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99\uDC9D\uDC9E]|\uD834[\uDD65-\uDD69\uDD6D-\uDD72\uDD7B-\uDD82\uDD85-\uDD8B\uDDAA-\uDDAD\uDE42-\uDE44]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB\uDFCE-\uDFFF]|\uD836[\uDE00-\uDE36\uDE3B-\uDE6C\uDE75\uDE84\uDE9B-\uDE9F\uDEA1-\uDEAF]|\uD838[\uDC00-\uDC06\uDC08-\uDC18\uDC1B-\uDC21\uDC23\uDC24\uDC26-\uDC2A]|\uD83A[\uDC00-\uDCC4\uDCD0-\uDCD6\uDD00-\uDD4A\uDD50-\uDD59]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1\uDEB0-\uDFFF]|\uD87A[\uDC00-\uDFE0]|\uD87E[\uDC00-\uDE1D]|\uDB40[\uDD00-\uDDEF]/;

var unicode = {
	Space_Separator: Space_Separator,
	ID_Start: ID_Start,
	ID_Continue: ID_Continue
};

var util = {
    isSpaceSeparator (c) {
        return typeof c === 'string' && unicode.Space_Separator.test(c)
    },

    isIdStartChar (c) {
        return typeof c === 'string' && (
            (c >= 'a' && c <= 'z') ||
        (c >= 'A' && c <= 'Z') ||
        (c === '$') || (c === '_') ||
        unicode.ID_Start.test(c)
        )
    },

    isIdContinueChar (c) {
        return typeof c === 'string' && (
            (c >= 'a' && c <= 'z') ||
        (c >= 'A' && c <= 'Z') ||
        (c >= '0' && c <= '9') ||
        (c === '$') || (c === '_') ||
        (c === '\u200C') || (c === '\u200D') ||
        unicode.ID_Continue.test(c)
        )
    },

    isDigit (c) {
        return typeof c === 'string' && /[0-9]/.test(c)
    },

    isHexDigit (c) {
        return typeof c === 'string' && /[0-9A-Fa-f]/.test(c)
    },
};

let source;
let parseState;
let stack;
let pos;
let line;
let column;
let token;
let key;
let root;

var parse$1 = function parse (text, reviver) {
    source = String(text);
    parseState = 'start';
    stack = [];
    pos = 0;
    line = 1;
    column = 0;
    token = undefined;
    key = undefined;
    root = undefined;

    do {
        token = lex();

        // This code is unreachable.
        // if (!parseStates[parseState]) {
        //     throw invalidParseState()
        // }

        parseStates[parseState]();
    } while (token.type !== 'eof')

    if (typeof reviver === 'function') {
        return internalize({'': root}, '', reviver)
    }

    return root
};

function internalize (holder, name, reviver) {
    const value = holder[name];
    if (value != null && typeof value === 'object') {
        if (Array.isArray(value)) {
            for (let i = 0; i < value.length; i++) {
                const key = String(i);
                const replacement = internalize(value, key, reviver);
                if (replacement === undefined) {
                    delete value[key];
                } else {
                    Object.defineProperty(value, key, {
                        value: replacement,
                        writable: true,
                        enumerable: true,
                        configurable: true,
                    });
                }
            }
        } else {
            for (const key in value) {
                const replacement = internalize(value, key, reviver);
                if (replacement === undefined) {
                    delete value[key];
                } else {
                    Object.defineProperty(value, key, {
                        value: replacement,
                        writable: true,
                        enumerable: true,
                        configurable: true,
                    });
                }
            }
        }
    }

    return reviver.call(holder, name, value)
}

let lexState;
let buffer;
let doubleQuote;
let sign;
let c;

function lex () {
    lexState = 'default';
    buffer = '';
    doubleQuote = false;
    sign = 1;

    for (;;) {
        c = peek();

        // This code is unreachable.
        // if (!lexStates[lexState]) {
        //     throw invalidLexState(lexState)
        // }

        const token = lexStates[lexState]();
        if (token) {
            return token
        }
    }
}

function peek () {
    if (source[pos]) {
        return String.fromCodePoint(source.codePointAt(pos))
    }
}

function read () {
    const c = peek();

    if (c === '\n') {
        line++;
        column = 0;
    } else if (c) {
        column += c.length;
    } else {
        column++;
    }

    if (c) {
        pos += c.length;
    }

    return c
}

const lexStates = {
    default () {
        switch (c) {
        case '\t':
        case '\v':
        case '\f':
        case ' ':
        case '\u00A0':
        case '\uFEFF':
        case '\n':
        case '\r':
        case '\u2028':
        case '\u2029':
            read();
            return

        case '/':
            read();
            lexState = 'comment';
            return

        case undefined:
            read();
            return newToken('eof')
        }

        if (util.isSpaceSeparator(c)) {
            read();
            return
        }

        // This code is unreachable.
        // if (!lexStates[parseState]) {
        //     throw invalidLexState(parseState)
        // }

        return lexStates[parseState]()
    },

    comment () {
        switch (c) {
        case '*':
            read();
            lexState = 'multiLineComment';
            return

        case '/':
            read();
            lexState = 'singleLineComment';
            return
        }

        throw invalidChar(read())
    },

    multiLineComment () {
        switch (c) {
        case '*':
            read();
            lexState = 'multiLineCommentAsterisk';
            return

        case undefined:
            throw invalidChar(read())
        }

        read();
    },

    multiLineCommentAsterisk () {
        switch (c) {
        case '*':
            read();
            return

        case '/':
            read();
            lexState = 'default';
            return

        case undefined:
            throw invalidChar(read())
        }

        read();
        lexState = 'multiLineComment';
    },

    singleLineComment () {
        switch (c) {
        case '\n':
        case '\r':
        case '\u2028':
        case '\u2029':
            read();
            lexState = 'default';
            return

        case undefined:
            read();
            return newToken('eof')
        }

        read();
    },

    value () {
        switch (c) {
        case '{':
        case '[':
            return newToken('punctuator', read())

        case 'n':
            read();
            literal('ull');
            return newToken('null', null)

        case 't':
            read();
            literal('rue');
            return newToken('boolean', true)

        case 'f':
            read();
            literal('alse');
            return newToken('boolean', false)

        case '-':
        case '+':
            if (read() === '-') {
                sign = -1;
            }

            lexState = 'sign';
            return

        case '.':
            buffer = read();
            lexState = 'decimalPointLeading';
            return

        case '0':
            buffer = read();
            lexState = 'zero';
            return

        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
            buffer = read();
            lexState = 'decimalInteger';
            return

        case 'I':
            read();
            literal('nfinity');
            return newToken('numeric', Infinity)

        case 'N':
            read();
            literal('aN');
            return newToken('numeric', NaN)

        case '"':
        case "'":
            doubleQuote = (read() === '"');
            buffer = '';
            lexState = 'string';
            return
        }

        throw invalidChar(read())
    },

    identifierNameStartEscape () {
        if (c !== 'u') {
            throw invalidChar(read())
        }

        read();
        const u = unicodeEscape();
        switch (u) {
        case '$':
        case '_':
            break

        default:
            if (!util.isIdStartChar(u)) {
                throw invalidIdentifier()
            }

            break
        }

        buffer += u;
        lexState = 'identifierName';
    },

    identifierName () {
        switch (c) {
        case '$':
        case '_':
        case '\u200C':
        case '\u200D':
            buffer += read();
            return

        case '\\':
            read();
            lexState = 'identifierNameEscape';
            return
        }

        if (util.isIdContinueChar(c)) {
            buffer += read();
            return
        }

        return newToken('identifier', buffer)
    },

    identifierNameEscape () {
        if (c !== 'u') {
            throw invalidChar(read())
        }

        read();
        const u = unicodeEscape();
        switch (u) {
        case '$':
        case '_':
        case '\u200C':
        case '\u200D':
            break

        default:
            if (!util.isIdContinueChar(u)) {
                throw invalidIdentifier()
            }

            break
        }

        buffer += u;
        lexState = 'identifierName';
    },

    sign () {
        switch (c) {
        case '.':
            buffer = read();
            lexState = 'decimalPointLeading';
            return

        case '0':
            buffer = read();
            lexState = 'zero';
            return

        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
            buffer = read();
            lexState = 'decimalInteger';
            return

        case 'I':
            read();
            literal('nfinity');
            return newToken('numeric', sign * Infinity)

        case 'N':
            read();
            literal('aN');
            return newToken('numeric', NaN)
        }

        throw invalidChar(read())
    },

    zero () {
        switch (c) {
        case '.':
            buffer += read();
            lexState = 'decimalPoint';
            return

        case 'e':
        case 'E':
            buffer += read();
            lexState = 'decimalExponent';
            return

        case 'x':
        case 'X':
            buffer += read();
            lexState = 'hexadecimal';
            return
        }

        return newToken('numeric', sign * 0)
    },

    decimalInteger () {
        switch (c) {
        case '.':
            buffer += read();
            lexState = 'decimalPoint';
            return

        case 'e':
        case 'E':
            buffer += read();
            lexState = 'decimalExponent';
            return
        }

        if (util.isDigit(c)) {
            buffer += read();
            return
        }

        return newToken('numeric', sign * Number(buffer))
    },

    decimalPointLeading () {
        if (util.isDigit(c)) {
            buffer += read();
            lexState = 'decimalFraction';
            return
        }

        throw invalidChar(read())
    },

    decimalPoint () {
        switch (c) {
        case 'e':
        case 'E':
            buffer += read();
            lexState = 'decimalExponent';
            return
        }

        if (util.isDigit(c)) {
            buffer += read();
            lexState = 'decimalFraction';
            return
        }

        return newToken('numeric', sign * Number(buffer))
    },

    decimalFraction () {
        switch (c) {
        case 'e':
        case 'E':
            buffer += read();
            lexState = 'decimalExponent';
            return
        }

        if (util.isDigit(c)) {
            buffer += read();
            return
        }

        return newToken('numeric', sign * Number(buffer))
    },

    decimalExponent () {
        switch (c) {
        case '+':
        case '-':
            buffer += read();
            lexState = 'decimalExponentSign';
            return
        }

        if (util.isDigit(c)) {
            buffer += read();
            lexState = 'decimalExponentInteger';
            return
        }

        throw invalidChar(read())
    },

    decimalExponentSign () {
        if (util.isDigit(c)) {
            buffer += read();
            lexState = 'decimalExponentInteger';
            return
        }

        throw invalidChar(read())
    },

    decimalExponentInteger () {
        if (util.isDigit(c)) {
            buffer += read();
            return
        }

        return newToken('numeric', sign * Number(buffer))
    },

    hexadecimal () {
        if (util.isHexDigit(c)) {
            buffer += read();
            lexState = 'hexadecimalInteger';
            return
        }

        throw invalidChar(read())
    },

    hexadecimalInteger () {
        if (util.isHexDigit(c)) {
            buffer += read();
            return
        }

        return newToken('numeric', sign * Number(buffer))
    },

    string () {
        switch (c) {
        case '\\':
            read();
            buffer += escape();
            return

        case '"':
            if (doubleQuote) {
                read();
                return newToken('string', buffer)
            }

            buffer += read();
            return

        case "'":
            if (!doubleQuote) {
                read();
                return newToken('string', buffer)
            }

            buffer += read();
            return

        case '\n':
        case '\r':
            throw invalidChar(read())

        case '\u2028':
        case '\u2029':
            separatorChar(c);
            break

        case undefined:
            throw invalidChar(read())
        }

        buffer += read();
    },

    start () {
        switch (c) {
        case '{':
        case '[':
            return newToken('punctuator', read())

        // This code is unreachable since the default lexState handles eof.
        // case undefined:
        //     return newToken('eof')
        }

        lexState = 'value';
    },

    beforePropertyName () {
        switch (c) {
        case '$':
        case '_':
            buffer = read();
            lexState = 'identifierName';
            return

        case '\\':
            read();
            lexState = 'identifierNameStartEscape';
            return

        case '}':
            return newToken('punctuator', read())

        case '"':
        case "'":
            doubleQuote = (read() === '"');
            lexState = 'string';
            return
        }

        if (util.isIdStartChar(c)) {
            buffer += read();
            lexState = 'identifierName';
            return
        }

        throw invalidChar(read())
    },

    afterPropertyName () {
        if (c === ':') {
            return newToken('punctuator', read())
        }

        throw invalidChar(read())
    },

    beforePropertyValue () {
        lexState = 'value';
    },

    afterPropertyValue () {
        switch (c) {
        case ',':
        case '}':
            return newToken('punctuator', read())
        }

        throw invalidChar(read())
    },

    beforeArrayValue () {
        if (c === ']') {
            return newToken('punctuator', read())
        }

        lexState = 'value';
    },

    afterArrayValue () {
        switch (c) {
        case ',':
        case ']':
            return newToken('punctuator', read())
        }

        throw invalidChar(read())
    },

    end () {
        // This code is unreachable since it's handled by the default lexState.
        // if (c === undefined) {
        //     read()
        //     return newToken('eof')
        // }

        throw invalidChar(read())
    },
};

function newToken (type, value) {
    return {
        type,
        value,
        line,
        column,
    }
}

function literal (s) {
    for (const c of s) {
        const p = peek();

        if (p !== c) {
            throw invalidChar(read())
        }

        read();
    }
}

function escape () {
    const c = peek();
    switch (c) {
    case 'b':
        read();
        return '\b'

    case 'f':
        read();
        return '\f'

    case 'n':
        read();
        return '\n'

    case 'r':
        read();
        return '\r'

    case 't':
        read();
        return '\t'

    case 'v':
        read();
        return '\v'

    case '0':
        read();
        if (util.isDigit(peek())) {
            throw invalidChar(read())
        }

        return '\0'

    case 'x':
        read();
        return hexEscape()

    case 'u':
        read();
        return unicodeEscape()

    case '\n':
    case '\u2028':
    case '\u2029':
        read();
        return ''

    case '\r':
        read();
        if (peek() === '\n') {
            read();
        }

        return ''

    case '1':
    case '2':
    case '3':
    case '4':
    case '5':
    case '6':
    case '7':
    case '8':
    case '9':
        throw invalidChar(read())

    case undefined:
        throw invalidChar(read())
    }

    return read()
}

function hexEscape () {
    let buffer = '';
    let c = peek();

    if (!util.isHexDigit(c)) {
        throw invalidChar(read())
    }

    buffer += read();

    c = peek();
    if (!util.isHexDigit(c)) {
        throw invalidChar(read())
    }

    buffer += read();

    return String.fromCodePoint(parseInt(buffer, 16))
}

function unicodeEscape () {
    let buffer = '';
    let count = 4;

    while (count-- > 0) {
        const c = peek();
        if (!util.isHexDigit(c)) {
            throw invalidChar(read())
        }

        buffer += read();
    }

    return String.fromCodePoint(parseInt(buffer, 16))
}

const parseStates = {
    start () {
        if (token.type === 'eof') {
            throw invalidEOF()
        }

        push();
    },

    beforePropertyName () {
        switch (token.type) {
        case 'identifier':
        case 'string':
            key = token.value;
            parseState = 'afterPropertyName';
            return

        case 'punctuator':
            // This code is unreachable since it's handled by the lexState.
            // if (token.value !== '}') {
            //     throw invalidToken()
            // }

            pop();
            return

        case 'eof':
            throw invalidEOF()
        }

        // This code is unreachable since it's handled by the lexState.
        // throw invalidToken()
    },

    afterPropertyName () {
        // This code is unreachable since it's handled by the lexState.
        // if (token.type !== 'punctuator' || token.value !== ':') {
        //     throw invalidToken()
        // }

        if (token.type === 'eof') {
            throw invalidEOF()
        }

        parseState = 'beforePropertyValue';
    },

    beforePropertyValue () {
        if (token.type === 'eof') {
            throw invalidEOF()
        }

        push();
    },

    beforeArrayValue () {
        if (token.type === 'eof') {
            throw invalidEOF()
        }

        if (token.type === 'punctuator' && token.value === ']') {
            pop();
            return
        }

        push();
    },

    afterPropertyValue () {
        // This code is unreachable since it's handled by the lexState.
        // if (token.type !== 'punctuator') {
        //     throw invalidToken()
        // }

        if (token.type === 'eof') {
            throw invalidEOF()
        }

        switch (token.value) {
        case ',':
            parseState = 'beforePropertyName';
            return

        case '}':
            pop();
        }

        // This code is unreachable since it's handled by the lexState.
        // throw invalidToken()
    },

    afterArrayValue () {
        // This code is unreachable since it's handled by the lexState.
        // if (token.type !== 'punctuator') {
        //     throw invalidToken()
        // }

        if (token.type === 'eof') {
            throw invalidEOF()
        }

        switch (token.value) {
        case ',':
            parseState = 'beforeArrayValue';
            return

        case ']':
            pop();
        }

        // This code is unreachable since it's handled by the lexState.
        // throw invalidToken()
    },

    end () {
        // This code is unreachable since it's handled by the lexState.
        // if (token.type !== 'eof') {
        //     throw invalidToken()
        // }
    },
};

function push () {
    let value;

    switch (token.type) {
    case 'punctuator':
        switch (token.value) {
        case '{':
            value = {};
            break

        case '[':
            value = [];
            break
        }

        break

    case 'null':
    case 'boolean':
    case 'numeric':
    case 'string':
        value = token.value;
        break

    // This code is unreachable.
    // default:
    //     throw invalidToken()
    }

    if (root === undefined) {
        root = value;
    } else {
        const parent = stack[stack.length - 1];
        if (Array.isArray(parent)) {
            parent.push(value);
        } else {
            Object.defineProperty(parent, key, {
                value,
                writable: true,
                enumerable: true,
                configurable: true,
            });
        }
    }

    if (value !== null && typeof value === 'object') {
        stack.push(value);

        if (Array.isArray(value)) {
            parseState = 'beforeArrayValue';
        } else {
            parseState = 'beforePropertyName';
        }
    } else {
        const current = stack[stack.length - 1];
        if (current == null) {
            parseState = 'end';
        } else if (Array.isArray(current)) {
            parseState = 'afterArrayValue';
        } else {
            parseState = 'afterPropertyValue';
        }
    }
}

function pop () {
    stack.pop();

    const current = stack[stack.length - 1];
    if (current == null) {
        parseState = 'end';
    } else if (Array.isArray(current)) {
        parseState = 'afterArrayValue';
    } else {
        parseState = 'afterPropertyValue';
    }
}

// This code is unreachable.
// function invalidParseState () {
//     return new Error(`JSON5: invalid parse state '${parseState}'`)
// }

// This code is unreachable.
// function invalidLexState (state) {
//     return new Error(`JSON5: invalid lex state '${state}'`)
// }

function invalidChar (c) {
    if (c === undefined) {
        return syntaxError(`JSON5: invalid end of input at ${line}:${column}`)
    }

    return syntaxError(`JSON5: invalid character '${formatChar(c)}' at ${line}:${column}`)
}

function invalidEOF () {
    return syntaxError(`JSON5: invalid end of input at ${line}:${column}`)
}

// This code is unreachable.
// function invalidToken () {
//     if (token.type === 'eof') {
//         return syntaxError(`JSON5: invalid end of input at ${line}:${column}`)
//     }

//     const c = String.fromCodePoint(token.value.codePointAt(0))
//     return syntaxError(`JSON5: invalid character '${formatChar(c)}' at ${line}:${column}`)
// }

function invalidIdentifier () {
    column -= 5;
    return syntaxError(`JSON5: invalid identifier character at ${line}:${column}`)
}

function separatorChar (c) {
    console.warn(`JSON5: '${formatChar(c)}' in strings is not valid ECMAScript; consider escaping`);
}

function formatChar (c) {
    const replacements = {
        "'": "\\'",
        '"': '\\"',
        '\\': '\\\\',
        '\b': '\\b',
        '\f': '\\f',
        '\n': '\\n',
        '\r': '\\r',
        '\t': '\\t',
        '\v': '\\v',
        '\0': '\\0',
        '\u2028': '\\u2028',
        '\u2029': '\\u2029',
    };

    if (replacements[c]) {
        return replacements[c]
    }

    if (c < ' ') {
        const hexString = c.charCodeAt(0).toString(16);
        return '\\x' + ('00' + hexString).substring(hexString.length)
    }

    return c
}

function syntaxError (message) {
    const err = new SyntaxError(message);
    err.lineNumber = line;
    err.columnNumber = column;
    return err
}

var stringify$2 = function stringify (value, replacer, space) {
    const stack = [];
    let indent = '';
    let propertyList;
    let replacerFunc;
    let gap = '';
    let quote;

    if (
        replacer != null &&
        typeof replacer === 'object' &&
        !Array.isArray(replacer)
    ) {
        space = replacer.space;
        quote = replacer.quote;
        replacer = replacer.replacer;
    }

    if (typeof replacer === 'function') {
        replacerFunc = replacer;
    } else if (Array.isArray(replacer)) {
        propertyList = [];
        for (const v of replacer) {
            let item;

            if (typeof v === 'string') {
                item = v;
            } else if (
                typeof v === 'number' ||
                v instanceof String ||
                v instanceof Number
            ) {
                item = String(v);
            }

            if (item !== undefined && propertyList.indexOf(item) < 0) {
                propertyList.push(item);
            }
        }
    }

    if (space instanceof Number) {
        space = Number(space);
    } else if (space instanceof String) {
        space = String(space);
    }

    if (typeof space === 'number') {
        if (space > 0) {
            space = Math.min(10, Math.floor(space));
            gap = '          '.substr(0, space);
        }
    } else if (typeof space === 'string') {
        gap = space.substr(0, 10);
    }

    return serializeProperty('', {'': value})

    function serializeProperty (key, holder) {
        let value = holder[key];
        if (value != null) {
            if (typeof value.toJSON5 === 'function') {
                value = value.toJSON5(key);
            } else if (typeof value.toJSON === 'function') {
                value = value.toJSON(key);
            }
        }

        if (replacerFunc) {
            value = replacerFunc.call(holder, key, value);
        }

        if (value instanceof Number) {
            value = Number(value);
        } else if (value instanceof String) {
            value = String(value);
        } else if (value instanceof Boolean) {
            value = value.valueOf();
        }

        switch (value) {
        case null: return 'null'
        case true: return 'true'
        case false: return 'false'
        }

        if (typeof value === 'string') {
            return quoteString(value)
        }

        if (typeof value === 'number') {
            return String(value)
        }

        if (typeof value === 'object') {
            return Array.isArray(value) ? serializeArray(value) : serializeObject(value)
        }

        return undefined
    }

    function quoteString (value) {
        const quotes = {
            "'": 0.1,
            '"': 0.2,
        };

        const replacements = {
            "'": "\\'",
            '"': '\\"',
            '\\': '\\\\',
            '\b': '\\b',
            '\f': '\\f',
            '\n': '\\n',
            '\r': '\\r',
            '\t': '\\t',
            '\v': '\\v',
            '\0': '\\0',
            '\u2028': '\\u2028',
            '\u2029': '\\u2029',
        };

        let product = '';

        for (let i = 0; i < value.length; i++) {
            const c = value[i];
            switch (c) {
            case "'":
            case '"':
                quotes[c]++;
                product += c;
                continue

            case '\0':
                if (util.isDigit(value[i + 1])) {
                    product += '\\x00';
                    continue
                }
            }

            if (replacements[c]) {
                product += replacements[c];
                continue
            }

            if (c < ' ') {
                let hexString = c.charCodeAt(0).toString(16);
                product += '\\x' + ('00' + hexString).substring(hexString.length);
                continue
            }

            product += c;
        }

        const quoteChar = quote || Object.keys(quotes).reduce((a, b) => (quotes[a] < quotes[b]) ? a : b);

        product = product.replace(new RegExp(quoteChar, 'g'), replacements[quoteChar]);

        return quoteChar + product + quoteChar
    }

    function serializeObject (value) {
        if (stack.indexOf(value) >= 0) {
            throw TypeError('Converting circular structure to JSON5')
        }

        stack.push(value);

        let stepback = indent;
        indent = indent + gap;

        let keys = propertyList || Object.keys(value);
        let partial = [];
        for (const key of keys) {
            const propertyString = serializeProperty(key, value);
            if (propertyString !== undefined) {
                let member = serializeKey(key) + ':';
                if (gap !== '') {
                    member += ' ';
                }
                member += propertyString;
                partial.push(member);
            }
        }

        let final;
        if (partial.length === 0) {
            final = '{}';
        } else {
            let properties;
            if (gap === '') {
                properties = partial.join(',');
                final = '{' + properties + '}';
            } else {
                let separator = ',\n' + indent;
                properties = partial.join(separator);
                final = '{\n' + indent + properties + ',\n' + stepback + '}';
            }
        }

        stack.pop();
        indent = stepback;
        return final
    }

    function serializeKey (key) {
        if (key.length === 0) {
            return quoteString(key)
        }

        const firstChar = String.fromCodePoint(key.codePointAt(0));
        if (!util.isIdStartChar(firstChar)) {
            return quoteString(key)
        }

        for (let i = firstChar.length; i < key.length; i++) {
            if (!util.isIdContinueChar(String.fromCodePoint(key.codePointAt(i)))) {
                return quoteString(key)
            }
        }

        return key
    }

    function serializeArray (value) {
        if (stack.indexOf(value) >= 0) {
            throw TypeError('Converting circular structure to JSON5')
        }

        stack.push(value);

        let stepback = indent;
        indent = indent + gap;

        let partial = [];
        for (let i = 0; i < value.length; i++) {
            const propertyString = serializeProperty(String(i), value);
            partial.push((propertyString !== undefined) ? propertyString : 'null');
        }

        let final;
        if (partial.length === 0) {
            final = '[]';
        } else {
            if (gap === '') {
                let properties = partial.join(',');
                final = '[' + properties + ']';
            } else {
                let separator = ',\n' + indent;
                let properties = partial.join(separator);
                final = '[\n' + indent + properties + ',\n' + stepback + ']';
            }
        }

        stack.pop();
        indent = stepback;
        return final
    }
};

const JSON5$1 = {
    parse: parse$1,
    stringify: stringify$2,
};

var lib = JSON5$1;

var dist$1 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	default: lib
});

var require$$2 = /*@__PURE__*/getAugmentedNamespace(dist$1);

var jsYaml = {};

var loader$1 = {};

var common$5 = {};

function isNothing(subject) {
  return (typeof subject === 'undefined') || (subject === null);
}


function isObject(subject) {
  return (typeof subject === 'object') && (subject !== null);
}


function toArray(sequence) {
  if (Array.isArray(sequence)) return sequence;
  else if (isNothing(sequence)) return [];

  return [ sequence ];
}


function extend(target, source) {
  var index, length, key, sourceKeys;

  if (source) {
    sourceKeys = Object.keys(source);

    for (index = 0, length = sourceKeys.length; index < length; index += 1) {
      key = sourceKeys[index];
      target[key] = source[key];
    }
  }

  return target;
}


function repeat(string, count) {
  var result = '', cycle;

  for (cycle = 0; cycle < count; cycle += 1) {
    result += string;
  }

  return result;
}


function isNegativeZero(number) {
  return (number === 0) && (Number.NEGATIVE_INFINITY === 1 / number);
}


common$5.isNothing      = isNothing;
common$5.isObject       = isObject;
common$5.toArray        = toArray;
common$5.repeat         = repeat;
common$5.isNegativeZero = isNegativeZero;
common$5.extend         = extend;

function formatError(exception, compact) {
  var where = '', message = exception.reason || '(unknown reason)';

  if (!exception.mark) return message;

  if (exception.mark.name) {
    where += 'in "' + exception.mark.name + '" ';
  }

  where += '(' + (exception.mark.line + 1) + ':' + (exception.mark.column + 1) + ')';

  if (!compact && exception.mark.snippet) {
    where += '\n\n' + exception.mark.snippet;
  }

  return message + ' ' + where;
}


function YAMLException$4(reason, mark) {
  // Super constructor
  Error.call(this);

  this.name = 'YAMLException';
  this.reason = reason;
  this.mark = mark;
  this.message = formatError(this, false);

  // Include stack trace in error object
  if (Error.captureStackTrace) {
    // Chrome and NodeJS
    Error.captureStackTrace(this, this.constructor);
  } else {
    // FF, IE 10+ and Safari 6+. Fallback for others
    this.stack = (new Error()).stack || '';
  }
}


// Inherit from Error
YAMLException$4.prototype = Object.create(Error.prototype);
YAMLException$4.prototype.constructor = YAMLException$4;


YAMLException$4.prototype.toString = function toString(compact) {
  return this.name + ': ' + formatError(this, compact);
};


var exception = YAMLException$4;

var common$4 = common$5;


// get snippet for a single line, respecting maxLength
function getLine(buffer, lineStart, lineEnd, position, maxLineLength) {
  var head = '';
  var tail = '';
  var maxHalfLength = Math.floor(maxLineLength / 2) - 1;

  if (position - lineStart > maxHalfLength) {
    head = ' ... ';
    lineStart = position - maxHalfLength + head.length;
  }

  if (lineEnd - position > maxHalfLength) {
    tail = ' ...';
    lineEnd = position + maxHalfLength - tail.length;
  }

  return {
    str: head + buffer.slice(lineStart, lineEnd).replace(/\t/g, '→') + tail,
    pos: position - lineStart + head.length // relative position
  };
}


function padStart(string, max) {
  return common$4.repeat(' ', max - string.length) + string;
}


function makeSnippet$1(mark, options) {
  options = Object.create(options || null);

  if (!mark.buffer) return null;

  if (!options.maxLength) options.maxLength = 79;
  if (typeof options.indent      !== 'number') options.indent      = 1;
  if (typeof options.linesBefore !== 'number') options.linesBefore = 3;
  if (typeof options.linesAfter  !== 'number') options.linesAfter  = 2;

  var re = /\r?\n|\r|\0/g;
  var lineStarts = [ 0 ];
  var lineEnds = [];
  var match;
  var foundLineNo = -1;

  while ((match = re.exec(mark.buffer))) {
    lineEnds.push(match.index);
    lineStarts.push(match.index + match[0].length);

    if (mark.position <= match.index && foundLineNo < 0) {
      foundLineNo = lineStarts.length - 2;
    }
  }

  if (foundLineNo < 0) foundLineNo = lineStarts.length - 1;

  var result = '', i, line;
  var lineNoLength = Math.min(mark.line + options.linesAfter, lineEnds.length).toString().length;
  var maxLineLength = options.maxLength - (options.indent + lineNoLength + 3);

  for (i = 1; i <= options.linesBefore; i++) {
    if (foundLineNo - i < 0) break;
    line = getLine(
      mark.buffer,
      lineStarts[foundLineNo - i],
      lineEnds[foundLineNo - i],
      mark.position - (lineStarts[foundLineNo] - lineStarts[foundLineNo - i]),
      maxLineLength
    );
    result = common$4.repeat(' ', options.indent) + padStart((mark.line - i + 1).toString(), lineNoLength) +
      ' | ' + line.str + '\n' + result;
  }

  line = getLine(mark.buffer, lineStarts[foundLineNo], lineEnds[foundLineNo], mark.position, maxLineLength);
  result += common$4.repeat(' ', options.indent) + padStart((mark.line + 1).toString(), lineNoLength) +
    ' | ' + line.str + '\n';
  result += common$4.repeat('-', options.indent + lineNoLength + 3 + line.pos) + '^' + '\n';

  for (i = 1; i <= options.linesAfter; i++) {
    if (foundLineNo + i >= lineEnds.length) break;
    line = getLine(
      mark.buffer,
      lineStarts[foundLineNo + i],
      lineEnds[foundLineNo + i],
      mark.position - (lineStarts[foundLineNo] - lineStarts[foundLineNo + i]),
      maxLineLength
    );
    result += common$4.repeat(' ', options.indent) + padStart((mark.line + i + 1).toString(), lineNoLength) +
      ' | ' + line.str + '\n';
  }

  return result.replace(/\n$/, '');
}


var snippet = makeSnippet$1;

var YAMLException$3 = exception;

var TYPE_CONSTRUCTOR_OPTIONS = [
  'kind',
  'multi',
  'resolve',
  'construct',
  'instanceOf',
  'predicate',
  'represent',
  'representName',
  'defaultStyle',
  'styleAliases'
];

var YAML_NODE_KINDS = [
  'scalar',
  'sequence',
  'mapping'
];

function compileStyleAliases(map) {
  var result = {};

  if (map !== null) {
    Object.keys(map).forEach(function (style) {
      map[style].forEach(function (alias) {
        result[String(alias)] = style;
      });
    });
  }

  return result;
}

function Type$e(tag, options) {
  options = options || {};

  Object.keys(options).forEach(function (name) {
    if (TYPE_CONSTRUCTOR_OPTIONS.indexOf(name) === -1) {
      throw new YAMLException$3('Unknown option "' + name + '" is met in definition of "' + tag + '" YAML type.');
    }
  });

  // TODO: Add tag format check.
  this.options       = options; // keep original options in case user wants to extend this type later
  this.tag           = tag;
  this.kind          = options['kind']          || null;
  this.resolve       = options['resolve']       || function () { return true; };
  this.construct     = options['construct']     || function (data) { return data; };
  this.instanceOf    = options['instanceOf']    || null;
  this.predicate     = options['predicate']     || null;
  this.represent     = options['represent']     || null;
  this.representName = options['representName'] || null;
  this.defaultStyle  = options['defaultStyle']  || null;
  this.multi         = options['multi']         || false;
  this.styleAliases  = compileStyleAliases(options['styleAliases'] || null);

  if (YAML_NODE_KINDS.indexOf(this.kind) === -1) {
    throw new YAMLException$3('Unknown kind "' + this.kind + '" is specified for "' + tag + '" YAML type.');
  }
}

var type = Type$e;

/*eslint-disable max-len*/

var YAMLException$2 = exception;
var Type$d          = type;


function compileList(schema, name) {
  var result = [];

  schema[name].forEach(function (currentType) {
    var newIndex = result.length;

    result.forEach(function (previousType, previousIndex) {
      if (previousType.tag === currentType.tag &&
          previousType.kind === currentType.kind &&
          previousType.multi === currentType.multi) {

        newIndex = previousIndex;
      }
    });

    result[newIndex] = currentType;
  });

  return result;
}


function compileMap(/* lists... */) {
  var result = {
        scalar: {},
        sequence: {},
        mapping: {},
        fallback: {},
        multi: {
          scalar: [],
          sequence: [],
          mapping: [],
          fallback: []
        }
      }, index, length;

  function collectType(type) {
    if (type.multi) {
      result.multi[type.kind].push(type);
      result.multi['fallback'].push(type);
    } else {
      result[type.kind][type.tag] = result['fallback'][type.tag] = type;
    }
  }

  for (index = 0, length = arguments.length; index < length; index += 1) {
    arguments[index].forEach(collectType);
  }
  return result;
}


function Schema$1(definition) {
  return this.extend(definition);
}


Schema$1.prototype.extend = function extend(definition) {
  var implicit = [];
  var explicit = [];

  if (definition instanceof Type$d) {
    // Schema.extend(type)
    explicit.push(definition);

  } else if (Array.isArray(definition)) {
    // Schema.extend([ type1, type2, ... ])
    explicit = explicit.concat(definition);

  } else if (definition && (Array.isArray(definition.implicit) || Array.isArray(definition.explicit))) {
    // Schema.extend({ explicit: [ type1, type2, ... ], implicit: [ type1, type2, ... ] })
    if (definition.implicit) implicit = implicit.concat(definition.implicit);
    if (definition.explicit) explicit = explicit.concat(definition.explicit);

  } else {
    throw new YAMLException$2('Schema.extend argument should be a Type, [ Type ], ' +
      'or a schema definition ({ implicit: [...], explicit: [...] })');
  }

  implicit.forEach(function (type) {
    if (!(type instanceof Type$d)) {
      throw new YAMLException$2('Specified list of YAML types (or a single Type object) contains a non-Type object.');
    }

    if (type.loadKind && type.loadKind !== 'scalar') {
      throw new YAMLException$2('There is a non-scalar type in the implicit list of a schema. Implicit resolving of such types is not supported.');
    }

    if (type.multi) {
      throw new YAMLException$2('There is a multi type in the implicit list of a schema. Multi tags can only be listed as explicit.');
    }
  });

  explicit.forEach(function (type) {
    if (!(type instanceof Type$d)) {
      throw new YAMLException$2('Specified list of YAML types (or a single Type object) contains a non-Type object.');
    }
  });

  var result = Object.create(Schema$1.prototype);

  result.implicit = (this.implicit || []).concat(implicit);
  result.explicit = (this.explicit || []).concat(explicit);

  result.compiledImplicit = compileList(result, 'implicit');
  result.compiledExplicit = compileList(result, 'explicit');
  result.compiledTypeMap  = compileMap(result.compiledImplicit, result.compiledExplicit);

  return result;
};


var schema = Schema$1;

var Type$c = type;

var str = new Type$c('tag:yaml.org,2002:str', {
  kind: 'scalar',
  construct: function (data) { return data !== null ? data : ''; }
});

var Type$b = type;

var seq = new Type$b('tag:yaml.org,2002:seq', {
  kind: 'sequence',
  construct: function (data) { return data !== null ? data : []; }
});

var Type$a = type;

var map = new Type$a('tag:yaml.org,2002:map', {
  kind: 'mapping',
  construct: function (data) { return data !== null ? data : {}; }
});

var Schema = schema;


var failsafe = new Schema({
  explicit: [
    str,
    seq,
    map
  ]
});

var Type$9 = type;

function resolveYamlNull(data) {
  if (data === null) return true;

  var max = data.length;

  return (max === 1 && data === '~') ||
         (max === 4 && (data === 'null' || data === 'Null' || data === 'NULL'));
}

function constructYamlNull() {
  return null;
}

function isNull(object) {
  return object === null;
}

var _null = new Type$9('tag:yaml.org,2002:null', {
  kind: 'scalar',
  resolve: resolveYamlNull,
  construct: constructYamlNull,
  predicate: isNull,
  represent: {
    canonical: function () { return '~';    },
    lowercase: function () { return 'null'; },
    uppercase: function () { return 'NULL'; },
    camelcase: function () { return 'Null'; },
    empty:     function () { return '';     }
  },
  defaultStyle: 'lowercase'
});

var Type$8 = type;

function resolveYamlBoolean(data) {
  if (data === null) return false;

  var max = data.length;

  return (max === 4 && (data === 'true' || data === 'True' || data === 'TRUE')) ||
         (max === 5 && (data === 'false' || data === 'False' || data === 'FALSE'));
}

function constructYamlBoolean(data) {
  return data === 'true' ||
         data === 'True' ||
         data === 'TRUE';
}

function isBoolean(object) {
  return Object.prototype.toString.call(object) === '[object Boolean]';
}

var bool = new Type$8('tag:yaml.org,2002:bool', {
  kind: 'scalar',
  resolve: resolveYamlBoolean,
  construct: constructYamlBoolean,
  predicate: isBoolean,
  represent: {
    lowercase: function (object) { return object ? 'true' : 'false'; },
    uppercase: function (object) { return object ? 'TRUE' : 'FALSE'; },
    camelcase: function (object) { return object ? 'True' : 'False'; }
  },
  defaultStyle: 'lowercase'
});

var common$3 = common$5;
var Type$7   = type;

function isHexCode(c) {
  return ((0x30/* 0 */ <= c) && (c <= 0x39/* 9 */)) ||
         ((0x41/* A */ <= c) && (c <= 0x46/* F */)) ||
         ((0x61/* a */ <= c) && (c <= 0x66/* f */));
}

function isOctCode(c) {
  return ((0x30/* 0 */ <= c) && (c <= 0x37/* 7 */));
}

function isDecCode(c) {
  return ((0x30/* 0 */ <= c) && (c <= 0x39/* 9 */));
}

function resolveYamlInteger(data) {
  if (data === null) return false;

  var max = data.length,
      index = 0,
      hasDigits = false,
      ch;

  if (!max) return false;

  ch = data[index];

  // sign
  if (ch === '-' || ch === '+') {
    ch = data[++index];
  }

  if (ch === '0') {
    // 0
    if (index + 1 === max) return true;
    ch = data[++index];

    // base 2, base 8, base 16

    if (ch === 'b') {
      // base 2
      index++;

      for (; index < max; index++) {
        ch = data[index];
        if (ch === '_') continue;
        if (ch !== '0' && ch !== '1') return false;
        hasDigits = true;
      }
      return hasDigits && ch !== '_';
    }


    if (ch === 'x') {
      // base 16
      index++;

      for (; index < max; index++) {
        ch = data[index];
        if (ch === '_') continue;
        if (!isHexCode(data.charCodeAt(index))) return false;
        hasDigits = true;
      }
      return hasDigits && ch !== '_';
    }


    if (ch === 'o') {
      // base 8
      index++;

      for (; index < max; index++) {
        ch = data[index];
        if (ch === '_') continue;
        if (!isOctCode(data.charCodeAt(index))) return false;
        hasDigits = true;
      }
      return hasDigits && ch !== '_';
    }
  }

  // base 10 (except 0)

  // value should not start with `_`;
  if (ch === '_') return false;

  for (; index < max; index++) {
    ch = data[index];
    if (ch === '_') continue;
    if (!isDecCode(data.charCodeAt(index))) {
      return false;
    }
    hasDigits = true;
  }

  // Should have digits and should not end with `_`
  if (!hasDigits || ch === '_') return false;

  return true;
}

function constructYamlInteger(data) {
  var value = data, sign = 1, ch;

  if (value.indexOf('_') !== -1) {
    value = value.replace(/_/g, '');
  }

  ch = value[0];

  if (ch === '-' || ch === '+') {
    if (ch === '-') sign = -1;
    value = value.slice(1);
    ch = value[0];
  }

  if (value === '0') return 0;

  if (ch === '0') {
    if (value[1] === 'b') return sign * parseInt(value.slice(2), 2);
    if (value[1] === 'x') return sign * parseInt(value.slice(2), 16);
    if (value[1] === 'o') return sign * parseInt(value.slice(2), 8);
  }

  return sign * parseInt(value, 10);
}

function isInteger$1(object) {
  return (Object.prototype.toString.call(object)) === '[object Number]' &&
         (object % 1 === 0 && !common$3.isNegativeZero(object));
}

var int = new Type$7('tag:yaml.org,2002:int', {
  kind: 'scalar',
  resolve: resolveYamlInteger,
  construct: constructYamlInteger,
  predicate: isInteger$1,
  represent: {
    binary:      function (obj) { return obj >= 0 ? '0b' + obj.toString(2) : '-0b' + obj.toString(2).slice(1); },
    octal:       function (obj) { return obj >= 0 ? '0o'  + obj.toString(8) : '-0o'  + obj.toString(8).slice(1); },
    decimal:     function (obj) { return obj.toString(10); },
    /* eslint-disable max-len */
    hexadecimal: function (obj) { return obj >= 0 ? '0x' + obj.toString(16).toUpperCase() :  '-0x' + obj.toString(16).toUpperCase().slice(1); }
  },
  defaultStyle: 'decimal',
  styleAliases: {
    binary:      [ 2,  'bin' ],
    octal:       [ 8,  'oct' ],
    decimal:     [ 10, 'dec' ],
    hexadecimal: [ 16, 'hex' ]
  }
});

var common$2 = common$5;
var Type$6   = type;

var YAML_FLOAT_PATTERN = new RegExp(
  // 2.5e4, 2.5 and integers
  '^(?:[-+]?(?:[0-9][0-9_]*)(?:\\.[0-9_]*)?(?:[eE][-+]?[0-9]+)?' +
  // .2e4, .2
  // special case, seems not from spec
  '|\\.[0-9_]+(?:[eE][-+]?[0-9]+)?' +
  // .inf
  '|[-+]?\\.(?:inf|Inf|INF)' +
  // .nan
  '|\\.(?:nan|NaN|NAN))$');

function resolveYamlFloat(data) {
  if (data === null) return false;

  if (!YAML_FLOAT_PATTERN.test(data) ||
      // Quick hack to not allow integers end with `_`
      // Probably should update regexp & check speed
      data[data.length - 1] === '_') {
    return false;
  }

  return true;
}

function constructYamlFloat(data) {
  var value, sign;

  value  = data.replace(/_/g, '').toLowerCase();
  sign   = value[0] === '-' ? -1 : 1;

  if ('+-'.indexOf(value[0]) >= 0) {
    value = value.slice(1);
  }

  if (value === '.inf') {
    return (sign === 1) ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;

  } else if (value === '.nan') {
    return NaN;
  }
  return sign * parseFloat(value, 10);
}


var SCIENTIFIC_WITHOUT_DOT = /^[-+]?[0-9]+e/;

function representYamlFloat(object, style) {
  var res;

  if (isNaN(object)) {
    switch (style) {
      case 'lowercase': return '.nan';
      case 'uppercase': return '.NAN';
      case 'camelcase': return '.NaN';
    }
  } else if (Number.POSITIVE_INFINITY === object) {
    switch (style) {
      case 'lowercase': return '.inf';
      case 'uppercase': return '.INF';
      case 'camelcase': return '.Inf';
    }
  } else if (Number.NEGATIVE_INFINITY === object) {
    switch (style) {
      case 'lowercase': return '-.inf';
      case 'uppercase': return '-.INF';
      case 'camelcase': return '-.Inf';
    }
  } else if (common$2.isNegativeZero(object)) {
    return '-0.0';
  }

  res = object.toString(10);

  // JS stringifier can build scientific format without dots: 5e-100,
  // while YAML requres dot: 5.e-100. Fix it with simple hack

  return SCIENTIFIC_WITHOUT_DOT.test(res) ? res.replace('e', '.e') : res;
}

function isFloat$1(object) {
  return (Object.prototype.toString.call(object) === '[object Number]') &&
         (object % 1 !== 0 || common$2.isNegativeZero(object));
}

var float = new Type$6('tag:yaml.org,2002:float', {
  kind: 'scalar',
  resolve: resolveYamlFloat,
  construct: constructYamlFloat,
  predicate: isFloat$1,
  represent: representYamlFloat,
  defaultStyle: 'lowercase'
});

var json = failsafe.extend({
  implicit: [
    _null,
    bool,
    int,
    float
  ]
});

var core = json;

var Type$5 = type;

var YAML_DATE_REGEXP = new RegExp(
  '^([0-9][0-9][0-9][0-9])'          + // [1] year
  '-([0-9][0-9])'                    + // [2] month
  '-([0-9][0-9])$');                   // [3] day

var YAML_TIMESTAMP_REGEXP = new RegExp(
  '^([0-9][0-9][0-9][0-9])'          + // [1] year
  '-([0-9][0-9]?)'                   + // [2] month
  '-([0-9][0-9]?)'                   + // [3] day
  '(?:[Tt]|[ \\t]+)'                 + // ...
  '([0-9][0-9]?)'                    + // [4] hour
  ':([0-9][0-9])'                    + // [5] minute
  ':([0-9][0-9])'                    + // [6] second
  '(?:\\.([0-9]*))?'                 + // [7] fraction
  '(?:[ \\t]*(Z|([-+])([0-9][0-9]?)' + // [8] tz [9] tz_sign [10] tz_hour
  '(?::([0-9][0-9]))?))?$');           // [11] tz_minute

function resolveYamlTimestamp(data) {
  if (data === null) return false;
  if (YAML_DATE_REGEXP.exec(data) !== null) return true;
  if (YAML_TIMESTAMP_REGEXP.exec(data) !== null) return true;
  return false;
}

function constructYamlTimestamp(data) {
  var match, year, month, day, hour, minute, second, fraction = 0,
      delta = null, tz_hour, tz_minute, date;

  match = YAML_DATE_REGEXP.exec(data);
  if (match === null) match = YAML_TIMESTAMP_REGEXP.exec(data);

  if (match === null) throw new Error('Date resolve error');

  // match: [1] year [2] month [3] day

  year = +(match[1]);
  month = +(match[2]) - 1; // JS month starts with 0
  day = +(match[3]);

  if (!match[4]) { // no hour
    return new Date(Date.UTC(year, month, day));
  }

  // match: [4] hour [5] minute [6] second [7] fraction

  hour = +(match[4]);
  minute = +(match[5]);
  second = +(match[6]);

  if (match[7]) {
    fraction = match[7].slice(0, 3);
    while (fraction.length < 3) { // milli-seconds
      fraction += '0';
    }
    fraction = +fraction;
  }

  // match: [8] tz [9] tz_sign [10] tz_hour [11] tz_minute

  if (match[9]) {
    tz_hour = +(match[10]);
    tz_minute = +(match[11] || 0);
    delta = (tz_hour * 60 + tz_minute) * 60000; // delta in mili-seconds
    if (match[9] === '-') delta = -delta;
  }

  date = new Date(Date.UTC(year, month, day, hour, minute, second, fraction));

  if (delta) date.setTime(date.getTime() - delta);

  return date;
}

function representYamlTimestamp(object /*, style*/) {
  return object.toISOString();
}

var timestamp = new Type$5('tag:yaml.org,2002:timestamp', {
  kind: 'scalar',
  resolve: resolveYamlTimestamp,
  construct: constructYamlTimestamp,
  instanceOf: Date,
  represent: representYamlTimestamp
});

var Type$4 = type;

function resolveYamlMerge(data) {
  return data === '<<' || data === null;
}

var merge = new Type$4('tag:yaml.org,2002:merge', {
  kind: 'scalar',
  resolve: resolveYamlMerge
});

/*eslint-disable no-bitwise*/


var Type$3 = type;


// [ 64, 65, 66 ] -> [ padding, CR, LF ]
var BASE64_MAP = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=\n\r';


function resolveYamlBinary(data) {
  if (data === null) return false;

  var code, idx, bitlen = 0, max = data.length, map = BASE64_MAP;

  // Convert one by one.
  for (idx = 0; idx < max; idx++) {
    code = map.indexOf(data.charAt(idx));

    // Skip CR/LF
    if (code > 64) continue;

    // Fail on illegal characters
    if (code < 0) return false;

    bitlen += 6;
  }

  // If there are any bits left, source was corrupted
  return (bitlen % 8) === 0;
}

function constructYamlBinary(data) {
  var idx, tailbits,
      input = data.replace(/[\r\n=]/g, ''), // remove CR/LF & padding to simplify scan
      max = input.length,
      map = BASE64_MAP,
      bits = 0,
      result = [];

  // Collect by 6*4 bits (3 bytes)

  for (idx = 0; idx < max; idx++) {
    if ((idx % 4 === 0) && idx) {
      result.push((bits >> 16) & 0xFF);
      result.push((bits >> 8) & 0xFF);
      result.push(bits & 0xFF);
    }

    bits = (bits << 6) | map.indexOf(input.charAt(idx));
  }

  // Dump tail

  tailbits = (max % 4) * 6;

  if (tailbits === 0) {
    result.push((bits >> 16) & 0xFF);
    result.push((bits >> 8) & 0xFF);
    result.push(bits & 0xFF);
  } else if (tailbits === 18) {
    result.push((bits >> 10) & 0xFF);
    result.push((bits >> 2) & 0xFF);
  } else if (tailbits === 12) {
    result.push((bits >> 4) & 0xFF);
  }

  return new Uint8Array(result);
}

function representYamlBinary(object /*, style*/) {
  var result = '', bits = 0, idx, tail,
      max = object.length,
      map = BASE64_MAP;

  // Convert every three bytes to 4 ASCII characters.

  for (idx = 0; idx < max; idx++) {
    if ((idx % 3 === 0) && idx) {
      result += map[(bits >> 18) & 0x3F];
      result += map[(bits >> 12) & 0x3F];
      result += map[(bits >> 6) & 0x3F];
      result += map[bits & 0x3F];
    }

    bits = (bits << 8) + object[idx];
  }

  // Dump tail

  tail = max % 3;

  if (tail === 0) {
    result += map[(bits >> 18) & 0x3F];
    result += map[(bits >> 12) & 0x3F];
    result += map[(bits >> 6) & 0x3F];
    result += map[bits & 0x3F];
  } else if (tail === 2) {
    result += map[(bits >> 10) & 0x3F];
    result += map[(bits >> 4) & 0x3F];
    result += map[(bits << 2) & 0x3F];
    result += map[64];
  } else if (tail === 1) {
    result += map[(bits >> 2) & 0x3F];
    result += map[(bits << 4) & 0x3F];
    result += map[64];
    result += map[64];
  }

  return result;
}

function isBinary(obj) {
  return Object.prototype.toString.call(obj) ===  '[object Uint8Array]';
}

var binary = new Type$3('tag:yaml.org,2002:binary', {
  kind: 'scalar',
  resolve: resolveYamlBinary,
  construct: constructYamlBinary,
  predicate: isBinary,
  represent: representYamlBinary
});

var Type$2 = type;

var _hasOwnProperty$3 = Object.prototype.hasOwnProperty;
var _toString$2       = Object.prototype.toString;

function resolveYamlOmap(data) {
  if (data === null) return true;

  var objectKeys = [], index, length, pair, pairKey, pairHasKey,
      object = data;

  for (index = 0, length = object.length; index < length; index += 1) {
    pair = object[index];
    pairHasKey = false;

    if (_toString$2.call(pair) !== '[object Object]') return false;

    for (pairKey in pair) {
      if (_hasOwnProperty$3.call(pair, pairKey)) {
        if (!pairHasKey) pairHasKey = true;
        else return false;
      }
    }

    if (!pairHasKey) return false;

    if (objectKeys.indexOf(pairKey) === -1) objectKeys.push(pairKey);
    else return false;
  }

  return true;
}

function constructYamlOmap(data) {
  return data !== null ? data : [];
}

var omap = new Type$2('tag:yaml.org,2002:omap', {
  kind: 'sequence',
  resolve: resolveYamlOmap,
  construct: constructYamlOmap
});

var Type$1 = type;

var _toString$1 = Object.prototype.toString;

function resolveYamlPairs(data) {
  if (data === null) return true;

  var index, length, pair, keys, result,
      object = data;

  result = new Array(object.length);

  for (index = 0, length = object.length; index < length; index += 1) {
    pair = object[index];

    if (_toString$1.call(pair) !== '[object Object]') return false;

    keys = Object.keys(pair);

    if (keys.length !== 1) return false;

    result[index] = [ keys[0], pair[keys[0]] ];
  }

  return true;
}

function constructYamlPairs(data) {
  if (data === null) return [];

  var index, length, pair, keys, result,
      object = data;

  result = new Array(object.length);

  for (index = 0, length = object.length; index < length; index += 1) {
    pair = object[index];

    keys = Object.keys(pair);

    result[index] = [ keys[0], pair[keys[0]] ];
  }

  return result;
}

var pairs = new Type$1('tag:yaml.org,2002:pairs', {
  kind: 'sequence',
  resolve: resolveYamlPairs,
  construct: constructYamlPairs
});

var Type = type;

var _hasOwnProperty$2 = Object.prototype.hasOwnProperty;

function resolveYamlSet(data) {
  if (data === null) return true;

  var key, object = data;

  for (key in object) {
    if (_hasOwnProperty$2.call(object, key)) {
      if (object[key] !== null) return false;
    }
  }

  return true;
}

function constructYamlSet(data) {
  return data !== null ? data : {};
}

var set$1 = new Type('tag:yaml.org,2002:set', {
  kind: 'mapping',
  resolve: resolveYamlSet,
  construct: constructYamlSet
});

var _default = core.extend({
  implicit: [
    timestamp,
    merge
  ],
  explicit: [
    binary,
    omap,
    pairs,
    set$1
  ]
});

/*eslint-disable max-len,no-use-before-define*/

var common$1              = common$5;
var YAMLException$1       = exception;
var makeSnippet         = snippet;
var DEFAULT_SCHEMA$1      = _default;


var _hasOwnProperty$1 = Object.prototype.hasOwnProperty;


var CONTEXT_FLOW_IN   = 1;
var CONTEXT_FLOW_OUT  = 2;
var CONTEXT_BLOCK_IN  = 3;
var CONTEXT_BLOCK_OUT = 4;


var CHOMPING_CLIP  = 1;
var CHOMPING_STRIP = 2;
var CHOMPING_KEEP  = 3;


var PATTERN_NON_PRINTABLE         = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/;
var PATTERN_NON_ASCII_LINE_BREAKS = /[\x85\u2028\u2029]/;
var PATTERN_FLOW_INDICATORS       = /[,\[\]\{\}]/;
var PATTERN_TAG_HANDLE            = /^(?:!|!!|![a-z\-]+!)$/i;
var PATTERN_TAG_URI               = /^(?:!|[^,\[\]\{\}])(?:%[0-9a-f]{2}|[0-9a-z\-#;\/\?:@&=\+\$,_\.!~\*'\(\)\[\]])*$/i;


function _class(obj) { return Object.prototype.toString.call(obj); }

function is_EOL(c) {
  return (c === 0x0A/* LF */) || (c === 0x0D/* CR */);
}

function is_WHITE_SPACE(c) {
  return (c === 0x09/* Tab */) || (c === 0x20/* Space */);
}

function is_WS_OR_EOL(c) {
  return (c === 0x09/* Tab */) ||
         (c === 0x20/* Space */) ||
         (c === 0x0A/* LF */) ||
         (c === 0x0D/* CR */);
}

function is_FLOW_INDICATOR(c) {
  return c === 0x2C/* , */ ||
         c === 0x5B/* [ */ ||
         c === 0x5D/* ] */ ||
         c === 0x7B/* { */ ||
         c === 0x7D/* } */;
}

function fromHexCode(c) {
  var lc;

  if ((0x30/* 0 */ <= c) && (c <= 0x39/* 9 */)) {
    return c - 0x30;
  }

  /*eslint-disable no-bitwise*/
  lc = c | 0x20;

  if ((0x61/* a */ <= lc) && (lc <= 0x66/* f */)) {
    return lc - 0x61 + 10;
  }

  return -1;
}

function escapedHexLen(c) {
  if (c === 0x78/* x */) { return 2; }
  if (c === 0x75/* u */) { return 4; }
  if (c === 0x55/* U */) { return 8; }
  return 0;
}

function fromDecimalCode(c) {
  if ((0x30/* 0 */ <= c) && (c <= 0x39/* 9 */)) {
    return c - 0x30;
  }

  return -1;
}

function simpleEscapeSequence(c) {
  /* eslint-disable indent */
  return (c === 0x30/* 0 */) ? '\x00' :
        (c === 0x61/* a */) ? '\x07' :
        (c === 0x62/* b */) ? '\x08' :
        (c === 0x74/* t */) ? '\x09' :
        (c === 0x09/* Tab */) ? '\x09' :
        (c === 0x6E/* n */) ? '\x0A' :
        (c === 0x76/* v */) ? '\x0B' :
        (c === 0x66/* f */) ? '\x0C' :
        (c === 0x72/* r */) ? '\x0D' :
        (c === 0x65/* e */) ? '\x1B' :
        (c === 0x20/* Space */) ? ' ' :
        (c === 0x22/* " */) ? '\x22' :
        (c === 0x2F/* / */) ? '/' :
        (c === 0x5C/* \ */) ? '\x5C' :
        (c === 0x4E/* N */) ? '\x85' :
        (c === 0x5F/* _ */) ? '\xA0' :
        (c === 0x4C/* L */) ? '\u2028' :
        (c === 0x50/* P */) ? '\u2029' : '';
}

function charFromCodepoint(c) {
  if (c <= 0xFFFF) {
    return String.fromCharCode(c);
  }
  // Encode UTF-16 surrogate pair
  // https://en.wikipedia.org/wiki/UTF-16#Code_points_U.2B010000_to_U.2B10FFFF
  return String.fromCharCode(
    ((c - 0x010000) >> 10) + 0xD800,
    ((c - 0x010000) & 0x03FF) + 0xDC00
  );
}

var simpleEscapeCheck = new Array(256); // integer, for fast access
var simpleEscapeMap = new Array(256);
for (var i = 0; i < 256; i++) {
  simpleEscapeCheck[i] = simpleEscapeSequence(i) ? 1 : 0;
  simpleEscapeMap[i] = simpleEscapeSequence(i);
}


function State$2(input, options) {
  this.input = input;

  this.filename  = options['filename']  || null;
  this.schema    = options['schema']    || DEFAULT_SCHEMA$1;
  this.onWarning = options['onWarning'] || null;
  // (Hidden) Remove? makes the loader to expect YAML 1.1 documents
  // if such documents have no explicit %YAML directive
  this.legacy    = options['legacy']    || false;

  this.json      = options['json']      || false;
  this.listener  = options['listener']  || null;

  this.implicitTypes = this.schema.compiledImplicit;
  this.typeMap       = this.schema.compiledTypeMap;

  this.length     = input.length;
  this.position   = 0;
  this.line       = 0;
  this.lineStart  = 0;
  this.lineIndent = 0;

  // position of first leading tab in the current line,
  // used to make sure there are no tabs in the indentation
  this.firstTabInLine = -1;

  this.documents = [];

  /*
  this.version;
  this.checkLineBreaks;
  this.tagMap;
  this.anchorMap;
  this.tag;
  this.anchor;
  this.kind;
  this.result;*/

}


function generateError(state, message) {
  var mark = {
    name:     state.filename,
    buffer:   state.input.slice(0, -1), // omit trailing \0
    position: state.position,
    line:     state.line,
    column:   state.position - state.lineStart
  };

  mark.snippet = makeSnippet(mark);

  return new YAMLException$1(message, mark);
}

function throwError(state, message) {
  throw generateError(state, message);
}

function throwWarning(state, message) {
  if (state.onWarning) {
    state.onWarning.call(null, generateError(state, message));
  }
}


var directiveHandlers = {

  YAML: function handleYamlDirective(state, name, args) {

    var match, major, minor;

    if (state.version !== null) {
      throwError(state, 'duplication of %YAML directive');
    }

    if (args.length !== 1) {
      throwError(state, 'YAML directive accepts exactly one argument');
    }

    match = /^([0-9]+)\.([0-9]+)$/.exec(args[0]);

    if (match === null) {
      throwError(state, 'ill-formed argument of the YAML directive');
    }

    major = parseInt(match[1], 10);
    minor = parseInt(match[2], 10);

    if (major !== 1) {
      throwError(state, 'unacceptable YAML version of the document');
    }

    state.version = args[0];
    state.checkLineBreaks = (minor < 2);

    if (minor !== 1 && minor !== 2) {
      throwWarning(state, 'unsupported YAML version of the document');
    }
  },

  TAG: function handleTagDirective(state, name, args) {

    var handle, prefix;

    if (args.length !== 2) {
      throwError(state, 'TAG directive accepts exactly two arguments');
    }

    handle = args[0];
    prefix = args[1];

    if (!PATTERN_TAG_HANDLE.test(handle)) {
      throwError(state, 'ill-formed tag handle (first argument) of the TAG directive');
    }

    if (_hasOwnProperty$1.call(state.tagMap, handle)) {
      throwError(state, 'there is a previously declared suffix for "' + handle + '" tag handle');
    }

    if (!PATTERN_TAG_URI.test(prefix)) {
      throwError(state, 'ill-formed tag prefix (second argument) of the TAG directive');
    }

    try {
      prefix = decodeURIComponent(prefix);
    } catch (err) {
      throwError(state, 'tag prefix is malformed: ' + prefix);
    }

    state.tagMap[handle] = prefix;
  }
};


function captureSegment(state, start, end, checkJson) {
  var _position, _length, _character, _result;

  if (start < end) {
    _result = state.input.slice(start, end);

    if (checkJson) {
      for (_position = 0, _length = _result.length; _position < _length; _position += 1) {
        _character = _result.charCodeAt(_position);
        if (!(_character === 0x09 ||
              (0x20 <= _character && _character <= 0x10FFFF))) {
          throwError(state, 'expected valid JSON character');
        }
      }
    } else if (PATTERN_NON_PRINTABLE.test(_result)) {
      throwError(state, 'the stream contains non-printable characters');
    }

    state.result += _result;
  }
}

function mergeMappings(state, destination, source, overridableKeys) {
  var sourceKeys, key, index, quantity;

  if (!common$1.isObject(source)) {
    throwError(state, 'cannot merge mappings; the provided source object is unacceptable');
  }

  sourceKeys = Object.keys(source);

  for (index = 0, quantity = sourceKeys.length; index < quantity; index += 1) {
    key = sourceKeys[index];

    if (!_hasOwnProperty$1.call(destination, key)) {
      destination[key] = source[key];
      overridableKeys[key] = true;
    }
  }
}

function storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode,
  startLine, startLineStart, startPos) {

  var index, quantity;

  // The output is a plain object here, so keys can only be strings.
  // We need to convert keyNode to a string, but doing so can hang the process
  // (deeply nested arrays that explode exponentially using aliases).
  if (Array.isArray(keyNode)) {
    keyNode = Array.prototype.slice.call(keyNode);

    for (index = 0, quantity = keyNode.length; index < quantity; index += 1) {
      if (Array.isArray(keyNode[index])) {
        throwError(state, 'nested arrays are not supported inside keys');
      }

      if (typeof keyNode === 'object' && _class(keyNode[index]) === '[object Object]') {
        keyNode[index] = '[object Object]';
      }
    }
  }

  // Avoid code execution in load() via toString property
  // (still use its own toString for arrays, timestamps,
  // and whatever user schema extensions happen to have @@toStringTag)
  if (typeof keyNode === 'object' && _class(keyNode) === '[object Object]') {
    keyNode = '[object Object]';
  }


  keyNode = String(keyNode);

  if (_result === null) {
    _result = {};
  }

  if (keyTag === 'tag:yaml.org,2002:merge') {
    if (Array.isArray(valueNode)) {
      for (index = 0, quantity = valueNode.length; index < quantity; index += 1) {
        mergeMappings(state, _result, valueNode[index], overridableKeys);
      }
    } else {
      mergeMappings(state, _result, valueNode, overridableKeys);
    }
  } else {
    if (!state.json &&
        !_hasOwnProperty$1.call(overridableKeys, keyNode) &&
        _hasOwnProperty$1.call(_result, keyNode)) {
      state.line = startLine || state.line;
      state.lineStart = startLineStart || state.lineStart;
      state.position = startPos || state.position;
      throwError(state, 'duplicated mapping key');
    }

    // used for this specific key only because Object.defineProperty is slow
    if (keyNode === '__proto__') {
      Object.defineProperty(_result, keyNode, {
        configurable: true,
        enumerable: true,
        writable: true,
        value: valueNode
      });
    } else {
      _result[keyNode] = valueNode;
    }
    delete overridableKeys[keyNode];
  }

  return _result;
}

function readLineBreak(state) {
  var ch;

  ch = state.input.charCodeAt(state.position);

  if (ch === 0x0A/* LF */) {
    state.position++;
  } else if (ch === 0x0D/* CR */) {
    state.position++;
    if (state.input.charCodeAt(state.position) === 0x0A/* LF */) {
      state.position++;
    }
  } else {
    throwError(state, 'a line break is expected');
  }

  state.line += 1;
  state.lineStart = state.position;
  state.firstTabInLine = -1;
}

function skipSeparationSpace(state, allowComments, checkIndent) {
  var lineBreaks = 0,
      ch = state.input.charCodeAt(state.position);

  while (ch !== 0) {
    while (is_WHITE_SPACE(ch)) {
      if (ch === 0x09/* Tab */ && state.firstTabInLine === -1) {
        state.firstTabInLine = state.position;
      }
      ch = state.input.charCodeAt(++state.position);
    }

    if (allowComments && ch === 0x23/* # */) {
      do {
        ch = state.input.charCodeAt(++state.position);
      } while (ch !== 0x0A/* LF */ && ch !== 0x0D/* CR */ && ch !== 0);
    }

    if (is_EOL(ch)) {
      readLineBreak(state);

      ch = state.input.charCodeAt(state.position);
      lineBreaks++;
      state.lineIndent = 0;

      while (ch === 0x20/* Space */) {
        state.lineIndent++;
        ch = state.input.charCodeAt(++state.position);
      }
    } else {
      break;
    }
  }

  if (checkIndent !== -1 && lineBreaks !== 0 && state.lineIndent < checkIndent) {
    throwWarning(state, 'deficient indentation');
  }

  return lineBreaks;
}

function testDocumentSeparator(state) {
  var _position = state.position,
      ch;

  ch = state.input.charCodeAt(_position);

  // Condition state.position === state.lineStart is tested
  // in parent on each call, for efficiency. No needs to test here again.
  if ((ch === 0x2D/* - */ || ch === 0x2E/* . */) &&
      ch === state.input.charCodeAt(_position + 1) &&
      ch === state.input.charCodeAt(_position + 2)) {

    _position += 3;

    ch = state.input.charCodeAt(_position);

    if (ch === 0 || is_WS_OR_EOL(ch)) {
      return true;
    }
  }

  return false;
}

function writeFoldedLines(state, count) {
  if (count === 1) {
    state.result += ' ';
  } else if (count > 1) {
    state.result += common$1.repeat('\n', count - 1);
  }
}


function readPlainScalar(state, nodeIndent, withinFlowCollection) {
  var preceding,
      following,
      captureStart,
      captureEnd,
      hasPendingContent,
      _line,
      _lineStart,
      _lineIndent,
      _kind = state.kind,
      _result = state.result,
      ch;

  ch = state.input.charCodeAt(state.position);

  if (is_WS_OR_EOL(ch)      ||
      is_FLOW_INDICATOR(ch) ||
      ch === 0x23/* # */    ||
      ch === 0x26/* & */    ||
      ch === 0x2A/* * */    ||
      ch === 0x21/* ! */    ||
      ch === 0x7C/* | */    ||
      ch === 0x3E/* > */    ||
      ch === 0x27/* ' */    ||
      ch === 0x22/* " */    ||
      ch === 0x25/* % */    ||
      ch === 0x40/* @ */    ||
      ch === 0x60/* ` */) {
    return false;
  }

  if (ch === 0x3F/* ? */ || ch === 0x2D/* - */) {
    following = state.input.charCodeAt(state.position + 1);

    if (is_WS_OR_EOL(following) ||
        withinFlowCollection && is_FLOW_INDICATOR(following)) {
      return false;
    }
  }

  state.kind = 'scalar';
  state.result = '';
  captureStart = captureEnd = state.position;
  hasPendingContent = false;

  while (ch !== 0) {
    if (ch === 0x3A/* : */) {
      following = state.input.charCodeAt(state.position + 1);

      if (is_WS_OR_EOL(following) ||
          withinFlowCollection && is_FLOW_INDICATOR(following)) {
        break;
      }

    } else if (ch === 0x23/* # */) {
      preceding = state.input.charCodeAt(state.position - 1);

      if (is_WS_OR_EOL(preceding)) {
        break;
      }

    } else if ((state.position === state.lineStart && testDocumentSeparator(state)) ||
               withinFlowCollection && is_FLOW_INDICATOR(ch)) {
      break;

    } else if (is_EOL(ch)) {
      _line = state.line;
      _lineStart = state.lineStart;
      _lineIndent = state.lineIndent;
      skipSeparationSpace(state, false, -1);

      if (state.lineIndent >= nodeIndent) {
        hasPendingContent = true;
        ch = state.input.charCodeAt(state.position);
        continue;
      } else {
        state.position = captureEnd;
        state.line = _line;
        state.lineStart = _lineStart;
        state.lineIndent = _lineIndent;
        break;
      }
    }

    if (hasPendingContent) {
      captureSegment(state, captureStart, captureEnd, false);
      writeFoldedLines(state, state.line - _line);
      captureStart = captureEnd = state.position;
      hasPendingContent = false;
    }

    if (!is_WHITE_SPACE(ch)) {
      captureEnd = state.position + 1;
    }

    ch = state.input.charCodeAt(++state.position);
  }

  captureSegment(state, captureStart, captureEnd, false);

  if (state.result) {
    return true;
  }

  state.kind = _kind;
  state.result = _result;
  return false;
}

function readSingleQuotedScalar(state, nodeIndent) {
  var ch,
      captureStart, captureEnd;

  ch = state.input.charCodeAt(state.position);

  if (ch !== 0x27/* ' */) {
    return false;
  }

  state.kind = 'scalar';
  state.result = '';
  state.position++;
  captureStart = captureEnd = state.position;

  while ((ch = state.input.charCodeAt(state.position)) !== 0) {
    if (ch === 0x27/* ' */) {
      captureSegment(state, captureStart, state.position, true);
      ch = state.input.charCodeAt(++state.position);

      if (ch === 0x27/* ' */) {
        captureStart = state.position;
        state.position++;
        captureEnd = state.position;
      } else {
        return true;
      }

    } else if (is_EOL(ch)) {
      captureSegment(state, captureStart, captureEnd, true);
      writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
      captureStart = captureEnd = state.position;

    } else if (state.position === state.lineStart && testDocumentSeparator(state)) {
      throwError(state, 'unexpected end of the document within a single quoted scalar');

    } else {
      state.position++;
      captureEnd = state.position;
    }
  }

  throwError(state, 'unexpected end of the stream within a single quoted scalar');
}

function readDoubleQuotedScalar(state, nodeIndent) {
  var captureStart,
      captureEnd,
      hexLength,
      hexResult,
      tmp,
      ch;

  ch = state.input.charCodeAt(state.position);

  if (ch !== 0x22/* " */) {
    return false;
  }

  state.kind = 'scalar';
  state.result = '';
  state.position++;
  captureStart = captureEnd = state.position;

  while ((ch = state.input.charCodeAt(state.position)) !== 0) {
    if (ch === 0x22/* " */) {
      captureSegment(state, captureStart, state.position, true);
      state.position++;
      return true;

    } else if (ch === 0x5C/* \ */) {
      captureSegment(state, captureStart, state.position, true);
      ch = state.input.charCodeAt(++state.position);

      if (is_EOL(ch)) {
        skipSeparationSpace(state, false, nodeIndent);

        // TODO: rework to inline fn with no type cast?
      } else if (ch < 256 && simpleEscapeCheck[ch]) {
        state.result += simpleEscapeMap[ch];
        state.position++;

      } else if ((tmp = escapedHexLen(ch)) > 0) {
        hexLength = tmp;
        hexResult = 0;

        for (; hexLength > 0; hexLength--) {
          ch = state.input.charCodeAt(++state.position);

          if ((tmp = fromHexCode(ch)) >= 0) {
            hexResult = (hexResult << 4) + tmp;

          } else {
            throwError(state, 'expected hexadecimal character');
          }
        }

        state.result += charFromCodepoint(hexResult);

        state.position++;

      } else {
        throwError(state, 'unknown escape sequence');
      }

      captureStart = captureEnd = state.position;

    } else if (is_EOL(ch)) {
      captureSegment(state, captureStart, captureEnd, true);
      writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
      captureStart = captureEnd = state.position;

    } else if (state.position === state.lineStart && testDocumentSeparator(state)) {
      throwError(state, 'unexpected end of the document within a double quoted scalar');

    } else {
      state.position++;
      captureEnd = state.position;
    }
  }

  throwError(state, 'unexpected end of the stream within a double quoted scalar');
}

function readFlowCollection(state, nodeIndent) {
  var readNext = true,
      _line,
      _lineStart,
      _pos,
      _tag     = state.tag,
      _result,
      _anchor  = state.anchor,
      following,
      terminator,
      isPair,
      isExplicitPair,
      isMapping,
      overridableKeys = Object.create(null),
      keyNode,
      keyTag,
      valueNode,
      ch;

  ch = state.input.charCodeAt(state.position);

  if (ch === 0x5B/* [ */) {
    terminator = 0x5D;/* ] */
    isMapping = false;
    _result = [];
  } else if (ch === 0x7B/* { */) {
    terminator = 0x7D;/* } */
    isMapping = true;
    _result = {};
  } else {
    return false;
  }

  if (state.anchor !== null) {
    state.anchorMap[state.anchor] = _result;
  }

  ch = state.input.charCodeAt(++state.position);

  while (ch !== 0) {
    skipSeparationSpace(state, true, nodeIndent);

    ch = state.input.charCodeAt(state.position);

    if (ch === terminator) {
      state.position++;
      state.tag = _tag;
      state.anchor = _anchor;
      state.kind = isMapping ? 'mapping' : 'sequence';
      state.result = _result;
      return true;
    } else if (!readNext) {
      throwError(state, 'missed comma between flow collection entries');
    } else if (ch === 0x2C/* , */) {
      // "flow collection entries can never be completely empty", as per YAML 1.2, section 7.4
      throwError(state, "expected the node content, but found ','");
    }

    keyTag = keyNode = valueNode = null;
    isPair = isExplicitPair = false;

    if (ch === 0x3F/* ? */) {
      following = state.input.charCodeAt(state.position + 1);

      if (is_WS_OR_EOL(following)) {
        isPair = isExplicitPair = true;
        state.position++;
        skipSeparationSpace(state, true, nodeIndent);
      }
    }

    _line = state.line; // Save the current line.
    _lineStart = state.lineStart;
    _pos = state.position;
    composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
    keyTag = state.tag;
    keyNode = state.result;
    skipSeparationSpace(state, true, nodeIndent);

    ch = state.input.charCodeAt(state.position);

    if ((isExplicitPair || state.line === _line) && ch === 0x3A/* : */) {
      isPair = true;
      ch = state.input.charCodeAt(++state.position);
      skipSeparationSpace(state, true, nodeIndent);
      composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
      valueNode = state.result;
    }

    if (isMapping) {
      storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, _line, _lineStart, _pos);
    } else if (isPair) {
      _result.push(storeMappingPair(state, null, overridableKeys, keyTag, keyNode, valueNode, _line, _lineStart, _pos));
    } else {
      _result.push(keyNode);
    }

    skipSeparationSpace(state, true, nodeIndent);

    ch = state.input.charCodeAt(state.position);

    if (ch === 0x2C/* , */) {
      readNext = true;
      ch = state.input.charCodeAt(++state.position);
    } else {
      readNext = false;
    }
  }

  throwError(state, 'unexpected end of the stream within a flow collection');
}

function readBlockScalar(state, nodeIndent) {
  var captureStart,
      folding,
      chomping       = CHOMPING_CLIP,
      didReadContent = false,
      detectedIndent = false,
      textIndent     = nodeIndent,
      emptyLines     = 0,
      atMoreIndented = false,
      tmp,
      ch;

  ch = state.input.charCodeAt(state.position);

  if (ch === 0x7C/* | */) {
    folding = false;
  } else if (ch === 0x3E/* > */) {
    folding = true;
  } else {
    return false;
  }

  state.kind = 'scalar';
  state.result = '';

  while (ch !== 0) {
    ch = state.input.charCodeAt(++state.position);

    if (ch === 0x2B/* + */ || ch === 0x2D/* - */) {
      if (CHOMPING_CLIP === chomping) {
        chomping = (ch === 0x2B/* + */) ? CHOMPING_KEEP : CHOMPING_STRIP;
      } else {
        throwError(state, 'repeat of a chomping mode identifier');
      }

    } else if ((tmp = fromDecimalCode(ch)) >= 0) {
      if (tmp === 0) {
        throwError(state, 'bad explicit indentation width of a block scalar; it cannot be less than one');
      } else if (!detectedIndent) {
        textIndent = nodeIndent + tmp - 1;
        detectedIndent = true;
      } else {
        throwError(state, 'repeat of an indentation width identifier');
      }

    } else {
      break;
    }
  }

  if (is_WHITE_SPACE(ch)) {
    do { ch = state.input.charCodeAt(++state.position); }
    while (is_WHITE_SPACE(ch));

    if (ch === 0x23/* # */) {
      do { ch = state.input.charCodeAt(++state.position); }
      while (!is_EOL(ch) && (ch !== 0));
    }
  }

  while (ch !== 0) {
    readLineBreak(state);
    state.lineIndent = 0;

    ch = state.input.charCodeAt(state.position);

    while ((!detectedIndent || state.lineIndent < textIndent) &&
           (ch === 0x20/* Space */)) {
      state.lineIndent++;
      ch = state.input.charCodeAt(++state.position);
    }

    if (!detectedIndent && state.lineIndent > textIndent) {
      textIndent = state.lineIndent;
    }

    if (is_EOL(ch)) {
      emptyLines++;
      continue;
    }

    // End of the scalar.
    if (state.lineIndent < textIndent) {

      // Perform the chomping.
      if (chomping === CHOMPING_KEEP) {
        state.result += common$1.repeat('\n', didReadContent ? 1 + emptyLines : emptyLines);
      } else if (chomping === CHOMPING_CLIP) {
        if (didReadContent) { // i.e. only if the scalar is not empty.
          state.result += '\n';
        }
      }

      // Break this `while` cycle and go to the funciton's epilogue.
      break;
    }

    // Folded style: use fancy rules to handle line breaks.
    if (folding) {

      // Lines starting with white space characters (more-indented lines) are not folded.
      if (is_WHITE_SPACE(ch)) {
        atMoreIndented = true;
        // except for the first content line (cf. Example 8.1)
        state.result += common$1.repeat('\n', didReadContent ? 1 + emptyLines : emptyLines);

      // End of more-indented block.
      } else if (atMoreIndented) {
        atMoreIndented = false;
        state.result += common$1.repeat('\n', emptyLines + 1);

      // Just one line break - perceive as the same line.
      } else if (emptyLines === 0) {
        if (didReadContent) { // i.e. only if we have already read some scalar content.
          state.result += ' ';
        }

      // Several line breaks - perceive as different lines.
      } else {
        state.result += common$1.repeat('\n', emptyLines);
      }

    // Literal style: just add exact number of line breaks between content lines.
    } else {
      // Keep all line breaks except the header line break.
      state.result += common$1.repeat('\n', didReadContent ? 1 + emptyLines : emptyLines);
    }

    didReadContent = true;
    detectedIndent = true;
    emptyLines = 0;
    captureStart = state.position;

    while (!is_EOL(ch) && (ch !== 0)) {
      ch = state.input.charCodeAt(++state.position);
    }

    captureSegment(state, captureStart, state.position, false);
  }

  return true;
}

function readBlockSequence(state, nodeIndent) {
  var _line,
      _tag      = state.tag,
      _anchor   = state.anchor,
      _result   = [],
      following,
      detected  = false,
      ch;

  // there is a leading tab before this token, so it can't be a block sequence/mapping;
  // it can still be flow sequence/mapping or a scalar
  if (state.firstTabInLine !== -1) return false;

  if (state.anchor !== null) {
    state.anchorMap[state.anchor] = _result;
  }

  ch = state.input.charCodeAt(state.position);

  while (ch !== 0) {
    if (state.firstTabInLine !== -1) {
      state.position = state.firstTabInLine;
      throwError(state, 'tab characters must not be used in indentation');
    }

    if (ch !== 0x2D/* - */) {
      break;
    }

    following = state.input.charCodeAt(state.position + 1);

    if (!is_WS_OR_EOL(following)) {
      break;
    }

    detected = true;
    state.position++;

    if (skipSeparationSpace(state, true, -1)) {
      if (state.lineIndent <= nodeIndent) {
        _result.push(null);
        ch = state.input.charCodeAt(state.position);
        continue;
      }
    }

    _line = state.line;
    composeNode(state, nodeIndent, CONTEXT_BLOCK_IN, false, true);
    _result.push(state.result);
    skipSeparationSpace(state, true, -1);

    ch = state.input.charCodeAt(state.position);

    if ((state.line === _line || state.lineIndent > nodeIndent) && (ch !== 0)) {
      throwError(state, 'bad indentation of a sequence entry');
    } else if (state.lineIndent < nodeIndent) {
      break;
    }
  }

  if (detected) {
    state.tag = _tag;
    state.anchor = _anchor;
    state.kind = 'sequence';
    state.result = _result;
    return true;
  }
  return false;
}

function readBlockMapping(state, nodeIndent, flowIndent) {
  var following,
      allowCompact,
      _line,
      _keyLine,
      _keyLineStart,
      _keyPos,
      _tag          = state.tag,
      _anchor       = state.anchor,
      _result       = {},
      overridableKeys = Object.create(null),
      keyTag        = null,
      keyNode       = null,
      valueNode     = null,
      atExplicitKey = false,
      detected      = false,
      ch;

  // there is a leading tab before this token, so it can't be a block sequence/mapping;
  // it can still be flow sequence/mapping or a scalar
  if (state.firstTabInLine !== -1) return false;

  if (state.anchor !== null) {
    state.anchorMap[state.anchor] = _result;
  }

  ch = state.input.charCodeAt(state.position);

  while (ch !== 0) {
    if (!atExplicitKey && state.firstTabInLine !== -1) {
      state.position = state.firstTabInLine;
      throwError(state, 'tab characters must not be used in indentation');
    }

    following = state.input.charCodeAt(state.position + 1);
    _line = state.line; // Save the current line.

    //
    // Explicit notation case. There are two separate blocks:
    // first for the key (denoted by "?") and second for the value (denoted by ":")
    //
    if ((ch === 0x3F/* ? */ || ch === 0x3A/* : */) && is_WS_OR_EOL(following)) {

      if (ch === 0x3F/* ? */) {
        if (atExplicitKey) {
          storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
          keyTag = keyNode = valueNode = null;
        }

        detected = true;
        atExplicitKey = true;
        allowCompact = true;

      } else if (atExplicitKey) {
        // i.e. 0x3A/* : */ === character after the explicit key.
        atExplicitKey = false;
        allowCompact = true;

      } else {
        throwError(state, 'incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line');
      }

      state.position += 1;
      ch = following;

    //
    // Implicit notation case. Flow-style node as the key first, then ":", and the value.
    //
    } else {
      _keyLine = state.line;
      _keyLineStart = state.lineStart;
      _keyPos = state.position;

      if (!composeNode(state, flowIndent, CONTEXT_FLOW_OUT, false, true)) {
        // Neither implicit nor explicit notation.
        // Reading is done. Go to the epilogue.
        break;
      }

      if (state.line === _line) {
        ch = state.input.charCodeAt(state.position);

        while (is_WHITE_SPACE(ch)) {
          ch = state.input.charCodeAt(++state.position);
        }

        if (ch === 0x3A/* : */) {
          ch = state.input.charCodeAt(++state.position);

          if (!is_WS_OR_EOL(ch)) {
            throwError(state, 'a whitespace character is expected after the key-value separator within a block mapping');
          }

          if (atExplicitKey) {
            storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
            keyTag = keyNode = valueNode = null;
          }

          detected = true;
          atExplicitKey = false;
          allowCompact = false;
          keyTag = state.tag;
          keyNode = state.result;

        } else if (detected) {
          throwError(state, 'can not read an implicit mapping pair; a colon is missed');

        } else {
          state.tag = _tag;
          state.anchor = _anchor;
          return true; // Keep the result of `composeNode`.
        }

      } else if (detected) {
        throwError(state, 'can not read a block mapping entry; a multiline key may not be an implicit key');

      } else {
        state.tag = _tag;
        state.anchor = _anchor;
        return true; // Keep the result of `composeNode`.
      }
    }

    //
    // Common reading code for both explicit and implicit notations.
    //
    if (state.line === _line || state.lineIndent > nodeIndent) {
      if (atExplicitKey) {
        _keyLine = state.line;
        _keyLineStart = state.lineStart;
        _keyPos = state.position;
      }

      if (composeNode(state, nodeIndent, CONTEXT_BLOCK_OUT, true, allowCompact)) {
        if (atExplicitKey) {
          keyNode = state.result;
        } else {
          valueNode = state.result;
        }
      }

      if (!atExplicitKey) {
        storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, _keyLine, _keyLineStart, _keyPos);
        keyTag = keyNode = valueNode = null;
      }

      skipSeparationSpace(state, true, -1);
      ch = state.input.charCodeAt(state.position);
    }

    if ((state.line === _line || state.lineIndent > nodeIndent) && (ch !== 0)) {
      throwError(state, 'bad indentation of a mapping entry');
    } else if (state.lineIndent < nodeIndent) {
      break;
    }
  }

  //
  // Epilogue.
  //

  // Special case: last mapping's node contains only the key in explicit notation.
  if (atExplicitKey) {
    storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
  }

  // Expose the resulting mapping.
  if (detected) {
    state.tag = _tag;
    state.anchor = _anchor;
    state.kind = 'mapping';
    state.result = _result;
  }

  return detected;
}

function readTagProperty(state) {
  var _position,
      isVerbatim = false,
      isNamed    = false,
      tagHandle,
      tagName,
      ch;

  ch = state.input.charCodeAt(state.position);

  if (ch !== 0x21/* ! */) return false;

  if (state.tag !== null) {
    throwError(state, 'duplication of a tag property');
  }

  ch = state.input.charCodeAt(++state.position);

  if (ch === 0x3C/* < */) {
    isVerbatim = true;
    ch = state.input.charCodeAt(++state.position);

  } else if (ch === 0x21/* ! */) {
    isNamed = true;
    tagHandle = '!!';
    ch = state.input.charCodeAt(++state.position);

  } else {
    tagHandle = '!';
  }

  _position = state.position;

  if (isVerbatim) {
    do { ch = state.input.charCodeAt(++state.position); }
    while (ch !== 0 && ch !== 0x3E/* > */);

    if (state.position < state.length) {
      tagName = state.input.slice(_position, state.position);
      ch = state.input.charCodeAt(++state.position);
    } else {
      throwError(state, 'unexpected end of the stream within a verbatim tag');
    }
  } else {
    while (ch !== 0 && !is_WS_OR_EOL(ch)) {

      if (ch === 0x21/* ! */) {
        if (!isNamed) {
          tagHandle = state.input.slice(_position - 1, state.position + 1);

          if (!PATTERN_TAG_HANDLE.test(tagHandle)) {
            throwError(state, 'named tag handle cannot contain such characters');
          }

          isNamed = true;
          _position = state.position + 1;
        } else {
          throwError(state, 'tag suffix cannot contain exclamation marks');
        }
      }

      ch = state.input.charCodeAt(++state.position);
    }

    tagName = state.input.slice(_position, state.position);

    if (PATTERN_FLOW_INDICATORS.test(tagName)) {
      throwError(state, 'tag suffix cannot contain flow indicator characters');
    }
  }

  if (tagName && !PATTERN_TAG_URI.test(tagName)) {
    throwError(state, 'tag name cannot contain such characters: ' + tagName);
  }

  try {
    tagName = decodeURIComponent(tagName);
  } catch (err) {
    throwError(state, 'tag name is malformed: ' + tagName);
  }

  if (isVerbatim) {
    state.tag = tagName;

  } else if (_hasOwnProperty$1.call(state.tagMap, tagHandle)) {
    state.tag = state.tagMap[tagHandle] + tagName;

  } else if (tagHandle === '!') {
    state.tag = '!' + tagName;

  } else if (tagHandle === '!!') {
    state.tag = 'tag:yaml.org,2002:' + tagName;

  } else {
    throwError(state, 'undeclared tag handle "' + tagHandle + '"');
  }

  return true;
}

function readAnchorProperty(state) {
  var _position,
      ch;

  ch = state.input.charCodeAt(state.position);

  if (ch !== 0x26/* & */) return false;

  if (state.anchor !== null) {
    throwError(state, 'duplication of an anchor property');
  }

  ch = state.input.charCodeAt(++state.position);
  _position = state.position;

  while (ch !== 0 && !is_WS_OR_EOL(ch) && !is_FLOW_INDICATOR(ch)) {
    ch = state.input.charCodeAt(++state.position);
  }

  if (state.position === _position) {
    throwError(state, 'name of an anchor node must contain at least one character');
  }

  state.anchor = state.input.slice(_position, state.position);
  return true;
}

function readAlias(state) {
  var _position, alias,
      ch;

  ch = state.input.charCodeAt(state.position);

  if (ch !== 0x2A/* * */) return false;

  ch = state.input.charCodeAt(++state.position);
  _position = state.position;

  while (ch !== 0 && !is_WS_OR_EOL(ch) && !is_FLOW_INDICATOR(ch)) {
    ch = state.input.charCodeAt(++state.position);
  }

  if (state.position === _position) {
    throwError(state, 'name of an alias node must contain at least one character');
  }

  alias = state.input.slice(_position, state.position);

  if (!_hasOwnProperty$1.call(state.anchorMap, alias)) {
    throwError(state, 'unidentified alias "' + alias + '"');
  }

  state.result = state.anchorMap[alias];
  skipSeparationSpace(state, true, -1);
  return true;
}

function composeNode(state, parentIndent, nodeContext, allowToSeek, allowCompact) {
  var allowBlockStyles,
      allowBlockScalars,
      allowBlockCollections,
      indentStatus = 1, // 1: this>parent, 0: this=parent, -1: this<parent
      atNewLine  = false,
      hasContent = false,
      typeIndex,
      typeQuantity,
      typeList,
      type,
      flowIndent,
      blockIndent;

  if (state.listener !== null) {
    state.listener('open', state);
  }

  state.tag    = null;
  state.anchor = null;
  state.kind   = null;
  state.result = null;

  allowBlockStyles = allowBlockScalars = allowBlockCollections =
    CONTEXT_BLOCK_OUT === nodeContext ||
    CONTEXT_BLOCK_IN  === nodeContext;

  if (allowToSeek) {
    if (skipSeparationSpace(state, true, -1)) {
      atNewLine = true;

      if (state.lineIndent > parentIndent) {
        indentStatus = 1;
      } else if (state.lineIndent === parentIndent) {
        indentStatus = 0;
      } else if (state.lineIndent < parentIndent) {
        indentStatus = -1;
      }
    }
  }

  if (indentStatus === 1) {
    while (readTagProperty(state) || readAnchorProperty(state)) {
      if (skipSeparationSpace(state, true, -1)) {
        atNewLine = true;
        allowBlockCollections = allowBlockStyles;

        if (state.lineIndent > parentIndent) {
          indentStatus = 1;
        } else if (state.lineIndent === parentIndent) {
          indentStatus = 0;
        } else if (state.lineIndent < parentIndent) {
          indentStatus = -1;
        }
      } else {
        allowBlockCollections = false;
      }
    }
  }

  if (allowBlockCollections) {
    allowBlockCollections = atNewLine || allowCompact;
  }

  if (indentStatus === 1 || CONTEXT_BLOCK_OUT === nodeContext) {
    if (CONTEXT_FLOW_IN === nodeContext || CONTEXT_FLOW_OUT === nodeContext) {
      flowIndent = parentIndent;
    } else {
      flowIndent = parentIndent + 1;
    }

    blockIndent = state.position - state.lineStart;

    if (indentStatus === 1) {
      if (allowBlockCollections &&
          (readBlockSequence(state, blockIndent) ||
           readBlockMapping(state, blockIndent, flowIndent)) ||
          readFlowCollection(state, flowIndent)) {
        hasContent = true;
      } else {
        if ((allowBlockScalars && readBlockScalar(state, flowIndent)) ||
            readSingleQuotedScalar(state, flowIndent) ||
            readDoubleQuotedScalar(state, flowIndent)) {
          hasContent = true;

        } else if (readAlias(state)) {
          hasContent = true;

          if (state.tag !== null || state.anchor !== null) {
            throwError(state, 'alias node should not have any properties');
          }

        } else if (readPlainScalar(state, flowIndent, CONTEXT_FLOW_IN === nodeContext)) {
          hasContent = true;

          if (state.tag === null) {
            state.tag = '?';
          }
        }

        if (state.anchor !== null) {
          state.anchorMap[state.anchor] = state.result;
        }
      }
    } else if (indentStatus === 0) {
      // Special case: block sequences are allowed to have same indentation level as the parent.
      // http://www.yaml.org/spec/1.2/spec.html#id2799784
      hasContent = allowBlockCollections && readBlockSequence(state, blockIndent);
    }
  }

  if (state.tag === null) {
    if (state.anchor !== null) {
      state.anchorMap[state.anchor] = state.result;
    }

  } else if (state.tag === '?') {
    // Implicit resolving is not allowed for non-scalar types, and '?'
    // non-specific tag is only automatically assigned to plain scalars.
    //
    // We only need to check kind conformity in case user explicitly assigns '?'
    // tag, for example like this: "!<?> [0]"
    //
    if (state.result !== null && state.kind !== 'scalar') {
      throwError(state, 'unacceptable node kind for !<?> tag; it should be "scalar", not "' + state.kind + '"');
    }

    for (typeIndex = 0, typeQuantity = state.implicitTypes.length; typeIndex < typeQuantity; typeIndex += 1) {
      type = state.implicitTypes[typeIndex];

      if (type.resolve(state.result)) { // `state.result` updated in resolver if matched
        state.result = type.construct(state.result);
        state.tag = type.tag;
        if (state.anchor !== null) {
          state.anchorMap[state.anchor] = state.result;
        }
        break;
      }
    }
  } else if (state.tag !== '!') {
    if (_hasOwnProperty$1.call(state.typeMap[state.kind || 'fallback'], state.tag)) {
      type = state.typeMap[state.kind || 'fallback'][state.tag];
    } else {
      // looking for multi type
      type = null;
      typeList = state.typeMap.multi[state.kind || 'fallback'];

      for (typeIndex = 0, typeQuantity = typeList.length; typeIndex < typeQuantity; typeIndex += 1) {
        if (state.tag.slice(0, typeList[typeIndex].tag.length) === typeList[typeIndex].tag) {
          type = typeList[typeIndex];
          break;
        }
      }
    }

    if (!type) {
      throwError(state, 'unknown tag !<' + state.tag + '>');
    }

    if (state.result !== null && type.kind !== state.kind) {
      throwError(state, 'unacceptable node kind for !<' + state.tag + '> tag; it should be "' + type.kind + '", not "' + state.kind + '"');
    }

    if (!type.resolve(state.result, state.tag)) { // `state.result` updated in resolver if matched
      throwError(state, 'cannot resolve a node with !<' + state.tag + '> explicit tag');
    } else {
      state.result = type.construct(state.result, state.tag);
      if (state.anchor !== null) {
        state.anchorMap[state.anchor] = state.result;
      }
    }
  }

  if (state.listener !== null) {
    state.listener('close', state);
  }
  return state.tag !== null ||  state.anchor !== null || hasContent;
}

function readDocument(state) {
  var documentStart = state.position,
      _position,
      directiveName,
      directiveArgs,
      hasDirectives = false,
      ch;

  state.version = null;
  state.checkLineBreaks = state.legacy;
  state.tagMap = Object.create(null);
  state.anchorMap = Object.create(null);

  while ((ch = state.input.charCodeAt(state.position)) !== 0) {
    skipSeparationSpace(state, true, -1);

    ch = state.input.charCodeAt(state.position);

    if (state.lineIndent > 0 || ch !== 0x25/* % */) {
      break;
    }

    hasDirectives = true;
    ch = state.input.charCodeAt(++state.position);
    _position = state.position;

    while (ch !== 0 && !is_WS_OR_EOL(ch)) {
      ch = state.input.charCodeAt(++state.position);
    }

    directiveName = state.input.slice(_position, state.position);
    directiveArgs = [];

    if (directiveName.length < 1) {
      throwError(state, 'directive name must not be less than one character in length');
    }

    while (ch !== 0) {
      while (is_WHITE_SPACE(ch)) {
        ch = state.input.charCodeAt(++state.position);
      }

      if (ch === 0x23/* # */) {
        do { ch = state.input.charCodeAt(++state.position); }
        while (ch !== 0 && !is_EOL(ch));
        break;
      }

      if (is_EOL(ch)) break;

      _position = state.position;

      while (ch !== 0 && !is_WS_OR_EOL(ch)) {
        ch = state.input.charCodeAt(++state.position);
      }

      directiveArgs.push(state.input.slice(_position, state.position));
    }

    if (ch !== 0) readLineBreak(state);

    if (_hasOwnProperty$1.call(directiveHandlers, directiveName)) {
      directiveHandlers[directiveName](state, directiveName, directiveArgs);
    } else {
      throwWarning(state, 'unknown document directive "' + directiveName + '"');
    }
  }

  skipSeparationSpace(state, true, -1);

  if (state.lineIndent === 0 &&
      state.input.charCodeAt(state.position)     === 0x2D/* - */ &&
      state.input.charCodeAt(state.position + 1) === 0x2D/* - */ &&
      state.input.charCodeAt(state.position + 2) === 0x2D/* - */) {
    state.position += 3;
    skipSeparationSpace(state, true, -1);

  } else if (hasDirectives) {
    throwError(state, 'directives end mark is expected');
  }

  composeNode(state, state.lineIndent - 1, CONTEXT_BLOCK_OUT, false, true);
  skipSeparationSpace(state, true, -1);

  if (state.checkLineBreaks &&
      PATTERN_NON_ASCII_LINE_BREAKS.test(state.input.slice(documentStart, state.position))) {
    throwWarning(state, 'non-ASCII line breaks are interpreted as content');
  }

  state.documents.push(state.result);

  if (state.position === state.lineStart && testDocumentSeparator(state)) {

    if (state.input.charCodeAt(state.position) === 0x2E/* . */) {
      state.position += 3;
      skipSeparationSpace(state, true, -1);
    }
    return;
  }

  if (state.position < (state.length - 1)) {
    throwError(state, 'end of the stream or a document separator is expected');
  } else {
    return;
  }
}


function loadDocuments(input, options) {
  input = String(input);
  options = options || {};

  if (input.length !== 0) {

    // Add tailing `\n` if not exists
    if (input.charCodeAt(input.length - 1) !== 0x0A/* LF */ &&
        input.charCodeAt(input.length - 1) !== 0x0D/* CR */) {
      input += '\n';
    }

    // Strip BOM
    if (input.charCodeAt(0) === 0xFEFF) {
      input = input.slice(1);
    }
  }

  var state = new State$2(input, options);

  var nullpos = input.indexOf('\0');

  if (nullpos !== -1) {
    state.position = nullpos;
    throwError(state, 'null byte is not allowed in input');
  }

  // Use 0 as string terminator. That significantly simplifies bounds check.
  state.input += '\0';

  while (state.input.charCodeAt(state.position) === 0x20/* Space */) {
    state.lineIndent += 1;
    state.position += 1;
  }

  while (state.position < (state.length - 1)) {
    readDocument(state);
  }

  return state.documents;
}


function loadAll(input, iterator, options) {
  if (iterator !== null && typeof iterator === 'object' && typeof options === 'undefined') {
    options = iterator;
    iterator = null;
  }

  var documents = loadDocuments(input, options);

  if (typeof iterator !== 'function') {
    return documents;
  }

  for (var index = 0, length = documents.length; index < length; index += 1) {
    iterator(documents[index]);
  }
}


function load(input, options) {
  var documents = loadDocuments(input, options);

  if (documents.length === 0) {
    /*eslint-disable no-undefined*/
    return undefined;
  } else if (documents.length === 1) {
    return documents[0];
  }
  throw new YAMLException$1('expected a single document in the stream, but found more');
}


loader$1.loadAll = loadAll;
loader$1.load    = load;

var dumper$1 = {};

/*eslint-disable no-use-before-define*/

var common              = common$5;
var YAMLException       = exception;
var DEFAULT_SCHEMA      = _default;

var _toString       = Object.prototype.toString;
var _hasOwnProperty = Object.prototype.hasOwnProperty;

var CHAR_BOM                  = 0xFEFF;
var CHAR_TAB                  = 0x09; /* Tab */
var CHAR_LINE_FEED            = 0x0A; /* LF */
var CHAR_CARRIAGE_RETURN      = 0x0D; /* CR */
var CHAR_SPACE                = 0x20; /* Space */
var CHAR_EXCLAMATION          = 0x21; /* ! */
var CHAR_DOUBLE_QUOTE         = 0x22; /* " */
var CHAR_SHARP                = 0x23; /* # */
var CHAR_PERCENT              = 0x25; /* % */
var CHAR_AMPERSAND            = 0x26; /* & */
var CHAR_SINGLE_QUOTE         = 0x27; /* ' */
var CHAR_ASTERISK             = 0x2A; /* * */
var CHAR_COMMA$1                = 0x2C; /* , */
var CHAR_MINUS                = 0x2D; /* - */
var CHAR_COLON$1                = 0x3A; /* : */
var CHAR_EQUALS$1               = 0x3D; /* = */
var CHAR_GREATER_THAN         = 0x3E; /* > */
var CHAR_QUESTION             = 0x3F; /* ? */
var CHAR_COMMERCIAL_AT        = 0x40; /* @ */
var CHAR_LEFT_SQUARE_BRACKET  = 0x5B; /* [ */
var CHAR_RIGHT_SQUARE_BRACKET = 0x5D; /* ] */
var CHAR_GRAVE_ACCENT         = 0x60; /* ` */
var CHAR_LEFT_CURLY_BRACKET   = 0x7B; /* { */
var CHAR_VERTICAL_LINE        = 0x7C; /* | */
var CHAR_RIGHT_CURLY_BRACKET  = 0x7D; /* } */

var ESCAPE_SEQUENCES = {};

ESCAPE_SEQUENCES[0x00]   = '\\0';
ESCAPE_SEQUENCES[0x07]   = '\\a';
ESCAPE_SEQUENCES[0x08]   = '\\b';
ESCAPE_SEQUENCES[0x09]   = '\\t';
ESCAPE_SEQUENCES[0x0A]   = '\\n';
ESCAPE_SEQUENCES[0x0B]   = '\\v';
ESCAPE_SEQUENCES[0x0C]   = '\\f';
ESCAPE_SEQUENCES[0x0D]   = '\\r';
ESCAPE_SEQUENCES[0x1B]   = '\\e';
ESCAPE_SEQUENCES[0x22]   = '\\"';
ESCAPE_SEQUENCES[0x5C]   = '\\\\';
ESCAPE_SEQUENCES[0x85]   = '\\N';
ESCAPE_SEQUENCES[0xA0]   = '\\_';
ESCAPE_SEQUENCES[0x2028] = '\\L';
ESCAPE_SEQUENCES[0x2029] = '\\P';

var DEPRECATED_BOOLEANS_SYNTAX = [
  'y', 'Y', 'yes', 'Yes', 'YES', 'on', 'On', 'ON',
  'n', 'N', 'no', 'No', 'NO', 'off', 'Off', 'OFF'
];

var DEPRECATED_BASE60_SYNTAX = /^[-+]?[0-9_]+(?::[0-9_]+)+(?:\.[0-9_]*)?$/;

function compileStyleMap(schema, map) {
  var result, keys, index, length, tag, style, type;

  if (map === null) return {};

  result = {};
  keys = Object.keys(map);

  for (index = 0, length = keys.length; index < length; index += 1) {
    tag = keys[index];
    style = String(map[tag]);

    if (tag.slice(0, 2) === '!!') {
      tag = 'tag:yaml.org,2002:' + tag.slice(2);
    }
    type = schema.compiledTypeMap['fallback'][tag];

    if (type && _hasOwnProperty.call(type.styleAliases, style)) {
      style = type.styleAliases[style];
    }

    result[tag] = style;
  }

  return result;
}

function encodeHex(character) {
  var string, handle, length;

  string = character.toString(16).toUpperCase();

  if (character <= 0xFF) {
    handle = 'x';
    length = 2;
  } else if (character <= 0xFFFF) {
    handle = 'u';
    length = 4;
  } else if (character <= 0xFFFFFFFF) {
    handle = 'U';
    length = 8;
  } else {
    throw new YAMLException('code point within a string may not be greater than 0xFFFFFFFF');
  }

  return '\\' + handle + common.repeat('0', length - string.length) + string;
}


var QUOTING_TYPE_SINGLE = 1,
    QUOTING_TYPE_DOUBLE = 2;

function State$1(options) {
  this.schema        = options['schema'] || DEFAULT_SCHEMA;
  this.indent        = Math.max(1, (options['indent'] || 2));
  this.noArrayIndent = options['noArrayIndent'] || false;
  this.skipInvalid   = options['skipInvalid'] || false;
  this.flowLevel     = (common.isNothing(options['flowLevel']) ? -1 : options['flowLevel']);
  this.styleMap      = compileStyleMap(this.schema, options['styles'] || null);
  this.sortKeys      = options['sortKeys'] || false;
  this.lineWidth     = options['lineWidth'] || 80;
  this.noRefs        = options['noRefs'] || false;
  this.noCompatMode  = options['noCompatMode'] || false;
  this.condenseFlow  = options['condenseFlow'] || false;
  this.quotingType   = options['quotingType'] === '"' ? QUOTING_TYPE_DOUBLE : QUOTING_TYPE_SINGLE;
  this.forceQuotes   = options['forceQuotes'] || false;
  this.replacer      = typeof options['replacer'] === 'function' ? options['replacer'] : null;

  this.implicitTypes = this.schema.compiledImplicit;
  this.explicitTypes = this.schema.compiledExplicit;

  this.tag = null;
  this.result = '';

  this.duplicates = [];
  this.usedDuplicates = null;
}

// Indents every line in a string. Empty lines (\n only) are not indented.
function indentString(string, spaces) {
  var ind = common.repeat(' ', spaces),
      position = 0,
      next = -1,
      result = '',
      line,
      length = string.length;

  while (position < length) {
    next = string.indexOf('\n', position);
    if (next === -1) {
      line = string.slice(position);
      position = length;
    } else {
      line = string.slice(position, next + 1);
      position = next + 1;
    }

    if (line.length && line !== '\n') result += ind;

    result += line;
  }

  return result;
}

function generateNextLine(state, level) {
  return '\n' + common.repeat(' ', state.indent * level);
}

function testImplicitResolving(state, str) {
  var index, length, type;

  for (index = 0, length = state.implicitTypes.length; index < length; index += 1) {
    type = state.implicitTypes[index];

    if (type.resolve(str)) {
      return true;
    }
  }

  return false;
}

// [33] s-white ::= s-space | s-tab
function isWhitespace(c) {
  return c === CHAR_SPACE || c === CHAR_TAB;
}

// Returns true if the character can be printed without escaping.
// From YAML 1.2: "any allowed characters known to be non-printable
// should also be escaped. [However,] This isn’t mandatory"
// Derived from nb-char - \t - #x85 - #xA0 - #x2028 - #x2029.
function isPrintable(c) {
  return  (0x00020 <= c && c <= 0x00007E)
      || ((0x000A1 <= c && c <= 0x00D7FF) && c !== 0x2028 && c !== 0x2029)
      || ((0x0E000 <= c && c <= 0x00FFFD) && c !== CHAR_BOM)
      ||  (0x10000 <= c && c <= 0x10FFFF);
}

// [34] ns-char ::= nb-char - s-white
// [27] nb-char ::= c-printable - b-char - c-byte-order-mark
// [26] b-char  ::= b-line-feed | b-carriage-return
// Including s-white (for some reason, examples doesn't match specs in this aspect)
// ns-char ::= c-printable - b-line-feed - b-carriage-return - c-byte-order-mark
function isNsCharOrWhitespace(c) {
  return isPrintable(c)
    && c !== CHAR_BOM
    // - b-char
    && c !== CHAR_CARRIAGE_RETURN
    && c !== CHAR_LINE_FEED;
}

// [127]  ns-plain-safe(c) ::= c = flow-out  ⇒ ns-plain-safe-out
//                             c = flow-in   ⇒ ns-plain-safe-in
//                             c = block-key ⇒ ns-plain-safe-out
//                             c = flow-key  ⇒ ns-plain-safe-in
// [128] ns-plain-safe-out ::= ns-char
// [129]  ns-plain-safe-in ::= ns-char - c-flow-indicator
// [130]  ns-plain-char(c) ::=  ( ns-plain-safe(c) - “:” - “#” )
//                            | ( /* An ns-char preceding */ “#” )
//                            | ( “:” /* Followed by an ns-plain-safe(c) */ )
function isPlainSafe(c, prev, inblock) {
  var cIsNsCharOrWhitespace = isNsCharOrWhitespace(c);
  var cIsNsChar = cIsNsCharOrWhitespace && !isWhitespace(c);
  return (
    // ns-plain-safe
    inblock ? // c = flow-in
      cIsNsCharOrWhitespace
      : cIsNsCharOrWhitespace
        // - c-flow-indicator
        && c !== CHAR_COMMA$1
        && c !== CHAR_LEFT_SQUARE_BRACKET
        && c !== CHAR_RIGHT_SQUARE_BRACKET
        && c !== CHAR_LEFT_CURLY_BRACKET
        && c !== CHAR_RIGHT_CURLY_BRACKET
  )
    // ns-plain-char
    && c !== CHAR_SHARP // false on '#'
    && !(prev === CHAR_COLON$1 && !cIsNsChar) // false on ': '
    || (isNsCharOrWhitespace(prev) && !isWhitespace(prev) && c === CHAR_SHARP) // change to true on '[^ ]#'
    || (prev === CHAR_COLON$1 && cIsNsChar); // change to true on ':[^ ]'
}

// Simplified test for values allowed as the first character in plain style.
function isPlainSafeFirst(c) {
  // Uses a subset of ns-char - c-indicator
  // where ns-char = nb-char - s-white.
  // No support of ( ( “?” | “:” | “-” ) /* Followed by an ns-plain-safe(c)) */ ) part
  return isPrintable(c) && c !== CHAR_BOM
    && !isWhitespace(c) // - s-white
    // - (c-indicator ::=
    // “-” | “?” | “:” | “,” | “[” | “]” | “{” | “}”
    && c !== CHAR_MINUS
    && c !== CHAR_QUESTION
    && c !== CHAR_COLON$1
    && c !== CHAR_COMMA$1
    && c !== CHAR_LEFT_SQUARE_BRACKET
    && c !== CHAR_RIGHT_SQUARE_BRACKET
    && c !== CHAR_LEFT_CURLY_BRACKET
    && c !== CHAR_RIGHT_CURLY_BRACKET
    // | “#” | “&” | “*” | “!” | “|” | “=” | “>” | “'” | “"”
    && c !== CHAR_SHARP
    && c !== CHAR_AMPERSAND
    && c !== CHAR_ASTERISK
    && c !== CHAR_EXCLAMATION
    && c !== CHAR_VERTICAL_LINE
    && c !== CHAR_EQUALS$1
    && c !== CHAR_GREATER_THAN
    && c !== CHAR_SINGLE_QUOTE
    && c !== CHAR_DOUBLE_QUOTE
    // | “%” | “@” | “`”)
    && c !== CHAR_PERCENT
    && c !== CHAR_COMMERCIAL_AT
    && c !== CHAR_GRAVE_ACCENT;
}

// Simplified test for values allowed as the last character in plain style.
function isPlainSafeLast(c) {
  // just not whitespace or colon, it will be checked to be plain character later
  return !isWhitespace(c) && c !== CHAR_COLON$1;
}

// Same as 'string'.codePointAt(pos), but works in older browsers.
function codePointAt(string, pos) {
  var first = string.charCodeAt(pos), second;
  if (first >= 0xD800 && first <= 0xDBFF && pos + 1 < string.length) {
    second = string.charCodeAt(pos + 1);
    if (second >= 0xDC00 && second <= 0xDFFF) {
      // https://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
      return (first - 0xD800) * 0x400 + second - 0xDC00 + 0x10000;
    }
  }
  return first;
}

// Determines whether block indentation indicator is required.
function needIndentIndicator(string) {
  var leadingSpaceRe = /^\n* /;
  return leadingSpaceRe.test(string);
}

var STYLE_PLAIN   = 1,
    STYLE_SINGLE  = 2,
    STYLE_LITERAL = 3,
    STYLE_FOLDED  = 4,
    STYLE_DOUBLE  = 5;

// Determines which scalar styles are possible and returns the preferred style.
// lineWidth = -1 => no limit.
// Pre-conditions: str.length > 0.
// Post-conditions:
//    STYLE_PLAIN or STYLE_SINGLE => no \n are in the string.
//    STYLE_LITERAL => no lines are suitable for folding (or lineWidth is -1).
//    STYLE_FOLDED => a line > lineWidth and can be folded (and lineWidth != -1).
function chooseScalarStyle(string, singleLineOnly, indentPerLevel, lineWidth,
  testAmbiguousType, quotingType, forceQuotes, inblock) {

  var i;
  var char = 0;
  var prevChar = null;
  var hasLineBreak = false;
  var hasFoldableLine = false; // only checked if shouldTrackWidth
  var shouldTrackWidth = lineWidth !== -1;
  var previousLineBreak = -1; // count the first line correctly
  var plain = isPlainSafeFirst(codePointAt(string, 0))
          && isPlainSafeLast(codePointAt(string, string.length - 1));

  if (singleLineOnly || forceQuotes) {
    // Case: no block styles.
    // Check for disallowed characters to rule out plain and single.
    for (i = 0; i < string.length; char >= 0x10000 ? i += 2 : i++) {
      char = codePointAt(string, i);
      if (!isPrintable(char)) {
        return STYLE_DOUBLE;
      }
      plain = plain && isPlainSafe(char, prevChar, inblock);
      prevChar = char;
    }
  } else {
    // Case: block styles permitted.
    for (i = 0; i < string.length; char >= 0x10000 ? i += 2 : i++) {
      char = codePointAt(string, i);
      if (char === CHAR_LINE_FEED) {
        hasLineBreak = true;
        // Check if any line can be folded.
        if (shouldTrackWidth) {
          hasFoldableLine = hasFoldableLine ||
            // Foldable line = too long, and not more-indented.
            (i - previousLineBreak - 1 > lineWidth &&
             string[previousLineBreak + 1] !== ' ');
          previousLineBreak = i;
        }
      } else if (!isPrintable(char)) {
        return STYLE_DOUBLE;
      }
      plain = plain && isPlainSafe(char, prevChar, inblock);
      prevChar = char;
    }
    // in case the end is missing a \n
    hasFoldableLine = hasFoldableLine || (shouldTrackWidth &&
      (i - previousLineBreak - 1 > lineWidth &&
       string[previousLineBreak + 1] !== ' '));
  }
  // Although every style can represent \n without escaping, prefer block styles
  // for multiline, since they're more readable and they don't add empty lines.
  // Also prefer folding a super-long line.
  if (!hasLineBreak && !hasFoldableLine) {
    // Strings interpretable as another type have to be quoted;
    // e.g. the string 'true' vs. the boolean true.
    if (plain && !forceQuotes && !testAmbiguousType(string)) {
      return STYLE_PLAIN;
    }
    return quotingType === QUOTING_TYPE_DOUBLE ? STYLE_DOUBLE : STYLE_SINGLE;
  }
  // Edge case: block indentation indicator can only have one digit.
  if (indentPerLevel > 9 && needIndentIndicator(string)) {
    return STYLE_DOUBLE;
  }
  // At this point we know block styles are valid.
  // Prefer literal style unless we want to fold.
  if (!forceQuotes) {
    return hasFoldableLine ? STYLE_FOLDED : STYLE_LITERAL;
  }
  return quotingType === QUOTING_TYPE_DOUBLE ? STYLE_DOUBLE : STYLE_SINGLE;
}

// Note: line breaking/folding is implemented for only the folded style.
// NB. We drop the last trailing newline (if any) of a returned block scalar
//  since the dumper adds its own newline. This always works:
//    • No ending newline => unaffected; already using strip "-" chomping.
//    • Ending newline    => removed then restored.
//  Importantly, this keeps the "+" chomp indicator from gaining an extra line.
function writeScalar(state, string, level, iskey, inblock) {
  state.dump = (function () {
    if (string.length === 0) {
      return state.quotingType === QUOTING_TYPE_DOUBLE ? '""' : "''";
    }
    if (!state.noCompatMode) {
      if (DEPRECATED_BOOLEANS_SYNTAX.indexOf(string) !== -1 || DEPRECATED_BASE60_SYNTAX.test(string)) {
        return state.quotingType === QUOTING_TYPE_DOUBLE ? ('"' + string + '"') : ("'" + string + "'");
      }
    }

    var indent = state.indent * Math.max(1, level); // no 0-indent scalars
    // As indentation gets deeper, let the width decrease monotonically
    // to the lower bound min(state.lineWidth, 40).
    // Note that this implies
    //  state.lineWidth ≤ 40 + state.indent: width is fixed at the lower bound.
    //  state.lineWidth > 40 + state.indent: width decreases until the lower bound.
    // This behaves better than a constant minimum width which disallows narrower options,
    // or an indent threshold which causes the width to suddenly increase.
    var lineWidth = state.lineWidth === -1
      ? -1 : Math.max(Math.min(state.lineWidth, 40), state.lineWidth - indent);

    // Without knowing if keys are implicit/explicit, assume implicit for safety.
    var singleLineOnly = iskey
      // No block styles in flow mode.
      || (state.flowLevel > -1 && level >= state.flowLevel);
    function testAmbiguity(string) {
      return testImplicitResolving(state, string);
    }

    switch (chooseScalarStyle(string, singleLineOnly, state.indent, lineWidth,
      testAmbiguity, state.quotingType, state.forceQuotes && !iskey, inblock)) {

      case STYLE_PLAIN:
        return string;
      case STYLE_SINGLE:
        return "'" + string.replace(/'/g, "''") + "'";
      case STYLE_LITERAL:
        return '|' + blockHeader(string, state.indent)
          + dropEndingNewline(indentString(string, indent));
      case STYLE_FOLDED:
        return '>' + blockHeader(string, state.indent)
          + dropEndingNewline(indentString(foldString(string, lineWidth), indent));
      case STYLE_DOUBLE:
        return '"' + escapeString$1(string) + '"';
      default:
        throw new YAMLException('impossible error: invalid scalar style');
    }
  }());
}

// Pre-conditions: string is valid for a block scalar, 1 <= indentPerLevel <= 9.
function blockHeader(string, indentPerLevel) {
  var indentIndicator = needIndentIndicator(string) ? String(indentPerLevel) : '';

  // note the special case: the string '\n' counts as a "trailing" empty line.
  var clip =          string[string.length - 1] === '\n';
  var keep = clip && (string[string.length - 2] === '\n' || string === '\n');
  var chomp = keep ? '+' : (clip ? '' : '-');

  return indentIndicator + chomp + '\n';
}

// (See the note for writeScalar.)
function dropEndingNewline(string) {
  return string[string.length - 1] === '\n' ? string.slice(0, -1) : string;
}

// Note: a long line without a suitable break point will exceed the width limit.
// Pre-conditions: every char in str isPrintable, str.length > 0, width > 0.
function foldString(string, width) {
  // In folded style, $k$ consecutive newlines output as $k+1$ newlines—
  // unless they're before or after a more-indented line, or at the very
  // beginning or end, in which case $k$ maps to $k$.
  // Therefore, parse each chunk as newline(s) followed by a content line.
  var lineRe = /(\n+)([^\n]*)/g;

  // first line (possibly an empty line)
  var result = (function () {
    var nextLF = string.indexOf('\n');
    nextLF = nextLF !== -1 ? nextLF : string.length;
    lineRe.lastIndex = nextLF;
    return foldLine(string.slice(0, nextLF), width);
  }());
  // If we haven't reached the first content line yet, don't add an extra \n.
  var prevMoreIndented = string[0] === '\n' || string[0] === ' ';
  var moreIndented;

  // rest of the lines
  var match;
  while ((match = lineRe.exec(string))) {
    var prefix = match[1], line = match[2];
    moreIndented = (line[0] === ' ');
    result += prefix
      + (!prevMoreIndented && !moreIndented && line !== ''
        ? '\n' : '')
      + foldLine(line, width);
    prevMoreIndented = moreIndented;
  }

  return result;
}

// Greedy line breaking.
// Picks the longest line under the limit each time,
// otherwise settles for the shortest line over the limit.
// NB. More-indented lines *cannot* be folded, as that would add an extra \n.
function foldLine(line, width) {
  if (line === '' || line[0] === ' ') return line;

  // Since a more-indented line adds a \n, breaks can't be followed by a space.
  var breakRe = / [^ ]/g; // note: the match index will always be <= length-2.
  var match;
  // start is an inclusive index. end, curr, and next are exclusive.
  var start = 0, end, curr = 0, next = 0;
  var result = '';

  // Invariants: 0 <= start <= length-1.
  //   0 <= curr <= next <= max(0, length-2). curr - start <= width.
  // Inside the loop:
  //   A match implies length >= 2, so curr and next are <= length-2.
  while ((match = breakRe.exec(line))) {
    next = match.index;
    // maintain invariant: curr - start <= width
    if (next - start > width) {
      end = (curr > start) ? curr : next; // derive end <= length-2
      result += '\n' + line.slice(start, end);
      // skip the space that was output as \n
      start = end + 1;                    // derive start <= length-1
    }
    curr = next;
  }

  // By the invariants, start <= length-1, so there is something left over.
  // It is either the whole string or a part starting from non-whitespace.
  result += '\n';
  // Insert a break if the remainder is too long and there is a break available.
  if (line.length - start > width && curr > start) {
    result += line.slice(start, curr) + '\n' + line.slice(curr + 1);
  } else {
    result += line.slice(start);
  }

  return result.slice(1); // drop extra \n joiner
}

// Escapes a double-quoted string.
function escapeString$1(string) {
  var result = '';
  var char = 0;
  var escapeSeq;

  for (var i = 0; i < string.length; char >= 0x10000 ? i += 2 : i++) {
    char = codePointAt(string, i);
    escapeSeq = ESCAPE_SEQUENCES[char];

    if (!escapeSeq && isPrintable(char)) {
      result += string[i];
      if (char >= 0x10000) result += string[i + 1];
    } else {
      result += escapeSeq || encodeHex(char);
    }
  }

  return result;
}

function writeFlowSequence(state, level, object) {
  var _result = '',
      _tag    = state.tag,
      index,
      length,
      value;

  for (index = 0, length = object.length; index < length; index += 1) {
    value = object[index];

    if (state.replacer) {
      value = state.replacer.call(object, String(index), value);
    }

    // Write only valid elements, put null instead of invalid elements.
    if (writeNode(state, level, value, false, false) ||
        (typeof value === 'undefined' &&
         writeNode(state, level, null, false, false))) {

      if (_result !== '') _result += ',' + (!state.condenseFlow ? ' ' : '');
      _result += state.dump;
    }
  }

  state.tag = _tag;
  state.dump = '[' + _result + ']';
}

function writeBlockSequence(state, level, object, compact) {
  var _result = '',
      _tag    = state.tag,
      index,
      length,
      value;

  for (index = 0, length = object.length; index < length; index += 1) {
    value = object[index];

    if (state.replacer) {
      value = state.replacer.call(object, String(index), value);
    }

    // Write only valid elements, put null instead of invalid elements.
    if (writeNode(state, level + 1, value, true, true, false, true) ||
        (typeof value === 'undefined' &&
         writeNode(state, level + 1, null, true, true, false, true))) {

      if (!compact || _result !== '') {
        _result += generateNextLine(state, level);
      }

      if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
        _result += '-';
      } else {
        _result += '- ';
      }

      _result += state.dump;
    }
  }

  state.tag = _tag;
  state.dump = _result || '[]'; // Empty sequence if no valid values.
}

function writeFlowMapping(state, level, object) {
  var _result       = '',
      _tag          = state.tag,
      objectKeyList = Object.keys(object),
      index,
      length,
      objectKey,
      objectValue,
      pairBuffer;

  for (index = 0, length = objectKeyList.length; index < length; index += 1) {

    pairBuffer = '';
    if (_result !== '') pairBuffer += ', ';

    if (state.condenseFlow) pairBuffer += '"';

    objectKey = objectKeyList[index];
    objectValue = object[objectKey];

    if (state.replacer) {
      objectValue = state.replacer.call(object, objectKey, objectValue);
    }

    if (!writeNode(state, level, objectKey, false, false)) {
      continue; // Skip this pair because of invalid key;
    }

    if (state.dump.length > 1024) pairBuffer += '? ';

    pairBuffer += state.dump + (state.condenseFlow ? '"' : '') + ':' + (state.condenseFlow ? '' : ' ');

    if (!writeNode(state, level, objectValue, false, false)) {
      continue; // Skip this pair because of invalid value.
    }

    pairBuffer += state.dump;

    // Both key and value are valid.
    _result += pairBuffer;
  }

  state.tag = _tag;
  state.dump = '{' + _result + '}';
}

function writeBlockMapping(state, level, object, compact) {
  var _result       = '',
      _tag          = state.tag,
      objectKeyList = Object.keys(object),
      index,
      length,
      objectKey,
      objectValue,
      explicitPair,
      pairBuffer;

  // Allow sorting keys so that the output file is deterministic
  if (state.sortKeys === true) {
    // Default sorting
    objectKeyList.sort();
  } else if (typeof state.sortKeys === 'function') {
    // Custom sort function
    objectKeyList.sort(state.sortKeys);
  } else if (state.sortKeys) {
    // Something is wrong
    throw new YAMLException('sortKeys must be a boolean or a function');
  }

  for (index = 0, length = objectKeyList.length; index < length; index += 1) {
    pairBuffer = '';

    if (!compact || _result !== '') {
      pairBuffer += generateNextLine(state, level);
    }

    objectKey = objectKeyList[index];
    objectValue = object[objectKey];

    if (state.replacer) {
      objectValue = state.replacer.call(object, objectKey, objectValue);
    }

    if (!writeNode(state, level + 1, objectKey, true, true, true)) {
      continue; // Skip this pair because of invalid key.
    }

    explicitPair = (state.tag !== null && state.tag !== '?') ||
                   (state.dump && state.dump.length > 1024);

    if (explicitPair) {
      if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
        pairBuffer += '?';
      } else {
        pairBuffer += '? ';
      }
    }

    pairBuffer += state.dump;

    if (explicitPair) {
      pairBuffer += generateNextLine(state, level);
    }

    if (!writeNode(state, level + 1, objectValue, true, explicitPair)) {
      continue; // Skip this pair because of invalid value.
    }

    if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
      pairBuffer += ':';
    } else {
      pairBuffer += ': ';
    }

    pairBuffer += state.dump;

    // Both key and value are valid.
    _result += pairBuffer;
  }

  state.tag = _tag;
  state.dump = _result || '{}'; // Empty mapping if no valid pairs.
}

function detectType(state, object, explicit) {
  var _result, typeList, index, length, type, style;

  typeList = explicit ? state.explicitTypes : state.implicitTypes;

  for (index = 0, length = typeList.length; index < length; index += 1) {
    type = typeList[index];

    if ((type.instanceOf  || type.predicate) &&
        (!type.instanceOf || ((typeof object === 'object') && (object instanceof type.instanceOf))) &&
        (!type.predicate  || type.predicate(object))) {

      if (explicit) {
        if (type.multi && type.representName) {
          state.tag = type.representName(object);
        } else {
          state.tag = type.tag;
        }
      } else {
        state.tag = '?';
      }

      if (type.represent) {
        style = state.styleMap[type.tag] || type.defaultStyle;

        if (_toString.call(type.represent) === '[object Function]') {
          _result = type.represent(object, style);
        } else if (_hasOwnProperty.call(type.represent, style)) {
          _result = type.represent[style](object, style);
        } else {
          throw new YAMLException('!<' + type.tag + '> tag resolver accepts not "' + style + '" style');
        }

        state.dump = _result;
      }

      return true;
    }
  }

  return false;
}

// Serializes `object` and writes it to global `result`.
// Returns true on success, or false on invalid object.
//
function writeNode(state, level, object, block, compact, iskey, isblockseq) {
  state.tag = null;
  state.dump = object;

  if (!detectType(state, object, false)) {
    detectType(state, object, true);
  }

  var type = _toString.call(state.dump);
  var inblock = block;
  var tagStr;

  if (block) {
    block = (state.flowLevel < 0 || state.flowLevel > level);
  }

  var objectOrArray = type === '[object Object]' || type === '[object Array]',
      duplicateIndex,
      duplicate;

  if (objectOrArray) {
    duplicateIndex = state.duplicates.indexOf(object);
    duplicate = duplicateIndex !== -1;
  }

  if ((state.tag !== null && state.tag !== '?') || duplicate || (state.indent !== 2 && level > 0)) {
    compact = false;
  }

  if (duplicate && state.usedDuplicates[duplicateIndex]) {
    state.dump = '*ref_' + duplicateIndex;
  } else {
    if (objectOrArray && duplicate && !state.usedDuplicates[duplicateIndex]) {
      state.usedDuplicates[duplicateIndex] = true;
    }
    if (type === '[object Object]') {
      if (block && (Object.keys(state.dump).length !== 0)) {
        writeBlockMapping(state, level, state.dump, compact);
        if (duplicate) {
          state.dump = '&ref_' + duplicateIndex + state.dump;
        }
      } else {
        writeFlowMapping(state, level, state.dump);
        if (duplicate) {
          state.dump = '&ref_' + duplicateIndex + ' ' + state.dump;
        }
      }
    } else if (type === '[object Array]') {
      if (block && (state.dump.length !== 0)) {
        if (state.noArrayIndent && !isblockseq && level > 0) {
          writeBlockSequence(state, level - 1, state.dump, compact);
        } else {
          writeBlockSequence(state, level, state.dump, compact);
        }
        if (duplicate) {
          state.dump = '&ref_' + duplicateIndex + state.dump;
        }
      } else {
        writeFlowSequence(state, level, state.dump);
        if (duplicate) {
          state.dump = '&ref_' + duplicateIndex + ' ' + state.dump;
        }
      }
    } else if (type === '[object String]') {
      if (state.tag !== '?') {
        writeScalar(state, state.dump, level, iskey, inblock);
      }
    } else if (type === '[object Undefined]') {
      return false;
    } else {
      if (state.skipInvalid) return false;
      throw new YAMLException('unacceptable kind of an object to dump ' + type);
    }

    if (state.tag !== null && state.tag !== '?') {
      // Need to encode all characters except those allowed by the spec:
      //
      // [35] ns-dec-digit    ::=  [#x30-#x39] /* 0-9 */
      // [36] ns-hex-digit    ::=  ns-dec-digit
      //                         | [#x41-#x46] /* A-F */ | [#x61-#x66] /* a-f */
      // [37] ns-ascii-letter ::=  [#x41-#x5A] /* A-Z */ | [#x61-#x7A] /* a-z */
      // [38] ns-word-char    ::=  ns-dec-digit | ns-ascii-letter | “-”
      // [39] ns-uri-char     ::=  “%” ns-hex-digit ns-hex-digit | ns-word-char | “#”
      //                         | “;” | “/” | “?” | “:” | “@” | “&” | “=” | “+” | “$” | “,”
      //                         | “_” | “.” | “!” | “~” | “*” | “'” | “(” | “)” | “[” | “]”
      //
      // Also need to encode '!' because it has special meaning (end of tag prefix).
      //
      tagStr = encodeURI(
        state.tag[0] === '!' ? state.tag.slice(1) : state.tag
      ).replace(/!/g, '%21');

      if (state.tag[0] === '!') {
        tagStr = '!' + tagStr;
      } else if (tagStr.slice(0, 18) === 'tag:yaml.org,2002:') {
        tagStr = '!!' + tagStr.slice(18);
      } else {
        tagStr = '!<' + tagStr + '>';
      }

      state.dump = tagStr + ' ' + state.dump;
    }
  }

  return true;
}

function getDuplicateReferences(object, state) {
  var objects = [],
      duplicatesIndexes = [],
      index,
      length;

  inspectNode(object, objects, duplicatesIndexes);

  for (index = 0, length = duplicatesIndexes.length; index < length; index += 1) {
    state.duplicates.push(objects[duplicatesIndexes[index]]);
  }
  state.usedDuplicates = new Array(length);
}

function inspectNode(object, objects, duplicatesIndexes) {
  var objectKeyList,
      index,
      length;

  if (object !== null && typeof object === 'object') {
    index = objects.indexOf(object);
    if (index !== -1) {
      if (duplicatesIndexes.indexOf(index) === -1) {
        duplicatesIndexes.push(index);
      }
    } else {
      objects.push(object);

      if (Array.isArray(object)) {
        for (index = 0, length = object.length; index < length; index += 1) {
          inspectNode(object[index], objects, duplicatesIndexes);
        }
      } else {
        objectKeyList = Object.keys(object);

        for (index = 0, length = objectKeyList.length; index < length; index += 1) {
          inspectNode(object[objectKeyList[index]], objects, duplicatesIndexes);
        }
      }
    }
  }
}

function dump(input, options) {
  options = options || {};

  var state = new State$1(options);

  if (!state.noRefs) getDuplicateReferences(input, state);

  var value = input;

  if (state.replacer) {
    value = state.replacer.call({ '': value }, '', value);
  }

  if (writeNode(state, 0, value, true, true)) return state.dump + '\n';

  return '';
}

dumper$1.dump = dump;

var loader = loader$1;
var dumper = dumper$1;


function renamed(from, to) {
  return function () {
    throw new Error('Function yaml.' + from + ' is removed in js-yaml 4. ' +
      'Use yaml.' + to + ' instead, which is now safe by default.');
  };
}


jsYaml.Type                = type;
jsYaml.Schema              = schema;
jsYaml.FAILSAFE_SCHEMA     = failsafe;
jsYaml.JSON_SCHEMA         = json;
jsYaml.CORE_SCHEMA         = core;
jsYaml.DEFAULT_SCHEMA      = _default;
jsYaml.load                = loader.load;
jsYaml.loadAll             = loader.loadAll;
jsYaml.dump                = dumper.dump;
jsYaml.YAMLException       = exception;

// Re-export all types in case user wants to create custom schema
jsYaml.types = {
  binary:    binary,
  float:     float,
  map:       map,
  null:      _null,
  pairs:     pairs,
  set:       set$1,
  timestamp: timestamp,
  bool:      bool,
  int:       int,
  merge:     merge,
  omap:      omap,
  seq:       seq,
  str:       str
};

// Removed functions from JS-YAML 3.0.x
jsYaml.safeLoad            = renamed('safeLoad', 'load');
jsYaml.safeLoadAll         = renamed('safeLoadAll', 'loadAll');
jsYaml.safeDump            = renamed('safeDump', 'dump');

var dist = {exports: {}};

/*!
 * XRegExp 5.1.2
 * <xregexp.com>
 * Steven Levithan (c) 2007-present MIT License
 */

/**
 * XRegExp provides augmented, extensible regular expressions. You get additional regex syntax and
 * flags, beyond what browsers support natively. XRegExp is also a regex utility belt with tools to
 * make your client-side grepping simpler and more powerful, while freeing you from related
 * cross-browser inconsistencies.
 */

// ==--------------------------==
// Private stuff
// ==--------------------------==

// Property name used for extended regex instance data
const REGEX_DATA = 'xregexp';
// Optional features that can be installed and uninstalled
const features = {
    astral: false,
    namespacing: true
};
// Storage for fixed/extended native methods
const fixed = {};
// Storage for regexes cached by `XRegExp.cache`
let regexCache = Object.create(null);
// Storage for pattern details cached by the `XRegExp` constructor
let patternCache = Object.create(null);
// Storage for regex syntax tokens added internally or by `XRegExp.addToken`
const tokens = [];
// Token scopes
const defaultScope = 'default';
const classScope = 'class';
// Regexes that match native regex syntax, including octals
const nativeTokens = {
    // Any native multicharacter token in default scope, or any single character
    'default': /\\(?:0(?:[0-3][0-7]{0,2}|[4-7][0-7]?)?|[1-9]\d*|x[\dA-Fa-f]{2}|u(?:[\dA-Fa-f]{4}|{[\dA-Fa-f]+})|c[A-Za-z]|[\s\S])|\(\?(?:[:=!]|<[=!])|[?*+]\?|{\d+(?:,\d*)?}\??|[\s\S]/,
    // Any native multicharacter token in character class scope, or any single character
    'class': /\\(?:[0-3][0-7]{0,2}|[4-7][0-7]?|x[\dA-Fa-f]{2}|u(?:[\dA-Fa-f]{4}|{[\dA-Fa-f]+})|c[A-Za-z]|[\s\S])|[\s\S]/
};
// Any backreference or dollar-prefixed character in replacement strings
const replacementToken = /\$(?:\{([^\}]+)\}|<([^>]+)>|(\d\d?|[\s\S]?))/g;
// Check for correct `exec` handling of nonparticipating capturing groups
const correctExecNpcg = /()??/.exec('')[1] === undefined;
// Check for ES6 `flags` prop support
const hasFlagsProp = /x/.flags !== undefined;

function hasNativeFlag(flag) {
    // Can't check based on the presence of properties/getters since browsers might support such
    // properties even when they don't support the corresponding flag in regex construction (tested
    // in Chrome 48, where `'unicode' in /x/` is true but trying to construct a regex with flag `u`
    // throws an error)
    let isSupported = true;
    try {
        // Can't use regex literals for testing even in a `try` because regex literals with
        // unsupported flags cause a compilation error in IE
        new RegExp('', flag);

        // Work around a broken/incomplete IE11 polyfill for sticky introduced in core-js 3.6.0
        if (flag === 'y') {
            // Using function to avoid babel transform to regex literal
            const gy = (() => 'gy')();
            const incompleteY = '.a'.replace(new RegExp('a', gy), '.') === '..';
            if (incompleteY) {
                isSupported = false;
            }
        }
    } catch (exception) {
        isSupported = false;
    }
    return isSupported;
}
// Check for ES2021 `d` flag support
const hasNativeD = hasNativeFlag('d');
// Check for ES2018 `s` flag support
const hasNativeS = hasNativeFlag('s');
// Check for ES6 `u` flag support
const hasNativeU = hasNativeFlag('u');
// Check for ES6 `y` flag support
const hasNativeY = hasNativeFlag('y');
// Tracker for known flags, including addon flags
const registeredFlags = {
    d: hasNativeD,
    g: true,
    i: true,
    m: true,
    s: hasNativeS,
    u: hasNativeU,
    y: hasNativeY
};
// Flags to remove when passing to native `RegExp` constructor
const nonnativeFlags = hasNativeS ? /[^dgimsuy]+/g : /[^dgimuy]+/g;

/**
 * Attaches extended data and `XRegExp.prototype` properties to a regex object.
 *
 * @private
 * @param {RegExp} regex Regex to augment.
 * @param {Array} captureNames Array with capture names, or `null`.
 * @param {String} xSource XRegExp pattern used to generate `regex`, or `null` if N/A.
 * @param {String} xFlags XRegExp flags used to generate `regex`, or `null` if N/A.
 * @param {Boolean} [isInternalOnly=false] Whether the regex will be used only for internal
 *   operations, and never exposed to users. For internal-only regexes, we can improve perf by
 *   skipping some operations like attaching `XRegExp.prototype` properties.
 * @returns {!RegExp} Augmented regex.
 */
function augment(regex, captureNames, xSource, xFlags, isInternalOnly) {
    regex[REGEX_DATA] = {
        captureNames
    };

    if (isInternalOnly) {
        return regex;
    }

    // Can't auto-inherit these since the XRegExp constructor returns a nonprimitive value
    if (regex.__proto__) {
        regex.__proto__ = XRegExp.prototype;
    } else {
        for (const p in XRegExp.prototype) {
            // An `XRegExp.prototype.hasOwnProperty(p)` check wouldn't be worth it here, since this
            // is performance sensitive, and enumerable `Object.prototype` or `RegExp.prototype`
            // extensions exist on `regex.prototype` anyway
            regex[p] = XRegExp.prototype[p];
        }
    }

    regex[REGEX_DATA].source = xSource;
    // Emulate the ES6 `flags` prop by ensuring flags are in alphabetical order
    regex[REGEX_DATA].flags = xFlags ? xFlags.split('').sort().join('') : xFlags;

    return regex;
}

/**
 * Removes any duplicate characters from the provided string.
 *
 * @private
 * @param {String} str String to remove duplicate characters from.
 * @returns {string} String with any duplicate characters removed.
 */
function clipDuplicates(str) {
    return str.replace(/([\s\S])(?=[\s\S]*\1)/g, '');
}

/**
 * Copies a regex object while preserving extended data and augmenting with `XRegExp.prototype`
 * properties. The copy has a fresh `lastIndex` property (set to zero). Allows adding and removing
 * flags g and y while copying the regex.
 *
 * @private
 * @param {RegExp} regex Regex to copy.
 * @param {Object} [options] Options object with optional properties:
 *   - `addG` {Boolean} Add flag g while copying the regex.
 *   - `addY` {Boolean} Add flag y while copying the regex.
 *   - `removeG` {Boolean} Remove flag g while copying the regex.
 *   - `removeY` {Boolean} Remove flag y while copying the regex.
 *   - `isInternalOnly` {Boolean} Whether the copied regex will be used only for internal
 *     operations, and never exposed to users. For internal-only regexes, we can improve perf by
 *     skipping some operations like attaching `XRegExp.prototype` properties.
 *   - `source` {String} Overrides `<regex>.source`, for special cases.
 * @returns {RegExp} Copy of the provided regex, possibly with modified flags.
 */
function copyRegex(regex, options) {
    if (!XRegExp.isRegExp(regex)) {
        throw new TypeError('Type RegExp expected');
    }

    const xData = regex[REGEX_DATA] || {};
    let flags = getNativeFlags(regex);
    let flagsToAdd = '';
    let flagsToRemove = '';
    let xregexpSource = null;
    let xregexpFlags = null;

    options = options || {};

    if (options.removeG) {flagsToRemove += 'g';}
    if (options.removeY) {flagsToRemove += 'y';}
    if (flagsToRemove) {
        flags = flags.replace(new RegExp(`[${flagsToRemove}]+`, 'g'), '');
    }

    if (options.addG) {flagsToAdd += 'g';}
    if (options.addY) {flagsToAdd += 'y';}
    if (flagsToAdd) {
        flags = clipDuplicates(flags + flagsToAdd);
    }

    if (!options.isInternalOnly) {
        if (xData.source !== undefined) {
            xregexpSource = xData.source;
        }
        // null or undefined; don't want to add to `flags` if the previous value was null, since
        // that indicates we're not tracking original precompilation flags
        if (xData.flags != null) {
            // Flags are only added for non-internal regexes by `XRegExp.globalize`. Flags are never
            // removed for non-internal regexes, so don't need to handle it
            xregexpFlags = flagsToAdd ? clipDuplicates(xData.flags + flagsToAdd) : xData.flags;
        }
    }

    // Augment with `XRegExp.prototype` properties, but use the native `RegExp` constructor to avoid
    // searching for special tokens. That would be wrong for regexes constructed by `RegExp`, and
    // unnecessary for regexes constructed by `XRegExp` because the regex has already undergone the
    // translation to native regex syntax
    regex = augment(
        new RegExp(options.source || regex.source, flags),
        hasNamedCapture(regex) ? xData.captureNames.slice(0) : null,
        xregexpSource,
        xregexpFlags,
        options.isInternalOnly
    );

    return regex;
}

/**
 * Converts hexadecimal to decimal.
 *
 * @private
 * @param {String} hex
 * @returns {number}
 */
function dec(hex) {
    return parseInt(hex, 16);
}

/**
 * Returns a pattern that can be used in a native RegExp in place of an ignorable token such as an
 * inline comment or whitespace with flag x. This is used directly as a token handler function
 * passed to `XRegExp.addToken`.
 *
 * @private
 * @param {String} match Match arg of `XRegExp.addToken` handler
 * @param {String} scope Scope arg of `XRegExp.addToken` handler
 * @param {String} flags Flags arg of `XRegExp.addToken` handler
 * @returns {string} Either '' or '(?:)', depending on which is needed in the context of the match.
 */
function getContextualTokenSeparator(match, scope, flags) {
    const matchEndPos = match.index + match[0].length;
    const precedingChar = match.input[match.index - 1];
    const followingChar = match.input[matchEndPos];
    if (
        // No need to separate tokens if at the beginning or end of a group, before or after a
        // group, or before or after a `|`
        /^[()|]$/.test(precedingChar) ||
        /^[()|]$/.test(followingChar) ||
        // No need to separate tokens if at the beginning or end of the pattern
        match.index === 0 ||
        matchEndPos === match.input.length ||
        // No need to separate tokens if at the beginning of a noncapturing group or lookaround.
        // Looks only at the last 4 chars (at most) for perf when constructing long regexes.
        /\(\?(?:[:=!]|<[=!])$/.test(match.input.substring(match.index - 4, match.index)) ||
        // Avoid separating tokens when the following token is a quantifier
        isQuantifierNext(match.input, matchEndPos, flags)
    ) {
        return '';
    }
    // Keep tokens separated. This avoids e.g. inadvertedly changing `\1 1` or `\1(?#)1` to `\11`.
    // This also ensures all tokens remain as discrete atoms, e.g. it prevents converting the
    // syntax error `(? :` into `(?:`.
    return '(?:)';
}

/**
 * Returns native `RegExp` flags used by a regex object.
 *
 * @private
 * @param {RegExp} regex Regex to check.
 * @returns {string} Native flags in use.
 */
function getNativeFlags(regex) {
    return hasFlagsProp ?
        regex.flags :
        // Explicitly using `RegExp.prototype.toString` (rather than e.g. `String` or concatenation
        // with an empty string) allows this to continue working predictably when
        // `XRegExp.proptotype.toString` is overridden
        /\/([a-z]*)$/i.exec(RegExp.prototype.toString.call(regex))[1];
}

/**
 * Determines whether a regex has extended instance data used to track capture names.
 *
 * @private
 * @param {RegExp} regex Regex to check.
 * @returns {boolean} Whether the regex uses named capture.
 */
function hasNamedCapture(regex) {
    return !!(regex[REGEX_DATA] && regex[REGEX_DATA].captureNames);
}

/**
 * Converts decimal to hexadecimal.
 *
 * @private
 * @param {Number|String} dec
 * @returns {string}
 */
function hex(dec) {
    return parseInt(dec, 10).toString(16);
}

/**
 * Checks whether the next nonignorable token after the specified position is a quantifier.
 *
 * @private
 * @param {String} pattern Pattern to search within.
 * @param {Number} pos Index in `pattern` to search at.
 * @param {String} flags Flags used by the pattern.
 * @returns {Boolean} Whether the next nonignorable token is a quantifier.
 */
function isQuantifierNext(pattern, pos, flags) {
    const inlineCommentPattern = '\\(\\?#[^)]*\\)';
    const lineCommentPattern = '#[^#\\n]*';
    const quantifierPattern = '[?*+]|{\\d+(?:,\\d*)?}';
    const regex = flags.includes('x') ?
        // Ignore any leading whitespace, line comments, and inline comments
        new RegExp(`^(?:\\s|${lineCommentPattern}|${inlineCommentPattern})*(?:${quantifierPattern})`) :
        // Ignore any leading inline comments
        new RegExp(`^(?:${inlineCommentPattern})*(?:${quantifierPattern})`);
    return regex.test(pattern.slice(pos));
}

/**
 * Determines whether a value is of the specified type, by resolving its internal [[Class]].
 *
 * @private
 * @param {*} value Object to check.
 * @param {String} type Type to check for, in TitleCase.
 * @returns {boolean} Whether the object matches the type.
 */
function isType(value, type) {
    return Object.prototype.toString.call(value) === `[object ${type}]`;
}

/**
 * Returns the object, or throws an error if it is `null` or `undefined`. This is used to follow
 * the ES5 abstract operation `ToObject`.
 *
 * @private
 * @param {*} value Object to check and return.
 * @returns {*} The provided object.
 */
function nullThrows(value) {
    // null or undefined
    if (value == null) {
        throw new TypeError('Cannot convert null or undefined to object');
    }

    return value;
}

/**
 * Adds leading zeros if shorter than four characters. Used for fixed-length hexadecimal values.
 *
 * @private
 * @param {String} str
 * @returns {string}
 */
function pad4(str) {
    while (str.length < 4) {
        str = `0${str}`;
    }
    return str;
}

/**
 * Checks for flag-related errors, and strips/applies flags in a leading mode modifier. Offloads
 * the flag preparation logic from the `XRegExp` constructor.
 *
 * @private
 * @param {String} pattern Regex pattern, possibly with a leading mode modifier.
 * @param {String} flags Any combination of flags.
 * @returns {!Object} Object with properties `pattern` and `flags`.
 */
function prepareFlags(pattern, flags) {
    // Recent browsers throw on duplicate flags, so copy this behavior for nonnative flags
    if (clipDuplicates(flags) !== flags) {
        throw new SyntaxError(`Invalid duplicate regex flag ${flags}`);
    }

    // Strip and apply a leading mode modifier with any combination of flags except `dgy`
    pattern = pattern.replace(/^\(\?([\w$]+)\)/, ($0, $1) => {
        if (/[dgy]/.test($1)) {
            throw new SyntaxError(`Cannot use flags dgy in mode modifier ${$0}`);
        }
        // Allow duplicate flags within the mode modifier
        flags = clipDuplicates(flags + $1);
        return '';
    });

    // Throw on unknown native or nonnative flags
    for (const flag of flags) {
        if (!registeredFlags[flag]) {
            throw new SyntaxError(`Unknown regex flag ${flag}`);
        }
    }

    return {
        pattern,
        flags
    };
}

/**
 * Prepares an options object from the given value.
 *
 * @private
 * @param {String|Object} value Value to convert to an options object.
 * @returns {Object} Options object.
 */
function prepareOptions(value) {
    const options = {};

    if (isType(value, 'String')) {
        XRegExp.forEach(value, /[^\s,]+/, (match) => {
            options[match] = true;
        });

        return options;
    }

    return value;
}

/**
 * Registers a flag so it doesn't throw an 'unknown flag' error.
 *
 * @private
 * @param {String} flag Single-character flag to register.
 */
function registerFlag(flag) {
    if (!/^[\w$]$/.test(flag)) {
        throw new Error('Flag must be a single character A-Za-z0-9_$');
    }

    registeredFlags[flag] = true;
}

/**
 * Runs built-in and custom regex syntax tokens in reverse insertion order at the specified
 * position, until a match is found.
 *
 * @private
 * @param {String} pattern Original pattern from which an XRegExp object is being built.
 * @param {String} flags Flags being used to construct the regex.
 * @param {Number} pos Position to search for tokens within `pattern`.
 * @param {Number} scope Regex scope to apply: 'default' or 'class'.
 * @param {Object} context Context object to use for token handler functions.
 * @returns {Object} Object with properties `matchLength`, `output`, and `reparse`; or `null`.
 */
function runTokens(pattern, flags, pos, scope, context) {
    let i = tokens.length;
    const leadChar = pattern[pos];
    let result = null;
    let match;
    let t;

    // Run in reverse insertion order
    while (i--) {
        t = tokens[i];
        if (
            (t.leadChar && t.leadChar !== leadChar) ||
            (t.scope !== scope && t.scope !== 'all') ||
            (t.flag && !flags.includes(t.flag))
        ) {
            continue;
        }

        match = XRegExp.exec(pattern, t.regex, pos, 'sticky');
        if (match) {
            result = {
                matchLength: match[0].length,
                output: t.handler.call(context, match, scope, flags),
                reparse: t.reparse
            };
            // Finished with token tests
            break;
        }
    }

    return result;
}

/**
 * Enables or disables implicit astral mode opt-in. When enabled, flag A is automatically added to
 * all new regexes created by XRegExp. This causes an error to be thrown when creating regexes if
 * the Unicode Base addon is not available, since flag A is registered by that addon.
 *
 * @private
 * @param {Boolean} on `true` to enable; `false` to disable.
 */
function setAstral(on) {
    features.astral = on;
}

/**
 * Adds named capture groups to the `groups` property of match arrays. See here for details:
 * https://github.com/tc39/proposal-regexp-named-groups
 *
 * @private
 * @param {Boolean} on `true` to enable; `false` to disable.
 */
function setNamespacing(on) {
    features.namespacing = on;
}

// ==--------------------------==
// Constructor
// ==--------------------------==

/**
 * Creates an extended regular expression object for matching text with a pattern. Differs from a
 * native regular expression in that additional syntax and flags are supported. The returned object
 * is in fact a native `RegExp` and works with all native methods.
 *
 * @class XRegExp
 * @constructor
 * @param {String|RegExp} pattern Regex pattern string, or an existing regex object to copy.
 * @param {String} [flags] Any combination of flags.
 *   Native flags:
 *     - `d` - indices for capturing groups (ES2021)
 *     - `g` - global
 *     - `i` - ignore case
 *     - `m` - multiline anchors
 *     - `u` - unicode (ES6)
 *     - `y` - sticky (Firefox 3+, ES6)
 *   Additional XRegExp flags:
 *     - `n` - named capture only
 *     - `s` - dot matches all (aka singleline) - works even when not natively supported
 *     - `x` - free-spacing and line comments (aka extended)
 *     - `A` - 21-bit Unicode properties (aka astral) - requires the Unicode Base addon
 *   Flags cannot be provided when constructing one `RegExp` from another.
 * @returns {RegExp} Extended regular expression object.
 * @example
 *
 * // With named capture and flag x
 * XRegExp(`(?<year>  [0-9]{4} ) -?  # year
 *          (?<month> [0-9]{2} ) -?  # month
 *          (?<day>   [0-9]{2} )     # day`, 'x');
 *
 * // Providing a regex object copies it. Native regexes are recompiled using native (not XRegExp)
 * // syntax. Copies maintain extended data, are augmented with `XRegExp.prototype` properties, and
 * // have fresh `lastIndex` properties (set to zero).
 * XRegExp(/regex/);
 */
function XRegExp(pattern, flags) {
    if (XRegExp.isRegExp(pattern)) {
        if (flags !== undefined) {
            throw new TypeError('Cannot supply flags when copying a RegExp');
        }
        return copyRegex(pattern);
    }

    // Copy the argument behavior of `RegExp`
    pattern = pattern === undefined ? '' : String(pattern);
    flags = flags === undefined ? '' : String(flags);

    if (XRegExp.isInstalled('astral') && !flags.includes('A')) {
        // This causes an error to be thrown if the Unicode Base addon is not available
        flags += 'A';
    }

    if (!patternCache[pattern]) {
        patternCache[pattern] = {};
    }

    if (!patternCache[pattern][flags]) {
        const context = {
            hasNamedCapture: false,
            captureNames: []
        };
        let scope = defaultScope;
        let output = '';
        let pos = 0;
        let result;

        // Check for flag-related errors, and strip/apply flags in a leading mode modifier
        const applied = prepareFlags(pattern, flags);
        let appliedPattern = applied.pattern;
        const appliedFlags = applied.flags;

        // Use XRegExp's tokens to translate the pattern to a native regex pattern.
        // `appliedPattern.length` may change on each iteration if tokens use `reparse`
        while (pos < appliedPattern.length) {
            do {
                // Check for custom tokens at the current position
                result = runTokens(appliedPattern, appliedFlags, pos, scope, context);
                // If the matched token used the `reparse` option, splice its output into the
                // pattern before running tokens again at the same position
                if (result && result.reparse) {
                    appliedPattern = appliedPattern.slice(0, pos) +
                        result.output +
                        appliedPattern.slice(pos + result.matchLength);
                }
            } while (result && result.reparse);

            if (result) {
                output += result.output;
                pos += (result.matchLength || 1);
            } else {
                // Get the native token at the current position
                const [token] = XRegExp.exec(appliedPattern, nativeTokens[scope], pos, 'sticky');
                output += token;
                pos += token.length;
                if (token === '[' && scope === defaultScope) {
                    scope = classScope;
                } else if (token === ']' && scope === classScope) {
                    scope = defaultScope;
                }
            }
        }

        patternCache[pattern][flags] = {
            // Use basic cleanup to collapse repeated empty groups like `(?:)(?:)` to `(?:)`. Empty
            // groups are sometimes inserted during regex transpilation in order to keep tokens
            // separated. However, more than one empty group in a row is never needed.
            pattern: output.replace(/(?:\(\?:\))+/g, '(?:)'),
            // Strip all but native flags
            flags: appliedFlags.replace(nonnativeFlags, ''),
            // `context.captureNames` has an item for each capturing group, even if unnamed
            captures: context.hasNamedCapture ? context.captureNames : null
        };
    }

    const generated = patternCache[pattern][flags];
    return augment(
        new RegExp(generated.pattern, generated.flags),
        generated.captures,
        pattern,
        flags
    );
}

// Add `RegExp.prototype` to the prototype chain
XRegExp.prototype = new RegExp();

// ==--------------------------==
// Public properties
// ==--------------------------==

/**
 * The XRegExp version number as a string containing three dot-separated parts. For example,
 * '2.0.0-beta-3'.
 *
 * @static
 * @memberOf XRegExp
 * @type String
 */
XRegExp.version = '5.1.2';

// ==--------------------------==
// Public methods
// ==--------------------------==

// Intentionally undocumented; used in tests and addons
XRegExp._clipDuplicates = clipDuplicates;
XRegExp._hasNativeFlag = hasNativeFlag;
XRegExp._dec = dec;
XRegExp._hex = hex;
XRegExp._pad4 = pad4;

/**
 * Extends XRegExp syntax and allows custom flags. This is used internally and can be used to
 * create XRegExp addons. If more than one token can match the same string, the last added wins.
 *
 * @memberOf XRegExp
 * @param {RegExp} regex Regex object that matches the new token.
 * @param {Function} handler Function that returns a new pattern string (using native regex syntax)
 *   to replace the matched token within all future XRegExp regexes. Has access to persistent
 *   properties of the regex being built, through `this`. Invoked with three arguments:
 *   - The match array, with named backreference properties.
 *   - The regex scope where the match was found: 'default' or 'class'.
 *   - The flags used by the regex, including any flags in a leading mode modifier.
 *   The handler function becomes part of the XRegExp construction process, so be careful not to
 *   construct XRegExps within the function or you will trigger infinite recursion.
 * @param {Object} [options] Options object with optional properties:
 *   - `scope` {String} Scope where the token applies: 'default', 'class', or 'all'.
 *   - `flag` {String} Single-character flag that triggers the token. This also registers the
 *     flag, which prevents XRegExp from throwing an 'unknown flag' error when the flag is used.
 *   - `optionalFlags` {String} Any custom flags checked for within the token `handler` that are
 *     not required to trigger the token. This registers the flags, to prevent XRegExp from
 *     throwing an 'unknown flag' error when any of the flags are used.
 *   - `reparse` {Boolean} Whether the `handler` function's output should not be treated as
 *     final, and instead be reparseable by other tokens (including the current token). Allows
 *     token chaining or deferring.
 *   - `leadChar` {String} Single character that occurs at the beginning of any successful match
 *     of the token (not always applicable). This doesn't change the behavior of the token unless
 *     you provide an erroneous value. However, providing it can increase the token's performance
 *     since the token can be skipped at any positions where this character doesn't appear.
 * @example
 *
 * // Basic usage: Add \a for the ALERT control code
 * XRegExp.addToken(
 *   /\\a/,
 *   () => '\\x07',
 *   {scope: 'all'}
 * );
 * XRegExp('\\a[\\a-\\n]+').test('\x07\n\x07'); // -> true
 *
 * // Add the U (ungreedy) flag from PCRE and RE2, which reverses greedy and lazy quantifiers.
 * // Since `scope` is not specified, it uses 'default' (i.e., transformations apply outside of
 * // character classes only)
 * XRegExp.addToken(
 *   /([?*+]|{\d+(?:,\d*)?})(\??)/,
 *   (match) => `${match[1]}${match[2] ? '' : '?'}`,
 *   {flag: 'U'}
 * );
 * XRegExp('a+', 'U').exec('aaa')[0]; // -> 'a'
 * XRegExp('a+?', 'U').exec('aaa')[0]; // -> 'aaa'
 */
XRegExp.addToken = (regex, handler, options) => {
    options = options || {};
    let {optionalFlags} = options;

    if (options.flag) {
        registerFlag(options.flag);
    }

    if (optionalFlags) {
        optionalFlags = optionalFlags.split('');
        for (const flag of optionalFlags) {
            registerFlag(flag);
        }
    }

    // Add to the private list of syntax tokens
    tokens.push({
        regex: copyRegex(regex, {
            addG: true,
            addY: hasNativeY,
            isInternalOnly: true
        }),
        handler,
        scope: options.scope || defaultScope,
        flag: options.flag,
        reparse: options.reparse,
        leadChar: options.leadChar
    });

    // Reset the pattern cache used by the `XRegExp` constructor, since the same pattern and flags
    // might now produce different results
    XRegExp.cache.flush('patterns');
};

/**
 * Caches and returns the result of calling `XRegExp(pattern, flags)`. On any subsequent call with
 * the same pattern and flag combination, the cached copy of the regex is returned.
 *
 * @memberOf XRegExp
 * @param {String} pattern Regex pattern string.
 * @param {String} [flags] Any combination of XRegExp flags.
 * @returns {RegExp} Cached XRegExp object.
 * @example
 *
 * let match;
 * while (match = XRegExp.cache('.', 'gs').exec('abc')) {
 *   // The regex is compiled once only
 * }
 */
XRegExp.cache = (pattern, flags) => {
    if (!regexCache[pattern]) {
        regexCache[pattern] = {};
    }
    return regexCache[pattern][flags] || (
        regexCache[pattern][flags] = XRegExp(pattern, flags)
    );
};

// Intentionally undocumented; used in tests
XRegExp.cache.flush = (cacheName) => {
    if (cacheName === 'patterns') {
        // Flush the pattern cache used by the `XRegExp` constructor
        patternCache = Object.create(null);
    } else {
        // Flush the regex cache populated by `XRegExp.cache`
        regexCache = Object.create(null);
    }
};

/**
 * Escapes any regular expression metacharacters, for use when matching literal strings. The result
 * can safely be used at any position within a regex that uses any flags.
 *
 * @memberOf XRegExp
 * @param {String} str String to escape.
 * @returns {string} String with regex metacharacters escaped.
 * @example
 *
 * XRegExp.escape('Escaped? <.>');
 * // -> 'Escaped\?\u0020<\.>'
 */
// Following are the contexts where each metacharacter needs to be escaped because it would
// otherwise have a special meaning, change the meaning of surrounding characters, or cause an
// error. Context 'default' means outside character classes only.
// - `\` - context: all
// - `[()*+?.$|` - context: default
// - `]` - context: default with flag u or if forming the end of a character class
// - `{}` - context: default with flag u or if part of a valid/complete quantifier pattern
// - `,` - context: default if in a position that causes an unescaped `{` to turn into a quantifier.
//   Ex: `/^a{1\,2}$/` matches `'a{1,2}'`, but `/^a{1,2}$/` matches `'a'` or `'aa'`
// - `#` and <whitespace> - context: default with flag x
// - `^` - context: default, and context: class if it's the first character in the class
// - `-` - context: class if part of a valid character class range
XRegExp.escape = (str) => String(nullThrows(str)).
    // Escape most special chars with a backslash
    replace(/[\\\[\]{}()*+?.^$|]/g, '\\$&').
    // Convert to \uNNNN for special chars that can't be escaped when used with ES6 flag `u`
    replace(/[\s#\-,]/g, (match) => `\\u${pad4(hex(match.charCodeAt(0)))}`);

/**
 * Executes a regex search in a specified string. Returns a match array or `null`. If the provided
 * regex uses named capture, named capture properties are included on the match array's `groups`
 * property. Optional `pos` and `sticky` arguments specify the search start position, and whether
 * the match must start at the specified position only. The `lastIndex` property of the provided
 * regex is not used, but is updated for compatibility. Also fixes browser bugs compared to the
 * native `RegExp.prototype.exec` and can be used reliably cross-browser.
 *
 * @memberOf XRegExp
 * @param {String} str String to search.
 * @param {RegExp} regex Regex to search with.
 * @param {Number} [pos=0] Zero-based index at which to start the search.
 * @param {Boolean|String} [sticky=false] Whether the match must start at the specified position
 *   only. The string `'sticky'` is accepted as an alternative to `true`.
 * @returns {Array} Match array with named capture properties on the `groups` object, or `null`. If
 *   the `namespacing` feature is off, named capture properties are directly on the match array.
 * @example
 *
 * // Basic use, with named capturing group
 * let match = XRegExp.exec('U+2620', XRegExp('U\\+(?<hex>[0-9A-F]{4})'));
 * match.groups.hex; // -> '2620'
 *
 * // With pos and sticky, in a loop
 * let pos = 3, result = [], match;
 * while (match = XRegExp.exec('<1><2><3><4>5<6>', /<(\d)>/, pos, 'sticky')) {
 *   result.push(match[1]);
 *   pos = match.index + match[0].length;
 * }
 * // result -> ['2', '3', '4']
 */
XRegExp.exec = (str, regex, pos, sticky) => {
    let cacheKey = 'g';
    let addY = false;
    let fakeY = false;
    let match;

    addY = hasNativeY && !!(sticky || (regex.sticky && sticky !== false));
    if (addY) {
        cacheKey += 'y';
    } else if (sticky) {
        // Simulate sticky matching by appending an empty capture to the original regex. The
        // resulting regex will succeed no matter what at the current index (set with `lastIndex`),
        // and will not search the rest of the subject string. We'll know that the original regex
        // has failed if that last capture is `''` rather than `undefined` (i.e., if that last
        // capture participated in the match).
        fakeY = true;
        cacheKey += 'FakeY';
    }

    regex[REGEX_DATA] = regex[REGEX_DATA] || {};

    // Shares cached copies with `XRegExp.match`/`replace`
    const r2 = regex[REGEX_DATA][cacheKey] || (
        regex[REGEX_DATA][cacheKey] = copyRegex(regex, {
            addG: true,
            addY,
            source: fakeY ? `${regex.source}|()` : undefined,
            removeY: sticky === false,
            isInternalOnly: true
        })
    );

    pos = pos || 0;
    r2.lastIndex = pos;

    // Fixed `exec` required for `lastIndex` fix, named backreferences, etc.
    match = fixed.exec.call(r2, str);

    // Get rid of the capture added by the pseudo-sticky matcher if needed. An empty string means
    // the original regexp failed (see above).
    if (fakeY && match && match.pop() === '') {
        match = null;
    }

    if (regex.global) {
        regex.lastIndex = match ? r2.lastIndex : 0;
    }

    return match;
};

/**
 * Executes a provided function once per regex match. Searches always start at the beginning of the
 * string and continue until the end, regardless of the state of the regex's `global` property and
 * initial `lastIndex`.
 *
 * @memberOf XRegExp
 * @param {String} str String to search.
 * @param {RegExp} regex Regex to search with.
 * @param {Function} callback Function to execute for each match. Invoked with four arguments:
 *   - The match array, with named backreference properties.
 *   - The zero-based match index.
 *   - The string being traversed.
 *   - The regex object being used to traverse the string.
 * @example
 *
 * // Extracts every other digit from a string
 * const evens = [];
 * XRegExp.forEach('1a2345', /\d/, (match, i) => {
 *   if (i % 2) evens.push(+match[0]);
 * });
 * // evens -> [2, 4]
 */
XRegExp.forEach = (str, regex, callback) => {
    let pos = 0;
    let i = -1;
    let match;

    while ((match = XRegExp.exec(str, regex, pos))) {
        // Because `regex` is provided to `callback`, the function could use the deprecated/
        // nonstandard `RegExp.prototype.compile` to mutate the regex. However, since `XRegExp.exec`
        // doesn't use `lastIndex` to set the search position, this can't lead to an infinite loop,
        // at least. Actually, because of the way `XRegExp.exec` caches globalized versions of
        // regexes, mutating the regex will not have any effect on the iteration or matched strings,
        // which is a nice side effect that brings extra safety.
        callback(match, ++i, str, regex);

        pos = match.index + (match[0].length || 1);
    }
};

/**
 * Copies a regex object and adds flag `g`. The copy maintains extended data, is augmented with
 * `XRegExp.prototype` properties, and has a fresh `lastIndex` property (set to zero). Native
 * regexes are not recompiled using XRegExp syntax.
 *
 * @memberOf XRegExp
 * @param {RegExp} regex Regex to globalize.
 * @returns {RegExp} Copy of the provided regex with flag `g` added.
 * @example
 *
 * const globalCopy = XRegExp.globalize(/regex/);
 * globalCopy.global; // -> true
 */
XRegExp.globalize = (regex) => copyRegex(regex, {addG: true});

/**
 * Installs optional features according to the specified options. Can be undone using
 * `XRegExp.uninstall`.
 *
 * @memberOf XRegExp
 * @param {Object|String} options Options object or string.
 * @example
 *
 * // With an options object
 * XRegExp.install({
 *   // Enables support for astral code points in Unicode addons (implicitly sets flag A)
 *   astral: true,
 *
 *   // Adds named capture groups to the `groups` property of matches
 *   namespacing: true
 * });
 *
 * // With an options string
 * XRegExp.install('astral namespacing');
 */
XRegExp.install = (options) => {
    options = prepareOptions(options);

    if (!features.astral && options.astral) {
        setAstral(true);
    }

    if (!features.namespacing && options.namespacing) {
        setNamespacing(true);
    }
};

/**
 * Checks whether an individual optional feature is installed.
 *
 * @memberOf XRegExp
 * @param {String} feature Name of the feature to check. One of:
 *   - `astral`
 *   - `namespacing`
 * @returns {boolean} Whether the feature is installed.
 * @example
 *
 * XRegExp.isInstalled('astral');
 */
XRegExp.isInstalled = (feature) => !!(features[feature]);

/**
 * Returns `true` if an object is a regex; `false` if it isn't. This works correctly for regexes
 * created in another frame, when `instanceof` and `constructor` checks would fail.
 *
 * @memberOf XRegExp
 * @param {*} value Object to check.
 * @returns {boolean} Whether the object is a `RegExp` object.
 * @example
 *
 * XRegExp.isRegExp('string'); // -> false
 * XRegExp.isRegExp(/regex/i); // -> true
 * XRegExp.isRegExp(RegExp('^', 'm')); // -> true
 * XRegExp.isRegExp(XRegExp('(?s).')); // -> true
 */
XRegExp.isRegExp = (value) => Object.prototype.toString.call(value) === '[object RegExp]';
// Same as `isType(value, 'RegExp')`, but avoiding that function call here for perf since
// `isRegExp` is used heavily by internals including regex construction

/**
 * Returns the first matched string, or in global mode, an array containing all matched strings.
 * This is essentially a more convenient re-implementation of `String.prototype.match` that gives
 * the result types you actually want (string instead of `exec`-style array in match-first mode,
 * and an empty array instead of `null` when no matches are found in match-all mode). It also lets
 * you override flag g and ignore `lastIndex`, and fixes browser bugs.
 *
 * @memberOf XRegExp
 * @param {String} str String to search.
 * @param {RegExp} regex Regex to search with.
 * @param {String} [scope='one'] Use 'one' to return the first match as a string. Use 'all' to
 *   return an array of all matched strings. If not explicitly specified and `regex` uses flag g,
 *   `scope` is 'all'.
 * @returns {String|Array} In match-first mode: First match as a string, or `null`. In match-all
 *   mode: Array of all matched strings, or an empty array.
 * @example
 *
 * // Match first
 * XRegExp.match('abc', /\w/); // -> 'a'
 * XRegExp.match('abc', /\w/g, 'one'); // -> 'a'
 * XRegExp.match('abc', /x/g, 'one'); // -> null
 *
 * // Match all
 * XRegExp.match('abc', /\w/g); // -> ['a', 'b', 'c']
 * XRegExp.match('abc', /\w/, 'all'); // -> ['a', 'b', 'c']
 * XRegExp.match('abc', /x/, 'all'); // -> []
 */
XRegExp.match = (str, regex, scope) => {
    const global = (regex.global && scope !== 'one') || scope === 'all';
    const cacheKey = ((global ? 'g' : '') + (regex.sticky ? 'y' : '')) || 'noGY';

    regex[REGEX_DATA] = regex[REGEX_DATA] || {};

    // Shares cached copies with `XRegExp.exec`/`replace`
    const r2 = regex[REGEX_DATA][cacheKey] || (
        regex[REGEX_DATA][cacheKey] = copyRegex(regex, {
            addG: !!global,
            removeG: scope === 'one',
            isInternalOnly: true
        })
    );

    const result = String(nullThrows(str)).match(r2);

    if (regex.global) {
        regex.lastIndex = (
            (scope === 'one' && result) ?
                // Can't use `r2.lastIndex` since `r2` is nonglobal in this case
                (result.index + result[0].length) : 0
        );
    }

    return global ? (result || []) : (result && result[0]);
};

/**
 * Retrieves the matches from searching a string using a chain of regexes that successively search
 * within previous matches. The provided `chain` array can contain regexes and or objects with
 * `regex` and `backref` properties. When a backreference is specified, the named or numbered
 * backreference is passed forward to the next regex or returned.
 *
 * @memberOf XRegExp
 * @param {String} str String to search.
 * @param {Array} chain Regexes that each search for matches within preceding results.
 * @returns {Array} Matches by the last regex in the chain, or an empty array.
 * @example
 *
 * // Basic usage; matches numbers within <b> tags
 * XRegExp.matchChain('1 <b>2</b> 3 <b>4 a 56</b>', [
 *   XRegExp('(?is)<b>.*?</b>'),
 *   /\d+/
 * ]);
 * // -> ['2', '4', '56']
 *
 * // Passing forward and returning specific backreferences
 * const html = `<a href="http://xregexp.com/api/">XRegExp</a>
 *               <a href="http://www.google.com/">Google</a>`;
 * XRegExp.matchChain(html, [
 *   {regex: /<a href="([^"]+)">/i, backref: 1},
 *   {regex: XRegExp('(?i)^https?://(?<domain>[^/?#]+)'), backref: 'domain'}
 * ]);
 * // -> ['xregexp.com', 'www.google.com']
 */
XRegExp.matchChain = (str, chain) => (function recurseChain(values, level) {
    const item = chain[level].regex ? chain[level] : {regex: chain[level]};
    const matches = [];

    function addMatch(match) {
        if (item.backref) {
            const ERR_UNDEFINED_GROUP = `Backreference to undefined group: ${item.backref}`;
            const isNamedBackref = isNaN(item.backref);

            if (isNamedBackref && XRegExp.isInstalled('namespacing')) {
                // `groups` has `null` as prototype, so using `in` instead of `hasOwnProperty`
                if (!(match.groups && item.backref in match.groups)) {
                    throw new ReferenceError(ERR_UNDEFINED_GROUP);
                }
            } else if (!match.hasOwnProperty(item.backref)) {
                throw new ReferenceError(ERR_UNDEFINED_GROUP);
            }

            const backrefValue = isNamedBackref && XRegExp.isInstalled('namespacing') ?
                match.groups[item.backref] :
                match[item.backref];

            matches.push(backrefValue || '');
        } else {
            matches.push(match[0]);
        }
    }

    for (const value of values) {
        XRegExp.forEach(value, item.regex, addMatch);
    }

    return ((level === chain.length - 1) || !matches.length) ?
        matches :
        recurseChain(matches, level + 1);
}([str], 0));

/**
 * Returns a new string with one or all matches of a pattern replaced. The pattern can be a string
 * or regex, and the replacement can be a string or a function to be called for each match. To
 * perform a global search and replace, use the optional `scope` argument or include flag g if using
 * a regex. Replacement strings can use `$<n>` or `${n}` for named and numbered backreferences.
 * Replacement functions can use named backreferences via the last argument. Also fixes browser bugs
 * compared to the native `String.prototype.replace` and can be used reliably cross-browser.
 *
 * @memberOf XRegExp
 * @param {String} str String to search.
 * @param {RegExp|String} search Search pattern to be replaced.
 * @param {String|Function} replacement Replacement string or a function invoked to create it.
 *   Replacement strings can include special replacement syntax:
 *     - $$ - Inserts a literal $ character.
 *     - $&, $0 - Inserts the matched substring.
 *     - $` - Inserts the string that precedes the matched substring (left context).
 *     - $' - Inserts the string that follows the matched substring (right context).
 *     - $n, $nn - Where n/nn are digits referencing an existing capturing group, inserts
 *       backreference n/nn.
 *     - $<n>, ${n} - Where n is a name or any number of digits that reference an existing capturing
 *       group, inserts backreference n.
 *   Replacement functions are invoked with three or more arguments:
 *     - args[0] - The matched substring (corresponds to `$&` above). If the `namespacing` feature
 *       is off, named backreferences are accessible as properties of this argument.
 *     - args[1..n] - One argument for each backreference (corresponding to `$1`, `$2`, etc. above).
 *       If the regex has no capturing groups, no arguments appear in this position.
 *     - args[n+1] - The zero-based index of the match within the entire search string.
 *     - args[n+2] - The total string being searched.
 *     - args[n+3] - If the the search pattern is a regex with named capturing groups, the last
 *       argument is the groups object. Its keys are the backreference names and its values are the
 *       backreference values. If the `namespacing` feature is off, this argument is not present.
 * @param {String} [scope] Use 'one' to replace the first match only, or 'all'. Defaults to 'one'.
 *   Defaults to 'all' if using a regex with flag g.
 * @returns {String} New string with one or all matches replaced.
 * @example
 *
 * // Regex search, using named backreferences in replacement string
 * const name = XRegExp('(?<first>\\w+) (?<last>\\w+)');
 * XRegExp.replace('John Smith', name, '$<last>, $<first>');
 * // -> 'Smith, John'
 *
 * // Regex search, using named backreferences in replacement function
 * XRegExp.replace('John Smith', name, (...args) => {
 *   const groups = args[args.length - 1];
 *   return `${groups.last}, ${groups.first}`;
 * });
 * // -> 'Smith, John'
 *
 * // String search, with replace-all
 * XRegExp.replace('RegExp builds RegExps', 'RegExp', 'XRegExp', 'all');
 * // -> 'XRegExp builds XRegExps'
 */
XRegExp.replace = (str, search, replacement, scope) => {
    const isRegex = XRegExp.isRegExp(search);
    const global = (search.global && scope !== 'one') || scope === 'all';
    const cacheKey = ((global ? 'g' : '') + (search.sticky ? 'y' : '')) || 'noGY';
    let s2 = search;

    if (isRegex) {
        search[REGEX_DATA] = search[REGEX_DATA] || {};

        // Shares cached copies with `XRegExp.exec`/`match`. Since a copy is used, `search`'s
        // `lastIndex` isn't updated *during* replacement iterations
        s2 = search[REGEX_DATA][cacheKey] || (
            search[REGEX_DATA][cacheKey] = copyRegex(search, {
                addG: !!global,
                removeG: scope === 'one',
                isInternalOnly: true
            })
        );
    } else if (global) {
        s2 = new RegExp(XRegExp.escape(String(search)), 'g');
    }

    // Fixed `replace` required for named backreferences, etc.
    const result = fixed.replace.call(nullThrows(str), s2, replacement);

    if (isRegex && search.global) {
        // Fixes IE, Safari bug (last tested IE 9, Safari 5.1)
        search.lastIndex = 0;
    }

    return result;
};

/**
 * Performs batch processing of string replacements. Used like `XRegExp.replace`, but accepts an
 * array of replacement details. Later replacements operate on the output of earlier replacements.
 * Replacement details are accepted as an array with a regex or string to search for, the
 * replacement string or function, and an optional scope of 'one' or 'all'. Uses the XRegExp
 * replacement text syntax, which supports named backreference properties via `$<name>` or
 * `${name}`.
 *
 * @memberOf XRegExp
 * @param {String} str String to search.
 * @param {Array} replacements Array of replacement detail arrays.
 * @returns {String} New string with all replacements.
 * @example
 *
 * str = XRegExp.replaceEach(str, [
 *   [XRegExp('(?<name>a)'), 'z$<name>'],
 *   [/b/gi, 'y'],
 *   [/c/g, 'x', 'one'], // scope 'one' overrides /g
 *   [/d/, 'w', 'all'],  // scope 'all' overrides lack of /g
 *   ['e', 'v', 'all'],  // scope 'all' allows replace-all for strings
 *   [/f/g, (match) => match.toUpperCase()]
 * ]);
 */
XRegExp.replaceEach = (str, replacements) => {
    for (const r of replacements) {
        str = XRegExp.replace(str, r[0], r[1], r[2]);
    }

    return str;
};

/**
 * Splits a string into an array of strings using a regex or string separator. Matches of the
 * separator are not included in the result array. However, if `separator` is a regex that contains
 * capturing groups, backreferences are spliced into the result each time `separator` is matched.
 * Fixes browser bugs compared to the native `String.prototype.split` and can be used reliably
 * cross-browser.
 *
 * @memberOf XRegExp
 * @param {String} str String to split.
 * @param {RegExp|String} separator Regex or string to use for separating the string.
 * @param {Number} [limit] Maximum number of items to include in the result array.
 * @returns {Array} Array of substrings.
 * @example
 *
 * // Basic use
 * XRegExp.split('a b c', ' ');
 * // -> ['a', 'b', 'c']
 *
 * // With limit
 * XRegExp.split('a b c', ' ', 2);
 * // -> ['a', 'b']
 *
 * // Backreferences in result array
 * XRegExp.split('..word1..', /([a-z]+)(\d+)/i);
 * // -> ['..', 'word', '1', '..']
 */
XRegExp.split = (str, separator, limit) => fixed.split.call(nullThrows(str), separator, limit);

/**
 * Executes a regex search in a specified string. Returns `true` or `false`. Optional `pos` and
 * `sticky` arguments specify the search start position, and whether the match must start at the
 * specified position only. The `lastIndex` property of the provided regex is not used, but is
 * updated for compatibility. Also fixes browser bugs compared to the native
 * `RegExp.prototype.test` and can be used reliably cross-browser.
 *
 * @memberOf XRegExp
 * @param {String} str String to search.
 * @param {RegExp} regex Regex to search with.
 * @param {Number} [pos=0] Zero-based index at which to start the search.
 * @param {Boolean|String} [sticky=false] Whether the match must start at the specified position
 *   only. The string `'sticky'` is accepted as an alternative to `true`.
 * @returns {boolean} Whether the regex matched the provided value.
 * @example
 *
 * // Basic use
 * XRegExp.test('abc', /c/); // -> true
 *
 * // With pos and sticky
 * XRegExp.test('abc', /c/, 0, 'sticky'); // -> false
 * XRegExp.test('abc', /c/, 2, 'sticky'); // -> true
 */
// Do this the easy way :-)
XRegExp.test = (str, regex, pos, sticky) => !!XRegExp.exec(str, regex, pos, sticky);

/**
 * Uninstalls optional features according to the specified options. Used to undo the actions of
 * `XRegExp.install`.
 *
 * @memberOf XRegExp
 * @param {Object|String} options Options object or string.
 * @example
 *
 * // With an options object
 * XRegExp.uninstall({
 *   // Disables support for astral code points in Unicode addons (unless enabled per regex)
 *   astral: true,
 *
 *   // Don't add named capture groups to the `groups` property of matches
 *   namespacing: true
 * });
 *
 * // With an options string
 * XRegExp.uninstall('astral namespacing');
 */
XRegExp.uninstall = (options) => {
    options = prepareOptions(options);

    if (features.astral && options.astral) {
        setAstral(false);
    }

    if (features.namespacing && options.namespacing) {
        setNamespacing(false);
    }
};

/**
 * Returns an XRegExp object that is the union of the given patterns. Patterns can be provided as
 * regex objects or strings. Metacharacters are escaped in patterns provided as strings.
 * Backreferences in provided regex objects are automatically renumbered to work correctly within
 * the larger combined pattern. Native flags used by provided regexes are ignored in favor of the
 * `flags` argument.
 *
 * @memberOf XRegExp
 * @param {Array} patterns Regexes and strings to combine.
 * @param {String} [flags] Any combination of XRegExp flags.
 * @param {Object} [options] Options object with optional properties:
 *   - `conjunction` {String} Type of conjunction to use: 'or' (default) or 'none'.
 * @returns {RegExp} Union of the provided regexes and strings.
 * @example
 *
 * XRegExp.union(['a+b*c', /(dogs)\1/, /(cats)\1/], 'i');
 * // -> /a\+b\*c|(dogs)\1|(cats)\2/i
 *
 * XRegExp.union([/man/, /bear/, /pig/], 'i', {conjunction: 'none'});
 * // -> /manbearpig/i
 */
XRegExp.union = (patterns, flags, options) => {
    options = options || {};
    const conjunction = options.conjunction || 'or';
    let numCaptures = 0;
    let numPriorCaptures;
    let captureNames;

    function rewrite(match, paren, backref) {
        const name = captureNames[numCaptures - numPriorCaptures];

        // Capturing group
        if (paren) {
            ++numCaptures;
            // If the current capture has a name, preserve the name
            if (name) {
                return `(?<${name}>`;
            }
        // Backreference
        } else if (backref) {
            // Rewrite the backreference
            return `\\${+backref + numPriorCaptures}`;
        }

        return match;
    }

    if (!(isType(patterns, 'Array') && patterns.length)) {
        throw new TypeError('Must provide a nonempty array of patterns to merge');
    }

    const parts = /(\()(?!\?)|\\([1-9]\d*)|\\[\s\S]|\[(?:[^\\\]]|\\[\s\S])*\]/g;
    const output = [];
    for (const pattern of patterns) {
        if (XRegExp.isRegExp(pattern)) {
            numPriorCaptures = numCaptures;
            captureNames = (pattern[REGEX_DATA] && pattern[REGEX_DATA].captureNames) || [];

            // Rewrite backreferences. Passing to XRegExp dies on octals and ensures patterns are
            // independently valid; helps keep this simple. Named captures are put back
            output.push(XRegExp(pattern.source).source.replace(parts, rewrite));
        } else {
            output.push(XRegExp.escape(pattern));
        }
    }

    const separator = conjunction === 'none' ? '' : '|';
    return XRegExp(output.join(separator), flags);
};

// ==--------------------------==
// Fixed/extended native methods
// ==--------------------------==

/**
 * Adds named capture support (with backreferences returned as `result.name`), and fixes browser
 * bugs in the native `RegExp.prototype.exec`. Use via `XRegExp.exec`.
 *
 * @memberOf RegExp
 * @param {String} str String to search.
 * @returns {Array} Match array with named backreference properties, or `null`.
 */
fixed.exec = function(str) {
    const origLastIndex = this.lastIndex;
    const match = RegExp.prototype.exec.apply(this, arguments);

    if (match) {
        // Fix browsers whose `exec` methods don't return `undefined` for nonparticipating capturing
        // groups. This fixes IE 5.5-8, but not IE 9's quirks mode or emulation of older IEs. IE 9
        // in standards mode follows the spec.
        if (!correctExecNpcg && match.length > 1 && match.includes('')) {
            const r2 = copyRegex(this, {
                removeG: true,
                isInternalOnly: true
            });
            // Using `str.slice(match.index)` rather than `match[0]` in case lookahead allowed
            // matching due to characters outside the match
            String(str).slice(match.index).replace(r2, (...args) => {
                const len = args.length;
                // Skip index 0 and the last 2
                for (let i = 1; i < len - 2; ++i) {
                    if (args[i] === undefined) {
                        match[i] = undefined;
                    }
                }
            });
        }

        // Attach named capture properties
        if (this[REGEX_DATA] && this[REGEX_DATA].captureNames) {
            let groupsObject = match;
            if (XRegExp.isInstalled('namespacing')) {
                // https://tc39.github.io/proposal-regexp-named-groups/#sec-regexpbuiltinexec
                match.groups = Object.create(null);
                groupsObject = match.groups;
            }
            // Skip index 0
            for (let i = 1; i < match.length; ++i) {
                const name = this[REGEX_DATA].captureNames[i - 1];
                if (name) {
                    groupsObject[name] = match[i];
                }
            }
        // Preserve any existing `groups` obj that came from native ES2018 named capture
        } else if (!match.groups && XRegExp.isInstalled('namespacing')) {
            match.groups = undefined;
        }

        // Fix browsers that increment `lastIndex` after zero-length matches
        if (this.global && !match[0].length && (this.lastIndex > match.index)) {
            this.lastIndex = match.index;
        }
    }

    if (!this.global) {
        // Fixes IE, Opera bug (last tested IE 9, Opera 11.6)
        this.lastIndex = origLastIndex;
    }

    return match;
};

/**
 * Fixes browser bugs in the native `RegExp.prototype.test`.
 *
 * @memberOf RegExp
 * @param {String} str String to search.
 * @returns {boolean} Whether the regex matched the provided value.
 */
fixed.test = function(str) {
    // Do this the easy way :-)
    return !!fixed.exec.call(this, str);
};

/**
 * Adds named capture support (with backreferences returned as `result.name`), and fixes browser
 * bugs in the native `String.prototype.match`.
 *
 * @memberOf String
 * @param {RegExp|*} regex Regex to search with. If not a regex object, it is passed to `RegExp`.
 * @returns {Array} If `regex` uses flag g, an array of match strings or `null`. Without flag g,
 *   the result of calling `regex.exec(this)`.
 */
fixed.match = function(regex) {
    if (!XRegExp.isRegExp(regex)) {
        // Use the native `RegExp` rather than `XRegExp`
        regex = new RegExp(regex);
    } else if (regex.global) {
        const result = String.prototype.match.apply(this, arguments);
        // Fixes IE bug
        regex.lastIndex = 0;

        return result;
    }

    return fixed.exec.call(regex, nullThrows(this));
};

/**
 * Adds support for `${n}` (or `$<n>`) tokens for named and numbered backreferences in replacement
 * text, and provides named backreferences to replacement functions as `arguments[0].name`. Also
 * fixes browser bugs in replacement text syntax when performing a replacement using a nonregex
 * search value, and the value of a replacement regex's `lastIndex` property during replacement
 * iterations and upon completion. Note that this doesn't support SpiderMonkey's proprietary third
 * (`flags`) argument. Use via `XRegExp.replace`.
 *
 * @memberOf String
 * @param {RegExp|String} search Search pattern to be replaced.
 * @param {String|Function} replacement Replacement string or a function invoked to create it.
 * @returns {string} New string with one or all matches replaced.
 */
fixed.replace = function(search, replacement) {
    const isRegex = XRegExp.isRegExp(search);
    let origLastIndex;
    let captureNames;
    let result;

    if (isRegex) {
        if (search[REGEX_DATA]) {
            ({captureNames} = search[REGEX_DATA]);
        }
        // Only needed if `search` is nonglobal
        origLastIndex = search.lastIndex;
    } else {
        search += ''; // Type-convert
    }

    // Don't use `typeof`; some older browsers return 'function' for regex objects
    if (isType(replacement, 'Function')) {
        // Stringifying `this` fixes a bug in IE < 9 where the last argument in replacement
        // functions isn't type-converted to a string
        result = String(this).replace(search, (...args) => {
            if (captureNames) {
                let groupsObject;

                if (XRegExp.isInstalled('namespacing')) {
                    // https://tc39.github.io/proposal-regexp-named-groups/#sec-regexpbuiltinexec
                    groupsObject = Object.create(null);
                    args.push(groupsObject);
                } else {
                    // Change the `args[0]` string primitive to a `String` object that can store
                    // properties. This really does need to use `String` as a constructor
                    args[0] = new String(args[0]);
                    [groupsObject] = args;
                }

                // Store named backreferences
                for (let i = 0; i < captureNames.length; ++i) {
                    if (captureNames[i]) {
                        groupsObject[captureNames[i]] = args[i + 1];
                    }
                }
            }
            // ES6 specs the context for replacement functions as `undefined`
            return replacement(...args);
        });
    } else {
        // Ensure that the last value of `args` will be a string when given nonstring `this`,
        // while still throwing on null or undefined context
        result = String(nullThrows(this)).replace(search, (...args) => {
            return String(replacement).replace(replacementToken, replacer);

            function replacer($0, bracketed, angled, dollarToken) {
                bracketed = bracketed || angled;

                // ES2018 added a new trailing `groups` arg that's passed to replacement functions
                // when the search regex uses native named capture
                const numNonCaptureArgs = isType(args[args.length - 1], 'Object') ? 4 : 3;
                const numCaptures = args.length - numNonCaptureArgs;

                // Handle named or numbered backreference with curly or angled braces: ${n}, $<n>
                if (bracketed) {
                    // Handle backreference to numbered capture, if `bracketed` is an integer. Use
                    // `0` for the entire match. Any number of leading zeros may be used.
                    if (/^\d+$/.test(bracketed)) {
                        // Type-convert and drop leading zeros
                        const n = +bracketed;
                        if (n <= numCaptures) {
                            return args[n] || '';
                        }
                    }

                    // Handle backreference to named capture. If the name does not refer to an
                    // existing capturing group, it's an error. Also handles the error for numbered
                    // backference that does not refer to an existing group.
                    // Using `indexOf` since having groups with the same name is already an error,
                    // otherwise would need `lastIndexOf`.
                    const n = captureNames ? captureNames.indexOf(bracketed) : -1;
                    if (n < 0) {
                        throw new SyntaxError(`Backreference to undefined group ${$0}`);
                    }
                    return args[n + 1] || '';
                }

                // Handle `$`-prefixed variable
                // Handle space/blank first because type conversion with `+` drops space padding
                // and converts spaces and empty strings to `0`
                if (dollarToken === '' || dollarToken === ' ') {
                    throw new SyntaxError(`Invalid token ${$0}`);
                }
                if (dollarToken === '&' || +dollarToken === 0) { // $&, $0 (not followed by 1-9), $00
                    return args[0];
                }
                if (dollarToken === '$') { // $$
                    return '$';
                }
                if (dollarToken === '`') { // $` (left context)
                    return args[args.length - 1].slice(0, args[args.length - 2]);
                }
                if (dollarToken === "'") { // $' (right context)
                    return args[args.length - 1].slice(args[args.length - 2] + args[0].length);
                }

                // Handle numbered backreference without braces
                // Type-convert and drop leading zero
                dollarToken = +dollarToken;
                // XRegExp behavior for `$n` and `$nn`:
                // - Backrefs end after 1 or 2 digits. Use `${..}` or `$<..>` for more digits.
                // - `$1` is an error if no capturing groups.
                // - `$10` is an error if less than 10 capturing groups. Use `${1}0` or `$<1>0`
                //   instead.
                // - `$01` is `$1` if at least one capturing group, else it's an error.
                // - `$0` (not followed by 1-9) and `$00` are the entire match.
                // Native behavior, for comparison:
                // - Backrefs end after 1 or 2 digits. Cannot reference capturing group 100+.
                // - `$1` is a literal `$1` if no capturing groups.
                // - `$10` is `$1` followed by a literal `0` if less than 10 capturing groups.
                // - `$01` is `$1` if at least one capturing group, else it's a literal `$01`.
                // - `$0` is a literal `$0`.
                if (!isNaN(dollarToken)) {
                    if (dollarToken > numCaptures) {
                        throw new SyntaxError(`Backreference to undefined group ${$0}`);
                    }
                    return args[dollarToken] || '';
                }

                // `$` followed by an unsupported char is an error, unlike native JS
                throw new SyntaxError(`Invalid token ${$0}`);
            }
        });
    }

    if (isRegex) {
        if (search.global) {
            // Fixes IE, Safari bug (last tested IE 9, Safari 5.1)
            search.lastIndex = 0;
        } else {
            // Fixes IE, Opera bug (last tested IE 9, Opera 11.6)
            search.lastIndex = origLastIndex;
        }
    }

    return result;
};

/**
 * Fixes browser bugs in the native `String.prototype.split`. Use via `XRegExp.split`.
 *
 * @memberOf String
 * @param {RegExp|String} separator Regex or string to use for separating the string.
 * @param {Number} [limit] Maximum number of items to include in the result array.
 * @returns {!Array} Array of substrings.
 */
fixed.split = function(separator, limit) {
    if (!XRegExp.isRegExp(separator)) {
        // Browsers handle nonregex split correctly, so use the faster native method
        return String.prototype.split.apply(this, arguments);
    }

    const str = String(this);
    const output = [];
    const origLastIndex = separator.lastIndex;
    let lastLastIndex = 0;
    let lastLength;

    // Values for `limit`, per the spec:
    // If undefined: pow(2,32) - 1
    // If 0, Infinity, or NaN: 0
    // If positive number: limit = floor(limit); if (limit >= pow(2,32)) limit -= pow(2,32);
    // If negative number: pow(2,32) - floor(abs(limit))
    // If other: Type-convert, then use the above rules
    // This line fails in very strange ways for some values of `limit` in Opera 10.5-10.63, unless
    // Opera Dragonfly is open (go figure). It works in at least Opera 9.5-10.1 and 11+
    limit = (limit === undefined ? -1 : limit) >>> 0;

    XRegExp.forEach(str, separator, (match) => {
        // This condition is not the same as `if (match[0].length)`
        if ((match.index + match[0].length) > lastLastIndex) {
            output.push(str.slice(lastLastIndex, match.index));
            if (match.length > 1 && match.index < str.length) {
                Array.prototype.push.apply(output, match.slice(1));
            }
            lastLength = match[0].length;
            lastLastIndex = match.index + lastLength;
        }
    });

    if (lastLastIndex === str.length) {
        if (!separator.test('') || lastLength) {
            output.push('');
        }
    } else {
        output.push(str.slice(lastLastIndex));
    }

    separator.lastIndex = origLastIndex;
    return output.length > limit ? output.slice(0, limit) : output;
};

// ==--------------------------==
// Built-in syntax/flag tokens
// ==--------------------------==

/*
 * Letter escapes that natively match literal characters: `\a`, `\A`, etc. These should be
 * SyntaxErrors but are allowed in web reality. XRegExp makes them errors for cross-browser
 * consistency and to reserve their syntax, but lets them be superseded by addons.
 */
XRegExp.addToken(
    /\\([ABCE-RTUVXYZaeg-mopqyz]|c(?![A-Za-z])|u(?![\dA-Fa-f]{4}|{[\dA-Fa-f]+})|x(?![\dA-Fa-f]{2}))/,
    (match, scope) => {
        // \B is allowed in default scope only
        if (match[1] === 'B' && scope === defaultScope) {
            return match[0];
        }
        throw new SyntaxError(`Invalid escape ${match[0]}`);
    },
    {
        scope: 'all',
        leadChar: '\\'
    }
);

/*
 * Unicode code point escape with curly braces: `\u{N..}`. `N..` is any one or more digit
 * hexadecimal number from 0-10FFFF, and can include leading zeros. Requires the native ES6 `u` flag
 * to support code points greater than U+FFFF. Avoids converting code points above U+FFFF to
 * surrogate pairs (which could be done without flag `u`), since that could lead to broken behavior
 * if you follow a `\u{N..}` token that references a code point above U+FFFF with a quantifier, or
 * if you use the same in a character class.
 */
XRegExp.addToken(
    /\\u{([\dA-Fa-f]+)}/,
    (match, scope, flags) => {
        const code = dec(match[1]);
        if (code > 0x10FFFF) {
            throw new SyntaxError(`Invalid Unicode code point ${match[0]}`);
        }
        if (code <= 0xFFFF) {
            // Converting to \uNNNN avoids needing to escape the literal character and keep it
            // separate from preceding tokens
            return `\\u${pad4(hex(code))}`;
        }
        // If `code` is between 0xFFFF and 0x10FFFF, require and defer to native handling
        if (hasNativeU && flags.includes('u')) {
            return match[0];
        }
        throw new SyntaxError('Cannot use Unicode code point above \\u{FFFF} without flag u');
    },
    {
        scope: 'all',
        leadChar: '\\'
    }
);

/*
 * Comment pattern: `(?# )`. Inline comments are an alternative to the line comments allowed in
 * free-spacing mode (flag x).
 */
XRegExp.addToken(
    /\(\?#[^)]*\)/,
    getContextualTokenSeparator,
    {leadChar: '('}
);

/*
 * Whitespace and line comments, in free-spacing mode (aka extended mode, flag x) only.
 */
XRegExp.addToken(
    /\s+|#[^\n]*\n?/,
    getContextualTokenSeparator,
    {flag: 'x'}
);

/*
 * Dot, in dotAll mode (aka singleline mode, flag s) only.
 */
if (!hasNativeS) {
    XRegExp.addToken(
        /\./,
        () => '[\\s\\S]',
        {
            flag: 's',
            leadChar: '.'
        }
    );
}

/*
 * Named backreference: `\k<name>`. Backreference names can use RegExpIdentifierName characters
 * only. Also allows numbered backreferences as `\k<n>`.
 */
XRegExp.addToken(
    /\\k<([^>]+)>/,
    function(match) {
        // Groups with the same name is an error, else would need `lastIndexOf`
        const index = isNaN(match[1]) ? (this.captureNames.indexOf(match[1]) + 1) : +match[1];
        const endIndex = match.index + match[0].length;
        if (!index || index > this.captureNames.length) {
            throw new SyntaxError(`Backreference to undefined group ${match[0]}`);
        }
        // Keep backreferences separate from subsequent literal numbers. This avoids e.g.
        // inadvertedly changing `(?<n>)\k<n>1` to `()\11`.
        return `\\${index}${
            endIndex === match.input.length || isNaN(match.input[endIndex]) ?
                '' : '(?:)'
        }`;
    },
    {leadChar: '\\'}
);

/*
 * Numbered backreference or octal, plus any following digits: `\0`, `\11`, etc. Octals except `\0`
 * not followed by 0-9 and backreferences to unopened capture groups throw an error. Other matches
 * are returned unaltered. IE < 9 doesn't support backreferences above `\99` in regex syntax.
 */
XRegExp.addToken(
    /\\(\d+)/,
    function(match, scope) {
        if (
            !(
                scope === defaultScope &&
                /^[1-9]/.test(match[1]) &&
                +match[1] <= this.captureNames.length
            ) &&
            match[1] !== '0'
        ) {
            throw new SyntaxError(`Cannot use octal escape or backreference to undefined group ${match[0]}`);
        }
        return match[0];
    },
    {
        scope: 'all',
        leadChar: '\\'
    }
);

/*
 * Named capturing group; match the opening delimiter only: `(?<name>`. Capture names can use the
 * RegExpIdentifierName characters only. Names can't be integers. Supports Python-style
 * `(?P<name>` as an alternate syntax to avoid issues in some older versions of Opera which natively
 * supported the Python-style syntax. Otherwise, XRegExp might treat numbered backreferences to
 * Python-style named capture as octals.
 */
XRegExp.addToken(
    /\(\?P?<([\p{ID_Start}$_][\p{ID_Continue}$_\u200C\u200D]*)>/u,
    function(match) {
        if (!XRegExp.isInstalled('namespacing') && (match[1] === 'length' || match[1] === '__proto__')) {
            throw new SyntaxError(`Cannot use reserved word as capture name ${match[0]}`);
        }
        if (this.captureNames.includes(match[1])) {
            throw new SyntaxError(`Cannot use same name for multiple groups ${match[0]}`);
        }
        this.captureNames.push(match[1]);
        this.hasNamedCapture = true;
        return '(';
    },
    {leadChar: '('}
);

/*
 * Capturing group; match the opening parenthesis only. Required for support of named capturing
 * groups. Also adds named capture only mode (flag n).
 */
XRegExp.addToken(
    /\((?!\?)/,
    function(match, scope, flags) {
        if (flags.includes('n')) {
            return '(?:';
        }
        this.captureNames.push(null);
        return '(';
    },
    {
        optionalFlags: 'n',
        leadChar: '('
    }
);

/*!
 * XRegExp.build 5.1.2
 * <xregexp.com>
 * Steven Levithan (c) 2012-present MIT License
 */

var build = (XRegExp) => {
    const REGEX_DATA = 'xregexp';
    const subParts = /(\()(?!\?)|\\([1-9]\d*)|\\[\s\S]|\[(?:[^\\\]]|\\[\s\S])*\]/g;
    const parts = XRegExp.union([/\({{([\w$]+)}}\)|{{([\w$]+)}}/, subParts], 'g', {
        conjunction: 'or'
    });

    /**
     * Strips a leading `^` and trailing unescaped `$`, if both are present.
     *
     * @private
     * @param {String} pattern Pattern to process.
     * @returns {String} Pattern with edge anchors removed.
     */
    function deanchor(pattern) {
        // Allow any number of empty noncapturing groups before/after anchors, because regexes
        // built/generated by XRegExp sometimes include them
        const leadingAnchor = /^(?:\(\?:\))*\^/;
        const trailingAnchor = /\$(?:\(\?:\))*$/;

        if (
            leadingAnchor.test(pattern) &&
            trailingAnchor.test(pattern) &&
            // Ensure that the trailing `$` isn't escaped
            trailingAnchor.test(pattern.replace(/\\[\s\S]/g, ''))
        ) {
            return pattern.replace(leadingAnchor, '').replace(trailingAnchor, '');
        }

        return pattern;
    }

    /**
     * Converts the provided value to an XRegExp. Native RegExp flags are not preserved.
     *
     * @private
     * @param {String|RegExp} value Value to convert.
     * @param {Boolean} [addFlagX] Whether to apply the `x` flag in cases when `value` is not
     *   already a regex generated by XRegExp
     * @returns {RegExp} XRegExp object with XRegExp syntax applied.
     */
    function asXRegExp(value, addFlagX) {
        const flags = addFlagX ? 'x' : '';
        return XRegExp.isRegExp(value) ?
            (value[REGEX_DATA] && value[REGEX_DATA].captureNames ?
                // Don't recompile, to preserve capture names
                value :
                // Recompile as XRegExp
                XRegExp(value.source, flags)
            ) :
            // Compile string as XRegExp
            XRegExp(value, flags);
    }

    function interpolate(substitution) {
        return substitution instanceof RegExp ? substitution : XRegExp.escape(substitution);
    }

    function reduceToSubpatternsObject(subpatterns, interpolated, subpatternIndex) {
        subpatterns[`subpattern${subpatternIndex}`] = interpolated;
        return subpatterns;
    }

    function embedSubpatternAfter(raw, subpatternIndex, rawLiterals) {
        const hasSubpattern = subpatternIndex < rawLiterals.length - 1;
        return raw + (hasSubpattern ? `{{subpattern${subpatternIndex}}}` : '');
    }

    /**
     * Provides tagged template literals that create regexes with XRegExp syntax and flags. The
     * provided pattern is handled as a raw string, so backslashes don't need to be escaped.
     *
     * Interpolation of strings and regexes shares the features of `XRegExp.build`. Interpolated
     * patterns are treated as atomic units when quantified, interpolated strings have their special
     * characters escaped, a leading `^` and trailing unescaped `$` are stripped from interpolated
     * regexes if both are present, and any backreferences within an interpolated regex are
     * rewritten to work within the overall pattern.
     *
     * @memberOf XRegExp
     * @param {String} [flags] Any combination of XRegExp flags.
     * @returns {Function} Handler for template literals that construct regexes with XRegExp syntax.
     * @example
     *
     * XRegExp.tag()`\b\w+\b`.test('word'); // -> true
     *
     * const hours = /1[0-2]|0?[1-9]/;
     * const minutes = /(?<minutes>[0-5][0-9])/;
     * const time = XRegExp.tag('x')`\b ${hours} : ${minutes} \b`;
     * time.test('10:59'); // -> true
     * XRegExp.exec('10:59', time).groups.minutes; // -> '59'
     *
     * const backref1 = /(a)\1/;
     * const backref2 = /(b)\1/;
     * XRegExp.tag()`${backref1}${backref2}`.test('aabb'); // -> true
     */
    XRegExp.tag = (flags) => (literals, ...substitutions) => {
        const subpatterns = substitutions.map(interpolate).reduce(reduceToSubpatternsObject, {});
        const pattern = literals.raw.map(embedSubpatternAfter).join('');
        return XRegExp.build(pattern, subpatterns, flags);
    };

    /**
     * Builds regexes using named subpatterns, for readability and pattern reuse. Backreferences in
     * the outer pattern and provided subpatterns are automatically renumbered to work correctly.
     * Native flags used by provided subpatterns are ignored in favor of the `flags` argument.
     *
     * @memberOf XRegExp
     * @param {String} pattern XRegExp pattern using `{{name}}` for embedded subpatterns. Allows
     *   `({{name}})` as shorthand for `(?<name>{{name}})`. Patterns cannot be embedded within
     *   character classes.
     * @param {Object} subs Lookup object for named subpatterns. Values can be strings or regexes. A
     *   leading `^` and trailing unescaped `$` are stripped from subpatterns, if both are present.
     * @param {String} [flags] Any combination of XRegExp flags.
     * @returns {RegExp} Regex with interpolated subpatterns.
     * @example
     *
     * const time = XRegExp.build('(?x)^ {{hours}} ({{minutes}}) $', {
     *   hours: XRegExp.build('{{h12}} : | {{h24}}', {
     *     h12: /1[0-2]|0?[1-9]/,
     *     h24: /2[0-3]|[01][0-9]/
     *   }, 'x'),
     *   minutes: /^[0-5][0-9]$/
     * });
     * time.test('10:59'); // -> true
     * XRegExp.exec('10:59', time).groups.minutes; // -> '59'
     */
    XRegExp.build = (pattern, subs, flags) => {
        flags = flags || '';
        // Used with `asXRegExp` calls for `pattern` and subpatterns in `subs`, to work around how
        // some browsers convert `RegExp('\n')` to a regex that contains the literal characters `\`
        // and `n`. See more details at <https://github.com/slevithan/xregexp/pull/163>.
        const addFlagX = flags.includes('x');
        const inlineFlags = /^\(\?([\w$]+)\)/.exec(pattern);
        // Add flags within a leading mode modifier to the overall pattern's flags
        if (inlineFlags) {
            flags = XRegExp._clipDuplicates(flags + inlineFlags[1]);
        }

        const data = {};
        for (const p in subs) {
            if (subs.hasOwnProperty(p)) {
                // Passing to XRegExp enables extended syntax and ensures independent validity,
                // lest an unescaped `(`, `)`, `[`, or trailing `\` breaks the `(?:)` wrapper. For
                // subpatterns provided as native regexes, it dies on octals and adds the property
                // used to hold extended regex instance data, for simplicity.
                const sub = asXRegExp(subs[p], addFlagX);
                data[p] = {
                    // Deanchoring allows embedding independently useful anchored regexes. If you
                    // really need to keep your anchors, double them (i.e., `^^...$$`).
                    pattern: deanchor(sub.source),
                    names: sub[REGEX_DATA].captureNames || []
                };
            }
        }

        // Passing to XRegExp dies on octals and ensures the outer pattern is independently valid;
        // helps keep this simple. Named captures will be put back.
        const patternAsRegex = asXRegExp(pattern, addFlagX);

        // 'Caps' is short for 'captures'
        let numCaps = 0;
        let numPriorCaps;
        let numOuterCaps = 0;
        const outerCapsMap = [0];
        const outerCapNames = patternAsRegex[REGEX_DATA].captureNames || [];
        const output = patternAsRegex.source.replace(parts, ($0, $1, $2, $3, $4) => {
            const subName = $1 || $2;
            let capName;
            let intro;
            let localCapIndex;
            // Named subpattern
            if (subName) {
                if (!data.hasOwnProperty(subName)) {
                    throw new ReferenceError(`Undefined property ${$0}`);
                }
                // Named subpattern was wrapped in a capturing group
                if ($1) {
                    capName = outerCapNames[numOuterCaps];
                    outerCapsMap[++numOuterCaps] = ++numCaps;
                    // If it's a named group, preserve the name. Otherwise, use the subpattern name
                    // as the capture name
                    intro = `(?<${capName || subName}>`;
                } else {
                    intro = '(?:';
                }
                numPriorCaps = numCaps;
                const rewrittenSubpattern = data[subName].pattern.replace(subParts, (match, paren, backref) => {
                    // Capturing group
                    if (paren) {
                        capName = data[subName].names[numCaps - numPriorCaps];
                        ++numCaps;
                        // If the current capture has a name, preserve the name
                        if (capName) {
                            return `(?<${capName}>`;
                        }
                    // Backreference
                    } else if (backref) {
                        localCapIndex = +backref - 1;
                        // Rewrite the backreference
                        return data[subName].names[localCapIndex] ?
                            // Need to preserve the backreference name in case using flag `n`
                            `\\k<${data[subName].names[localCapIndex]}>` :
                            `\\${+backref + numPriorCaps}`;
                    }
                    return match;
                });
                return `${intro}${rewrittenSubpattern})`;
            }
            // Capturing group
            if ($3) {
                capName = outerCapNames[numOuterCaps];
                outerCapsMap[++numOuterCaps] = ++numCaps;
                // If the current capture has a name, preserve the name
                if (capName) {
                    return `(?<${capName}>`;
                }
            // Backreference
            } else if ($4) {
                localCapIndex = +$4 - 1;
                // Rewrite the backreference
                return outerCapNames[localCapIndex] ?
                    // Need to preserve the backreference name in case using flag `n`
                    `\\k<${outerCapNames[localCapIndex]}>` :
                    `\\${outerCapsMap[+$4]}`;
            }
            return $0;
        });

        return XRegExp(output, flags);
    };
};

/*!
 * XRegExp.matchRecursive 5.1.2
 * <xregexp.com>
 * Steven Levithan (c) 2009-present MIT License
 */

var matchRecursive = (XRegExp) => {

    /**
     * Returns a match detail object composed of the provided values.
     *
     * @private
     */
    function row(name, value, start, end) {
        return {
            name,
            value,
            start,
            end
        };
    }

    /**
     * Returns an array of match strings between outermost left and right delimiters, or an array of
     * objects with detailed match parts and position data. By default, an error is thrown if
     * delimiters are unbalanced within the subject string.
     *
     * @memberOf XRegExp
     * @param {String} str String to search.
     * @param {String} left Left delimiter as an XRegExp pattern.
     * @param {String} right Right delimiter as an XRegExp pattern.
     * @param {String} [flags] Any combination of XRegExp flags, used for the left and right delimiters.
     * @param {Object} [options] Options object with optional properties:
     *   - `valueNames` {Array} Providing `valueNames` changes the return value from an array of
     *     matched strings to an array of objects that provide the value and start/end positions
     *     for the matched strings as well as the matched delimiters and unmatched string segments.
     *     To use this extended information mode, provide an array of 4 strings that name the parts
     *     to be returned:
     *     1. String segments outside of (before, between, and after) matches.
     *     2. Matched outermost left delimiters.
     *     3. Matched text between the outermost left and right delimiters.
     *     4. Matched outermost right delimiters.
     *     Taken together, these parts include the entire subject string if used with flag g.
     *     Use `null` for any of these values to omit unneeded parts from the returned results.
     *   - `escapeChar` {String} Single char used to escape delimiters within the subject string.
     *   - `unbalanced` {String} Handling mode for unbalanced delimiters. Options are:
     *     - 'error' - throw (default)
     *     - 'skip' - unbalanced delimiters are treated as part of the text between delimiters, and
     *       searches continue at the end of the unbalanced delimiter.
     *     - 'skip-lazy' - unbalanced delimiters are treated as part of the text between delimiters,
     *       and searches continue one character after the start of the unbalanced delimiter.
     * @returns {Array} Array of matches, or an empty array.
     * @example
     *
     * // Basic usage
     * const str1 = '(t((e))s)t()(ing)';
     * XRegExp.matchRecursive(str1, '\\(', '\\)', 'g');
     * // -> ['t((e))s', '', 'ing']
     *
     * // Extended information mode with valueNames
     * const str2 = 'Here is <div> <div>an</div></div> example';
     * XRegExp.matchRecursive(str2, '<div\\s*>', '</div>', 'gi', {
     *   valueNames: ['between', 'left', 'match', 'right']
     * });
     * // -> [
     * // {name: 'between', value: 'Here is ',       start: 0,  end: 8},
     * // {name: 'left',    value: '<div>',          start: 8,  end: 13},
     * // {name: 'match',   value: ' <div>an</div>', start: 13, end: 27},
     * // {name: 'right',   value: '</div>',         start: 27, end: 33},
     * // {name: 'between', value: ' example',       start: 33, end: 41}
     * // ]
     *
     * // Omitting unneeded parts with null valueNames, and using escapeChar
     * const str3 = '...{1}.\\{{function(x,y){return {y:x}}}';
     * XRegExp.matchRecursive(str3, '{', '}', 'g', {
     *   valueNames: ['literal', null, 'value', null],
     *   escapeChar: '\\'
     * });
     * // -> [
     * // {name: 'literal', value: '...',  start: 0, end: 3},
     * // {name: 'value',   value: '1',    start: 4, end: 5},
     * // {name: 'literal', value: '.\\{', start: 6, end: 9},
     * // {name: 'value',   value: 'function(x,y){return {y:x}}', start: 10, end: 37}
     * // ]
     *
     * // Sticky mode via flag y
     * const str4 = '<1><<<2>>><3>4<5>';
     * XRegExp.matchRecursive(str4, '<', '>', 'gy');
     * // -> ['1', '<<2>>', '3']
     *
     * // Skipping unbalanced delimiters instead of erroring
     * const str5 = 'Here is <div> <div>an</div> unbalanced example';
     * XRegExp.matchRecursive(str5, '<div\\s*>', '</div>', 'gi', {
     *     unbalanced: 'skip'
     * });
     * // -> ['an']
     */
    XRegExp.matchRecursive = (str, left, right, flags, options) => {
        flags = flags || '';
        options = options || {};
        const global = flags.includes('g');
        const sticky = flags.includes('y');
        // Flag `y` is handled manually
        const basicFlags = flags.replace(/y/g, '');
        left = XRegExp(left, basicFlags);
        right = XRegExp(right, basicFlags);

        let esc;
        let {escapeChar} = options;
        if (escapeChar) {
            if (escapeChar.length > 1) {
                throw new Error('Cannot use more than one escape character');
            }
            escapeChar = XRegExp.escape(escapeChar);
            // Example of concatenated `esc` regex:
            // `escapeChar`: '%'
            // `left`: '<'
            // `right`: '>'
            // Regex is: /(?:%[\S\s]|(?:(?!<|>)[^%])+)+/
            esc = new RegExp(
                `(?:${escapeChar}[\\S\\s]|(?:(?!${
                    // Using `XRegExp.union` safely rewrites backreferences in `left` and `right`.
                    // Intentionally not passing `basicFlags` to `XRegExp.union` since any syntax
                    // transformation resulting from those flags was already applied to `left` and
                    // `right` when they were passed through the XRegExp constructor above.
                    XRegExp.union([left, right], '', {conjunction: 'or'}).source
                })[^${escapeChar}])+)+`,
                // Flags `dgy` not needed here
                flags.replace(XRegExp._hasNativeFlag('s') ? /[^imsu]/g : /[^imu]/g, '')
            );
        }

        let openTokens = 0;
        let delimStart = 0;
        let delimEnd = 0;
        let lastOuterEnd = 0;
        let outerStart;
        let innerStart;
        let leftMatch;
        let rightMatch;
        const vN = options.valueNames;
        const output = [];

        while (true) {
            // If using an escape character, advance to the delimiter's next starting position,
            // skipping any escaped characters in between
            if (escapeChar) {
                delimEnd += (XRegExp.exec(str, esc, delimEnd, 'sticky') || [''])[0].length;
            }

            leftMatch = XRegExp.exec(str, left, delimEnd);
            rightMatch = XRegExp.exec(str, right, delimEnd);
            // Keep the leftmost match only
            if (leftMatch && rightMatch) {
                if (leftMatch.index <= rightMatch.index) {
                    rightMatch = null;
                } else {
                    leftMatch = null;
                }
            }

            // Paths (LM: leftMatch, RM: rightMatch, OT: openTokens):
            // LM | RM | OT | Result
            // 1  | 0  | 1  | loop
            // 1  | 0  | 0  | loop
            // 0  | 1  | 1  | loop
            // 0  | 1  | 0  | throw
            // 0  | 0  | 1  | throw
            // 0  | 0  | 0  | break
            // The paths above don't include the sticky mode special case. The loop ends after the
            // first completed match if not `global`.
            if (leftMatch || rightMatch) {
                delimStart = (leftMatch || rightMatch).index;
                delimEnd = delimStart + (leftMatch || rightMatch)[0].length;
            } else if (!openTokens) {
                break;
            }
            if (sticky && !openTokens && delimStart > lastOuterEnd) {
                break;
            }
            if (leftMatch) {
                if (!openTokens) {
                    outerStart = delimStart;
                    innerStart = delimEnd;
                }
                openTokens += 1;
            } else if (rightMatch && openTokens) {
                openTokens -= 1;
                if (!openTokens) {
                    if (vN) {
                        if (vN[0] && outerStart > lastOuterEnd) {
                            output.push(row(vN[0], str.slice(lastOuterEnd, outerStart), lastOuterEnd, outerStart));
                        }
                        if (vN[1]) {
                            output.push(row(vN[1], str.slice(outerStart, innerStart), outerStart, innerStart));
                        }
                        if (vN[2]) {
                            output.push(row(vN[2], str.slice(innerStart, delimStart), innerStart, delimStart));
                        }
                        if (vN[3]) {
                            output.push(row(vN[3], str.slice(delimStart, delimEnd), delimStart, delimEnd));
                        }
                    } else {
                        output.push(str.slice(innerStart, delimStart));
                    }
                    lastOuterEnd = delimEnd;
                    if (!global) {
                        break;
                    }
                }
            // Found unbalanced delimiter
            } else {
                const unbalanced = options.unbalanced || 'error';
                if (unbalanced === 'skip' || unbalanced === 'skip-lazy') {
                    if (rightMatch) {
                        rightMatch = null;
                    // No `leftMatch` for unbalanced left delimiter because we've reached the string end
                    } else {
                        if (unbalanced === 'skip') {
                            const outerStartDelimLength = XRegExp.exec(str, left, outerStart, 'sticky')[0].length;
                            delimEnd = outerStart + (outerStartDelimLength || 1);
                        } else {
                            delimEnd = outerStart + 1;
                        }
                        openTokens = 0;
                    }
                } else if (unbalanced === 'error') {
                    const delimSide = rightMatch ? 'right' : 'left';
                    const errorPos = rightMatch ? delimStart : outerStart;
                    throw new Error(`Unbalanced ${delimSide} delimiter found in string at position ${errorPos}`);
                } else {
                    throw new Error(`Unsupported value for unbalanced: ${unbalanced}`);
                }
            }

            // If the delimiter matched an empty string, avoid an infinite loop
            if (delimStart === delimEnd) {
                delimEnd += 1;
            }
        }

        if (global && output.length > 0 && !sticky && vN && vN[0] && str.length > lastOuterEnd) {
            output.push(row(vN[0], str.slice(lastOuterEnd), lastOuterEnd, str.length));
        }

        return output;
    };
};

/*!
 * XRegExp Unicode Base 5.1.2
 * <xregexp.com>
 * Steven Levithan (c) 2008-present MIT License
 */

var unicodeBase = (XRegExp) => {

    /**
     * Adds base support for Unicode matching:
     * - Adds syntax `\p{..}` for matching Unicode tokens. Tokens can be inverted using `\P{..}` or
     *   `\p{^..}`. Token names ignore case, spaces, hyphens, and underscores. You can omit the
     *   braces for token names that are a single letter (e.g. `\pL` or `PL`).
     * - Adds flag A (astral), which enables 21-bit Unicode support.
     * - Adds the `XRegExp.addUnicodeData` method used by other addons to provide character data.
     *
     * Unicode Base relies on externally provided Unicode character data. Official addons are
     * available to provide data for Unicode categories, scripts, and properties.
     *
     * @requires XRegExp
     */

    // ==--------------------------==
    // Private stuff
    // ==--------------------------==

    // Storage for Unicode data
    const unicode = {};
    const unicodeTypes = {};

    // Reuse utils
    const dec = XRegExp._dec;
    const hex = XRegExp._hex;
    const pad4 = XRegExp._pad4;

    // Generates a token lookup name: lowercase, with hyphens, spaces, and underscores removed
    function normalize(name) {
        return name.replace(/[- _]+/g, '').toLowerCase();
    }

    // Gets the decimal code of a literal code unit, \xHH, \uHHHH, or a backslash-escaped literal
    function charCode(chr) {
        const esc = /^\\[xu](.+)/.exec(chr);
        return esc ?
            dec(esc[1]) :
            chr.charCodeAt(chr[0] === '\\' ? 1 : 0);
    }

    // Inverts a list of ordered BMP characters and ranges
    function invertBmp(range) {
        let output = '';
        let lastEnd = -1;

        XRegExp.forEach(
            range,
            /(\\x..|\\u....|\\?[\s\S])(?:-(\\x..|\\u....|\\?[\s\S]))?/,
            (m) => {
                const start = charCode(m[1]);
                if (start > (lastEnd + 1)) {
                    output += `\\u${pad4(hex(lastEnd + 1))}`;
                    if (start > (lastEnd + 2)) {
                        output += `-\\u${pad4(hex(start - 1))}`;
                    }
                }
                lastEnd = charCode(m[2] || m[1]);
            }
        );

        if (lastEnd < 0xFFFF) {
            output += `\\u${pad4(hex(lastEnd + 1))}`;
            if (lastEnd < 0xFFFE) {
                output += '-\\uFFFF';
            }
        }

        return output;
    }

    // Generates an inverted BMP range on first use
    function cacheInvertedBmp(slug) {
        const prop = 'b!';
        return (
            unicode[slug][prop] ||
            (unicode[slug][prop] = invertBmp(unicode[slug].bmp))
        );
    }

    // Combines and optionally negates BMP and astral data
    function buildAstral(slug, isNegated) {
        const item = unicode[slug];
        let combined = '';

        if (item.bmp && !item.isBmpLast) {
            combined = `[${item.bmp}]${item.astral ? '|' : ''}`;
        }
        if (item.astral) {
            combined += item.astral;
        }
        if (item.isBmpLast && item.bmp) {
            combined += `${item.astral ? '|' : ''}[${item.bmp}]`;
        }

        // Astral Unicode tokens always match a code point, never a code unit
        return isNegated ?
            `(?:(?!${combined})(?:[\uD800-\uDBFF][\uDC00-\uDFFF]|[\0-\uFFFF]))` :
            `(?:${combined})`;
    }

    // Builds a complete astral pattern on first use
    function cacheAstral(slug, isNegated) {
        const prop = isNegated ? 'a!' : 'a=';
        return (
            unicode[slug][prop] ||
            (unicode[slug][prop] = buildAstral(slug, isNegated))
        );
    }

    // ==--------------------------==
    // Core functionality
    // ==--------------------------==

    /*
     * Add astral mode (flag A) and Unicode token syntax: `\p{..}`, `\P{..}`, `\p{^..}`, `\pC`.
     */
    XRegExp.addToken(
        // Use `*` instead of `+` to avoid capturing `^` as the token name in `\p{^}`
        /\\([pP])(?:{(\^?)(?:(\w+)=)?([^}]*)}|([A-Za-z]))/,
        (match, scope, flags) => {
            const ERR_DOUBLE_NEG = 'Invalid double negation ';
            const ERR_UNKNOWN_NAME = 'Unknown Unicode token ';
            const ERR_UNKNOWN_REF = 'Unicode token missing data ';
            const ERR_ASTRAL_ONLY = 'Astral mode required for Unicode token ';
            const ERR_ASTRAL_IN_CLASS = 'Astral mode does not support Unicode tokens within character classes';
            const [
                fullToken,
                pPrefix,
                caretNegation,
                typePrefix,
                tokenName,
                tokenSingleCharName
            ] = match;
            // Negated via \P{..} or \p{^..}
            let isNegated = pPrefix === 'P' || !!caretNegation;
            // Switch from BMP (0-FFFF) to astral (0-10FFFF) mode via flag A
            const isAstralMode = flags.includes('A');
            // Token lookup name. Check `tokenSingleCharName` first to avoid passing `undefined`
            // via `\p{}`
            let slug = normalize(tokenSingleCharName || tokenName);
            // Token data object
            let item = unicode[slug];

            if (pPrefix === 'P' && caretNegation) {
                throw new SyntaxError(ERR_DOUBLE_NEG + fullToken);
            }
            if (!unicode.hasOwnProperty(slug)) {
                throw new SyntaxError(ERR_UNKNOWN_NAME + fullToken);
            }

            if (typePrefix) {
                if (!(unicodeTypes[typePrefix] && unicodeTypes[typePrefix][slug])) {
                    throw new SyntaxError(ERR_UNKNOWN_NAME + fullToken);
                }
            }

            // Switch to the negated form of the referenced Unicode token
            if (item.inverseOf) {
                slug = normalize(item.inverseOf);
                if (!unicode.hasOwnProperty(slug)) {
                    throw new ReferenceError(`${ERR_UNKNOWN_REF + fullToken} -> ${item.inverseOf}`);
                }
                item = unicode[slug];
                isNegated = !isNegated;
            }

            if (!(item.bmp || isAstralMode)) {
                throw new SyntaxError(ERR_ASTRAL_ONLY + fullToken);
            }
            if (isAstralMode) {
                if (scope === 'class') {
                    throw new SyntaxError(ERR_ASTRAL_IN_CLASS);
                }

                return cacheAstral(slug, isNegated);
            }

            return scope === 'class' ?
                (isNegated ? cacheInvertedBmp(slug) : item.bmp) :
                `${(isNegated ? '[^' : '[') + item.bmp}]`;
        },
        {
            scope: 'all',
            optionalFlags: 'A',
            leadChar: '\\'
        }
    );

    /**
     * Adds to the list of Unicode tokens that XRegExp regexes can match via `\p` or `\P`.
     *
     * @memberOf XRegExp
     * @param {Array} data Objects with named character ranges. Each object may have properties
     *   `name`, `alias`, `isBmpLast`, `inverseOf`, `bmp`, and `astral`. All but `name` are
     *   optional, although one of `bmp` or `astral` is required (unless `inverseOf` is set). If
     *   `astral` is absent, the `bmp` data is used for BMP and astral modes. If `bmp` is absent,
     *   the name errors in BMP mode but works in astral mode. If both `bmp` and `astral` are
     *   provided, the `bmp` data only is used in BMP mode, and the combination of `bmp` and
     *   `astral` data is used in astral mode. `isBmpLast` is needed when a token matches orphan
     *   high surrogates *and* uses surrogate pairs to match astral code points. The `bmp` and
     *   `astral` data should be a combination of literal characters and `\xHH` or `\uHHHH` escape
     *   sequences, with hyphens to create ranges. Any regex metacharacters in the data should be
     *   escaped, apart from range-creating hyphens. The `astral` data can additionally use
     *   character classes and alternation, and should use surrogate pairs to represent astral code
     *   points. `inverseOf` can be used to avoid duplicating character data if a Unicode token is
     *   defined as the exact inverse of another token.
     * @param {String} [typePrefix] Enables optionally using this type as a prefix for all of the
     *   provided Unicode tokens, e.g. if given `'Type'`, then `\p{TokenName}` can also be written
     *   as `\p{Type=TokenName}`.
     * @example
     *
     * // Basic use
     * XRegExp.addUnicodeData([{
     *   name: 'XDigit',
     *   alias: 'Hexadecimal',
     *   bmp: '0-9A-Fa-f'
     * }]);
     * XRegExp('\\p{XDigit}:\\p{Hexadecimal}+').test('0:3D'); // -> true
     */
    XRegExp.addUnicodeData = (data, typePrefix) => {
        const ERR_NO_NAME = 'Unicode token requires name';
        const ERR_NO_DATA = 'Unicode token has no character data ';

        if (typePrefix) {
            // Case sensitive to match ES2018
            unicodeTypes[typePrefix] = {};
        }

        for (const item of data) {
            if (!item.name) {
                throw new Error(ERR_NO_NAME);
            }
            if (!(item.inverseOf || item.bmp || item.astral)) {
                throw new Error(ERR_NO_DATA + item.name);
            }

            const normalizedName = normalize(item.name);
            unicode[normalizedName] = item;
            if (typePrefix) {
                unicodeTypes[typePrefix][normalizedName] = true;
            }

            if (item.alias) {
                const normalizedAlias = normalize(item.alias);
                unicode[normalizedAlias] = item;
                if (typePrefix) {
                    unicodeTypes[typePrefix][normalizedAlias] = true;
                }
            }
        }

        // Reset the pattern cache used by the `XRegExp` constructor, since the same pattern and
        // flags might now produce different results
        XRegExp.cache.flush('patterns');
    };

    /**
     * @ignore
     *
     * Return a reference to the internal Unicode definition structure for the given Unicode
     * Property if the given name is a legal Unicode Property for use in XRegExp `\p` or `\P` regex
     * constructs.
     *
     * @memberOf XRegExp
     * @param {String} name Name by which the Unicode Property may be recognized (case-insensitive),
     *   e.g. `'N'` or `'Number'`. The given name is matched against all registered Unicode
     *   Properties and Property Aliases.
     * @returns {Object} Reference to definition structure when the name matches a Unicode Property.
     *
     * @note
     * For more info on Unicode Properties, see also http://unicode.org/reports/tr18/#Categories.
     *
     * @note
     * This method is *not* part of the officially documented API and may change or be removed in
     * the future. It is meant for userland code that wishes to reuse the (large) internal Unicode
     * structures set up by XRegExp.
     */
    XRegExp._getUnicodeProperty = (name) => {
        const slug = normalize(name);
        return unicode[slug];
    };
};

var categories = [
    {
        'name': 'C',
        'alias': 'Other',
        'isBmpLast': true,
        'bmp': '\0-\x1F\x7F-\x9F\xAD\u0378\u0379\u0380-\u0383\u038B\u038D\u03A2\u0530\u0557\u0558\u058B\u058C\u0590\u05C8-\u05CF\u05EB-\u05EE\u05F5-\u0605\u061C\u06DD\u070E\u070F\u074B\u074C\u07B2-\u07BF\u07FB\u07FC\u082E\u082F\u083F\u085C\u085D\u085F\u086B-\u086F\u088F-\u0897\u08E2\u0984\u098D\u098E\u0991\u0992\u09A9\u09B1\u09B3-\u09B5\u09BA\u09BB\u09C5\u09C6\u09C9\u09CA\u09CF-\u09D6\u09D8-\u09DB\u09DE\u09E4\u09E5\u09FF\u0A00\u0A04\u0A0B-\u0A0E\u0A11\u0A12\u0A29\u0A31\u0A34\u0A37\u0A3A\u0A3B\u0A3D\u0A43-\u0A46\u0A49\u0A4A\u0A4E-\u0A50\u0A52-\u0A58\u0A5D\u0A5F-\u0A65\u0A77-\u0A80\u0A84\u0A8E\u0A92\u0AA9\u0AB1\u0AB4\u0ABA\u0ABB\u0AC6\u0ACA\u0ACE\u0ACF\u0AD1-\u0ADF\u0AE4\u0AE5\u0AF2-\u0AF8\u0B00\u0B04\u0B0D\u0B0E\u0B11\u0B12\u0B29\u0B31\u0B34\u0B3A\u0B3B\u0B45\u0B46\u0B49\u0B4A\u0B4E-\u0B54\u0B58-\u0B5B\u0B5E\u0B64\u0B65\u0B78-\u0B81\u0B84\u0B8B-\u0B8D\u0B91\u0B96-\u0B98\u0B9B\u0B9D\u0BA0-\u0BA2\u0BA5-\u0BA7\u0BAB-\u0BAD\u0BBA-\u0BBD\u0BC3-\u0BC5\u0BC9\u0BCE\u0BCF\u0BD1-\u0BD6\u0BD8-\u0BE5\u0BFB-\u0BFF\u0C0D\u0C11\u0C29\u0C3A\u0C3B\u0C45\u0C49\u0C4E-\u0C54\u0C57\u0C5B\u0C5C\u0C5E\u0C5F\u0C64\u0C65\u0C70-\u0C76\u0C8D\u0C91\u0CA9\u0CB4\u0CBA\u0CBB\u0CC5\u0CC9\u0CCE-\u0CD4\u0CD7-\u0CDC\u0CDF\u0CE4\u0CE5\u0CF0\u0CF3-\u0CFF\u0D0D\u0D11\u0D45\u0D49\u0D50-\u0D53\u0D64\u0D65\u0D80\u0D84\u0D97-\u0D99\u0DB2\u0DBC\u0DBE\u0DBF\u0DC7-\u0DC9\u0DCB-\u0DCE\u0DD5\u0DD7\u0DE0-\u0DE5\u0DF0\u0DF1\u0DF5-\u0E00\u0E3B-\u0E3E\u0E5C-\u0E80\u0E83\u0E85\u0E8B\u0EA4\u0EA6\u0EBE\u0EBF\u0EC5\u0EC7\u0ECE\u0ECF\u0EDA\u0EDB\u0EE0-\u0EFF\u0F48\u0F6D-\u0F70\u0F98\u0FBD\u0FCD\u0FDB-\u0FFF\u10C6\u10C8-\u10CC\u10CE\u10CF\u1249\u124E\u124F\u1257\u1259\u125E\u125F\u1289\u128E\u128F\u12B1\u12B6\u12B7\u12BF\u12C1\u12C6\u12C7\u12D7\u1311\u1316\u1317\u135B\u135C\u137D-\u137F\u139A-\u139F\u13F6\u13F7\u13FE\u13FF\u169D-\u169F\u16F9-\u16FF\u1716-\u171E\u1737-\u173F\u1754-\u175F\u176D\u1771\u1774-\u177F\u17DE\u17DF\u17EA-\u17EF\u17FA-\u17FF\u180E\u181A-\u181F\u1879-\u187F\u18AB-\u18AF\u18F6-\u18FF\u191F\u192C-\u192F\u193C-\u193F\u1941-\u1943\u196E\u196F\u1975-\u197F\u19AC-\u19AF\u19CA-\u19CF\u19DB-\u19DD\u1A1C\u1A1D\u1A5F\u1A7D\u1A7E\u1A8A-\u1A8F\u1A9A-\u1A9F\u1AAE\u1AAF\u1ACF-\u1AFF\u1B4D-\u1B4F\u1B7F\u1BF4-\u1BFB\u1C38-\u1C3A\u1C4A-\u1C4C\u1C89-\u1C8F\u1CBB\u1CBC\u1CC8-\u1CCF\u1CFB-\u1CFF\u1F16\u1F17\u1F1E\u1F1F\u1F46\u1F47\u1F4E\u1F4F\u1F58\u1F5A\u1F5C\u1F5E\u1F7E\u1F7F\u1FB5\u1FC5\u1FD4\u1FD5\u1FDC\u1FF0\u1FF1\u1FF5\u1FFF\u200B-\u200F\u202A-\u202E\u2060-\u206F\u2072\u2073\u208F\u209D-\u209F\u20C1-\u20CF\u20F1-\u20FF\u218C-\u218F\u2427-\u243F\u244B-\u245F\u2B74\u2B75\u2B96\u2CF4-\u2CF8\u2D26\u2D28-\u2D2C\u2D2E\u2D2F\u2D68-\u2D6E\u2D71-\u2D7E\u2D97-\u2D9F\u2DA7\u2DAF\u2DB7\u2DBF\u2DC7\u2DCF\u2DD7\u2DDF\u2E5E-\u2E7F\u2E9A\u2EF4-\u2EFF\u2FD6-\u2FEF\u2FFC-\u2FFF\u3040\u3097\u3098\u3100-\u3104\u3130\u318F\u31E4-\u31EF\u321F\uA48D-\uA48F\uA4C7-\uA4CF\uA62C-\uA63F\uA6F8-\uA6FF\uA7CB-\uA7CF\uA7D2\uA7D4\uA7DA-\uA7F1\uA82D-\uA82F\uA83A-\uA83F\uA878-\uA87F\uA8C6-\uA8CD\uA8DA-\uA8DF\uA954-\uA95E\uA97D-\uA97F\uA9CE\uA9DA-\uA9DD\uA9FF\uAA37-\uAA3F\uAA4E\uAA4F\uAA5A\uAA5B\uAAC3-\uAADA\uAAF7-\uAB00\uAB07\uAB08\uAB0F\uAB10\uAB17-\uAB1F\uAB27\uAB2F\uAB6C-\uAB6F\uABEE\uABEF\uABFA-\uABFF\uD7A4-\uD7AF\uD7C7-\uD7CA\uD7FC-\uF8FF\uFA6E\uFA6F\uFADA-\uFAFF\uFB07-\uFB12\uFB18-\uFB1C\uFB37\uFB3D\uFB3F\uFB42\uFB45\uFBC3-\uFBD2\uFD90\uFD91\uFDC8-\uFDCE\uFDD0-\uFDEF\uFE1A-\uFE1F\uFE53\uFE67\uFE6C-\uFE6F\uFE75\uFEFD-\uFF00\uFFBF-\uFFC1\uFFC8\uFFC9\uFFD0\uFFD1\uFFD8\uFFD9\uFFDD-\uFFDF\uFFE7\uFFEF-\uFFFB\uFFFE\uFFFF',
        'astral': '\uD800[\uDC0C\uDC27\uDC3B\uDC3E\uDC4E\uDC4F\uDC5E-\uDC7F\uDCFB-\uDCFF\uDD03-\uDD06\uDD34-\uDD36\uDD8F\uDD9D-\uDD9F\uDDA1-\uDDCF\uDDFE-\uDE7F\uDE9D-\uDE9F\uDED1-\uDEDF\uDEFC-\uDEFF\uDF24-\uDF2C\uDF4B-\uDF4F\uDF7B-\uDF7F\uDF9E\uDFC4-\uDFC7\uDFD6-\uDFFF]|\uD801[\uDC9E\uDC9F\uDCAA-\uDCAF\uDCD4-\uDCD7\uDCFC-\uDCFF\uDD28-\uDD2F\uDD64-\uDD6E\uDD7B\uDD8B\uDD93\uDD96\uDDA2\uDDB2\uDDBA\uDDBD-\uDDFF\uDF37-\uDF3F\uDF56-\uDF5F\uDF68-\uDF7F\uDF86\uDFB1\uDFBB-\uDFFF]|\uD802[\uDC06\uDC07\uDC09\uDC36\uDC39-\uDC3B\uDC3D\uDC3E\uDC56\uDC9F-\uDCA6\uDCB0-\uDCDF\uDCF3\uDCF6-\uDCFA\uDD1C-\uDD1E\uDD3A-\uDD3E\uDD40-\uDD7F\uDDB8-\uDDBB\uDDD0\uDDD1\uDE04\uDE07-\uDE0B\uDE14\uDE18\uDE36\uDE37\uDE3B-\uDE3E\uDE49-\uDE4F\uDE59-\uDE5F\uDEA0-\uDEBF\uDEE7-\uDEEA\uDEF7-\uDEFF\uDF36-\uDF38\uDF56\uDF57\uDF73-\uDF77\uDF92-\uDF98\uDF9D-\uDFA8\uDFB0-\uDFFF]|\uD803[\uDC49-\uDC7F\uDCB3-\uDCBF\uDCF3-\uDCF9\uDD28-\uDD2F\uDD3A-\uDE5F\uDE7F\uDEAA\uDEAE\uDEAF\uDEB2-\uDEFF\uDF28-\uDF2F\uDF5A-\uDF6F\uDF8A-\uDFAF\uDFCC-\uDFDF\uDFF7-\uDFFF]|\uD804[\uDC4E-\uDC51\uDC76-\uDC7E\uDCBD\uDCC3-\uDCCF\uDCE9-\uDCEF\uDCFA-\uDCFF\uDD35\uDD48-\uDD4F\uDD77-\uDD7F\uDDE0\uDDF5-\uDDFF\uDE12\uDE3F-\uDE7F\uDE87\uDE89\uDE8E\uDE9E\uDEAA-\uDEAF\uDEEB-\uDEEF\uDEFA-\uDEFF\uDF04\uDF0D\uDF0E\uDF11\uDF12\uDF29\uDF31\uDF34\uDF3A\uDF45\uDF46\uDF49\uDF4A\uDF4E\uDF4F\uDF51-\uDF56\uDF58-\uDF5C\uDF64\uDF65\uDF6D-\uDF6F\uDF75-\uDFFF]|\uD805[\uDC5C\uDC62-\uDC7F\uDCC8-\uDCCF\uDCDA-\uDD7F\uDDB6\uDDB7\uDDDE-\uDDFF\uDE45-\uDE4F\uDE5A-\uDE5F\uDE6D-\uDE7F\uDEBA-\uDEBF\uDECA-\uDEFF\uDF1B\uDF1C\uDF2C-\uDF2F\uDF47-\uDFFF]|\uD806[\uDC3C-\uDC9F\uDCF3-\uDCFE\uDD07\uDD08\uDD0A\uDD0B\uDD14\uDD17\uDD36\uDD39\uDD3A\uDD47-\uDD4F\uDD5A-\uDD9F\uDDA8\uDDA9\uDDD8\uDDD9\uDDE5-\uDDFF\uDE48-\uDE4F\uDEA3-\uDEAF\uDEF9-\uDFFF]|\uD807[\uDC09\uDC37\uDC46-\uDC4F\uDC6D-\uDC6F\uDC90\uDC91\uDCA8\uDCB7-\uDCFF\uDD07\uDD0A\uDD37-\uDD39\uDD3B\uDD3E\uDD48-\uDD4F\uDD5A-\uDD5F\uDD66\uDD69\uDD8F\uDD92\uDD99-\uDD9F\uDDAA-\uDEDF\uDEF9-\uDFAF\uDFB1-\uDFBF\uDFF2-\uDFFE]|\uD808[\uDF9A-\uDFFF]|\uD809[\uDC6F\uDC75-\uDC7F\uDD44-\uDFFF]|[\uD80A\uD80E-\uD810\uD812-\uD819\uD824-\uD82A\uD82D\uD82E\uD830-\uD832\uD83F\uD87B-\uD87D\uD87F\uD885-\uDB3F\uDB41-\uDBFF][\uDC00-\uDFFF]|\uD80B[\uDC00-\uDF8F\uDFF3-\uDFFF]|\uD80D[\uDC2F-\uDFFF]|\uD811[\uDE47-\uDFFF]|\uD81A[\uDE39-\uDE3F\uDE5F\uDE6A-\uDE6D\uDEBF\uDECA-\uDECF\uDEEE\uDEEF\uDEF6-\uDEFF\uDF46-\uDF4F\uDF5A\uDF62\uDF78-\uDF7C\uDF90-\uDFFF]|\uD81B[\uDC00-\uDE3F\uDE9B-\uDEFF\uDF4B-\uDF4E\uDF88-\uDF8E\uDFA0-\uDFDF\uDFE5-\uDFEF\uDFF2-\uDFFF]|\uD821[\uDFF8-\uDFFF]|\uD823[\uDCD6-\uDCFF\uDD09-\uDFFF]|\uD82B[\uDC00-\uDFEF\uDFF4\uDFFC\uDFFF]|\uD82C[\uDD23-\uDD4F\uDD53-\uDD63\uDD68-\uDD6F\uDEFC-\uDFFF]|\uD82F[\uDC6B-\uDC6F\uDC7D-\uDC7F\uDC89-\uDC8F\uDC9A\uDC9B\uDCA0-\uDFFF]|\uD833[\uDC00-\uDEFF\uDF2E\uDF2F\uDF47-\uDF4F\uDFC4-\uDFFF]|\uD834[\uDCF6-\uDCFF\uDD27\uDD28\uDD73-\uDD7A\uDDEB-\uDDFF\uDE46-\uDEDF\uDEF4-\uDEFF\uDF57-\uDF5F\uDF79-\uDFFF]|\uD835[\uDC55\uDC9D\uDCA0\uDCA1\uDCA3\uDCA4\uDCA7\uDCA8\uDCAD\uDCBA\uDCBC\uDCC4\uDD06\uDD0B\uDD0C\uDD15\uDD1D\uDD3A\uDD3F\uDD45\uDD47-\uDD49\uDD51\uDEA6\uDEA7\uDFCC\uDFCD]|\uD836[\uDE8C-\uDE9A\uDEA0\uDEB0-\uDFFF]|\uD837[\uDC00-\uDEFF\uDF1F-\uDFFF]|\uD838[\uDC07\uDC19\uDC1A\uDC22\uDC25\uDC2B-\uDCFF\uDD2D-\uDD2F\uDD3E\uDD3F\uDD4A-\uDD4D\uDD50-\uDE8F\uDEAF-\uDEBF\uDEFA-\uDEFE\uDF00-\uDFFF]|\uD839[\uDC00-\uDFDF\uDFE7\uDFEC\uDFEF\uDFFF]|\uD83A[\uDCC5\uDCC6\uDCD7-\uDCFF\uDD4C-\uDD4F\uDD5A-\uDD5D\uDD60-\uDFFF]|\uD83B[\uDC00-\uDC70\uDCB5-\uDD00\uDD3E-\uDDFF\uDE04\uDE20\uDE23\uDE25\uDE26\uDE28\uDE33\uDE38\uDE3A\uDE3C-\uDE41\uDE43-\uDE46\uDE48\uDE4A\uDE4C\uDE50\uDE53\uDE55\uDE56\uDE58\uDE5A\uDE5C\uDE5E\uDE60\uDE63\uDE65\uDE66\uDE6B\uDE73\uDE78\uDE7D\uDE7F\uDE8A\uDE9C-\uDEA0\uDEA4\uDEAA\uDEBC-\uDEEF\uDEF2-\uDFFF]|\uD83C[\uDC2C-\uDC2F\uDC94-\uDC9F\uDCAF\uDCB0\uDCC0\uDCD0\uDCF6-\uDCFF\uDDAE-\uDDE5\uDE03-\uDE0F\uDE3C-\uDE3F\uDE49-\uDE4F\uDE52-\uDE5F\uDE66-\uDEFF]|\uD83D[\uDED8-\uDEDC\uDEED-\uDEEF\uDEFD-\uDEFF\uDF74-\uDF7F\uDFD9-\uDFDF\uDFEC-\uDFEF\uDFF1-\uDFFF]|\uD83E[\uDC0C-\uDC0F\uDC48-\uDC4F\uDC5A-\uDC5F\uDC88-\uDC8F\uDCAE\uDCAF\uDCB2-\uDCFF\uDE54-\uDE5F\uDE6E\uDE6F\uDE75-\uDE77\uDE7D-\uDE7F\uDE87-\uDE8F\uDEAD-\uDEAF\uDEBB-\uDEBF\uDEC6-\uDECF\uDEDA-\uDEDF\uDEE8-\uDEEF\uDEF7-\uDEFF\uDF93\uDFCB-\uDFEF\uDFFA-\uDFFF]|\uD869[\uDEE0-\uDEFF]|\uD86D[\uDF39-\uDF3F]|\uD86E[\uDC1E\uDC1F]|\uD873[\uDEA2-\uDEAF]|\uD87A[\uDFE1-\uDFFF]|\uD87E[\uDE1E-\uDFFF]|\uD884[\uDF4B-\uDFFF]|\uDB40[\uDC00-\uDCFF\uDDF0-\uDFFF]'
    },
    {
        'name': 'Cc',
        'alias': 'Control',
        'bmp': '\0-\x1F\x7F-\x9F'
    },
    {
        'name': 'Cf',
        'alias': 'Format',
        'bmp': '\xAD\u0600-\u0605\u061C\u06DD\u070F\u0890\u0891\u08E2\u180E\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u206F\uFEFF\uFFF9-\uFFFB',
        'astral': '\uD804[\uDCBD\uDCCD]|\uD80D[\uDC30-\uDC38]|\uD82F[\uDCA0-\uDCA3]|\uD834[\uDD73-\uDD7A]|\uDB40[\uDC01\uDC20-\uDC7F]'
    },
    {
        'name': 'Cn',
        'alias': 'Unassigned',
        'bmp': '\u0378\u0379\u0380-\u0383\u038B\u038D\u03A2\u0530\u0557\u0558\u058B\u058C\u0590\u05C8-\u05CF\u05EB-\u05EE\u05F5-\u05FF\u070E\u074B\u074C\u07B2-\u07BF\u07FB\u07FC\u082E\u082F\u083F\u085C\u085D\u085F\u086B-\u086F\u088F\u0892-\u0897\u0984\u098D\u098E\u0991\u0992\u09A9\u09B1\u09B3-\u09B5\u09BA\u09BB\u09C5\u09C6\u09C9\u09CA\u09CF-\u09D6\u09D8-\u09DB\u09DE\u09E4\u09E5\u09FF\u0A00\u0A04\u0A0B-\u0A0E\u0A11\u0A12\u0A29\u0A31\u0A34\u0A37\u0A3A\u0A3B\u0A3D\u0A43-\u0A46\u0A49\u0A4A\u0A4E-\u0A50\u0A52-\u0A58\u0A5D\u0A5F-\u0A65\u0A77-\u0A80\u0A84\u0A8E\u0A92\u0AA9\u0AB1\u0AB4\u0ABA\u0ABB\u0AC6\u0ACA\u0ACE\u0ACF\u0AD1-\u0ADF\u0AE4\u0AE5\u0AF2-\u0AF8\u0B00\u0B04\u0B0D\u0B0E\u0B11\u0B12\u0B29\u0B31\u0B34\u0B3A\u0B3B\u0B45\u0B46\u0B49\u0B4A\u0B4E-\u0B54\u0B58-\u0B5B\u0B5E\u0B64\u0B65\u0B78-\u0B81\u0B84\u0B8B-\u0B8D\u0B91\u0B96-\u0B98\u0B9B\u0B9D\u0BA0-\u0BA2\u0BA5-\u0BA7\u0BAB-\u0BAD\u0BBA-\u0BBD\u0BC3-\u0BC5\u0BC9\u0BCE\u0BCF\u0BD1-\u0BD6\u0BD8-\u0BE5\u0BFB-\u0BFF\u0C0D\u0C11\u0C29\u0C3A\u0C3B\u0C45\u0C49\u0C4E-\u0C54\u0C57\u0C5B\u0C5C\u0C5E\u0C5F\u0C64\u0C65\u0C70-\u0C76\u0C8D\u0C91\u0CA9\u0CB4\u0CBA\u0CBB\u0CC5\u0CC9\u0CCE-\u0CD4\u0CD7-\u0CDC\u0CDF\u0CE4\u0CE5\u0CF0\u0CF3-\u0CFF\u0D0D\u0D11\u0D45\u0D49\u0D50-\u0D53\u0D64\u0D65\u0D80\u0D84\u0D97-\u0D99\u0DB2\u0DBC\u0DBE\u0DBF\u0DC7-\u0DC9\u0DCB-\u0DCE\u0DD5\u0DD7\u0DE0-\u0DE5\u0DF0\u0DF1\u0DF5-\u0E00\u0E3B-\u0E3E\u0E5C-\u0E80\u0E83\u0E85\u0E8B\u0EA4\u0EA6\u0EBE\u0EBF\u0EC5\u0EC7\u0ECE\u0ECF\u0EDA\u0EDB\u0EE0-\u0EFF\u0F48\u0F6D-\u0F70\u0F98\u0FBD\u0FCD\u0FDB-\u0FFF\u10C6\u10C8-\u10CC\u10CE\u10CF\u1249\u124E\u124F\u1257\u1259\u125E\u125F\u1289\u128E\u128F\u12B1\u12B6\u12B7\u12BF\u12C1\u12C6\u12C7\u12D7\u1311\u1316\u1317\u135B\u135C\u137D-\u137F\u139A-\u139F\u13F6\u13F7\u13FE\u13FF\u169D-\u169F\u16F9-\u16FF\u1716-\u171E\u1737-\u173F\u1754-\u175F\u176D\u1771\u1774-\u177F\u17DE\u17DF\u17EA-\u17EF\u17FA-\u17FF\u181A-\u181F\u1879-\u187F\u18AB-\u18AF\u18F6-\u18FF\u191F\u192C-\u192F\u193C-\u193F\u1941-\u1943\u196E\u196F\u1975-\u197F\u19AC-\u19AF\u19CA-\u19CF\u19DB-\u19DD\u1A1C\u1A1D\u1A5F\u1A7D\u1A7E\u1A8A-\u1A8F\u1A9A-\u1A9F\u1AAE\u1AAF\u1ACF-\u1AFF\u1B4D-\u1B4F\u1B7F\u1BF4-\u1BFB\u1C38-\u1C3A\u1C4A-\u1C4C\u1C89-\u1C8F\u1CBB\u1CBC\u1CC8-\u1CCF\u1CFB-\u1CFF\u1F16\u1F17\u1F1E\u1F1F\u1F46\u1F47\u1F4E\u1F4F\u1F58\u1F5A\u1F5C\u1F5E\u1F7E\u1F7F\u1FB5\u1FC5\u1FD4\u1FD5\u1FDC\u1FF0\u1FF1\u1FF5\u1FFF\u2065\u2072\u2073\u208F\u209D-\u209F\u20C1-\u20CF\u20F1-\u20FF\u218C-\u218F\u2427-\u243F\u244B-\u245F\u2B74\u2B75\u2B96\u2CF4-\u2CF8\u2D26\u2D28-\u2D2C\u2D2E\u2D2F\u2D68-\u2D6E\u2D71-\u2D7E\u2D97-\u2D9F\u2DA7\u2DAF\u2DB7\u2DBF\u2DC7\u2DCF\u2DD7\u2DDF\u2E5E-\u2E7F\u2E9A\u2EF4-\u2EFF\u2FD6-\u2FEF\u2FFC-\u2FFF\u3040\u3097\u3098\u3100-\u3104\u3130\u318F\u31E4-\u31EF\u321F\uA48D-\uA48F\uA4C7-\uA4CF\uA62C-\uA63F\uA6F8-\uA6FF\uA7CB-\uA7CF\uA7D2\uA7D4\uA7DA-\uA7F1\uA82D-\uA82F\uA83A-\uA83F\uA878-\uA87F\uA8C6-\uA8CD\uA8DA-\uA8DF\uA954-\uA95E\uA97D-\uA97F\uA9CE\uA9DA-\uA9DD\uA9FF\uAA37-\uAA3F\uAA4E\uAA4F\uAA5A\uAA5B\uAAC3-\uAADA\uAAF7-\uAB00\uAB07\uAB08\uAB0F\uAB10\uAB17-\uAB1F\uAB27\uAB2F\uAB6C-\uAB6F\uABEE\uABEF\uABFA-\uABFF\uD7A4-\uD7AF\uD7C7-\uD7CA\uD7FC-\uD7FF\uFA6E\uFA6F\uFADA-\uFAFF\uFB07-\uFB12\uFB18-\uFB1C\uFB37\uFB3D\uFB3F\uFB42\uFB45\uFBC3-\uFBD2\uFD90\uFD91\uFDC8-\uFDCE\uFDD0-\uFDEF\uFE1A-\uFE1F\uFE53\uFE67\uFE6C-\uFE6F\uFE75\uFEFD\uFEFE\uFF00\uFFBF-\uFFC1\uFFC8\uFFC9\uFFD0\uFFD1\uFFD8\uFFD9\uFFDD-\uFFDF\uFFE7\uFFEF-\uFFF8\uFFFE\uFFFF',
        'astral': '\uD800[\uDC0C\uDC27\uDC3B\uDC3E\uDC4E\uDC4F\uDC5E-\uDC7F\uDCFB-\uDCFF\uDD03-\uDD06\uDD34-\uDD36\uDD8F\uDD9D-\uDD9F\uDDA1-\uDDCF\uDDFE-\uDE7F\uDE9D-\uDE9F\uDED1-\uDEDF\uDEFC-\uDEFF\uDF24-\uDF2C\uDF4B-\uDF4F\uDF7B-\uDF7F\uDF9E\uDFC4-\uDFC7\uDFD6-\uDFFF]|\uD801[\uDC9E\uDC9F\uDCAA-\uDCAF\uDCD4-\uDCD7\uDCFC-\uDCFF\uDD28-\uDD2F\uDD64-\uDD6E\uDD7B\uDD8B\uDD93\uDD96\uDDA2\uDDB2\uDDBA\uDDBD-\uDDFF\uDF37-\uDF3F\uDF56-\uDF5F\uDF68-\uDF7F\uDF86\uDFB1\uDFBB-\uDFFF]|\uD802[\uDC06\uDC07\uDC09\uDC36\uDC39-\uDC3B\uDC3D\uDC3E\uDC56\uDC9F-\uDCA6\uDCB0-\uDCDF\uDCF3\uDCF6-\uDCFA\uDD1C-\uDD1E\uDD3A-\uDD3E\uDD40-\uDD7F\uDDB8-\uDDBB\uDDD0\uDDD1\uDE04\uDE07-\uDE0B\uDE14\uDE18\uDE36\uDE37\uDE3B-\uDE3E\uDE49-\uDE4F\uDE59-\uDE5F\uDEA0-\uDEBF\uDEE7-\uDEEA\uDEF7-\uDEFF\uDF36-\uDF38\uDF56\uDF57\uDF73-\uDF77\uDF92-\uDF98\uDF9D-\uDFA8\uDFB0-\uDFFF]|\uD803[\uDC49-\uDC7F\uDCB3-\uDCBF\uDCF3-\uDCF9\uDD28-\uDD2F\uDD3A-\uDE5F\uDE7F\uDEAA\uDEAE\uDEAF\uDEB2-\uDEFF\uDF28-\uDF2F\uDF5A-\uDF6F\uDF8A-\uDFAF\uDFCC-\uDFDF\uDFF7-\uDFFF]|\uD804[\uDC4E-\uDC51\uDC76-\uDC7E\uDCC3-\uDCCC\uDCCE\uDCCF\uDCE9-\uDCEF\uDCFA-\uDCFF\uDD35\uDD48-\uDD4F\uDD77-\uDD7F\uDDE0\uDDF5-\uDDFF\uDE12\uDE3F-\uDE7F\uDE87\uDE89\uDE8E\uDE9E\uDEAA-\uDEAF\uDEEB-\uDEEF\uDEFA-\uDEFF\uDF04\uDF0D\uDF0E\uDF11\uDF12\uDF29\uDF31\uDF34\uDF3A\uDF45\uDF46\uDF49\uDF4A\uDF4E\uDF4F\uDF51-\uDF56\uDF58-\uDF5C\uDF64\uDF65\uDF6D-\uDF6F\uDF75-\uDFFF]|\uD805[\uDC5C\uDC62-\uDC7F\uDCC8-\uDCCF\uDCDA-\uDD7F\uDDB6\uDDB7\uDDDE-\uDDFF\uDE45-\uDE4F\uDE5A-\uDE5F\uDE6D-\uDE7F\uDEBA-\uDEBF\uDECA-\uDEFF\uDF1B\uDF1C\uDF2C-\uDF2F\uDF47-\uDFFF]|\uD806[\uDC3C-\uDC9F\uDCF3-\uDCFE\uDD07\uDD08\uDD0A\uDD0B\uDD14\uDD17\uDD36\uDD39\uDD3A\uDD47-\uDD4F\uDD5A-\uDD9F\uDDA8\uDDA9\uDDD8\uDDD9\uDDE5-\uDDFF\uDE48-\uDE4F\uDEA3-\uDEAF\uDEF9-\uDFFF]|\uD807[\uDC09\uDC37\uDC46-\uDC4F\uDC6D-\uDC6F\uDC90\uDC91\uDCA8\uDCB7-\uDCFF\uDD07\uDD0A\uDD37-\uDD39\uDD3B\uDD3E\uDD48-\uDD4F\uDD5A-\uDD5F\uDD66\uDD69\uDD8F\uDD92\uDD99-\uDD9F\uDDAA-\uDEDF\uDEF9-\uDFAF\uDFB1-\uDFBF\uDFF2-\uDFFE]|\uD808[\uDF9A-\uDFFF]|\uD809[\uDC6F\uDC75-\uDC7F\uDD44-\uDFFF]|[\uD80A\uD80E-\uD810\uD812-\uD819\uD824-\uD82A\uD82D\uD82E\uD830-\uD832\uD83F\uD87B-\uD87D\uD87F\uD885-\uDB3F\uDB41-\uDB7F][\uDC00-\uDFFF]|\uD80B[\uDC00-\uDF8F\uDFF3-\uDFFF]|\uD80D[\uDC2F\uDC39-\uDFFF]|\uD811[\uDE47-\uDFFF]|\uD81A[\uDE39-\uDE3F\uDE5F\uDE6A-\uDE6D\uDEBF\uDECA-\uDECF\uDEEE\uDEEF\uDEF6-\uDEFF\uDF46-\uDF4F\uDF5A\uDF62\uDF78-\uDF7C\uDF90-\uDFFF]|\uD81B[\uDC00-\uDE3F\uDE9B-\uDEFF\uDF4B-\uDF4E\uDF88-\uDF8E\uDFA0-\uDFDF\uDFE5-\uDFEF\uDFF2-\uDFFF]|\uD821[\uDFF8-\uDFFF]|\uD823[\uDCD6-\uDCFF\uDD09-\uDFFF]|\uD82B[\uDC00-\uDFEF\uDFF4\uDFFC\uDFFF]|\uD82C[\uDD23-\uDD4F\uDD53-\uDD63\uDD68-\uDD6F\uDEFC-\uDFFF]|\uD82F[\uDC6B-\uDC6F\uDC7D-\uDC7F\uDC89-\uDC8F\uDC9A\uDC9B\uDCA4-\uDFFF]|\uD833[\uDC00-\uDEFF\uDF2E\uDF2F\uDF47-\uDF4F\uDFC4-\uDFFF]|\uD834[\uDCF6-\uDCFF\uDD27\uDD28\uDDEB-\uDDFF\uDE46-\uDEDF\uDEF4-\uDEFF\uDF57-\uDF5F\uDF79-\uDFFF]|\uD835[\uDC55\uDC9D\uDCA0\uDCA1\uDCA3\uDCA4\uDCA7\uDCA8\uDCAD\uDCBA\uDCBC\uDCC4\uDD06\uDD0B\uDD0C\uDD15\uDD1D\uDD3A\uDD3F\uDD45\uDD47-\uDD49\uDD51\uDEA6\uDEA7\uDFCC\uDFCD]|\uD836[\uDE8C-\uDE9A\uDEA0\uDEB0-\uDFFF]|\uD837[\uDC00-\uDEFF\uDF1F-\uDFFF]|\uD838[\uDC07\uDC19\uDC1A\uDC22\uDC25\uDC2B-\uDCFF\uDD2D-\uDD2F\uDD3E\uDD3F\uDD4A-\uDD4D\uDD50-\uDE8F\uDEAF-\uDEBF\uDEFA-\uDEFE\uDF00-\uDFFF]|\uD839[\uDC00-\uDFDF\uDFE7\uDFEC\uDFEF\uDFFF]|\uD83A[\uDCC5\uDCC6\uDCD7-\uDCFF\uDD4C-\uDD4F\uDD5A-\uDD5D\uDD60-\uDFFF]|\uD83B[\uDC00-\uDC70\uDCB5-\uDD00\uDD3E-\uDDFF\uDE04\uDE20\uDE23\uDE25\uDE26\uDE28\uDE33\uDE38\uDE3A\uDE3C-\uDE41\uDE43-\uDE46\uDE48\uDE4A\uDE4C\uDE50\uDE53\uDE55\uDE56\uDE58\uDE5A\uDE5C\uDE5E\uDE60\uDE63\uDE65\uDE66\uDE6B\uDE73\uDE78\uDE7D\uDE7F\uDE8A\uDE9C-\uDEA0\uDEA4\uDEAA\uDEBC-\uDEEF\uDEF2-\uDFFF]|\uD83C[\uDC2C-\uDC2F\uDC94-\uDC9F\uDCAF\uDCB0\uDCC0\uDCD0\uDCF6-\uDCFF\uDDAE-\uDDE5\uDE03-\uDE0F\uDE3C-\uDE3F\uDE49-\uDE4F\uDE52-\uDE5F\uDE66-\uDEFF]|\uD83D[\uDED8-\uDEDC\uDEED-\uDEEF\uDEFD-\uDEFF\uDF74-\uDF7F\uDFD9-\uDFDF\uDFEC-\uDFEF\uDFF1-\uDFFF]|\uD83E[\uDC0C-\uDC0F\uDC48-\uDC4F\uDC5A-\uDC5F\uDC88-\uDC8F\uDCAE\uDCAF\uDCB2-\uDCFF\uDE54-\uDE5F\uDE6E\uDE6F\uDE75-\uDE77\uDE7D-\uDE7F\uDE87-\uDE8F\uDEAD-\uDEAF\uDEBB-\uDEBF\uDEC6-\uDECF\uDEDA-\uDEDF\uDEE8-\uDEEF\uDEF7-\uDEFF\uDF93\uDFCB-\uDFEF\uDFFA-\uDFFF]|\uD869[\uDEE0-\uDEFF]|\uD86D[\uDF39-\uDF3F]|\uD86E[\uDC1E\uDC1F]|\uD873[\uDEA2-\uDEAF]|\uD87A[\uDFE1-\uDFFF]|\uD87E[\uDE1E-\uDFFF]|\uD884[\uDF4B-\uDFFF]|\uDB40[\uDC00\uDC02-\uDC1F\uDC80-\uDCFF\uDDF0-\uDFFF]|[\uDBBF\uDBFF][\uDFFE\uDFFF]'
    },
    {
        'name': 'Co',
        'alias': 'Private_Use',
        'bmp': '\uE000-\uF8FF',
        'astral': '[\uDB80-\uDBBE\uDBC0-\uDBFE][\uDC00-\uDFFF]|[\uDBBF\uDBFF][\uDC00-\uDFFD]'
    },
    {
        'name': 'Cs',
        'alias': 'Surrogate',
        'bmp': '\uD800-\uDFFF'
    },
    {
        'name': 'L',
        'alias': 'Letter',
        'bmp': 'A-Za-z\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0560-\u0588\u05D0-\u05EA\u05EF-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u0860-\u086A\u0870-\u0887\u0889-\u088E\u08A0-\u08C9\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u09FC\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0AF9\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58-\u0C5A\u0C5D\u0C60\u0C61\u0C80\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D04-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D54-\u0D56\u0D5F-\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E86-\u0E8A\u0E8C-\u0EA3\u0EA5\u0EA7-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16F1-\u16F8\u1700-\u1711\u171F-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1878\u1880-\u1884\u1887-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4C\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1C80-\u1C88\u1C90-\u1CBA\u1CBD-\u1CBF\u1CE9-\u1CEC\u1CEE-\u1CF3\u1CF5\u1CF6\u1CFA\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2183\u2184\u2C00-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005\u3006\u3031-\u3035\u303B\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312F\u3131-\u318E\u31A0-\u31BF\u31F0-\u31FF\u3400-\u4DBF\u4E00-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6E5\uA717-\uA71F\uA722-\uA788\uA78B-\uA7CA\uA7D0\uA7D1\uA7D3\uA7D5-\uA7D9\uA7F2-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA8FD\uA8FE\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB69\uAB70-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC',
        'astral': '\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDE80-\uDE9C\uDEA0-\uDED0\uDF00-\uDF1F\uDF2D-\uDF40\uDF42-\uDF49\uDF50-\uDF75\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF]|\uD801[\uDC00-\uDC9D\uDCB0-\uDCD3\uDCD8-\uDCFB\uDD00-\uDD27\uDD30-\uDD63\uDD70-\uDD7A\uDD7C-\uDD8A\uDD8C-\uDD92\uDD94\uDD95\uDD97-\uDDA1\uDDA3-\uDDB1\uDDB3-\uDDB9\uDDBB\uDDBC\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67\uDF80-\uDF85\uDF87-\uDFB0\uDFB2-\uDFBA]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDCE0-\uDCF2\uDCF4\uDCF5\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00\uDE10-\uDE13\uDE15-\uDE17\uDE19-\uDE35\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE4\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48\uDC80-\uDCB2\uDCC0-\uDCF2\uDD00-\uDD23\uDE80-\uDEA9\uDEB0\uDEB1\uDF00-\uDF1C\uDF27\uDF30-\uDF45\uDF70-\uDF81\uDFB0-\uDFC4\uDFE0-\uDFF6]|\uD804[\uDC03-\uDC37\uDC71\uDC72\uDC75\uDC83-\uDCAF\uDCD0-\uDCE8\uDD03-\uDD26\uDD44\uDD47\uDD50-\uDD72\uDD76\uDD83-\uDDB2\uDDC1-\uDDC4\uDDDA\uDDDC\uDE00-\uDE11\uDE13-\uDE2B\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEDE\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3D\uDF50\uDF5D-\uDF61]|\uD805[\uDC00-\uDC34\uDC47-\uDC4A\uDC5F-\uDC61\uDC80-\uDCAF\uDCC4\uDCC5\uDCC7\uDD80-\uDDAE\uDDD8-\uDDDB\uDE00-\uDE2F\uDE44\uDE80-\uDEAA\uDEB8\uDF00-\uDF1A\uDF40-\uDF46]|\uD806[\uDC00-\uDC2B\uDCA0-\uDCDF\uDCFF-\uDD06\uDD09\uDD0C-\uDD13\uDD15\uDD16\uDD18-\uDD2F\uDD3F\uDD41\uDDA0-\uDDA7\uDDAA-\uDDD0\uDDE1\uDDE3\uDE00\uDE0B-\uDE32\uDE3A\uDE50\uDE5C-\uDE89\uDE9D\uDEB0-\uDEF8]|\uD807[\uDC00-\uDC08\uDC0A-\uDC2E\uDC40\uDC72-\uDC8F\uDD00-\uDD06\uDD08\uDD09\uDD0B-\uDD30\uDD46\uDD60-\uDD65\uDD67\uDD68\uDD6A-\uDD89\uDD98\uDEE0-\uDEF2\uDFB0]|\uD808[\uDC00-\uDF99]|\uD809[\uDC80-\uDD43]|\uD80B[\uDF90-\uDFF0]|[\uD80C\uD81C-\uD820\uD822\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872\uD874-\uD879\uD880-\uD883][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD811[\uDC00-\uDE46]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDE70-\uDEBE\uDED0-\uDEED\uDF00-\uDF2F\uDF40-\uDF43\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDE40-\uDE7F\uDF00-\uDF4A\uDF50\uDF93-\uDF9F\uDFE0\uDFE1\uDFE3]|\uD821[\uDC00-\uDFF7]|\uD823[\uDC00-\uDCD5\uDD00-\uDD08]|\uD82B[\uDFF0-\uDFF3\uDFF5-\uDFFB\uDFFD\uDFFE]|\uD82C[\uDC00-\uDD22\uDD50-\uDD52\uDD64-\uDD67\uDD70-\uDEFB]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB]|\uD837[\uDF00-\uDF1E]|\uD838[\uDD00-\uDD2C\uDD37-\uDD3D\uDD4E\uDE90-\uDEAD\uDEC0-\uDEEB]|\uD839[\uDFE0-\uDFE6\uDFE8-\uDFEB\uDFED\uDFEE\uDFF0-\uDFFE]|\uD83A[\uDC00-\uDCC4\uDD00-\uDD43\uDD4B]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDEDF\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF38\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1\uDEB0-\uDFFF]|\uD87A[\uDC00-\uDFE0]|\uD87E[\uDC00-\uDE1D]|\uD884[\uDC00-\uDF4A]'
    },
    {
        'name': 'LC',
        'alias': 'Cased_Letter',
        'bmp': 'A-Za-z\xB5\xC0-\xD6\xD8-\xF6\xF8-\u01BA\u01BC-\u01BF\u01C4-\u0293\u0295-\u02AF\u0370-\u0373\u0376\u0377\u037B-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0560-\u0588\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FD-\u10FF\u13A0-\u13F5\u13F8-\u13FD\u1C80-\u1C88\u1C90-\u1CBA\u1CBD-\u1CBF\u1D00-\u1D2B\u1D6B-\u1D77\u1D79-\u1D9A\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2134\u2139\u213C-\u213F\u2145-\u2149\u214E\u2183\u2184\u2C00-\u2C7B\u2C7E-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\uA640-\uA66D\uA680-\uA69B\uA722-\uA76F\uA771-\uA787\uA78B-\uA78E\uA790-\uA7CA\uA7D0\uA7D1\uA7D3\uA7D5-\uA7D9\uA7F5\uA7F6\uA7FA\uAB30-\uAB5A\uAB60-\uAB68\uAB70-\uABBF\uFB00-\uFB06\uFB13-\uFB17\uFF21-\uFF3A\uFF41-\uFF5A',
        'astral': '\uD801[\uDC00-\uDC4F\uDCB0-\uDCD3\uDCD8-\uDCFB\uDD70-\uDD7A\uDD7C-\uDD8A\uDD8C-\uDD92\uDD94\uDD95\uDD97-\uDDA1\uDDA3-\uDDB1\uDDB3-\uDDB9\uDDBB\uDDBC]|\uD803[\uDC80-\uDCB2\uDCC0-\uDCF2]|\uD806[\uDCA0-\uDCDF]|\uD81B[\uDE40-\uDE7F]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB]|\uD837[\uDF00-\uDF09\uDF0B-\uDF1E]|\uD83A[\uDD00-\uDD43]'
    },
    {
        'name': 'Ll',
        'alias': 'Lowercase_Letter',
        'bmp': 'a-z\xB5\xDF-\xF6\xF8-\xFF\u0101\u0103\u0105\u0107\u0109\u010B\u010D\u010F\u0111\u0113\u0115\u0117\u0119\u011B\u011D\u011F\u0121\u0123\u0125\u0127\u0129\u012B\u012D\u012F\u0131\u0133\u0135\u0137\u0138\u013A\u013C\u013E\u0140\u0142\u0144\u0146\u0148\u0149\u014B\u014D\u014F\u0151\u0153\u0155\u0157\u0159\u015B\u015D\u015F\u0161\u0163\u0165\u0167\u0169\u016B\u016D\u016F\u0171\u0173\u0175\u0177\u017A\u017C\u017E-\u0180\u0183\u0185\u0188\u018C\u018D\u0192\u0195\u0199-\u019B\u019E\u01A1\u01A3\u01A5\u01A8\u01AA\u01AB\u01AD\u01B0\u01B4\u01B6\u01B9\u01BA\u01BD-\u01BF\u01C6\u01C9\u01CC\u01CE\u01D0\u01D2\u01D4\u01D6\u01D8\u01DA\u01DC\u01DD\u01DF\u01E1\u01E3\u01E5\u01E7\u01E9\u01EB\u01ED\u01EF\u01F0\u01F3\u01F5\u01F9\u01FB\u01FD\u01FF\u0201\u0203\u0205\u0207\u0209\u020B\u020D\u020F\u0211\u0213\u0215\u0217\u0219\u021B\u021D\u021F\u0221\u0223\u0225\u0227\u0229\u022B\u022D\u022F\u0231\u0233-\u0239\u023C\u023F\u0240\u0242\u0247\u0249\u024B\u024D\u024F-\u0293\u0295-\u02AF\u0371\u0373\u0377\u037B-\u037D\u0390\u03AC-\u03CE\u03D0\u03D1\u03D5-\u03D7\u03D9\u03DB\u03DD\u03DF\u03E1\u03E3\u03E5\u03E7\u03E9\u03EB\u03ED\u03EF-\u03F3\u03F5\u03F8\u03FB\u03FC\u0430-\u045F\u0461\u0463\u0465\u0467\u0469\u046B\u046D\u046F\u0471\u0473\u0475\u0477\u0479\u047B\u047D\u047F\u0481\u048B\u048D\u048F\u0491\u0493\u0495\u0497\u0499\u049B\u049D\u049F\u04A1\u04A3\u04A5\u04A7\u04A9\u04AB\u04AD\u04AF\u04B1\u04B3\u04B5\u04B7\u04B9\u04BB\u04BD\u04BF\u04C2\u04C4\u04C6\u04C8\u04CA\u04CC\u04CE\u04CF\u04D1\u04D3\u04D5\u04D7\u04D9\u04DB\u04DD\u04DF\u04E1\u04E3\u04E5\u04E7\u04E9\u04EB\u04ED\u04EF\u04F1\u04F3\u04F5\u04F7\u04F9\u04FB\u04FD\u04FF\u0501\u0503\u0505\u0507\u0509\u050B\u050D\u050F\u0511\u0513\u0515\u0517\u0519\u051B\u051D\u051F\u0521\u0523\u0525\u0527\u0529\u052B\u052D\u052F\u0560-\u0588\u10D0-\u10FA\u10FD-\u10FF\u13F8-\u13FD\u1C80-\u1C88\u1D00-\u1D2B\u1D6B-\u1D77\u1D79-\u1D9A\u1E01\u1E03\u1E05\u1E07\u1E09\u1E0B\u1E0D\u1E0F\u1E11\u1E13\u1E15\u1E17\u1E19\u1E1B\u1E1D\u1E1F\u1E21\u1E23\u1E25\u1E27\u1E29\u1E2B\u1E2D\u1E2F\u1E31\u1E33\u1E35\u1E37\u1E39\u1E3B\u1E3D\u1E3F\u1E41\u1E43\u1E45\u1E47\u1E49\u1E4B\u1E4D\u1E4F\u1E51\u1E53\u1E55\u1E57\u1E59\u1E5B\u1E5D\u1E5F\u1E61\u1E63\u1E65\u1E67\u1E69\u1E6B\u1E6D\u1E6F\u1E71\u1E73\u1E75\u1E77\u1E79\u1E7B\u1E7D\u1E7F\u1E81\u1E83\u1E85\u1E87\u1E89\u1E8B\u1E8D\u1E8F\u1E91\u1E93\u1E95-\u1E9D\u1E9F\u1EA1\u1EA3\u1EA5\u1EA7\u1EA9\u1EAB\u1EAD\u1EAF\u1EB1\u1EB3\u1EB5\u1EB7\u1EB9\u1EBB\u1EBD\u1EBF\u1EC1\u1EC3\u1EC5\u1EC7\u1EC9\u1ECB\u1ECD\u1ECF\u1ED1\u1ED3\u1ED5\u1ED7\u1ED9\u1EDB\u1EDD\u1EDF\u1EE1\u1EE3\u1EE5\u1EE7\u1EE9\u1EEB\u1EED\u1EEF\u1EF1\u1EF3\u1EF5\u1EF7\u1EF9\u1EFB\u1EFD\u1EFF-\u1F07\u1F10-\u1F15\u1F20-\u1F27\u1F30-\u1F37\u1F40-\u1F45\u1F50-\u1F57\u1F60-\u1F67\u1F70-\u1F7D\u1F80-\u1F87\u1F90-\u1F97\u1FA0-\u1FA7\u1FB0-\u1FB4\u1FB6\u1FB7\u1FBE\u1FC2-\u1FC4\u1FC6\u1FC7\u1FD0-\u1FD3\u1FD6\u1FD7\u1FE0-\u1FE7\u1FF2-\u1FF4\u1FF6\u1FF7\u210A\u210E\u210F\u2113\u212F\u2134\u2139\u213C\u213D\u2146-\u2149\u214E\u2184\u2C30-\u2C5F\u2C61\u2C65\u2C66\u2C68\u2C6A\u2C6C\u2C71\u2C73\u2C74\u2C76-\u2C7B\u2C81\u2C83\u2C85\u2C87\u2C89\u2C8B\u2C8D\u2C8F\u2C91\u2C93\u2C95\u2C97\u2C99\u2C9B\u2C9D\u2C9F\u2CA1\u2CA3\u2CA5\u2CA7\u2CA9\u2CAB\u2CAD\u2CAF\u2CB1\u2CB3\u2CB5\u2CB7\u2CB9\u2CBB\u2CBD\u2CBF\u2CC1\u2CC3\u2CC5\u2CC7\u2CC9\u2CCB\u2CCD\u2CCF\u2CD1\u2CD3\u2CD5\u2CD7\u2CD9\u2CDB\u2CDD\u2CDF\u2CE1\u2CE3\u2CE4\u2CEC\u2CEE\u2CF3\u2D00-\u2D25\u2D27\u2D2D\uA641\uA643\uA645\uA647\uA649\uA64B\uA64D\uA64F\uA651\uA653\uA655\uA657\uA659\uA65B\uA65D\uA65F\uA661\uA663\uA665\uA667\uA669\uA66B\uA66D\uA681\uA683\uA685\uA687\uA689\uA68B\uA68D\uA68F\uA691\uA693\uA695\uA697\uA699\uA69B\uA723\uA725\uA727\uA729\uA72B\uA72D\uA72F-\uA731\uA733\uA735\uA737\uA739\uA73B\uA73D\uA73F\uA741\uA743\uA745\uA747\uA749\uA74B\uA74D\uA74F\uA751\uA753\uA755\uA757\uA759\uA75B\uA75D\uA75F\uA761\uA763\uA765\uA767\uA769\uA76B\uA76D\uA76F\uA771-\uA778\uA77A\uA77C\uA77F\uA781\uA783\uA785\uA787\uA78C\uA78E\uA791\uA793-\uA795\uA797\uA799\uA79B\uA79D\uA79F\uA7A1\uA7A3\uA7A5\uA7A7\uA7A9\uA7AF\uA7B5\uA7B7\uA7B9\uA7BB\uA7BD\uA7BF\uA7C1\uA7C3\uA7C8\uA7CA\uA7D1\uA7D3\uA7D5\uA7D7\uA7D9\uA7F6\uA7FA\uAB30-\uAB5A\uAB60-\uAB68\uAB70-\uABBF\uFB00-\uFB06\uFB13-\uFB17\uFF41-\uFF5A',
        'astral': '\uD801[\uDC28-\uDC4F\uDCD8-\uDCFB\uDD97-\uDDA1\uDDA3-\uDDB1\uDDB3-\uDDB9\uDDBB\uDDBC]|\uD803[\uDCC0-\uDCF2]|\uD806[\uDCC0-\uDCDF]|\uD81B[\uDE60-\uDE7F]|\uD835[\uDC1A-\uDC33\uDC4E-\uDC54\uDC56-\uDC67\uDC82-\uDC9B\uDCB6-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDCCF\uDCEA-\uDD03\uDD1E-\uDD37\uDD52-\uDD6B\uDD86-\uDD9F\uDDBA-\uDDD3\uDDEE-\uDE07\uDE22-\uDE3B\uDE56-\uDE6F\uDE8A-\uDEA5\uDEC2-\uDEDA\uDEDC-\uDEE1\uDEFC-\uDF14\uDF16-\uDF1B\uDF36-\uDF4E\uDF50-\uDF55\uDF70-\uDF88\uDF8A-\uDF8F\uDFAA-\uDFC2\uDFC4-\uDFC9\uDFCB]|\uD837[\uDF00-\uDF09\uDF0B-\uDF1E]|\uD83A[\uDD22-\uDD43]'
    },
    {
        'name': 'Lm',
        'alias': 'Modifier_Letter',
        'bmp': '\u02B0-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0374\u037A\u0559\u0640\u06E5\u06E6\u07F4\u07F5\u07FA\u081A\u0824\u0828\u08C9\u0971\u0E46\u0EC6\u10FC\u17D7\u1843\u1AA7\u1C78-\u1C7D\u1D2C-\u1D6A\u1D78\u1D9B-\u1DBF\u2071\u207F\u2090-\u209C\u2C7C\u2C7D\u2D6F\u2E2F\u3005\u3031-\u3035\u303B\u309D\u309E\u30FC-\u30FE\uA015\uA4F8-\uA4FD\uA60C\uA67F\uA69C\uA69D\uA717-\uA71F\uA770\uA788\uA7F2-\uA7F4\uA7F8\uA7F9\uA9CF\uA9E6\uAA70\uAADD\uAAF3\uAAF4\uAB5C-\uAB5F\uAB69\uFF70\uFF9E\uFF9F',
        'astral': '\uD801[\uDF80-\uDF85\uDF87-\uDFB0\uDFB2-\uDFBA]|\uD81A[\uDF40-\uDF43]|\uD81B[\uDF93-\uDF9F\uDFE0\uDFE1\uDFE3]|\uD82B[\uDFF0-\uDFF3\uDFF5-\uDFFB\uDFFD\uDFFE]|\uD838[\uDD37-\uDD3D]|\uD83A\uDD4B'
    },
    {
        'name': 'Lo',
        'alias': 'Other_Letter',
        'bmp': '\xAA\xBA\u01BB\u01C0-\u01C3\u0294\u05D0-\u05EA\u05EF-\u05F2\u0620-\u063F\u0641-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u0800-\u0815\u0840-\u0858\u0860-\u086A\u0870-\u0887\u0889-\u088E\u08A0-\u08C8\u0904-\u0939\u093D\u0950\u0958-\u0961\u0972-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u09FC\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0AF9\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58-\u0C5A\u0C5D\u0C60\u0C61\u0C80\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D04-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D54-\u0D56\u0D5F-\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E45\u0E81\u0E82\u0E84\u0E86-\u0E8A\u0E8C-\u0EA3\u0EA5\u0EA7-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u1100-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16F1-\u16F8\u1700-\u1711\u171F-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17DC\u1820-\u1842\u1844-\u1878\u1880-\u1884\u1887-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u1A00-\u1A16\u1A20-\u1A54\u1B05-\u1B33\u1B45-\u1B4C\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C77\u1CE9-\u1CEC\u1CEE-\u1CF3\u1CF5\u1CF6\u1CFA\u2135-\u2138\u2D30-\u2D67\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u3006\u303C\u3041-\u3096\u309F\u30A1-\u30FA\u30FF\u3105-\u312F\u3131-\u318E\u31A0-\u31BF\u31F0-\u31FF\u3400-\u4DBF\u4E00-\uA014\uA016-\uA48C\uA4D0-\uA4F7\uA500-\uA60B\uA610-\uA61F\uA62A\uA62B\uA66E\uA6A0-\uA6E5\uA78F\uA7F7\uA7FB-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA8FD\uA8FE\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9E0-\uA9E4\uA9E7-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA6F\uAA71-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB\uAADC\uAAE0-\uAAEA\uAAF2\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uABC0-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF66-\uFF6F\uFF71-\uFF9D\uFFA0-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC',
        'astral': '\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDE80-\uDE9C\uDEA0-\uDED0\uDF00-\uDF1F\uDF2D-\uDF40\uDF42-\uDF49\uDF50-\uDF75\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF]|\uD801[\uDC50-\uDC9D\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDCE0-\uDCF2\uDCF4\uDCF5\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00\uDE10-\uDE13\uDE15-\uDE17\uDE19-\uDE35\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE4\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48\uDD00-\uDD23\uDE80-\uDEA9\uDEB0\uDEB1\uDF00-\uDF1C\uDF27\uDF30-\uDF45\uDF70-\uDF81\uDFB0-\uDFC4\uDFE0-\uDFF6]|\uD804[\uDC03-\uDC37\uDC71\uDC72\uDC75\uDC83-\uDCAF\uDCD0-\uDCE8\uDD03-\uDD26\uDD44\uDD47\uDD50-\uDD72\uDD76\uDD83-\uDDB2\uDDC1-\uDDC4\uDDDA\uDDDC\uDE00-\uDE11\uDE13-\uDE2B\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEDE\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3D\uDF50\uDF5D-\uDF61]|\uD805[\uDC00-\uDC34\uDC47-\uDC4A\uDC5F-\uDC61\uDC80-\uDCAF\uDCC4\uDCC5\uDCC7\uDD80-\uDDAE\uDDD8-\uDDDB\uDE00-\uDE2F\uDE44\uDE80-\uDEAA\uDEB8\uDF00-\uDF1A\uDF40-\uDF46]|\uD806[\uDC00-\uDC2B\uDCFF-\uDD06\uDD09\uDD0C-\uDD13\uDD15\uDD16\uDD18-\uDD2F\uDD3F\uDD41\uDDA0-\uDDA7\uDDAA-\uDDD0\uDDE1\uDDE3\uDE00\uDE0B-\uDE32\uDE3A\uDE50\uDE5C-\uDE89\uDE9D\uDEB0-\uDEF8]|\uD807[\uDC00-\uDC08\uDC0A-\uDC2E\uDC40\uDC72-\uDC8F\uDD00-\uDD06\uDD08\uDD09\uDD0B-\uDD30\uDD46\uDD60-\uDD65\uDD67\uDD68\uDD6A-\uDD89\uDD98\uDEE0-\uDEF2\uDFB0]|\uD808[\uDC00-\uDF99]|\uD809[\uDC80-\uDD43]|\uD80B[\uDF90-\uDFF0]|[\uD80C\uD81C-\uD820\uD822\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872\uD874-\uD879\uD880-\uD883][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD811[\uDC00-\uDE46]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDE70-\uDEBE\uDED0-\uDEED\uDF00-\uDF2F\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF4A\uDF50]|\uD821[\uDC00-\uDFF7]|\uD823[\uDC00-\uDCD5\uDD00-\uDD08]|\uD82C[\uDC00-\uDD22\uDD50-\uDD52\uDD64-\uDD67\uDD70-\uDEFB]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99]|\uD837\uDF0A|\uD838[\uDD00-\uDD2C\uDD4E\uDE90-\uDEAD\uDEC0-\uDEEB]|\uD839[\uDFE0-\uDFE6\uDFE8-\uDFEB\uDFED\uDFEE\uDFF0-\uDFFE]|\uD83A[\uDC00-\uDCC4]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDEDF\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF38\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1\uDEB0-\uDFFF]|\uD87A[\uDC00-\uDFE0]|\uD87E[\uDC00-\uDE1D]|\uD884[\uDC00-\uDF4A]'
    },
    {
        'name': 'Lt',
        'alias': 'Titlecase_Letter',
        'bmp': '\u01C5\u01C8\u01CB\u01F2\u1F88-\u1F8F\u1F98-\u1F9F\u1FA8-\u1FAF\u1FBC\u1FCC\u1FFC'
    },
    {
        'name': 'Lu',
        'alias': 'Uppercase_Letter',
        'bmp': 'A-Z\xC0-\xD6\xD8-\xDE\u0100\u0102\u0104\u0106\u0108\u010A\u010C\u010E\u0110\u0112\u0114\u0116\u0118\u011A\u011C\u011E\u0120\u0122\u0124\u0126\u0128\u012A\u012C\u012E\u0130\u0132\u0134\u0136\u0139\u013B\u013D\u013F\u0141\u0143\u0145\u0147\u014A\u014C\u014E\u0150\u0152\u0154\u0156\u0158\u015A\u015C\u015E\u0160\u0162\u0164\u0166\u0168\u016A\u016C\u016E\u0170\u0172\u0174\u0176\u0178\u0179\u017B\u017D\u0181\u0182\u0184\u0186\u0187\u0189-\u018B\u018E-\u0191\u0193\u0194\u0196-\u0198\u019C\u019D\u019F\u01A0\u01A2\u01A4\u01A6\u01A7\u01A9\u01AC\u01AE\u01AF\u01B1-\u01B3\u01B5\u01B7\u01B8\u01BC\u01C4\u01C7\u01CA\u01CD\u01CF\u01D1\u01D3\u01D5\u01D7\u01D9\u01DB\u01DE\u01E0\u01E2\u01E4\u01E6\u01E8\u01EA\u01EC\u01EE\u01F1\u01F4\u01F6-\u01F8\u01FA\u01FC\u01FE\u0200\u0202\u0204\u0206\u0208\u020A\u020C\u020E\u0210\u0212\u0214\u0216\u0218\u021A\u021C\u021E\u0220\u0222\u0224\u0226\u0228\u022A\u022C\u022E\u0230\u0232\u023A\u023B\u023D\u023E\u0241\u0243-\u0246\u0248\u024A\u024C\u024E\u0370\u0372\u0376\u037F\u0386\u0388-\u038A\u038C\u038E\u038F\u0391-\u03A1\u03A3-\u03AB\u03CF\u03D2-\u03D4\u03D8\u03DA\u03DC\u03DE\u03E0\u03E2\u03E4\u03E6\u03E8\u03EA\u03EC\u03EE\u03F4\u03F7\u03F9\u03FA\u03FD-\u042F\u0460\u0462\u0464\u0466\u0468\u046A\u046C\u046E\u0470\u0472\u0474\u0476\u0478\u047A\u047C\u047E\u0480\u048A\u048C\u048E\u0490\u0492\u0494\u0496\u0498\u049A\u049C\u049E\u04A0\u04A2\u04A4\u04A6\u04A8\u04AA\u04AC\u04AE\u04B0\u04B2\u04B4\u04B6\u04B8\u04BA\u04BC\u04BE\u04C0\u04C1\u04C3\u04C5\u04C7\u04C9\u04CB\u04CD\u04D0\u04D2\u04D4\u04D6\u04D8\u04DA\u04DC\u04DE\u04E0\u04E2\u04E4\u04E6\u04E8\u04EA\u04EC\u04EE\u04F0\u04F2\u04F4\u04F6\u04F8\u04FA\u04FC\u04FE\u0500\u0502\u0504\u0506\u0508\u050A\u050C\u050E\u0510\u0512\u0514\u0516\u0518\u051A\u051C\u051E\u0520\u0522\u0524\u0526\u0528\u052A\u052C\u052E\u0531-\u0556\u10A0-\u10C5\u10C7\u10CD\u13A0-\u13F5\u1C90-\u1CBA\u1CBD-\u1CBF\u1E00\u1E02\u1E04\u1E06\u1E08\u1E0A\u1E0C\u1E0E\u1E10\u1E12\u1E14\u1E16\u1E18\u1E1A\u1E1C\u1E1E\u1E20\u1E22\u1E24\u1E26\u1E28\u1E2A\u1E2C\u1E2E\u1E30\u1E32\u1E34\u1E36\u1E38\u1E3A\u1E3C\u1E3E\u1E40\u1E42\u1E44\u1E46\u1E48\u1E4A\u1E4C\u1E4E\u1E50\u1E52\u1E54\u1E56\u1E58\u1E5A\u1E5C\u1E5E\u1E60\u1E62\u1E64\u1E66\u1E68\u1E6A\u1E6C\u1E6E\u1E70\u1E72\u1E74\u1E76\u1E78\u1E7A\u1E7C\u1E7E\u1E80\u1E82\u1E84\u1E86\u1E88\u1E8A\u1E8C\u1E8E\u1E90\u1E92\u1E94\u1E9E\u1EA0\u1EA2\u1EA4\u1EA6\u1EA8\u1EAA\u1EAC\u1EAE\u1EB0\u1EB2\u1EB4\u1EB6\u1EB8\u1EBA\u1EBC\u1EBE\u1EC0\u1EC2\u1EC4\u1EC6\u1EC8\u1ECA\u1ECC\u1ECE\u1ED0\u1ED2\u1ED4\u1ED6\u1ED8\u1EDA\u1EDC\u1EDE\u1EE0\u1EE2\u1EE4\u1EE6\u1EE8\u1EEA\u1EEC\u1EEE\u1EF0\u1EF2\u1EF4\u1EF6\u1EF8\u1EFA\u1EFC\u1EFE\u1F08-\u1F0F\u1F18-\u1F1D\u1F28-\u1F2F\u1F38-\u1F3F\u1F48-\u1F4D\u1F59\u1F5B\u1F5D\u1F5F\u1F68-\u1F6F\u1FB8-\u1FBB\u1FC8-\u1FCB\u1FD8-\u1FDB\u1FE8-\u1FEC\u1FF8-\u1FFB\u2102\u2107\u210B-\u210D\u2110-\u2112\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u2130-\u2133\u213E\u213F\u2145\u2183\u2C00-\u2C2F\u2C60\u2C62-\u2C64\u2C67\u2C69\u2C6B\u2C6D-\u2C70\u2C72\u2C75\u2C7E-\u2C80\u2C82\u2C84\u2C86\u2C88\u2C8A\u2C8C\u2C8E\u2C90\u2C92\u2C94\u2C96\u2C98\u2C9A\u2C9C\u2C9E\u2CA0\u2CA2\u2CA4\u2CA6\u2CA8\u2CAA\u2CAC\u2CAE\u2CB0\u2CB2\u2CB4\u2CB6\u2CB8\u2CBA\u2CBC\u2CBE\u2CC0\u2CC2\u2CC4\u2CC6\u2CC8\u2CCA\u2CCC\u2CCE\u2CD0\u2CD2\u2CD4\u2CD6\u2CD8\u2CDA\u2CDC\u2CDE\u2CE0\u2CE2\u2CEB\u2CED\u2CF2\uA640\uA642\uA644\uA646\uA648\uA64A\uA64C\uA64E\uA650\uA652\uA654\uA656\uA658\uA65A\uA65C\uA65E\uA660\uA662\uA664\uA666\uA668\uA66A\uA66C\uA680\uA682\uA684\uA686\uA688\uA68A\uA68C\uA68E\uA690\uA692\uA694\uA696\uA698\uA69A\uA722\uA724\uA726\uA728\uA72A\uA72C\uA72E\uA732\uA734\uA736\uA738\uA73A\uA73C\uA73E\uA740\uA742\uA744\uA746\uA748\uA74A\uA74C\uA74E\uA750\uA752\uA754\uA756\uA758\uA75A\uA75C\uA75E\uA760\uA762\uA764\uA766\uA768\uA76A\uA76C\uA76E\uA779\uA77B\uA77D\uA77E\uA780\uA782\uA784\uA786\uA78B\uA78D\uA790\uA792\uA796\uA798\uA79A\uA79C\uA79E\uA7A0\uA7A2\uA7A4\uA7A6\uA7A8\uA7AA-\uA7AE\uA7B0-\uA7B4\uA7B6\uA7B8\uA7BA\uA7BC\uA7BE\uA7C0\uA7C2\uA7C4-\uA7C7\uA7C9\uA7D0\uA7D6\uA7D8\uA7F5\uFF21-\uFF3A',
        'astral': '\uD801[\uDC00-\uDC27\uDCB0-\uDCD3\uDD70-\uDD7A\uDD7C-\uDD8A\uDD8C-\uDD92\uDD94\uDD95]|\uD803[\uDC80-\uDCB2]|\uD806[\uDCA0-\uDCBF]|\uD81B[\uDE40-\uDE5F]|\uD835[\uDC00-\uDC19\uDC34-\uDC4D\uDC68-\uDC81\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB5\uDCD0-\uDCE9\uDD04\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD38\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD6C-\uDD85\uDDA0-\uDDB9\uDDD4-\uDDED\uDE08-\uDE21\uDE3C-\uDE55\uDE70-\uDE89\uDEA8-\uDEC0\uDEE2-\uDEFA\uDF1C-\uDF34\uDF56-\uDF6E\uDF90-\uDFA8\uDFCA]|\uD83A[\uDD00-\uDD21]'
    },
    {
        'name': 'M',
        'alias': 'Mark',
        'bmp': '\u0300-\u036F\u0483-\u0489\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED\u0711\u0730-\u074A\u07A6-\u07B0\u07EB-\u07F3\u07FD\u0816-\u0819\u081B-\u0823\u0825-\u0827\u0829-\u082D\u0859-\u085B\u0898-\u089F\u08CA-\u08E1\u08E3-\u0903\u093A-\u093C\u093E-\u094F\u0951-\u0957\u0962\u0963\u0981-\u0983\u09BC\u09BE-\u09C4\u09C7\u09C8\u09CB-\u09CD\u09D7\u09E2\u09E3\u09FE\u0A01-\u0A03\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A70\u0A71\u0A75\u0A81-\u0A83\u0ABC\u0ABE-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AE2\u0AE3\u0AFA-\u0AFF\u0B01-\u0B03\u0B3C\u0B3E-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B55-\u0B57\u0B62\u0B63\u0B82\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD7\u0C00-\u0C04\u0C3C\u0C3E-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C62\u0C63\u0C81-\u0C83\u0CBC\u0CBE-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CE2\u0CE3\u0D00-\u0D03\u0D3B\u0D3C\u0D3E-\u0D44\u0D46-\u0D48\u0D4A-\u0D4D\u0D57\u0D62\u0D63\u0D81-\u0D83\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DF2\u0DF3\u0E31\u0E34-\u0E3A\u0E47-\u0E4E\u0EB1\u0EB4-\u0EBC\u0EC8-\u0ECD\u0F18\u0F19\u0F35\u0F37\u0F39\u0F3E\u0F3F\u0F71-\u0F84\u0F86\u0F87\u0F8D-\u0F97\u0F99-\u0FBC\u0FC6\u102B-\u103E\u1056-\u1059\u105E-\u1060\u1062-\u1064\u1067-\u106D\u1071-\u1074\u1082-\u108D\u108F\u109A-\u109D\u135D-\u135F\u1712-\u1715\u1732-\u1734\u1752\u1753\u1772\u1773\u17B4-\u17D3\u17DD\u180B-\u180D\u180F\u1885\u1886\u18A9\u1920-\u192B\u1930-\u193B\u1A17-\u1A1B\u1A55-\u1A5E\u1A60-\u1A7C\u1A7F\u1AB0-\u1ACE\u1B00-\u1B04\u1B34-\u1B44\u1B6B-\u1B73\u1B80-\u1B82\u1BA1-\u1BAD\u1BE6-\u1BF3\u1C24-\u1C37\u1CD0-\u1CD2\u1CD4-\u1CE8\u1CED\u1CF4\u1CF7-\u1CF9\u1DC0-\u1DFF\u20D0-\u20F0\u2CEF-\u2CF1\u2D7F\u2DE0-\u2DFF\u302A-\u302F\u3099\u309A\uA66F-\uA672\uA674-\uA67D\uA69E\uA69F\uA6F0\uA6F1\uA802\uA806\uA80B\uA823-\uA827\uA82C\uA880\uA881\uA8B4-\uA8C5\uA8E0-\uA8F1\uA8FF\uA926-\uA92D\uA947-\uA953\uA980-\uA983\uA9B3-\uA9C0\uA9E5\uAA29-\uAA36\uAA43\uAA4C\uAA4D\uAA7B-\uAA7D\uAAB0\uAAB2-\uAAB4\uAAB7\uAAB8\uAABE\uAABF\uAAC1\uAAEB-\uAAEF\uAAF5\uAAF6\uABE3-\uABEA\uABEC\uABED\uFB1E\uFE00-\uFE0F\uFE20-\uFE2F',
        'astral': '\uD800[\uDDFD\uDEE0\uDF76-\uDF7A]|\uD802[\uDE01-\uDE03\uDE05\uDE06\uDE0C-\uDE0F\uDE38-\uDE3A\uDE3F\uDEE5\uDEE6]|\uD803[\uDD24-\uDD27\uDEAB\uDEAC\uDF46-\uDF50\uDF82-\uDF85]|\uD804[\uDC00-\uDC02\uDC38-\uDC46\uDC70\uDC73\uDC74\uDC7F-\uDC82\uDCB0-\uDCBA\uDCC2\uDD00-\uDD02\uDD27-\uDD34\uDD45\uDD46\uDD73\uDD80-\uDD82\uDDB3-\uDDC0\uDDC9-\uDDCC\uDDCE\uDDCF\uDE2C-\uDE37\uDE3E\uDEDF-\uDEEA\uDF00-\uDF03\uDF3B\uDF3C\uDF3E-\uDF44\uDF47\uDF48\uDF4B-\uDF4D\uDF57\uDF62\uDF63\uDF66-\uDF6C\uDF70-\uDF74]|\uD805[\uDC35-\uDC46\uDC5E\uDCB0-\uDCC3\uDDAF-\uDDB5\uDDB8-\uDDC0\uDDDC\uDDDD\uDE30-\uDE40\uDEAB-\uDEB7\uDF1D-\uDF2B]|\uD806[\uDC2C-\uDC3A\uDD30-\uDD35\uDD37\uDD38\uDD3B-\uDD3E\uDD40\uDD42\uDD43\uDDD1-\uDDD7\uDDDA-\uDDE0\uDDE4\uDE01-\uDE0A\uDE33-\uDE39\uDE3B-\uDE3E\uDE47\uDE51-\uDE5B\uDE8A-\uDE99]|\uD807[\uDC2F-\uDC36\uDC38-\uDC3F\uDC92-\uDCA7\uDCA9-\uDCB6\uDD31-\uDD36\uDD3A\uDD3C\uDD3D\uDD3F-\uDD45\uDD47\uDD8A-\uDD8E\uDD90\uDD91\uDD93-\uDD97\uDEF3-\uDEF6]|\uD81A[\uDEF0-\uDEF4\uDF30-\uDF36]|\uD81B[\uDF4F\uDF51-\uDF87\uDF8F-\uDF92\uDFE4\uDFF0\uDFF1]|\uD82F[\uDC9D\uDC9E]|\uD833[\uDF00-\uDF2D\uDF30-\uDF46]|\uD834[\uDD65-\uDD69\uDD6D-\uDD72\uDD7B-\uDD82\uDD85-\uDD8B\uDDAA-\uDDAD\uDE42-\uDE44]|\uD836[\uDE00-\uDE36\uDE3B-\uDE6C\uDE75\uDE84\uDE9B-\uDE9F\uDEA1-\uDEAF]|\uD838[\uDC00-\uDC06\uDC08-\uDC18\uDC1B-\uDC21\uDC23\uDC24\uDC26-\uDC2A\uDD30-\uDD36\uDEAE\uDEEC-\uDEEF]|\uD83A[\uDCD0-\uDCD6\uDD44-\uDD4A]|\uDB40[\uDD00-\uDDEF]'
    },
    {
        'name': 'Mc',
        'alias': 'Spacing_Mark',
        'bmp': '\u0903\u093B\u093E-\u0940\u0949-\u094C\u094E\u094F\u0982\u0983\u09BE-\u09C0\u09C7\u09C8\u09CB\u09CC\u09D7\u0A03\u0A3E-\u0A40\u0A83\u0ABE-\u0AC0\u0AC9\u0ACB\u0ACC\u0B02\u0B03\u0B3E\u0B40\u0B47\u0B48\u0B4B\u0B4C\u0B57\u0BBE\u0BBF\u0BC1\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCC\u0BD7\u0C01-\u0C03\u0C41-\u0C44\u0C82\u0C83\u0CBE\u0CC0-\u0CC4\u0CC7\u0CC8\u0CCA\u0CCB\u0CD5\u0CD6\u0D02\u0D03\u0D3E-\u0D40\u0D46-\u0D48\u0D4A-\u0D4C\u0D57\u0D82\u0D83\u0DCF-\u0DD1\u0DD8-\u0DDF\u0DF2\u0DF3\u0F3E\u0F3F\u0F7F\u102B\u102C\u1031\u1038\u103B\u103C\u1056\u1057\u1062-\u1064\u1067-\u106D\u1083\u1084\u1087-\u108C\u108F\u109A-\u109C\u1715\u1734\u17B6\u17BE-\u17C5\u17C7\u17C8\u1923-\u1926\u1929-\u192B\u1930\u1931\u1933-\u1938\u1A19\u1A1A\u1A55\u1A57\u1A61\u1A63\u1A64\u1A6D-\u1A72\u1B04\u1B35\u1B3B\u1B3D-\u1B41\u1B43\u1B44\u1B82\u1BA1\u1BA6\u1BA7\u1BAA\u1BE7\u1BEA-\u1BEC\u1BEE\u1BF2\u1BF3\u1C24-\u1C2B\u1C34\u1C35\u1CE1\u1CF7\u302E\u302F\uA823\uA824\uA827\uA880\uA881\uA8B4-\uA8C3\uA952\uA953\uA983\uA9B4\uA9B5\uA9BA\uA9BB\uA9BE-\uA9C0\uAA2F\uAA30\uAA33\uAA34\uAA4D\uAA7B\uAA7D\uAAEB\uAAEE\uAAEF\uAAF5\uABE3\uABE4\uABE6\uABE7\uABE9\uABEA\uABEC',
        'astral': '\uD804[\uDC00\uDC02\uDC82\uDCB0-\uDCB2\uDCB7\uDCB8\uDD2C\uDD45\uDD46\uDD82\uDDB3-\uDDB5\uDDBF\uDDC0\uDDCE\uDE2C-\uDE2E\uDE32\uDE33\uDE35\uDEE0-\uDEE2\uDF02\uDF03\uDF3E\uDF3F\uDF41-\uDF44\uDF47\uDF48\uDF4B-\uDF4D\uDF57\uDF62\uDF63]|\uD805[\uDC35-\uDC37\uDC40\uDC41\uDC45\uDCB0-\uDCB2\uDCB9\uDCBB-\uDCBE\uDCC1\uDDAF-\uDDB1\uDDB8-\uDDBB\uDDBE\uDE30-\uDE32\uDE3B\uDE3C\uDE3E\uDEAC\uDEAE\uDEAF\uDEB6\uDF20\uDF21\uDF26]|\uD806[\uDC2C-\uDC2E\uDC38\uDD30-\uDD35\uDD37\uDD38\uDD3D\uDD40\uDD42\uDDD1-\uDDD3\uDDDC-\uDDDF\uDDE4\uDE39\uDE57\uDE58\uDE97]|\uD807[\uDC2F\uDC3E\uDCA9\uDCB1\uDCB4\uDD8A-\uDD8E\uDD93\uDD94\uDD96\uDEF5\uDEF6]|\uD81B[\uDF51-\uDF87\uDFF0\uDFF1]|\uD834[\uDD65\uDD66\uDD6D-\uDD72]'
    },
    {
        'name': 'Me',
        'alias': 'Enclosing_Mark',
        'bmp': '\u0488\u0489\u1ABE\u20DD-\u20E0\u20E2-\u20E4\uA670-\uA672'
    },
    {
        'name': 'Mn',
        'alias': 'Nonspacing_Mark',
        'bmp': '\u0300-\u036F\u0483-\u0487\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED\u0711\u0730-\u074A\u07A6-\u07B0\u07EB-\u07F3\u07FD\u0816-\u0819\u081B-\u0823\u0825-\u0827\u0829-\u082D\u0859-\u085B\u0898-\u089F\u08CA-\u08E1\u08E3-\u0902\u093A\u093C\u0941-\u0948\u094D\u0951-\u0957\u0962\u0963\u0981\u09BC\u09C1-\u09C4\u09CD\u09E2\u09E3\u09FE\u0A01\u0A02\u0A3C\u0A41\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A70\u0A71\u0A75\u0A81\u0A82\u0ABC\u0AC1-\u0AC5\u0AC7\u0AC8\u0ACD\u0AE2\u0AE3\u0AFA-\u0AFF\u0B01\u0B3C\u0B3F\u0B41-\u0B44\u0B4D\u0B55\u0B56\u0B62\u0B63\u0B82\u0BC0\u0BCD\u0C00\u0C04\u0C3C\u0C3E-\u0C40\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C62\u0C63\u0C81\u0CBC\u0CBF\u0CC6\u0CCC\u0CCD\u0CE2\u0CE3\u0D00\u0D01\u0D3B\u0D3C\u0D41-\u0D44\u0D4D\u0D62\u0D63\u0D81\u0DCA\u0DD2-\u0DD4\u0DD6\u0E31\u0E34-\u0E3A\u0E47-\u0E4E\u0EB1\u0EB4-\u0EBC\u0EC8-\u0ECD\u0F18\u0F19\u0F35\u0F37\u0F39\u0F71-\u0F7E\u0F80-\u0F84\u0F86\u0F87\u0F8D-\u0F97\u0F99-\u0FBC\u0FC6\u102D-\u1030\u1032-\u1037\u1039\u103A\u103D\u103E\u1058\u1059\u105E-\u1060\u1071-\u1074\u1082\u1085\u1086\u108D\u109D\u135D-\u135F\u1712-\u1714\u1732\u1733\u1752\u1753\u1772\u1773\u17B4\u17B5\u17B7-\u17BD\u17C6\u17C9-\u17D3\u17DD\u180B-\u180D\u180F\u1885\u1886\u18A9\u1920-\u1922\u1927\u1928\u1932\u1939-\u193B\u1A17\u1A18\u1A1B\u1A56\u1A58-\u1A5E\u1A60\u1A62\u1A65-\u1A6C\u1A73-\u1A7C\u1A7F\u1AB0-\u1ABD\u1ABF-\u1ACE\u1B00-\u1B03\u1B34\u1B36-\u1B3A\u1B3C\u1B42\u1B6B-\u1B73\u1B80\u1B81\u1BA2-\u1BA5\u1BA8\u1BA9\u1BAB-\u1BAD\u1BE6\u1BE8\u1BE9\u1BED\u1BEF-\u1BF1\u1C2C-\u1C33\u1C36\u1C37\u1CD0-\u1CD2\u1CD4-\u1CE0\u1CE2-\u1CE8\u1CED\u1CF4\u1CF8\u1CF9\u1DC0-\u1DFF\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2CEF-\u2CF1\u2D7F\u2DE0-\u2DFF\u302A-\u302D\u3099\u309A\uA66F\uA674-\uA67D\uA69E\uA69F\uA6F0\uA6F1\uA802\uA806\uA80B\uA825\uA826\uA82C\uA8C4\uA8C5\uA8E0-\uA8F1\uA8FF\uA926-\uA92D\uA947-\uA951\uA980-\uA982\uA9B3\uA9B6-\uA9B9\uA9BC\uA9BD\uA9E5\uAA29-\uAA2E\uAA31\uAA32\uAA35\uAA36\uAA43\uAA4C\uAA7C\uAAB0\uAAB2-\uAAB4\uAAB7\uAAB8\uAABE\uAABF\uAAC1\uAAEC\uAAED\uAAF6\uABE5\uABE8\uABED\uFB1E\uFE00-\uFE0F\uFE20-\uFE2F',
        'astral': '\uD800[\uDDFD\uDEE0\uDF76-\uDF7A]|\uD802[\uDE01-\uDE03\uDE05\uDE06\uDE0C-\uDE0F\uDE38-\uDE3A\uDE3F\uDEE5\uDEE6]|\uD803[\uDD24-\uDD27\uDEAB\uDEAC\uDF46-\uDF50\uDF82-\uDF85]|\uD804[\uDC01\uDC38-\uDC46\uDC70\uDC73\uDC74\uDC7F-\uDC81\uDCB3-\uDCB6\uDCB9\uDCBA\uDCC2\uDD00-\uDD02\uDD27-\uDD2B\uDD2D-\uDD34\uDD73\uDD80\uDD81\uDDB6-\uDDBE\uDDC9-\uDDCC\uDDCF\uDE2F-\uDE31\uDE34\uDE36\uDE37\uDE3E\uDEDF\uDEE3-\uDEEA\uDF00\uDF01\uDF3B\uDF3C\uDF40\uDF66-\uDF6C\uDF70-\uDF74]|\uD805[\uDC38-\uDC3F\uDC42-\uDC44\uDC46\uDC5E\uDCB3-\uDCB8\uDCBA\uDCBF\uDCC0\uDCC2\uDCC3\uDDB2-\uDDB5\uDDBC\uDDBD\uDDBF\uDDC0\uDDDC\uDDDD\uDE33-\uDE3A\uDE3D\uDE3F\uDE40\uDEAB\uDEAD\uDEB0-\uDEB5\uDEB7\uDF1D-\uDF1F\uDF22-\uDF25\uDF27-\uDF2B]|\uD806[\uDC2F-\uDC37\uDC39\uDC3A\uDD3B\uDD3C\uDD3E\uDD43\uDDD4-\uDDD7\uDDDA\uDDDB\uDDE0\uDE01-\uDE0A\uDE33-\uDE38\uDE3B-\uDE3E\uDE47\uDE51-\uDE56\uDE59-\uDE5B\uDE8A-\uDE96\uDE98\uDE99]|\uD807[\uDC30-\uDC36\uDC38-\uDC3D\uDC3F\uDC92-\uDCA7\uDCAA-\uDCB0\uDCB2\uDCB3\uDCB5\uDCB6\uDD31-\uDD36\uDD3A\uDD3C\uDD3D\uDD3F-\uDD45\uDD47\uDD90\uDD91\uDD95\uDD97\uDEF3\uDEF4]|\uD81A[\uDEF0-\uDEF4\uDF30-\uDF36]|\uD81B[\uDF4F\uDF8F-\uDF92\uDFE4]|\uD82F[\uDC9D\uDC9E]|\uD833[\uDF00-\uDF2D\uDF30-\uDF46]|\uD834[\uDD67-\uDD69\uDD7B-\uDD82\uDD85-\uDD8B\uDDAA-\uDDAD\uDE42-\uDE44]|\uD836[\uDE00-\uDE36\uDE3B-\uDE6C\uDE75\uDE84\uDE9B-\uDE9F\uDEA1-\uDEAF]|\uD838[\uDC00-\uDC06\uDC08-\uDC18\uDC1B-\uDC21\uDC23\uDC24\uDC26-\uDC2A\uDD30-\uDD36\uDEAE\uDEEC-\uDEEF]|\uD83A[\uDCD0-\uDCD6\uDD44-\uDD4A]|\uDB40[\uDD00-\uDDEF]'
    },
    {
        'name': 'N',
        'alias': 'Number',
        'bmp': '0-9\xB2\xB3\xB9\xBC-\xBE\u0660-\u0669\u06F0-\u06F9\u07C0-\u07C9\u0966-\u096F\u09E6-\u09EF\u09F4-\u09F9\u0A66-\u0A6F\u0AE6-\u0AEF\u0B66-\u0B6F\u0B72-\u0B77\u0BE6-\u0BF2\u0C66-\u0C6F\u0C78-\u0C7E\u0CE6-\u0CEF\u0D58-\u0D5E\u0D66-\u0D78\u0DE6-\u0DEF\u0E50-\u0E59\u0ED0-\u0ED9\u0F20-\u0F33\u1040-\u1049\u1090-\u1099\u1369-\u137C\u16EE-\u16F0\u17E0-\u17E9\u17F0-\u17F9\u1810-\u1819\u1946-\u194F\u19D0-\u19DA\u1A80-\u1A89\u1A90-\u1A99\u1B50-\u1B59\u1BB0-\u1BB9\u1C40-\u1C49\u1C50-\u1C59\u2070\u2074-\u2079\u2080-\u2089\u2150-\u2182\u2185-\u2189\u2460-\u249B\u24EA-\u24FF\u2776-\u2793\u2CFD\u3007\u3021-\u3029\u3038-\u303A\u3192-\u3195\u3220-\u3229\u3248-\u324F\u3251-\u325F\u3280-\u3289\u32B1-\u32BF\uA620-\uA629\uA6E6-\uA6EF\uA830-\uA835\uA8D0-\uA8D9\uA900-\uA909\uA9D0-\uA9D9\uA9F0-\uA9F9\uAA50-\uAA59\uABF0-\uABF9\uFF10-\uFF19',
        'astral': '\uD800[\uDD07-\uDD33\uDD40-\uDD78\uDD8A\uDD8B\uDEE1-\uDEFB\uDF20-\uDF23\uDF41\uDF4A\uDFD1-\uDFD5]|\uD801[\uDCA0-\uDCA9]|\uD802[\uDC58-\uDC5F\uDC79-\uDC7F\uDCA7-\uDCAF\uDCFB-\uDCFF\uDD16-\uDD1B\uDDBC\uDDBD\uDDC0-\uDDCF\uDDD2-\uDDFF\uDE40-\uDE48\uDE7D\uDE7E\uDE9D-\uDE9F\uDEEB-\uDEEF\uDF58-\uDF5F\uDF78-\uDF7F\uDFA9-\uDFAF]|\uD803[\uDCFA-\uDCFF\uDD30-\uDD39\uDE60-\uDE7E\uDF1D-\uDF26\uDF51-\uDF54\uDFC5-\uDFCB]|\uD804[\uDC52-\uDC6F\uDCF0-\uDCF9\uDD36-\uDD3F\uDDD0-\uDDD9\uDDE1-\uDDF4\uDEF0-\uDEF9]|\uD805[\uDC50-\uDC59\uDCD0-\uDCD9\uDE50-\uDE59\uDEC0-\uDEC9\uDF30-\uDF3B]|\uD806[\uDCE0-\uDCF2\uDD50-\uDD59]|\uD807[\uDC50-\uDC6C\uDD50-\uDD59\uDDA0-\uDDA9\uDFC0-\uDFD4]|\uD809[\uDC00-\uDC6E]|\uD81A[\uDE60-\uDE69\uDEC0-\uDEC9\uDF50-\uDF59\uDF5B-\uDF61]|\uD81B[\uDE80-\uDE96]|\uD834[\uDEE0-\uDEF3\uDF60-\uDF78]|\uD835[\uDFCE-\uDFFF]|\uD838[\uDD40-\uDD49\uDEF0-\uDEF9]|\uD83A[\uDCC7-\uDCCF\uDD50-\uDD59]|\uD83B[\uDC71-\uDCAB\uDCAD-\uDCAF\uDCB1-\uDCB4\uDD01-\uDD2D\uDD2F-\uDD3D]|\uD83C[\uDD00-\uDD0C]|\uD83E[\uDFF0-\uDFF9]'
    },
    {
        'name': 'Nd',
        'alias': 'Decimal_Number',
        'bmp': '0-9\u0660-\u0669\u06F0-\u06F9\u07C0-\u07C9\u0966-\u096F\u09E6-\u09EF\u0A66-\u0A6F\u0AE6-\u0AEF\u0B66-\u0B6F\u0BE6-\u0BEF\u0C66-\u0C6F\u0CE6-\u0CEF\u0D66-\u0D6F\u0DE6-\u0DEF\u0E50-\u0E59\u0ED0-\u0ED9\u0F20-\u0F29\u1040-\u1049\u1090-\u1099\u17E0-\u17E9\u1810-\u1819\u1946-\u194F\u19D0-\u19D9\u1A80-\u1A89\u1A90-\u1A99\u1B50-\u1B59\u1BB0-\u1BB9\u1C40-\u1C49\u1C50-\u1C59\uA620-\uA629\uA8D0-\uA8D9\uA900-\uA909\uA9D0-\uA9D9\uA9F0-\uA9F9\uAA50-\uAA59\uABF0-\uABF9\uFF10-\uFF19',
        'astral': '\uD801[\uDCA0-\uDCA9]|\uD803[\uDD30-\uDD39]|\uD804[\uDC66-\uDC6F\uDCF0-\uDCF9\uDD36-\uDD3F\uDDD0-\uDDD9\uDEF0-\uDEF9]|\uD805[\uDC50-\uDC59\uDCD0-\uDCD9\uDE50-\uDE59\uDEC0-\uDEC9\uDF30-\uDF39]|\uD806[\uDCE0-\uDCE9\uDD50-\uDD59]|\uD807[\uDC50-\uDC59\uDD50-\uDD59\uDDA0-\uDDA9]|\uD81A[\uDE60-\uDE69\uDEC0-\uDEC9\uDF50-\uDF59]|\uD835[\uDFCE-\uDFFF]|\uD838[\uDD40-\uDD49\uDEF0-\uDEF9]|\uD83A[\uDD50-\uDD59]|\uD83E[\uDFF0-\uDFF9]'
    },
    {
        'name': 'Nl',
        'alias': 'Letter_Number',
        'bmp': '\u16EE-\u16F0\u2160-\u2182\u2185-\u2188\u3007\u3021-\u3029\u3038-\u303A\uA6E6-\uA6EF',
        'astral': '\uD800[\uDD40-\uDD74\uDF41\uDF4A\uDFD1-\uDFD5]|\uD809[\uDC00-\uDC6E]'
    },
    {
        'name': 'No',
        'alias': 'Other_Number',
        'bmp': '\xB2\xB3\xB9\xBC-\xBE\u09F4-\u09F9\u0B72-\u0B77\u0BF0-\u0BF2\u0C78-\u0C7E\u0D58-\u0D5E\u0D70-\u0D78\u0F2A-\u0F33\u1369-\u137C\u17F0-\u17F9\u19DA\u2070\u2074-\u2079\u2080-\u2089\u2150-\u215F\u2189\u2460-\u249B\u24EA-\u24FF\u2776-\u2793\u2CFD\u3192-\u3195\u3220-\u3229\u3248-\u324F\u3251-\u325F\u3280-\u3289\u32B1-\u32BF\uA830-\uA835',
        'astral': '\uD800[\uDD07-\uDD33\uDD75-\uDD78\uDD8A\uDD8B\uDEE1-\uDEFB\uDF20-\uDF23]|\uD802[\uDC58-\uDC5F\uDC79-\uDC7F\uDCA7-\uDCAF\uDCFB-\uDCFF\uDD16-\uDD1B\uDDBC\uDDBD\uDDC0-\uDDCF\uDDD2-\uDDFF\uDE40-\uDE48\uDE7D\uDE7E\uDE9D-\uDE9F\uDEEB-\uDEEF\uDF58-\uDF5F\uDF78-\uDF7F\uDFA9-\uDFAF]|\uD803[\uDCFA-\uDCFF\uDE60-\uDE7E\uDF1D-\uDF26\uDF51-\uDF54\uDFC5-\uDFCB]|\uD804[\uDC52-\uDC65\uDDE1-\uDDF4]|\uD805[\uDF3A\uDF3B]|\uD806[\uDCEA-\uDCF2]|\uD807[\uDC5A-\uDC6C\uDFC0-\uDFD4]|\uD81A[\uDF5B-\uDF61]|\uD81B[\uDE80-\uDE96]|\uD834[\uDEE0-\uDEF3\uDF60-\uDF78]|\uD83A[\uDCC7-\uDCCF]|\uD83B[\uDC71-\uDCAB\uDCAD-\uDCAF\uDCB1-\uDCB4\uDD01-\uDD2D\uDD2F-\uDD3D]|\uD83C[\uDD00-\uDD0C]'
    },
    {
        'name': 'P',
        'alias': 'Punctuation',
        'bmp': '!-#%-\\*,-\\/:;\\?@\\[-\\]_\\{\\}\xA1\xA7\xAB\xB6\xB7\xBB\xBF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061D-\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u09FD\u0A76\u0AF0\u0C77\u0C84\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166E\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B5A-\u1B60\u1B7D\u1B7E\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2010-\u2027\u2030-\u2043\u2045-\u2051\u2053-\u205E\u207D\u207E\u208D\u208E\u2308-\u230B\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E4F\u2E52-\u2E5D\u3001-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65',
        'astral': '\uD800[\uDD00-\uDD02\uDF9F\uDFD0]|\uD801\uDD6F|\uD802[\uDC57\uDD1F\uDD3F\uDE50-\uDE58\uDE7F\uDEF0-\uDEF6\uDF39-\uDF3F\uDF99-\uDF9C]|\uD803[\uDEAD\uDF55-\uDF59\uDF86-\uDF89]|\uD804[\uDC47-\uDC4D\uDCBB\uDCBC\uDCBE-\uDCC1\uDD40-\uDD43\uDD74\uDD75\uDDC5-\uDDC8\uDDCD\uDDDB\uDDDD-\uDDDF\uDE38-\uDE3D\uDEA9]|\uD805[\uDC4B-\uDC4F\uDC5A\uDC5B\uDC5D\uDCC6\uDDC1-\uDDD7\uDE41-\uDE43\uDE60-\uDE6C\uDEB9\uDF3C-\uDF3E]|\uD806[\uDC3B\uDD44-\uDD46\uDDE2\uDE3F-\uDE46\uDE9A-\uDE9C\uDE9E-\uDEA2]|\uD807[\uDC41-\uDC45\uDC70\uDC71\uDEF7\uDEF8\uDFFF]|\uD809[\uDC70-\uDC74]|\uD80B[\uDFF1\uDFF2]|\uD81A[\uDE6E\uDE6F\uDEF5\uDF37-\uDF3B\uDF44]|\uD81B[\uDE97-\uDE9A\uDFE2]|\uD82F\uDC9F|\uD836[\uDE87-\uDE8B]|\uD83A[\uDD5E\uDD5F]'
    },
    {
        'name': 'Pc',
        'alias': 'Connector_Punctuation',
        'bmp': '_\u203F\u2040\u2054\uFE33\uFE34\uFE4D-\uFE4F\uFF3F'
    },
    {
        'name': 'Pd',
        'alias': 'Dash_Punctuation',
        'bmp': '\\-\u058A\u05BE\u1400\u1806\u2010-\u2015\u2E17\u2E1A\u2E3A\u2E3B\u2E40\u2E5D\u301C\u3030\u30A0\uFE31\uFE32\uFE58\uFE63\uFF0D',
        'astral': '\uD803\uDEAD'
    },
    {
        'name': 'Pe',
        'alias': 'Close_Punctuation',
        'bmp': '\\)\\]\\}\u0F3B\u0F3D\u169C\u2046\u207E\u208E\u2309\u230B\u232A\u2769\u276B\u276D\u276F\u2771\u2773\u2775\u27C6\u27E7\u27E9\u27EB\u27ED\u27EF\u2984\u2986\u2988\u298A\u298C\u298E\u2990\u2992\u2994\u2996\u2998\u29D9\u29DB\u29FD\u2E23\u2E25\u2E27\u2E29\u2E56\u2E58\u2E5A\u2E5C\u3009\u300B\u300D\u300F\u3011\u3015\u3017\u3019\u301B\u301E\u301F\uFD3E\uFE18\uFE36\uFE38\uFE3A\uFE3C\uFE3E\uFE40\uFE42\uFE44\uFE48\uFE5A\uFE5C\uFE5E\uFF09\uFF3D\uFF5D\uFF60\uFF63'
    },
    {
        'name': 'Pf',
        'alias': 'Final_Punctuation',
        'bmp': '\xBB\u2019\u201D\u203A\u2E03\u2E05\u2E0A\u2E0D\u2E1D\u2E21'
    },
    {
        'name': 'Pi',
        'alias': 'Initial_Punctuation',
        'bmp': '\xAB\u2018\u201B\u201C\u201F\u2039\u2E02\u2E04\u2E09\u2E0C\u2E1C\u2E20'
    },
    {
        'name': 'Po',
        'alias': 'Other_Punctuation',
        'bmp': '!-#%-\'\\*,\\.\\/:;\\?@\\\xA1\xA7\xB6\xB7\xBF\u037E\u0387\u055A-\u055F\u0589\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061D-\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u09FD\u0A76\u0AF0\u0C77\u0C84\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u166E\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u1805\u1807-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B5A-\u1B60\u1B7D\u1B7E\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2016\u2017\u2020-\u2027\u2030-\u2038\u203B-\u203E\u2041-\u2043\u2047-\u2051\u2053\u2055-\u205E\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00\u2E01\u2E06-\u2E08\u2E0B\u2E0E-\u2E16\u2E18\u2E19\u2E1B\u2E1E\u2E1F\u2E2A-\u2E2E\u2E30-\u2E39\u2E3C-\u2E3F\u2E41\u2E43-\u2E4F\u2E52-\u2E54\u3001-\u3003\u303D\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFE10-\uFE16\uFE19\uFE30\uFE45\uFE46\uFE49-\uFE4C\uFE50-\uFE52\uFE54-\uFE57\uFE5F-\uFE61\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF07\uFF0A\uFF0C\uFF0E\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3C\uFF61\uFF64\uFF65',
        'astral': '\uD800[\uDD00-\uDD02\uDF9F\uDFD0]|\uD801\uDD6F|\uD802[\uDC57\uDD1F\uDD3F\uDE50-\uDE58\uDE7F\uDEF0-\uDEF6\uDF39-\uDF3F\uDF99-\uDF9C]|\uD803[\uDF55-\uDF59\uDF86-\uDF89]|\uD804[\uDC47-\uDC4D\uDCBB\uDCBC\uDCBE-\uDCC1\uDD40-\uDD43\uDD74\uDD75\uDDC5-\uDDC8\uDDCD\uDDDB\uDDDD-\uDDDF\uDE38-\uDE3D\uDEA9]|\uD805[\uDC4B-\uDC4F\uDC5A\uDC5B\uDC5D\uDCC6\uDDC1-\uDDD7\uDE41-\uDE43\uDE60-\uDE6C\uDEB9\uDF3C-\uDF3E]|\uD806[\uDC3B\uDD44-\uDD46\uDDE2\uDE3F-\uDE46\uDE9A-\uDE9C\uDE9E-\uDEA2]|\uD807[\uDC41-\uDC45\uDC70\uDC71\uDEF7\uDEF8\uDFFF]|\uD809[\uDC70-\uDC74]|\uD80B[\uDFF1\uDFF2]|\uD81A[\uDE6E\uDE6F\uDEF5\uDF37-\uDF3B\uDF44]|\uD81B[\uDE97-\uDE9A\uDFE2]|\uD82F\uDC9F|\uD836[\uDE87-\uDE8B]|\uD83A[\uDD5E\uDD5F]'
    },
    {
        'name': 'Ps',
        'alias': 'Open_Punctuation',
        'bmp': '\\(\\[\\{\u0F3A\u0F3C\u169B\u201A\u201E\u2045\u207D\u208D\u2308\u230A\u2329\u2768\u276A\u276C\u276E\u2770\u2772\u2774\u27C5\u27E6\u27E8\u27EA\u27EC\u27EE\u2983\u2985\u2987\u2989\u298B\u298D\u298F\u2991\u2993\u2995\u2997\u29D8\u29DA\u29FC\u2E22\u2E24\u2E26\u2E28\u2E42\u2E55\u2E57\u2E59\u2E5B\u3008\u300A\u300C\u300E\u3010\u3014\u3016\u3018\u301A\u301D\uFD3F\uFE17\uFE35\uFE37\uFE39\uFE3B\uFE3D\uFE3F\uFE41\uFE43\uFE47\uFE59\uFE5B\uFE5D\uFF08\uFF3B\uFF5B\uFF5F\uFF62'
    },
    {
        'name': 'S',
        'alias': 'Symbol',
        'bmp': '\\$\\+<->\\^`\\|~\xA2-\xA6\xA8\xA9\xAC\xAE-\xB1\xB4\xB8\xD7\xF7\u02C2-\u02C5\u02D2-\u02DF\u02E5-\u02EB\u02ED\u02EF-\u02FF\u0375\u0384\u0385\u03F6\u0482\u058D-\u058F\u0606-\u0608\u060B\u060E\u060F\u06DE\u06E9\u06FD\u06FE\u07F6\u07FE\u07FF\u0888\u09F2\u09F3\u09FA\u09FB\u0AF1\u0B70\u0BF3-\u0BFA\u0C7F\u0D4F\u0D79\u0E3F\u0F01-\u0F03\u0F13\u0F15-\u0F17\u0F1A-\u0F1F\u0F34\u0F36\u0F38\u0FBE-\u0FC5\u0FC7-\u0FCC\u0FCE\u0FCF\u0FD5-\u0FD8\u109E\u109F\u1390-\u1399\u166D\u17DB\u1940\u19DE-\u19FF\u1B61-\u1B6A\u1B74-\u1B7C\u1FBD\u1FBF-\u1FC1\u1FCD-\u1FCF\u1FDD-\u1FDF\u1FED-\u1FEF\u1FFD\u1FFE\u2044\u2052\u207A-\u207C\u208A-\u208C\u20A0-\u20C0\u2100\u2101\u2103-\u2106\u2108\u2109\u2114\u2116-\u2118\u211E-\u2123\u2125\u2127\u2129\u212E\u213A\u213B\u2140-\u2144\u214A-\u214D\u214F\u218A\u218B\u2190-\u2307\u230C-\u2328\u232B-\u2426\u2440-\u244A\u249C-\u24E9\u2500-\u2767\u2794-\u27C4\u27C7-\u27E5\u27F0-\u2982\u2999-\u29D7\u29DC-\u29FB\u29FE-\u2B73\u2B76-\u2B95\u2B97-\u2BFF\u2CE5-\u2CEA\u2E50\u2E51\u2E80-\u2E99\u2E9B-\u2EF3\u2F00-\u2FD5\u2FF0-\u2FFB\u3004\u3012\u3013\u3020\u3036\u3037\u303E\u303F\u309B\u309C\u3190\u3191\u3196-\u319F\u31C0-\u31E3\u3200-\u321E\u322A-\u3247\u3250\u3260-\u327F\u328A-\u32B0\u32C0-\u33FF\u4DC0-\u4DFF\uA490-\uA4C6\uA700-\uA716\uA720\uA721\uA789\uA78A\uA828-\uA82B\uA836-\uA839\uAA77-\uAA79\uAB5B\uAB6A\uAB6B\uFB29\uFBB2-\uFBC2\uFD40-\uFD4F\uFDCF\uFDFC-\uFDFF\uFE62\uFE64-\uFE66\uFE69\uFF04\uFF0B\uFF1C-\uFF1E\uFF3E\uFF40\uFF5C\uFF5E\uFFE0-\uFFE6\uFFE8-\uFFEE\uFFFC\uFFFD',
        'astral': '\uD800[\uDD37-\uDD3F\uDD79-\uDD89\uDD8C-\uDD8E\uDD90-\uDD9C\uDDA0\uDDD0-\uDDFC]|\uD802[\uDC77\uDC78\uDEC8]|\uD805\uDF3F|\uD807[\uDFD5-\uDFF1]|\uD81A[\uDF3C-\uDF3F\uDF45]|\uD82F\uDC9C|\uD833[\uDF50-\uDFC3]|\uD834[\uDC00-\uDCF5\uDD00-\uDD26\uDD29-\uDD64\uDD6A-\uDD6C\uDD83\uDD84\uDD8C-\uDDA9\uDDAE-\uDDEA\uDE00-\uDE41\uDE45\uDF00-\uDF56]|\uD835[\uDEC1\uDEDB\uDEFB\uDF15\uDF35\uDF4F\uDF6F\uDF89\uDFA9\uDFC3]|\uD836[\uDC00-\uDDFF\uDE37-\uDE3A\uDE6D-\uDE74\uDE76-\uDE83\uDE85\uDE86]|\uD838[\uDD4F\uDEFF]|\uD83B[\uDCAC\uDCB0\uDD2E\uDEF0\uDEF1]|\uD83C[\uDC00-\uDC2B\uDC30-\uDC93\uDCA0-\uDCAE\uDCB1-\uDCBF\uDCC1-\uDCCF\uDCD1-\uDCF5\uDD0D-\uDDAD\uDDE6-\uDE02\uDE10-\uDE3B\uDE40-\uDE48\uDE50\uDE51\uDE60-\uDE65\uDF00-\uDFFF]|\uD83D[\uDC00-\uDED7\uDEDD-\uDEEC\uDEF0-\uDEFC\uDF00-\uDF73\uDF80-\uDFD8\uDFE0-\uDFEB\uDFF0]|\uD83E[\uDC00-\uDC0B\uDC10-\uDC47\uDC50-\uDC59\uDC60-\uDC87\uDC90-\uDCAD\uDCB0\uDCB1\uDD00-\uDE53\uDE60-\uDE6D\uDE70-\uDE74\uDE78-\uDE7C\uDE80-\uDE86\uDE90-\uDEAC\uDEB0-\uDEBA\uDEC0-\uDEC5\uDED0-\uDED9\uDEE0-\uDEE7\uDEF0-\uDEF6\uDF00-\uDF92\uDF94-\uDFCA]'
    },
    {
        'name': 'Sc',
        'alias': 'Currency_Symbol',
        'bmp': '\\$\xA2-\xA5\u058F\u060B\u07FE\u07FF\u09F2\u09F3\u09FB\u0AF1\u0BF9\u0E3F\u17DB\u20A0-\u20C0\uA838\uFDFC\uFE69\uFF04\uFFE0\uFFE1\uFFE5\uFFE6',
        'astral': '\uD807[\uDFDD-\uDFE0]|\uD838\uDEFF|\uD83B\uDCB0'
    },
    {
        'name': 'Sk',
        'alias': 'Modifier_Symbol',
        'bmp': '\\^`\xA8\xAF\xB4\xB8\u02C2-\u02C5\u02D2-\u02DF\u02E5-\u02EB\u02ED\u02EF-\u02FF\u0375\u0384\u0385\u0888\u1FBD\u1FBF-\u1FC1\u1FCD-\u1FCF\u1FDD-\u1FDF\u1FED-\u1FEF\u1FFD\u1FFE\u309B\u309C\uA700-\uA716\uA720\uA721\uA789\uA78A\uAB5B\uAB6A\uAB6B\uFBB2-\uFBC2\uFF3E\uFF40\uFFE3',
        'astral': '\uD83C[\uDFFB-\uDFFF]'
    },
    {
        'name': 'Sm',
        'alias': 'Math_Symbol',
        'bmp': '\\+<->\\|~\xAC\xB1\xD7\xF7\u03F6\u0606-\u0608\u2044\u2052\u207A-\u207C\u208A-\u208C\u2118\u2140-\u2144\u214B\u2190-\u2194\u219A\u219B\u21A0\u21A3\u21A6\u21AE\u21CE\u21CF\u21D2\u21D4\u21F4-\u22FF\u2320\u2321\u237C\u239B-\u23B3\u23DC-\u23E1\u25B7\u25C1\u25F8-\u25FF\u266F\u27C0-\u27C4\u27C7-\u27E5\u27F0-\u27FF\u2900-\u2982\u2999-\u29D7\u29DC-\u29FB\u29FE-\u2AFF\u2B30-\u2B44\u2B47-\u2B4C\uFB29\uFE62\uFE64-\uFE66\uFF0B\uFF1C-\uFF1E\uFF5C\uFF5E\uFFE2\uFFE9-\uFFEC',
        'astral': '\uD835[\uDEC1\uDEDB\uDEFB\uDF15\uDF35\uDF4F\uDF6F\uDF89\uDFA9\uDFC3]|\uD83B[\uDEF0\uDEF1]'
    },
    {
        'name': 'So',
        'alias': 'Other_Symbol',
        'bmp': '\xA6\xA9\xAE\xB0\u0482\u058D\u058E\u060E\u060F\u06DE\u06E9\u06FD\u06FE\u07F6\u09FA\u0B70\u0BF3-\u0BF8\u0BFA\u0C7F\u0D4F\u0D79\u0F01-\u0F03\u0F13\u0F15-\u0F17\u0F1A-\u0F1F\u0F34\u0F36\u0F38\u0FBE-\u0FC5\u0FC7-\u0FCC\u0FCE\u0FCF\u0FD5-\u0FD8\u109E\u109F\u1390-\u1399\u166D\u1940\u19DE-\u19FF\u1B61-\u1B6A\u1B74-\u1B7C\u2100\u2101\u2103-\u2106\u2108\u2109\u2114\u2116\u2117\u211E-\u2123\u2125\u2127\u2129\u212E\u213A\u213B\u214A\u214C\u214D\u214F\u218A\u218B\u2195-\u2199\u219C-\u219F\u21A1\u21A2\u21A4\u21A5\u21A7-\u21AD\u21AF-\u21CD\u21D0\u21D1\u21D3\u21D5-\u21F3\u2300-\u2307\u230C-\u231F\u2322-\u2328\u232B-\u237B\u237D-\u239A\u23B4-\u23DB\u23E2-\u2426\u2440-\u244A\u249C-\u24E9\u2500-\u25B6\u25B8-\u25C0\u25C2-\u25F7\u2600-\u266E\u2670-\u2767\u2794-\u27BF\u2800-\u28FF\u2B00-\u2B2F\u2B45\u2B46\u2B4D-\u2B73\u2B76-\u2B95\u2B97-\u2BFF\u2CE5-\u2CEA\u2E50\u2E51\u2E80-\u2E99\u2E9B-\u2EF3\u2F00-\u2FD5\u2FF0-\u2FFB\u3004\u3012\u3013\u3020\u3036\u3037\u303E\u303F\u3190\u3191\u3196-\u319F\u31C0-\u31E3\u3200-\u321E\u322A-\u3247\u3250\u3260-\u327F\u328A-\u32B0\u32C0-\u33FF\u4DC0-\u4DFF\uA490-\uA4C6\uA828-\uA82B\uA836\uA837\uA839\uAA77-\uAA79\uFD40-\uFD4F\uFDCF\uFDFD-\uFDFF\uFFE4\uFFE8\uFFED\uFFEE\uFFFC\uFFFD',
        'astral': '\uD800[\uDD37-\uDD3F\uDD79-\uDD89\uDD8C-\uDD8E\uDD90-\uDD9C\uDDA0\uDDD0-\uDDFC]|\uD802[\uDC77\uDC78\uDEC8]|\uD805\uDF3F|\uD807[\uDFD5-\uDFDC\uDFE1-\uDFF1]|\uD81A[\uDF3C-\uDF3F\uDF45]|\uD82F\uDC9C|\uD833[\uDF50-\uDFC3]|\uD834[\uDC00-\uDCF5\uDD00-\uDD26\uDD29-\uDD64\uDD6A-\uDD6C\uDD83\uDD84\uDD8C-\uDDA9\uDDAE-\uDDEA\uDE00-\uDE41\uDE45\uDF00-\uDF56]|\uD836[\uDC00-\uDDFF\uDE37-\uDE3A\uDE6D-\uDE74\uDE76-\uDE83\uDE85\uDE86]|\uD838\uDD4F|\uD83B[\uDCAC\uDD2E]|\uD83C[\uDC00-\uDC2B\uDC30-\uDC93\uDCA0-\uDCAE\uDCB1-\uDCBF\uDCC1-\uDCCF\uDCD1-\uDCF5\uDD0D-\uDDAD\uDDE6-\uDE02\uDE10-\uDE3B\uDE40-\uDE48\uDE50\uDE51\uDE60-\uDE65\uDF00-\uDFFA]|\uD83D[\uDC00-\uDED7\uDEDD-\uDEEC\uDEF0-\uDEFC\uDF00-\uDF73\uDF80-\uDFD8\uDFE0-\uDFEB\uDFF0]|\uD83E[\uDC00-\uDC0B\uDC10-\uDC47\uDC50-\uDC59\uDC60-\uDC87\uDC90-\uDCAD\uDCB0\uDCB1\uDD00-\uDE53\uDE60-\uDE6D\uDE70-\uDE74\uDE78-\uDE7C\uDE80-\uDE86\uDE90-\uDEAC\uDEB0-\uDEBA\uDEC0-\uDEC5\uDED0-\uDED9\uDEE0-\uDEE7\uDEF0-\uDEF6\uDF00-\uDF92\uDF94-\uDFCA]'
    },
    {
        'name': 'Z',
        'alias': 'Separator',
        'bmp': ' \xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000'
    },
    {
        'name': 'Zl',
        'alias': 'Line_Separator',
        'bmp': '\u2028'
    },
    {
        'name': 'Zp',
        'alias': 'Paragraph_Separator',
        'bmp': '\u2029'
    },
    {
        'name': 'Zs',
        'alias': 'Space_Separator',
        'bmp': ' \xA0\u1680\u2000-\u200A\u202F\u205F\u3000'
    }
];

var categories$1 = /*@__PURE__*/getDefaultExportFromCjs(categories);

/*!
 * XRegExp Unicode Categories 5.1.2
 * <xregexp.com>
 * Steven Levithan (c) 2010-present MIT License
 * Unicode data by Mathias Bynens <mathiasbynens.be>
 */


var unicodeCategories = (XRegExp) => {

    /**
     * Adds support for Unicode's general categories. E.g., `\p{Lu}` or `\p{Uppercase Letter}`. See
     * category descriptions in UAX #44 <http://unicode.org/reports/tr44/#GC_Values_Table>. Token
     * names are case insensitive, and any spaces, hyphens, and underscores are ignored.
     *
     * Uses Unicode 14.0.0.
     *
     * @requires XRegExp, Unicode Base
     */

    if (!XRegExp.addUnicodeData) {
        throw new ReferenceError('Unicode Base must be loaded before Unicode Categories');
    }

    XRegExp.addUnicodeData(categories$1);
};

var properties = [
    {
        'name': 'ASCII',
        'bmp': '\0-\x7F'
    },
    {
        'name': 'Alphabetic',
        'bmp': 'A-Za-z\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0345\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0560-\u0588\u05B0-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u05D0-\u05EA\u05EF-\u05F2\u0610-\u061A\u0620-\u0657\u0659-\u065F\u066E-\u06D3\u06D5-\u06DC\u06E1-\u06E8\u06ED-\u06EF\u06FA-\u06FC\u06FF\u0710-\u073F\u074D-\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0817\u081A-\u082C\u0840-\u0858\u0860-\u086A\u0870-\u0887\u0889-\u088E\u08A0-\u08C9\u08D4-\u08DF\u08E3-\u08E9\u08F0-\u093B\u093D-\u094C\u094E-\u0950\u0955-\u0963\u0971-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD-\u09C4\u09C7\u09C8\u09CB\u09CC\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09F0\u09F1\u09FC\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3E-\u0A42\u0A47\u0A48\u0A4B\u0A4C\u0A51\u0A59-\u0A5C\u0A5E\u0A70-\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD-\u0AC5\u0AC7-\u0AC9\u0ACB\u0ACC\u0AD0\u0AE0-\u0AE3\u0AF9-\u0AFC\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D-\u0B44\u0B47\u0B48\u0B4B\u0B4C\u0B56\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B71\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCC\u0BD0\u0BD7\u0C00-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4C\u0C55\u0C56\u0C58-\u0C5A\u0C5D\u0C60-\u0C63\u0C80-\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCC\u0CD5\u0CD6\u0CDD\u0CDE\u0CE0-\u0CE3\u0CF1\u0CF2\u0D00-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D-\u0D44\u0D46-\u0D48\u0D4A-\u0D4C\u0D4E\u0D54-\u0D57\u0D5F-\u0D63\u0D7A-\u0D7F\u0D81-\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DF2\u0DF3\u0E01-\u0E3A\u0E40-\u0E46\u0E4D\u0E81\u0E82\u0E84\u0E86-\u0E8A\u0E8C-\u0EA3\u0EA5\u0EA7-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0ECD\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F71-\u0F81\u0F88-\u0F97\u0F99-\u0FBC\u1000-\u1036\u1038\u103B-\u103F\u1050-\u108F\u109A-\u109D\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u1713\u171F-\u1733\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772\u1773\u1780-\u17B3\u17B6-\u17C8\u17D7\u17DC\u1820-\u1878\u1880-\u18AA\u18B0-\u18F5\u1900-\u191E\u1920-\u192B\u1930-\u1938\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u1A00-\u1A1B\u1A20-\u1A5E\u1A61-\u1A74\u1AA7\u1ABF\u1AC0\u1ACC-\u1ACE\u1B00-\u1B33\u1B35-\u1B43\u1B45-\u1B4C\u1B80-\u1BA9\u1BAC-\u1BAF\u1BBA-\u1BE5\u1BE7-\u1BF1\u1C00-\u1C36\u1C4D-\u1C4F\u1C5A-\u1C7D\u1C80-\u1C88\u1C90-\u1CBA\u1CBD-\u1CBF\u1CE9-\u1CEC\u1CEE-\u1CF3\u1CF5\u1CF6\u1CFA\u1D00-\u1DBF\u1DE7-\u1DF4\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u24B6-\u24E9\u2C00-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u2E2F\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312F\u3131-\u318E\u31A0-\u31BF\u31F0-\u31FF\u3400-\u4DBF\u4E00-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA674-\uA67B\uA67F-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA7CA\uA7D0\uA7D1\uA7D3\uA7D5-\uA7D9\uA7F2-\uA805\uA807-\uA827\uA840-\uA873\uA880-\uA8C3\uA8C5\uA8F2-\uA8F7\uA8FB\uA8FD-\uA8FF\uA90A-\uA92A\uA930-\uA952\uA960-\uA97C\uA980-\uA9B2\uA9B4-\uA9BF\uA9CF\uA9E0-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA36\uAA40-\uAA4D\uAA60-\uAA76\uAA7A-\uAABE\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEF\uAAF2-\uAAF5\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB69\uAB70-\uABEA\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC',
        'astral': '\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDE80-\uDE9C\uDEA0-\uDED0\uDF00-\uDF1F\uDF2D-\uDF4A\uDF50-\uDF7A\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDCB0-\uDCD3\uDCD8-\uDCFB\uDD00-\uDD27\uDD30-\uDD63\uDD70-\uDD7A\uDD7C-\uDD8A\uDD8C-\uDD92\uDD94\uDD95\uDD97-\uDDA1\uDDA3-\uDDB1\uDDB3-\uDDB9\uDDBB\uDDBC\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67\uDF80-\uDF85\uDF87-\uDFB0\uDFB2-\uDFBA]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDCE0-\uDCF2\uDCF4\uDCF5\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00-\uDE03\uDE05\uDE06\uDE0C-\uDE13\uDE15-\uDE17\uDE19-\uDE35\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE4\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48\uDC80-\uDCB2\uDCC0-\uDCF2\uDD00-\uDD27\uDE80-\uDEA9\uDEAB\uDEAC\uDEB0\uDEB1\uDF00-\uDF1C\uDF27\uDF30-\uDF45\uDF70-\uDF81\uDFB0-\uDFC4\uDFE0-\uDFF6]|\uD804[\uDC00-\uDC45\uDC71-\uDC75\uDC82-\uDCB8\uDCC2\uDCD0-\uDCE8\uDD00-\uDD32\uDD44-\uDD47\uDD50-\uDD72\uDD76\uDD80-\uDDBF\uDDC1-\uDDC4\uDDCE\uDDCF\uDDDA\uDDDC\uDE00-\uDE11\uDE13-\uDE34\uDE37\uDE3E\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEE8\uDF00-\uDF03\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3D-\uDF44\uDF47\uDF48\uDF4B\uDF4C\uDF50\uDF57\uDF5D-\uDF63]|\uD805[\uDC00-\uDC41\uDC43-\uDC45\uDC47-\uDC4A\uDC5F-\uDC61\uDC80-\uDCC1\uDCC4\uDCC5\uDCC7\uDD80-\uDDB5\uDDB8-\uDDBE\uDDD8-\uDDDD\uDE00-\uDE3E\uDE40\uDE44\uDE80-\uDEB5\uDEB8\uDF00-\uDF1A\uDF1D-\uDF2A\uDF40-\uDF46]|\uD806[\uDC00-\uDC38\uDCA0-\uDCDF\uDCFF-\uDD06\uDD09\uDD0C-\uDD13\uDD15\uDD16\uDD18-\uDD35\uDD37\uDD38\uDD3B\uDD3C\uDD3F-\uDD42\uDDA0-\uDDA7\uDDAA-\uDDD7\uDDDA-\uDDDF\uDDE1\uDDE3\uDDE4\uDE00-\uDE32\uDE35-\uDE3E\uDE50-\uDE97\uDE9D\uDEB0-\uDEF8]|\uD807[\uDC00-\uDC08\uDC0A-\uDC36\uDC38-\uDC3E\uDC40\uDC72-\uDC8F\uDC92-\uDCA7\uDCA9-\uDCB6\uDD00-\uDD06\uDD08\uDD09\uDD0B-\uDD36\uDD3A\uDD3C\uDD3D\uDD3F-\uDD41\uDD43\uDD46\uDD47\uDD60-\uDD65\uDD67\uDD68\uDD6A-\uDD8E\uDD90\uDD91\uDD93-\uDD96\uDD98\uDEE0-\uDEF6\uDFB0]|\uD808[\uDC00-\uDF99]|\uD809[\uDC00-\uDC6E\uDC80-\uDD43]|\uD80B[\uDF90-\uDFF0]|[\uD80C\uD81C-\uD820\uD822\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872\uD874-\uD879\uD880-\uD883][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD811[\uDC00-\uDE46]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDE70-\uDEBE\uDED0-\uDEED\uDF00-\uDF2F\uDF40-\uDF43\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDE40-\uDE7F\uDF00-\uDF4A\uDF4F-\uDF87\uDF8F-\uDF9F\uDFE0\uDFE1\uDFE3\uDFF0\uDFF1]|\uD821[\uDC00-\uDFF7]|\uD823[\uDC00-\uDCD5\uDD00-\uDD08]|\uD82B[\uDFF0-\uDFF3\uDFF5-\uDFFB\uDFFD\uDFFE]|\uD82C[\uDC00-\uDD22\uDD50-\uDD52\uDD64-\uDD67\uDD70-\uDEFB]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99\uDC9E]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB]|\uD837[\uDF00-\uDF1E]|\uD838[\uDC00-\uDC06\uDC08-\uDC18\uDC1B-\uDC21\uDC23\uDC24\uDC26-\uDC2A\uDD00-\uDD2C\uDD37-\uDD3D\uDD4E\uDE90-\uDEAD\uDEC0-\uDEEB]|\uD839[\uDFE0-\uDFE6\uDFE8-\uDFEB\uDFED\uDFEE\uDFF0-\uDFFE]|\uD83A[\uDC00-\uDCC4\uDD00-\uDD43\uDD47\uDD4B]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD83C[\uDD30-\uDD49\uDD50-\uDD69\uDD70-\uDD89]|\uD869[\uDC00-\uDEDF\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF38\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1\uDEB0-\uDFFF]|\uD87A[\uDC00-\uDFE0]|\uD87E[\uDC00-\uDE1D]|\uD884[\uDC00-\uDF4A]'
    },
    {
        'name': 'Any',
        'isBmpLast': true,
        'bmp': '\0-\uFFFF',
        'astral': '[\uD800-\uDBFF][\uDC00-\uDFFF]'
    },
    {
        'name': 'Default_Ignorable_Code_Point',
        'bmp': '\xAD\u034F\u061C\u115F\u1160\u17B4\u17B5\u180B-\u180F\u200B-\u200F\u202A-\u202E\u2060-\u206F\u3164\uFE00-\uFE0F\uFEFF\uFFA0\uFFF0-\uFFF8',
        'astral': '\uD82F[\uDCA0-\uDCA3]|\uD834[\uDD73-\uDD7A]|[\uDB40-\uDB43][\uDC00-\uDFFF]'
    },
    {
        'name': 'Lowercase',
        'bmp': 'a-z\xAA\xB5\xBA\xDF-\xF6\xF8-\xFF\u0101\u0103\u0105\u0107\u0109\u010B\u010D\u010F\u0111\u0113\u0115\u0117\u0119\u011B\u011D\u011F\u0121\u0123\u0125\u0127\u0129\u012B\u012D\u012F\u0131\u0133\u0135\u0137\u0138\u013A\u013C\u013E\u0140\u0142\u0144\u0146\u0148\u0149\u014B\u014D\u014F\u0151\u0153\u0155\u0157\u0159\u015B\u015D\u015F\u0161\u0163\u0165\u0167\u0169\u016B\u016D\u016F\u0171\u0173\u0175\u0177\u017A\u017C\u017E-\u0180\u0183\u0185\u0188\u018C\u018D\u0192\u0195\u0199-\u019B\u019E\u01A1\u01A3\u01A5\u01A8\u01AA\u01AB\u01AD\u01B0\u01B4\u01B6\u01B9\u01BA\u01BD-\u01BF\u01C6\u01C9\u01CC\u01CE\u01D0\u01D2\u01D4\u01D6\u01D8\u01DA\u01DC\u01DD\u01DF\u01E1\u01E3\u01E5\u01E7\u01E9\u01EB\u01ED\u01EF\u01F0\u01F3\u01F5\u01F9\u01FB\u01FD\u01FF\u0201\u0203\u0205\u0207\u0209\u020B\u020D\u020F\u0211\u0213\u0215\u0217\u0219\u021B\u021D\u021F\u0221\u0223\u0225\u0227\u0229\u022B\u022D\u022F\u0231\u0233-\u0239\u023C\u023F\u0240\u0242\u0247\u0249\u024B\u024D\u024F-\u0293\u0295-\u02B8\u02C0\u02C1\u02E0-\u02E4\u0345\u0371\u0373\u0377\u037A-\u037D\u0390\u03AC-\u03CE\u03D0\u03D1\u03D5-\u03D7\u03D9\u03DB\u03DD\u03DF\u03E1\u03E3\u03E5\u03E7\u03E9\u03EB\u03ED\u03EF-\u03F3\u03F5\u03F8\u03FB\u03FC\u0430-\u045F\u0461\u0463\u0465\u0467\u0469\u046B\u046D\u046F\u0471\u0473\u0475\u0477\u0479\u047B\u047D\u047F\u0481\u048B\u048D\u048F\u0491\u0493\u0495\u0497\u0499\u049B\u049D\u049F\u04A1\u04A3\u04A5\u04A7\u04A9\u04AB\u04AD\u04AF\u04B1\u04B3\u04B5\u04B7\u04B9\u04BB\u04BD\u04BF\u04C2\u04C4\u04C6\u04C8\u04CA\u04CC\u04CE\u04CF\u04D1\u04D3\u04D5\u04D7\u04D9\u04DB\u04DD\u04DF\u04E1\u04E3\u04E5\u04E7\u04E9\u04EB\u04ED\u04EF\u04F1\u04F3\u04F5\u04F7\u04F9\u04FB\u04FD\u04FF\u0501\u0503\u0505\u0507\u0509\u050B\u050D\u050F\u0511\u0513\u0515\u0517\u0519\u051B\u051D\u051F\u0521\u0523\u0525\u0527\u0529\u052B\u052D\u052F\u0560-\u0588\u10D0-\u10FA\u10FD-\u10FF\u13F8-\u13FD\u1C80-\u1C88\u1D00-\u1DBF\u1E01\u1E03\u1E05\u1E07\u1E09\u1E0B\u1E0D\u1E0F\u1E11\u1E13\u1E15\u1E17\u1E19\u1E1B\u1E1D\u1E1F\u1E21\u1E23\u1E25\u1E27\u1E29\u1E2B\u1E2D\u1E2F\u1E31\u1E33\u1E35\u1E37\u1E39\u1E3B\u1E3D\u1E3F\u1E41\u1E43\u1E45\u1E47\u1E49\u1E4B\u1E4D\u1E4F\u1E51\u1E53\u1E55\u1E57\u1E59\u1E5B\u1E5D\u1E5F\u1E61\u1E63\u1E65\u1E67\u1E69\u1E6B\u1E6D\u1E6F\u1E71\u1E73\u1E75\u1E77\u1E79\u1E7B\u1E7D\u1E7F\u1E81\u1E83\u1E85\u1E87\u1E89\u1E8B\u1E8D\u1E8F\u1E91\u1E93\u1E95-\u1E9D\u1E9F\u1EA1\u1EA3\u1EA5\u1EA7\u1EA9\u1EAB\u1EAD\u1EAF\u1EB1\u1EB3\u1EB5\u1EB7\u1EB9\u1EBB\u1EBD\u1EBF\u1EC1\u1EC3\u1EC5\u1EC7\u1EC9\u1ECB\u1ECD\u1ECF\u1ED1\u1ED3\u1ED5\u1ED7\u1ED9\u1EDB\u1EDD\u1EDF\u1EE1\u1EE3\u1EE5\u1EE7\u1EE9\u1EEB\u1EED\u1EEF\u1EF1\u1EF3\u1EF5\u1EF7\u1EF9\u1EFB\u1EFD\u1EFF-\u1F07\u1F10-\u1F15\u1F20-\u1F27\u1F30-\u1F37\u1F40-\u1F45\u1F50-\u1F57\u1F60-\u1F67\u1F70-\u1F7D\u1F80-\u1F87\u1F90-\u1F97\u1FA0-\u1FA7\u1FB0-\u1FB4\u1FB6\u1FB7\u1FBE\u1FC2-\u1FC4\u1FC6\u1FC7\u1FD0-\u1FD3\u1FD6\u1FD7\u1FE0-\u1FE7\u1FF2-\u1FF4\u1FF6\u1FF7\u2071\u207F\u2090-\u209C\u210A\u210E\u210F\u2113\u212F\u2134\u2139\u213C\u213D\u2146-\u2149\u214E\u2170-\u217F\u2184\u24D0-\u24E9\u2C30-\u2C5F\u2C61\u2C65\u2C66\u2C68\u2C6A\u2C6C\u2C71\u2C73\u2C74\u2C76-\u2C7D\u2C81\u2C83\u2C85\u2C87\u2C89\u2C8B\u2C8D\u2C8F\u2C91\u2C93\u2C95\u2C97\u2C99\u2C9B\u2C9D\u2C9F\u2CA1\u2CA3\u2CA5\u2CA7\u2CA9\u2CAB\u2CAD\u2CAF\u2CB1\u2CB3\u2CB5\u2CB7\u2CB9\u2CBB\u2CBD\u2CBF\u2CC1\u2CC3\u2CC5\u2CC7\u2CC9\u2CCB\u2CCD\u2CCF\u2CD1\u2CD3\u2CD5\u2CD7\u2CD9\u2CDB\u2CDD\u2CDF\u2CE1\u2CE3\u2CE4\u2CEC\u2CEE\u2CF3\u2D00-\u2D25\u2D27\u2D2D\uA641\uA643\uA645\uA647\uA649\uA64B\uA64D\uA64F\uA651\uA653\uA655\uA657\uA659\uA65B\uA65D\uA65F\uA661\uA663\uA665\uA667\uA669\uA66B\uA66D\uA681\uA683\uA685\uA687\uA689\uA68B\uA68D\uA68F\uA691\uA693\uA695\uA697\uA699\uA69B-\uA69D\uA723\uA725\uA727\uA729\uA72B\uA72D\uA72F-\uA731\uA733\uA735\uA737\uA739\uA73B\uA73D\uA73F\uA741\uA743\uA745\uA747\uA749\uA74B\uA74D\uA74F\uA751\uA753\uA755\uA757\uA759\uA75B\uA75D\uA75F\uA761\uA763\uA765\uA767\uA769\uA76B\uA76D\uA76F-\uA778\uA77A\uA77C\uA77F\uA781\uA783\uA785\uA787\uA78C\uA78E\uA791\uA793-\uA795\uA797\uA799\uA79B\uA79D\uA79F\uA7A1\uA7A3\uA7A5\uA7A7\uA7A9\uA7AF\uA7B5\uA7B7\uA7B9\uA7BB\uA7BD\uA7BF\uA7C1\uA7C3\uA7C8\uA7CA\uA7D1\uA7D3\uA7D5\uA7D7\uA7D9\uA7F6\uA7F8-\uA7FA\uAB30-\uAB5A\uAB5C-\uAB68\uAB70-\uABBF\uFB00-\uFB06\uFB13-\uFB17\uFF41-\uFF5A',
        'astral': '\uD801[\uDC28-\uDC4F\uDCD8-\uDCFB\uDD97-\uDDA1\uDDA3-\uDDB1\uDDB3-\uDDB9\uDDBB\uDDBC\uDF80\uDF83-\uDF85\uDF87-\uDFB0\uDFB2-\uDFBA]|\uD803[\uDCC0-\uDCF2]|\uD806[\uDCC0-\uDCDF]|\uD81B[\uDE60-\uDE7F]|\uD835[\uDC1A-\uDC33\uDC4E-\uDC54\uDC56-\uDC67\uDC82-\uDC9B\uDCB6-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDCCF\uDCEA-\uDD03\uDD1E-\uDD37\uDD52-\uDD6B\uDD86-\uDD9F\uDDBA-\uDDD3\uDDEE-\uDE07\uDE22-\uDE3B\uDE56-\uDE6F\uDE8A-\uDEA5\uDEC2-\uDEDA\uDEDC-\uDEE1\uDEFC-\uDF14\uDF16-\uDF1B\uDF36-\uDF4E\uDF50-\uDF55\uDF70-\uDF88\uDF8A-\uDF8F\uDFAA-\uDFC2\uDFC4-\uDFC9\uDFCB]|\uD837[\uDF00-\uDF09\uDF0B-\uDF1E]|\uD83A[\uDD22-\uDD43]'
    },
    {
        'name': 'Noncharacter_Code_Point',
        'bmp': '\uFDD0-\uFDEF\uFFFE\uFFFF',
        'astral': '[\uD83F\uD87F\uD8BF\uD8FF\uD93F\uD97F\uD9BF\uD9FF\uDA3F\uDA7F\uDABF\uDAFF\uDB3F\uDB7F\uDBBF\uDBFF][\uDFFE\uDFFF]'
    },
    {
        'name': 'Uppercase',
        'bmp': 'A-Z\xC0-\xD6\xD8-\xDE\u0100\u0102\u0104\u0106\u0108\u010A\u010C\u010E\u0110\u0112\u0114\u0116\u0118\u011A\u011C\u011E\u0120\u0122\u0124\u0126\u0128\u012A\u012C\u012E\u0130\u0132\u0134\u0136\u0139\u013B\u013D\u013F\u0141\u0143\u0145\u0147\u014A\u014C\u014E\u0150\u0152\u0154\u0156\u0158\u015A\u015C\u015E\u0160\u0162\u0164\u0166\u0168\u016A\u016C\u016E\u0170\u0172\u0174\u0176\u0178\u0179\u017B\u017D\u0181\u0182\u0184\u0186\u0187\u0189-\u018B\u018E-\u0191\u0193\u0194\u0196-\u0198\u019C\u019D\u019F\u01A0\u01A2\u01A4\u01A6\u01A7\u01A9\u01AC\u01AE\u01AF\u01B1-\u01B3\u01B5\u01B7\u01B8\u01BC\u01C4\u01C7\u01CA\u01CD\u01CF\u01D1\u01D3\u01D5\u01D7\u01D9\u01DB\u01DE\u01E0\u01E2\u01E4\u01E6\u01E8\u01EA\u01EC\u01EE\u01F1\u01F4\u01F6-\u01F8\u01FA\u01FC\u01FE\u0200\u0202\u0204\u0206\u0208\u020A\u020C\u020E\u0210\u0212\u0214\u0216\u0218\u021A\u021C\u021E\u0220\u0222\u0224\u0226\u0228\u022A\u022C\u022E\u0230\u0232\u023A\u023B\u023D\u023E\u0241\u0243-\u0246\u0248\u024A\u024C\u024E\u0370\u0372\u0376\u037F\u0386\u0388-\u038A\u038C\u038E\u038F\u0391-\u03A1\u03A3-\u03AB\u03CF\u03D2-\u03D4\u03D8\u03DA\u03DC\u03DE\u03E0\u03E2\u03E4\u03E6\u03E8\u03EA\u03EC\u03EE\u03F4\u03F7\u03F9\u03FA\u03FD-\u042F\u0460\u0462\u0464\u0466\u0468\u046A\u046C\u046E\u0470\u0472\u0474\u0476\u0478\u047A\u047C\u047E\u0480\u048A\u048C\u048E\u0490\u0492\u0494\u0496\u0498\u049A\u049C\u049E\u04A0\u04A2\u04A4\u04A6\u04A8\u04AA\u04AC\u04AE\u04B0\u04B2\u04B4\u04B6\u04B8\u04BA\u04BC\u04BE\u04C0\u04C1\u04C3\u04C5\u04C7\u04C9\u04CB\u04CD\u04D0\u04D2\u04D4\u04D6\u04D8\u04DA\u04DC\u04DE\u04E0\u04E2\u04E4\u04E6\u04E8\u04EA\u04EC\u04EE\u04F0\u04F2\u04F4\u04F6\u04F8\u04FA\u04FC\u04FE\u0500\u0502\u0504\u0506\u0508\u050A\u050C\u050E\u0510\u0512\u0514\u0516\u0518\u051A\u051C\u051E\u0520\u0522\u0524\u0526\u0528\u052A\u052C\u052E\u0531-\u0556\u10A0-\u10C5\u10C7\u10CD\u13A0-\u13F5\u1C90-\u1CBA\u1CBD-\u1CBF\u1E00\u1E02\u1E04\u1E06\u1E08\u1E0A\u1E0C\u1E0E\u1E10\u1E12\u1E14\u1E16\u1E18\u1E1A\u1E1C\u1E1E\u1E20\u1E22\u1E24\u1E26\u1E28\u1E2A\u1E2C\u1E2E\u1E30\u1E32\u1E34\u1E36\u1E38\u1E3A\u1E3C\u1E3E\u1E40\u1E42\u1E44\u1E46\u1E48\u1E4A\u1E4C\u1E4E\u1E50\u1E52\u1E54\u1E56\u1E58\u1E5A\u1E5C\u1E5E\u1E60\u1E62\u1E64\u1E66\u1E68\u1E6A\u1E6C\u1E6E\u1E70\u1E72\u1E74\u1E76\u1E78\u1E7A\u1E7C\u1E7E\u1E80\u1E82\u1E84\u1E86\u1E88\u1E8A\u1E8C\u1E8E\u1E90\u1E92\u1E94\u1E9E\u1EA0\u1EA2\u1EA4\u1EA6\u1EA8\u1EAA\u1EAC\u1EAE\u1EB0\u1EB2\u1EB4\u1EB6\u1EB8\u1EBA\u1EBC\u1EBE\u1EC0\u1EC2\u1EC4\u1EC6\u1EC8\u1ECA\u1ECC\u1ECE\u1ED0\u1ED2\u1ED4\u1ED6\u1ED8\u1EDA\u1EDC\u1EDE\u1EE0\u1EE2\u1EE4\u1EE6\u1EE8\u1EEA\u1EEC\u1EEE\u1EF0\u1EF2\u1EF4\u1EF6\u1EF8\u1EFA\u1EFC\u1EFE\u1F08-\u1F0F\u1F18-\u1F1D\u1F28-\u1F2F\u1F38-\u1F3F\u1F48-\u1F4D\u1F59\u1F5B\u1F5D\u1F5F\u1F68-\u1F6F\u1FB8-\u1FBB\u1FC8-\u1FCB\u1FD8-\u1FDB\u1FE8-\u1FEC\u1FF8-\u1FFB\u2102\u2107\u210B-\u210D\u2110-\u2112\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u2130-\u2133\u213E\u213F\u2145\u2160-\u216F\u2183\u24B6-\u24CF\u2C00-\u2C2F\u2C60\u2C62-\u2C64\u2C67\u2C69\u2C6B\u2C6D-\u2C70\u2C72\u2C75\u2C7E-\u2C80\u2C82\u2C84\u2C86\u2C88\u2C8A\u2C8C\u2C8E\u2C90\u2C92\u2C94\u2C96\u2C98\u2C9A\u2C9C\u2C9E\u2CA0\u2CA2\u2CA4\u2CA6\u2CA8\u2CAA\u2CAC\u2CAE\u2CB0\u2CB2\u2CB4\u2CB6\u2CB8\u2CBA\u2CBC\u2CBE\u2CC0\u2CC2\u2CC4\u2CC6\u2CC8\u2CCA\u2CCC\u2CCE\u2CD0\u2CD2\u2CD4\u2CD6\u2CD8\u2CDA\u2CDC\u2CDE\u2CE0\u2CE2\u2CEB\u2CED\u2CF2\uA640\uA642\uA644\uA646\uA648\uA64A\uA64C\uA64E\uA650\uA652\uA654\uA656\uA658\uA65A\uA65C\uA65E\uA660\uA662\uA664\uA666\uA668\uA66A\uA66C\uA680\uA682\uA684\uA686\uA688\uA68A\uA68C\uA68E\uA690\uA692\uA694\uA696\uA698\uA69A\uA722\uA724\uA726\uA728\uA72A\uA72C\uA72E\uA732\uA734\uA736\uA738\uA73A\uA73C\uA73E\uA740\uA742\uA744\uA746\uA748\uA74A\uA74C\uA74E\uA750\uA752\uA754\uA756\uA758\uA75A\uA75C\uA75E\uA760\uA762\uA764\uA766\uA768\uA76A\uA76C\uA76E\uA779\uA77B\uA77D\uA77E\uA780\uA782\uA784\uA786\uA78B\uA78D\uA790\uA792\uA796\uA798\uA79A\uA79C\uA79E\uA7A0\uA7A2\uA7A4\uA7A6\uA7A8\uA7AA-\uA7AE\uA7B0-\uA7B4\uA7B6\uA7B8\uA7BA\uA7BC\uA7BE\uA7C0\uA7C2\uA7C4-\uA7C7\uA7C9\uA7D0\uA7D6\uA7D8\uA7F5\uFF21-\uFF3A',
        'astral': '\uD801[\uDC00-\uDC27\uDCB0-\uDCD3\uDD70-\uDD7A\uDD7C-\uDD8A\uDD8C-\uDD92\uDD94\uDD95]|\uD803[\uDC80-\uDCB2]|\uD806[\uDCA0-\uDCBF]|\uD81B[\uDE40-\uDE5F]|\uD835[\uDC00-\uDC19\uDC34-\uDC4D\uDC68-\uDC81\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB5\uDCD0-\uDCE9\uDD04\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD38\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD6C-\uDD85\uDDA0-\uDDB9\uDDD4-\uDDED\uDE08-\uDE21\uDE3C-\uDE55\uDE70-\uDE89\uDEA8-\uDEC0\uDEE2-\uDEFA\uDF1C-\uDF34\uDF56-\uDF6E\uDF90-\uDFA8\uDFCA]|\uD83A[\uDD00-\uDD21]|\uD83C[\uDD30-\uDD49\uDD50-\uDD69\uDD70-\uDD89]'
    },
    {
        'name': 'White_Space',
        'bmp': '\t-\r \x85\xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000'
    }
];

var properties$1 = /*@__PURE__*/getDefaultExportFromCjs(properties);

/*!
 * XRegExp Unicode Properties 5.1.2
 * <xregexp.com>
 * Steven Levithan (c) 2012-present MIT License
 * Unicode data by Mathias Bynens <mathiasbynens.be>
 */


var unicodeProperties = (XRegExp) => {

    /**
     * Adds properties to meet the UTS #18 Level 1 RL1.2 requirements for Unicode regex support. See
     * <http://unicode.org/reports/tr18/#RL1.2>. Following are definitions of these properties from
     * UAX #44 <http://unicode.org/reports/tr44/>:
     *
     * - Alphabetic
     *   Characters with the Alphabetic property. Generated from: Lowercase + Uppercase + Lt + Lm +
     *   Lo + Nl + Other_Alphabetic.
     *
     * - Default_Ignorable_Code_Point
     *   For programmatic determination of default ignorable code points. New characters that should
     *   be ignored in rendering (unless explicitly supported) will be assigned in these ranges,
     *   permitting programs to correctly handle the default rendering of such characters when not
     *   otherwise supported.
     *
     * - Lowercase
     *   Characters with the Lowercase property. Generated from: Ll + Other_Lowercase.
     *
     * - Noncharacter_Code_Point
     *   Code points permanently reserved for internal use.
     *
     * - Uppercase
     *   Characters with the Uppercase property. Generated from: Lu + Other_Uppercase.
     *
     * - White_Space
     *   Spaces, separator characters and other control characters which should be treated by
     *   programming languages as "white space" for the purpose of parsing elements.
     *
     * The properties ASCII, Any, and Assigned are also included but are not defined in UAX #44. UTS
     * #18 RL1.2 additionally requires support for Unicode scripts and general categories. These are
     * included in XRegExp's Unicode Categories and Unicode Scripts addons.
     *
     * Token names are case insensitive, and any spaces, hyphens, and underscores are ignored.
     *
     * Uses Unicode 14.0.0.
     *
     * @requires XRegExp, Unicode Base
     */

    if (!XRegExp.addUnicodeData) {
        throw new ReferenceError('Unicode Base must be loaded before Unicode Properties');
    }

    const unicodeData = properties$1;

    // Add non-generated data
    unicodeData.push({
        name: 'Assigned',
        // Since this is defined as the inverse of Unicode category Cn (Unassigned), the Unicode
        // Categories addon is required to use this property
        inverseOf: 'Cn'
    });

    XRegExp.addUnicodeData(unicodeData);
};

var scripts = [
    {
        'name': 'Adlam',
        'astral': '\uD83A[\uDD00-\uDD4B\uDD50-\uDD59\uDD5E\uDD5F]'
    },
    {
        'name': 'Ahom',
        'astral': '\uD805[\uDF00-\uDF1A\uDF1D-\uDF2B\uDF30-\uDF46]'
    },
    {
        'name': 'Anatolian_Hieroglyphs',
        'astral': '\uD811[\uDC00-\uDE46]'
    },
    {
        'name': 'Arabic',
        'bmp': '\u0600-\u0604\u0606-\u060B\u060D-\u061A\u061C-\u061E\u0620-\u063F\u0641-\u064A\u0656-\u066F\u0671-\u06DC\u06DE-\u06FF\u0750-\u077F\u0870-\u088E\u0890\u0891\u0898-\u08E1\u08E3-\u08FF\uFB50-\uFBC2\uFBD3-\uFD3D\uFD40-\uFD8F\uFD92-\uFDC7\uFDCF\uFDF0-\uFDFF\uFE70-\uFE74\uFE76-\uFEFC',
        'astral': '\uD803[\uDE60-\uDE7E]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB\uDEF0\uDEF1]'
    },
    {
        'name': 'Armenian',
        'bmp': '\u0531-\u0556\u0559-\u058A\u058D-\u058F\uFB13-\uFB17'
    },
    {
        'name': 'Avestan',
        'astral': '\uD802[\uDF00-\uDF35\uDF39-\uDF3F]'
    },
    {
        'name': 'Balinese',
        'bmp': '\u1B00-\u1B4C\u1B50-\u1B7E'
    },
    {
        'name': 'Bamum',
        'bmp': '\uA6A0-\uA6F7',
        'astral': '\uD81A[\uDC00-\uDE38]'
    },
    {
        'name': 'Bassa_Vah',
        'astral': '\uD81A[\uDED0-\uDEED\uDEF0-\uDEF5]'
    },
    {
        'name': 'Batak',
        'bmp': '\u1BC0-\u1BF3\u1BFC-\u1BFF'
    },
    {
        'name': 'Bengali',
        'bmp': '\u0980-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7\u09C8\u09CB-\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09E6-\u09FE'
    },
    {
        'name': 'Bhaiksuki',
        'astral': '\uD807[\uDC00-\uDC08\uDC0A-\uDC36\uDC38-\uDC45\uDC50-\uDC6C]'
    },
    {
        'name': 'Bopomofo',
        'bmp': '\u02EA\u02EB\u3105-\u312F\u31A0-\u31BF'
    },
    {
        'name': 'Brahmi',
        'astral': '\uD804[\uDC00-\uDC4D\uDC52-\uDC75\uDC7F]'
    },
    {
        'name': 'Braille',
        'bmp': '\u2800-\u28FF'
    },
    {
        'name': 'Buginese',
        'bmp': '\u1A00-\u1A1B\u1A1E\u1A1F'
    },
    {
        'name': 'Buhid',
        'bmp': '\u1740-\u1753'
    },
    {
        'name': 'Canadian_Aboriginal',
        'bmp': '\u1400-\u167F\u18B0-\u18F5',
        'astral': '\uD806[\uDEB0-\uDEBF]'
    },
    {
        'name': 'Carian',
        'astral': '\uD800[\uDEA0-\uDED0]'
    },
    {
        'name': 'Caucasian_Albanian',
        'astral': '\uD801[\uDD30-\uDD63\uDD6F]'
    },
    {
        'name': 'Chakma',
        'astral': '\uD804[\uDD00-\uDD34\uDD36-\uDD47]'
    },
    {
        'name': 'Cham',
        'bmp': '\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA5C-\uAA5F'
    },
    {
        'name': 'Cherokee',
        'bmp': '\u13A0-\u13F5\u13F8-\u13FD\uAB70-\uABBF'
    },
    {
        'name': 'Chorasmian',
        'astral': '\uD803[\uDFB0-\uDFCB]'
    },
    {
        'name': 'Common',
        'bmp': '\0-@\\[-`\\{-\xA9\xAB-\xB9\xBB-\xBF\xD7\xF7\u02B9-\u02DF\u02E5-\u02E9\u02EC-\u02FF\u0374\u037E\u0385\u0387\u0605\u060C\u061B\u061F\u0640\u06DD\u08E2\u0964\u0965\u0E3F\u0FD5-\u0FD8\u10FB\u16EB-\u16ED\u1735\u1736\u1802\u1803\u1805\u1CD3\u1CE1\u1CE9-\u1CEC\u1CEE-\u1CF3\u1CF5-\u1CF7\u1CFA\u2000-\u200B\u200E-\u2064\u2066-\u2070\u2074-\u207E\u2080-\u208E\u20A0-\u20C0\u2100-\u2125\u2127-\u2129\u212C-\u2131\u2133-\u214D\u214F-\u215F\u2189-\u218B\u2190-\u2426\u2440-\u244A\u2460-\u27FF\u2900-\u2B73\u2B76-\u2B95\u2B97-\u2BFF\u2E00-\u2E5D\u2FF0-\u2FFB\u3000-\u3004\u3006\u3008-\u3020\u3030-\u3037\u303C-\u303F\u309B\u309C\u30A0\u30FB\u30FC\u3190-\u319F\u31C0-\u31E3\u3220-\u325F\u327F-\u32CF\u32FF\u3358-\u33FF\u4DC0-\u4DFF\uA700-\uA721\uA788-\uA78A\uA830-\uA839\uA92E\uA9CF\uAB5B\uAB6A\uAB6B\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE66\uFE68-\uFE6B\uFEFF\uFF01-\uFF20\uFF3B-\uFF40\uFF5B-\uFF65\uFF70\uFF9E\uFF9F\uFFE0-\uFFE6\uFFE8-\uFFEE\uFFF9-\uFFFD',
        'astral': '\uD800[\uDD00-\uDD02\uDD07-\uDD33\uDD37-\uDD3F\uDD90-\uDD9C\uDDD0-\uDDFC\uDEE1-\uDEFB]|\uD82F[\uDCA0-\uDCA3]|\uD833[\uDF50-\uDFC3]|\uD834[\uDC00-\uDCF5\uDD00-\uDD26\uDD29-\uDD66\uDD6A-\uDD7A\uDD83\uDD84\uDD8C-\uDDA9\uDDAE-\uDDEA\uDEE0-\uDEF3\uDF00-\uDF56\uDF60-\uDF78]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDFCB\uDFCE-\uDFFF]|\uD83B[\uDC71-\uDCB4\uDD01-\uDD3D]|\uD83C[\uDC00-\uDC2B\uDC30-\uDC93\uDCA0-\uDCAE\uDCB1-\uDCBF\uDCC1-\uDCCF\uDCD1-\uDCF5\uDD00-\uDDAD\uDDE6-\uDDFF\uDE01\uDE02\uDE10-\uDE3B\uDE40-\uDE48\uDE50\uDE51\uDE60-\uDE65\uDF00-\uDFFF]|\uD83D[\uDC00-\uDED7\uDEDD-\uDEEC\uDEF0-\uDEFC\uDF00-\uDF73\uDF80-\uDFD8\uDFE0-\uDFEB\uDFF0]|\uD83E[\uDC00-\uDC0B\uDC10-\uDC47\uDC50-\uDC59\uDC60-\uDC87\uDC90-\uDCAD\uDCB0\uDCB1\uDD00-\uDE53\uDE60-\uDE6D\uDE70-\uDE74\uDE78-\uDE7C\uDE80-\uDE86\uDE90-\uDEAC\uDEB0-\uDEBA\uDEC0-\uDEC5\uDED0-\uDED9\uDEE0-\uDEE7\uDEF0-\uDEF6\uDF00-\uDF92\uDF94-\uDFCA\uDFF0-\uDFF9]|\uDB40[\uDC01\uDC20-\uDC7F]'
    },
    {
        'name': 'Coptic',
        'bmp': '\u03E2-\u03EF\u2C80-\u2CF3\u2CF9-\u2CFF'
    },
    {
        'name': 'Cuneiform',
        'astral': '\uD808[\uDC00-\uDF99]|\uD809[\uDC00-\uDC6E\uDC70-\uDC74\uDC80-\uDD43]'
    },
    {
        'name': 'Cypriot',
        'astral': '\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F]'
    },
    {
        'name': 'Cypro_Minoan',
        'astral': '\uD80B[\uDF90-\uDFF2]'
    },
    {
        'name': 'Cyrillic',
        'bmp': '\u0400-\u0484\u0487-\u052F\u1C80-\u1C88\u1D2B\u1D78\u2DE0-\u2DFF\uA640-\uA69F\uFE2E\uFE2F'
    },
    {
        'name': 'Deseret',
        'astral': '\uD801[\uDC00-\uDC4F]'
    },
    {
        'name': 'Devanagari',
        'bmp': '\u0900-\u0950\u0955-\u0963\u0966-\u097F\uA8E0-\uA8FF'
    },
    {
        'name': 'Dives_Akuru',
        'astral': '\uD806[\uDD00-\uDD06\uDD09\uDD0C-\uDD13\uDD15\uDD16\uDD18-\uDD35\uDD37\uDD38\uDD3B-\uDD46\uDD50-\uDD59]'
    },
    {
        'name': 'Dogra',
        'astral': '\uD806[\uDC00-\uDC3B]'
    },
    {
        'name': 'Duployan',
        'astral': '\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99\uDC9C-\uDC9F]'
    },
    {
        'name': 'Egyptian_Hieroglyphs',
        'astral': '\uD80C[\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E\uDC30-\uDC38]'
    },
    {
        'name': 'Elbasan',
        'astral': '\uD801[\uDD00-\uDD27]'
    },
    {
        'name': 'Elymaic',
        'astral': '\uD803[\uDFE0-\uDFF6]'
    },
    {
        'name': 'Ethiopic',
        'bmp': '\u1200-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u137C\u1380-\u1399\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E',
        'astral': '\uD839[\uDFE0-\uDFE6\uDFE8-\uDFEB\uDFED\uDFEE\uDFF0-\uDFFE]'
    },
    {
        'name': 'Georgian',
        'bmp': '\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u10FF\u1C90-\u1CBA\u1CBD-\u1CBF\u2D00-\u2D25\u2D27\u2D2D'
    },
    {
        'name': 'Glagolitic',
        'bmp': '\u2C00-\u2C5F',
        'astral': '\uD838[\uDC00-\uDC06\uDC08-\uDC18\uDC1B-\uDC21\uDC23\uDC24\uDC26-\uDC2A]'
    },
    {
        'name': 'Gothic',
        'astral': '\uD800[\uDF30-\uDF4A]'
    },
    {
        'name': 'Grantha',
        'astral': '\uD804[\uDF00-\uDF03\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3C-\uDF44\uDF47\uDF48\uDF4B-\uDF4D\uDF50\uDF57\uDF5D-\uDF63\uDF66-\uDF6C\uDF70-\uDF74]'
    },
    {
        'name': 'Greek',
        'bmp': '\u0370-\u0373\u0375-\u0377\u037A-\u037D\u037F\u0384\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03E1\u03F0-\u03FF\u1D26-\u1D2A\u1D5D-\u1D61\u1D66-\u1D6A\u1DBF\u1F00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FC4\u1FC6-\u1FD3\u1FD6-\u1FDB\u1FDD-\u1FEF\u1FF2-\u1FF4\u1FF6-\u1FFE\u2126\uAB65',
        'astral': '\uD800[\uDD40-\uDD8E\uDDA0]|\uD834[\uDE00-\uDE45]'
    },
    {
        'name': 'Gujarati',
        'bmp': '\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AF1\u0AF9-\u0AFF'
    },
    {
        'name': 'Gunjala_Gondi',
        'astral': '\uD807[\uDD60-\uDD65\uDD67\uDD68\uDD6A-\uDD8E\uDD90\uDD91\uDD93-\uDD98\uDDA0-\uDDA9]'
    },
    {
        'name': 'Gurmukhi',
        'bmp': '\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A76'
    },
    {
        'name': 'Han',
        'bmp': '\u2E80-\u2E99\u2E9B-\u2EF3\u2F00-\u2FD5\u3005\u3007\u3021-\u3029\u3038-\u303B\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFA6D\uFA70-\uFAD9',
        'astral': '\uD81B[\uDFE2\uDFE3\uDFF0\uDFF1]|[\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872\uD874-\uD879\uD880-\uD883][\uDC00-\uDFFF]|\uD869[\uDC00-\uDEDF\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF38\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1\uDEB0-\uDFFF]|\uD87A[\uDC00-\uDFE0]|\uD87E[\uDC00-\uDE1D]|\uD884[\uDC00-\uDF4A]'
    },
    {
        'name': 'Hangul',
        'bmp': '\u1100-\u11FF\u302E\u302F\u3131-\u318E\u3200-\u321E\u3260-\u327E\uA960-\uA97C\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uFFA0-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC'
    },
    {
        'name': 'Hanifi_Rohingya',
        'astral': '\uD803[\uDD00-\uDD27\uDD30-\uDD39]'
    },
    {
        'name': 'Hanunoo',
        'bmp': '\u1720-\u1734'
    },
    {
        'name': 'Hatran',
        'astral': '\uD802[\uDCE0-\uDCF2\uDCF4\uDCF5\uDCFB-\uDCFF]'
    },
    {
        'name': 'Hebrew',
        'bmp': '\u0591-\u05C7\u05D0-\u05EA\u05EF-\u05F4\uFB1D-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFB4F'
    },
    {
        'name': 'Hiragana',
        'bmp': '\u3041-\u3096\u309D-\u309F',
        'astral': '\uD82C[\uDC01-\uDD1F\uDD50-\uDD52]|\uD83C\uDE00'
    },
    {
        'name': 'Imperial_Aramaic',
        'astral': '\uD802[\uDC40-\uDC55\uDC57-\uDC5F]'
    },
    {
        'name': 'Inherited',
        'bmp': '\u0300-\u036F\u0485\u0486\u064B-\u0655\u0670\u0951-\u0954\u1AB0-\u1ACE\u1CD0-\u1CD2\u1CD4-\u1CE0\u1CE2-\u1CE8\u1CED\u1CF4\u1CF8\u1CF9\u1DC0-\u1DFF\u200C\u200D\u20D0-\u20F0\u302A-\u302D\u3099\u309A\uFE00-\uFE0F\uFE20-\uFE2D',
        'astral': '\uD800[\uDDFD\uDEE0]|\uD804\uDF3B|\uD833[\uDF00-\uDF2D\uDF30-\uDF46]|\uD834[\uDD67-\uDD69\uDD7B-\uDD82\uDD85-\uDD8B\uDDAA-\uDDAD]|\uDB40[\uDD00-\uDDEF]'
    },
    {
        'name': 'Inscriptional_Pahlavi',
        'astral': '\uD802[\uDF60-\uDF72\uDF78-\uDF7F]'
    },
    {
        'name': 'Inscriptional_Parthian',
        'astral': '\uD802[\uDF40-\uDF55\uDF58-\uDF5F]'
    },
    {
        'name': 'Javanese',
        'bmp': '\uA980-\uA9CD\uA9D0-\uA9D9\uA9DE\uA9DF'
    },
    {
        'name': 'Kaithi',
        'astral': '\uD804[\uDC80-\uDCC2\uDCCD]'
    },
    {
        'name': 'Kannada',
        'bmp': '\u0C80-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDD\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2'
    },
    {
        'name': 'Katakana',
        'bmp': '\u30A1-\u30FA\u30FD-\u30FF\u31F0-\u31FF\u32D0-\u32FE\u3300-\u3357\uFF66-\uFF6F\uFF71-\uFF9D',
        'astral': '\uD82B[\uDFF0-\uDFF3\uDFF5-\uDFFB\uDFFD\uDFFE]|\uD82C[\uDC00\uDD20-\uDD22\uDD64-\uDD67]'
    },
    {
        'name': 'Kayah_Li',
        'bmp': '\uA900-\uA92D\uA92F'
    },
    {
        'name': 'Kharoshthi',
        'astral': '\uD802[\uDE00-\uDE03\uDE05\uDE06\uDE0C-\uDE13\uDE15-\uDE17\uDE19-\uDE35\uDE38-\uDE3A\uDE3F-\uDE48\uDE50-\uDE58]'
    },
    {
        'name': 'Khitan_Small_Script',
        'astral': '\uD81B\uDFE4|\uD822[\uDF00-\uDFFF]|\uD823[\uDC00-\uDCD5]'
    },
    {
        'name': 'Khmer',
        'bmp': '\u1780-\u17DD\u17E0-\u17E9\u17F0-\u17F9\u19E0-\u19FF'
    },
    {
        'name': 'Khojki',
        'astral': '\uD804[\uDE00-\uDE11\uDE13-\uDE3E]'
    },
    {
        'name': 'Khudawadi',
        'astral': '\uD804[\uDEB0-\uDEEA\uDEF0-\uDEF9]'
    },
    {
        'name': 'Lao',
        'bmp': '\u0E81\u0E82\u0E84\u0E86-\u0E8A\u0E8C-\u0EA3\u0EA5\u0EA7-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF'
    },
    {
        'name': 'Latin',
        'bmp': 'A-Za-z\xAA\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02B8\u02E0-\u02E4\u1D00-\u1D25\u1D2C-\u1D5C\u1D62-\u1D65\u1D6B-\u1D77\u1D79-\u1DBE\u1E00-\u1EFF\u2071\u207F\u2090-\u209C\u212A\u212B\u2132\u214E\u2160-\u2188\u2C60-\u2C7F\uA722-\uA787\uA78B-\uA7CA\uA7D0\uA7D1\uA7D3\uA7D5-\uA7D9\uA7F2-\uA7FF\uAB30-\uAB5A\uAB5C-\uAB64\uAB66-\uAB69\uFB00-\uFB06\uFF21-\uFF3A\uFF41-\uFF5A',
        'astral': '\uD801[\uDF80-\uDF85\uDF87-\uDFB0\uDFB2-\uDFBA]|\uD837[\uDF00-\uDF1E]'
    },
    {
        'name': 'Lepcha',
        'bmp': '\u1C00-\u1C37\u1C3B-\u1C49\u1C4D-\u1C4F'
    },
    {
        'name': 'Limbu',
        'bmp': '\u1900-\u191E\u1920-\u192B\u1930-\u193B\u1940\u1944-\u194F'
    },
    {
        'name': 'Linear_A',
        'astral': '\uD801[\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]'
    },
    {
        'name': 'Linear_B',
        'astral': '\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA]'
    },
    {
        'name': 'Lisu',
        'bmp': '\uA4D0-\uA4FF',
        'astral': '\uD807\uDFB0'
    },
    {
        'name': 'Lycian',
        'astral': '\uD800[\uDE80-\uDE9C]'
    },
    {
        'name': 'Lydian',
        'astral': '\uD802[\uDD20-\uDD39\uDD3F]'
    },
    {
        'name': 'Mahajani',
        'astral': '\uD804[\uDD50-\uDD76]'
    },
    {
        'name': 'Makasar',
        'astral': '\uD807[\uDEE0-\uDEF8]'
    },
    {
        'name': 'Malayalam',
        'bmp': '\u0D00-\u0D0C\u0D0E-\u0D10\u0D12-\u0D44\u0D46-\u0D48\u0D4A-\u0D4F\u0D54-\u0D63\u0D66-\u0D7F'
    },
    {
        'name': 'Mandaic',
        'bmp': '\u0840-\u085B\u085E'
    },
    {
        'name': 'Manichaean',
        'astral': '\uD802[\uDEC0-\uDEE6\uDEEB-\uDEF6]'
    },
    {
        'name': 'Marchen',
        'astral': '\uD807[\uDC70-\uDC8F\uDC92-\uDCA7\uDCA9-\uDCB6]'
    },
    {
        'name': 'Masaram_Gondi',
        'astral': '\uD807[\uDD00-\uDD06\uDD08\uDD09\uDD0B-\uDD36\uDD3A\uDD3C\uDD3D\uDD3F-\uDD47\uDD50-\uDD59]'
    },
    {
        'name': 'Medefaidrin',
        'astral': '\uD81B[\uDE40-\uDE9A]'
    },
    {
        'name': 'Meetei_Mayek',
        'bmp': '\uAAE0-\uAAF6\uABC0-\uABED\uABF0-\uABF9'
    },
    {
        'name': 'Mende_Kikakui',
        'astral': '\uD83A[\uDC00-\uDCC4\uDCC7-\uDCD6]'
    },
    {
        'name': 'Meroitic_Cursive',
        'astral': '\uD802[\uDDA0-\uDDB7\uDDBC-\uDDCF\uDDD2-\uDDFF]'
    },
    {
        'name': 'Meroitic_Hieroglyphs',
        'astral': '\uD802[\uDD80-\uDD9F]'
    },
    {
        'name': 'Miao',
        'astral': '\uD81B[\uDF00-\uDF4A\uDF4F-\uDF87\uDF8F-\uDF9F]'
    },
    {
        'name': 'Modi',
        'astral': '\uD805[\uDE00-\uDE44\uDE50-\uDE59]'
    },
    {
        'name': 'Mongolian',
        'bmp': '\u1800\u1801\u1804\u1806-\u1819\u1820-\u1878\u1880-\u18AA',
        'astral': '\uD805[\uDE60-\uDE6C]'
    },
    {
        'name': 'Mro',
        'astral': '\uD81A[\uDE40-\uDE5E\uDE60-\uDE69\uDE6E\uDE6F]'
    },
    {
        'name': 'Multani',
        'astral': '\uD804[\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA9]'
    },
    {
        'name': 'Myanmar',
        'bmp': '\u1000-\u109F\uA9E0-\uA9FE\uAA60-\uAA7F'
    },
    {
        'name': 'Nabataean',
        'astral': '\uD802[\uDC80-\uDC9E\uDCA7-\uDCAF]'
    },
    {
        'name': 'Nandinagari',
        'astral': '\uD806[\uDDA0-\uDDA7\uDDAA-\uDDD7\uDDDA-\uDDE4]'
    },
    {
        'name': 'New_Tai_Lue',
        'bmp': '\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19DA\u19DE\u19DF'
    },
    {
        'name': 'Newa',
        'astral': '\uD805[\uDC00-\uDC5B\uDC5D-\uDC61]'
    },
    {
        'name': 'Nko',
        'bmp': '\u07C0-\u07FA\u07FD-\u07FF'
    },
    {
        'name': 'Nushu',
        'astral': '\uD81B\uDFE1|\uD82C[\uDD70-\uDEFB]'
    },
    {
        'name': 'Nyiakeng_Puachue_Hmong',
        'astral': '\uD838[\uDD00-\uDD2C\uDD30-\uDD3D\uDD40-\uDD49\uDD4E\uDD4F]'
    },
    {
        'name': 'Ogham',
        'bmp': '\u1680-\u169C'
    },
    {
        'name': 'Ol_Chiki',
        'bmp': '\u1C50-\u1C7F'
    },
    {
        'name': 'Old_Hungarian',
        'astral': '\uD803[\uDC80-\uDCB2\uDCC0-\uDCF2\uDCFA-\uDCFF]'
    },
    {
        'name': 'Old_Italic',
        'astral': '\uD800[\uDF00-\uDF23\uDF2D-\uDF2F]'
    },
    {
        'name': 'Old_North_Arabian',
        'astral': '\uD802[\uDE80-\uDE9F]'
    },
    {
        'name': 'Old_Permic',
        'astral': '\uD800[\uDF50-\uDF7A]'
    },
    {
        'name': 'Old_Persian',
        'astral': '\uD800[\uDFA0-\uDFC3\uDFC8-\uDFD5]'
    },
    {
        'name': 'Old_Sogdian',
        'astral': '\uD803[\uDF00-\uDF27]'
    },
    {
        'name': 'Old_South_Arabian',
        'astral': '\uD802[\uDE60-\uDE7F]'
    },
    {
        'name': 'Old_Turkic',
        'astral': '\uD803[\uDC00-\uDC48]'
    },
    {
        'name': 'Old_Uyghur',
        'astral': '\uD803[\uDF70-\uDF89]'
    },
    {
        'name': 'Oriya',
        'bmp': '\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B55-\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B66-\u0B77'
    },
    {
        'name': 'Osage',
        'astral': '\uD801[\uDCB0-\uDCD3\uDCD8-\uDCFB]'
    },
    {
        'name': 'Osmanya',
        'astral': '\uD801[\uDC80-\uDC9D\uDCA0-\uDCA9]'
    },
    {
        'name': 'Pahawh_Hmong',
        'astral': '\uD81A[\uDF00-\uDF45\uDF50-\uDF59\uDF5B-\uDF61\uDF63-\uDF77\uDF7D-\uDF8F]'
    },
    {
        'name': 'Palmyrene',
        'astral': '\uD802[\uDC60-\uDC7F]'
    },
    {
        'name': 'Pau_Cin_Hau',
        'astral': '\uD806[\uDEC0-\uDEF8]'
    },
    {
        'name': 'Phags_Pa',
        'bmp': '\uA840-\uA877'
    },
    {
        'name': 'Phoenician',
        'astral': '\uD802[\uDD00-\uDD1B\uDD1F]'
    },
    {
        'name': 'Psalter_Pahlavi',
        'astral': '\uD802[\uDF80-\uDF91\uDF99-\uDF9C\uDFA9-\uDFAF]'
    },
    {
        'name': 'Rejang',
        'bmp': '\uA930-\uA953\uA95F'
    },
    {
        'name': 'Runic',
        'bmp': '\u16A0-\u16EA\u16EE-\u16F8'
    },
    {
        'name': 'Samaritan',
        'bmp': '\u0800-\u082D\u0830-\u083E'
    },
    {
        'name': 'Saurashtra',
        'bmp': '\uA880-\uA8C5\uA8CE-\uA8D9'
    },
    {
        'name': 'Sharada',
        'astral': '\uD804[\uDD80-\uDDDF]'
    },
    {
        'name': 'Shavian',
        'astral': '\uD801[\uDC50-\uDC7F]'
    },
    {
        'name': 'Siddham',
        'astral': '\uD805[\uDD80-\uDDB5\uDDB8-\uDDDD]'
    },
    {
        'name': 'SignWriting',
        'astral': '\uD836[\uDC00-\uDE8B\uDE9B-\uDE9F\uDEA1-\uDEAF]'
    },
    {
        'name': 'Sinhala',
        'bmp': '\u0D81-\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2-\u0DF4',
        'astral': '\uD804[\uDDE1-\uDDF4]'
    },
    {
        'name': 'Sogdian',
        'astral': '\uD803[\uDF30-\uDF59]'
    },
    {
        'name': 'Sora_Sompeng',
        'astral': '\uD804[\uDCD0-\uDCE8\uDCF0-\uDCF9]'
    },
    {
        'name': 'Soyombo',
        'astral': '\uD806[\uDE50-\uDEA2]'
    },
    {
        'name': 'Sundanese',
        'bmp': '\u1B80-\u1BBF\u1CC0-\u1CC7'
    },
    {
        'name': 'Syloti_Nagri',
        'bmp': '\uA800-\uA82C'
    },
    {
        'name': 'Syriac',
        'bmp': '\u0700-\u070D\u070F-\u074A\u074D-\u074F\u0860-\u086A'
    },
    {
        'name': 'Tagalog',
        'bmp': '\u1700-\u1715\u171F'
    },
    {
        'name': 'Tagbanwa',
        'bmp': '\u1760-\u176C\u176E-\u1770\u1772\u1773'
    },
    {
        'name': 'Tai_Le',
        'bmp': '\u1950-\u196D\u1970-\u1974'
    },
    {
        'name': 'Tai_Tham',
        'bmp': '\u1A20-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA0-\u1AAD'
    },
    {
        'name': 'Tai_Viet',
        'bmp': '\uAA80-\uAAC2\uAADB-\uAADF'
    },
    {
        'name': 'Takri',
        'astral': '\uD805[\uDE80-\uDEB9\uDEC0-\uDEC9]'
    },
    {
        'name': 'Tamil',
        'bmp': '\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BFA',
        'astral': '\uD807[\uDFC0-\uDFF1\uDFFF]'
    },
    {
        'name': 'Tangsa',
        'astral': '\uD81A[\uDE70-\uDEBE\uDEC0-\uDEC9]'
    },
    {
        'name': 'Tangut',
        'astral': '\uD81B\uDFE0|[\uD81C-\uD820][\uDC00-\uDFFF]|\uD821[\uDC00-\uDFF7]|\uD822[\uDC00-\uDEFF]|\uD823[\uDD00-\uDD08]'
    },
    {
        'name': 'Telugu',
        'bmp': '\u0C00-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3C-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C58-\u0C5A\u0C5D\u0C60-\u0C63\u0C66-\u0C6F\u0C77-\u0C7F'
    },
    {
        'name': 'Thaana',
        'bmp': '\u0780-\u07B1'
    },
    {
        'name': 'Thai',
        'bmp': '\u0E01-\u0E3A\u0E40-\u0E5B'
    },
    {
        'name': 'Tibetan',
        'bmp': '\u0F00-\u0F47\u0F49-\u0F6C\u0F71-\u0F97\u0F99-\u0FBC\u0FBE-\u0FCC\u0FCE-\u0FD4\u0FD9\u0FDA'
    },
    {
        'name': 'Tifinagh',
        'bmp': '\u2D30-\u2D67\u2D6F\u2D70\u2D7F'
    },
    {
        'name': 'Tirhuta',
        'astral': '\uD805[\uDC80-\uDCC7\uDCD0-\uDCD9]'
    },
    {
        'name': 'Toto',
        'astral': '\uD838[\uDE90-\uDEAE]'
    },
    {
        'name': 'Ugaritic',
        'astral': '\uD800[\uDF80-\uDF9D\uDF9F]'
    },
    {
        'name': 'Vai',
        'bmp': '\uA500-\uA62B'
    },
    {
        'name': 'Vithkuqi',
        'astral': '\uD801[\uDD70-\uDD7A\uDD7C-\uDD8A\uDD8C-\uDD92\uDD94\uDD95\uDD97-\uDDA1\uDDA3-\uDDB1\uDDB3-\uDDB9\uDDBB\uDDBC]'
    },
    {
        'name': 'Wancho',
        'astral': '\uD838[\uDEC0-\uDEF9\uDEFF]'
    },
    {
        'name': 'Warang_Citi',
        'astral': '\uD806[\uDCA0-\uDCF2\uDCFF]'
    },
    {
        'name': 'Yezidi',
        'astral': '\uD803[\uDE80-\uDEA9\uDEAB-\uDEAD\uDEB0\uDEB1]'
    },
    {
        'name': 'Yi',
        'bmp': '\uA000-\uA48C\uA490-\uA4C6'
    },
    {
        'name': 'Zanabazar_Square',
        'astral': '\uD806[\uDE00-\uDE47]'
    }
];

var scripts$1 = /*@__PURE__*/getDefaultExportFromCjs(scripts);

/*!
 * XRegExp Unicode Scripts 5.1.2
 * <xregexp.com>
 * Steven Levithan (c) 2010-present MIT License
 * Unicode data by Mathias Bynens <mathiasbynens.be>
 */


var unicodeScripts = (XRegExp) => {

    /**
     * Adds support for all Unicode scripts. E.g., `\p{Latin}`. Token names are case insensitive,
     * and any spaces, hyphens, and underscores are ignored.
     *
     * Uses Unicode 14.0.0.
     *
     * @requires XRegExp, Unicode Base
     */

    if (!XRegExp.addUnicodeData) {
        throw new ReferenceError('Unicode Base must be loaded before Unicode Scripts');
    }

    XRegExp.addUnicodeData(scripts$1, 'Script');
};

build(XRegExp);
matchRecursive(XRegExp);
unicodeBase(XRegExp);
unicodeCategories(XRegExp);
unicodeProperties(XRegExp);
unicodeScripts(XRegExp);

var src = /*#__PURE__*/Object.freeze({
	__proto__: null,
	default: XRegExp
});

var require$$0 = /*@__PURE__*/getAugmentedNamespace(src);

dist.exports;

(function (module, exports) {
var ie=require$$0;function _interopDefault(e){return e&&e.__esModule?e:{default:e}}var ie__default=/*#__PURE__*/_interopDefault(ie);var Ku=typeof commonjsGlobal=="object"&&commonjsGlobal&&commonjsGlobal.Object===Object&&commonjsGlobal,vn=Ku;var Wu=typeof self=="object"&&self&&self.Object===Object&&self,$u=vn||Wu||Function("return this")(),Z=$u;var Vu=Z.Symbol,ae=Vu;var Ea=Object.prototype,ju=Ea.hasOwnProperty,Hu=Ea.toString,Br=ae?ae.toStringTag:void 0;function zu(t){var e=ju.call(t,Br),r=t[Br];try{t[Br]=void 0;var n=!0;}catch{}var o=Hu.call(t);return n&&(e?t[Br]=r:delete t[Br]),o}var Aa=zu;var Xu=Object.prototype,Yu=Xu.toString;function qu(t){return Yu.call(t)}var Ia=qu;var Qu="[object Null]",Zu="[object Undefined]",ya=ae?ae.toStringTag:void 0;function Ju(t){return t==null?t===void 0?Zu:Qu:ya&&ya in Object(t)?Aa(t):Ia(t)}var me=Ju;function ef(t){return t!=null&&typeof t=="object"}var X=ef;var tf="[object Symbol]";function rf(t){return typeof t=="symbol"||X(t)&&me(t)==tf}var dt=rf;function nf(t,e){for(var r=-1,n=t==null?0:t.length,o=Array(n);++r<n;)o[r]=e(t[r],r,t);return o}var Ge=nf;var of=Array.isArray,I=of;var Sa=ae?ae.prototype:void 0,Ra=Sa?Sa.toString:void 0;function Oa(t){if(typeof t=="string")return t;if(I(t))return Ge(t,Oa)+"";if(dt(t))return Ra?Ra.call(t):"";var e=t+"";return e=="0"&&1/t==-Infinity?"-0":e}var Na=Oa;var sf=/\s/;function lf(t){for(var e=t.length;e--&&sf.test(t.charAt(e)););return e}var _a=lf;var cf=/^\s+/;function uf(t){return t&&t.slice(0,_a(t)+1).replace(cf,"")}var Ca=uf;function ff(t){var e=typeof t;return t!=null&&(e=="object"||e=="function")}var $=ff;var ba=NaN,pf=/^[-+]0x[0-9a-f]+$/i,mf=/^0b[01]+$/i,hf=/^0o[0-7]+$/i,df=parseInt;function gf(t){if(typeof t=="number")return t;if(dt(t))return ba;if($(t)){var e=typeof t.valueOf=="function"?t.valueOf():t;t=$(e)?e+"":e;}if(typeof t!="string")return t===0?t:+t;t=Ca(t);var r=mf.test(t);return r||hf.test(t)?df(t.slice(2),r?2:8):pf.test(t)?ba:+t}var La=gf;var va=1/0,xf=17976931348623157e292;function Tf(t){if(!t)return t===0?t:0;if(t=La(t),t===va||t===-va){var e=t<0?-1:1;return e*xf}return t===t?t:0}var ka=Tf;function Ef(t){var e=ka(t),r=e%1;return e===e?r?e-r:e:0}var Ke=Ef;function Af(t){return t}var ve=Af;var If="[object AsyncFunction]",yf="[object Function]",Sf="[object GeneratorFunction]",Rf="[object Proxy]";function Of(t){if(!$(t))return  false;var e=me(t);return e==yf||e==Sf||e==If||e==Rf}var he=Of;var Nf=Z["__core-js_shared__"],kn=Nf;var Pa=function(){var t=/[^.]+$/.exec(kn&&kn.keys&&kn.keys.IE_PROTO||"");return t?"Symbol(src)_1."+t:""}();function _f(t){return !!Pa&&Pa in t}var Ma=_f;var Cf=Function.prototype,bf=Cf.toString;function Lf(t){if(t!=null){try{return bf.call(t)}catch{}try{return t+""}catch{}}return ""}var ot=Lf;var vf=/[\\^$.*+?()[\]{}|]/g,kf=/^\[object .+?Constructor\]$/,Pf=Function.prototype,Mf=Object.prototype,wf=Pf.toString,Ff=Mf.hasOwnProperty,Uf=RegExp("^"+wf.call(Ff).replace(vf,"\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g,"$1.*?")+"$");function Df(t){if(!$(t)||Ma(t))return  false;var e=he(t)?Uf:kf;return e.test(ot(t))}var wa=Df;function Bf(t,e){return t==null?void 0:t[e]}var Fa=Bf;function Gf(t,e){var r=Fa(t,e);return wa(r)?r:void 0}var Ie=Gf;var Kf=Ie(Z,"WeakMap"),Pn=Kf;var Ua=Object.create,Wf=function(){function t(){}return function(e){if(!$(e))return {};if(Ua)return Ua(e);t.prototype=e;var r=new t;return t.prototype=void 0,r}}(),Da=Wf;function $f(t,e,r){switch(r.length){case 0:return t.call(e);case 1:return t.call(e,r[0]);case 2:return t.call(e,r[0],r[1]);case 3:return t.call(e,r[0],r[1],r[2])}return t.apply(e,r)}var Ba=$f;function Vf(){}var V=Vf;function jf(t,e){var r=-1,n=t.length;for(e||(e=Array(n));++r<n;)e[r]=t[r];return e}var Ga=jf;var Hf=800,zf=16,Xf=Date.now;function Yf(t){var e=0,r=0;return function(){var n=Xf(),o=zf-(n-r);if(r=n,o>0){if(++e>=Hf)return arguments[0]}else e=0;return t.apply(void 0,arguments)}}var Ka=Yf;function qf(t){return function(){return t}}var Wa=qf;var Qf=function(){try{var t=Ie(Object,"defineProperty");return t({},"",{}),t}catch{}}(),qt=Qf;var Zf=qt?function(t,e){return qt(t,"toString",{configurable:true,enumerable:false,value:Wa(e),writable:true})}:ve,$a=Zf;var Jf=Ka($a),Va=Jf;function ep(t,e){for(var r=-1,n=t==null?0:t.length;++r<n&&e(t[r],r,t)!==false;);return t}var Mn=ep;function tp(t,e,r,n){for(var o=t.length,i=r+(n?1:-1);n?i--:++i<o;)if(e(t[i],i,t))return i;return  -1}var wn=tp;function rp(t){return t!==t}var ja=rp;function np(t,e,r){for(var n=r-1,o=t.length;++n<o;)if(t[n]===e)return n;return  -1}var Ha=np;function op(t,e,r){return e===e?Ha(t,e,r):wn(t,ja,r)}var Qt=op;function ip(t,e){var r=t==null?0:t.length;return !!r&&Qt(t,e,0)>-1}var Fn=ip;var ap=9007199254740991,sp=/^(?:0|[1-9]\d*)$/;function lp(t,e){var r=typeof t;return e=e??ap,!!e&&(r=="number"||r!="symbol"&&sp.test(t))&&t>-1&&t%1==0&&t<e}var gt=lp;function cp(t,e,r){e=="__proto__"&&qt?qt(t,e,{configurable:true,enumerable:true,value:r,writable:true}):t[e]=r;}var Zt=cp;function up(t,e){return t===e||t!==t&&e!==e}var We=up;var fp=Object.prototype,pp=fp.hasOwnProperty;function mp(t,e,r){var n=t[e];(!(pp.call(t,e)&&We(n,r))||r===void 0&&!(e in t))&&Zt(t,e,r);}var xt=mp;function hp(t,e,r,n){var o=!r;r||(r={});for(var i=-1,a=e.length;++i<a;){var s=e[i],l=n?n(r[s],t[s],s,r,t):void 0;l===void 0&&(l=t[s]),o?Zt(r,s,l):xt(r,s,l);}return r}var $e=hp;var za=Math.max;function dp(t,e,r){return e=za(e===void 0?t.length-1:e,0),function(){for(var n=arguments,o=-1,i=za(n.length-e,0),a=Array(i);++o<i;)a[o]=n[e+o];o=-1;for(var s=Array(e+1);++o<e;)s[o]=n[o];return s[e]=r(a),Ba(t,this,s)}}var Xa=dp;function gp(t,e){return Va(Xa(t,e,ve),t+"")}var Jt=gp;var xp=9007199254740991;function Tp(t){return typeof t=="number"&&t>-1&&t%1==0&&t<=xp}var er=Tp;function Ep(t){return t!=null&&er(t.length)&&!he(t)}var J=Ep;function Ap(t,e,r){if(!$(r))return  false;var n=typeof e;return (n=="number"?J(r)&&gt(e,r.length):n=="string"&&e in r)?We(r[e],t):false}var Tt=Ap;function Ip(t){return Jt(function(e,r){var n=-1,o=r.length,i=o>1?r[o-1]:void 0,a=o>2?r[2]:void 0;for(i=t.length>3&&typeof i=="function"?(o--,i):void 0,a&&Tt(r[0],r[1],a)&&(i=o<3?void 0:i,o=1),e=Object(e);++n<o;){var s=r[n];s&&t(e,s,n,i);}return e})}var Ya=Ip;var yp=Object.prototype;function Sp(t){var e=t&&t.constructor,r=typeof e=="function"&&e.prototype||yp;return t===r}var Ve=Sp;function Rp(t,e){for(var r=-1,n=Array(t);++r<t;)n[r]=e(r);return n}var qa=Rp;var Op="[object Arguments]";function Np(t){return X(t)&&me(t)==Op}var si=Np;var Qa=Object.prototype,_p=Qa.hasOwnProperty,Cp=Qa.propertyIsEnumerable,bp=si(function(){return arguments}())?si:function(t){return X(t)&&_p.call(t,"callee")&&!Cp.call(t,"callee")},Et=bp;function Lp(){return  false}var Za=Lp;var ts=exports&&!exports.nodeType&&exports,Ja=ts&&'object'=="object"&&module&&!module.nodeType&&module,vp=Ja&&Ja.exports===ts,es=vp?Z.Buffer:void 0,kp=es?es.isBuffer:void 0,Pp=kp||Za,it=Pp;var Mp="[object Arguments]",wp="[object Array]",Fp="[object Boolean]",Up="[object Date]",Dp="[object Error]",Bp="[object Function]",Gp="[object Map]",Kp="[object Number]",Wp="[object Object]",$p="[object RegExp]",Vp="[object Set]",jp="[object String]",Hp="[object WeakMap]",zp="[object ArrayBuffer]",Xp="[object DataView]",Yp="[object Float32Array]",qp="[object Float64Array]",Qp="[object Int8Array]",Zp="[object Int16Array]",Jp="[object Int32Array]",em="[object Uint8Array]",tm="[object Uint8ClampedArray]",rm="[object Uint16Array]",nm="[object Uint32Array]",B={};B[Yp]=B[qp]=B[Qp]=B[Zp]=B[Jp]=B[em]=B[tm]=B[rm]=B[nm]=true;B[Mp]=B[wp]=B[zp]=B[Fp]=B[Xp]=B[Up]=B[Dp]=B[Bp]=B[Gp]=B[Kp]=B[Wp]=B[$p]=B[Vp]=B[jp]=B[Hp]=false;function om(t){return X(t)&&er(t.length)&&!!B[me(t)]}var rs=om;function im(t){return function(e){return t(e)}}var je=im;var ns=exports&&!exports.nodeType&&exports,Gr=ns&&'object'=="object"&&module&&!module.nodeType&&module,am=Gr&&Gr.exports===ns,li=am&&vn.process,sm=function(){try{var t=Gr&&Gr.require&&Gr.require("util").types;return t||li&&li.binding&&li.binding("util")}catch{}}(),ke=sm;var os=ke&&ke.isTypedArray,lm=os?je(os):rs,tr=lm;var cm=Object.prototype,um=cm.hasOwnProperty;function fm(t,e){var r=I(t),n=!r&&Et(t),o=!r&&!n&&it(t),i=!r&&!n&&!o&&tr(t),a=r||n||o||i,s=a?qa(t.length,String):[],l=s.length;for(var c in t)(e||um.call(t,c))&&!(a&&(c=="length"||o&&(c=="offset"||c=="parent")||i&&(c=="buffer"||c=="byteLength"||c=="byteOffset")||gt(c,l)))&&s.push(c);return s}var Un=fm;function pm(t,e){return function(r){return t(e(r))}}var Dn=pm;var mm=Dn(Object.keys,Object),is=mm;var hm=Object.prototype,dm=hm.hasOwnProperty;function gm(t){if(!Ve(t))return is(t);var e=[];for(var r in Object(t))dm.call(t,r)&&r!="constructor"&&e.push(r);return e}var Bn=gm;function xm(t){return J(t)?Un(t):Bn(t)}var M=xm;var Tm=Object.prototype,Em=Tm.hasOwnProperty,Am=Ya(function(t,e){if(Ve(e)||J(e)){$e(e,M(e),t);return}for(var r in e)Em.call(e,r)&&xt(t,r,e[r]);}),le=Am;function Im(t){var e=[];if(t!=null)for(var r in Object(t))e.push(r);return e}var as=Im;var ym=Object.prototype,Sm=ym.hasOwnProperty;function Rm(t){if(!$(t))return as(t);var e=Ve(t),r=[];for(var n in t)n=="constructor"&&(e||!Sm.call(t,n))||r.push(n);return r}var ss=Rm;function Om(t){return J(t)?Un(t,true):ss(t)}var At=Om;var Nm=/\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/,_m=/^\w*$/;function Cm(t,e){if(I(t))return  false;var r=typeof t;return r=="number"||r=="symbol"||r=="boolean"||t==null||dt(t)?true:_m.test(t)||!Nm.test(t)||e!=null&&t in Object(e)}var rr=Cm;var bm=Ie(Object,"create"),at=bm;function Lm(){this.__data__=at?at(null):{},this.size=0;}var ls=Lm;function vm(t){var e=this.has(t)&&delete this.__data__[t];return this.size-=e?1:0,e}var cs=vm;var km="__lodash_hash_undefined__",Pm=Object.prototype,Mm=Pm.hasOwnProperty;function wm(t){var e=this.__data__;if(at){var r=e[t];return r===km?void 0:r}return Mm.call(e,t)?e[t]:void 0}var us=wm;var Fm=Object.prototype,Um=Fm.hasOwnProperty;function Dm(t){var e=this.__data__;return at?e[t]!==void 0:Um.call(e,t)}var fs=Dm;var Bm="__lodash_hash_undefined__";function Gm(t,e){var r=this.__data__;return this.size+=this.has(t)?0:1,r[t]=at&&e===void 0?Bm:e,this}var ps=Gm;function nr(t){var e=-1,r=t==null?0:t.length;for(this.clear();++e<r;){var n=t[e];this.set(n[0],n[1]);}}nr.prototype.clear=ls;nr.prototype.delete=cs;nr.prototype.get=us;nr.prototype.has=fs;nr.prototype.set=ps;var ci=nr;function Km(){this.__data__=[],this.size=0;}var ms=Km;function Wm(t,e){for(var r=t.length;r--;)if(We(t[r][0],e))return r;return  -1}var It=Wm;var $m=Array.prototype,Vm=$m.splice;function jm(t){var e=this.__data__,r=It(e,t);if(r<0)return  false;var n=e.length-1;return r==n?e.pop():Vm.call(e,r,1),--this.size,true}var hs=jm;function Hm(t){var e=this.__data__,r=It(e,t);return r<0?void 0:e[r][1]}var ds=Hm;function zm(t){return It(this.__data__,t)>-1}var gs=zm;function Xm(t,e){var r=this.__data__,n=It(r,t);return n<0?(++this.size,r.push([t,e])):r[n][1]=e,this}var xs=Xm;function or(t){var e=-1,r=t==null?0:t.length;for(this.clear();++e<r;){var n=t[e];this.set(n[0],n[1]);}}or.prototype.clear=ms;or.prototype.delete=hs;or.prototype.get=ds;or.prototype.has=gs;or.prototype.set=xs;var yt=or;var Ym=Ie(Z,"Map"),St=Ym;function qm(){this.size=0,this.__data__={hash:new ci,map:new(St||yt),string:new ci};}var Ts=qm;function Qm(t){var e=typeof t;return e=="string"||e=="number"||e=="symbol"||e=="boolean"?t!=="__proto__":t===null}var Es=Qm;function Zm(t,e){var r=t.__data__;return Es(e)?r[typeof e=="string"?"string":"hash"]:r.map}var Rt=Zm;function Jm(t){var e=Rt(this,t).delete(t);return this.size-=e?1:0,e}var As=Jm;function eh(t){return Rt(this,t).get(t)}var Is=eh;function th(t){return Rt(this,t).has(t)}var ys=th;function rh(t,e){var r=Rt(this,t),n=r.size;return r.set(t,e),this.size+=r.size==n?0:1,this}var Ss=rh;function ir(t){var e=-1,r=t==null?0:t.length;for(this.clear();++e<r;){var n=t[e];this.set(n[0],n[1]);}}ir.prototype.clear=Ts;ir.prototype.delete=As;ir.prototype.get=Is;ir.prototype.has=ys;ir.prototype.set=Ss;var Ft=ir;var nh="Expected a function";function ui(t,e){if(typeof t!="function"||e!=null&&typeof e!="function")throw new TypeError(nh);var r=function(){var n=arguments,o=e?e.apply(this,n):n[0],i=r.cache;if(i.has(o))return i.get(o);var a=t.apply(this,n);return r.cache=i.set(o,a)||i,a};return r.cache=new(ui.Cache||Ft),r}ui.Cache=Ft;var Rs=ui;var oh=500;function ih(t){var e=Rs(t,function(n){return r.size===oh&&r.clear(),n}),r=e.cache;return e}var Os=ih;var ah=/[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g,sh=/\\(\\)?/g,lh=Os(function(t){var e=[];return t.charCodeAt(0)===46&&e.push(""),t.replace(ah,function(r,n,o,i){e.push(o?i.replace(sh,"$1"):n||r);}),e}),Ns=lh;function ch(t){return t==null?"":Na(t)}var _s=ch;function uh(t,e){return I(t)?t:rr(t,e)?[t]:Ns(_s(t))}var Ot=uh;function ph(t){if(typeof t=="string"||dt(t))return t;var e=t+"";return e=="0"&&1/t==-Infinity?"-0":e}var He=ph;function mh(t,e){e=Ot(e,t);for(var r=0,n=e.length;t!=null&&r<n;)t=t[He(e[r++])];return r&&r==n?t:void 0}var ar=mh;function hh(t,e,r){var n=t==null?void 0:ar(t,e);return n===void 0?r:n}var Cs=hh;function dh(t,e){for(var r=-1,n=e.length,o=t.length;++r<n;)t[o+r]=e[r];return t}var sr=dh;var bs=ae?ae.isConcatSpreadable:void 0;function gh(t){return I(t)||Et(t)||!!(bs&&t&&t[bs])}var Ls=gh;function vs(t,e,r,n,o){var i=-1,a=t.length;for(r||(r=Ls),o||(o=[]);++i<a;){var s=t[i];e>0&&r(s)?e>1?vs(s,e-1,r,n,o):sr(o,s):n||(o[o.length]=s);}return o}var lr=vs;function xh(t){var e=t==null?0:t.length;return e?lr(t,1):[]}var re=xh;var Th=Dn(Object.getPrototypeOf,Object),Gn=Th;function Eh(t,e,r){var n=-1,o=t.length;e<0&&(e=-e>o?0:o+e),r=r>o?o:r,r<0&&(r+=o),o=e>r?0:r-e>>>0,e>>>=0;for(var i=Array(o);++n<o;)i[n]=t[n+e];return i}var Kn=Eh;function Ah(t,e,r,n){var o=-1,i=t==null?0:t.length;for(n&&i&&(r=t[++o]);++o<i;)r=e(r,t[o],o,t);return r}var ks=Ah;function Ih(){this.__data__=new yt,this.size=0;}var Ps=Ih;function yh(t){var e=this.__data__,r=e.delete(t);return this.size=e.size,r}var Ms=yh;function Sh(t){return this.__data__.get(t)}var ws=Sh;function Rh(t){return this.__data__.has(t)}var Fs=Rh;var Oh=200;function Nh(t,e){var r=this.__data__;if(r instanceof yt){var n=r.__data__;if(!St||n.length<Oh-1)return n.push([t,e]),this.size=++r.size,this;r=this.__data__=new Ft(n);}return r.set(t,e),this.size=r.size,this}var Us=Nh;function cr(t){var e=this.__data__=new yt(t);this.size=e.size;}cr.prototype.clear=Ps;cr.prototype.delete=Ms;cr.prototype.get=ws;cr.prototype.has=Fs;cr.prototype.set=Us;var Nt=cr;function _h(t,e){return t&&$e(e,M(e),t)}var Ds=_h;function Ch(t,e){return t&&$e(e,At(e),t)}var Bs=Ch;var $s=exports&&!exports.nodeType&&exports,Gs=$s&&'object'=="object"&&module&&!module.nodeType&&module,bh=Gs&&Gs.exports===$s,Ks=bh?Z.Buffer:void 0,Ws=Ks?Ks.allocUnsafe:void 0;function Lh(t,e){if(e)return t.slice();var r=t.length,n=Ws?Ws(r):new t.constructor(r);return t.copy(n),n}var Vs=Lh;function vh(t,e){for(var r=-1,n=t==null?0:t.length,o=0,i=[];++r<n;){var a=t[r];e(a,r,t)&&(i[o++]=a);}return i}var ur=vh;function kh(){return []}var Wn=kh;var Ph=Object.prototype,Mh=Ph.propertyIsEnumerable,js=Object.getOwnPropertySymbols,wh=js?function(t){return t==null?[]:(t=Object(t),ur(js(t),function(e){return Mh.call(t,e)}))}:Wn,fr=wh;function Fh(t,e){return $e(t,fr(t),e)}var Hs=Fh;var Uh=Object.getOwnPropertySymbols,Dh=Uh?function(t){for(var e=[];t;)sr(e,fr(t)),t=Gn(t);return e}:Wn,$n=Dh;function Bh(t,e){return $e(t,$n(t),e)}var zs=Bh;function Gh(t,e,r){var n=e(t);return I(t)?n:sr(n,r(t))}var Vn=Gh;function Kh(t){return Vn(t,M,fr)}var Kr=Kh;function Wh(t){return Vn(t,At,$n)}var jn=Wh;var $h=Ie(Z,"DataView"),Hn=$h;var Vh=Ie(Z,"Promise"),zn=Vh;var jh=Ie(Z,"Set"),_t=jh;var Xs="[object Map]",Hh="[object Object]",Ys="[object Promise]",qs="[object Set]",Qs="[object WeakMap]",Zs="[object DataView]",zh=ot(Hn),Xh=ot(St),Yh=ot(zn),qh=ot(_t),Qh=ot(Pn),Ut=me;(Hn&&Ut(new Hn(new ArrayBuffer(1)))!=Zs||St&&Ut(new St)!=Xs||zn&&Ut(zn.resolve())!=Ys||_t&&Ut(new _t)!=qs||Pn&&Ut(new Pn)!=Qs)&&(Ut=function(t){var e=me(t),r=e==Hh?t.constructor:void 0,n=r?ot(r):"";if(n)switch(n){case zh:return Zs;case Xh:return Xs;case Yh:return Ys;case qh:return qs;case Qh:return Qs}return e});var Fe=Ut;var Zh=Object.prototype,Jh=Zh.hasOwnProperty;function ed(t){var e=t.length,r=new t.constructor(e);return e&&typeof t[0]=="string"&&Jh.call(t,"index")&&(r.index=t.index,r.input=t.input),r}var Js=ed;var td=Z.Uint8Array,pr=td;function rd(t){var e=new t.constructor(t.byteLength);return new pr(e).set(new pr(t)),e}var mr=rd;function nd(t,e){var r=e?mr(t.buffer):t.buffer;return new t.constructor(r,t.byteOffset,t.byteLength)}var el=nd;var od=/\w*$/;function id(t){var e=new t.constructor(t.source,od.exec(t));return e.lastIndex=t.lastIndex,e}var tl=id;var rl=ae?ae.prototype:void 0,nl=rl?rl.valueOf:void 0;function ad(t){return nl?Object(nl.call(t)):{}}var ol=ad;function sd(t,e){var r=e?mr(t.buffer):t.buffer;return new t.constructor(r,t.byteOffset,t.length)}var il=sd;var ld="[object Boolean]",cd="[object Date]",ud="[object Map]",fd="[object Number]",pd="[object RegExp]",md="[object Set]",hd="[object String]",dd="[object Symbol]",gd="[object ArrayBuffer]",xd="[object DataView]",Td="[object Float32Array]",Ed="[object Float64Array]",Ad="[object Int8Array]",Id="[object Int16Array]",yd="[object Int32Array]",Sd="[object Uint8Array]",Rd="[object Uint8ClampedArray]",Od="[object Uint16Array]",Nd="[object Uint32Array]";function _d(t,e,r){var n=t.constructor;switch(e){case gd:return mr(t);case ld:case cd:return new n(+t);case xd:return el(t,r);case Td:case Ed:case Ad:case Id:case yd:case Sd:case Rd:case Od:case Nd:return il(t,r);case ud:return new n;case fd:case hd:return new n(t);case pd:return tl(t);case md:return new n;case dd:return ol(t)}}var al=_d;function Cd(t){return typeof t.constructor=="function"&&!Ve(t)?Da(Gn(t)):{}}var sl=Cd;var bd="[object Map]";function Ld(t){return X(t)&&Fe(t)==bd}var ll=Ld;var cl=ke&&ke.isMap,vd=cl?je(cl):ll,ul=vd;var kd="[object Set]";function Pd(t){return X(t)&&Fe(t)==kd}var fl=Pd;var pl=ke&&ke.isSet,Md=pl?je(pl):fl,ml=Md;var wd=1,Fd=2,Ud=4,hl="[object Arguments]",Dd="[object Array]",Bd="[object Boolean]",Gd="[object Date]",Kd="[object Error]",dl="[object Function]",Wd="[object GeneratorFunction]",$d="[object Map]",Vd="[object Number]",gl="[object Object]",jd="[object RegExp]",Hd="[object Set]",zd="[object String]",Xd="[object Symbol]",Yd="[object WeakMap]",qd="[object ArrayBuffer]",Qd="[object DataView]",Zd="[object Float32Array]",Jd="[object Float64Array]",eg="[object Int8Array]",tg="[object Int16Array]",rg="[object Int32Array]",ng="[object Uint8Array]",og="[object Uint8ClampedArray]",ig="[object Uint16Array]",ag="[object Uint32Array]",w={};w[hl]=w[Dd]=w[qd]=w[Qd]=w[Bd]=w[Gd]=w[Zd]=w[Jd]=w[eg]=w[tg]=w[rg]=w[$d]=w[Vd]=w[gl]=w[jd]=w[Hd]=w[zd]=w[Xd]=w[ng]=w[og]=w[ig]=w[ag]=true;w[Kd]=w[dl]=w[Yd]=false;function Xn(t,e,r,n,o,i){var a,s=e&wd,l=e&Fd,c=e&Ud;if(r&&(a=o?r(t,n,o,i):r(t)),a!==void 0)return a;if(!$(t))return t;var u=I(t);if(u){if(a=Js(t),!s)return Ga(t,a)}else {var f=Fe(t),p=f==dl||f==Wd;if(it(t))return Vs(t,s);if(f==gl||f==hl||p&&!o){if(a=l||p?{}:sl(t),!s)return l?zs(t,Bs(a,t)):Hs(t,Ds(a,t))}else {if(!w[f])return o?t:{};a=al(t,f,s);}}i||(i=new Nt);var T=i.get(t);if(T)return T;i.set(t,a),ml(t)?t.forEach(function(O){a.add(Xn(O,e,r,O,t,i));}):ul(t)&&t.forEach(function(O,A){a.set(A,Xn(O,e,r,A,t,i));});var y=c?l?jn:Kr:l?At:M,S=u?void 0:y(t);return Mn(S||t,function(O,A){S&&(A=O,O=t[A]),xt(a,A,Xn(O,e,r,A,t,i));}),a}var xl=Xn;var sg=4;function lg(t){return xl(t,sg)}var F=lg;function cg(t){for(var e=-1,r=t==null?0:t.length,n=0,o=[];++e<r;){var i=t[e];i&&(o[n++]=i);}return o}var ze=cg;var ug="__lodash_hash_undefined__";function fg(t){return this.__data__.set(t,ug),this}var Tl=fg;function pg(t){return this.__data__.has(t)}var El=pg;function Yn(t){var e=-1,r=t==null?0:t.length;for(this.__data__=new Ft;++e<r;)this.add(t[e]);}Yn.prototype.add=Yn.prototype.push=Tl;Yn.prototype.has=El;var hr=Yn;function mg(t,e){for(var r=-1,n=t==null?0:t.length;++r<n;)if(e(t[r],r,t))return  true;return  false}var qn=mg;function hg(t,e){return t.has(e)}var dr=hg;var dg=1,gg=2;function xg(t,e,r,n,o,i){var a=r&dg,s=t.length,l=e.length;if(s!=l&&!(a&&l>s))return  false;var c=i.get(t),u=i.get(e);if(c&&u)return c==e&&u==t;var f=-1,p=true,T=r&gg?new hr:void 0;for(i.set(t,e),i.set(e,t);++f<s;){var y=t[f],S=e[f];if(n)var O=a?n(S,y,f,e,t,i):n(y,S,f,t,e,i);if(O!==void 0){if(O)continue;p=false;break}if(T){if(!qn(e,function(A,g){if(!dr(T,g)&&(y===A||o(y,A,r,n,i)))return T.push(g)})){p=false;break}}else if(!(y===S||o(y,S,r,n,i))){p=false;break}}return i.delete(t),i.delete(e),p}var Qn=xg;function Tg(t){var e=-1,r=Array(t.size);return t.forEach(function(n,o){r[++e]=[o,n];}),r}var Al=Tg;function Eg(t){var e=-1,r=Array(t.size);return t.forEach(function(n){r[++e]=n;}),r}var gr=Eg;var Ag=1,Ig=2,yg="[object Boolean]",Sg="[object Date]",Rg="[object Error]",Og="[object Map]",Ng="[object Number]",_g="[object RegExp]",Cg="[object Set]",bg="[object String]",Lg="[object Symbol]",vg="[object ArrayBuffer]",kg="[object DataView]",Il=ae?ae.prototype:void 0,fi=Il?Il.valueOf:void 0;function Pg(t,e,r,n,o,i,a){switch(r){case kg:if(t.byteLength!=e.byteLength||t.byteOffset!=e.byteOffset)return  false;t=t.buffer,e=e.buffer;case vg:return !(t.byteLength!=e.byteLength||!i(new pr(t),new pr(e)));case yg:case Sg:case Ng:return We(+t,+e);case Rg:return t.name==e.name&&t.message==e.message;case _g:case bg:return t==e+"";case Og:var s=Al;case Cg:var l=n&Ag;if(s||(s=gr),t.size!=e.size&&!l)return  false;var c=a.get(t);if(c)return c==e;n|=Ig,a.set(t,e);var u=Qn(s(t),s(e),n,o,i,a);return a.delete(t),u;case Lg:if(fi)return fi.call(t)==fi.call(e)}return  false}var yl=Pg;var Mg=1,wg=Object.prototype,Fg=wg.hasOwnProperty;function Ug(t,e,r,n,o,i){var a=r&Mg,s=Kr(t),l=s.length,c=Kr(e),u=c.length;if(l!=u&&!a)return  false;for(var f=l;f--;){var p=s[f];if(!(a?p in e:Fg.call(e,p)))return  false}var T=i.get(t),y=i.get(e);if(T&&y)return T==e&&y==t;var S=true;i.set(t,e),i.set(e,t);for(var O=a;++f<l;){p=s[f];var A=t[p],g=e[p];if(n)var m=a?n(g,A,p,e,t,i):n(A,g,p,t,e,i);if(!(m===void 0?A===g||o(A,g,r,n,i):m)){S=false;break}O||(O=p=="constructor");}if(S&&!O){var N=t.constructor,_=e.constructor;N!=_&&"constructor"in t&&"constructor"in e&&!(typeof N=="function"&&N instanceof N&&typeof _=="function"&&_ instanceof _)&&(S=false);}return i.delete(t),i.delete(e),S}var Sl=Ug;var Dg=1,Rl="[object Arguments]",Ol="[object Array]",Zn="[object Object]",Bg=Object.prototype,Nl=Bg.hasOwnProperty;function Gg(t,e,r,n,o,i){var a=I(t),s=I(e),l=a?Ol:Fe(t),c=s?Ol:Fe(e);l=l==Rl?Zn:l,c=c==Rl?Zn:c;var u=l==Zn,f=c==Zn,p=l==c;if(p&&it(t)){if(!it(e))return  false;a=true,u=false;}if(p&&!u)return i||(i=new Nt),a||tr(t)?Qn(t,e,r,n,o,i):yl(t,e,l,r,n,o,i);if(!(r&Dg)){var T=u&&Nl.call(t,"__wrapped__"),y=f&&Nl.call(e,"__wrapped__");if(T||y){var S=T?t.value():t,O=y?e.value():e;return i||(i=new Nt),o(S,O,r,n,i)}}return p?(i||(i=new Nt),Sl(t,e,r,n,o,i)):false}var _l=Gg;function Cl(t,e,r,n,o){return t===e?true:t==null||e==null||!X(t)&&!X(e)?t!==t&&e!==e:_l(t,e,r,n,Cl,o)}var Jn=Cl;var Kg=1,Wg=2;function $g(t,e,r,n){var o=r.length,i=o,a=!n;if(t==null)return !i;for(t=Object(t);o--;){var s=r[o];if(a&&s[2]?s[1]!==t[s[0]]:!(s[0]in t))return  false}for(;++o<i;){s=r[o];var l=s[0],c=t[l],u=s[1];if(a&&s[2]){if(c===void 0&&!(l in t))return  false}else {var f=new Nt;if(n)var p=n(c,u,l,t,e,f);if(!(p===void 0?Jn(u,c,Kg|Wg,n,f):p))return  false}}return  true}var bl=$g;function Vg(t){return t===t&&!$(t)}var eo=Vg;function jg(t){for(var e=M(t),r=e.length;r--;){var n=e[r],o=t[n];e[r]=[n,o,eo(o)];}return e}var Ll=jg;function Hg(t,e){return function(r){return r==null?false:r[t]===e&&(e!==void 0||t in Object(r))}}var to=Hg;function zg(t){var e=Ll(t);return e.length==1&&e[0][2]?to(e[0][0],e[0][1]):function(r){return r===t||bl(r,t,e)}}var vl=zg;function Xg(t,e){return t!=null&&e in Object(t)}var kl=Xg;function Yg(t,e,r){e=Ot(e,t);for(var n=-1,o=e.length,i=false;++n<o;){var a=He(e[n]);if(!(i=t!=null&&r(t,a)))break;t=t[a];}return i||++n!=o?i:(o=t==null?0:t.length,!!o&&er(o)&&gt(a,o)&&(I(t)||Et(t)))}var ro=Yg;function qg(t,e){return t!=null&&ro(t,e,kl)}var Pl=qg;var Qg=1,Zg=2;function Jg(t,e){return rr(t)&&eo(e)?to(He(t),e):function(r){var n=Cs(r,t);return n===void 0&&n===e?Pl(r,t):Jn(e,n,Qg|Zg)}}var Ml=Jg;function ex(t){return function(e){return e==null?void 0:e[t]}}var wl=ex;function tx(t){return function(e){return ar(e,t)}}var Fl=tx;function rx(t){return rr(t)?wl(He(t)):Fl(t)}var Ul=rx;function nx(t){return typeof t=="function"?t:t==null?ve:typeof t=="object"?I(t)?Ml(t[0],t[1]):vl(t):Ul(t)}var ee=nx;function ox(t,e,r,n){for(var o=-1,i=t==null?0:t.length;++o<i;){var a=t[o];e(n,a,r(a),t);}return n}var Dl=ox;function ix(t){return function(e,r,n){for(var o=-1,i=Object(e),a=n(e),s=a.length;s--;){var l=a[t?s:++o];if(r(i[l],l,i)===false)break}return e}}var Bl=ix;var ax=Bl(),Gl=ax;function sx(t,e){return t&&Gl(t,e,M)}var Kl=sx;function lx(t,e){return function(r,n){if(r==null)return r;if(!J(r))return t(r,n);for(var o=r.length,i=e?o:-1,a=Object(r);(e?i--:++i<o)&&n(a[i],i,a)!==false;);return r}}var Wl=lx;var cx=Wl(Kl),ye=cx;function ux(t,e,r,n){return ye(t,function(o,i,a){e(n,o,r(o),a);}),n}var $l=ux;function fx(t,e){return function(r,n){var o=I(r)?Dl:$l,i=e?e():{};return o(r,t,ee(n),i)}}var Vl=fx;var jl=Object.prototype,px=jl.hasOwnProperty,mx=Jt(function(t,e){t=Object(t);var r=-1,n=e.length,o=n>2?e[2]:void 0;for(o&&Tt(e[0],e[1],o)&&(n=1);++r<n;)for(var i=e[r],a=At(i),s=-1,l=a.length;++s<l;){var c=a[s],u=t[c];(u===void 0||We(u,jl[c])&&!px.call(t,c))&&(t[c]=i[c]);}return t}),xr=mx;function hx(t){return X(t)&&J(t)}var pi=hx;function dx(t,e,r){for(var n=-1,o=t==null?0:t.length;++n<o;)if(r(e,t[n]))return  true;return  false}var no=dx;var gx=200;function xx(t,e,r,n){var o=-1,i=Fn,a=true,s=t.length,l=[],c=e.length;if(!s)return l;r&&(e=Ge(e,je(r))),n?(i=no,a=false):e.length>=gx&&(i=dr,a=false,e=new hr(e));e:for(;++o<s;){var u=t[o],f=r==null?u:r(u);if(u=n||u!==0?u:0,a&&f===f){for(var p=c;p--;)if(e[p]===f)continue e;l.push(u);}else i(e,f,n)||l.push(u);}return l}var Hl=xx;var Tx=Jt(function(t,e){return pi(t)?Hl(t,lr(e,1,pi,true)):[]}),Ct=Tx;function Ex(t){var e=t==null?0:t.length;return e?t[e-1]:void 0}var Xe=Ex;function Ax(t,e,r){var n=t==null?0:t.length;return n?(e=r||e===void 0?1:Ke(e),Kn(t,e<0?0:e,n)):[]}var Y=Ax;function Ix(t,e,r){var n=t==null?0:t.length;return n?(e=r||e===void 0?1:Ke(e),e=n-e,Kn(t,0,e<0?0:e)):[]}var st=Ix;function yx(t){return typeof t=="function"?t:ve}var zl=yx;function Sx(t,e){var r=I(t)?Mn:ye;return r(t,zl(e))}var x=Sx;function Rx(t,e){for(var r=-1,n=t==null?0:t.length;++r<n;)if(!e(t[r],r,t))return  false;return  true}var Xl=Rx;function Ox(t,e){var r=true;return ye(t,function(n,o,i){return r=!!e(n,o,i),r}),r}var Yl=Ox;function Nx(t,e,r){var n=I(t)?Xl:Yl;return r&&Tt(t,e,r)&&(e=void 0),n(t,ee(e))}var ue=Nx;function _x(t,e){var r=[];return ye(t,function(n,o,i){e(n,o,i)&&r.push(n);}),r}var oo=_x;function Cx(t,e){var r=I(t)?ur:oo;return r(t,ee(e))}var fe=Cx;function bx(t){return function(e,r,n){var o=Object(e);if(!J(e)){var i=ee(r);e=M(e),r=function(s){return i(o[s],s,o)};}var a=t(e,r,n);return a>-1?o[i?e[a]:a]:void 0}}var ql=bx;var Lx=Math.max;function vx(t,e,r){var n=t==null?0:t.length;if(!n)return  -1;var o=r==null?0:Ke(r);return o<0&&(o=Lx(n+o,0)),wn(t,ee(e),o)}var Ql=vx;var kx=ql(Ql),Ye=kx;function Px(t){return t&&t.length?t[0]:void 0}var se=Px;function Mx(t,e){var r=-1,n=J(t)?Array(t.length):[];return ye(t,function(o,i,a){n[++r]=e(o,i,a);}),n}var Zl=Mx;function wx(t,e){var r=I(t)?Ge:Zl;return r(t,ee(e))}var d=wx;function Fx(t,e){return lr(d(t,e),1)}var de=Fx;var Ux=Object.prototype,Dx=Ux.hasOwnProperty,Bx=Vl(function(t,e,r){Dx.call(t,r)?t[r].push(e):Zt(t,r,[e]);}),mi=Bx;var Gx=Object.prototype,Kx=Gx.hasOwnProperty;function Wx(t,e){return t!=null&&Kx.call(t,e)}var Jl=Wx;function $x(t,e){return t!=null&&ro(t,e,Jl)}var E=$x;var Vx="[object String]";function jx(t){return typeof t=="string"||!I(t)&&X(t)&&me(t)==Vx}var ne=jx;function Hx(t,e){return Ge(e,function(r){return t[r]})}var ec=Hx;function zx(t){return t==null?[]:ec(t,M(t))}var P=zx;var Xx=Math.max;function Yx(t,e,r,n){t=J(t)?t:P(t),r=r&&!n?Ke(r):0;var o=t.length;return r<0&&(r=Xx(o+r,0)),ne(t)?r<=o&&t.indexOf(e,r)>-1:!!o&&Qt(t,e,r)>-1}var K=Yx;var qx=Math.max;function Qx(t,e,r){var n=t==null?0:t.length;if(!n)return  -1;var o=r==null?0:Ke(r);return o<0&&(o=qx(n+o,0)),Qt(t,e,o)}var io=Qx;var Zx="[object Map]",Jx="[object Set]",eT=Object.prototype,tT=eT.hasOwnProperty;function rT(t){if(t==null)return  true;if(J(t)&&(I(t)||typeof t=="string"||typeof t.splice=="function"||it(t)||tr(t)||Et(t)))return !t.length;var e=Fe(t);if(e==Zx||e==Jx)return !t.size;if(Ve(t))return !Bn(t).length;for(var r in t)if(tT.call(t,r))return  false;return  true}var C=rT;var nT="[object RegExp]";function oT(t){return X(t)&&me(t)==nT}var tc=oT;var rc=ke&&ke.isRegExp,iT=rc?je(rc):tc,Pe=iT;function aT(t){return t===void 0}var pe=aT;var sT="Expected a function";function lT(t){if(typeof t!="function")throw new TypeError(sT);return function(){var e=arguments;switch(e.length){case 0:return !t.call(this);case 1:return !t.call(this,e[0]);case 2:return !t.call(this,e[0],e[1]);case 3:return !t.call(this,e[0],e[1],e[2])}return !t.apply(this,e)}}var nc=lT;function cT(t,e,r,n){if(!$(t))return t;e=Ot(e,t);for(var o=-1,i=e.length,a=i-1,s=t;s!=null&&++o<i;){var l=He(e[o]),c=r;if(l==="__proto__"||l==="constructor"||l==="prototype")return t;if(o!=a){var u=s[l];c=n?n(u,l,s):void 0,c===void 0&&(c=$(u)?u:gt(e[o+1])?[]:{});}xt(s,l,c),s=s[l];}return t}var oc=cT;function uT(t,e,r){for(var n=-1,o=e.length,i={};++n<o;){var a=e[n],s=ar(t,a);r(s,a)&&oc(i,Ot(a,t),s);}return i}var ic=uT;function fT(t,e){if(t==null)return {};var r=Ge(jn(t),function(n){return [n]});return e=ee(e),ic(t,r,function(n,o){return e(n,o[0])})}var Se=fT;function pT(t,e,r,n,o){return o(t,function(i,a,s){r=n?(n=false,i):e(r,i,a,s);}),r}var ac=pT;function mT(t,e,r){var n=I(t)?ks:ac,o=arguments.length<3;return n(t,ee(e),r,o,ye)}var te=mT;function hT(t,e){var r=I(t)?ur:oo;return r(t,nc(ee(e)))}var bt=hT;function dT(t,e){var r;return ye(t,function(n,o,i){return r=e(n,o,i),!r}),!!r}var sc=dT;function gT(t,e,r){var n=I(t)?qn:sc;return r&&Tt(t,e,r)&&(e=void 0),n(t,ee(e))}var Wr=gT;var xT=1/0,TT=_t&&1/gr(new _t([,-0]))[1]==xT?function(t){return new _t(t)}:V,lc=TT;var ET=200;function AT(t,e,r){var n=-1,o=Fn,i=t.length,a=true,s=[],l=s;if(r)a=false,o=no;else if(i>=ET){var c=e?null:lc(t);if(c)return gr(c);a=false,o=dr,l=new hr;}else l=e?[]:s;e:for(;++n<i;){var u=t[n],f=e?e(u):u;if(u=r||u!==0?u:0,a&&f===f){for(var p=l.length;p--;)if(l[p]===f)continue e;e&&l.push(f),s.push(u);}else o(l,f,r)||(l!==s&&l.push(f),s.push(u));}return s}var cc=AT;function IT(t){return t&&t.length?cc(t):[]}var Tr=IT;function Er(t){console&&console.error&&console.error(`Error: ${t}`);}function $r(t){console&&console.warn&&console.warn(`Warning: ${t}`);}function Vr(t){let e=new Date().getTime(),r=t();return {time:new Date().getTime()-e,value:r}}function jr(t){function e(){}e.prototype=t;let r=new e;function n(){return typeof r.bar}return n(),n(),t;}function yT(t){return ST(t)?t.LABEL:t.name}function ST(t){return ne(t.LABEL)&&t.LABEL!==""}var be=class{get definition(){return this._definition}set definition(e){this._definition=e;}constructor(e){this._definition=e;}accept(e){e.visit(this),x(this.definition,r=>{r.accept(e);});}},U=class extends be{constructor(e){super([]),this.idx=1,le(this,Se(e,r=>r!==void 0));}set definition(e){}get definition(){return this.referencedRule!==void 0?this.referencedRule.definition:[]}accept(e){e.visit(this);}},ge=class extends be{constructor(e){super(e.definition),this.orgText="",le(this,Se(e,r=>r!==void 0));}},D=class extends be{constructor(e){super(e.definition),this.ignoreAmbiguities=false,le(this,Se(e,r=>r!==void 0));}},G=class extends be{constructor(e){super(e.definition),this.idx=1,le(this,Se(e,r=>r!==void 0));}},q=class extends be{constructor(e){super(e.definition),this.idx=1,le(this,Se(e,r=>r!==void 0));}},Q=class extends be{constructor(e){super(e.definition),this.idx=1,le(this,Se(e,r=>r!==void 0));}},k=class extends be{constructor(e){super(e.definition),this.idx=1,le(this,Se(e,r=>r!==void 0));}},H=class extends be{constructor(e){super(e.definition),this.idx=1,le(this,Se(e,r=>r!==void 0));}},z=class extends be{get definition(){return this._definition}set definition(e){this._definition=e;}constructor(e){super(e.definition),this.idx=1,this.ignoreAmbiguities=false,this.hasPredicates=false,le(this,Se(e,r=>r!==void 0));}},b=class{constructor(e){this.idx=1,le(this,Se(e,r=>r!==void 0));}accept(e){e.visit(this);}};function ao(t){return d(t,Ar)}function Ar(t){function e(r){return d(r,Ar)}if(t instanceof U){let r={type:"NonTerminal",name:t.nonTerminalName,idx:t.idx};return ne(t.label)&&(r.label=t.label),r}else {if(t instanceof D)return {type:"Alternative",definition:e(t.definition)};if(t instanceof G)return {type:"Option",idx:t.idx,definition:e(t.definition)};if(t instanceof q)return {type:"RepetitionMandatory",idx:t.idx,definition:e(t.definition)};if(t instanceof Q)return {type:"RepetitionMandatoryWithSeparator",idx:t.idx,separator:Ar(new b({terminalType:t.separator})),definition:e(t.definition)};if(t instanceof H)return {type:"RepetitionWithSeparator",idx:t.idx,separator:Ar(new b({terminalType:t.separator})),definition:e(t.definition)};if(t instanceof k)return {type:"Repetition",idx:t.idx,definition:e(t.definition)};if(t instanceof z)return {type:"Alternation",idx:t.idx,definition:e(t.definition)};if(t instanceof b){let r={type:"Terminal",name:t.terminalType.name,label:yT(t.terminalType),idx:t.idx};ne(t.label)&&(r.terminalLabel=t.label);let n=t.terminalType.PATTERN;return t.terminalType.PATTERN&&(r.pattern=Pe(n)?n.source:n),r}else {if(t instanceof ge)return {type:"Rule",name:t.name,orgText:t.orgText,definition:e(t.definition)};throw Error("non exhaustive match")}}}var xe=class{visit(e){let r=e;switch(r.constructor){case U:return this.visitNonTerminal(r);case D:return this.visitAlternative(r);case G:return this.visitOption(r);case q:return this.visitRepetitionMandatory(r);case Q:return this.visitRepetitionMandatoryWithSeparator(r);case H:return this.visitRepetitionWithSeparator(r);case k:return this.visitRepetition(r);case z:return this.visitAlternation(r);case b:return this.visitTerminal(r);case ge:return this.visitRule(r);default:throw Error("non exhaustive match")}}visitNonTerminal(e){}visitAlternative(e){}visitOption(e){}visitRepetition(e){}visitRepetitionMandatory(e){}visitRepetitionMandatoryWithSeparator(e){}visitRepetitionWithSeparator(e){}visitAlternation(e){}visitTerminal(e){}visitRule(e){}};function hi(t){return t instanceof D||t instanceof G||t instanceof k||t instanceof q||t instanceof Q||t instanceof H||t instanceof b||t instanceof ge}function Dt(t,e=[]){return t instanceof G||t instanceof k||t instanceof H?true:t instanceof z?Wr(t.definition,n=>Dt(n,e)):t instanceof U&&K(e,t)?false:t instanceof be?(t instanceof U&&e.push(t),ue(t.definition,n=>Dt(n,e))):false}function di(t){return t instanceof z}function Re(t){if(t instanceof U)return "SUBRULE";if(t instanceof G)return "OPTION";if(t instanceof z)return "OR";if(t instanceof q)return "AT_LEAST_ONE";if(t instanceof Q)return "AT_LEAST_ONE_SEP";if(t instanceof H)return "MANY_SEP";if(t instanceof k)return "MANY";if(t instanceof b)return "CONSUME";throw Error("non exhaustive match")}var lt=class{walk(e,r=[]){x(e.definition,(n,o)=>{let i=Y(e.definition,o+1);if(n instanceof U)this.walkProdRef(n,i,r);else if(n instanceof b)this.walkTerminal(n,i,r);else if(n instanceof D)this.walkFlat(n,i,r);else if(n instanceof G)this.walkOption(n,i,r);else if(n instanceof q)this.walkAtLeastOne(n,i,r);else if(n instanceof Q)this.walkAtLeastOneSep(n,i,r);else if(n instanceof H)this.walkManySep(n,i,r);else if(n instanceof k)this.walkMany(n,i,r);else if(n instanceof z)this.walkOr(n,i,r);else throw Error("non exhaustive match")});}walkTerminal(e,r,n){}walkProdRef(e,r,n){}walkFlat(e,r,n){let o=r.concat(n);this.walk(e,o);}walkOption(e,r,n){let o=r.concat(n);this.walk(e,o);}walkAtLeastOne(e,r,n){let o=[new G({definition:e.definition})].concat(r,n);this.walk(e,o);}walkAtLeastOneSep(e,r,n){let o=uc(e,r,n);this.walk(e,o);}walkMany(e,r,n){let o=[new G({definition:e.definition})].concat(r,n);this.walk(e,o);}walkManySep(e,r,n){let o=uc(e,r,n);this.walk(e,o);}walkOr(e,r,n){let o=r.concat(n);x(e.definition,i=>{let a=new D({definition:[i]});this.walk(a,o);});}};function uc(t,e,r){return [new G({definition:[new b({terminalType:t.separator})].concat(t.definition)})].concat(e,r)}function Bt(t){if(t instanceof U)return Bt(t.referencedRule);if(t instanceof b)return NT(t);if(hi(t))return RT(t);if(di(t))return OT(t);throw Error("non exhaustive match")}function RT(t){let e=[],r=t.definition,n=0,o=r.length>n,i,a=true;for(;o&&a;)i=r[n],a=Dt(i),e=e.concat(Bt(i)),n=n+1,o=r.length>n;return Tr(e)}function OT(t){let e=d(t.definition,r=>Bt(r));return Tr(re(e))}function NT(t){return [t.terminalType]}var so="_~IN~_";var gi=class extends lt{constructor(e){super(),this.topProd=e,this.follows={};}startWalking(){return this.walk(this.topProd),this.follows}walkTerminal(e,r,n){}walkProdRef(e,r,n){let o=_T(e.referencedRule,e.idx)+this.topProd.name,i=r.concat(n),a=new D({definition:i}),s=Bt(a);this.follows[o]=s;}};function fc(t){let e={};return x(t,r=>{let n=new gi(r).startWalking();le(e,n);}),e}function _T(t,e){return t.name+e+so}function R(t){return t.charCodeAt(0)}function lo(t,e){Array.isArray(t)?t.forEach(function(r){e.push(r);}):e.push(t);}function Ir(t,e){if(t[e]===true)throw "duplicate flag "+e;t[e];t[e]=true;}function Gt(t){if(t===void 0)throw Error("Internal Error - Should never get here!");return  true}function Hr(){throw Error("Internal Error - Should never get here!")}function xi(t){return t.type==="Character"}var zr=[];for(let t=R("0");t<=R("9");t++)zr.push(t);var Xr=[R("_")].concat(zr);for(let t=R("a");t<=R("z");t++)Xr.push(t);for(let t=R("A");t<=R("Z");t++)Xr.push(t);var Ti=[R(" "),R("\f"),R(`
`),R("\r"),R("	"),R("\v"),R("	"),R("\xA0"),R("\u1680"),R("\u2000"),R("\u2001"),R("\u2002"),R("\u2003"),R("\u2004"),R("\u2005"),R("\u2006"),R("\u2007"),R("\u2008"),R("\u2009"),R("\u200A"),R("\u2028"),R("\u2029"),R("\u202F"),R("\u205F"),R("\u3000"),R("\uFEFF")];var CT=/[0-9a-fA-F]/,co=/[0-9]/,bT=/[1-9]/,Yr=class{constructor(){this.idx=0,this.input="",this.groupIdx=0;}saveState(){return {idx:this.idx,input:this.input,groupIdx:this.groupIdx}}restoreState(e){this.idx=e.idx,this.input=e.input,this.groupIdx=e.groupIdx;}pattern(e){this.idx=0,this.input=e,this.groupIdx=0,this.consumeChar("/");let r=this.disjunction();this.consumeChar("/");let n={type:"Flags",loc:{begin:this.idx,end:e.length},global:false,ignoreCase:false,multiLine:false,unicode:false,sticky:false};for(;this.isRegExpFlag();)switch(this.popChar()){case "g":Ir(n,"global");break;case "i":Ir(n,"ignoreCase");break;case "m":Ir(n,"multiLine");break;case "u":Ir(n,"unicode");break;case "y":Ir(n,"sticky");break}if(this.idx!==this.input.length)throw Error("Redundant input: "+this.input.substring(this.idx));return {type:"Pattern",flags:n,value:r,loc:this.loc(0)}}disjunction(){let e=[],r=this.idx;for(e.push(this.alternative());this.peekChar()==="|";)this.consumeChar("|"),e.push(this.alternative());return {type:"Disjunction",value:e,loc:this.loc(r)}}alternative(){let e=[],r=this.idx;for(;this.isTerm();)e.push(this.term());return {type:"Alternative",value:e,loc:this.loc(r)}}term(){return this.isAssertion()?this.assertion():this.atom()}assertion(){let e=this.idx;switch(this.popChar()){case "^":return {type:"StartAnchor",loc:this.loc(e)};case "$":return {type:"EndAnchor",loc:this.loc(e)};case "\\":switch(this.popChar()){case "b":return {type:"WordBoundary",loc:this.loc(e)};case "B":return {type:"NonWordBoundary",loc:this.loc(e)}}throw Error("Invalid Assertion Escape");case "(":this.consumeChar("?");let r;switch(this.popChar()){case "=":r="Lookahead";break;case "!":r="NegativeLookahead";break}Gt(r);let n=this.disjunction();return this.consumeChar(")"),{type:r,value:n,loc:this.loc(e)}}return Hr()}quantifier(e=false){let r,n=this.idx;switch(this.popChar()){case "*":r={atLeast:0,atMost:1/0};break;case "+":r={atLeast:1,atMost:1/0};break;case "?":r={atLeast:0,atMost:1};break;case "{":let o=this.integerIncludingZero();switch(this.popChar()){case "}":r={atLeast:o,atMost:o};break;case ",":let i;this.isDigit()?(i=this.integerIncludingZero(),r={atLeast:o,atMost:i}):r={atLeast:o,atMost:1/0},this.consumeChar("}");break}if(e===true&&r===void 0)return;Gt(r);break}if(!(e===true&&r===void 0)&&Gt(r))return this.peekChar(0)==="?"?(this.consumeChar("?"),r.greedy=false):r.greedy=true,r.type="Quantifier",r.loc=this.loc(n),r}atom(){let e,r=this.idx;switch(this.peekChar()){case ".":e=this.dotAll();break;case "\\":e=this.atomEscape();break;case "[":e=this.characterClass();break;case "(":e=this.group();break}return e===void 0&&this.isPatternCharacter()&&(e=this.patternCharacter()),Gt(e)?(e.loc=this.loc(r),this.isQuantifier()&&(e.quantifier=this.quantifier()),e):Hr()}dotAll(){return this.consumeChar("."),{type:"Set",complement:true,value:[R(`
`),R("\r"),R("\u2028"),R("\u2029")]}}atomEscape(){switch(this.consumeChar("\\"),this.peekChar()){case "1":case "2":case "3":case "4":case "5":case "6":case "7":case "8":case "9":return this.decimalEscapeAtom();case "d":case "D":case "s":case "S":case "w":case "W":return this.characterClassEscape();case "f":case "n":case "r":case "t":case "v":return this.controlEscapeAtom();case "c":return this.controlLetterEscapeAtom();case "0":return this.nulCharacterAtom();case "x":return this.hexEscapeSequenceAtom();case "u":return this.regExpUnicodeEscapeSequenceAtom();default:return this.identityEscapeAtom()}}decimalEscapeAtom(){return {type:"GroupBackReference",value:this.positiveInteger()}}characterClassEscape(){let e,r=false;switch(this.popChar()){case "d":e=zr;break;case "D":e=zr,r=true;break;case "s":e=Ti;break;case "S":e=Ti,r=true;break;case "w":e=Xr;break;case "W":e=Xr,r=true;break}return Gt(e)?{type:"Set",value:e,complement:r}:Hr()}controlEscapeAtom(){let e;switch(this.popChar()){case "f":e=R("\f");break;case "n":e=R(`
`);break;case "r":e=R("\r");break;case "t":e=R("	");break;case "v":e=R("\v");break}return Gt(e)?{type:"Character",value:e}:Hr()}controlLetterEscapeAtom(){this.consumeChar("c");let e=this.popChar();if(/[a-zA-Z]/.test(e)===false)throw Error("Invalid ");return {type:"Character",value:e.toUpperCase().charCodeAt(0)-64}}nulCharacterAtom(){return this.consumeChar("0"),{type:"Character",value:R("\0")}}hexEscapeSequenceAtom(){return this.consumeChar("x"),this.parseHexDigits(2)}regExpUnicodeEscapeSequenceAtom(){return this.consumeChar("u"),this.parseHexDigits(4)}identityEscapeAtom(){let e=this.popChar();return {type:"Character",value:R(e)}}classPatternCharacterAtom(){switch(this.peekChar()){case `
`:case "\r":case "\u2028":case "\u2029":case "\\":case "]":throw Error("TBD");default:let e=this.popChar();return {type:"Character",value:R(e)}}}characterClass(){let e=[],r=false;for(this.consumeChar("["),this.peekChar(0)==="^"&&(this.consumeChar("^"),r=true);this.isClassAtom();){let n=this.classAtom();n.type==="Character";if(xi(n)&&this.isRangeDash()){this.consumeChar("-");let i=this.classAtom();i.type==="Character";if(xi(i)){if(i.value<n.value)throw Error("Range out of order in character class");e.push({from:n.value,to:i.value});}else lo(n.value,e),e.push(R("-")),lo(i.value,e);}else lo(n.value,e);}return this.consumeChar("]"),{type:"Set",complement:r,value:e}}classAtom(){switch(this.peekChar()){case "]":case `
`:case "\r":case "\u2028":case "\u2029":throw Error("TBD");case "\\":return this.classEscape();default:return this.classPatternCharacterAtom()}}classEscape(){switch(this.consumeChar("\\"),this.peekChar()){case "b":return this.consumeChar("b"),{type:"Character",value:R("\b")};case "d":case "D":case "s":case "S":case "w":case "W":return this.characterClassEscape();case "f":case "n":case "r":case "t":case "v":return this.controlEscapeAtom();case "c":return this.controlLetterEscapeAtom();case "0":return this.nulCharacterAtom();case "x":return this.hexEscapeSequenceAtom();case "u":return this.regExpUnicodeEscapeSequenceAtom();default:return this.identityEscapeAtom()}}group(){let e=true;switch(this.consumeChar("("),this.peekChar(0)){case "?":this.consumeChar("?"),this.consumeChar(":"),e=false;break;default:this.groupIdx++;break}let r=this.disjunction();this.consumeChar(")");let n={type:"Group",capturing:e,value:r};return e&&(n.idx=this.groupIdx),n}positiveInteger(){let e=this.popChar();if(bT.test(e)===false)throw Error("Expecting a positive integer");for(;co.test(this.peekChar(0));)e+=this.popChar();return parseInt(e,10)}integerIncludingZero(){let e=this.popChar();if(co.test(e)===false)throw Error("Expecting an integer");for(;co.test(this.peekChar(0));)e+=this.popChar();return parseInt(e,10)}patternCharacter(){let e=this.popChar();switch(e){case `
`:case "\r":case "\u2028":case "\u2029":case "^":case "$":case "\\":case ".":case "*":case "+":case "?":case "(":case ")":case "[":case "|":throw Error("TBD");default:return {type:"Character",value:R(e)}}}isRegExpFlag(){switch(this.peekChar(0)){case "g":case "i":case "m":case "u":case "y":return  true;default:return  false}}isRangeDash(){return this.peekChar()==="-"&&this.isClassAtom(1)}isDigit(){return co.test(this.peekChar(0))}isClassAtom(e=0){switch(this.peekChar(e)){case "]":case `
`:case "\r":case "\u2028":case "\u2029":return  false;default:return  true}}isTerm(){return this.isAtom()||this.isAssertion()}isAtom(){if(this.isPatternCharacter())return  true;switch(this.peekChar(0)){case ".":case "\\":case "[":case "(":return  true;default:return  false}}isAssertion(){switch(this.peekChar(0)){case "^":case "$":return  true;case "\\":switch(this.peekChar(1)){case "b":case "B":return  true;default:return  false}case "(":return this.peekChar(1)==="?"&&(this.peekChar(2)==="="||this.peekChar(2)==="!");default:return  false}}isQuantifier(){let e=this.saveState();try{return this.quantifier(!0)!==void 0}catch{return  false}finally{this.restoreState(e);}}isPatternCharacter(){switch(this.peekChar()){case "^":case "$":case "\\":case ".":case "*":case "+":case "?":case "(":case ")":case "[":case "|":case "/":case `
`:case "\r":case "\u2028":case "\u2029":return  false;default:return  true}}parseHexDigits(e){let r="";for(let o=0;o<e;o++){let i=this.popChar();if(CT.test(i)===false)throw Error("Expecting a HexDecimal digits");r+=i;}return {type:"Character",value:parseInt(r,16)}}peekChar(e=0){return this.input[this.idx+e]}popChar(){let e=this.peekChar(0);return this.consumeChar(void 0),e}consumeChar(e){if(e!==void 0&&this.input[this.idx]!==e)throw Error("Expected: '"+e+"' but found: '"+this.input[this.idx]+"' at offset: "+this.idx);if(this.idx>=this.input.length)throw Error("Unexpected end of input");this.idx++;}loc(e){return {begin:e,end:this.idx}}};var Lt=class{visitChildren(e){for(let r in e){let n=e[r];e.hasOwnProperty(r)&&(n.type!==void 0?this.visit(n):Array.isArray(n)&&n.forEach(o=>{this.visit(o);},this));}}visit(e){switch(e.type){case "Pattern":this.visitPattern(e);break;case "Flags":this.visitFlags(e);break;case "Disjunction":this.visitDisjunction(e);break;case "Alternative":this.visitAlternative(e);break;case "StartAnchor":this.visitStartAnchor(e);break;case "EndAnchor":this.visitEndAnchor(e);break;case "WordBoundary":this.visitWordBoundary(e);break;case "NonWordBoundary":this.visitNonWordBoundary(e);break;case "Lookahead":this.visitLookahead(e);break;case "NegativeLookahead":this.visitNegativeLookahead(e);break;case "Character":this.visitCharacter(e);break;case "Set":this.visitSet(e);break;case "Group":this.visitGroup(e);break;case "GroupBackReference":this.visitGroupBackReference(e);break;case "Quantifier":this.visitQuantifier(e);break}this.visitChildren(e);}visitPattern(e){}visitFlags(e){}visitDisjunction(e){}visitAlternative(e){}visitStartAnchor(e){}visitEndAnchor(e){}visitWordBoundary(e){}visitNonWordBoundary(e){}visitLookahead(e){}visitNegativeLookahead(e){}visitCharacter(e){}visitSet(e){}visitGroup(e){}visitGroupBackReference(e){}visitQuantifier(e){}};var uo={},LT=new Yr;function yr(t){let e=t.toString();if(uo.hasOwnProperty(e))return uo[e];{let r=LT.pattern(e);return uo[e]=r,r}}function pc(){uo={};}var hc="Complement Sets are not supported for first char optimization",qr=`Unable to use "first char" lexer optimizations:
`;function dc(t,e=false){try{let r=yr(t);return Ei(r.value,{},r.flags.ignoreCase)}catch(r){if(r.message===hc)e&&$r(`${qr}	Unable to optimize: < ${t.toString()} >
	Complement Sets cannot be automatically optimized.
	This will disable the lexer's first char optimizations.
	See: https://chevrotain.io/docs/guide/resolving_lexer_errors.html#COMPLEMENT for details.`);else {let n="";e&&(n=`
	This will disable the lexer's first char optimizations.
	See: https://chevrotain.io/docs/guide/resolving_lexer_errors.html#REGEXP_PARSING for details.`),Er(`${qr}
	Failed parsing: < ${t.toString()} >
	Using the @chevrotain/regexp-to-ast library
	Please open an issue at: https://github.com/chevrotain/chevrotain/issues`+n);}}return []}function Ei(t,e,r){switch(t.type){case "Disjunction":for(let o=0;o<t.value.length;o++)Ei(t.value[o],e,r);break;case "Alternative":let n=t.value;for(let o=0;o<n.length;o++){let i=n[o];switch(i.type){case "EndAnchor":case "GroupBackReference":case "Lookahead":case "NegativeLookahead":case "StartAnchor":case "WordBoundary":case "NonWordBoundary":continue}let a=i;switch(a.type){case "Character":fo(a.value,e,r);break;case "Set":if(a.complement===true)throw Error(hc);x(a.value,l=>{if(typeof l=="number")fo(l,e,r);else {let c=l;if(r===true)for(let u=c.from;u<=c.to;u++)fo(u,e,r);else {for(let u=c.from;u<=c.to&&u<Sr;u++)fo(u,e,r);if(c.to>=Sr){let u=c.from>=Sr?c.from:Sr,f=c.to,p=qe(u),T=qe(f);for(let y=p;y<=T;y++)e[y]=y;}}}});break;case "Group":Ei(a.value,e,r);break;default:throw Error("Non Exhaustive Match")}let s=a.quantifier!==void 0&&a.quantifier.atLeast===0;if(a.type==="Group"&&Ai(a)===false||a.type!=="Group"&&s===false)break}break;default:throw Error("non exhaustive match!")}return P(e)}function fo(t,e,r){let n=qe(t);e[n]=n,r===true&&vT(t,e);}function vT(t,e){let r=String.fromCharCode(t),n=r.toUpperCase();if(n!==r){let o=qe(n.charCodeAt(0));e[o]=o;}else {let o=r.toLowerCase();if(o!==r){let i=qe(o.charCodeAt(0));e[i]=i;}}}function mc(t,e){return Ye(t.value,r=>{if(typeof r=="number")return K(e,r);{let n=r;return Ye(e,o=>n.from<=o&&o<=n.to)!==void 0}})}function Ai(t){let e=t.quantifier;return e&&e.atLeast===0?true:t.value?I(t.value)?ue(t.value,Ai):Ai(t.value):false}var Ii=class extends Lt{constructor(e){super(),this.targetCharCodes=e,this.found=false;}visitChildren(e){if(this.found!==true){switch(e.type){case "Lookahead":this.visitLookahead(e);return;case "NegativeLookahead":this.visitNegativeLookahead(e);return}super.visitChildren(e);}}visitCharacter(e){K(this.targetCharCodes,e.value)&&(this.found=true);}visitSet(e){e.complement?mc(e,this.targetCharCodes)===void 0&&(this.found=true):mc(e,this.targetCharCodes)!==void 0&&(this.found=true);}};function po(t,e){if(e instanceof RegExp){let r=yr(e),n=new Ii(t);return n.visit(r),n.found}else return Ye(e,r=>K(t,r.charCodeAt(0)))!==void 0}var Kt="PATTERN",Rr="defaultMode",mo="modes",Si=typeof new RegExp("(?:)").sticky=="boolean";function Tc(t,e){e=xr(e,{useSticky:Si,debug:false,safeMode:false,positionTracking:"full",lineTerminatorCharacters:["\r",`
`],tracer:(g,m)=>m()});let r=e.tracer;r("initCharCodeToOptimizedIndexMap",()=>{YT();});let n;r("Reject Lexer.NA",()=>{n=bt(t,g=>g[Kt]===L.NA);});let o=false,i;r("Transform Patterns",()=>{o=false,i=d(n,g=>{let m=g[Kt];if(Pe(m)){let N=m.source;return N.length===1&&N!=="^"&&N!=="$"&&N!=="."&&!m.ignoreCase?N:N.length===2&&N[0]==="\\"&&!K(["d","D","s","S","t","r","n","t","0","c","b","B","f","v","w","W"],N[1])?N[1]:e.useSticky?xc(m):gc(m)}else {if(he(m))return o=true,{exec:m};if(typeof m=="object")return o=true,m;if(typeof m=="string"){if(m.length===1)return m;{let N=m.replace(/[\\^$.*+?()[\]{}|]/g,"\\$&"),_=new RegExp(N);return e.useSticky?xc(_):gc(_)}}else throw Error("non exhaustive match")}});});let a,s,l,c,u;r("misc mapping",()=>{a=d(n,g=>g.tokenTypeIdx),s=d(n,g=>{let m=g.GROUP;if(m!==L.SKIPPED){if(ne(m))return m;if(pe(m))return  false;throw Error("non exhaustive match")}}),l=d(n,g=>{let m=g.LONGER_ALT;if(m)return I(m)?d(m,_=>io(n,_)):[io(n,m)]}),c=d(n,g=>g.PUSH_MODE),u=d(n,g=>E(g,"POP_MODE"));});let f;r("Line Terminator Handling",()=>{let g=Nc(e.lineTerminatorCharacters);f=d(n,m=>false),e.positionTracking!=="onlyOffset"&&(f=d(n,m=>E(m,"LINE_BREAKS")?!!m.LINE_BREAKS:Oc(m,g)===false&&po(g,m.PATTERN)));});let p,T,y,S;r("Misc Mapping #2",()=>{p=d(n,Sc),T=d(i,zT),y=te(n,(g,m)=>{let N=m.GROUP;return ne(N)&&N!==L.SKIPPED&&(g[N]=[]),g},{}),S=d(i,(g,m)=>({pattern:i[m],longerAlt:l[m],canLineTerminator:f[m],isCustom:p[m],short:T[m],group:s[m],push:c[m],pop:u[m],tokenTypeIdx:a[m],tokenType:n[m]}));});let O=true,A=[];return e.safeMode||r("First Char Optimization",()=>{A=te(n,(g,m,N)=>{if(typeof m.PATTERN=="string"){let _=m.PATTERN.charCodeAt(0),_e=qe(_);yi(g,_e,S[N]);}else if(I(m.START_CHARS_HINT)){let _;x(m.START_CHARS_HINT,_e=>{let ni=typeof _e=="string"?_e.charCodeAt(0):_e,Be=qe(ni);_!==Be&&(_=Be,yi(g,Be,S[N]));});}else if(Pe(m.PATTERN))if(m.PATTERN.unicode)O=false,e.ensureOptimizations&&Er(`${qr}	Unable to analyze < ${m.PATTERN.toString()} > pattern.
	The regexp unicode flag is not currently supported by the regexp-to-ast library.
	This will disable the lexer's first char optimizations.
	For details See: https://chevrotain.io/docs/guide/resolving_lexer_errors.html#UNICODE_OPTIMIZE`);else {let _=dc(m.PATTERN,e.ensureOptimizations);C(_)&&(O=false),x(_,_e=>{yi(g,_e,S[N]);});}else e.ensureOptimizations&&Er(`${qr}	TokenType: <${m.name}> is using a custom token pattern without providing <start_chars_hint> parameter.
	This will disable the lexer's first char optimizations.
	For details See: https://chevrotain.io/docs/guide/resolving_lexer_errors.html#CUSTOM_OPTIMIZE`),O=false;return g},[]);}),{emptyGroups:y,patternIdxToConfig:S,charCodeToPatternIdxToConfig:A,hasCustom:o,canBeOptimized:O}}function Ec(t,e){let r=[],n=PT(t);r=r.concat(n.errors);let o=MT(n.valid),i=o.valid;return r=r.concat(o.errors),r=r.concat(kT(i)),r=r.concat(WT(i)),r=r.concat($T(i,e)),r=r.concat(VT(i)),r}function kT(t){let e=[],r=fe(t,n=>Pe(n[Kt]));return e=e.concat(FT(r)),e=e.concat(BT(r)),e=e.concat(GT(r)),e=e.concat(KT(r)),e=e.concat(UT(r)),e}function PT(t){let e=fe(t,o=>!E(o,Kt)),r=d(e,o=>({message:"Token Type: ->"+o.name+"<- missing static 'PATTERN' property",type:W.MISSING_PATTERN,tokenTypes:[o]})),n=Ct(t,e);return {errors:r,valid:n}}function MT(t){let e=fe(t,o=>{let i=o[Kt];return !Pe(i)&&!he(i)&&!E(i,"exec")&&!ne(i)}),r=d(e,o=>({message:"Token Type: ->"+o.name+"<- static 'PATTERN' can only be a RegExp, a Function matching the {CustomPatternMatcherFunc} type or an Object matching the {ICustomPattern} interface.",type:W.INVALID_PATTERN,tokenTypes:[o]})),n=Ct(t,e);return {errors:r,valid:n}}var wT=/[^\\][$]/;function FT(t){class e extends Lt{constructor(){super(...arguments),this.found=false;}visitEndAnchor(i){this.found=true;}}let r=fe(t,o=>{let i=o.PATTERN;try{let a=yr(i),s=new e;return s.visit(a),s.found}catch{return wT.test(i.source)}});return d(r,o=>({message:`Unexpected RegExp Anchor Error:
	Token Type: ->`+o.name+`<- static 'PATTERN' cannot contain end of input anchor '$'
	See chevrotain.io/docs/guide/resolving_lexer_errors.html#ANCHORS	for details.`,type:W.EOI_ANCHOR_FOUND,tokenTypes:[o]}))}function UT(t){let e=fe(t,n=>n.PATTERN.test(""));return d(e,n=>({message:"Token Type: ->"+n.name+"<- static 'PATTERN' must not match an empty string",type:W.EMPTY_MATCH_PATTERN,tokenTypes:[n]}))}var DT=/[^\\[][\^]|^\^/;function BT(t){class e extends Lt{constructor(){super(...arguments),this.found=false;}visitStartAnchor(i){this.found=true;}}let r=fe(t,o=>{let i=o.PATTERN;try{let a=yr(i),s=new e;return s.visit(a),s.found}catch{return DT.test(i.source)}});return d(r,o=>({message:`Unexpected RegExp Anchor Error:
	Token Type: ->`+o.name+`<- static 'PATTERN' cannot contain start of input anchor '^'
	See https://chevrotain.io/docs/guide/resolving_lexer_errors.html#ANCHORS	for details.`,type:W.SOI_ANCHOR_FOUND,tokenTypes:[o]}))}function GT(t){let e=fe(t,n=>{let o=n[Kt];return o instanceof RegExp&&(o.multiline||o.global)});return d(e,n=>({message:"Token Type: ->"+n.name+"<- static 'PATTERN' may NOT contain global('g') or multiline('m')",type:W.UNSUPPORTED_FLAGS_FOUND,tokenTypes:[n]}))}function KT(t){let e=[],r=d(t,i=>te(t,(a,s)=>(i.PATTERN.source===s.PATTERN.source&&!K(e,s)&&s.PATTERN!==L.NA&&(e.push(s),a.push(s)),a),[]));r=ze(r);let n=fe(r,i=>i.length>1);return d(n,i=>{let a=d(i,l=>l.name);return {message:`The same RegExp pattern ->${se(i).PATTERN}<-has been used in all of the following Token Types: ${a.join(", ")} <-`,type:W.DUPLICATE_PATTERNS_FOUND,tokenTypes:i}})}function WT(t){let e=fe(t,n=>{if(!E(n,"GROUP"))return  false;let o=n.GROUP;return o!==L.SKIPPED&&o!==L.NA&&!ne(o)});return d(e,n=>({message:"Token Type: ->"+n.name+"<- static 'GROUP' can only be Lexer.SKIPPED/Lexer.NA/A String",type:W.INVALID_GROUP_TYPE_FOUND,tokenTypes:[n]}))}function $T(t,e){let r=fe(t,o=>o.PUSH_MODE!==void 0&&!K(e,o.PUSH_MODE));return d(r,o=>({message:`Token Type: ->${o.name}<- static 'PUSH_MODE' value cannot refer to a Lexer Mode ->${o.PUSH_MODE}<-which does not exist`,type:W.PUSH_MODE_DOES_NOT_EXIST,tokenTypes:[o]}))}function VT(t){let e=[],r=te(t,(n,o,i)=>{let a=o.PATTERN;return a===L.NA||(ne(a)?n.push({str:a,idx:i,tokenType:o}):Pe(a)&&HT(a)&&n.push({str:a.source,idx:i,tokenType:o})),n},[]);return x(t,(n,o)=>{x(r,({str:i,idx:a,tokenType:s})=>{if(o<a&&jT(i,n.PATTERN)){let l=`Token: ->${s.name}<- can never be matched.
Because it appears AFTER the Token Type ->${n.name}<-in the lexer's definition.
See https://chevrotain.io/docs/guide/resolving_lexer_errors.html#UNREACHABLE`;e.push({message:l,type:W.UNREACHABLE_PATTERN,tokenTypes:[n,s]});}});}),e}function jT(t,e){if(Pe(e)){let r=e.exec(t);return r!==null&&r.index===0}else {if(he(e))return e(t,0,[],{});if(E(e,"exec"))return e.exec(t,0,[],{});if(typeof e=="string")return e===t;throw Error("non exhaustive match")}}function HT(t){return Ye([".","\\","[","]","|","^","$","(",")","?","*","+","{"],r=>t.source.indexOf(r)!==-1)===void 0}function gc(t){let e=t.ignoreCase?"i":"";return new RegExp(`^(?:${t.source})`,e)}function xc(t){let e=t.ignoreCase?"iy":"y";return new RegExp(`${t.source}`,e)}function Ac(t,e,r){let n=[];return E(t,Rr)||n.push({message:"A MultiMode Lexer cannot be initialized without a <"+Rr+`> property in its definition
`,type:W.MULTI_MODE_LEXER_WITHOUT_DEFAULT_MODE}),E(t,mo)||n.push({message:"A MultiMode Lexer cannot be initialized without a <"+mo+`> property in its definition
`,type:W.MULTI_MODE_LEXER_WITHOUT_MODES_PROPERTY}),E(t,mo)&&E(t,Rr)&&!E(t.modes,t.defaultMode)&&n.push({message:`A MultiMode Lexer cannot be initialized with a ${Rr}: <${t.defaultMode}>which does not exist
`,type:W.MULTI_MODE_LEXER_DEFAULT_MODE_VALUE_DOES_NOT_EXIST}),E(t,mo)&&x(t.modes,(o,i)=>{x(o,(a,s)=>{if(pe(a))n.push({message:`A Lexer cannot be initialized using an undefined Token Type. Mode:<${i}> at index: <${s}>
`,type:W.LEXER_DEFINITION_CANNOT_CONTAIN_UNDEFINED});else if(E(a,"LONGER_ALT")){let l=I(a.LONGER_ALT)?a.LONGER_ALT:[a.LONGER_ALT];x(l,c=>{!pe(c)&&!K(o,c)&&n.push({message:`A MultiMode Lexer cannot be initialized with a longer_alt <${c.name}> on token <${a.name}> outside of mode <${i}>
`,type:W.MULTI_MODE_LEXER_LONGER_ALT_NOT_IN_CURRENT_MODE});});}});}),n}function Ic(t,e,r){let n=[],o=false,i=ze(re(P(t.modes))),a=bt(i,l=>l[Kt]===L.NA),s=Nc(r);return e&&x(a,l=>{let c=Oc(l,s);if(c!==false){let f={message:XT(l,c),type:c.issue,tokenType:l};n.push(f);}else E(l,"LINE_BREAKS")?l.LINE_BREAKS===true&&(o=true):po(s,l.PATTERN)&&(o=true);}),e&&!o&&n.push({message:`Warning: No LINE_BREAKS Found.
	This Lexer has been defined to track line and column information,
	But none of the Token Types can be identified as matching a line terminator.
	See https://chevrotain.io/docs/guide/resolving_lexer_errors.html#LINE_BREAKS 
	for details.`,type:W.NO_LINE_BREAKS_FLAGS}),n}function yc(t){let e={},r=M(t);return x(r,n=>{let o=t[n];if(I(o))e[n]=[];else throw Error("non exhaustive match")}),e}function Sc(t){let e=t.PATTERN;if(Pe(e))return  false;if(he(e))return  true;if(E(e,"exec"))return  true;if(ne(e))return  false;throw Error("non exhaustive match")}function zT(t){return ne(t)&&t.length===1?t.charCodeAt(0):false}var Rc={test:function(t){let e=t.length;for(let r=this.lastIndex;r<e;r++){let n=t.charCodeAt(r);if(n===10)return this.lastIndex=r+1,true;if(n===13)return t.charCodeAt(r+1)===10?this.lastIndex=r+2:this.lastIndex=r+1,true}return  false},lastIndex:0};function Oc(t,e){if(E(t,"LINE_BREAKS"))return  false;if(Pe(t.PATTERN)){try{po(e,t.PATTERN);}catch(r){return {issue:W.IDENTIFY_TERMINATOR,errMsg:r.message}}return  false}else {if(ne(t.PATTERN))return  false;if(Sc(t))return {issue:W.CUSTOM_LINE_BREAK};throw Error("non exhaustive match")}}function XT(t,e){if(e.issue===W.IDENTIFY_TERMINATOR)return `Warning: unable to identify line terminator usage in pattern.
	The problem is in the <${t.name}> Token Type
	 Root cause: ${e.errMsg}.
	For details See: https://chevrotain.io/docs/guide/resolving_lexer_errors.html#IDENTIFY_TERMINATOR`;if(e.issue===W.CUSTOM_LINE_BREAK)return `Warning: A Custom Token Pattern should specify the <line_breaks> option.
	The problem is in the <${t.name}> Token Type
	For details See: https://chevrotain.io/docs/guide/resolving_lexer_errors.html#CUSTOM_LINE_BREAK`;throw Error("non exhaustive match")}function Nc(t){return d(t,r=>ne(r)?r.charCodeAt(0):r)}function yi(t,e,r){t[e]===void 0?t[e]=[r]:t[e].push(r);}var Sr=256,ho=[];function qe(t){return t<Sr?t:ho[t]}function YT(){if(C(ho)){ho=new Array(65536);for(let t=0;t<65536;t++)ho[t]=t>255?255+~~(t/255):t;}}function ct(t,e){let r=t.tokenTypeIdx;return r===e.tokenTypeIdx?true:e.isParent===true&&e.categoryMatchesMap[r]===true}function Or(t,e){return t.tokenTypeIdx===e.tokenTypeIdx}var _c=1,bc={};function ut(t){let e=qT(t);QT(e),JT(e),ZT(e),x(e,r=>{r.isParent=r.categoryMatches.length>0;});}function qT(t){let e=F(t),r=t,n=true;for(;n;){r=ze(re(d(r,i=>i.CATEGORIES)));let o=Ct(r,e);e=e.concat(o),C(o)?n=false:r=o;}return e}function QT(t){x(t,e=>{Ri(e)||(bc[_c]=e,e.tokenTypeIdx=_c++),Cc(e)&&!I(e.CATEGORIES)&&(e.CATEGORIES=[e.CATEGORIES]),Cc(e)||(e.CATEGORIES=[]),eE(e)||(e.categoryMatches=[]),tE(e)||(e.categoryMatchesMap={});});}function ZT(t){x(t,e=>{e.categoryMatches=[],x(e.categoryMatchesMap,(r,n)=>{e.categoryMatches.push(bc[n].tokenTypeIdx);});});}function JT(t){x(t,e=>{Lc([],e);});}function Lc(t,e){x(t,r=>{e.categoryMatchesMap[r.tokenTypeIdx]=true;}),x(e.CATEGORIES,r=>{let n=t.concat(e);K(n,r)||Lc(n,r);});}function Ri(t){return E(t,"tokenTypeIdx")}function Cc(t){return E(t,"CATEGORIES")}function eE(t){return E(t,"categoryMatches")}function tE(t){return E(t,"categoryMatchesMap")}function vc(t){return E(t,"tokenTypeIdx")}var Oi={buildUnableToPopLexerModeMessage(t){return `Unable to pop Lexer Mode after encountering Token ->${t.image}<- The Mode Stack is empty`},buildUnexpectedCharactersMessage(t,e,r,n,o){return `unexpected character: ->${t.charAt(e)}<- at offset: ${e}, skipped ${r} characters.`}};var W;(function(t){t[t.MISSING_PATTERN=0]="MISSING_PATTERN",t[t.INVALID_PATTERN=1]="INVALID_PATTERN",t[t.EOI_ANCHOR_FOUND=2]="EOI_ANCHOR_FOUND",t[t.UNSUPPORTED_FLAGS_FOUND=3]="UNSUPPORTED_FLAGS_FOUND",t[t.DUPLICATE_PATTERNS_FOUND=4]="DUPLICATE_PATTERNS_FOUND",t[t.INVALID_GROUP_TYPE_FOUND=5]="INVALID_GROUP_TYPE_FOUND",t[t.PUSH_MODE_DOES_NOT_EXIST=6]="PUSH_MODE_DOES_NOT_EXIST",t[t.MULTI_MODE_LEXER_WITHOUT_DEFAULT_MODE=7]="MULTI_MODE_LEXER_WITHOUT_DEFAULT_MODE",t[t.MULTI_MODE_LEXER_WITHOUT_MODES_PROPERTY=8]="MULTI_MODE_LEXER_WITHOUT_MODES_PROPERTY",t[t.MULTI_MODE_LEXER_DEFAULT_MODE_VALUE_DOES_NOT_EXIST=9]="MULTI_MODE_LEXER_DEFAULT_MODE_VALUE_DOES_NOT_EXIST",t[t.LEXER_DEFINITION_CANNOT_CONTAIN_UNDEFINED=10]="LEXER_DEFINITION_CANNOT_CONTAIN_UNDEFINED",t[t.SOI_ANCHOR_FOUND=11]="SOI_ANCHOR_FOUND",t[t.EMPTY_MATCH_PATTERN=12]="EMPTY_MATCH_PATTERN",t[t.NO_LINE_BREAKS_FLAGS=13]="NO_LINE_BREAKS_FLAGS",t[t.UNREACHABLE_PATTERN=14]="UNREACHABLE_PATTERN",t[t.IDENTIFY_TERMINATOR=15]="IDENTIFY_TERMINATOR",t[t.CUSTOM_LINE_BREAK=16]="CUSTOM_LINE_BREAK",t[t.MULTI_MODE_LEXER_LONGER_ALT_NOT_IN_CURRENT_MODE=17]="MULTI_MODE_LEXER_LONGER_ALT_NOT_IN_CURRENT_MODE";})(W||(W={}));var Qr={deferDefinitionErrorsHandling:false,positionTracking:"full",lineTerminatorsPattern:/\n|\r\n?/g,lineTerminatorCharacters:[`
`,"\r"],ensureOptimizations:false,safeMode:false,errorMessageProvider:Oi,traceInitPerf:false,skipValidations:false,recoveryEnabled:true};Object.freeze(Qr);var L=class{constructor(e,r=Qr){if(this.lexerDefinition=e,this.lexerDefinitionErrors=[],this.lexerDefinitionWarning=[],this.patternIdxToConfig={},this.charCodeToPatternIdxToConfig={},this.modes=[],this.emptyGroups={},this.trackStartLines=true,this.trackEndLines=true,this.hasCustom=false,this.canModeBeOptimized={},this.TRACE_INIT=(o,i)=>{if(this.traceInitPerf===true){this.traceInitIndent++;let a=new Array(this.traceInitIndent+1).join("	");this.traceInitIndent<this.traceInitMaxIdent&&console.log(`${a}--> <${o}>`);let{time:s,value:l}=Vr(i),c=s>10?console.warn:console.log;return this.traceInitIndent<this.traceInitMaxIdent&&c(`${a}<-- <${o}> time: ${s}ms`),this.traceInitIndent--,l}else return i()},typeof r=="boolean")throw Error(`The second argument to the Lexer constructor is now an ILexerConfig Object.
a boolean 2nd argument is no longer supported`);this.config=le({},Qr,r);let n=this.config.traceInitPerf;n===true?(this.traceInitMaxIdent=1/0,this.traceInitPerf=true):typeof n=="number"&&(this.traceInitMaxIdent=n,this.traceInitPerf=true),this.traceInitIndent=-1,this.TRACE_INIT("Lexer Constructor",()=>{let o,i=true;this.TRACE_INIT("Lexer Config handling",()=>{if(this.config.lineTerminatorsPattern===Qr.lineTerminatorsPattern)this.config.lineTerminatorsPattern=Rc;else if(this.config.lineTerminatorCharacters===Qr.lineTerminatorCharacters)throw Error(`Error: Missing <lineTerminatorCharacters> property on the Lexer config.
	For details See: https://chevrotain.io/docs/guide/resolving_lexer_errors.html#MISSING_LINE_TERM_CHARS`);if(r.safeMode&&r.ensureOptimizations)throw Error('"safeMode" and "ensureOptimizations" flags are mutually exclusive.');this.trackStartLines=/full|onlyStart/i.test(this.config.positionTracking),this.trackEndLines=/full/i.test(this.config.positionTracking),I(e)?o={modes:{defaultMode:F(e)},defaultMode:Rr}:(i=false,o=F(e));}),this.config.skipValidations===false&&(this.TRACE_INIT("performRuntimeChecks",()=>{this.lexerDefinitionErrors=this.lexerDefinitionErrors.concat(Ac(o,this.trackStartLines,this.config.lineTerminatorCharacters));}),this.TRACE_INIT("performWarningRuntimeChecks",()=>{this.lexerDefinitionWarning=this.lexerDefinitionWarning.concat(Ic(o,this.trackStartLines,this.config.lineTerminatorCharacters));})),o.modes=o.modes?o.modes:{},x(o.modes,(s,l)=>{o.modes[l]=bt(s,c=>pe(c));});let a=M(o.modes);if(x(o.modes,(s,l)=>{this.TRACE_INIT(`Mode: <${l}> processing`,()=>{if(this.modes.push(l),this.config.skipValidations===false&&this.TRACE_INIT("validatePatterns",()=>{this.lexerDefinitionErrors=this.lexerDefinitionErrors.concat(Ec(s,a));}),C(this.lexerDefinitionErrors)){ut(s);let c;this.TRACE_INIT("analyzeTokenTypes",()=>{c=Tc(s,{lineTerminatorCharacters:this.config.lineTerminatorCharacters,positionTracking:r.positionTracking,ensureOptimizations:r.ensureOptimizations,safeMode:r.safeMode,tracer:this.TRACE_INIT});}),this.patternIdxToConfig[l]=c.patternIdxToConfig,this.charCodeToPatternIdxToConfig[l]=c.charCodeToPatternIdxToConfig,this.emptyGroups=le({},this.emptyGroups,c.emptyGroups),this.hasCustom=c.hasCustom||this.hasCustom,this.canModeBeOptimized[l]=c.canBeOptimized;}});}),this.defaultMode=o.defaultMode,!C(this.lexerDefinitionErrors)&&!this.config.deferDefinitionErrorsHandling){let l=d(this.lexerDefinitionErrors,c=>c.message).join(`-----------------------
`);throw new Error(`Errors detected in definition of Lexer:
`+l)}x(this.lexerDefinitionWarning,s=>{$r(s.message);}),this.TRACE_INIT("Choosing sub-methods implementations",()=>{if(Si?(this.chopInput=ve,this.match=this.matchWithTest):(this.updateLastIndex=V,this.match=this.matchWithExec),i&&(this.handleModes=V),this.trackStartLines===false&&(this.computeNewColumn=ve),this.trackEndLines===false&&(this.updateTokenEndLineColumnLocation=V),/full/i.test(this.config.positionTracking))this.createTokenInstance=this.createFullToken;else if(/onlyStart/i.test(this.config.positionTracking))this.createTokenInstance=this.createStartOnlyToken;else if(/onlyOffset/i.test(this.config.positionTracking))this.createTokenInstance=this.createOffsetOnlyToken;else throw Error(`Invalid <positionTracking> config option: "${this.config.positionTracking}"`);this.hasCustom?(this.addToken=this.addTokenUsingPush,this.handlePayload=this.handlePayloadWithCustom):(this.addToken=this.addTokenUsingMemberAccess,this.handlePayload=this.handlePayloadNoCustom);}),this.TRACE_INIT("Failed Optimization Warnings",()=>{let s=te(this.canModeBeOptimized,(l,c,u)=>(c===false&&l.push(u),l),[]);if(r.ensureOptimizations&&!C(s))throw Error(`Lexer Modes: < ${s.join(", ")} > cannot be optimized.
	 Disable the "ensureOptimizations" lexer config flag to silently ignore this and run the lexer in an un-optimized mode.
	 Or inspect the console log for details on how to resolve these issues.`)}),this.TRACE_INIT("clearRegExpParserCache",()=>{pc();}),this.TRACE_INIT("toFastProperties",()=>{jr(this);});});}tokenize(e,r=this.defaultMode){if(!C(this.lexerDefinitionErrors)){let o=d(this.lexerDefinitionErrors,i=>i.message).join(`-----------------------
`);throw new Error(`Unable to Tokenize because Errors detected in definition of Lexer:
`+o)}return this.tokenizeInternal(e,r)}tokenizeInternal(e,r){let n,o,i,a,s,l,c,u,f,p,T,y,S,A,g,m=e,N=m.length,_=0,_e=0,ni=this.hasCustom?0:Math.floor(e.length/10),Be=new Array(ni),oi=[],wr=this.trackStartLines?1:void 0,pt=this.trackStartLines?1:void 0,Fr=yc(this.emptyGroups),Bu=this.trackStartLines,ii=this.config.lineTerminatorsPattern,bn=0,mt=[],Ur=[],Ln=[],ma=[];Object.freeze(ma);let Dr;function ha(){return mt}function da(ce){let Le=qe(ce),Yt=Ur[Le];return Yt===void 0?ma:Yt}let Gu=ce=>{if(Ln.length===1&&ce.tokenType.PUSH_MODE===void 0){let Le=this.config.errorMessageProvider.buildUnableToPopLexerModeMessage(ce);oi.push({offset:ce.startOffset,line:ce.startLine,column:ce.startColumn,length:ce.image.length,message:Le});}else {Ln.pop();let Le=Xe(Ln);mt=this.patternIdxToConfig[Le],Ur=this.charCodeToPatternIdxToConfig[Le],bn=mt.length;let Yt=this.canModeBeOptimized[Le]&&this.config.safeMode===false;Ur&&Yt?Dr=da:Dr=ha;}};function ga(ce){Ln.push(ce),Ur=this.charCodeToPatternIdxToConfig[ce],mt=this.patternIdxToConfig[ce],bn=mt.length,bn=mt.length;let Le=this.canModeBeOptimized[ce]&&this.config.safeMode===false;Ur&&Le?Dr=da:Dr=ha;}ga.call(this,r);let we,xa=this.config.recoveryEnabled;for(;_<N;){l=null;let ce=m.charCodeAt(_),Le=Dr(ce),Yt=Le.length;for(n=0;n<Yt;n++){we=Le[n];let Ce=we.pattern;c=null;let rt=we.short;if(rt!==false?ce===rt&&(l=Ce):we.isCustom===true?(g=Ce.exec(m,_,Be,Fr),g!==null?(l=g[0],g.payload!==void 0&&(c=g.payload)):l=null):(this.updateLastIndex(Ce,_),l=this.match(Ce,e,_)),l!==null){if(s=we.longerAlt,s!==void 0){let ht=s.length;for(i=0;i<ht;i++){let nt=mt[s[i]],wt=nt.pattern;if(u=null,nt.isCustom===true?(g=wt.exec(m,_,Be,Fr),g!==null?(a=g[0],g.payload!==void 0&&(u=g.payload)):a=null):(this.updateLastIndex(wt,_),a=this.match(wt,e,_)),a&&a.length>l.length){l=a,c=u,we=nt;break}}}break}}if(l!==null){if(f=l.length,p=we.group,p!==void 0&&(T=we.tokenTypeIdx,y=this.createTokenInstance(l,_,T,we.tokenType,wr,pt,f),this.handlePayload(y,c),p===false?_e=this.addToken(Be,_e,y):Fr[p].push(y)),e=this.chopInput(e,f),_=_+f,pt=this.computeNewColumn(pt,f),Bu===true&&we.canLineTerminator===true){let Ce=0,rt,ht;ii.lastIndex=0;do rt=ii.test(l),rt===true&&(ht=ii.lastIndex-1,Ce++);while(rt===true);Ce!==0&&(wr=wr+Ce,pt=f-ht,this.updateTokenEndLineColumnLocation(y,p,ht,Ce,wr,pt,f));}this.handleModes(we,Gu,ga,y);}else {let Ce=_,rt=wr,ht=pt,nt=xa===false;for(;nt===false&&_<N;)for(e=this.chopInput(e,1),_++,o=0;o<bn;o++){let wt=mt[o],ai=wt.pattern,Ta=wt.short;if(Ta!==false?m.charCodeAt(_)===Ta&&(nt=true):wt.isCustom===true?nt=ai.exec(m,_,Be,Fr)!==null:(this.updateLastIndex(ai,_),nt=ai.exec(e)!==null),nt===true)break}if(S=_-Ce,pt=this.computeNewColumn(pt,S),A=this.config.errorMessageProvider.buildUnexpectedCharactersMessage(m,Ce,S,rt,ht),oi.push({offset:Ce,line:rt,column:ht,length:S,message:A}),xa===false)break}}return this.hasCustom||(Be.length=_e),{tokens:Be,groups:Fr,errors:oi}}handleModes(e,r,n,o){if(e.pop===true){let i=e.push;r(o),i!==void 0&&n.call(this,i);}else e.push!==void 0&&n.call(this,e.push);}chopInput(e,r){return e.substring(r)}updateLastIndex(e,r){e.lastIndex=r;}updateTokenEndLineColumnLocation(e,r,n,o,i,a,s){let l,c;r!==void 0&&(l=n===s-1,c=l?-1:0,o===1&&l===true||(e.endLine=i+c,e.endColumn=a-1+-c));}computeNewColumn(e,r){return e+r}createOffsetOnlyToken(e,r,n,o){return {image:e,startOffset:r,tokenTypeIdx:n,tokenType:o}}createStartOnlyToken(e,r,n,o,i,a){return {image:e,startOffset:r,startLine:i,startColumn:a,tokenTypeIdx:n,tokenType:o}}createFullToken(e,r,n,o,i,a,s){return {image:e,startOffset:r,endOffset:r+s-1,startLine:i,endLine:i,startColumn:a,endColumn:a+s-1,tokenTypeIdx:n,tokenType:o}}addTokenUsingPush(e,r,n){return e.push(n),r}addTokenUsingMemberAccess(e,r,n){return e[r]=n,r++,r}handlePayloadNoCustom(e,r){}handlePayloadWithCustom(e,r){r!==null&&(e.payload=r);}matchWithTest(e,r,n){return e.test(r)===true?r.substring(n,e.lastIndex):null}matchWithExec(e,r){let n=e.exec(r);return n!==null?n[0]:null}};L.SKIPPED="This marks a skipped Token pattern, this means each token identified by it willbe consumed and then thrown into oblivion, this can be used to for example to completely ignore whitespace.";L.NA=/NOT_APPLICABLE/;function Wt(t){return Ni(t)?t.LABEL:t.name}function Ni(t){return ne(t.LABEL)&&t.LABEL!==""}var rE="parent",kc="categories",Pc="label",Mc="group",wc="push_mode",Fc="pop_mode",Uc="longer_alt",Dc="line_breaks",Bc="start_chars_hint";function h(t){return nE(t)}function nE(t){let e=t.pattern,r={};if(r.name=t.name,pe(e)||(r.PATTERN=e),E(t,rE))throw `The parent property is no longer supported.
See: https://github.com/chevrotain/chevrotain/issues/564#issuecomment-349062346 for details.`;return E(t,kc)&&(r.CATEGORIES=t[kc]),ut([r]),E(t,Pc)&&(r.LABEL=t[Pc]),E(t,Mc)&&(r.GROUP=t[Mc]),E(t,Fc)&&(r.POP_MODE=t[Fc]),E(t,wc)&&(r.PUSH_MODE=t[wc]),E(t,Uc)&&(r.LONGER_ALT=t[Uc]),E(t,Dc)&&(r.LINE_BREAKS=t[Dc]),E(t,Bc)&&(r.START_CHARS_HINT=t[Bc]),r}var Ue=h({name:"EOF",pattern:L.NA});ut([Ue]);function $t(t,e,r,n,o,i,a,s){return {image:e,startOffset:r,endOffset:n,startLine:o,endLine:i,startColumn:a,endColumn:s,tokenTypeIdx:t.tokenTypeIdx,tokenType:t}}function _i(t,e){return ct(t,e)}var go={buildMismatchTokenMessage({expected:t,actual:e,previous:r,ruleName:n}){return `Expecting ${Ni(t)?`--> ${Wt(t)} <--`:`token of type --> ${t.name} <--`} but found --> '${e.image}' <--`},buildNotAllInputParsedMessage({firstRedundant:t,ruleName:e}){return "Redundant input, expecting EOF but found: "+t.image},buildNoViableAltMessage({expectedPathsPerAlt:t,actual:e,previous:r,customUserDescription:n,ruleName:o}){let i="Expecting: ",s=`
but found: '`+se(e).image+"'";if(n)return i+n+s;{let l=te(t,(p,T)=>p.concat(T),[]),c=d(l,p=>`[${d(p,T=>Wt(T)).join(", ")}]`),f=`one of these possible Token sequences:
${d(c,(p,T)=>`  ${T+1}. ${p}`).join(`
`)}`;return i+f+s}},buildEarlyExitMessage({expectedIterationPaths:t,actual:e,customUserDescription:r,ruleName:n}){let o="Expecting: ",a=`
but found: '`+se(e).image+"'";if(r)return o+r+a;{let l=`expecting at least one iteration which starts with one of these possible Token sequences::
  <${d(t,c=>`[${d(c,u=>Wt(u)).join(",")}]`).join(" ,")}>`;return o+l+a}}};Object.freeze(go);var Gc={buildRuleNotFoundError(t,e){return "Invalid grammar, reference to a rule which is not defined: ->"+e.nonTerminalName+`<-
inside top level rule: ->`+t.name+"<-"}},De={buildDuplicateFoundError(t,e){function r(u){return u instanceof b?u.terminalType.name:u instanceof U?u.nonTerminalName:""}let n=t.name,o=se(e),i=o.idx,a=Re(o),s=r(o),l=i>0,c=`->${a}${l?i:""}<- ${s?`with argument: ->${s}<-`:""}
                  appears more than once (${e.length} times) in the top level rule: ->${n}<-.                  
                  For further details see: https://chevrotain.io/docs/FAQ.html#NUMERICAL_SUFFIXES 
                  `;return c=c.replace(/[ \t]+/g," "),c=c.replace(/\s\s+/g,`
`),c},buildNamespaceConflictError(t){return `Namespace conflict found in grammar.
The grammar has both a Terminal(Token) and a Non-Terminal(Rule) named: <${t.name}>.
To resolve this make sure each Terminal and Non-Terminal names are unique
This is easy to accomplish by using the convention that Terminal names start with an uppercase letter
and Non-Terminal names start with a lower case letter.`},buildAlternationPrefixAmbiguityError(t){let e=d(t.prefixPath,o=>Wt(o)).join(", "),r=t.alternation.idx===0?"":t.alternation.idx;return `Ambiguous alternatives: <${t.ambiguityIndices.join(" ,")}> due to common lookahead prefix
in <OR${r}> inside <${t.topLevelRule.name}> Rule,
<${e}> may appears as a prefix path in all these alternatives.
See: https://chevrotain.io/docs/guide/resolving_grammar_errors.html#COMMON_PREFIX
For Further details.`},buildAlternationAmbiguityError(t){let e=d(t.prefixPath,o=>Wt(o)).join(", "),r=t.alternation.idx===0?"":t.alternation.idx,n=`Ambiguous Alternatives Detected: <${t.ambiguityIndices.join(" ,")}> in <OR${r}> inside <${t.topLevelRule.name}> Rule,
<${e}> may appears as a prefix path in all these alternatives.
`;return n=n+`See: https://chevrotain.io/docs/guide/resolving_grammar_errors.html#AMBIGUOUS_ALTERNATIVES
For Further details.`,n},buildEmptyRepetitionError(t){let e=Re(t.repetition);return t.repetition.idx!==0&&(e+=t.repetition.idx),`The repetition <${e}> within Rule <${t.topLevelRule.name}> can never consume any tokens.
This could lead to an infinite loop.`},buildTokenNameError(t){return "deprecated"},buildEmptyAlternationError(t){return `Ambiguous empty alternative: <${t.emptyChoiceIdx+1}> in <OR${t.alternation.idx}> inside <${t.topLevelRule.name}> Rule.
Only the last alternative may be an empty alternative.`},buildTooManyAlternativesError(t){return `An Alternation cannot have more than 256 alternatives:
<OR${t.alternation.idx}> inside <${t.topLevelRule.name}> Rule.
 has ${t.alternation.definition.length+1} alternatives.`},buildLeftRecursionError(t){let e=t.topLevelRule.name,r=d(t.leftRecursionPath,i=>i.name),n=`${e} --> ${r.concat([e]).join(" --> ")}`;return `Left Recursion found in grammar.
rule: <${e}> can be invoked from itself (directly or indirectly)
without consuming any Tokens. The grammar path that causes this is: 
 ${n}
 To fix this refactor your grammar to remove the left recursion.
see: https://en.wikipedia.org/wiki/LL_parser#Left_factoring.`},buildInvalidRuleNameError(t){return "deprecated"},buildDuplicateRuleNameError(t){let e;return t.topLevelRule instanceof ge?e=t.topLevelRule.name:e=t.topLevelRule,`Duplicate definition, rule: ->${e}<- is already defined in the grammar: ->${t.grammarName}<-`}};function Kc(t,e){let r=new Ci(t,e);return r.resolveRefs(),r.errors}var Ci=class extends xe{constructor(e,r){super(),this.nameToTopRule=e,this.errMsgProvider=r,this.errors=[];}resolveRefs(){x(P(this.nameToTopRule),e=>{this.currTopLevel=e,e.accept(this);});}visitNonTerminal(e){let r=this.nameToTopRule[e.nonTerminalName];if(r)e.referencedRule=r;else {let n=this.errMsgProvider.buildRuleNotFoundError(this.currTopLevel,e);this.errors.push({message:n,type:oe.UNRESOLVED_SUBRULE_REF,ruleName:this.currTopLevel.name,unresolvedRefName:e.nonTerminalName});}}};var bi=class extends lt{constructor(e,r){super(),this.topProd=e,this.path=r,this.possibleTokTypes=[],this.nextProductionName="",this.nextProductionOccurrence=0,this.found=false,this.isAtEndOfPath=false;}startWalking(){if(this.found=false,this.path.ruleStack[0]!==this.topProd.name)throw Error("The path does not start with the walker's top Rule!");return this.ruleStack=F(this.path.ruleStack).reverse(),this.occurrenceStack=F(this.path.occurrenceStack).reverse(),this.ruleStack.pop(),this.occurrenceStack.pop(),this.updateExpectedNext(),this.walk(this.topProd),this.possibleTokTypes}walk(e,r=[]){this.found||super.walk(e,r);}walkProdRef(e,r,n){if(e.referencedRule.name===this.nextProductionName&&e.idx===this.nextProductionOccurrence){let o=r.concat(n);this.updateExpectedNext(),this.walk(e.referencedRule,o);}}updateExpectedNext(){C(this.ruleStack)?(this.nextProductionName="",this.nextProductionOccurrence=0,this.isAtEndOfPath=true):(this.nextProductionName=this.ruleStack.pop(),this.nextProductionOccurrence=this.occurrenceStack.pop());}},xo=class extends bi{constructor(e,r){super(e,r),this.path=r,this.nextTerminalName="",this.nextTerminalOccurrence=0,this.nextTerminalName=this.path.lastTok.name,this.nextTerminalOccurrence=this.path.lastTokOccurrence;}walkTerminal(e,r,n){if(this.isAtEndOfPath&&e.terminalType.name===this.nextTerminalName&&e.idx===this.nextTerminalOccurrence&&!this.found){let o=r.concat(n),i=new D({definition:o});this.possibleTokTypes=Bt(i),this.found=true;}}},Nr=class extends lt{constructor(e,r){super(),this.topRule=e,this.occurrence=r,this.result={token:void 0,occurrence:void 0,isEndOfRule:void 0};}startWalking(){return this.walk(this.topRule),this.result}},To=class extends Nr{walkMany(e,r,n){if(e.idx===this.occurrence){let o=se(r.concat(n));this.result.isEndOfRule=o===void 0,o instanceof b&&(this.result.token=o.terminalType,this.result.occurrence=o.idx);}else super.walkMany(e,r,n);}},Zr=class extends Nr{walkManySep(e,r,n){if(e.idx===this.occurrence){let o=se(r.concat(n));this.result.isEndOfRule=o===void 0,o instanceof b&&(this.result.token=o.terminalType,this.result.occurrence=o.idx);}else super.walkManySep(e,r,n);}},Eo=class extends Nr{walkAtLeastOne(e,r,n){if(e.idx===this.occurrence){let o=se(r.concat(n));this.result.isEndOfRule=o===void 0,o instanceof b&&(this.result.token=o.terminalType,this.result.occurrence=o.idx);}else super.walkAtLeastOne(e,r,n);}},Jr=class extends Nr{walkAtLeastOneSep(e,r,n){if(e.idx===this.occurrence){let o=se(r.concat(n));this.result.isEndOfRule=o===void 0,o instanceof b&&(this.result.token=o.terminalType,this.result.occurrence=o.idx);}else super.walkAtLeastOneSep(e,r,n);}};function Ao(t,e,r=[]){r=F(r);let n=[],o=0;function i(s){return s.concat(Y(t,o+1))}function a(s){let l=Ao(i(s),e,r);return n.concat(l)}for(;r.length<e&&o<t.length;){let s=t[o];if(s instanceof D)return a(s.definition);if(s instanceof U)return a(s.definition);if(s instanceof G)n=a(s.definition);else if(s instanceof q){let l=s.definition.concat([new k({definition:s.definition})]);return a(l)}else if(s instanceof Q){let l=[new D({definition:s.definition}),new k({definition:[new b({terminalType:s.separator})].concat(s.definition)})];return a(l)}else if(s instanceof H){let l=s.definition.concat([new k({definition:[new b({terminalType:s.separator})].concat(s.definition)})]);n=a(l);}else if(s instanceof k){let l=s.definition.concat([new k({definition:s.definition})]);n=a(l);}else {if(s instanceof z)return x(s.definition,l=>{C(l.definition)===false&&(n=a(l.definition));}),n;if(s instanceof b)r.push(s.terminalType);else throw Error("non exhaustive match")}o++;}return n.push({partialPath:r,suffixDef:Y(t,o)}),n}function Io(t,e,r,n){let o="EXIT_NONE_TERMINAL",i=[o],a="EXIT_ALTERNATIVE",s=false,l=e.length,c=l-n-1,u=[],f=[];for(f.push({idx:-1,def:t,ruleStack:[],occurrenceStack:[]});!C(f);){let p=f.pop();if(p===a){s&&Xe(f).idx<=c&&f.pop();continue}let T=p.def,y=p.idx,S=p.ruleStack,O=p.occurrenceStack;if(C(T))continue;let A=T[0];if(A===o){let g={idx:y,def:Y(T),ruleStack:st(S),occurrenceStack:st(O)};f.push(g);}else if(A instanceof b)if(y<l-1){let g=y+1,m=e[g];if(r(m,A.terminalType)){let N={idx:g,def:Y(T),ruleStack:S,occurrenceStack:O};f.push(N);}}else if(y===l-1)u.push({nextTokenType:A.terminalType,nextTokenOccurrence:A.idx,ruleStack:S,occurrenceStack:O}),s=true;else throw Error("non exhaustive match");else if(A instanceof U){let g=F(S);g.push(A.nonTerminalName);let m=F(O);m.push(A.idx);let N={idx:y,def:A.definition.concat(i,Y(T)),ruleStack:g,occurrenceStack:m};f.push(N);}else if(A instanceof G){let g={idx:y,def:Y(T),ruleStack:S,occurrenceStack:O};f.push(g),f.push(a);let m={idx:y,def:A.definition.concat(Y(T)),ruleStack:S,occurrenceStack:O};f.push(m);}else if(A instanceof q){let g=new k({definition:A.definition,idx:A.idx}),m=A.definition.concat([g],Y(T)),N={idx:y,def:m,ruleStack:S,occurrenceStack:O};f.push(N);}else if(A instanceof Q){let g=new b({terminalType:A.separator}),m=new k({definition:[g].concat(A.definition),idx:A.idx}),N=A.definition.concat([m],Y(T)),_={idx:y,def:N,ruleStack:S,occurrenceStack:O};f.push(_);}else if(A instanceof H){let g={idx:y,def:Y(T),ruleStack:S,occurrenceStack:O};f.push(g),f.push(a);let m=new b({terminalType:A.separator}),N=new k({definition:[m].concat(A.definition),idx:A.idx}),_=A.definition.concat([N],Y(T)),_e={idx:y,def:_,ruleStack:S,occurrenceStack:O};f.push(_e);}else if(A instanceof k){let g={idx:y,def:Y(T),ruleStack:S,occurrenceStack:O};f.push(g),f.push(a);let m=new k({definition:A.definition,idx:A.idx}),N=A.definition.concat([m],Y(T)),_={idx:y,def:N,ruleStack:S,occurrenceStack:O};f.push(_);}else if(A instanceof z)for(let g=A.definition.length-1;g>=0;g--){let m=A.definition[g],N={idx:y,def:m.definition.concat(Y(T)),ruleStack:S,occurrenceStack:O};f.push(N),f.push(a);}else if(A instanceof D)f.push({idx:y,def:A.definition.concat(Y(T)),ruleStack:S,occurrenceStack:O});else if(A instanceof ge)f.push(oE(A,y,S,O));else throw Error("non exhaustive match")}return u}function oE(t,e,r,n){let o=F(r);o.push(t.name);let i=F(n);return i.push(1),{idx:e,def:t.definition,ruleStack:o,occurrenceStack:i}}var j;(function(t){t[t.OPTION=0]="OPTION",t[t.REPETITION=1]="REPETITION",t[t.REPETITION_MANDATORY=2]="REPETITION_MANDATORY",t[t.REPETITION_MANDATORY_WITH_SEPARATOR=3]="REPETITION_MANDATORY_WITH_SEPARATOR",t[t.REPETITION_WITH_SEPARATOR=4]="REPETITION_WITH_SEPARATOR",t[t.ALTERNATION=5]="ALTERNATION";})(j||(j={}));function So(t){if(t instanceof G||t==="Option")return j.OPTION;if(t instanceof k||t==="Repetition")return j.REPETITION;if(t instanceof q||t==="RepetitionMandatory")return j.REPETITION_MANDATORY;if(t instanceof Q||t==="RepetitionMandatoryWithSeparator")return j.REPETITION_MANDATORY_WITH_SEPARATOR;if(t instanceof H||t==="RepetitionWithSeparator")return j.REPETITION_WITH_SEPARATOR;if(t instanceof z||t==="Alternation")return j.ALTERNATION;throw Error("non exhaustive match")}function $c(t,e,r,n,o,i){let a=en(t,e,r),s=Yc(a)?Or:ct;return i(a,n,s,o)}function Vc(t,e,r,n,o,i){let a=tn(t,e,o,r),s=Yc(a)?Or:ct;return i(a[0],s,n)}function jc(t,e,r,n){let o=t.length,i=ue(t,a=>ue(a,s=>s.length===1));if(e)return function(a){let s=d(a,l=>l.GATE);for(let l=0;l<o;l++){let c=t[l],u=c.length,f=s[l];if(!(f!==void 0&&f.call(this)===false))e:for(let p=0;p<u;p++){let T=c[p],y=T.length;for(let S=0;S<y;S++){let O=this.LA(S+1);if(r(O,T[S])===false)continue e}return l}}};if(i&&!n){let a=d(t,l=>re(l)),s=te(a,(l,c,u)=>(x(c,f=>{E(l,f.tokenTypeIdx)||(l[f.tokenTypeIdx]=u),x(f.categoryMatches,p=>{E(l,p)||(l[p]=u);});}),l),{});return function(){let l=this.LA(1);return s[l.tokenTypeIdx]}}else return function(){for(let a=0;a<o;a++){let s=t[a],l=s.length;e:for(let c=0;c<l;c++){let u=s[c],f=u.length;for(let p=0;p<f;p++){let T=this.LA(p+1);if(r(T,u[p])===false)continue e}return a}}}}function Hc(t,e,r){let n=ue(t,i=>i.length===1),o=t.length;if(n&&!r){let i=re(t);if(i.length===1&&C(i[0].categoryMatches)){let s=i[0].tokenTypeIdx;return function(){return this.LA(1).tokenTypeIdx===s}}else {let a=te(i,(s,l,c)=>(s[l.tokenTypeIdx]=true,x(l.categoryMatches,u=>{s[u]=true;}),s),[]);return function(){let s=this.LA(1);return a[s.tokenTypeIdx]===true}}}else return function(){e:for(let i=0;i<o;i++){let a=t[i],s=a.length;for(let l=0;l<s;l++){let c=this.LA(l+1);if(e(c,a[l])===false)continue e}return  true}return  false}}var vi=class extends lt{constructor(e,r,n){super(),this.topProd=e,this.targetOccurrence=r,this.targetProdType=n;}startWalking(){return this.walk(this.topProd),this.restDef}checkIsTarget(e,r,n,o){return e.idx===this.targetOccurrence&&this.targetProdType===r?(this.restDef=n.concat(o),true):false}walkOption(e,r,n){this.checkIsTarget(e,j.OPTION,r,n)||super.walkOption(e,r,n);}walkAtLeastOne(e,r,n){this.checkIsTarget(e,j.REPETITION_MANDATORY,r,n)||super.walkOption(e,r,n);}walkAtLeastOneSep(e,r,n){this.checkIsTarget(e,j.REPETITION_MANDATORY_WITH_SEPARATOR,r,n)||super.walkOption(e,r,n);}walkMany(e,r,n){this.checkIsTarget(e,j.REPETITION,r,n)||super.walkOption(e,r,n);}walkManySep(e,r,n){this.checkIsTarget(e,j.REPETITION_WITH_SEPARATOR,r,n)||super.walkOption(e,r,n);}},yo=class extends xe{constructor(e,r,n){super(),this.targetOccurrence=e,this.targetProdType=r,this.targetRef=n,this.result=[];}checkIsTarget(e,r){e.idx===this.targetOccurrence&&this.targetProdType===r&&(this.targetRef===void 0||e===this.targetRef)&&(this.result=e.definition);}visitOption(e){this.checkIsTarget(e,j.OPTION);}visitRepetition(e){this.checkIsTarget(e,j.REPETITION);}visitRepetitionMandatory(e){this.checkIsTarget(e,j.REPETITION_MANDATORY);}visitRepetitionMandatoryWithSeparator(e){this.checkIsTarget(e,j.REPETITION_MANDATORY_WITH_SEPARATOR);}visitRepetitionWithSeparator(e){this.checkIsTarget(e,j.REPETITION_WITH_SEPARATOR);}visitAlternation(e){this.checkIsTarget(e,j.ALTERNATION);}};function Wc(t){let e=new Array(t);for(let r=0;r<t;r++)e[r]=[];return e}function Li(t){let e=[""];for(let r=0;r<t.length;r++){let n=t[r],o=[];for(let i=0;i<e.length;i++){let a=e[i];o.push(a+"_"+n.tokenTypeIdx);for(let s=0;s<n.categoryMatches.length;s++){let l="_"+n.categoryMatches[s];o.push(a+l);}}e=o;}return e}function iE(t,e,r){for(let n=0;n<t.length;n++){if(n===r)continue;let o=t[n];for(let i=0;i<e.length;i++){let a=e[i];if(o[a]===true)return  false}}return  true}function zc(t,e){let r=d(t,a=>Ao([a],1)),n=Wc(r.length),o=d(r,a=>{let s={};return x(a,l=>{let c=Li(l.partialPath);x(c,u=>{s[u]=true;});}),s}),i=r;for(let a=1;a<=e;a++){let s=i;i=Wc(s.length);for(let l=0;l<s.length;l++){let c=s[l];for(let u=0;u<c.length;u++){let f=c[u].partialPath,p=c[u].suffixDef,T=Li(f);if(iE(o,T,l)||C(p)||f.length===e){let S=n[l];if(Ro(S,f)===false){S.push(f);for(let O=0;O<T.length;O++){let A=T[O];o[l][A]=true;}}}else {let S=Ao(p,a+1,f);i[l]=i[l].concat(S),x(S,O=>{let A=Li(O.partialPath);x(A,g=>{o[l][g]=true;});});}}}}return n}function en(t,e,r,n){let o=new yo(t,j.ALTERNATION,n);return e.accept(o),zc(o.result,r)}function tn(t,e,r,n){let o=new yo(t,r);e.accept(o);let i=o.result,s=new vi(e,t,r).startWalking(),l=new D({definition:i}),c=new D({definition:s});return zc([l,c],n)}function Ro(t,e){e:for(let r=0;r<t.length;r++){let n=t[r];if(n.length===e.length){for(let o=0;o<n.length;o++){let i=e[o],a=n[o];if((i===a||a.categoryMatchesMap[i.tokenTypeIdx]!==void 0)===false)continue e}return  true}}return  false}function Xc(t,e){return t.length<e.length&&ue(t,(r,n)=>{let o=e[n];return r===o||o.categoryMatchesMap[r.tokenTypeIdx]})}function Yc(t){return ue(t,e=>ue(e,r=>ue(r,n=>C(n.categoryMatches))))}function qc(t){let e=t.lookaheadStrategy.validate({rules:t.rules,tokenTypes:t.tokenTypes,grammarName:t.grammarName});return d(e,r=>Object.assign({type:oe.CUSTOM_LOOKAHEAD_VALIDATION},r))}function Qc(t,e,r,n){let o=de(t,l=>aE(l,r)),i=pE(t,e,r),a=de(t,l=>cE(l,r)),s=de(t,l=>lE(l,t,n,r));return o.concat(i,a,s)}function aE(t,e){let r=new ki;t.accept(r);let n=r.allProductions,o=mi(n,sE),i=Se(o,s=>s.length>1);return d(P(i),s=>{let l=se(s),c=e.buildDuplicateFoundError(t,s),u=Re(l),f={message:c,type:oe.DUPLICATE_PRODUCTIONS,ruleName:t.name,dslName:u,occurrence:l.idx},p=Zc(l);return p&&(f.parameter=p),f})}function sE(t){return `${Re(t)}_#_${t.idx}_#_${Zc(t)}`}function Zc(t){return t instanceof b?t.terminalType.name:t instanceof U?t.nonTerminalName:""}var ki=class extends xe{constructor(){super(...arguments),this.allProductions=[];}visitNonTerminal(e){this.allProductions.push(e);}visitOption(e){this.allProductions.push(e);}visitRepetitionWithSeparator(e){this.allProductions.push(e);}visitRepetitionMandatory(e){this.allProductions.push(e);}visitRepetitionMandatoryWithSeparator(e){this.allProductions.push(e);}visitRepetition(e){this.allProductions.push(e);}visitAlternation(e){this.allProductions.push(e);}visitTerminal(e){this.allProductions.push(e);}};function lE(t,e,r,n){let o=[];if(te(e,(a,s)=>s.name===t.name?a+1:a,0)>1){let a=n.buildDuplicateRuleNameError({topLevelRule:t,grammarName:r});o.push({message:a,type:oe.DUPLICATE_RULE_NAME,ruleName:t.name});}return o}function Jc(t,e,r){let n=[],o;return K(e,t)||(o=`Invalid rule override, rule: ->${t}<- cannot be overridden in the grammar: ->${r}<-as it is not defined in any of the super grammars `,n.push({message:o,type:oe.INVALID_RULE_OVERRIDE,ruleName:t})),n}function Mi(t,e,r,n=[]){let o=[],i=Oo(e.definition);if(C(i))return [];{let a=t.name;K(i,t)&&o.push({message:r.buildLeftRecursionError({topLevelRule:t,leftRecursionPath:n}),type:oe.LEFT_RECURSION,ruleName:a});let l=Ct(i,n.concat([t])),c=de(l,u=>{let f=F(n);return f.push(u),Mi(t,u,r,f)});return o.concat(c)}}function Oo(t){let e=[];if(C(t))return e;let r=se(t);if(r instanceof U)e.push(r.referencedRule);else if(r instanceof D||r instanceof G||r instanceof q||r instanceof Q||r instanceof H||r instanceof k)e=e.concat(Oo(r.definition));else if(r instanceof z)e=re(d(r.definition,i=>Oo(i.definition)));else if(!(r instanceof b))throw Error("non exhaustive match");let n=Dt(r),o=t.length>1;if(n&&o){let i=Y(t);return e.concat(Oo(i))}else return e}var rn=class extends xe{constructor(){super(...arguments),this.alternations=[];}visitAlternation(e){this.alternations.push(e);}};function eu(t,e){let r=new rn;t.accept(r);let n=r.alternations;return de(n,i=>{let a=st(i.definition);return de(a,(s,l)=>{let c=Io([s],[],ct,1);return C(c)?[{message:e.buildEmptyAlternationError({topLevelRule:t,alternation:i,emptyChoiceIdx:l}),type:oe.NONE_LAST_EMPTY_ALT,ruleName:t.name,occurrence:i.idx,alternative:l+1}]:[]})})}function tu(t,e,r){let n=new rn;t.accept(n);let o=n.alternations;return o=bt(o,a=>a.ignoreAmbiguities===true),de(o,a=>{let s=a.idx,l=a.maxLookahead||e,c=en(s,t,l,a),u=uE(c,a,t,r),f=fE(c,a,t,r);return u.concat(f)})}var Pi=class extends xe{constructor(){super(...arguments),this.allProductions=[];}visitRepetitionWithSeparator(e){this.allProductions.push(e);}visitRepetitionMandatory(e){this.allProductions.push(e);}visitRepetitionMandatoryWithSeparator(e){this.allProductions.push(e);}visitRepetition(e){this.allProductions.push(e);}};function cE(t,e){let r=new rn;t.accept(r);let n=r.alternations;return de(n,i=>i.definition.length>255?[{message:e.buildTooManyAlternativesError({topLevelRule:t,alternation:i}),type:oe.TOO_MANY_ALTS,ruleName:t.name,occurrence:i.idx}]:[])}function ru(t,e,r){let n=[];return x(t,o=>{let i=new Pi;o.accept(i);let a=i.allProductions;x(a,s=>{let l=So(s),c=s.maxLookahead||e,u=s.idx,p=tn(u,o,l,c)[0];if(C(re(p))){let T=r.buildEmptyRepetitionError({topLevelRule:o,repetition:s});n.push({message:T,type:oe.NO_NON_EMPTY_LOOKAHEAD,ruleName:o.name});}});}),n}function uE(t,e,r,n){let o=[],i=te(t,(s,l,c)=>(e.definition[c].ignoreAmbiguities===true||x(l,u=>{let f=[c];x(t,(p,T)=>{c!==T&&Ro(p,u)&&e.definition[T].ignoreAmbiguities!==true&&f.push(T);}),f.length>1&&!Ro(o,u)&&(o.push(u),s.push({alts:f,path:u}));}),s),[]);return d(i,s=>{let l=d(s.alts,u=>u+1);return {message:n.buildAlternationAmbiguityError({topLevelRule:r,alternation:e,ambiguityIndices:l,prefixPath:s.path}),type:oe.AMBIGUOUS_ALTS,ruleName:r.name,occurrence:e.idx,alternatives:s.alts}})}function fE(t,e,r,n){let o=te(t,(a,s,l)=>{let c=d(s,u=>({idx:l,path:u}));return a.concat(c)},[]);return ze(de(o,a=>{if(e.definition[a.idx].ignoreAmbiguities===true)return [];let l=a.idx,c=a.path,u=fe(o,p=>e.definition[p.idx].ignoreAmbiguities!==true&&p.idx<l&&Xc(p.path,c));return d(u,p=>{let T=[p.idx+1,l+1],y=e.idx===0?"":e.idx;return {message:n.buildAlternationPrefixAmbiguityError({topLevelRule:r,alternation:e,ambiguityIndices:T,prefixPath:p.path}),type:oe.AMBIGUOUS_PREFIX_ALTS,ruleName:r.name,occurrence:y,alternatives:T}})}))}function pE(t,e,r){let n=[],o=d(e,i=>i.name);return x(t,i=>{let a=i.name;if(K(o,a)){let s=r.buildNamespaceConflictError(i);n.push({message:s,type:oe.CONFLICT_TOKENS_RULES_NAMESPACE,ruleName:a});}}),n}function nu(t){let e=xr(t,{errMsgProvider:Gc}),r={};return x(t.rules,n=>{r[n.name]=n;}),Kc(r,e.errMsgProvider)}function ou(t){return t=xr(t,{errMsgProvider:De}),Qc(t.rules,t.tokenTypes,t.errMsgProvider,t.grammarName)}var iu="MismatchedTokenException",au="NoViableAltException",su="EarlyExitException",lu="NotAllInputParsedException",cu=[iu,au,su,lu];Object.freeze(cu);function vt(t){return K(cu,t.name)}var _r=class extends Error{constructor(e,r){super(e),this.token=r,this.resyncedTokens=[],Object.setPrototypeOf(this,new.target.prototype),Error.captureStackTrace&&Error.captureStackTrace(this,this.constructor);}},Vt=class extends _r{constructor(e,r,n){super(e,r),this.previousToken=n,this.name=iu;}},nn=class extends _r{constructor(e,r,n){super(e,r),this.previousToken=n,this.name=au;}},on=class extends _r{constructor(e,r){super(e,r),this.name=lu;}},an=class extends _r{constructor(e,r,n){super(e,r),this.previousToken=n,this.name=su;}};var wi={},Ui="InRuleRecoveryException",Fi=class extends Error{constructor(e){super(e),this.name=Ui;}},No=class{initRecoverable(e){this.firstAfterRepMap={},this.resyncFollows={},this.recoveryEnabled=E(e,"recoveryEnabled")?e.recoveryEnabled:Te.recoveryEnabled,this.recoveryEnabled&&(this.attemptInRepetitionRecovery=mE);}getTokenToInsert(e){let r=$t(e,"",NaN,NaN,NaN,NaN,NaN,NaN);return r.isInsertedInRecovery=true,r}canTokenTypeBeInsertedInRecovery(e){return  true}canTokenTypeBeDeletedInRecovery(e){return  true}tryInRepetitionRecovery(e,r,n,o){let i=this.findReSyncTokenType(),a=this.exportLexerState(),s=[],l=false,c=this.LA(1),u=this.LA(1),f=()=>{let p=this.LA(0),T=this.errorMessageProvider.buildMismatchTokenMessage({expected:o,actual:c,previous:p,ruleName:this.getCurrRuleFullName()}),y=new Vt(T,c,this.LA(0));y.resyncedTokens=st(s),this.SAVE_ERROR(y);};for(;!l;)if(this.tokenMatcher(u,o)){f();return}else if(n.call(this)){f(),e.apply(this,r);return}else this.tokenMatcher(u,i)?l=true:(u=this.SKIP_TOKEN(),this.addToResyncTokens(u,s));this.importLexerState(a);}shouldInRepetitionRecoveryBeTried(e,r,n){return !(n===false||this.tokenMatcher(this.LA(1),e)||this.isBackTracking()||this.canPerformInRuleRecovery(e,this.getFollowsForInRuleRecovery(e,r)))}getFollowsForInRuleRecovery(e,r){let n=this.getCurrentGrammarPath(e,r);return this.getNextPossibleTokenTypes(n)}tryInRuleRecovery(e,r){if(this.canRecoverWithSingleTokenInsertion(e,r))return this.getTokenToInsert(e);if(this.canRecoverWithSingleTokenDeletion(e)){let n=this.SKIP_TOKEN();return this.consumeToken(),n}throw new Fi("sad sad panda")}canPerformInRuleRecovery(e,r){return this.canRecoverWithSingleTokenInsertion(e,r)||this.canRecoverWithSingleTokenDeletion(e)}canRecoverWithSingleTokenInsertion(e,r){if(!this.canTokenTypeBeInsertedInRecovery(e)||C(r))return  false;let n=this.LA(1);return Ye(r,i=>this.tokenMatcher(n,i))!==void 0}canRecoverWithSingleTokenDeletion(e){return this.canTokenTypeBeDeletedInRecovery(e)?this.tokenMatcher(this.LA(2),e):false}isInCurrentRuleReSyncSet(e){let r=this.getCurrFollowKey(),n=this.getFollowSetFromFollowKey(r);return K(n,e)}findReSyncTokenType(){let e=this.flattenFollowSet(),r=this.LA(1),n=2;for(;;){let o=Ye(e,i=>_i(r,i));if(o!==void 0)return o;r=this.LA(n),n++;}}getCurrFollowKey(){if(this.RULE_STACK.length===1)return wi;let e=this.getLastExplicitRuleShortName(),r=this.getLastExplicitRuleOccurrenceIndex(),n=this.getPreviousExplicitRuleShortName();return {ruleName:this.shortRuleNameToFullName(e),idxInCallingRule:r,inRule:this.shortRuleNameToFullName(n)}}buildFullFollowKeyStack(){let e=this.RULE_STACK,r=this.RULE_OCCURRENCE_STACK;return d(e,(n,o)=>o===0?wi:{ruleName:this.shortRuleNameToFullName(n),idxInCallingRule:r[o],inRule:this.shortRuleNameToFullName(e[o-1])})}flattenFollowSet(){let e=d(this.buildFullFollowKeyStack(),r=>this.getFollowSetFromFollowKey(r));return re(e)}getFollowSetFromFollowKey(e){if(e===wi)return [Ue];let r=e.ruleName+e.idxInCallingRule+so+e.inRule;return this.resyncFollows[r]}addToResyncTokens(e,r){return this.tokenMatcher(e,Ue)||r.push(e),r}reSyncTo(e){let r=[],n=this.LA(1);for(;this.tokenMatcher(n,e)===false;)n=this.SKIP_TOKEN(),this.addToResyncTokens(n,r);return st(r)}attemptInRepetitionRecovery(e,r,n,o,i,a,s){}getCurrentGrammarPath(e,r){let n=this.getHumanReadableRuleStack(),o=F(this.RULE_OCCURRENCE_STACK);return {ruleStack:n,occurrenceStack:o,lastTok:e,lastTokOccurrence:r}}getHumanReadableRuleStack(){return d(this.RULE_STACK,e=>this.shortRuleNameToFullName(e))}};function mE(t,e,r,n,o,i,a){let s=this.getKeyForAutomaticLookahead(n,o),l=this.firstAfterRepMap[s];if(l===void 0){let p=this.getCurrRuleFullName(),T=this.getGAstProductions()[p];l=new i(T,o).startWalking(),this.firstAfterRepMap[s]=l;}let c=l.token,u=l.occurrence,f=l.isEndOfRule;this.RULE_STACK.length===1&&f&&c===void 0&&(c=Ue,u=1),!(c===void 0||u===void 0)&&this.shouldInRepetitionRecoveryBeTried(c,u,a)&&this.tryInRepetitionRecovery(t,e,r,c);}function _o(t,e,r){return r|e|t}var sn=class{constructor(e){var r;this.maxLookahead=(r=e==null?void 0:e.maxLookahead)!==null&&r!==void 0?r:Te.maxLookahead;}validate(e){let r=this.validateNoLeftRecursion(e.rules);if(C(r)){let n=this.validateEmptyOrAlternatives(e.rules),o=this.validateAmbiguousAlternationAlternatives(e.rules,this.maxLookahead),i=this.validateSomeNonEmptyLookaheadPath(e.rules,this.maxLookahead);return [...r,...n,...o,...i]}return r}validateNoLeftRecursion(e){return de(e,r=>Mi(r,r,De))}validateEmptyOrAlternatives(e){return de(e,r=>eu(r,De))}validateAmbiguousAlternationAlternatives(e,r){return de(e,n=>tu(n,r,De))}validateSomeNonEmptyLookaheadPath(e,r){return ru(e,r,De)}buildLookaheadForAlternation(e){return $c(e.prodOccurrence,e.rule,e.maxLookahead,e.hasPredicates,e.dynamicTokensEnabled,jc)}buildLookaheadForOptional(e){return Vc(e.prodOccurrence,e.rule,e.maxLookahead,e.dynamicTokensEnabled,So(e.prodType),Hc)}};var bo=class{initLooksAhead(e){this.dynamicTokensEnabled=E(e,"dynamicTokensEnabled")?e.dynamicTokensEnabled:Te.dynamicTokensEnabled,this.maxLookahead=E(e,"maxLookahead")?e.maxLookahead:Te.maxLookahead,this.lookaheadStrategy=E(e,"lookaheadStrategy")?e.lookaheadStrategy:new sn({maxLookahead:this.maxLookahead}),this.lookAheadFuncsCache=new Map;}preComputeLookaheadFunctions(e){x(e,r=>{this.TRACE_INIT(`${r.name} Rule Lookahead`,()=>{let{alternation:n,repetition:o,option:i,repetitionMandatory:a,repetitionMandatoryWithSeparator:s,repetitionWithSeparator:l}=hE(r);x(n,c=>{let u=c.idx===0?"":c.idx;this.TRACE_INIT(`${Re(c)}${u}`,()=>{let f=this.lookaheadStrategy.buildLookaheadForAlternation({prodOccurrence:c.idx,rule:r,maxLookahead:c.maxLookahead||this.maxLookahead,hasPredicates:c.hasPredicates,dynamicTokensEnabled:this.dynamicTokensEnabled}),p=_o(this.fullRuleNameToShort[r.name],256,c.idx);this.setLaFuncCache(p,f);});}),x(o,c=>{this.computeLookaheadFunc(r,c.idx,768,"Repetition",c.maxLookahead,Re(c));}),x(i,c=>{this.computeLookaheadFunc(r,c.idx,512,"Option",c.maxLookahead,Re(c));}),x(a,c=>{this.computeLookaheadFunc(r,c.idx,1024,"RepetitionMandatory",c.maxLookahead,Re(c));}),x(s,c=>{this.computeLookaheadFunc(r,c.idx,1536,"RepetitionMandatoryWithSeparator",c.maxLookahead,Re(c));}),x(l,c=>{this.computeLookaheadFunc(r,c.idx,1280,"RepetitionWithSeparator",c.maxLookahead,Re(c));});});});}computeLookaheadFunc(e,r,n,o,i,a){this.TRACE_INIT(`${a}${r===0?"":r}`,()=>{let s=this.lookaheadStrategy.buildLookaheadForOptional({prodOccurrence:r,rule:e,maxLookahead:i||this.maxLookahead,dynamicTokensEnabled:this.dynamicTokensEnabled,prodType:o}),l=_o(this.fullRuleNameToShort[e.name],n,r);this.setLaFuncCache(l,s);});}getKeyForAutomaticLookahead(e,r){let n=this.getLastExplicitRuleShortName();return _o(n,e,r)}getLaFuncFromCache(e){return this.lookAheadFuncsCache.get(e)}setLaFuncCache(e,r){this.lookAheadFuncsCache.set(e,r);}},Di=class extends xe{constructor(){super(...arguments),this.dslMethods={option:[],alternation:[],repetition:[],repetitionWithSeparator:[],repetitionMandatory:[],repetitionMandatoryWithSeparator:[]};}reset(){this.dslMethods={option:[],alternation:[],repetition:[],repetitionWithSeparator:[],repetitionMandatory:[],repetitionMandatoryWithSeparator:[]};}visitOption(e){this.dslMethods.option.push(e);}visitRepetitionWithSeparator(e){this.dslMethods.repetitionWithSeparator.push(e);}visitRepetitionMandatory(e){this.dslMethods.repetitionMandatory.push(e);}visitRepetitionMandatoryWithSeparator(e){this.dslMethods.repetitionMandatoryWithSeparator.push(e);}visitRepetition(e){this.dslMethods.repetition.push(e);}visitAlternation(e){this.dslMethods.alternation.push(e);}},Co=new Di;function hE(t){Co.reset(),t.accept(Co);let e=Co.dslMethods;return Co.reset(),e}function Ki(t,e){isNaN(t.startOffset)===true?(t.startOffset=e.startOffset,t.endOffset=e.endOffset):t.endOffset<e.endOffset&&(t.endOffset=e.endOffset);}function Wi(t,e){isNaN(t.startOffset)===true?(t.startOffset=e.startOffset,t.startColumn=e.startColumn,t.startLine=e.startLine,t.endOffset=e.endOffset,t.endColumn=e.endColumn,t.endLine=e.endLine):t.endOffset<e.endOffset&&(t.endOffset=e.endOffset,t.endColumn=e.endColumn,t.endLine=e.endLine);}function uu(t,e,r){t.children[r]===void 0?t.children[r]=[e]:t.children[r].push(e);}function fu(t,e,r){t.children[e]===void 0?t.children[e]=[r]:t.children[e].push(r);}var dE="name";function $i(t,e){Object.defineProperty(t,dE,{enumerable:false,configurable:true,writable:false,value:e});}function gE(t,e){let r=M(t),n=r.length;for(let o=0;o<n;o++){let i=r[o],a=t[i],s=a.length;for(let l=0;l<s;l++){let c=a[l];c.tokenTypeIdx===void 0&&this[c.name](c.children,e);}}}function pu(t,e){let r=function(){};$i(r,t+"BaseSemantics");let n={visit:function(o,i){if(I(o)&&(o=o[0]),!pe(o))return this[o.name](o.children,i)},validateVisitor:function(){let o=xE(this,e);if(!C(o)){let i=d(o,a=>a.msg);throw Error(`Errors Detected in CST Visitor <${this.constructor.name}>:
	${i.join(`

`).replace(/\n/g,`
	`)}`)}}};return r.prototype=n,r.prototype.constructor=r,r._RULE_NAMES=e,r}function mu(t,e,r){let n=function(){};$i(n,t+"BaseSemanticsWithDefaults");let o=Object.create(r.prototype);return x(e,i=>{o[i]=gE;}),n.prototype=o,n.prototype.constructor=n,n}var Vi;(function(t){t[t.REDUNDANT_METHOD=0]="REDUNDANT_METHOD",t[t.MISSING_METHOD=1]="MISSING_METHOD";})(Vi||(Vi={}));function xE(t,e){return TE(t,e)}function TE(t,e){let r=fe(e,o=>he(t[o])===false),n=d(r,o=>({msg:`Missing visitor method: <${o}> on ${t.constructor.name} CST Visitor.`,type:Vi.MISSING_METHOD,methodName:o}));return ze(n)}var Po=class{initTreeBuilder(e){if(this.CST_STACK=[],this.outputCst=e.outputCst,this.nodeLocationTracking=E(e,"nodeLocationTracking")?e.nodeLocationTracking:Te.nodeLocationTracking,!this.outputCst)this.cstInvocationStateUpdate=V,this.cstFinallyStateUpdate=V,this.cstPostTerminal=V,this.cstPostNonTerminal=V,this.cstPostRule=V;else if(/full/i.test(this.nodeLocationTracking))this.recoveryEnabled?(this.setNodeLocationFromToken=Wi,this.setNodeLocationFromNode=Wi,this.cstPostRule=V,this.setInitialNodeLocation=this.setInitialNodeLocationFullRecovery):(this.setNodeLocationFromToken=V,this.setNodeLocationFromNode=V,this.cstPostRule=this.cstPostRuleFull,this.setInitialNodeLocation=this.setInitialNodeLocationFullRegular);else if(/onlyOffset/i.test(this.nodeLocationTracking))this.recoveryEnabled?(this.setNodeLocationFromToken=Ki,this.setNodeLocationFromNode=Ki,this.cstPostRule=V,this.setInitialNodeLocation=this.setInitialNodeLocationOnlyOffsetRecovery):(this.setNodeLocationFromToken=V,this.setNodeLocationFromNode=V,this.cstPostRule=this.cstPostRuleOnlyOffset,this.setInitialNodeLocation=this.setInitialNodeLocationOnlyOffsetRegular);else if(/none/i.test(this.nodeLocationTracking))this.setNodeLocationFromToken=V,this.setNodeLocationFromNode=V,this.cstPostRule=V,this.setInitialNodeLocation=V;else throw Error(`Invalid <nodeLocationTracking> config option: "${e.nodeLocationTracking}"`)}setInitialNodeLocationOnlyOffsetRecovery(e){e.location={startOffset:NaN,endOffset:NaN};}setInitialNodeLocationOnlyOffsetRegular(e){e.location={startOffset:this.LA(1).startOffset,endOffset:NaN};}setInitialNodeLocationFullRecovery(e){e.location={startOffset:NaN,startLine:NaN,startColumn:NaN,endOffset:NaN,endLine:NaN,endColumn:NaN};}setInitialNodeLocationFullRegular(e){let r=this.LA(1);e.location={startOffset:r.startOffset,startLine:r.startLine,startColumn:r.startColumn,endOffset:NaN,endLine:NaN,endColumn:NaN};}cstInvocationStateUpdate(e){let r={name:e,children:Object.create(null)};this.setInitialNodeLocation(r),this.CST_STACK.push(r);}cstFinallyStateUpdate(){this.CST_STACK.pop();}cstPostRuleFull(e){let r=this.LA(0),n=e.location;n.startOffset<=r.startOffset?(n.endOffset=r.endOffset,n.endLine=r.endLine,n.endColumn=r.endColumn):(n.startOffset=NaN,n.startLine=NaN,n.startColumn=NaN);}cstPostRuleOnlyOffset(e){let r=this.LA(0),n=e.location;n.startOffset<=r.startOffset?n.endOffset=r.endOffset:n.startOffset=NaN;}cstPostTerminal(e,r){let n=this.CST_STACK[this.CST_STACK.length-1];uu(n,r,e),this.setNodeLocationFromToken(n.location,r);}cstPostNonTerminal(e,r){let n=this.CST_STACK[this.CST_STACK.length-1];fu(n,r,e),this.setNodeLocationFromNode(n.location,e.location);}getBaseCstVisitorConstructor(){if(pe(this.baseCstVisitorConstructor)){let e=pu(this.className,M(this.gastProductionsCache));return this.baseCstVisitorConstructor=e,e}return this.baseCstVisitorConstructor}getBaseCstVisitorConstructorWithDefaults(){if(pe(this.baseCstVisitorWithDefaultsConstructor)){let e=mu(this.className,M(this.gastProductionsCache),this.getBaseCstVisitorConstructor());return this.baseCstVisitorWithDefaultsConstructor=e,e}return this.baseCstVisitorWithDefaultsConstructor}getLastExplicitRuleShortName(){let e=this.RULE_STACK;return e[e.length-1]}getPreviousExplicitRuleShortName(){let e=this.RULE_STACK;return e[e.length-2]}getLastExplicitRuleOccurrenceIndex(){let e=this.RULE_OCCURRENCE_STACK;return e[e.length-1]}};var Mo=class{initLexerAdapter(){this.tokVector=[],this.tokVectorLength=0,this.currIdx=-1;}set input(e){if(this.selfAnalysisDone!==true)throw Error("Missing <performSelfAnalysis> invocation at the end of the Parser's constructor.");this.reset(),this.tokVector=e,this.tokVectorLength=e.length;}get input(){return this.tokVector}SKIP_TOKEN(){return this.currIdx<=this.tokVector.length-2?(this.consumeToken(),this.LA(1)):Cr}LA(e){let r=this.currIdx+e;return r<0||this.tokVectorLength<=r?Cr:this.tokVector[r]}consumeToken(){this.currIdx++;}exportLexerState(){return this.currIdx}importLexerState(e){this.currIdx=e;}resetLexerState(){this.currIdx=-1;}moveToTerminatedState(){this.currIdx=this.tokVector.length-1;}getLexerPosition(){return this.exportLexerState()}};var wo=class{ACTION(e){return e.call(this)}consume(e,r,n){return this.consumeInternal(r,e,n)}subrule(e,r,n){return this.subruleInternal(r,e,n)}option(e,r){return this.optionInternal(r,e)}or(e,r){return this.orInternal(r,e)}many(e,r){return this.manyInternal(e,r)}atLeastOne(e,r){return this.atLeastOneInternal(e,r)}CONSUME(e,r){return this.consumeInternal(e,0,r)}CONSUME1(e,r){return this.consumeInternal(e,1,r)}CONSUME2(e,r){return this.consumeInternal(e,2,r)}CONSUME3(e,r){return this.consumeInternal(e,3,r)}CONSUME4(e,r){return this.consumeInternal(e,4,r)}CONSUME5(e,r){return this.consumeInternal(e,5,r)}CONSUME6(e,r){return this.consumeInternal(e,6,r)}CONSUME7(e,r){return this.consumeInternal(e,7,r)}CONSUME8(e,r){return this.consumeInternal(e,8,r)}CONSUME9(e,r){return this.consumeInternal(e,9,r)}SUBRULE(e,r){return this.subruleInternal(e,0,r)}SUBRULE1(e,r){return this.subruleInternal(e,1,r)}SUBRULE2(e,r){return this.subruleInternal(e,2,r)}SUBRULE3(e,r){return this.subruleInternal(e,3,r)}SUBRULE4(e,r){return this.subruleInternal(e,4,r)}SUBRULE5(e,r){return this.subruleInternal(e,5,r)}SUBRULE6(e,r){return this.subruleInternal(e,6,r)}SUBRULE7(e,r){return this.subruleInternal(e,7,r)}SUBRULE8(e,r){return this.subruleInternal(e,8,r)}SUBRULE9(e,r){return this.subruleInternal(e,9,r)}OPTION(e){return this.optionInternal(e,0)}OPTION1(e){return this.optionInternal(e,1)}OPTION2(e){return this.optionInternal(e,2)}OPTION3(e){return this.optionInternal(e,3)}OPTION4(e){return this.optionInternal(e,4)}OPTION5(e){return this.optionInternal(e,5)}OPTION6(e){return this.optionInternal(e,6)}OPTION7(e){return this.optionInternal(e,7)}OPTION8(e){return this.optionInternal(e,8)}OPTION9(e){return this.optionInternal(e,9)}OR(e){return this.orInternal(e,0)}OR1(e){return this.orInternal(e,1)}OR2(e){return this.orInternal(e,2)}OR3(e){return this.orInternal(e,3)}OR4(e){return this.orInternal(e,4)}OR5(e){return this.orInternal(e,5)}OR6(e){return this.orInternal(e,6)}OR7(e){return this.orInternal(e,7)}OR8(e){return this.orInternal(e,8)}OR9(e){return this.orInternal(e,9)}MANY(e){this.manyInternal(0,e);}MANY1(e){this.manyInternal(1,e);}MANY2(e){this.manyInternal(2,e);}MANY3(e){this.manyInternal(3,e);}MANY4(e){this.manyInternal(4,e);}MANY5(e){this.manyInternal(5,e);}MANY6(e){this.manyInternal(6,e);}MANY7(e){this.manyInternal(7,e);}MANY8(e){this.manyInternal(8,e);}MANY9(e){this.manyInternal(9,e);}MANY_SEP(e){this.manySepFirstInternal(0,e);}MANY_SEP1(e){this.manySepFirstInternal(1,e);}MANY_SEP2(e){this.manySepFirstInternal(2,e);}MANY_SEP3(e){this.manySepFirstInternal(3,e);}MANY_SEP4(e){this.manySepFirstInternal(4,e);}MANY_SEP5(e){this.manySepFirstInternal(5,e);}MANY_SEP6(e){this.manySepFirstInternal(6,e);}MANY_SEP7(e){this.manySepFirstInternal(7,e);}MANY_SEP8(e){this.manySepFirstInternal(8,e);}MANY_SEP9(e){this.manySepFirstInternal(9,e);}AT_LEAST_ONE(e){this.atLeastOneInternal(0,e);}AT_LEAST_ONE1(e){return this.atLeastOneInternal(1,e)}AT_LEAST_ONE2(e){this.atLeastOneInternal(2,e);}AT_LEAST_ONE3(e){this.atLeastOneInternal(3,e);}AT_LEAST_ONE4(e){this.atLeastOneInternal(4,e);}AT_LEAST_ONE5(e){this.atLeastOneInternal(5,e);}AT_LEAST_ONE6(e){this.atLeastOneInternal(6,e);}AT_LEAST_ONE7(e){this.atLeastOneInternal(7,e);}AT_LEAST_ONE8(e){this.atLeastOneInternal(8,e);}AT_LEAST_ONE9(e){this.atLeastOneInternal(9,e);}AT_LEAST_ONE_SEP(e){this.atLeastOneSepFirstInternal(0,e);}AT_LEAST_ONE_SEP1(e){this.atLeastOneSepFirstInternal(1,e);}AT_LEAST_ONE_SEP2(e){this.atLeastOneSepFirstInternal(2,e);}AT_LEAST_ONE_SEP3(e){this.atLeastOneSepFirstInternal(3,e);}AT_LEAST_ONE_SEP4(e){this.atLeastOneSepFirstInternal(4,e);}AT_LEAST_ONE_SEP5(e){this.atLeastOneSepFirstInternal(5,e);}AT_LEAST_ONE_SEP6(e){this.atLeastOneSepFirstInternal(6,e);}AT_LEAST_ONE_SEP7(e){this.atLeastOneSepFirstInternal(7,e);}AT_LEAST_ONE_SEP8(e){this.atLeastOneSepFirstInternal(8,e);}AT_LEAST_ONE_SEP9(e){this.atLeastOneSepFirstInternal(9,e);}RULE(e,r,n=br){if(K(this.definedRulesNames,e)){let a={message:De.buildDuplicateRuleNameError({topLevelRule:e,grammarName:this.className}),type:oe.DUPLICATE_RULE_NAME,ruleName:e};this.definitionErrors.push(a);}this.definedRulesNames.push(e);let o=this.defineRule(e,r,n);return this[e]=o,o}OVERRIDE_RULE(e,r,n=br){let o=Jc(e,this.definedRulesNames,this.className);this.definitionErrors=this.definitionErrors.concat(o);let i=this.defineRule(e,r,n);return this[e]=i,i}BACKTRACK(e,r){return function(){this.isBackTrackingStack.push(1);let n=this.saveRecogState();try{return e.apply(this,r),!0}catch(o){if(vt(o))return  false;throw o}finally{this.reloadRecogState(n),this.isBackTrackingStack.pop();}}}getGAstProductions(){return this.gastProductionsCache}getSerializedGastProductions(){return ao(P(this.gastProductionsCache))}};var Fo=class{initRecognizerEngine(e,r){if(this.className=this.constructor.name,this.shortRuleNameToFull={},this.fullRuleNameToShort={},this.ruleShortNameIdx=256,this.tokenMatcher=Or,this.subruleIdx=0,this.definedRulesNames=[],this.tokensMap={},this.isBackTrackingStack=[],this.RULE_STACK=[],this.RULE_OCCURRENCE_STACK=[],this.gastProductionsCache={},E(r,"serializedGrammar"))throw Error(`The Parser's configuration can no longer contain a <serializedGrammar> property.
	See: https://chevrotain.io/docs/changes/BREAKING_CHANGES.html#_6-0-0
	For Further details.`);if(I(e)){if(C(e))throw Error(`A Token Vocabulary cannot be empty.
	Note that the first argument for the parser constructor
	is no longer a Token vector (since v4.0).`);if(typeof e[0].startOffset=="number")throw Error(`The Parser constructor no longer accepts a token vector as the first argument.
	See: https://chevrotain.io/docs/changes/BREAKING_CHANGES.html#_4-0-0
	For Further details.`)}if(I(e))this.tokensMap=te(e,(i,a)=>(i[a.name]=a,i),{});else if(E(e,"modes")&&ue(re(P(e.modes)),vc)){let i=re(P(e.modes)),a=Tr(i);this.tokensMap=te(a,(s,l)=>(s[l.name]=l,s),{});}else if($(e))this.tokensMap=F(e);else throw new Error("<tokensDictionary> argument must be An Array of Token constructors, A dictionary of Token constructors or an IMultiModeLexerDefinition");this.tokensMap.EOF=Ue;let n=E(e,"modes")?re(P(e.modes)):P(e),o=ue(n,i=>C(i.categoryMatches));this.tokenMatcher=o?Or:ct,ut(P(this.tokensMap));}defineRule(e,r,n){if(this.selfAnalysisDone)throw Error(`Grammar rule <${e}> may not be defined after the 'performSelfAnalysis' method has been called'
Make sure that all grammar rule definitions are done before 'performSelfAnalysis' is called.`);let o=E(n,"resyncEnabled")?n.resyncEnabled:br.resyncEnabled,i=E(n,"recoveryValueFunc")?n.recoveryValueFunc:br.recoveryValueFunc,a=this.ruleShortNameIdx<<12;this.ruleShortNameIdx++,this.shortRuleNameToFull[a]=e,this.fullRuleNameToShort[e]=a;let s;return this.outputCst===true?s=function(...u){try{this.ruleInvocationStateUpdate(a,e,this.subruleIdx),r.apply(this,u);let f=this.CST_STACK[this.CST_STACK.length-1];return this.cstPostRule(f),f}catch(f){return this.invokeRuleCatch(f,o,i)}finally{this.ruleFinallyStateUpdate();}}:s=function(...u){try{return this.ruleInvocationStateUpdate(a,e,this.subruleIdx),r.apply(this,u)}catch(f){return this.invokeRuleCatch(f,o,i)}finally{this.ruleFinallyStateUpdate();}},Object.assign(s,{ruleName:e,originalGrammarAction:r})}invokeRuleCatch(e,r,n){let o=this.RULE_STACK.length===1,i=r&&!this.isBackTracking()&&this.recoveryEnabled;if(vt(e)){let a=e;if(i){let s=this.findReSyncTokenType();if(this.isInCurrentRuleReSyncSet(s))if(a.resyncedTokens=this.reSyncTo(s),this.outputCst){let l=this.CST_STACK[this.CST_STACK.length-1];return l.recoveredNode=true,l}else return n(e);else {if(this.outputCst){let l=this.CST_STACK[this.CST_STACK.length-1];l.recoveredNode=true,a.partialCstResult=l;}throw a}}else {if(o)return this.moveToTerminatedState(),n(e);throw a}}else throw e}optionInternal(e,r){let n=this.getKeyForAutomaticLookahead(512,r);return this.optionInternalLogic(e,r,n)}optionInternalLogic(e,r,n){let o=this.getLaFuncFromCache(n),i;if(typeof e!="function"){i=e.DEF;let a=e.GATE;if(a!==void 0){let s=o;o=()=>a.call(this)&&s.call(this);}}else i=e;if(o.call(this)===true)return i.call(this)}atLeastOneInternal(e,r){let n=this.getKeyForAutomaticLookahead(1024,e);return this.atLeastOneInternalLogic(e,r,n)}atLeastOneInternalLogic(e,r,n){let o=this.getLaFuncFromCache(n),i;if(typeof r!="function"){i=r.DEF;let a=r.GATE;if(a!==void 0){let s=o;o=()=>a.call(this)&&s.call(this);}}else i=r;if(o.call(this)===true){let a=this.doSingleRepetition(i);for(;o.call(this)===true&&a===true;)a=this.doSingleRepetition(i);}else throw this.raiseEarlyExitException(e,j.REPETITION_MANDATORY,r.ERR_MSG);this.attemptInRepetitionRecovery(this.atLeastOneInternal,[e,r],o,1024,e,Eo);}atLeastOneSepFirstInternal(e,r){let n=this.getKeyForAutomaticLookahead(1536,e);this.atLeastOneSepFirstInternalLogic(e,r,n);}atLeastOneSepFirstInternalLogic(e,r,n){let o=r.DEF,i=r.SEP;if(this.getLaFuncFromCache(n).call(this)===true){o.call(this);let s=()=>this.tokenMatcher(this.LA(1),i);for(;this.tokenMatcher(this.LA(1),i)===true;)this.CONSUME(i),o.call(this);this.attemptInRepetitionRecovery(this.repetitionSepSecondInternal,[e,i,s,o,Jr],s,1536,e,Jr);}else throw this.raiseEarlyExitException(e,j.REPETITION_MANDATORY_WITH_SEPARATOR,r.ERR_MSG)}manyInternal(e,r){let n=this.getKeyForAutomaticLookahead(768,e);return this.manyInternalLogic(e,r,n)}manyInternalLogic(e,r,n){let o=this.getLaFuncFromCache(n),i;if(typeof r!="function"){i=r.DEF;let s=r.GATE;if(s!==void 0){let l=o;o=()=>s.call(this)&&l.call(this);}}else i=r;let a=true;for(;o.call(this)===true&&a===true;)a=this.doSingleRepetition(i);this.attemptInRepetitionRecovery(this.manyInternal,[e,r],o,768,e,To,a);}manySepFirstInternal(e,r){let n=this.getKeyForAutomaticLookahead(1280,e);this.manySepFirstInternalLogic(e,r,n);}manySepFirstInternalLogic(e,r,n){let o=r.DEF,i=r.SEP;if(this.getLaFuncFromCache(n).call(this)===true){o.call(this);let s=()=>this.tokenMatcher(this.LA(1),i);for(;this.tokenMatcher(this.LA(1),i)===true;)this.CONSUME(i),o.call(this);this.attemptInRepetitionRecovery(this.repetitionSepSecondInternal,[e,i,s,o,Zr],s,1280,e,Zr);}}repetitionSepSecondInternal(e,r,n,o,i){for(;n();)this.CONSUME(r),o.call(this);this.attemptInRepetitionRecovery(this.repetitionSepSecondInternal,[e,r,n,o,i],n,1536,e,i);}doSingleRepetition(e){let r=this.getLexerPosition();return e.call(this),this.getLexerPosition()>r}orInternal(e,r){let n=this.getKeyForAutomaticLookahead(256,r),o=I(e)?e:e.DEF,a=this.getLaFuncFromCache(n).call(this,o);if(a!==void 0)return o[a].ALT.call(this);this.raiseNoAltException(r,e.ERR_MSG);}ruleFinallyStateUpdate(){if(this.RULE_STACK.pop(),this.RULE_OCCURRENCE_STACK.pop(),this.cstFinallyStateUpdate(),this.RULE_STACK.length===0&&this.isAtEndOfInput()===false){let e=this.LA(1),r=this.errorMessageProvider.buildNotAllInputParsedMessage({firstRedundant:e,ruleName:this.getCurrRuleFullName()});this.SAVE_ERROR(new on(r,e));}}subruleInternal(e,r,n){let o;try{let i=n!==void 0?n.ARGS:void 0;return this.subruleIdx=r,o=e.apply(this,i),this.cstPostNonTerminal(o,n!==void 0&&n.LABEL!==void 0?n.LABEL:e.ruleName),o}catch(i){throw this.subruleInternalError(i,n,e.ruleName)}}subruleInternalError(e,r,n){throw vt(e)&&e.partialCstResult!==void 0&&(this.cstPostNonTerminal(e.partialCstResult,r!==void 0&&r.LABEL!==void 0?r.LABEL:n),delete e.partialCstResult),e}consumeInternal(e,r,n){let o;try{let i=this.LA(1);this.tokenMatcher(i,e)===!0?(this.consumeToken(),o=i):this.consumeInternalError(e,i,n);}catch(i){o=this.consumeInternalRecovery(e,r,i);}return this.cstPostTerminal(n!==void 0&&n.LABEL!==void 0?n.LABEL:e.name,o),o}consumeInternalError(e,r,n){let o,i=this.LA(0);throw n!==void 0&&n.ERR_MSG?o=n.ERR_MSG:o=this.errorMessageProvider.buildMismatchTokenMessage({expected:e,actual:r,previous:i,ruleName:this.getCurrRuleFullName()}),this.SAVE_ERROR(new Vt(o,r,i))}consumeInternalRecovery(e,r,n){if(this.recoveryEnabled&&n.name==="MismatchedTokenException"&&!this.isBackTracking()){let o=this.getFollowsForInRuleRecovery(e,r);try{return this.tryInRuleRecovery(e,o)}catch(i){throw i.name===Ui?n:i}}else throw n}saveRecogState(){let e=this.errors,r=F(this.RULE_STACK);return {errors:e,lexerState:this.exportLexerState(),RULE_STACK:r,CST_STACK:this.CST_STACK}}reloadRecogState(e){this.errors=e.errors,this.importLexerState(e.lexerState),this.RULE_STACK=e.RULE_STACK;}ruleInvocationStateUpdate(e,r,n){this.RULE_OCCURRENCE_STACK.push(n),this.RULE_STACK.push(e),this.cstInvocationStateUpdate(r);}isBackTracking(){return this.isBackTrackingStack.length!==0}getCurrRuleFullName(){let e=this.getLastExplicitRuleShortName();return this.shortRuleNameToFull[e]}shortRuleNameToFullName(e){return this.shortRuleNameToFull[e]}isAtEndOfInput(){return this.tokenMatcher(this.LA(1),Ue)}reset(){this.resetLexerState(),this.subruleIdx=0,this.isBackTrackingStack=[],this.errors=[],this.RULE_STACK=[],this.CST_STACK=[],this.RULE_OCCURRENCE_STACK=[];}};var Uo=class{initErrorHandler(e){this._errors=[],this.errorMessageProvider=E(e,"errorMessageProvider")?e.errorMessageProvider:Te.errorMessageProvider;}SAVE_ERROR(e){if(vt(e))return e.context={ruleStack:this.getHumanReadableRuleStack(),ruleOccurrenceStack:F(this.RULE_OCCURRENCE_STACK)},this._errors.push(e),e;throw Error("Trying to save an Error which is not a RecognitionException")}get errors(){return F(this._errors)}set errors(e){this._errors=e;}raiseEarlyExitException(e,r,n){let o=this.getCurrRuleFullName(),i=this.getGAstProductions()[o],s=tn(e,i,r,this.maxLookahead)[0],l=[];for(let u=1;u<=this.maxLookahead;u++)l.push(this.LA(u));let c=this.errorMessageProvider.buildEarlyExitMessage({expectedIterationPaths:s,actual:l,previous:this.LA(0),customUserDescription:n,ruleName:o});throw this.SAVE_ERROR(new an(c,this.LA(1),this.LA(0)))}raiseNoAltException(e,r){let n=this.getCurrRuleFullName(),o=this.getGAstProductions()[n],i=en(e,o,this.maxLookahead),a=[];for(let c=1;c<=this.maxLookahead;c++)a.push(this.LA(c));let s=this.LA(0),l=this.errorMessageProvider.buildNoViableAltMessage({expectedPathsPerAlt:i,actual:a,previous:s,customUserDescription:r,ruleName:this.getCurrRuleFullName()});throw this.SAVE_ERROR(new nn(l,this.LA(1),s))}};var Do=class{initContentAssist(){}computeContentAssist(e,r){let n=this.gastProductionsCache[e];if(pe(n))throw Error(`Rule ->${e}<- does not exist in this grammar.`);return Io([n],r,this.tokenMatcher,this.maxLookahead)}getNextPossibleTokenTypes(e){let r=se(e.ruleStack),o=this.getGAstProductions()[r];return new xo(o,e).startWalking()}};var Ko={description:"This Object indicates the Parser is during Recording Phase"};Object.freeze(Ko);var hu=true,du=Math.pow(2,8)-1,xu=h({name:"RECORDING_PHASE_TOKEN",pattern:L.NA});ut([xu]);var Tu=$t(xu,`This IToken indicates the Parser is in Recording Phase
	See: https://chevrotain.io/docs/guide/internals.html#grammar-recording for details`,-1,-1,-1,-1,-1,-1);Object.freeze(Tu);var AE={name:`This CSTNode indicates the Parser is in Recording Phase
	See: https://chevrotain.io/docs/guide/internals.html#grammar-recording for details`,children:{}},Bo=class{initGastRecorder(e){this.recordingProdStack=[],this.RECORDING_PHASE=false;}enableRecording(){this.RECORDING_PHASE=true,this.TRACE_INIT("Enable Recording",()=>{for(let e=0;e<10;e++){let r=e>0?e:"";this[`CONSUME${r}`]=function(n,o){return this.consumeInternalRecord(n,e,o)},this[`SUBRULE${r}`]=function(n,o){return this.subruleInternalRecord(n,e,o)},this[`OPTION${r}`]=function(n){return this.optionInternalRecord(n,e)},this[`OR${r}`]=function(n){return this.orInternalRecord(n,e)},this[`MANY${r}`]=function(n){this.manyInternalRecord(e,n);},this[`MANY_SEP${r}`]=function(n){this.manySepFirstInternalRecord(e,n);},this[`AT_LEAST_ONE${r}`]=function(n){this.atLeastOneInternalRecord(e,n);},this[`AT_LEAST_ONE_SEP${r}`]=function(n){this.atLeastOneSepFirstInternalRecord(e,n);};}this.consume=function(e,r,n){return this.consumeInternalRecord(r,e,n)},this.subrule=function(e,r,n){return this.subruleInternalRecord(r,e,n)},this.option=function(e,r){return this.optionInternalRecord(r,e)},this.or=function(e,r){return this.orInternalRecord(r,e)},this.many=function(e,r){this.manyInternalRecord(e,r);},this.atLeastOne=function(e,r){this.atLeastOneInternalRecord(e,r);},this.ACTION=this.ACTION_RECORD,this.BACKTRACK=this.BACKTRACK_RECORD,this.LA=this.LA_RECORD;});}disableRecording(){this.RECORDING_PHASE=false,this.TRACE_INIT("Deleting Recording methods",()=>{let e=this;for(let r=0;r<10;r++){let n=r>0?r:"";delete e[`CONSUME${n}`],delete e[`SUBRULE${n}`],delete e[`OPTION${n}`],delete e[`OR${n}`],delete e[`MANY${n}`],delete e[`MANY_SEP${n}`],delete e[`AT_LEAST_ONE${n}`],delete e[`AT_LEAST_ONE_SEP${n}`];}delete e.consume,delete e.subrule,delete e.option,delete e.or,delete e.many,delete e.atLeastOne,delete e.ACTION,delete e.BACKTRACK,delete e.LA;});}ACTION_RECORD(e){}BACKTRACK_RECORD(e,r){return ()=>true}LA_RECORD(e){return Cr}topLevelRuleRecord(e,r){try{let n=new ge({definition:[],name:e});return n.name=e,this.recordingProdStack.push(n),r.call(this),this.recordingProdStack.pop(),n}catch(n){if(n.KNOWN_RECORDER_ERROR!==true)try{n.message=n.message+`
	 This error was thrown during the "grammar recording phase" For more info see:
	https://chevrotain.io/docs/guide/internals.html#grammar-recording`;}catch{throw n}throw n}}optionInternalRecord(e,r){return cn.call(this,G,e,r)}atLeastOneInternalRecord(e,r){cn.call(this,q,r,e);}atLeastOneSepFirstInternalRecord(e,r){cn.call(this,Q,r,e,hu);}manyInternalRecord(e,r){cn.call(this,k,r,e);}manySepFirstInternalRecord(e,r){cn.call(this,H,r,e,hu);}orInternalRecord(e,r){return IE.call(this,e,r)}subruleInternalRecord(e,r,n){if(Go(r),!e||E(e,"ruleName")===false){let s=new Error(`<SUBRULE${gu(r)}> argument is invalid expecting a Parser method reference but got: <${JSON.stringify(e)}>
 inside top level rule: <${this.recordingProdStack[0].name}>`);throw s.KNOWN_RECORDER_ERROR=true,s}let o=Xe(this.recordingProdStack),i=e.ruleName,a=new U({idx:r,nonTerminalName:i,label:n==null?void 0:n.LABEL,referencedRule:void 0});return o.definition.push(a),this.outputCst?AE:Ko}consumeInternalRecord(e,r,n){if(Go(r),!Ri(e)){let a=new Error(`<CONSUME${gu(r)}> argument is invalid expecting a TokenType reference but got: <${JSON.stringify(e)}>
 inside top level rule: <${this.recordingProdStack[0].name}>`);throw a.KNOWN_RECORDER_ERROR=true,a}let o=Xe(this.recordingProdStack),i=new b({idx:r,terminalType:e,label:n==null?void 0:n.LABEL});return o.definition.push(i),Tu}};function cn(t,e,r,n=false){Go(r);let o=Xe(this.recordingProdStack),i=he(e)?e:e.DEF,a=new t({definition:[],idx:r});return n&&(a.separator=e.SEP),E(e,"MAX_LOOKAHEAD")&&(a.maxLookahead=e.MAX_LOOKAHEAD),this.recordingProdStack.push(a),i.call(this),o.definition.push(a),this.recordingProdStack.pop(),Ko}function IE(t,e){Go(e);let r=Xe(this.recordingProdStack),n=I(t)===false,o=n===false?t:t.DEF,i=new z({definition:[],idx:e,ignoreAmbiguities:n&&t.IGNORE_AMBIGUITIES===true});E(t,"MAX_LOOKAHEAD")&&(i.maxLookahead=t.MAX_LOOKAHEAD);let a=Wr(o,s=>he(s.GATE));return i.hasPredicates=a,r.definition.push(i),x(o,s=>{let l=new D({definition:[]});i.definition.push(l),E(s,"IGNORE_AMBIGUITIES")?l.ignoreAmbiguities=s.IGNORE_AMBIGUITIES:E(s,"GATE")&&(l.ignoreAmbiguities=true),this.recordingProdStack.push(l),s.ALT.call(this),this.recordingProdStack.pop();}),Ko}function gu(t){return t===0?"":`${t}`}function Go(t){if(t<0||t>du){let e=new Error(`Invalid DSL Method idx value: <${t}>
	Idx value must be a none negative value smaller than ${du+1}`);throw e.KNOWN_RECORDER_ERROR=true,e}}var Wo=class{initPerformanceTracer(e){if(E(e,"traceInitPerf")){let r=e.traceInitPerf,n=typeof r=="number";this.traceInitMaxIdent=n?r:1/0,this.traceInitPerf=n?r>0:r;}else this.traceInitMaxIdent=0,this.traceInitPerf=Te.traceInitPerf;this.traceInitIndent=-1;}TRACE_INIT(e,r){if(this.traceInitPerf===true){this.traceInitIndent++;let n=new Array(this.traceInitIndent+1).join("	");this.traceInitIndent<this.traceInitMaxIdent&&console.log(`${n}--> <${e}>`);let{time:o,value:i}=Vr(r),a=o>10?console.warn:console.log;return this.traceInitIndent<this.traceInitMaxIdent&&a(`${n}<-- <${e}> time: ${o}ms`),this.traceInitIndent--,i}else return r()}};function Eu(t,e){e.forEach(r=>{let n=r.prototype;Object.getOwnPropertyNames(n).forEach(o=>{if(o==="constructor")return;let i=Object.getOwnPropertyDescriptor(n,o);i&&(i.get||i.set)?Object.defineProperty(t.prototype,o,i):t.prototype[o]=r.prototype[o];});});}var Cr=$t(Ue,"",NaN,NaN,NaN,NaN,NaN,NaN);Object.freeze(Cr);var Te=Object.freeze({recoveryEnabled:false,maxLookahead:3,dynamicTokensEnabled:false,outputCst:true,errorMessageProvider:go,nodeLocationTracking:"none",traceInitPerf:false,skipValidations:false}),br=Object.freeze({recoveryValueFunc:()=>{},resyncEnabled:true}),oe;(function(t){t[t.INVALID_RULE_NAME=0]="INVALID_RULE_NAME",t[t.DUPLICATE_RULE_NAME=1]="DUPLICATE_RULE_NAME",t[t.INVALID_RULE_OVERRIDE=2]="INVALID_RULE_OVERRIDE",t[t.DUPLICATE_PRODUCTIONS=3]="DUPLICATE_PRODUCTIONS",t[t.UNRESOLVED_SUBRULE_REF=4]="UNRESOLVED_SUBRULE_REF",t[t.LEFT_RECURSION=5]="LEFT_RECURSION",t[t.NONE_LAST_EMPTY_ALT=6]="NONE_LAST_EMPTY_ALT",t[t.AMBIGUOUS_ALTS=7]="AMBIGUOUS_ALTS",t[t.CONFLICT_TOKENS_RULES_NAMESPACE=8]="CONFLICT_TOKENS_RULES_NAMESPACE",t[t.INVALID_TOKEN_NAME=9]="INVALID_TOKEN_NAME",t[t.NO_NON_EMPTY_LOOKAHEAD=10]="NO_NON_EMPTY_LOOKAHEAD",t[t.AMBIGUOUS_PREFIX_ALTS=11]="AMBIGUOUS_PREFIX_ALTS",t[t.TOO_MANY_ALTS=12]="TOO_MANY_ALTS",t[t.CUSTOM_LOOKAHEAD_VALIDATION=13]="CUSTOM_LOOKAHEAD_VALIDATION";})(oe||(oe={}));var un=class t{static performSelfAnalysis(e){throw Error("The **static** `performSelfAnalysis` method has been deprecated.	\nUse the **instance** method with the same name instead.")}performSelfAnalysis(){this.TRACE_INIT("performSelfAnalysis",()=>{let e;this.selfAnalysisDone=true;let r=this.className;this.TRACE_INIT("toFastProps",()=>{jr(this);}),this.TRACE_INIT("Grammar Recording",()=>{try{this.enableRecording(),x(this.definedRulesNames,o=>{let a=this[o].originalGrammarAction,s;this.TRACE_INIT(`${o} Rule`,()=>{s=this.topLevelRuleRecord(o,a);}),this.gastProductionsCache[o]=s;});}finally{this.disableRecording();}});let n=[];if(this.TRACE_INIT("Grammar Resolving",()=>{n=nu({rules:P(this.gastProductionsCache)}),this.definitionErrors=this.definitionErrors.concat(n);}),this.TRACE_INIT("Grammar Validations",()=>{if(C(n)&&this.skipValidations===false){let o=ou({rules:P(this.gastProductionsCache),tokenTypes:P(this.tokensMap),errMsgProvider:De,grammarName:r}),i=qc({lookaheadStrategy:this.lookaheadStrategy,rules:P(this.gastProductionsCache),tokenTypes:P(this.tokensMap),grammarName:r});this.definitionErrors=this.definitionErrors.concat(o,i);}}),C(this.definitionErrors)&&(this.recoveryEnabled&&this.TRACE_INIT("computeAllProdsFollows",()=>{let o=fc(P(this.gastProductionsCache));this.resyncFollows=o;}),this.TRACE_INIT("ComputeLookaheadFunctions",()=>{var o,i;(i=(o=this.lookaheadStrategy).initialize)===null||i===void 0||i.call(o,{rules:P(this.gastProductionsCache)}),this.preComputeLookaheadFunctions(P(this.gastProductionsCache));})),!t.DEFER_DEFINITION_ERRORS_HANDLING&&!C(this.definitionErrors))throw e=d(this.definitionErrors,o=>o.message),new Error(`Parser Definition Errors detected:
 ${e.join(`
-------------------------------
`)}`)});}constructor(e,r){this.definitionErrors=[],this.selfAnalysisDone=false;let n=this;if(n.initErrorHandler(r),n.initLexerAdapter(),n.initLooksAhead(r),n.initRecognizerEngine(e,r),n.initRecoverable(r),n.initTreeBuilder(r),n.initContentAssist(),n.initGastRecorder(r),n.initPerformanceTracer(r),E(r,"ignoredIssues"))throw new Error(`The <ignoredIssues> IParserConfig property has been deprecated.
	Please use the <IGNORE_AMBIGUITIES> flag on the relevant DSL method instead.
	See: https://chevrotain.io/docs/guide/resolving_grammar_errors.html#IGNORING_AMBIGUITIES
	For further details.`);this.skipValidations=E(r,"skipValidations")?r.skipValidations:Te.skipValidations;}};un.DEFER_DEFINITION_ERRORS_HANDLING=false;Eu(un,[No,bo,Po,Mo,Fo,wo,Uo,Do,Bo,Wo]);var fn=class extends un{constructor(e,r=Te){let n=F(r);n.outputCst=true,super(e,n);}};var Hi=class{debug=false;enableDebug(){this.debug=true;}isDebug(){return this.debug}},Lr=new Hi;var SE=/]/,pn=h({name:"ArrayClose",pattern:SE,label:"]",pop_mode:true});var RE=/\[/,mn=h({name:"ArrayOpen",pattern:RE,label:"[",push_mode:"Array"});var OE=/,/,hn=h({name:"Comma",pattern:OE,label:","});var dn=h({name:"ArrayTableClose",pattern:/]]/,label:"]]",push_mode:"Value"});var gn=h({name:"ArrayTableOpen",pattern:/\[\[/,label:"[["});var $o=new Map,Qe=(t,e,r)=>{let n=$o[e.tokenType.name];if(n)return n(t,e,r)},v=(t,e)=>{$o[t.name]=e;};var Ze=h({name:"Boolean",pattern:L.NA});v(Ze,Qe);var Je=/[ \t]/,et=/[\x80-\uD7FF]|[\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]/,Ee=/\r\n|\n/,Tn=/"/,zi=/\\/,Oe=/[0-9]/,Xi=ie__default.default.build("{{digit}}|[A-Fa-f]",{digit:Oe}),NE=ie__default.default.build('["\\\\bfnrt]|u{{hexDigit}}{4}|U{{hexDigit}}{8}',{hexDigit:Xi}),Vo=ie__default.default.build("{{escape}}{{escapeSeqChar}}",{escape:zi,escapeSeqChar:NE}),En=/'/,Ht=/_/,jo=/-/,Ho=/\+/,_E=/[1-9]/,CE=ie__default.default.build("{{digit1_9}}({{digit}}|{{underscore}}{{digit}})+|{{digit}}",{digit1_9:_E,digit:Oe,underscore:Ht}),zo=ie__default.default.build("({{minus}}|{{plus}})?{{unsignedDecimalInteger}}",{minus:jo,plus:Ho,unsignedDecimalInteger:CE});var Me=class extends Error{constructor(e){super(e),this.name="SyntaxParseError";}},Xo=class extends Me{errors;constructor(e){super(`Syntax error
`+e.map(r=>r.message).join(`
`)),this.errors=e;}},Yo=class extends Me{errors;constructor(e){super(`Syntax error
`+e.map(r=>r.message).join(`
`)),this.errors=e;}},qo=class extends Me{constructor(e){super(e);}};var Au=ie__default.default.build("{{digit}}{4}",{digit:Oe}),Iu=ie__default.default.build("{{digit}}{2}",{digit:Oe}),yu=ie__default.default.build("{{digit}}{2}",{digit:Oe}),Su=/[Tt ]/,Yi=ie__default.default.build("{{digit}}{2}",{digit:Oe}),qi=ie__default.default.build("{{digit}}{2}",{digit:Oe}),Ru=ie__default.default.build("{{digit}}{2}",{digit:Oe}),bE=ie__default.default.build("\\.{{digit}}+",{digit:Oe}),LE=ie__default.default.build("[+-]{{timeHour}}:{{timeMinute}}",{timeHour:Yi,timeMinute:qi}),vE=ie__default.default.build("[Zz]|{{timeNumOffset}}",{timeNumOffset:LE}),Qi=ie__default.default.build("{{timeHour}}:{{timeMinute}}:{{timeSecond}}{{timeSecFrac}}?",{timeHour:Yi,timeMinute:qi,timeSecond:Ru,timeSecFrac:bE}),Zi=ie__default.default.build("{{dateFullYear}}-{{dateMonth}}-{{dateMDay}}",{dateFullYear:Au,dateMonth:Iu,dateMDay:yu}),kE=ie__default.default.build("{{partialTime}}{{timeOffset}}",{partialTime:Qi,timeOffset:vE}),PE=ie__default.default.build("{{fullDate}}{{timeDelim}}{{fullTime}}",{fullDate:Zi,timeDelim:Su,fullTime:kE}),ME=ie__default.default.build("{{fullDate}}{{timeDelim}}{{partialTime}}",{fullDate:Zi,timeDelim:Su,partialTime:Qi}),wE=Zi,Ou=Qi,FE=ie__default.default.build("{{offsetDateTime}}|{{localDateTime}}|{{localDate}}|{{localTime}}",{offsetDateTime:PE,localDateTime:ME,localDate:wE,localTime:Ou}),kt=h({name:"DateTime",pattern:FE}),UE=t=>{let e=ie__default.default.build("({{dateFullYear}})-({{dateMonth}})-({{dateMDay}})",{dateFullYear:Au,dateMonth:Iu,dateMDay:yu}),r=ie__default.default.exec(t,e);if(r){let n=Number(r[1]),o=Number(r[2]),i=Number(r[3]),a=new Date(n,o-1,i);return a.getFullYear()===n&&a.getMonth()+1===o&&a.getDate()===i}return  true},DE=t=>{let e=ie__default.default.build("({{timeHour}}):({{timeMinute}}):({{timeSecond}})",{timeHour:Yi,timeMinute:qi,timeSecond:Ru}),r=ie__default.default.exec(t,e);if(r){let n=Number(r[1]),o=Number(r[2]),i=Number(r[3]),a=new Date(0,0,0,n,o,i);return a.getHours()===n&&a.getMinutes()===o&&a.getSeconds()===i}return  true},BE=t=>UE(t)&&DE(t);v(kt,t=>{var r;if(!BE(t))throw new Me(`Invalid date time: ${t}`);return ((r=t.match(Ou))==null?void 0:r.index)===0?t:new Date(t)});var An=h({name:"DotSeparator",pattern:/\./,label:"."});var vr=h({name:"ExpressionNewLine",pattern:Ee});var GE=zo,Nu=ie__default.default.build("{{digit}}({{digit}}|{{underscore}}{{digit}})*",{digit:Oe,underscore:Ht}),KE=ie__default.default.build("({{minus}}|{{plus}})?{{zeroPrefixableInt}}",{minus:jo,plus:Ho,zeroPrefixableInt:Nu}),WE=ie__default.default.build("[Ee]{{floatExpPart}}",{floatExpPart:KE}),$E=/\./,VE=ie__default.default.build("{{decimalPoint}}{{zeroPrefixableInt}}",{decimalPoint:$E,zeroPrefixableInt:Nu}),jE=/inf/,HE=/nan/,zE=ie__default.default.build("({{minus}}|{{plus}})?({{inf}}|{{nan}})",{minus:jo,plus:Ho,inf:jE,nan:HE}),XE=ie__default.default.build("{{floatIntPart}}({{exp}}|{{frac}}{{exp}}?)|{{specialFloat}}",{floatIntPart:GE,exp:WE,frac:VE,specialFloat:zE}),Pt=h({name:"Float",pattern:XE}),YE=t=>t==="inf"||t==="+inf"?1/0:t==="-inf"?-1/0:t==="nan"||t==="+nan"||t==="-nan"?NaN:null;v(Pt,t=>{let e=YE(t);if(e!==null)return e;let r=t.replace(/_/g,"");return parseFloat(r)});var qE=/}/,Pr=h({name:"InlineTableClose",pattern:qE,label:"}",pop_mode:true});var QE=/{/,In=h({name:"InlineTableOpen",pattern:QE,label:"{",push_mode:"InlineTable"});var ZE=/,/,yn=h({name:"InlineTableSep",pattern:ZE,label:",",pop_mode:true,push_mode:"InlineTable"});var tt=h({name:"Integer",pattern:L.NA});v(tt,Qe);var zt=h({name:"KeyValueSeparator",pattern:/=/,label:"=",push_mode:"Value"});var Sn=h({name:"Newline",pattern:Ee,pop_mode:true});var Ae=h({name:"SimpleKey",pattern:L.NA});v(Ae,Qe);var Rn=h({name:"StdTableClose",pattern:/]/,label:"]",push_mode:"Value"});var On=h({name:"StdTableOpen",pattern:/\[/,label:"["});var Ne=h({name:"String",pattern:L.NA});v(Ne,Qe);var eA=ie__default.default.build("{{whiteSpaceChar}}+",{whiteSpaceChar:Je}),Ji=h({name:"WhiteSpace",pattern:eA,group:L.SKIPPED});var tA=ie__default.default.build("^{{whiteSpaceChar}}*{{newline}}(?:{{whiteSpaceChar}}|{{newline}})*",{whiteSpaceChar:Je,newline:Ee}),rA=t=>{let e=ie__default.default.exec(t,tA);return e?e[0].length:0},Qo=t=>{let e="";for(let r=0;r<t.length;r++){let n=t[r];if(n==="\\"){r++;let o=rA(t.slice(r));if(o>0){r+=o-1;continue}switch(t[r]){case "b":e+="\b";break;case "t":e+="	";break;case "n":e+=`
`;break;case "f":e+="\f";break;case "r":e+="\r";break;case '"':e+='"';break;case "\\":e+="\\";break;case "u":{let i=t.slice(r+1,r+5),a=parseInt(i,16);if(a>55295&&a<57344)throw new Me(`Invalid Unicode code point: \\u${i}`);e+=String.fromCodePoint(a),r+=4;break}case "U":{let i=t.slice(r+1,r+9),a=parseInt(i,16);if(a>1114111)throw new Me(`Invalid Unicode code point: \\U${i}`);e+=String.fromCodePoint(a),r+=8;break}case t.match(/^[0-7]{1,3}$/):}}else e+=n;}return e},Zo=t=>t.substring(3,t.length-3).replace(/^(\r\n|\n)/,"");var nA=ie__default.default.build("{{quotationMark}}{3}",{quotationMark:Tn}),oA=ie__default.default.build("{{whiteSpaceChar}}|!|[#-\\x5B]|[\\x5D-~]|{{nonAscii}}",{whiteSpaceChar:Je,nonAscii:et}),iA=ie__default.default.build("{{multiLineBasicUnescaped}}|{{escaped}}",{multiLineBasicUnescaped:oA,escaped:Vo}),aA=ie__default.default.build("{{whiteSpaceChar}}*",{whiteSpaceChar:Je}),sA=ie__default.default.build("{{escape}}{{whiteSpace}}{{newline}}({{whiteSpaceChar}}|{{newline}})*",{escape:zi,whiteSpace:aA,newline:Ee,whiteSpaceChar:Je}),lA=ie__default.default.build("{{multiLineBasicChar}}|{{newline}}|{{multiLineBasicEscapedNewline}}",{multiLineBasicChar:iA,newline:Ee,multiLineBasicEscapedNewline:sA}),cA=ie__default.default.build("{{quotationMark}}{1,2}",{quotationMark:Tn}),uA=ie__default.default.build("{{multiLineBasicContent}}*({{multiLineBasicQuotes}}{{multiLineBasicContent}}+)*{{multiLineBasicQuotes}}?",{multiLineBasicContent:lA,multiLineBasicQuotes:cA}),ea=h({name:"MultiLineBasicString",pattern:ie__default.default.build("{{multiLineBasicStringDelimiter}}{{newline}}?{{multiLineBasicBody}}{{multiLineBasicStringDelimiter}}",{multiLineBasicStringDelimiter:nA,newline:Ee,multiLineBasicBody:uA}),label:'"""MultiLineBasicString"""',categories:[Ne],line_breaks:true});v(ea,t=>{let e=Zo(t);return Qo(e)});var fA=ie__default.default.build("{{apostrophe}}{3}",{apostrophe:En}),pA=ie__default.default.build("	|[ -&]|[\\x28-~]|{{nonAscii}}",{nonAscii:et}),mA=ie__default.default.build("{{multiLineLiteralChar}}|{{newline}}",{multiLineLiteralChar:pA,newline:Ee}),hA=ie__default.default.build("{{apostrophe}}{1,2}",{apostrophe:En}),dA=ie__default.default.build("{{multiLineLiteralContent}}*({{multiLineLiteralQuotes}}{{multiLineLiteralContent}}+)*{{multiLineLiteralQuotes}}?",{multiLineLiteralContent:mA,multiLineLiteralQuotes:hA}),ta=h({name:"MultiLineLiteralString",pattern:ie__default.default.build("{{multiLineLiteralStringDelimiter}}{{newline}}?{{multiLineLiteralBody}}{{multiLineLiteralStringDelimiter}}",{multiLineLiteralStringDelimiter:fA,newline:Ee,multiLineLiteralBody:dA}),label:"'''MultiLineLiteralString'''",categories:[Ne],line_breaks:true});v(ta,Zo);var Nn=h({name:"QuotedKey",pattern:L.NA,categories:[Ae]});v(Nn,Qe);var gA=ie__default.default.build("{{whiteSpaceChar}}|!|[#-\\x5B]|[\\x5D-~]|{{nonAscii}}",{whiteSpaceChar:Je,nonAscii:et}),xA=ie__default.default.build("{{basicUnescaped}}|{{escaped}}",{basicUnescaped:gA,escaped:Vo}),Jo=h({name:"BasicString",pattern:ie__default.default.build("{{quotationMark}}{{basicChar}}*{{quotationMark}}",{quotationMark:Tn,basicChar:xA}),label:'"BasicString"',categories:[Nn,Ne]});v(Jo,t=>{let e=t.slice(1,-1);return Qo(e)});var TA=ie__default.default.build("	|[ -&]|[\\x28-~]|{{nonAscii}}",{nonAscii:et}),ei=h({name:"LiteralString",pattern:ie__default.default.build("{{apostrophe}}{{literalChar}}*{{apostrophe}}",{apostrophe:En,literalChar:TA}),label:"'LiteralString'",categories:[Nn,Ne]});v(ei,t=>t.slice(1,-1));var EA=/0x/,AA=/0o/,IA=/0b/,yA=/[0-7]/,SA=/[01]/,RA=ie__default.default.build("{{hexPrefix}}{{hexDigit}}({{hexDigit}}|{{underscore}}{{hexDigit}})*",{hexPrefix:EA,hexDigit:Xi,underscore:Ht}),OA=ie__default.default.build("{{octPrefix}}{{digit0_7}}({{digit0_7}}|{{underscore}}{{digit0_7}})*",{octPrefix:AA,digit0_7:yA,underscore:Ht}),NA=ie__default.default.build("{{binPrefix}}{{digit0_1}}({{digit0_1}}|{{underscore}}{{digit0_1}})*",{binPrefix:IA,digit0_1:SA,underscore:Ht}),_A=ie__default.default.build("{{hexInteger}}|{{octalInteger}}|{{binaryInteger}}",{hexInteger:RA,octalInteger:OA,binaryInteger:NA}),na=h({name:"NonDecimalInteger",pattern:_A,categories:[tt]}),CA=(t,e)=>{let r=BigInt(0);for(let n=0;n<t.length;n++){let o=t[n],i=parseInt(o,e);r=r*BigInt(e)+BigInt(i);}return r},bA=t=>{if(t.startsWith("0x"))return 16;if(t.startsWith("0o"))return 8;if(t.startsWith("0b"))return 2};v(na,t=>{let r=t.replace(/_/g,"").slice(2),n=bA(t),o=parseInt(r,n);return Number.isSafeInteger(o)?o:CA(r,n)});var oa=h({name:"DecimalInteger",pattern:zo,categories:[tt]});v(oa,t=>{let e=t.replace(/_/g,""),r=parseInt(e);return Number.isSafeInteger(r)?r||0:BigInt(e)});var vA=/[a-zA-Z]/,kA=ie__default.default.build("({{alpha}}|{{digit}}|-|_)+",{alpha:vA,digit:Oe}),ia=h({name:"UnquotedKey",pattern:kA,categories:[Ae]});v(ia,t=>t);var PA=/#/,MA=ie__default.default.build("	|[ -~]|{{nonAscii}}",{nonAscii:et}),wA=ie__default.default.build("{{commentStartChar}}{{nonEol}}*",{commentStartChar:PA,nonEol:MA}),aa=h({name:"Comment",pattern:wA,group:"comment"});var FA=/true/,sa=h({name:"True",pattern:FA,label:"true",categories:[Ze]});v(sa,()=>true);var UA=/false/,la=h({name:"False",pattern:UA,label:"false",categories:[Ze]});v(la,()=>false);var Lu=h({name:"IgnoredNewline",pattern:Ee,group:L.SKIPPED});var vu=h({name:"InlineTableKeyValSep",pattern:/=/,label:"=",push_mode:"Value",pop_mode:true,categories:[zt]});var ku=[Ji,Jo,ei,ia,An,Ae],Pu=[Ji,ea,ta,Jo,ei,sa,la,kt,Pt,na,oa,mn,In,aa],_n={modes:{Key:[aa,vr,zt,gn,dn,On,Rn,...ku],Value:[...Pu,Sn,yn,Pr],Array:[...Pu,Lu,hn,pn],InlineTable:[...ku,vu,Pr]},defaultMode:"Key"};var Mu=new L(_n,{ensureOptimizations:true,skipValidations:!Lr.isDebug(),traceInitPerf:Lr.isDebug()});var ca=class extends fn{toml=this.RULE("toml",()=>{this.MANY(()=>this.CONSUME(vr)),this.MANY1(()=>{this.SUBRULE1(this.expression),this.OPTION2(()=>{this.CONSUME1(Sn),this.MANY3(()=>this.CONSUME2(vr));});});});valueCache;dottedKey=this.RULE("dottedKey",()=>{this.CONSUME(Ae),this.AT_LEAST_ONE(()=>{this.CONSUME(An),this.CONSUME1(Ae);});});key=this.RULE("key",()=>{this.OR({MAX_LOOKAHEAD:2,DEF:[{ALT:()=>this.SUBRULE(this.dottedKey)},{ALT:()=>this.CONSUME(Ae)}]});});inlineTableKeyValues=this.RULE("inlineTableKeyValues",()=>{this.MANY_SEP({SEP:yn,DEF:()=>this.SUBRULE(this.keyValue)});});inlineTable=this.RULE("inlineTable",()=>{this.CONSUME(In),this.OPTION(()=>this.SUBRULE(this.inlineTableKeyValues)),this.CONSUME(Pr);});array=this.RULE("array",()=>{this.CONSUME(mn),this.OPTION(()=>this.SUBRULE(this.arrayValues)),this.CONSUME(pn);});value=this.RULE("value",()=>{this.OR(this.valueCache||(this.valueCache=[{ALT:()=>this.CONSUME(Ne)},{ALT:()=>this.CONSUME(Ze)},{ALT:()=>this.SUBRULE(this.array)},{ALT:()=>this.SUBRULE(this.inlineTable)},{ALT:()=>this.CONSUME(kt)},{ALT:()=>this.CONSUME(Pt)},{ALT:()=>this.CONSUME(tt)}]));});keyValue=this.RULE("keyValue",()=>{this.SUBRULE(this.key),this.CONSUME(zt),this.SUBRULE(this.value);});arrayValues=this.RULE("arrayValues",()=>{this.SUBRULE(this.value);let e=true;this.MANY({GATE:()=>e,DEF:()=>{this.CONSUME(hn),this.OPTION(()=>this.SUBRULE1(this.value))||(e=false);}});});stdTable=this.RULE("stdTable",()=>{this.CONSUME(On),this.SUBRULE(this.key),this.CONSUME(Rn);});arrayTable=this.RULE("arrayTable",()=>{this.CONSUME(gn),this.SUBRULE(this.key),this.CONSUME(dn);});table=this.RULE("table",()=>{this.OR([{ALT:()=>this.SUBRULE(this.stdTable)},{ALT:()=>this.SUBRULE(this.arrayTable)}]);});expression=this.RULE("expression",()=>{this.OR([{ALT:()=>this.SUBRULE(this.keyValue)},{ALT:()=>this.SUBRULE(this.table)}]);});constructor(){super(_n,{traceInitPerf:Lr.isDebug(),maxLookahead:1,skipValidations:!Lr.isDebug()}),this.performSelfAnalysis();}},Xt=new ca;var wu=t=>t&&(t.constructor===Object||t.constructor===void 0),ri=()=>Object.create(null),ua=(t,e)=>{try{return t()}catch(r){if(r instanceof Mt)throw new qo(e)}},Mt=class extends Error{},DA=Xt.getBaseCstVisitorConstructor(),fa=Symbol("explicitlyDeclared"),Fu=Symbol("implicitlyDeclared"),Cn=Symbol("notEditable"),pa=class extends DA{constructor(){super(),this.validateVisitor();}toml(e){var o;let r=ri(),n=r;return (o=e.expression)==null||o.forEach(i=>n=this.visit(i,{current:n,root:r})),this.cleanInternalProperties(r),r}expression(e,{current:r,root:n}){if(e.keyValue)return this.visit(e.keyValue,r),r;if(e.table)return this.visit(e.table,n)}keyValue(e,r){let n=this.visit(e.key),o=this.visit(e.value);ua(()=>this.assignValue(n,o,r),`Cannot assign value to '${n.join(".")}'`);}key(e){return e.dottedKey?this.visit(e.dottedKey):[this.interpret(e,Ae)]}dottedKey(e){return this.interpret(e,Ae)}inlineTableKeyValues(e,r){e.keyValue&&e.keyValue.forEach(n=>this.visit(n,r));}inlineTable(e){let r=ri();return r[Cn]=true,e.inlineTableKeyValues&&this.visit(e.inlineTableKeyValues,r),r}value(e){return e.array?this.visit(e.array):e.inlineTable?this.visit(e.inlineTable):this.interpret(e,Ne,Pt,Ze,kt,tt)}arrayValues(e,r){return e.value.forEach(n=>r.push(this.visit(n))),r}array(e){let r=[];return r[Cn]=true,e.arrayValues?this.visit(e.arrayValues,r):r}table(e,r){if(e.stdTable)return this.visit(e.stdTable,r);if(e.arrayTable)return this.visit(e.arrayTable,r)}stdTable(e,r){let n=this.visit(e.key);return ua(()=>this.createTable(n,r),`Cannot create table '${n.join(".")}'`)}arrayTable(e,r){let n=this.visit(e.key);return ua(()=>{let o=this.getOrCreateArray(n,r);if(o[Cn])throw new Mt;let i=ri();return o.push(i),i},`Cannot create array table '${n.join(".")}'`)}cleanInternalProperties(e){for(let r of Object.getOwnPropertySymbols(e))delete e[r];for(let r in e)typeof e[r]=="object"&&this.cleanInternalProperties(e[r]),Array.isArray(e[r])&&e[r].forEach(n=>this.cleanInternalProperties(n));}interpret(e,...r){for(let n of r)if(e[n.name]){let o=e[n.name].map(i=>$o[n.name](i.image,i,n.name));return o.length===1?o[0]:o}}assignPrimitiveValue(e,r,n){if(e in n)throw new Mt;return wu(r)&&(r[fa]=true),n[e]=r,n}tryCreatingObject(e,r,n,o,i){if(r[e]){if(!wu(r[e])||!i&&r[e][fa]||!o&&r[e][Fu]||r[e][Cn])throw new Mt}else r[e]=ri(),n&&(r[e][n]=true);return r[e]}assignValue(e,r,n){let[o,...i]=e;return i.length>0?(this.tryCreatingObject(o,n,Fu,true,false),this.assignValue(i,r,n[o])):this.assignPrimitiveValue(o,r,n)}createTable(e,r){let[n,...o]=e;if(o.length>0){if(Array.isArray(r[n])){if(r[n][Cn])throw new Mt;let i=r[n][r[n].length-1];return this.createTable(o,i)}return this.tryCreatingObject(n,r,null,true,true),this.createTable(o,r[n])}return this.tryCreatingObject(n,r,fa,false,false)}getOrCreateArray(e,r){let[n,...o]=e;if(o.length>0){if(Array.isArray(r[n])){let i=r[n][r[n].length-1];return this.getOrCreateArray(o,i)}return this.tryCreatingObject(n,r,null,true,true),this.getOrCreateArray(o,r[n])}if(r[n]&&!Array.isArray(r[n]))throw new Mt;return r[n]=r[n]||[],r[n]}},Uu=new pa;var Du=t=>{let e=Mu.tokenize(t);if(e.errors.length>0)throw new Xo(e.errors);Xt.input=e.tokens;let r=Xt.toml();if(Xt.errors.length>0)throw new Yo(Xt.errors);return Uu.visit(r)};/*! Bundled license information:

	lodash-es/lodash.js:
	  (**
	   * @license
	   * Lodash (Custom Build) <https://lodash.com/>
	   * Build: `lodash modularize exports="es" -o ./`
	   * Copyright OpenJS Foundation and other contributors <https://openjsf.org/>
	   * Released under MIT license <https://lodash.com/license>
	   * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
	   * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
	   *)
	*/exports.SyntaxParseError=Me;exports.load=Du; 
} (dist, dist.exports));

var distExports = dist.exports;

var toml$1 = {};

var parse = {exports: {}};

var tomlParser = {exports: {}};

const ParserEND = 0x110000;
class ParserError extends Error {
  /* istanbul ignore next */
  constructor (msg, filename, linenumber) {
    super('[ParserError] ' + msg, filename, linenumber);
    this.name = 'ParserError';
    this.code = 'ParserError';
    if (Error.captureStackTrace) Error.captureStackTrace(this, ParserError);
  }
}
class State {
  constructor (parser) {
    this.parser = parser;
    this.buf = '';
    this.returned = null;
    this.result = null;
    this.resultTable = null;
    this.resultArr = null;
  }
}
class Parser {
  constructor () {
    this.pos = 0;
    this.col = 0;
    this.line = 0;
    this.obj = {};
    this.ctx = this.obj;
    this.stack = [];
    this._buf = '';
    this.char = null;
    this.ii = 0;
    this.state = new State(this.parseStart);
  }

  parse (str) {
    /* istanbul ignore next */
    if (str.length === 0 || str.length == null) return

    this._buf = String(str);
    this.ii = -1;
    this.char = -1;
    let getNext;
    while (getNext === false || this.nextChar()) {
      getNext = this.runOne();
    }
    this._buf = null;
  }
  nextChar () {
    if (this.char === 0x0A) {
      ++this.line;
      this.col = -1;
    }
    ++this.ii;
    this.char = this._buf.codePointAt(this.ii);
    ++this.pos;
    ++this.col;
    return this.haveBuffer()
  }
  haveBuffer () {
    return this.ii < this._buf.length
  }
  runOne () {
    return this.state.parser.call(this, this.state.returned)
  }
  finish () {
    this.char = ParserEND;
    let last;
    do {
      last = this.state.parser;
      this.runOne();
    } while (this.state.parser !== last)

    this.ctx = null;
    this.state = null;
    this._buf = null;

    return this.obj
  }
  next (fn) {
    /* istanbul ignore next */
    if (typeof fn !== 'function') throw new ParserError('Tried to set state to non-existent state: ' + JSON.stringify(fn))
    this.state.parser = fn;
  }
  goto (fn) {
    this.next(fn);
    return this.runOne()
  }
  call (fn, returnWith) {
    if (returnWith) this.next(returnWith);
    this.stack.push(this.state);
    this.state = new State(fn);
  }
  callNow (fn, returnWith) {
    this.call(fn, returnWith);
    return this.runOne()
  }
  return (value) {
    /* istanbul ignore next */
    if (this.stack.length === 0) throw this.error(new ParserError('Stack underflow'))
    if (value === undefined) value = this.state.buf;
    this.state = this.stack.pop();
    this.state.returned = value;
  }
  returnNow (value) {
    this.return(value);
    return this.runOne()
  }
  consume () {
    /* istanbul ignore next */
    if (this.char === ParserEND) throw this.error(new ParserError('Unexpected end-of-buffer'))
    this.state.buf += this._buf[this.ii];
  }
  error (err) {
    err.line = this.line;
    err.col = this.col;
    err.pos = this.pos;
    return err
  }
  /* istanbul ignore next */
  parseStart () {
    throw new ParserError('Must declare a parseStart method')
  }
}
Parser.END = ParserEND;
Parser.Error = ParserError;
var parser = Parser;

var createDatetime = value => {
  const date = new Date(value);
  /* istanbul ignore if */
  if (isNaN(date)) {
    throw new TypeError('Invalid Datetime')
  } else {
    return date
  }
};

var formatNum = (d, num) => {
  num = String(num);
  while (num.length < d) num = '0' + num;
  return num
};

const f$2 = formatNum;

class FloatingDateTime extends Date {
  constructor (value) {
    super(value + 'Z');
    this.isFloating = true;
  }
  toISOString () {
    const date = `${this.getUTCFullYear()}-${f$2(2, this.getUTCMonth() + 1)}-${f$2(2, this.getUTCDate())}`;
    const time = `${f$2(2, this.getUTCHours())}:${f$2(2, this.getUTCMinutes())}:${f$2(2, this.getUTCSeconds())}.${f$2(3, this.getUTCMilliseconds())}`;
    return `${date}T${time}`
  }
}

var createDatetimeFloat = value => {
  const date = new FloatingDateTime(value);
  /* istanbul ignore if */
  if (isNaN(date)) {
    throw new TypeError('Invalid Datetime')
  } else {
    return date
  }
};

const f$1 = formatNum;
const DateTime = commonjsGlobal.Date;

let Date$1 = class Date extends DateTime {
  constructor (value) {
    super(value);
    this.isDate = true;
  }
  toISOString () {
    return `${this.getUTCFullYear()}-${f$1(2, this.getUTCMonth() + 1)}-${f$1(2, this.getUTCDate())}`
  }
};

var createDate$1 = value => {
  const date = new Date$1(value);
  /* istanbul ignore if */
  if (isNaN(date)) {
    throw new TypeError('Invalid Datetime')
  } else {
    return date
  }
};

const f = formatNum;

class Time extends Date {
  constructor (value) {
    super(`0000-01-01T${value}Z`);
    this.isTime = true;
  }
  toISOString () {
    return `${f(2, this.getUTCHours())}:${f(2, this.getUTCMinutes())}:${f(2, this.getUTCSeconds())}.${f(3, this.getUTCMilliseconds())}`
  }
}

var createTime$1 = value => {
  const date = new Time(value);
  /* istanbul ignore if */
  if (isNaN(date)) {
    throw new TypeError('Invalid Datetime')
  } else {
    return date
  }
};

/* eslint-disable no-new-wrappers, no-eval, camelcase, operator-linebreak */
tomlParser.exports = makeParserClass(parser);
tomlParser.exports.makeParserClass = makeParserClass;

class TomlError extends Error {
  constructor (msg) {
    super(msg);
    this.name = 'TomlError';
    /* istanbul ignore next */
    if (Error.captureStackTrace) Error.captureStackTrace(this, TomlError);
    this.fromTOML = true;
    this.wrapped = null;
  }
}
TomlError.wrap = err => {
  const terr = new TomlError(err.message);
  terr.code = err.code;
  terr.wrapped = err;
  return terr
};
tomlParser.exports.TomlError = TomlError;

const createDateTime = createDatetime;
const createDateTimeFloat = createDatetimeFloat;
const createDate = createDate$1;
const createTime = createTime$1;

const CTRL_I = 0x09;
const CTRL_J = 0x0A;
const CTRL_M = 0x0D;
const CTRL_CHAR_BOUNDARY = 0x1F; // the last non-character in the latin1 region of unicode, except DEL
const CHAR_SP = 0x20;
const CHAR_QUOT = 0x22;
const CHAR_NUM = 0x23;
const CHAR_APOS = 0x27;
const CHAR_PLUS = 0x2B;
const CHAR_COMMA = 0x2C;
const CHAR_HYPHEN = 0x2D;
const CHAR_PERIOD = 0x2E;
const CHAR_0 = 0x30;
const CHAR_1 = 0x31;
const CHAR_7 = 0x37;
const CHAR_9 = 0x39;
const CHAR_COLON = 0x3A;
const CHAR_EQUALS = 0x3D;
const CHAR_A = 0x41;
const CHAR_E = 0x45;
const CHAR_F = 0x46;
const CHAR_T = 0x54;
const CHAR_U = 0x55;
const CHAR_Z = 0x5A;
const CHAR_LOWBAR = 0x5F;
const CHAR_a = 0x61;
const CHAR_b = 0x62;
const CHAR_e = 0x65;
const CHAR_f = 0x66;
const CHAR_i = 0x69;
const CHAR_l = 0x6C;
const CHAR_n = 0x6E;
const CHAR_o = 0x6F;
const CHAR_r = 0x72;
const CHAR_s = 0x73;
const CHAR_t = 0x74;
const CHAR_u = 0x75;
const CHAR_x = 0x78;
const CHAR_z = 0x7A;
const CHAR_LCUB = 0x7B;
const CHAR_RCUB = 0x7D;
const CHAR_LSQB = 0x5B;
const CHAR_BSOL = 0x5C;
const CHAR_RSQB = 0x5D;
const CHAR_DEL = 0x7F;
const SURROGATE_FIRST = 0xD800;
const SURROGATE_LAST = 0xDFFF;

const escapes = {
  [CHAR_b]: '\u0008',
  [CHAR_t]: '\u0009',
  [CHAR_n]: '\u000A',
  [CHAR_f]: '\u000C',
  [CHAR_r]: '\u000D',
  [CHAR_QUOT]: '\u0022',
  [CHAR_BSOL]: '\u005C'
};

function isDigit (cp) {
  return cp >= CHAR_0 && cp <= CHAR_9
}
function isHexit (cp) {
  return (cp >= CHAR_A && cp <= CHAR_F) || (cp >= CHAR_a && cp <= CHAR_f) || (cp >= CHAR_0 && cp <= CHAR_9)
}
function isBit (cp) {
  return cp === CHAR_1 || cp === CHAR_0
}
function isOctit (cp) {
  return (cp >= CHAR_0 && cp <= CHAR_7)
}
function isAlphaNumQuoteHyphen (cp) {
  return (cp >= CHAR_A && cp <= CHAR_Z)
      || (cp >= CHAR_a && cp <= CHAR_z)
      || (cp >= CHAR_0 && cp <= CHAR_9)
      || cp === CHAR_APOS
      || cp === CHAR_QUOT
      || cp === CHAR_LOWBAR
      || cp === CHAR_HYPHEN
}
function isAlphaNumHyphen (cp) {
  return (cp >= CHAR_A && cp <= CHAR_Z)
      || (cp >= CHAR_a && cp <= CHAR_z)
      || (cp >= CHAR_0 && cp <= CHAR_9)
      || cp === CHAR_LOWBAR
      || cp === CHAR_HYPHEN
}
const _type = Symbol('type');
const _declared = Symbol('declared');

const hasOwnProperty = Object.prototype.hasOwnProperty;
const defineProperty = Object.defineProperty;
const descriptor = {configurable: true, enumerable: true, writable: true, value: undefined};

function hasKey (obj, key) {
  if (hasOwnProperty.call(obj, key)) return true
  if (key === '__proto__') defineProperty(obj, '__proto__', descriptor);
  return false
}

const INLINE_TABLE = Symbol('inline-table');
function InlineTable () {
  return Object.defineProperties({}, {
    [_type]: {value: INLINE_TABLE}
  })
}
function isInlineTable (obj) {
  if (obj === null || typeof (obj) !== 'object') return false
  return obj[_type] === INLINE_TABLE
}

const TABLE = Symbol('table');
function Table () {
  return Object.defineProperties({}, {
    [_type]: {value: TABLE},
    [_declared]: {value: false, writable: true}
  })
}
function isTable (obj) {
  if (obj === null || typeof (obj) !== 'object') return false
  return obj[_type] === TABLE
}

const _contentType = Symbol('content-type');
const INLINE_LIST = Symbol('inline-list');
function InlineList (type) {
  return Object.defineProperties([], {
    [_type]: {value: INLINE_LIST},
    [_contentType]: {value: type}
  })
}
function isInlineList (obj) {
  if (obj === null || typeof (obj) !== 'object') return false
  return obj[_type] === INLINE_LIST
}

const LIST = Symbol('list');
function List () {
  return Object.defineProperties([], {
    [_type]: {value: LIST}
  })
}
function isList (obj) {
  if (obj === null || typeof (obj) !== 'object') return false
  return obj[_type] === LIST
}

// in an eval, to let bundlers not slurp in a util proxy
let _custom;
try {
  const utilInspect = eval("require('util').inspect");
  _custom = utilInspect.custom;
} catch (_) {
  /* eval require not available in transpiled bundle */
}
/* istanbul ignore next */
const _inspect = _custom || 'inspect';

class BoxedBigInt {
  constructor (value) {
    try {
      this.value = commonjsGlobal.BigInt.asIntN(64, value);
    } catch (_) {
      /* istanbul ignore next */
      this.value = null;
    }
    Object.defineProperty(this, _type, {value: INTEGER});
  }
  isNaN () {
    return this.value === null
  }
  /* istanbul ignore next */
  toString () {
    return String(this.value)
  }
  /* istanbul ignore next */
  [_inspect] () {
    return `[BigInt: ${this.toString()}]}`
  }
  valueOf () {
    return this.value
  }
}

const INTEGER = Symbol('integer');
function Integer (value) {
  let num = Number(value);
  // -0 is a float thing, not an int thing
  if (Object.is(num, -0)) num = 0;
  /* istanbul ignore else */
  if (commonjsGlobal.BigInt && !Number.isSafeInteger(num)) {
    return new BoxedBigInt(value)
  } else {
    /* istanbul ignore next */
    return Object.defineProperties(new Number(num), {
      isNaN: {value: function () { return isNaN(this) }},
      [_type]: {value: INTEGER},
      [_inspect]: {value: () => `[Integer: ${value}]`}
    })
  }
}
function isInteger (obj) {
  if (obj === null || typeof (obj) !== 'object') return false
  return obj[_type] === INTEGER
}

const FLOAT = Symbol('float');
function Float (value) {
  /* istanbul ignore next */
  return Object.defineProperties(new Number(value), {
    [_type]: {value: FLOAT},
    [_inspect]: {value: () => `[Float: ${value}]`}
  })
}
function isFloat (obj) {
  if (obj === null || typeof (obj) !== 'object') return false
  return obj[_type] === FLOAT
}

function tomlType$1 (value) {
  const type = typeof value;
  if (type === 'object') {
    /* istanbul ignore if */
    if (value === null) return 'null'
    if (value instanceof Date) return 'datetime'
    /* istanbul ignore else */
    if (_type in value) {
      switch (value[_type]) {
        case INLINE_TABLE: return 'inline-table'
        case INLINE_LIST: return 'inline-list'
        /* istanbul ignore next */
        case TABLE: return 'table'
        /* istanbul ignore next */
        case LIST: return 'list'
        case FLOAT: return 'float'
        case INTEGER: return 'integer'
      }
    }
  }
  return type
}

function makeParserClass (Parser) {
  class TOMLParser extends Parser {
    constructor () {
      super();
      this.ctx = this.obj = Table();
    }

    /* MATCH HELPER */
    atEndOfWord () {
      return this.char === CHAR_NUM || this.char === CTRL_I || this.char === CHAR_SP || this.atEndOfLine()
    }
    atEndOfLine () {
      return this.char === Parser.END || this.char === CTRL_J || this.char === CTRL_M
    }

    parseStart () {
      if (this.char === Parser.END) {
        return null
      } else if (this.char === CHAR_LSQB) {
        return this.call(this.parseTableOrList)
      } else if (this.char === CHAR_NUM) {
        return this.call(this.parseComment)
      } else if (this.char === CTRL_J || this.char === CHAR_SP || this.char === CTRL_I || this.char === CTRL_M) {
        return null
      } else if (isAlphaNumQuoteHyphen(this.char)) {
        return this.callNow(this.parseAssignStatement)
      } else {
        throw this.error(new TomlError(`Unknown character "${this.char}"`))
      }
    }

    // HELPER, this strips any whitespace and comments to the end of the line
    // then RETURNS. Last state in a production.
    parseWhitespaceToEOL () {
      if (this.char === CHAR_SP || this.char === CTRL_I || this.char === CTRL_M) {
        return null
      } else if (this.char === CHAR_NUM) {
        return this.goto(this.parseComment)
      } else if (this.char === Parser.END || this.char === CTRL_J) {
        return this.return()
      } else {
        throw this.error(new TomlError('Unexpected character, expected only whitespace or comments till end of line'))
      }
    }

    /* ASSIGNMENT: key = value */
    parseAssignStatement () {
      return this.callNow(this.parseAssign, this.recordAssignStatement)
    }
    recordAssignStatement (kv) {
      let target = this.ctx;
      let finalKey = kv.key.pop();
      for (let kw of kv.key) {
        if (hasKey(target, kw) && (!isTable(target[kw]) || target[kw][_declared])) {
          throw this.error(new TomlError("Can't redefine existing key"))
        }
        target = target[kw] = target[kw] || Table();
      }
      if (hasKey(target, finalKey)) {
        throw this.error(new TomlError("Can't redefine existing key"))
      }
      // unbox our numbers
      if (isInteger(kv.value) || isFloat(kv.value)) {
        target[finalKey] = kv.value.valueOf();
      } else {
        target[finalKey] = kv.value;
      }
      return this.goto(this.parseWhitespaceToEOL)
    }

    /* ASSSIGNMENT expression, key = value possibly inside an inline table */
    parseAssign () {
      return this.callNow(this.parseKeyword, this.recordAssignKeyword)
    }
    recordAssignKeyword (key) {
      if (this.state.resultTable) {
        this.state.resultTable.push(key);
      } else {
        this.state.resultTable = [key];
      }
      return this.goto(this.parseAssignKeywordPreDot)
    }
    parseAssignKeywordPreDot () {
      if (this.char === CHAR_PERIOD) {
        return this.next(this.parseAssignKeywordPostDot)
      } else if (this.char !== CHAR_SP && this.char !== CTRL_I) {
        return this.goto(this.parseAssignEqual)
      }
    }
    parseAssignKeywordPostDot () {
      if (this.char !== CHAR_SP && this.char !== CTRL_I) {
        return this.callNow(this.parseKeyword, this.recordAssignKeyword)
      }
    }

    parseAssignEqual () {
      if (this.char === CHAR_EQUALS) {
        return this.next(this.parseAssignPreValue)
      } else {
        throw this.error(new TomlError('Invalid character, expected "="'))
      }
    }
    parseAssignPreValue () {
      if (this.char === CHAR_SP || this.char === CTRL_I) {
        return null
      } else {
        return this.callNow(this.parseValue, this.recordAssignValue)
      }
    }
    recordAssignValue (value) {
      return this.returnNow({key: this.state.resultTable, value: value})
    }

    /* COMMENTS: #...eol */
    parseComment () {
      do {
        if (this.char === Parser.END || this.char === CTRL_J) {
          return this.return()
        }
      } while (this.nextChar())
    }

    /* TABLES AND LISTS, [foo] and [[foo]] */
    parseTableOrList () {
      if (this.char === CHAR_LSQB) {
        this.next(this.parseList);
      } else {
        return this.goto(this.parseTable)
      }
    }

    /* TABLE [foo.bar.baz] */
    parseTable () {
      this.ctx = this.obj;
      return this.goto(this.parseTableNext)
    }
    parseTableNext () {
      if (this.char === CHAR_SP || this.char === CTRL_I) {
        return null
      } else {
        return this.callNow(this.parseKeyword, this.parseTableMore)
      }
    }
    parseTableMore (keyword) {
      if (this.char === CHAR_SP || this.char === CTRL_I) {
        return null
      } else if (this.char === CHAR_RSQB) {
        if (hasKey(this.ctx, keyword) && (!isTable(this.ctx[keyword]) || this.ctx[keyword][_declared])) {
          throw this.error(new TomlError("Can't redefine existing key"))
        } else {
          this.ctx = this.ctx[keyword] = this.ctx[keyword] || Table();
          this.ctx[_declared] = true;
        }
        return this.next(this.parseWhitespaceToEOL)
      } else if (this.char === CHAR_PERIOD) {
        if (!hasKey(this.ctx, keyword)) {
          this.ctx = this.ctx[keyword] = Table();
        } else if (isTable(this.ctx[keyword])) {
          this.ctx = this.ctx[keyword];
        } else if (isList(this.ctx[keyword])) {
          this.ctx = this.ctx[keyword][this.ctx[keyword].length - 1];
        } else {
          throw this.error(new TomlError("Can't redefine existing key"))
        }
        return this.next(this.parseTableNext)
      } else {
        throw this.error(new TomlError('Unexpected character, expected whitespace, . or ]'))
      }
    }

    /* LIST [[a.b.c]] */
    parseList () {
      this.ctx = this.obj;
      return this.goto(this.parseListNext)
    }
    parseListNext () {
      if (this.char === CHAR_SP || this.char === CTRL_I) {
        return null
      } else {
        return this.callNow(this.parseKeyword, this.parseListMore)
      }
    }
    parseListMore (keyword) {
      if (this.char === CHAR_SP || this.char === CTRL_I) {
        return null
      } else if (this.char === CHAR_RSQB) {
        if (!hasKey(this.ctx, keyword)) {
          this.ctx[keyword] = List();
        }
        if (isInlineList(this.ctx[keyword])) {
          throw this.error(new TomlError("Can't extend an inline array"))
        } else if (isList(this.ctx[keyword])) {
          const next = Table();
          this.ctx[keyword].push(next);
          this.ctx = next;
        } else {
          throw this.error(new TomlError("Can't redefine an existing key"))
        }
        return this.next(this.parseListEnd)
      } else if (this.char === CHAR_PERIOD) {
        if (!hasKey(this.ctx, keyword)) {
          this.ctx = this.ctx[keyword] = Table();
        } else if (isInlineList(this.ctx[keyword])) {
          throw this.error(new TomlError("Can't extend an inline array"))
        } else if (isInlineTable(this.ctx[keyword])) {
          throw this.error(new TomlError("Can't extend an inline table"))
        } else if (isList(this.ctx[keyword])) {
          this.ctx = this.ctx[keyword][this.ctx[keyword].length - 1];
        } else if (isTable(this.ctx[keyword])) {
          this.ctx = this.ctx[keyword];
        } else {
          throw this.error(new TomlError("Can't redefine an existing key"))
        }
        return this.next(this.parseListNext)
      } else {
        throw this.error(new TomlError('Unexpected character, expected whitespace, . or ]'))
      }
    }
    parseListEnd (keyword) {
      if (this.char === CHAR_RSQB) {
        return this.next(this.parseWhitespaceToEOL)
      } else {
        throw this.error(new TomlError('Unexpected character, expected whitespace, . or ]'))
      }
    }

    /* VALUE string, number, boolean, inline list, inline object */
    parseValue () {
      if (this.char === Parser.END) {
        throw this.error(new TomlError('Key without value'))
      } else if (this.char === CHAR_QUOT) {
        return this.next(this.parseDoubleString)
      } if (this.char === CHAR_APOS) {
        return this.next(this.parseSingleString)
      } else if (this.char === CHAR_HYPHEN || this.char === CHAR_PLUS) {
        return this.goto(this.parseNumberSign)
      } else if (this.char === CHAR_i) {
        return this.next(this.parseInf)
      } else if (this.char === CHAR_n) {
        return this.next(this.parseNan)
      } else if (isDigit(this.char)) {
        return this.goto(this.parseNumberOrDateTime)
      } else if (this.char === CHAR_t || this.char === CHAR_f) {
        return this.goto(this.parseBoolean)
      } else if (this.char === CHAR_LSQB) {
        return this.call(this.parseInlineList, this.recordValue)
      } else if (this.char === CHAR_LCUB) {
        return this.call(this.parseInlineTable, this.recordValue)
      } else {
        throw this.error(new TomlError('Unexpected character, expecting string, number, datetime, boolean, inline array or inline table'))
      }
    }
    recordValue (value) {
      return this.returnNow(value)
    }

    parseInf () {
      if (this.char === CHAR_n) {
        return this.next(this.parseInf2)
      } else {
        throw this.error(new TomlError('Unexpected character, expected "inf", "+inf" or "-inf"'))
      }
    }
    parseInf2 () {
      if (this.char === CHAR_f) {
        if (this.state.buf === '-') {
          return this.return(-Infinity)
        } else {
          return this.return(Infinity)
        }
      } else {
        throw this.error(new TomlError('Unexpected character, expected "inf", "+inf" or "-inf"'))
      }
    }

    parseNan () {
      if (this.char === CHAR_a) {
        return this.next(this.parseNan2)
      } else {
        throw this.error(new TomlError('Unexpected character, expected "nan"'))
      }
    }
    parseNan2 () {
      if (this.char === CHAR_n) {
        return this.return(NaN)
      } else {
        throw this.error(new TomlError('Unexpected character, expected "nan"'))
      }
    }

    /* KEYS, barewords or basic, literal, or dotted */
    parseKeyword () {
      if (this.char === CHAR_QUOT) {
        return this.next(this.parseBasicString)
      } else if (this.char === CHAR_APOS) {
        return this.next(this.parseLiteralString)
      } else {
        return this.goto(this.parseBareKey)
      }
    }

    /* KEYS: barewords */
    parseBareKey () {
      do {
        if (this.char === Parser.END) {
          throw this.error(new TomlError('Key ended without value'))
        } else if (isAlphaNumHyphen(this.char)) {
          this.consume();
        } else if (this.state.buf.length === 0) {
          throw this.error(new TomlError('Empty bare keys are not allowed'))
        } else {
          return this.returnNow()
        }
      } while (this.nextChar())
    }

    /* STRINGS, single quoted (literal) */
    parseSingleString () {
      if (this.char === CHAR_APOS) {
        return this.next(this.parseLiteralMultiStringMaybe)
      } else {
        return this.goto(this.parseLiteralString)
      }
    }
    parseLiteralString () {
      do {
        if (this.char === CHAR_APOS) {
          return this.return()
        } else if (this.atEndOfLine()) {
          throw this.error(new TomlError('Unterminated string'))
        } else if (this.char === CHAR_DEL || (this.char <= CTRL_CHAR_BOUNDARY && this.char !== CTRL_I)) {
          throw this.errorControlCharInString()
        } else {
          this.consume();
        }
      } while (this.nextChar())
    }
    parseLiteralMultiStringMaybe () {
      if (this.char === CHAR_APOS) {
        return this.next(this.parseLiteralMultiString)
      } else {
        return this.returnNow()
      }
    }
    parseLiteralMultiString () {
      if (this.char === CTRL_M) {
        return null
      } else if (this.char === CTRL_J) {
        return this.next(this.parseLiteralMultiStringContent)
      } else {
        return this.goto(this.parseLiteralMultiStringContent)
      }
    }
    parseLiteralMultiStringContent () {
      do {
        if (this.char === CHAR_APOS) {
          return this.next(this.parseLiteralMultiEnd)
        } else if (this.char === Parser.END) {
          throw this.error(new TomlError('Unterminated multi-line string'))
        } else if (this.char === CHAR_DEL || (this.char <= CTRL_CHAR_BOUNDARY && this.char !== CTRL_I && this.char !== CTRL_J && this.char !== CTRL_M)) {
          throw this.errorControlCharInString()
        } else {
          this.consume();
        }
      } while (this.nextChar())
    }
    parseLiteralMultiEnd () {
      if (this.char === CHAR_APOS) {
        return this.next(this.parseLiteralMultiEnd2)
      } else {
        this.state.buf += "'";
        return this.goto(this.parseLiteralMultiStringContent)
      }
    }
    parseLiteralMultiEnd2 () {
      if (this.char === CHAR_APOS) {
        return this.return()
      } else {
        this.state.buf += "''";
        return this.goto(this.parseLiteralMultiStringContent)
      }
    }

    /* STRINGS double quoted */
    parseDoubleString () {
      if (this.char === CHAR_QUOT) {
        return this.next(this.parseMultiStringMaybe)
      } else {
        return this.goto(this.parseBasicString)
      }
    }
    parseBasicString () {
      do {
        if (this.char === CHAR_BSOL) {
          return this.call(this.parseEscape, this.recordEscapeReplacement)
        } else if (this.char === CHAR_QUOT) {
          return this.return()
        } else if (this.atEndOfLine()) {
          throw this.error(new TomlError('Unterminated string'))
        } else if (this.char === CHAR_DEL || (this.char <= CTRL_CHAR_BOUNDARY && this.char !== CTRL_I)) {
          throw this.errorControlCharInString()
        } else {
          this.consume();
        }
      } while (this.nextChar())
    }
    recordEscapeReplacement (replacement) {
      this.state.buf += replacement;
      return this.goto(this.parseBasicString)
    }
    parseMultiStringMaybe () {
      if (this.char === CHAR_QUOT) {
        return this.next(this.parseMultiString)
      } else {
        return this.returnNow()
      }
    }
    parseMultiString () {
      if (this.char === CTRL_M) {
        return null
      } else if (this.char === CTRL_J) {
        return this.next(this.parseMultiStringContent)
      } else {
        return this.goto(this.parseMultiStringContent)
      }
    }
    parseMultiStringContent () {
      do {
        if (this.char === CHAR_BSOL) {
          return this.call(this.parseMultiEscape, this.recordMultiEscapeReplacement)
        } else if (this.char === CHAR_QUOT) {
          return this.next(this.parseMultiEnd)
        } else if (this.char === Parser.END) {
          throw this.error(new TomlError('Unterminated multi-line string'))
        } else if (this.char === CHAR_DEL || (this.char <= CTRL_CHAR_BOUNDARY && this.char !== CTRL_I && this.char !== CTRL_J && this.char !== CTRL_M)) {
          throw this.errorControlCharInString()
        } else {
          this.consume();
        }
      } while (this.nextChar())
    }
    errorControlCharInString () {
      let displayCode = '\\u00';
      if (this.char < 16) {
        displayCode += '0';
      }
      displayCode += this.char.toString(16);

      return this.error(new TomlError(`Control characters (codes < 0x1f and 0x7f) are not allowed in strings, use ${displayCode} instead`))
    }
    recordMultiEscapeReplacement (replacement) {
      this.state.buf += replacement;
      return this.goto(this.parseMultiStringContent)
    }
    parseMultiEnd () {
      if (this.char === CHAR_QUOT) {
        return this.next(this.parseMultiEnd2)
      } else {
        this.state.buf += '"';
        return this.goto(this.parseMultiStringContent)
      }
    }
    parseMultiEnd2 () {
      if (this.char === CHAR_QUOT) {
        return this.return()
      } else {
        this.state.buf += '""';
        return this.goto(this.parseMultiStringContent)
      }
    }
    parseMultiEscape () {
      if (this.char === CTRL_M || this.char === CTRL_J) {
        return this.next(this.parseMultiTrim)
      } else if (this.char === CHAR_SP || this.char === CTRL_I) {
        return this.next(this.parsePreMultiTrim)
      } else {
        return this.goto(this.parseEscape)
      }
    }
    parsePreMultiTrim () {
      if (this.char === CHAR_SP || this.char === CTRL_I) {
        return null
      } else if (this.char === CTRL_M || this.char === CTRL_J) {
        return this.next(this.parseMultiTrim)
      } else {
        throw this.error(new TomlError("Can't escape whitespace"))
      }
    }
    parseMultiTrim () {
      // explicitly whitespace here, END should follow the same path as chars
      if (this.char === CTRL_J || this.char === CHAR_SP || this.char === CTRL_I || this.char === CTRL_M) {
        return null
      } else {
        return this.returnNow()
      }
    }
    parseEscape () {
      if (this.char in escapes) {
        return this.return(escapes[this.char])
      } else if (this.char === CHAR_u) {
        return this.call(this.parseSmallUnicode, this.parseUnicodeReturn)
      } else if (this.char === CHAR_U) {
        return this.call(this.parseLargeUnicode, this.parseUnicodeReturn)
      } else {
        throw this.error(new TomlError('Unknown escape character: ' + this.char))
      }
    }
    parseUnicodeReturn (char) {
      try {
        const codePoint = parseInt(char, 16);
        if (codePoint >= SURROGATE_FIRST && codePoint <= SURROGATE_LAST) {
          throw this.error(new TomlError('Invalid unicode, character in range 0xD800 - 0xDFFF is reserved'))
        }
        return this.returnNow(String.fromCodePoint(codePoint))
      } catch (err) {
        throw this.error(TomlError.wrap(err))
      }
    }
    parseSmallUnicode () {
      if (!isHexit(this.char)) {
        throw this.error(new TomlError('Invalid character in unicode sequence, expected hex'))
      } else {
        this.consume();
        if (this.state.buf.length >= 4) return this.return()
      }
    }
    parseLargeUnicode () {
      if (!isHexit(this.char)) {
        throw this.error(new TomlError('Invalid character in unicode sequence, expected hex'))
      } else {
        this.consume();
        if (this.state.buf.length >= 8) return this.return()
      }
    }

    /* NUMBERS */
    parseNumberSign () {
      this.consume();
      return this.next(this.parseMaybeSignedInfOrNan)
    }
    parseMaybeSignedInfOrNan () {
      if (this.char === CHAR_i) {
        return this.next(this.parseInf)
      } else if (this.char === CHAR_n) {
        return this.next(this.parseNan)
      } else {
        return this.callNow(this.parseNoUnder, this.parseNumberIntegerStart)
      }
    }
    parseNumberIntegerStart () {
      if (this.char === CHAR_0) {
        this.consume();
        return this.next(this.parseNumberIntegerExponentOrDecimal)
      } else {
        return this.goto(this.parseNumberInteger)
      }
    }
    parseNumberIntegerExponentOrDecimal () {
      if (this.char === CHAR_PERIOD) {
        this.consume();
        return this.call(this.parseNoUnder, this.parseNumberFloat)
      } else if (this.char === CHAR_E || this.char === CHAR_e) {
        this.consume();
        return this.next(this.parseNumberExponentSign)
      } else {
        return this.returnNow(Integer(this.state.buf))
      }
    }
    parseNumberInteger () {
      if (isDigit(this.char)) {
        this.consume();
      } else if (this.char === CHAR_LOWBAR) {
        return this.call(this.parseNoUnder)
      } else if (this.char === CHAR_E || this.char === CHAR_e) {
        this.consume();
        return this.next(this.parseNumberExponentSign)
      } else if (this.char === CHAR_PERIOD) {
        this.consume();
        return this.call(this.parseNoUnder, this.parseNumberFloat)
      } else {
        const result = Integer(this.state.buf);
        /* istanbul ignore if */
        if (result.isNaN()) {
          throw this.error(new TomlError('Invalid number'))
        } else {
          return this.returnNow(result)
        }
      }
    }
    parseNoUnder () {
      if (this.char === CHAR_LOWBAR || this.char === CHAR_PERIOD || this.char === CHAR_E || this.char === CHAR_e) {
        throw this.error(new TomlError('Unexpected character, expected digit'))
      } else if (this.atEndOfWord()) {
        throw this.error(new TomlError('Incomplete number'))
      }
      return this.returnNow()
    }
    parseNoUnderHexOctBinLiteral () {
      if (this.char === CHAR_LOWBAR || this.char === CHAR_PERIOD) {
        throw this.error(new TomlError('Unexpected character, expected digit'))
      } else if (this.atEndOfWord()) {
        throw this.error(new TomlError('Incomplete number'))
      }
      return this.returnNow()
    }
    parseNumberFloat () {
      if (this.char === CHAR_LOWBAR) {
        return this.call(this.parseNoUnder, this.parseNumberFloat)
      } else if (isDigit(this.char)) {
        this.consume();
      } else if (this.char === CHAR_E || this.char === CHAR_e) {
        this.consume();
        return this.next(this.parseNumberExponentSign)
      } else {
        return this.returnNow(Float(this.state.buf))
      }
    }
    parseNumberExponentSign () {
      if (isDigit(this.char)) {
        return this.goto(this.parseNumberExponent)
      } else if (this.char === CHAR_HYPHEN || this.char === CHAR_PLUS) {
        this.consume();
        this.call(this.parseNoUnder, this.parseNumberExponent);
      } else {
        throw this.error(new TomlError('Unexpected character, expected -, + or digit'))
      }
    }
    parseNumberExponent () {
      if (isDigit(this.char)) {
        this.consume();
      } else if (this.char === CHAR_LOWBAR) {
        return this.call(this.parseNoUnder)
      } else {
        return this.returnNow(Float(this.state.buf))
      }
    }

    /* NUMBERS or DATETIMES  */
    parseNumberOrDateTime () {
      if (this.char === CHAR_0) {
        this.consume();
        return this.next(this.parseNumberBaseOrDateTime)
      } else {
        return this.goto(this.parseNumberOrDateTimeOnly)
      }
    }
    parseNumberOrDateTimeOnly () {
      // note, if two zeros are in a row then it MUST be a date
      if (this.char === CHAR_LOWBAR) {
        return this.call(this.parseNoUnder, this.parseNumberInteger)
      } else if (isDigit(this.char)) {
        this.consume();
        if (this.state.buf.length > 4) this.next(this.parseNumberInteger);
      } else if (this.char === CHAR_E || this.char === CHAR_e) {
        this.consume();
        return this.next(this.parseNumberExponentSign)
      } else if (this.char === CHAR_PERIOD) {
        this.consume();
        return this.call(this.parseNoUnder, this.parseNumberFloat)
      } else if (this.char === CHAR_HYPHEN) {
        return this.goto(this.parseDateTime)
      } else if (this.char === CHAR_COLON) {
        return this.goto(this.parseOnlyTimeHour)
      } else {
        return this.returnNow(Integer(this.state.buf))
      }
    }
    parseDateTimeOnly () {
      if (this.state.buf.length < 4) {
        if (isDigit(this.char)) {
          return this.consume()
        } else if (this.char === CHAR_COLON) {
          return this.goto(this.parseOnlyTimeHour)
        } else {
          throw this.error(new TomlError('Expected digit while parsing year part of a date'))
        }
      } else {
        if (this.char === CHAR_HYPHEN) {
          return this.goto(this.parseDateTime)
        } else {
          throw this.error(new TomlError('Expected hyphen (-) while parsing year part of date'))
        }
      }
    }
    parseNumberBaseOrDateTime () {
      if (this.char === CHAR_b) {
        this.consume();
        return this.call(this.parseNoUnderHexOctBinLiteral, this.parseIntegerBin)
      } else if (this.char === CHAR_o) {
        this.consume();
        return this.call(this.parseNoUnderHexOctBinLiteral, this.parseIntegerOct)
      } else if (this.char === CHAR_x) {
        this.consume();
        return this.call(this.parseNoUnderHexOctBinLiteral, this.parseIntegerHex)
      } else if (this.char === CHAR_PERIOD) {
        return this.goto(this.parseNumberInteger)
      } else if (isDigit(this.char)) {
        return this.goto(this.parseDateTimeOnly)
      } else {
        return this.returnNow(Integer(this.state.buf))
      }
    }
    parseIntegerHex () {
      if (isHexit(this.char)) {
        this.consume();
      } else if (this.char === CHAR_LOWBAR) {
        return this.call(this.parseNoUnderHexOctBinLiteral)
      } else {
        const result = Integer(this.state.buf);
        /* istanbul ignore if */
        if (result.isNaN()) {
          throw this.error(new TomlError('Invalid number'))
        } else {
          return this.returnNow(result)
        }
      }
    }
    parseIntegerOct () {
      if (isOctit(this.char)) {
        this.consume();
      } else if (this.char === CHAR_LOWBAR) {
        return this.call(this.parseNoUnderHexOctBinLiteral)
      } else {
        const result = Integer(this.state.buf);
        /* istanbul ignore if */
        if (result.isNaN()) {
          throw this.error(new TomlError('Invalid number'))
        } else {
          return this.returnNow(result)
        }
      }
    }
    parseIntegerBin () {
      if (isBit(this.char)) {
        this.consume();
      } else if (this.char === CHAR_LOWBAR) {
        return this.call(this.parseNoUnderHexOctBinLiteral)
      } else {
        const result = Integer(this.state.buf);
        /* istanbul ignore if */
        if (result.isNaN()) {
          throw this.error(new TomlError('Invalid number'))
        } else {
          return this.returnNow(result)
        }
      }
    }

    /* DATETIME */
    parseDateTime () {
      // we enter here having just consumed the year and about to consume the hyphen
      if (this.state.buf.length < 4) {
        throw this.error(new TomlError('Years less than 1000 must be zero padded to four characters'))
      }
      this.state.result = this.state.buf;
      this.state.buf = '';
      return this.next(this.parseDateMonth)
    }
    parseDateMonth () {
      if (this.char === CHAR_HYPHEN) {
        if (this.state.buf.length < 2) {
          throw this.error(new TomlError('Months less than 10 must be zero padded to two characters'))
        }
        this.state.result += '-' + this.state.buf;
        this.state.buf = '';
        return this.next(this.parseDateDay)
      } else if (isDigit(this.char)) {
        this.consume();
      } else {
        throw this.error(new TomlError('Incomplete datetime'))
      }
    }
    parseDateDay () {
      if (this.char === CHAR_T || this.char === CHAR_SP) {
        if (this.state.buf.length < 2) {
          throw this.error(new TomlError('Days less than 10 must be zero padded to two characters'))
        }
        this.state.result += '-' + this.state.buf;
        this.state.buf = '';
        return this.next(this.parseStartTimeHour)
      } else if (this.atEndOfWord()) {
        return this.returnNow(createDate(this.state.result + '-' + this.state.buf))
      } else if (isDigit(this.char)) {
        this.consume();
      } else {
        throw this.error(new TomlError('Incomplete datetime'))
      }
    }
    parseStartTimeHour () {
      if (this.atEndOfWord()) {
        return this.returnNow(createDate(this.state.result))
      } else {
        return this.goto(this.parseTimeHour)
      }
    }
    parseTimeHour () {
      if (this.char === CHAR_COLON) {
        if (this.state.buf.length < 2) {
          throw this.error(new TomlError('Hours less than 10 must be zero padded to two characters'))
        }
        this.state.result += 'T' + this.state.buf;
        this.state.buf = '';
        return this.next(this.parseTimeMin)
      } else if (isDigit(this.char)) {
        this.consume();
      } else {
        throw this.error(new TomlError('Incomplete datetime'))
      }
    }
    parseTimeMin () {
      if (this.state.buf.length < 2 && isDigit(this.char)) {
        this.consume();
      } else if (this.state.buf.length === 2 && this.char === CHAR_COLON) {
        this.state.result += ':' + this.state.buf;
        this.state.buf = '';
        return this.next(this.parseTimeSec)
      } else {
        throw this.error(new TomlError('Incomplete datetime'))
      }
    }
    parseTimeSec () {
      if (isDigit(this.char)) {
        this.consume();
        if (this.state.buf.length === 2) {
          this.state.result += ':' + this.state.buf;
          this.state.buf = '';
          return this.next(this.parseTimeZoneOrFraction)
        }
      } else {
        throw this.error(new TomlError('Incomplete datetime'))
      }
    }

    parseOnlyTimeHour () {
      /* istanbul ignore else */
      if (this.char === CHAR_COLON) {
        if (this.state.buf.length < 2) {
          throw this.error(new TomlError('Hours less than 10 must be zero padded to two characters'))
        }
        this.state.result = this.state.buf;
        this.state.buf = '';
        return this.next(this.parseOnlyTimeMin)
      } else {
        throw this.error(new TomlError('Incomplete time'))
      }
    }
    parseOnlyTimeMin () {
      if (this.state.buf.length < 2 && isDigit(this.char)) {
        this.consume();
      } else if (this.state.buf.length === 2 && this.char === CHAR_COLON) {
        this.state.result += ':' + this.state.buf;
        this.state.buf = '';
        return this.next(this.parseOnlyTimeSec)
      } else {
        throw this.error(new TomlError('Incomplete time'))
      }
    }
    parseOnlyTimeSec () {
      if (isDigit(this.char)) {
        this.consume();
        if (this.state.buf.length === 2) {
          return this.next(this.parseOnlyTimeFractionMaybe)
        }
      } else {
        throw this.error(new TomlError('Incomplete time'))
      }
    }
    parseOnlyTimeFractionMaybe () {
      this.state.result += ':' + this.state.buf;
      if (this.char === CHAR_PERIOD) {
        this.state.buf = '';
        this.next(this.parseOnlyTimeFraction);
      } else {
        return this.return(createTime(this.state.result))
      }
    }
    parseOnlyTimeFraction () {
      if (isDigit(this.char)) {
        this.consume();
      } else if (this.atEndOfWord()) {
        if (this.state.buf.length === 0) throw this.error(new TomlError('Expected digit in milliseconds'))
        return this.returnNow(createTime(this.state.result + '.' + this.state.buf))
      } else {
        throw this.error(new TomlError('Unexpected character in datetime, expected period (.), minus (-), plus (+) or Z'))
      }
    }

    parseTimeZoneOrFraction () {
      if (this.char === CHAR_PERIOD) {
        this.consume();
        this.next(this.parseDateTimeFraction);
      } else if (this.char === CHAR_HYPHEN || this.char === CHAR_PLUS) {
        this.consume();
        this.next(this.parseTimeZoneHour);
      } else if (this.char === CHAR_Z) {
        this.consume();
        return this.return(createDateTime(this.state.result + this.state.buf))
      } else if (this.atEndOfWord()) {
        return this.returnNow(createDateTimeFloat(this.state.result + this.state.buf))
      } else {
        throw this.error(new TomlError('Unexpected character in datetime, expected period (.), minus (-), plus (+) or Z'))
      }
    }
    parseDateTimeFraction () {
      if (isDigit(this.char)) {
        this.consume();
      } else if (this.state.buf.length === 1) {
        throw this.error(new TomlError('Expected digit in milliseconds'))
      } else if (this.char === CHAR_HYPHEN || this.char === CHAR_PLUS) {
        this.consume();
        this.next(this.parseTimeZoneHour);
      } else if (this.char === CHAR_Z) {
        this.consume();
        return this.return(createDateTime(this.state.result + this.state.buf))
      } else if (this.atEndOfWord()) {
        return this.returnNow(createDateTimeFloat(this.state.result + this.state.buf))
      } else {
        throw this.error(new TomlError('Unexpected character in datetime, expected period (.), minus (-), plus (+) or Z'))
      }
    }
    parseTimeZoneHour () {
      if (isDigit(this.char)) {
        this.consume();
        // FIXME: No more regexps
        if (/\d\d$/.test(this.state.buf)) return this.next(this.parseTimeZoneSep)
      } else {
        throw this.error(new TomlError('Unexpected character in datetime, expected digit'))
      }
    }
    parseTimeZoneSep () {
      if (this.char === CHAR_COLON) {
        this.consume();
        this.next(this.parseTimeZoneMin);
      } else {
        throw this.error(new TomlError('Unexpected character in datetime, expected colon'))
      }
    }
    parseTimeZoneMin () {
      if (isDigit(this.char)) {
        this.consume();
        if (/\d\d$/.test(this.state.buf)) return this.return(createDateTime(this.state.result + this.state.buf))
      } else {
        throw this.error(new TomlError('Unexpected character in datetime, expected digit'))
      }
    }

    /* BOOLEAN */
    parseBoolean () {
      /* istanbul ignore else */
      if (this.char === CHAR_t) {
        this.consume();
        return this.next(this.parseTrue_r)
      } else if (this.char === CHAR_f) {
        this.consume();
        return this.next(this.parseFalse_a)
      }
    }
    parseTrue_r () {
      if (this.char === CHAR_r) {
        this.consume();
        return this.next(this.parseTrue_u)
      } else {
        throw this.error(new TomlError('Invalid boolean, expected true or false'))
      }
    }
    parseTrue_u () {
      if (this.char === CHAR_u) {
        this.consume();
        return this.next(this.parseTrue_e)
      } else {
        throw this.error(new TomlError('Invalid boolean, expected true or false'))
      }
    }
    parseTrue_e () {
      if (this.char === CHAR_e) {
        return this.return(true)
      } else {
        throw this.error(new TomlError('Invalid boolean, expected true or false'))
      }
    }

    parseFalse_a () {
      if (this.char === CHAR_a) {
        this.consume();
        return this.next(this.parseFalse_l)
      } else {
        throw this.error(new TomlError('Invalid boolean, expected true or false'))
      }
    }

    parseFalse_l () {
      if (this.char === CHAR_l) {
        this.consume();
        return this.next(this.parseFalse_s)
      } else {
        throw this.error(new TomlError('Invalid boolean, expected true or false'))
      }
    }

    parseFalse_s () {
      if (this.char === CHAR_s) {
        this.consume();
        return this.next(this.parseFalse_e)
      } else {
        throw this.error(new TomlError('Invalid boolean, expected true or false'))
      }
    }

    parseFalse_e () {
      if (this.char === CHAR_e) {
        return this.return(false)
      } else {
        throw this.error(new TomlError('Invalid boolean, expected true or false'))
      }
    }

    /* INLINE LISTS */
    parseInlineList () {
      if (this.char === CHAR_SP || this.char === CTRL_I || this.char === CTRL_M || this.char === CTRL_J) {
        return null
      } else if (this.char === Parser.END) {
        throw this.error(new TomlError('Unterminated inline array'))
      } else if (this.char === CHAR_NUM) {
        return this.call(this.parseComment)
      } else if (this.char === CHAR_RSQB) {
        return this.return(this.state.resultArr || InlineList())
      } else {
        return this.callNow(this.parseValue, this.recordInlineListValue)
      }
    }
    recordInlineListValue (value) {
      if (this.state.resultArr) {
        const listType = this.state.resultArr[_contentType];
        const valueType = tomlType$1(value);
        if (listType !== valueType) {
          throw this.error(new TomlError(`Inline lists must be a single type, not a mix of ${listType} and ${valueType}`))
        }
      } else {
        this.state.resultArr = InlineList(tomlType$1(value));
      }
      if (isFloat(value) || isInteger(value)) {
        // unbox now that we've verified they're ok
        this.state.resultArr.push(value.valueOf());
      } else {
        this.state.resultArr.push(value);
      }
      return this.goto(this.parseInlineListNext)
    }
    parseInlineListNext () {
      if (this.char === CHAR_SP || this.char === CTRL_I || this.char === CTRL_M || this.char === CTRL_J) {
        return null
      } else if (this.char === CHAR_NUM) {
        return this.call(this.parseComment)
      } else if (this.char === CHAR_COMMA) {
        return this.next(this.parseInlineList)
      } else if (this.char === CHAR_RSQB) {
        return this.goto(this.parseInlineList)
      } else {
        throw this.error(new TomlError('Invalid character, expected whitespace, comma (,) or close bracket (])'))
      }
    }

    /* INLINE TABLE */
    parseInlineTable () {
      if (this.char === CHAR_SP || this.char === CTRL_I) {
        return null
      } else if (this.char === Parser.END || this.char === CHAR_NUM || this.char === CTRL_J || this.char === CTRL_M) {
        throw this.error(new TomlError('Unterminated inline array'))
      } else if (this.char === CHAR_RCUB) {
        return this.return(this.state.resultTable || InlineTable())
      } else {
        if (!this.state.resultTable) this.state.resultTable = InlineTable();
        return this.callNow(this.parseAssign, this.recordInlineTableValue)
      }
    }
    recordInlineTableValue (kv) {
      let target = this.state.resultTable;
      let finalKey = kv.key.pop();
      for (let kw of kv.key) {
        if (hasKey(target, kw) && (!isTable(target[kw]) || target[kw][_declared])) {
          throw this.error(new TomlError("Can't redefine existing key"))
        }
        target = target[kw] = target[kw] || Table();
      }
      if (hasKey(target, finalKey)) {
        throw this.error(new TomlError("Can't redefine existing key"))
      }
      if (isInteger(kv.value) || isFloat(kv.value)) {
        target[finalKey] = kv.value.valueOf();
      } else {
        target[finalKey] = kv.value;
      }
      return this.goto(this.parseInlineTableNext)
    }
    parseInlineTableNext () {
      if (this.char === CHAR_SP || this.char === CTRL_I) {
        return null
      } else if (this.char === Parser.END || this.char === CHAR_NUM || this.char === CTRL_J || this.char === CTRL_M) {
        throw this.error(new TomlError('Unterminated inline array'))
      } else if (this.char === CHAR_COMMA) {
        return this.next(this.parseInlineTable)
      } else if (this.char === CHAR_RCUB) {
        return this.goto(this.parseInlineTable)
      } else {
        throw this.error(new TomlError('Invalid character, expected whitespace, comma (,) or close bracket (])'))
      }
    }
  }
  return TOMLParser
}

var tomlParserExports = tomlParser.exports;

var parsePrettyError = prettyError$2;

function prettyError$2 (err, buf) {
  /* istanbul ignore if */
  if (err.pos == null || err.line == null) return err
  let msg = err.message;
  msg += ` at row ${err.line + 1}, col ${err.col + 1}, pos ${err.pos}:\n`;

  /* istanbul ignore else */
  if (buf && buf.split) {
    const lines = buf.split(/\n/);
    const lineNumWidth = String(Math.min(lines.length, err.line + 3)).length;
    let linePadding = ' ';
    while (linePadding.length < lineNumWidth) linePadding += ' ';
    for (let ii = Math.max(0, err.line - 1); ii < Math.min(lines.length, err.line + 2); ++ii) {
      let lineNum = String(ii + 1);
      if (lineNum.length < lineNumWidth) lineNum = ' ' + lineNum;
      if (err.line === ii) {
        msg += lineNum + '> ' + lines[ii] + '\n';
        msg += linePadding + '  ';
        for (let hh = 0; hh < err.col; ++hh) {
          msg += ' ';
        }
        msg += '^\n';
      } else {
        msg += lineNum + ': ' + lines[ii] + '\n';
      }
    }
  }
  err.message = msg + '\n';
  return err
}

var parseString_1 = parseString;

const TOMLParser$2 = tomlParserExports;
const prettyError$1 = parsePrettyError;

function parseString (str) {
  if (commonjsGlobal.Buffer && commonjsGlobal.Buffer.isBuffer(str)) {
    str = str.toString('utf8');
  }
  const parser = new TOMLParser$2();
  try {
    parser.parse(str);
    return parser.finish()
  } catch (err) {
    throw prettyError$1(err, str)
  }
}

var parseAsync_1 = parseAsync;

const TOMLParser$1 = tomlParserExports;
const prettyError = parsePrettyError;

function parseAsync (str, opts) {
  if (!opts) opts = {};
  const index = 0;
  const blocksize = opts.blocksize || 40960;
  const parser = new TOMLParser$1();
  return new Promise((resolve, reject) => {
    setImmediate(parseAsyncNext, index, blocksize, resolve, reject);
  })
  function parseAsyncNext (index, blocksize, resolve, reject) {
    if (index >= str.length) {
      try {
        return resolve(parser.finish())
      } catch (err) {
        return reject(prettyError(err, str))
      }
    }
    try {
      parser.parse(str.slice(index, index + blocksize));
      setImmediate(parseAsyncNext, index + blocksize, blocksize, resolve, reject);
    } catch (err) {
      reject(prettyError(err, str));
    }
  }
}

var parseStream_1 = parseStream;

const stream = require$$0$5;
const TOMLParser = tomlParserExports;

function parseStream (stm) {
  if (stm) {
    return parseReadable(stm)
  } else {
    return parseTransform()
  }
}

function parseReadable (stm) {
  const parser = new TOMLParser();
  stm.setEncoding('utf8');
  return new Promise((resolve, reject) => {
    let readable;
    let ended = false;
    let errored = false;
    function finish () {
      ended = true;
      if (readable) return
      try {
        resolve(parser.finish());
      } catch (err) {
        reject(err);
      }
    }
    function error (err) {
      errored = true;
      reject(err);
    }
    stm.once('end', finish);
    stm.once('error', error);
    readNext();

    function readNext () {
      readable = true;
      let data;
      while ((data = stm.read()) !== null) {
        try {
          parser.parse(data);
        } catch (err) {
          return error(err)
        }
      }
      readable = false;
      /* istanbul ignore if */
      if (ended) return finish()
      /* istanbul ignore if */
      if (errored) return
      stm.once('readable', readNext);
    }
  })
}

function parseTransform () {
  const parser = new TOMLParser();
  return new stream.Transform({
    objectMode: true,
    transform (chunk, encoding, cb) {
      try {
        parser.parse(chunk.toString(encoding));
      } catch (err) {
        this.emit('error', err);
      }
      cb();
    },
    flush (cb) {
      try {
        this.push(parser.finish());
      } catch (err) {
        this.emit('error', err);
      }
      cb();
    }
  })
}

parse.exports = parseString_1;
parse.exports.async = parseAsync_1;
parse.exports.stream = parseStream_1;
parse.exports.prettyError = parsePrettyError;

var parseExports = parse.exports;

var stringify$1 = {exports: {}};

stringify$1.exports = stringify;
stringify$1.exports.value = stringifyInline;

function stringify (obj) {
  if (obj === null) throw typeError('null')
  if (obj === void 0) throw typeError('undefined')
  if (typeof obj !== 'object') throw typeError(typeof obj)

  if (typeof obj.toJSON === 'function') obj = obj.toJSON();
  if (obj == null) return null
  const type = tomlType(obj);
  if (type !== 'table') throw typeError(type)
  return stringifyObject('', '', obj)
}

function typeError (type) {
  return new Error('Can only stringify objects, not ' + type)
}

function arrayOneTypeError () {
  return new Error("Array values can't have mixed types")
}

function getInlineKeys (obj) {
  return Object.keys(obj).filter(key => isInline(obj[key]))
}
function getComplexKeys (obj) {
  return Object.keys(obj).filter(key => !isInline(obj[key]))
}

function toJSON (obj) {
  let nobj = Array.isArray(obj) ? [] : Object.prototype.hasOwnProperty.call(obj, '__proto__') ? {['__proto__']: undefined} : {};
  for (let prop of Object.keys(obj)) {
    if (obj[prop] && typeof obj[prop].toJSON === 'function' && !('toISOString' in obj[prop])) {
      nobj[prop] = obj[prop].toJSON();
    } else {
      nobj[prop] = obj[prop];
    }
  }
  return nobj
}

function stringifyObject (prefix, indent, obj) {
  obj = toJSON(obj);
  var inlineKeys;
  var complexKeys;
  inlineKeys = getInlineKeys(obj);
  complexKeys = getComplexKeys(obj);
  var result = [];
  var inlineIndent = indent || '';
  inlineKeys.forEach(key => {
    var type = tomlType(obj[key]);
    if (type !== 'undefined' && type !== 'null') {
      result.push(inlineIndent + stringifyKey(key) + ' = ' + stringifyAnyInline(obj[key], true));
    }
  });
  if (result.length > 0) result.push('');
  var complexIndent = prefix && inlineKeys.length > 0 ? indent + '  ' : '';
  complexKeys.forEach(key => {
    result.push(stringifyComplex(prefix, complexIndent, key, obj[key]));
  });
  return result.join('\n')
}

function isInline (value) {
  switch (tomlType(value)) {
    case 'undefined':
    case 'null':
    case 'integer':
    case 'nan':
    case 'float':
    case 'boolean':
    case 'string':
    case 'datetime':
      return true
    case 'array':
      return value.length === 0 || tomlType(value[0]) !== 'table'
    case 'table':
      return Object.keys(value).length === 0
    /* istanbul ignore next */
    default:
      return false
  }
}

function tomlType (value) {
  if (value === undefined) {
    return 'undefined'
  } else if (value === null) {
    return 'null'
  /* eslint-disable valid-typeof */
  } else if (typeof value === 'bigint' || (Number.isInteger(value) && !Object.is(value, -0))) {
    return 'integer'
  } else if (typeof value === 'number') {
    return 'float'
  } else if (typeof value === 'boolean') {
    return 'boolean'
  } else if (typeof value === 'string') {
    return 'string'
  } else if ('toISOString' in value) {
    return isNaN(value) ? 'undefined' : 'datetime'
  } else if (Array.isArray(value)) {
    return 'array'
  } else {
    return 'table'
  }
}

function stringifyKey (key) {
  var keyStr = String(key);
  if (/^[-A-Za-z0-9_]+$/.test(keyStr)) {
    return keyStr
  } else {
    return stringifyBasicString(keyStr)
  }
}

function stringifyBasicString (str) {
  return '"' + escapeString(str).replace(/"/g, '\\"') + '"'
}

function stringifyLiteralString (str) {
  return "'" + str + "'"
}

function numpad (num, str) {
  while (str.length < num) str = '0' + str;
  return str
}

function escapeString (str) {
  return str.replace(/\\/g, '\\\\')
    .replace(/[\b]/g, '\\b')
    .replace(/\t/g, '\\t')
    .replace(/\n/g, '\\n')
    .replace(/\f/g, '\\f')
    .replace(/\r/g, '\\r')
    /* eslint-disable no-control-regex */
    .replace(/([\u0000-\u001f\u007f])/, c => '\\u' + numpad(4, c.codePointAt(0).toString(16)))
    /* eslint-enable no-control-regex */
}

function stringifyMultilineString (str) {
  let escaped = str.split(/\n/).map(str => {
    return escapeString(str).replace(/"(?="")/g, '\\"')
  }).join('\n');
  if (escaped.slice(-1) === '"') escaped += '\\\n';
  return '"""\n' + escaped + '"""'
}

function stringifyAnyInline (value, multilineOk) {
  let type = tomlType(value);
  if (type === 'string') {
    if (multilineOk && /\n/.test(value)) {
      type = 'string-multiline';
    } else if (!/[\b\t\n\f\r']/.test(value) && /"/.test(value)) {
      type = 'string-literal';
    }
  }
  return stringifyInline(value, type)
}

function stringifyInline (value, type) {
  /* istanbul ignore if */
  if (!type) type = tomlType(value);
  switch (type) {
    case 'string-multiline':
      return stringifyMultilineString(value)
    case 'string':
      return stringifyBasicString(value)
    case 'string-literal':
      return stringifyLiteralString(value)
    case 'integer':
      return stringifyInteger(value)
    case 'float':
      return stringifyFloat(value)
    case 'boolean':
      return stringifyBoolean(value)
    case 'datetime':
      return stringifyDatetime(value)
    case 'array':
      return stringifyInlineArray(value.filter(_ => tomlType(_) !== 'null' && tomlType(_) !== 'undefined' && tomlType(_) !== 'nan'))
    case 'table':
      return stringifyInlineTable(value)
    /* istanbul ignore next */
    default:
      throw typeError(type)
  }
}

function stringifyInteger (value) {
  /* eslint-disable security/detect-unsafe-regex */
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, '_')
}

function stringifyFloat (value) {
  if (value === Infinity) {
    return 'inf'
  } else if (value === -Infinity) {
    return '-inf'
  } else if (Object.is(value, NaN)) {
    return 'nan'
  } else if (Object.is(value, -0)) {
    return '-0.0'
  }
  var chunks = String(value).split('.');
  var int = chunks[0];
  var dec = chunks[1] || 0;
  return stringifyInteger(int) + '.' + dec
}

function stringifyBoolean (value) {
  return String(value)
}

function stringifyDatetime (value) {
  return value.toISOString()
}

function isNumber (type) {
  return type === 'float' || type === 'integer'
}
function arrayType (values) {
  var contentType = tomlType(values[0]);
  if (values.every(_ => tomlType(_) === contentType)) return contentType
  // mixed integer/float, emit as floats
  if (values.every(_ => isNumber(tomlType(_)))) return 'float'
  return 'mixed'
}
function validateArray (values) {
  const type = arrayType(values);
  if (type === 'mixed') {
    throw arrayOneTypeError()
  }
  return type
}

function stringifyInlineArray (values) {
  values = toJSON(values);
  const type = validateArray(values);
  var result = '[';
  var stringified = values.map(_ => stringifyInline(_, type));
  if (stringified.join(', ').length > 60 || /\n/.test(stringified)) {
    result += '\n  ' + stringified.join(',\n  ') + '\n';
  } else {
    result += ' ' + stringified.join(', ') + (stringified.length > 0 ? ' ' : '');
  }
  return result + ']'
}

function stringifyInlineTable (value) {
  value = toJSON(value);
  var result = [];
  Object.keys(value).forEach(key => {
    result.push(stringifyKey(key) + ' = ' + stringifyAnyInline(value[key], false));
  });
  return '{ ' + result.join(', ') + (result.length > 0 ? ' ' : '') + '}'
}

function stringifyComplex (prefix, indent, key, value) {
  var valueType = tomlType(value);
  /* istanbul ignore else */
  if (valueType === 'array') {
    return stringifyArrayOfTables(prefix, indent, key, value)
  } else if (valueType === 'table') {
    return stringifyComplexTable(prefix, indent, key, value)
  } else {
    throw typeError(valueType)
  }
}

function stringifyArrayOfTables (prefix, indent, key, values) {
  values = toJSON(values);
  validateArray(values);
  var firstValueType = tomlType(values[0]);
  /* istanbul ignore if */
  if (firstValueType !== 'table') throw typeError(firstValueType)
  var fullKey = prefix + stringifyKey(key);
  var result = '';
  values.forEach(table => {
    if (result.length > 0) result += '\n';
    result += indent + '[[' + fullKey + ']]\n';
    result += stringifyObject(fullKey + '.', indent, table);
  });
  return result
}

function stringifyComplexTable (prefix, indent, key, value) {
  var fullKey = prefix + stringifyKey(key);
  var result = '';
  if (getInlineKeys(value).length > 0) {
    result += indent + '[' + fullKey + ']\n';
  }
  return result + stringifyObject(fullKey + '.', indent, value)
}

var stringifyExports = stringify$1.exports;

toml$1.parse = parseExports;
toml$1.stringify = stringifyExports;

const os$3 = require$$0$3;
const path$5 = require$$1;

// 配置文件路径
const CONFIG_FILE$1 = path$5.join(os$3.homedir(), '.ccapi-config.json');

// Claude settings.json中的环境变量键名
const CLAUDE_ENV_KEYS$4 = {
  url: 'ANTHROPIC_BASE_URL',
  key: 'ANTHROPIC_API_KEY',
  token: 'ANTHROPIC_AUTH_TOKEN',
  model: 'ANTHROPIC_MODEL',
  fast: 'ANTHROPIC_SMALL_FAST_MODEL',
  timeout: 'API_TIMEOUT_MS',
  tokens: 'CLAUDE_CODE_MAX_OUTPUT_TOKENS',
  http: 'HTTP_PROXY',
  https: 'HTTPS_PROXY'
};

// 注意：错误和成功消息现在使用 i18n 系统管理
// 这里保留错误键名供兼容性使用
const ERROR_KEYS = {
  CONFIG_NOT_FOUND: 'errors.CONFIG_NOT_FOUND',
  SETTINGS_NOT_FOUND: 'errors.SETTINGS_NOT_FOUND',
  API_CONFIG_NOT_FOUND: 'errors.API_CONFIG_NOT_FOUND',
  INVALID_JSON: 'errors.INVALID_JSON',
  INVALID_YAML: 'errors.INVALID_YAML',
  INVALID_TOML: 'errors.INVALID_TOML',
  CONFIG_NAME_NOT_FOUND: 'errors.CONFIG_NAME_NOT_FOUND',
  SAME_CONFIG: 'errors.SAME_CONFIG',
  BACKUP_FAILED: 'errors.BACKUP_FAILED',
  ENV_SET_FAILED: 'errors.ENV_SET_FAILED',
  ENV_CLEAR_FAILED: 'errors.ENV_CLEAR_FAILED',
  PERMISSION_DENIED: 'errors.PERMISSION_DENIED',
  ENV_NOT_FOUND: 'errors.ENV_NOT_FOUND',
  PLATFORM_NOT_SUPPORTED: 'errors.PLATFORM_NOT_SUPPORTED'
};

const SUCCESS_KEYS = {
  CONFIG_SAVED: 'success.CONFIG_SAVED',
  CONFIG_SWITCHED: 'success.CONFIG_SWITCHED',
  RESTART_TERMINAL: 'success.RESTART_TERMINAL',
  BACKUP_CREATED: 'success.BACKUP_CREATED',
  ENV_SET_SUCCESS: 'success.ENV_SET_SUCCESS',
  ENV_CLEAR_SUCCESS: 'success.ENV_CLEAR_SUCCESS',
  FULL_CLEAR_SUCCESS: 'success.FULL_CLEAR_SUCCESS',
  ENV_SYNC_SUCCESS: 'success.ENV_SYNC_SUCCESS'
};

// 为了向后兼容，保留原有的对象名称
const ERROR_MESSAGES$5 = ERROR_KEYS;
const SUCCESS_MESSAGES$1 = SUCCESS_KEYS;

var constants = {
  CONFIG_FILE: CONFIG_FILE$1,
  CLAUDE_ENV_KEYS: CLAUDE_ENV_KEYS$4,
  ERROR_MESSAGES: ERROR_MESSAGES$5,
  SUCCESS_MESSAGES: SUCCESS_MESSAGES$1
};

const fs$2 = lib$1;
const path$4 = require$$1;
const JSON5 = require$$2.default;
const yaml = jsYaml;
const { load: tomlLoad } = distExports;
const TOML = toml$1;
const { ERROR_MESSAGES: ERROR_MESSAGES$4 } = constants;

/**
 * 支持的配置文件格式
 */
const SUPPORTED_FORMATS = {
  '.json': 'json', // 支持 JSON
  '.jsonc': 'json5', // 支持 JSONC
  '.json5': 'json5', // 支持 JSON5
  '.yaml': 'yaml', // 支持 YAML
  '.yml': 'yaml', // 支持 YML
  '.toml': 'toml' // 支持 TOML
};

/**
 * 根据文件扩展名获取格式类型
 */
function getConfigFormat(filePath) {
  const ext = path$4.extname(filePath).toLowerCase();
  return SUPPORTED_FORMATS[ext] || null
}

/**
 * 读取配置文件（支持 JSON、JSON5、JSONC、YAML、TOML 格式）
 */
async function readConfigFile$5(filePath) {
  try {
    if (!(await fs$2.pathExists(filePath))) {
      throw new Error('File does not exist: ' + filePath)
    }

    const content = await fs$2.readFile(filePath, 'utf8');
    const format = getConfigFormat(filePath);

    if (!format) {
      throw new Error('Unsupported configuration file format: ' + path$4.extname(filePath))
    }

    let parsed;
    switch (format) {
      case 'json':
        parsed = JSON.parse(content);
        break
      case 'json5':
        parsed = JSON5.parse(content);
        break
      case 'yaml':
        parsed = yaml.load(content);
        break
      case 'toml':
        parsed = tomlLoad(content);
        break
      default:
        throw new Error('Unimplemented configuration file format: ' + format)
    }

    return parsed
  } catch (error) {
    if (error.name === 'JSONError' || error.message.includes('JSON')) {
      throw new Error(`Invalid JSON format in file: ${filePath} - ${error.message}`)
    }
    if (error.name === 'YAMLException') {
      throw new Error(`Invalid YAML format in file: ${filePath} - ${error.message}`)
    }
    if (error.name === 'TomlError' || error.message.includes('TOML')) {
      throw new Error(`Invalid TOML format in file: ${filePath} - ${error.message}`)
    }
    throw error
  }
}

/**
 * 写入配置文件（支持 JSON、JSON5、YAML、TOML 格式）
 */
async function writeConfigFile$4(filePath, data) {
  try {
    // 确保目录存在
    await fs$2.ensureDir(path$4.dirname(filePath));

    const format = getConfigFormat(filePath);
    let content;

    switch (format) {
      case 'json':
        content = JSON.stringify(data, null, 2);
        break
      case 'json5':
        content = JSON5.stringify(data, null, 2);
        break
      case 'yaml':
        content = yaml.dump(data, {
          indent: 2,
          lineWidth: -1,
          noRefs: true
        });
        break
      case 'toml':
        content = TOML.stringify(data);
        break
      default:
        throw new Error('Unsupported configuration file format: ' + path$4.extname(filePath))
    }

    await fs$2.writeFile(filePath, content, 'utf8');
  } catch (error) {
    throw new Error('Failed to write file: ' + filePath + ' - ' + error.message)
  }
}

/**
 * 扩展的路径验证（放宽限制）
 */
function validateApiConfigPath$1(filePath) {
  if (!filePath || typeof filePath !== 'string') {
    return false
  }

  // 检查是否为绝对路径
  if (!path$4.isAbsolute(filePath)) {
    return false
  }

  // 检查文件扩展名 - 支持更多格式
  const ext = path$4.extname(filePath).toLowerCase();
  const allowedExtensions = Object.keys(SUPPORTED_FORMATS);

  return allowedExtensions.includes(ext)
}

var configReader = {
  readConfigFile: readConfigFile$5,
  writeConfigFile: writeConfigFile$4,
  validateApiConfigPath: validateApiConfigPath$1};

const fs$1 = lib$1;
const path$3 = require$$1;
const { readConfigFile: readFile, writeConfigFile: writeFile } = configReader;
const { ERROR_MESSAGES: ERROR_MESSAGES$3 } = constants;

/**
 * 读取配置文件
 */
async function readConfigFile$4(filePath) {
  return await readFile(filePath)
}

/**
 * 写入配置文件
 */
async function writeConfigFile$3(filePath, data) {
  return await writeFile(filePath, data)
}

/**
 * 备份文件
 */
async function backupFile$2(filePath) {
  try {
    const backupPath = `${filePath}.backup`;
    await fs$1.copy(filePath, backupPath);
    return backupPath
  } catch (error) {
    throw new Error(`Failed to backup file: ${error.message}`)
  }
}

/**
 * 检查文件是否存在
 */
async function fileExists$3(filePath) {
  return await fs$1.pathExists(filePath)
}

/**
 * 读取文件内容（纯文本）
 */
async function readFileContent$1(filePath) {
  try {
    return await fs$1.readFile(filePath, 'utf8')
  } catch (error) {
    throw new Error(`Failed to read file: ${error.message}`)
  }
}

/**
 * 写入文件内容（纯文本）
 */
async function writeFileContent$1(filePath, content) {
  try {
    // 确保目录存在
    await fs$1.ensureDir(path$3.dirname(filePath));
    await fs$1.writeFile(filePath, content, 'utf8');
  } catch (error) {
    throw new Error(`Failed to write file: ${error.message}`)
  }
}

/**
 * 验证路径格式
 */
function validatePath$1(filePath) {
  if (!filePath || typeof filePath !== 'string') {
    return false
  }

  // 检查是否为绝对路径
  if (!path$3.isAbsolute(filePath)) {
    return false
  }

  // 检查文件扩展名
  const ext = path$3.extname(filePath).toLowerCase();
  return ext === '.json'
}

var file = {
  readConfigFile: readConfigFile$4,
  writeConfigFile: writeConfigFile$3,
  readFileContent: readFileContent$1,
  writeFileContent: writeFileContent$1,
  backupFile: backupFile$2,
  fileExists: fileExists$3,
  validatePath: validatePath$1
};

const { readConfigFile: readConfigFile$3, writeConfigFile: writeConfigFile$2, fileExists: fileExists$2 } = file;
const { CONFIG_FILE, ERROR_MESSAGES: ERROR_MESSAGES$2 } = constants;
/**
 * 读取用户配置
 */
async function readConfig$3() {
  try {
    if (!(await fileExists$2(CONFIG_FILE))) {
      return { lang: 'zh' } // 默认中文
    }
    const config = await readConfigFile$3(CONFIG_FILE);
    // 确保lang字段存在，默认为中文
    if (!config.lang) {
      config.lang = 'zh';
    }
    return config
  } catch (error) {
    throw new Error('Failed to read configuration: ' + error.message)
  }
}

/**
 * 写入用户配置
 */
async function writeConfig$1(config) {
  try {
    await writeConfigFile$2(CONFIG_FILE, config);
  } catch (error) {
    throw new Error('Failed to save configuration: ' + error.message)
  }
}

/**
 * 获取settings.json路径
 */
async function getSettingsPath$1() {
  const config = await readConfig$3();
  return config.settingsPath || null
}

/**
 * 获取api.json路径
 */
async function getApiConfigPath$1() {
  const config = await readConfig$3();
  return config.apiConfigPath || null
}

/**
 * 设置settings.json路径
 */
async function setSettingsPath$1(path) {
  const config = await readConfig$3();
  config.settingsPath = path;
  await writeConfig$1(config);
}

/**
 * 设置api.json路径
 */
async function setApiConfigPath$1(path) {
  const config = await readConfig$3();
  config.apiConfigPath = path;
  await writeConfig$1(config);
}

/**
 * 验证配置完整性
 */
async function validateConfig$3() {
  const config = await readConfig$3();

  if (!config.settingsPath) {
    throw new Error('settings.json file path not set')
  }

  if (!config.apiConfigPath) {
    throw new Error('API configuration file path not set')
  }

  if (!(await fileExists$2(config.settingsPath))) {
    throw new Error('settings.json file not found')
  }

  if (!(await fileExists$2(config.apiConfigPath))) {
    throw new Error('API configuration file not found')
  }

  return config
}

var config = {
  readConfig: readConfig$3,
  writeConfig: writeConfig$1,
  getSettingsPath: getSettingsPath$1,
  getApiConfigPath: getApiConfigPath$1,
  setSettingsPath: setSettingsPath$1,
  setApiConfigPath: setApiConfigPath$1,
  validateConfig: validateConfig$3
};

// 中文语言文件
var zh = {
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
};

// English language file
var en = {
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
};

const { readConfig: readConfig$2, writeConfig } = config;
const zhMessages = zh;
const enMessages = en;

// 缓存语言消息和当前语言
let currentMessages = null;
let currentLang = null;

// 支持的语言列表
const SUPPORTED_LANGUAGES = {
  zh: '中文',
  en: 'English'
};

/**
 * 获取当前语言设置
 * @returns {string} 语言代码
 */
async function getCurrentLang$1() {
  if (currentLang) {
    return currentLang
  }
  
  try {
    const config = await readConfig$2();
    currentLang = config.lang || 'zh'; // 默认中文
    return currentLang
  } catch (error) {
    // 读取配置失败时使用默认语言
    currentLang = 'zh';
    return currentLang
  }
}

/**
 * 设置语言
 * @param {string} lang 语言代码
 */
async function setLang$1(lang) {
  if (!SUPPORTED_LANGUAGES[lang]) {
    const supportedList = Object.keys(SUPPORTED_LANGUAGES).map(k => `${k} (${SUPPORTED_LANGUAGES[k]})`).join(', ');
    throw new Error(await t$a('utils.UNSUPPORTED_LANGUAGE', supportedList))
  }
  
  const config = await readConfig$2();
  config.lang = lang;
  await writeConfig(config);
  
  // 清除缓存，强制重新加载
  currentLang = lang;
  currentMessages = null;
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
  };
  
  if (messagesMap[lang]) {
    return messagesMap[lang]
  }
  
  // 如果请求的语言不存在，回退到中文
  if (lang !== 'zh') {
    console.warn(`Warning: Cannot load language file ${lang}.js, falling back to Chinese`);
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
async function t$a(key, ...args) {
  try {
    // 获取当前语言和消息
    const lang = await getCurrentLang$1();
    
    if (!currentMessages || currentLang !== lang) {
      currentMessages = loadMessages(lang);
      currentLang = lang;
    }
    
    // 解析嵌套键
    const keys = key.split('.');
    let value = currentMessages;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && value.hasOwnProperty(k)) {
        value = value[k];
      } else {
        // 键不存在时返回键名
        console.warn(`Warning: Translation key "${key}" does not exist`);
        return key
      }
    }
    
    // 如果值不是字符串，返回键名
    if (typeof value !== 'string') {
      console.warn(`Warning: Translation key "${key}" value is not a string`);
      return key
    }
    
    // 参数替换
    let result = value;
    args.forEach((arg, index) => {
      result = result.replace(new RegExp(`\\{${index}\\}`, 'g'), arg);
    });
    
    return result
  } catch (error) {
    console.warn(`Warning: Translation failed: ${error.message}`);
    return key
  }
}

/**
 * 获取支持的语言列表
 * @returns {object} 支持的语言对象
 */
function getSupportedLanguages$1() {
  return SUPPORTED_LANGUAGES
}

/**
 * 检查语言是否支持
 * @param {string} lang 语言代码
 * @returns {boolean} 是否支持
 */
function isLanguageSupported$1(lang) {
  return SUPPORTED_LANGUAGES.hasOwnProperty(lang)
}

var i18n = {
  getCurrentLang: getCurrentLang$1,
  setLang: setLang$1,
  t: t$a,
  getSupportedLanguages: getSupportedLanguages$1,
  isLanguageSupported: isLanguageSupported$1};

const chalk$9 = source$1;
const packageJson$2 = require$$2$1;

/**
 * 显示版本信息
 */
async function versionCommand$1() {
  console.log(chalk$9.green.bold(`${packageJson$2.name} v${packageJson$2.version}`));
}

var version = versionCommand$1;

const { validatePath } = file;
const { validateApiConfigPath } = configReader;
const { t: t$9 } = i18n;

/**
 * 验证API配置数据结构
 */
function validateApiConfig$2(apiConfig) {
  if (!apiConfig) {
    return false
  }

  // 检查是否至少有一个配置
  const configNames = Object.keys(apiConfig);
  if (configNames.length === 0) {
    return false
  }

  // 验证每个配置的结构
  for (const name of configNames) {
    const config = apiConfig[name];
    if (!config || !config.url || (!config.key && !config.token)) {
      return false
    }
  }

  return true
}

/**
 * 验证settings.json结构
 */
function validateSettingsConfig$2(settings) {
  if (!settings || typeof settings !== 'object') {
    return false
  }

  // 检查env字段存在
  // if (!settings.env || typeof settings.env !== 'object') {
  //   return false;
  // }

  return true
}

/**
 * 验证配置名称是否存在
 */
function validateConfigName$2(apiConfig, configName) {
  return apiConfig && apiConfig[configName] !== undefined
}

/**
 * 验证命令行参数
 */
async function validateSetCommand$1(options) {
  const { settings, api } = options;

  // 至少需要设置其中一个
  // if (!settings && !api) {
  //   return {
  //     valid: false,
  //     error: '请指定要设置的路径参数 (--settings 或 --api)'
  //   };
  // }

  // 验证settings路径
  if (settings && !validatePath(settings)) {
    return {
      valid: false,
      error: await t$9('utils.SETTINGS_PATH_FORMAT_ERROR')
    }
  }

  // 验证api路径 - 使用放宽的验证
  if (api && !validateApiConfigPath(api)) {
    return {
      valid: false,
      error: await t$9('utils.API_PATH_FORMAT_ERROR')
    }
  }

  return { valid: true }
}

var validator = {
  validateApiConfig: validateApiConfig$2,
  validateSettingsConfig: validateSettingsConfig$2,
  validateConfigName: validateConfigName$2,
  validateSetCommand: validateSetCommand$1
};

const chalk$8 = source$1;
const os$2 = require$$0$3;
const path$2 = require$$1;
const { validateSetCommand } = validator;
const { setSettingsPath, setApiConfigPath, getSettingsPath, getApiConfigPath } = config;
const { fileExists: fileExists$1 } = file;
const { t: t$8 } = i18n;

/**
 * 设置配置文件路径命令
 */
async function setCommand$1(options) {
  try {
    const { settings, api } = options;
    // 如果没有提供任何参数，显示当前配置路径
    if (!settings && !api) {
      console.log(chalk$8.green(await t$8('prompts.CURRENT_CONFIG_PATHS')));

      try {
        const currentSettingsPath = await getSettingsPath();
        const currentApiPath = await getApiConfigPath();

        if (currentSettingsPath) {
          const settingsExists = await fileExists$1(currentSettingsPath);
          const statusIcon = settingsExists ? chalk$8.green('✓') : chalk$8.red('✗');
          console.log(`  settings.json: ${statusIcon} ${chalk$8.cyan(currentSettingsPath)}`);
          if (!settingsExists) {
            console.log(
              `    ${chalk$8.yellow((await t$8('prompts.WARNING')) + ': ' + (await t$8('prompts.FILE_NOT_EXISTS')))}`
            );
          }
        } else {
          console.log(`  settings.json: ${chalk$8.yellow(await t$8('prompts.NOT_SET'))}`);
        }

        if (currentApiPath) {
          const apiExists = await fileExists$1(currentApiPath);
          const statusIcon = apiExists ? chalk$8.green('✓') : chalk$8.red('✗');
          console.log(`  api: ${statusIcon} ${chalk$8.cyan(currentApiPath)}`);
          if (!apiExists) {
            console.log(
              `    ${chalk$8.yellow((await t$8('prompts.WARNING')) + ': ' + (await t$8('prompts.FILE_NOT_EXISTS')))}`
            );
          }
        } else {
          console.log(`  api: ${chalk$8.yellow(await t$8('prompts.NOT_SET'))}`);
        }

        // 显示codex配置路径
        const codexConfigPath = path$2.join(os$2.homedir(), '.codex', 'config.toml');
        const codexExists = await fileExists$1(codexConfigPath);
        const codexStatusIcon = codexExists ? chalk$8.green('✓') : chalk$8.red('✗');
        console.log(`  codex: ${codexStatusIcon} ${chalk$8.cyan(codexConfigPath)}`);
        if (!codexExists) {
          console.log(
            `    ${chalk$8.yellow((await t$8('prompts.WARNING')) + ': ' + (await t$8('prompts.FILE_NOT_EXISTS')))}`
          );
        }

        console.log();
        console.log(await t$8('prompts.SET_PATHS_HELP'));
        console.log(`  ${chalk$8.cyan('ccapi set --settings <path>')} - ${await t$8('prompts.SET_SETTINGS_HELP')}`);
        console.log(`  ${chalk$8.cyan('ccapi set --api <path>')} - ${await t$8('prompts.SET_API_HELP')}`);
      } catch (error) {
        console.error(chalk$8.red((await t$8('errors.READ_CONFIG_FAILED')) + ':'), error.message);
      }
      return
    }

    // 验证命令参数
    const validation = await validateSetCommand(options);

    if (!validation.valid) {
      console.error(chalk$8.red((await t$8('errors.PARAM_ERROR')) + ':'), validation.error);
      return
    }

    const results = [];

    // 设置settings.json路径
    if (settings) {
      // 检查文件是否存在
      if (!(await fileExists$1(settings))) {
        console.warn(
          chalk$8.yellow((await t$8('prompts.WARNING')) + ':'),
          await t$8('setPaths.SETTINGS_FILE_NOT_EXIST', settings)
        );
        console.log(await t$8('prompts.PATH_SAVED_ENSURE_EXISTS'));
      }

      await setSettingsPath(settings);
      results.push(`settings.json path: ${chalk$8.green(settings)}`);
    }

    // 设置api.json路径
    if (api) {
      // 检查文件是否存在
      if (!(await fileExists$1(api))) {
        console.warn(chalk$8.yellow((await t$8('prompts.WARNING')) + ':'), await t$8('setPaths.API_FILE_NOT_EXIST', api));
        console.log(await t$8('prompts.PATH_SAVED_ENSURE_EXISTS'));
      }

      await setApiConfigPath(api);
      results.push(`api path: ${chalk$8.green(api)}`);
    }

    // 显示结果
    console.log(chalk$8.blue(await t$8('success.CONFIG_SAVED')));
    results.forEach((result) => console.log(`  ${result}`));
  } catch (error) {
    console.error(chalk$8.red((await t$8('errors.SET_FAILED')) + ':'), error.message);
    process.exit(1);
  }
}

var set = setCommand$1;

const os$1 = require$$0$3;
const path$1 = require$$1;
const fs = lib$1;
const { exec } = require$$0$2;
const { promisify } = require$$4$1;
const chalk$7 = source$1;
const { CLAUDE_ENV_KEYS: CLAUDE_ENV_KEYS$3 } = constants;
const { t: t$7 } = i18n;

const execAsync = promisify(exec);
const maxText$3 = 30;

// 配置标识环境变量名
const CONFIG_IDENTIFIER$1 = 'CCAPI_CURRENT_CONFIG';

/**
 * 获取当前平台类型
 */
async function getPlatformType() {
  const platform = os$1.platform();
  if (platform === 'win32') return 'windows'
  if (platform === 'darwin') return 'mac'
  if (platform === 'linux') return 'linux'

  throw new Error(await t$7('utils.PLATFORM_NOT_SUPPORTED', platform))
}

/**
 * 获取Shell配置文件路径（Mac/Linux）
 */
async function getShellConfigPath() {
  const homeDir = os$1.homedir();
  const shell = process.env.SHELL || '/bin/bash';

  // 优先级: .zshrc > .bashrc > .bash_profile > .profile
  const configFiles = [
    path$1.join(homeDir, '.zshrc'),
    path$1.join(homeDir, '.bashrc'),
    path$1.join(homeDir, '.bash_profile'),
    path$1.join(homeDir, '.profile')
  ];

  // 如果是zsh，优先使用.zshrc
  if (shell.includes('zsh')) {
    return configFiles[0]
  }

  // 寻找第一个存在的配置文件
  for (const configFile of configFiles) {
    if (await fs.pathExists(configFile)) {
      return configFile
    }
  }

  // 如果都不存在，创建对应shell的默认配置文件
  if (shell.includes('zsh')) {
    return configFiles[0] // .zshrc
  }
  return configFiles[1] // .bashrc
}

/**
 * 删除Windows环境变量
 */
async function removeWindowsEnvVar(key) {
  try {
    // Windows删除环境变量，设置为空值
    const command = `reg delete "HKEY_CURRENT_USER\\Environment" /v "${key}" /f`;
    await execAsync(command);
    return true
  } catch (error) {
    // 忽略变量不存在的错误
    if (error.message.includes('ERROR: The system was unable to find')) {
      return true
    }
    return false
  }
}

/**
 * 设置Unix系统环境变量（Mac/Linux）- 批量设置
 */
async function setUnixEnvVars(envVars) {
  try {
    const configPath = await getShellConfigPath();

    // 读取现有配置文件内容
    let content = '';
    if (await fs.pathExists(configPath)) {
      content = await fs.readFile(configPath, 'utf8');
    }

    // CCAPI环境变量标记区域
    const startMarker = '# CCAPI Environment Variables - START';
    const endMarker = '# CCAPI Environment Variables - END';

    // 移除旧的CCAPI配置区域
    const startIndex = content.indexOf(startMarker);
    const endIndex = content.indexOf(endMarker);

    if (startIndex !== -1 && endIndex !== -1) {
      content = content.substring(0, startIndex) + content.substring(endIndex + endMarker.length + 1);
    }

    // 构建新的环境变量区域
    const envLines = ['', startMarker, ...Object.entries(envVars).map(([k, v]) => `export ${k}="${v}"`), endMarker, ''];

    // 写入配置文件
    const newContent = content.trim() + '\n' + envLines.join('\n');
    await fs.writeFile(configPath, newContent);

    return true
  } catch (error) {
    console.error(chalk$7.red(await t$7('utils.ENV_SET_FAILED')), error.message);
    return false
  }
}

/**
 * 设置Windows系统环境变量 - 批量设置
 */
async function setWindowsEnvVars(envVars) {
  try {
    // Windows需要逐个设置，但我们可以并行执行
    const promises = Object.entries(envVars).map(async ([key, value]) => {
      try {
        const command = `setx "${key}" "${value}"`;
        await execAsync(command);
        return { key, success: true }
      } catch (error) {
        console.error(chalk$7.red(await t$7('utils.ENV_SET_FAILED_KEY', key)), error.message);
        return { key, success: false, error: error.message }
      }
    });

    const allResults = await Promise.allSettled(promises);
    let successCount = 0;

    allResults.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.success) {
        successCount++;
      }
    });

    return successCount === Object.keys(envVars).length
  } catch (error) {
    console.error(chalk$7.red(await t$7('utils.ENV_SET_FAILED')), error.message);
    return false
  }
}

/**
 * 删除Unix系统环境变量（Mac/Linux）
 */
async function removeUnixEnvVars() {
  try {
    const configPath = await getShellConfigPath();

    if (!(await fs.pathExists(configPath))) {
      return true
    }

    const content = await fs.readFile(configPath, 'utf8');

    // CCAPI环境变量标记区域
    const startMarker = '# CCAPI Environment Variables - START';
    const endMarker = '# CCAPI Environment Variables - END';

    // 移除CCAPI配置区域
    const startIndex = content.indexOf(startMarker);
    const endIndex = content.indexOf(endMarker);

    if (startIndex !== -1 && endIndex !== -1) {
      const newContent = content.substring(0, startIndex) + content.substring(endIndex + endMarker.length + 1);
      await fs.writeFile(configPath, newContent.trim() + '\n');
    }

    return true
  } catch (error) {
    console.error(chalk$7.red.bold(await t$7('utils.ENV_DELETE_FAILED')), error.message);
    return false
  }
}

/**
 * 获取系统中已设置的相关环境变量
 */
async function getSystemEnvVars() {
  const envVars = {};

  // 获取所有CLAUDE_ENV_KEYS相关的环境变量
  const allKeys = Object.values(CLAUDE_ENV_KEYS$3);
  allKeys.push(CONFIG_IDENTIFIER$1); // 添加配置标识符

  for (const key of allKeys) {
    const value = process.env[key];
    if (value) {
      envVars[key] = value;
    }
  }

  return envVars
}

/**
 * 设置配置到系统环境变量
 */
async function setSystemEnvVars$2(config, configName, tip = true) {
  try {
    const platform = await getPlatformType(); // 这里会抛出不支持平台的错误

    // console.log(await t('claude.SWITCHING_ENV'))

    // 构建所有要设置的环境变量
    const envVarsToSet = {};

    // 添加配置标识符
    envVarsToSet[CONFIG_IDENTIFIER$1] = configName;

    // 遍历配置对象，添加相关环境变量
    for (const [configKey, envKey] of Object.entries(CLAUDE_ENV_KEYS$3)) {
      if (config[configKey]) {
        let value = config[configKey];

        // 处理数组类型，取第一个值
        if (Array.isArray(value)) {
          value = value[0];
        }

        envVarsToSet[envKey] = value;
      }
    }

    // 根据平台设置环境变量
    let success = false;
    if (platform === 'windows') {
      success = await setWindowsEnvVars(envVarsToSet);
    } else {
      success = await setUnixEnvVars(envVarsToSet);
    }

    if (!tip) return success

    if (success) {
      // 显示已设置的环境变量
      console.log();
      console.log(
        chalk$7.green.bold(await t$7('utils.ENV_SET_SUCCESS_MSG', configName)),
        chalk$7.yellow.bold(await t$7('success.RESTART_TERMINAL'))
      );
      console.log();

      // 按照CLAUDE_ENV_KEYS的顺序显示环境变量
      for (const [configKey, envKey] of Object.entries(CLAUDE_ENV_KEYS$3)) {
        if (envVarsToSet[envKey]) {
          let displayValue = envVarsToSet[envKey];

          // 对敏感信息进行脱敏处理
          if (configKey === 'key' || configKey === 'token') {
            displayValue = displayValue.length > maxText$3 ? displayValue.slice(0, maxText$3) + '...' : displayValue;
          }

          console.log(`  ${chalk$7.cyan(envKey)}: ${chalk$7.green(displayValue)}`);
        }
      }
      console.log();
    } else {
      console.log();
      console.error(chalk$7.red.bold(await t$7('utils.ENV_SET_FAILED_MSG')));
    }

    return success
  } catch (error) {
    console.error(chalk$7.red(await t$7('utils.ENV_SET_FAILED')), error.message);
    return false
  }
}

/**
 * 清除系统中的相关环境变量
 */
async function clearSystemEnvVars$2() {
  try {
    const platform = await getPlatformType(); // 这里会抛出不支持平台的错误
    // console.log(chalk.green.bold('正在清除系统环境变量...'))

    if (platform === 'windows') {
      // Windows: 删除注册表中的环境变量
      const allKeys = Object.values(CLAUDE_ENV_KEYS$3);
      allKeys.push(CONFIG_IDENTIFIER$1);

      let successCount = 0;
      for (const key of allKeys) {
        const success = await removeWindowsEnvVar(key);
        if (success) successCount++;
      }
    } else {
      // Unix: 删除shell配置文件中的环境变量
      await removeUnixEnvVars();
    }
    console.log(
      chalk$7.green.bold(await t$7('utils.ENV_CLEAR_SUCCESS')),
      chalk$7.yellow.bold(await t$7('success.RESTART_TERMINAL'))
    );
    return true
  } catch (error) {
    console.error(chalk$7.red.bold(await t$7('utils.ENV_CLEAR_FAILED')), error.message);
    return false
  }
}

/**
 * 获取当前使用的配置名称
 */
function getCurrentConfigName$2() {
  return process.env[CONFIG_IDENTIFIER$1] || null
}

/**
 * 检测环境变量设置状态
 */
async function checkEnvStatus$2() {
  const envVars = await getSystemEnvVars();
  const currentConfig = getCurrentConfigName$2();

  return {
    hasEnvVars: Object.keys(envVars).length > 1, // 除了CONFIG_IDENTIFIER之外还有其他变量
    currentConfig,
    envVars
  }
}

var env$1 = {
  setSystemEnvVars: setSystemEnvVars$2,
  clearSystemEnvVars: clearSystemEnvVars$2,
  getCurrentConfigName: getCurrentConfigName$2,
  checkEnvStatus: checkEnvStatus$2,
  CONFIG_IDENTIFIER: CONFIG_IDENTIFIER$1
};

const chalk$6 = source$1;
const { validateConfig: validateConfig$2, readConfig: readConfig$1 } = config;
const { readConfigFile: readConfigFile$2, writeConfigFile: writeConfigFile$1, backupFile: backupFile$1 } = file;
const { validateApiConfig: validateApiConfig$1, validateSettingsConfig: validateSettingsConfig$1, validateConfigName: validateConfigName$1 } = validator;
const { CLAUDE_ENV_KEYS: CLAUDE_ENV_KEYS$2, ERROR_MESSAGES: ERROR_MESSAGES$1, SUCCESS_MESSAGES } = constants;
const { setSystemEnvVars: setSystemEnvVars$1 } = env$1;
const { t: t$6 } = i18n;

const maxText$2 = 30;

/**
 * 获取当前使用的配置名称和各字段索引信息
 */
function getCurrentConfigInfo(settingsData, apiConfig) {
  const currentUrl = settingsData.env?.[CLAUDE_ENV_KEYS$2.url];
  const currentKey = settingsData.env?.[CLAUDE_ENV_KEYS$2.key];
  const currentToken = settingsData.env?.[CLAUDE_ENV_KEYS$2.token];
  const currentModel = settingsData.env?.[CLAUDE_ENV_KEYS$2.model];
  const currentFast = settingsData.env?.[CLAUDE_ENV_KEYS$2.fast];

  // 优先基于 key/token 匹配，如果都没有则基于 URL 匹配
  const matchField = currentKey || currentToken;
  if (!matchField && !currentUrl) {
    return {
      name: null,
      urlIndex: -1,
      keyIndex: -1,
      tokenIndex: -1,
      modelIndex: -1,
      fastIndex: -1
    }
  }

  // 查找匹配的配置
  for (const [name, config] of Object.entries(apiConfig)) {
    let isMatch = false;

    // 检查 key 匹配
    if (currentKey) {
      if (Array.isArray(config.key)) {
        if (config.key.includes(currentKey)) isMatch = true;
      } else if (config.key === currentKey) {
        isMatch = true;
      }
    }

    // 检查 token 匹配
    if (currentToken && !isMatch) {
      if (Array.isArray(config.token)) {
        if (config.token.includes(currentToken)) isMatch = true;
      } else if (config.token === currentToken) {
        isMatch = true;
      }
    }

    // 如果没有 key/token，则基于 URL 匹配（兼容旧逻辑）
    if (!currentKey && !currentToken && currentUrl) {
      if (Array.isArray(config.url)) {
        if (config.url.includes(currentUrl)) isMatch = true;
      } else if (config.url === currentUrl) {
        isMatch = true;
      }
    }

    if (isMatch) {
      let urlIndex = -1;
      let keyIndex = -1;
      let tokenIndex = -1;
      let modelIndex = -1;
      let fastIndex = -1;

      // 查找当前使用的 URL 索引
      if (currentUrl) {
        if (Array.isArray(config.url)) {
          urlIndex = config.url.indexOf(currentUrl);
        } else if (config.url === currentUrl) {
          urlIndex = 0; // 字符串情况下默认为0
        }
      }

      // 查找当前使用的 key 索引
      if (currentKey) {
        if (Array.isArray(config.key)) {
          keyIndex = config.key.indexOf(currentKey);
        } else if (config.key === currentKey) {
          keyIndex = 0; // 字符串情况下默认为0
        }
      }

      // 查找当前使用的 token 索引
      if (currentToken) {
        if (Array.isArray(config.token)) {
          tokenIndex = config.token.indexOf(currentToken);
        } else if (config.token === currentToken) {
          tokenIndex = 0; // 字符串情况下默认为0
        }
      }

      // 查找当前使用的模型索引
      if (currentModel) {
        if (Array.isArray(config.model)) {
          modelIndex = config.model.indexOf(currentModel);
        } else if (config.model === currentModel) {
          modelIndex = 0; // 字符串情况下默认为0
        }
      }

      // 查找当前使用的快速模型索引
      if (currentFast) {
        if (Array.isArray(config.fast)) {
          fastIndex = config.fast.indexOf(currentFast);
        } else if (config.fast === currentFast) {
          fastIndex = 0; // 字符串情况下默认为0
        }
      }

      return { name, urlIndex, keyIndex, tokenIndex, modelIndex, fastIndex }
    }
  }

  return {
    name: null,
    urlIndex: -1,
    keyIndex: -1,
    tokenIndex: -1,
    modelIndex: -1,
    fastIndex: -1
  }
}

/**
 * 格式化字段显示（支持 URL、Key、Token、Model、Fast）
 */
async function formatFieldDisplay(fieldValue, currentIndex, label, isMasked = false) {
  // 获取本地化标签
  const localizedLabel = await t$6(`list.${label}`) || label;

  if (Array.isArray(fieldValue)) {
    const lines = [`${localizedLabel}:`];
    fieldValue.forEach((value, index) => {
      const isCurrentValue = index === currentIndex;
      const prefix = isCurrentValue ? '    * - ' : '      - ';

      // 处理敏感信息脱敏
      let displayValue = value;
      if (isMasked && value && value.length > maxText$2) {
        displayValue = value.slice(0, maxText$2) + '...';
      }

      const valueDisplay = isCurrentValue ? chalk$6.green.bold(displayValue) : chalk$6.cyan(displayValue);
      const text = `${prefix}${index + 1}: ${valueDisplay}`;
      lines.push(isCurrentValue ? chalk$6.green.bold(text) : text);
    });
    return lines
  } else {
    // 字符串情况，保持原样
    let displayValue = fieldValue;
    if (isMasked && fieldValue && fieldValue.length > maxText$2) {
      displayValue = fieldValue.slice(0, maxText$2) + '...';
    }

    const valueDisplay = currentIndex === 0 ? chalk$6.green.bold(displayValue) : chalk$6.cyan(displayValue);
    return [`${localizedLabel}: ${valueDisplay}`]
  }
}

/**
 * 格式化配置显示
 */
async function formatConfigDisplay(name, config, currentInfo) {
  const isCurrent = name === currentInfo.name;
  const prefix = isCurrent ? chalk$6.green.bold('*') : '  ';
  const nameDisplay = isCurrent ? chalk$6.green.bold(`[${name}]`) : chalk$6.cyan(`[${name}]`);

  // 设置默认值
  config.model = config.model || 'claude-sonnet-4-20250514';
  // config.fast = config.fast || 'claude-3-5-haiku-20241022';

  let details = [];

  // 格式化 URL 显示
  const urlLines = await formatFieldDisplay(config.url, isCurrent ? currentInfo.urlIndex : -1, 'URL');
  details.push(...urlLines);

  // 格式化模型显示
  const modelLines = await formatFieldDisplay(config.model, isCurrent ? currentInfo.modelIndex : -1, 'Model');
  details.push(...modelLines);

  // 格式化快速模型显示
  if (config.fast) {
    const fastLines = await formatFieldDisplay(config.fast, isCurrent ? currentInfo.fastIndex : -1, 'Fast');
    details.push(...fastLines);
  }

  // 格式化 Key 显示
  if (config.key) {
    const keyLines = await formatFieldDisplay(
      config.key,
      isCurrent ? currentInfo.keyIndex : -1,
      'Key',
      true // 需要脱敏
    );
    details.push(...keyLines);
  }

  // 格式化 Token 显示
  if (config.token) {
    const tokenLines = await formatFieldDisplay(
      config.token,
      isCurrent ? currentInfo.tokenIndex : -1,
      'Token',
      true // 需要脱敏
    );
    details.push(...tokenLines);
  }

  if (config.http) {
    details.push(`HTTP: ${chalk$6.cyan(config.http)}`);
  }

  if (config.https) {
    details.push(`HTTPS: ${chalk$6.cyan(config.https)}`);
  }

  console.log(`${prefix}${nameDisplay}`);
  details.forEach((detail) => {
    console.log(`    ${detail}`);
  });
}

/**
 * 列举配置命令
 */
async function listConfigs() {
  try {
    // 验证配置
    const config = await validateConfig$2();

    // 读取API配置文件
    const apiConfig = await readConfigFile$2(config.apiConfigPath);
    if (!validateApiConfig$1(apiConfig)) {
      console.error(chalk$6.red(await t$6('common.PARAMETER_ERROR')), await t$6('listDisplay.API_FORMAT_ERROR'));
      return
    }

    // 读取settings.json文件
    const settingsData = await readConfigFile$2(config.settingsPath);
    if (!validateSettingsConfig$1(settingsData)) {
      console.error(chalk$6.red(await t$6('common.PARAMETER_ERROR')), await t$6('listDisplay.SETTINGS_FORMAT_ERROR'));
      return
    }

    // 获取当前使用的配置信息
    const currentConfigInfo = getCurrentConfigInfo(settingsData, apiConfig);

    // 显示配置列表
    console.log(chalk$6.green.bold(await t$6('listDisplay.AVAILABLE_API_CONFIGS')));

    const configNames = Object.keys(apiConfig);
    if (configNames.length === 0) {
      console.log(chalk$6.yellow(await t$6('listDisplay.NO_CONFIGS_AVAILABLE')));
      return
    }

    // 按名称排序显示
    for (const name of configNames.sort()) {
      await formatConfigDisplay(name, apiConfig[name], currentConfigInfo);
      console.log(); // 空行分隔
    }

    // 显示当前状态
    if (currentConfigInfo.name) {
      console.log(chalk$6.green.bold(await t$6('listDisplay.CURRENT_CONFIG', currentConfigInfo.name)));
    } else {
      console.log(chalk$6.yellow(await t$6('listDisplay.NO_CURRENT_CONFIG')));
    }

    // 显示使用方法
    console.log();
    console.log('使用方法:');
    console.log(`  ${chalk$6.cyan('ccapi claude <config_name>')} - 切换到指定的配置`);
    console.log(`  例如: ${chalk$6.cyan('ccapi claude openai')}`);
    console.log(`  ${chalk$6.cyan('ccapi claude <config_name> -u <index>')} - 使用指定配置和URL索引`);
    console.log(`  ${chalk$6.cyan('ccapi claude <config_name> -k <index>')} - 使用指定配置和Key索引`);
  } catch (error) {
    const no = error.message.includes('未设置') || error.message.includes('不存在') || error.message.includes('Not set');
    if (no) {
      console.error(chalk$6.red(await t$6('common.CONFIG_ERROR')), error.message);
      console.log(await t$6('listDisplay.USE_SET_CMD', chalk$6.cyan('ccapi set')));
    } else {
      console.error(chalk$6.red(await t$6('listDisplay.LIST_FAILED')), error.message);
    }
    process.exit(1);
  }
}

/**
 * 更新settings.json中的环境变量
 */
function updateSettingsEnv(settingsData, targetConfig) {
  // 确保env对象存在
  if (!settingsData.env) {
    settingsData.env = {};
  }

  const env = settingsData.env;

  // 更新URL（必需）
  env[CLAUDE_ENV_KEYS$2.url] = targetConfig.url;

  // 更新Model（可选）
  env[CLAUDE_ENV_KEYS$2.model] = targetConfig.model;

  // 轻量模型（可选）
  if (targetConfig.fast) {
    env[CLAUDE_ENV_KEYS$2.fast] = targetConfig.fast;
  } else {
    delete env[CLAUDE_ENV_KEYS$2.fast];
  }

  // API请求超时时间（可选）
  if (targetConfig.timeout) {
    env[CLAUDE_ENV_KEYS$2.timeout] = targetConfig.timeout;
  } else {
    delete env[CLAUDE_ENV_KEYS$2.timeout];
  }

  if (targetConfig.tokens) {
    env[CLAUDE_ENV_KEYS$2.tokens] = targetConfig.tokens;
  } else {
    delete env[CLAUDE_ENV_KEYS$2.tokens];
  }

  if (targetConfig.key && targetConfig.token) {
    env[CLAUDE_ENV_KEYS$2.key] = targetConfig.key;
    env[CLAUDE_ENV_KEYS$2.token] = targetConfig.token;
  } else {
    // 更新Key（如果有值）
    if (targetConfig.key) {
      env[CLAUDE_ENV_KEYS$2.key] = targetConfig.key;
      delete env[CLAUDE_ENV_KEYS$2.token];
    }

    // 更新Token（如果有值）
    if (targetConfig.token) {
      env[CLAUDE_ENV_KEYS$2.token] = targetConfig.token;
      delete env[CLAUDE_ENV_KEYS$2.key];
    }
  }

  if (targetConfig.http) {
    // HTTP代理（可选）
    env[CLAUDE_ENV_KEYS$2.http] = targetConfig.http;
  } else {
    delete env[CLAUDE_ENV_KEYS$2.http];
  }
  if (targetConfig.https) {
    // HTTPS代理（可选）
    env[CLAUDE_ENV_KEYS$2.https] = targetConfig.https;
  } else {
    delete env[CLAUDE_ENV_KEYS$2.https];
  }
  return settingsData
}

/**
 * 解析和选择字段值（支持 URL、Key、Token、Model、Fast）
 */
async function selectFieldValue(fieldValue, selectedIndex, defaultValue) {
  if (Array.isArray(fieldValue)) {
    // 数组情况：选择指定索引的值，默认为第一个
    const index = selectedIndex > 0 ? selectedIndex - 1 : 0;
    if (index >= fieldValue.length) {
      throw new Error(await t$6('common.INDEX_OUT_OF_RANGE', selectedIndex, `1-${fieldValue.length}`))
    }
    return fieldValue[index]
  } else {
    // 字符串情况：直接返回，忽略索引参数
    return fieldValue || defaultValue
  }
}

/**
 * 使用指定配置命令
 */
async function claudeCommand$1(configName, options = {}) {
  try {
    // 如果没有提供配置名，显示配置列表
    if (!configName) {
      await listConfigs();
      return
    }

    // 验证配置
    const config = await validateConfig$2();

    // 读取API配置文件
    const apiConfig = await readConfigFile$2(config.apiConfigPath);
    if (!validateApiConfig$1(apiConfig)) {
      console.error(chalk$6.red(await t$6('common.PARAMETER_ERROR')), await t$6('claude.API_FORMAT_ERROR'));
      return
    }

    // 验证配置名称是否存在
    if (!validateConfigName$1(apiConfig, configName)) {
      console.error(chalk$6.red(await t$6('common.CONFIG_ERROR')), `${await t$6(ERROR_MESSAGES$1.CONFIG_NAME_NOT_FOUND)}: ${configName}`);
      console.log(chalk$6.green(await t$6('common.AVAILABLE_CONFIGS')), Object.keys(apiConfig).join(', '));
      return
    }

    // 读取settings.json文件
    const settingsData = await readConfigFile$2(config.settingsPath);
    if (!validateSettingsConfig$1(settingsData)) {
      console.error(chalk$6.red(await t$6('common.PARAMETER_ERROR')), await t$6('claude.SETTINGS_FORMAT_ERROR'));
      return
    }

    const originalConfig = apiConfig[configName];

    // 创建配置副本用于修改
    const targetConfig = { ...originalConfig };

    // 设置默认值
    targetConfig.model = targetConfig.model || 'claude-sonnet-4-20250514';
    // targetConfig.fast = targetConfig.fast || 'claude-3-5-haiku-20241022';
    // targetConfig.timeout = targetConfig.timeout || "600000";

    try {
      // 根据参数选择各字段值
      const selectedUrl = await selectFieldValue(
        targetConfig.url,
        options.url ? parseInt(options.url) : 0,
        targetConfig.url // URL 没有默认值，使用原值
      );

      const selectedKey = await selectFieldValue(
        targetConfig.key,
        options.key ? parseInt(options.key) : 0,
        targetConfig.key // Key 没有默认值，使用原值
      );

      const selectedToken = await selectFieldValue(
        targetConfig.token,
        options.token ? parseInt(options.token) : 0,
        targetConfig.token // Token 没有默认值，使用原值
      );

      const selectedModel = await selectFieldValue(
        targetConfig.model,
        options.model ? parseInt(options.model) : 0,
        'claude-sonnet-4-20250514'
      );

      const selectedFast = await selectFieldValue(targetConfig.fast, options.fast ? parseInt(options.fast) : 0, '');

      // 更新目标配置为选中的具体值
      targetConfig.url = selectedUrl;
      targetConfig.key = selectedKey;
      targetConfig.token = selectedToken;
      targetConfig.model = selectedModel;
      targetConfig.fast = selectedFast;
    } catch (error) {
      console.error(chalk$6.red(await t$6('common.PARAMETER_ERROR')), error.message);
      return
    }

    // 检查是否已经是当前配置
    // if (isCurrentConfig(settingsData, targetConfig)) {
    //   console.log(chalk.yellow(ERROR_MESSAGES.SAME_CONFIG));
    //   return;
    // }

    // 备份settings.json
    const backupPath = await backupFile$1(config.settingsPath);
    console.log(await t$6(SUCCESS_MESSAGES.BACKUP_CREATED), `(${backupPath})`);

    // 更新配置
    console.log(await t$6('claude.SWITCHING_CONFIG', configName));
    const updatedSettings = updateSettingsEnv(settingsData, targetConfig);

    // 保存更新后的settings.json
    await writeConfigFile$1(config.settingsPath, updatedSettings);

    // 同步设置到系统环境变量
    let success = false;
    const configData = await readConfig$1();
    const updateEnv = configData.useNoEnv !== void 0 ? configData.useNoEnv : true;
    if (updateEnv) {
      try {
        success = await setSystemEnvVars$1(targetConfig, configName, false);
      } catch (error) {
        console.log(chalk$6.red(await t$6('claude.SETTINGS_SUCCESS_ENV_FAILED')));
      }
    }

    // 显示成功信息
    console.log();
    console.log(
      chalk$6.green.bold(await t$6(SUCCESS_MESSAGES.CONFIG_SWITCHED)) + chalk$6.yellow.bold(await t$6(SUCCESS_MESSAGES.RESTART_TERMINAL))
    );
    if (success) {
      console.log(chalk$6.cyan(await t$6('claude.CONFIG_SYNCED')));
    }
    console.log();
    console.log(chalk$6.green.bold(await t$6('claude.CURRENT_CONFIG_DETAILS')));
    console.log(await t$6('claude.NAME_LABEL', chalk$6.cyan(configName)));
    console.log(await t$6('claude.URL_LABEL', chalk$6.cyan(targetConfig.url)));

    // 显示选中的模型信息
    console.log(await t$6('claude.MODEL_LABEL', chalk$6.cyan(targetConfig.model)));

    if (targetConfig.fast) {
      console.log(await t$6('claude.FAST_LABEL', chalk$6.cyan(targetConfig.fast)));
    }

    if (targetConfig.key) {
      const maskedKey = targetConfig.key.length > 25 ? targetConfig.key.slice(0, 25) + '...' : targetConfig.key;
      console.log(await t$6('claude.KEY_LABEL', chalk$6.cyan(maskedKey)));
    }
    if (targetConfig.token) {
      const maskedToken = targetConfig.token.length > 25 ? targetConfig.token.slice(0, 25) + '...' : targetConfig.token;
      console.log(await t$6('claude.TOKEN_LABEL', chalk$6.cyan(maskedToken)));
    }
    if (targetConfig.http) {
      console.log(await t$6('claude.HTTP_LABEL', chalk$6.cyan(targetConfig.http)));
    }
    if (targetConfig.https) {
      console.log(await t$6('claude.HTTPS_LABEL', chalk$6.cyan(targetConfig.https)));
    }
    console.log();
  } catch (error) {
    const no = error.message.includes('未设置') || error.message.includes('不存在') || error.message.includes('Not set');
    if (no) {
      console.error(chalk$6.red(await t$6('common.CONFIG_ERROR')), error.message);
      console.log(await t$6('claude.USE_SET_CMD', chalk$6.cyan('ccapi set')));
    } else {
      console.error(chalk$6.red(await t$6('claude.SWITCH_CONFIG_FAILED')), error.message);
    }
    process.exit(1);
  }
}

var claude = claudeCommand$1;

const { spawn } = require$$0$2;
const chalk$5 = source$1;
const packageJson$1 = require$$2$1;
const { t: t$5 } = i18n;

/**
 * 执行npm update命令
 * @param {string} packageName - 包名
 * @returns {Promise<boolean>} 更新是否成功
 */
function executeNpmUpdate(packageName) {
  return new Promise(async (resolve, reject) => {
    console.log(chalk$5.blue.bold(await t$5('update.UPDATING_PACKAGE', packageName)));
    
    const npmProcess = spawn('npm', ['install', '-g', packageName], {
      stdio: ['inherit', 'pipe', 'pipe']
    });
    
    let stderr = '';
    
    npmProcess.on('close', async (code) => {
      if (code === 0) {
        resolve(true);
      } else {
        reject(new Error(await t$5('update.NPM_UPDATE_FAILED', stderr)));
      }
    });
    
    npmProcess.on('error', async (error) => {
      if (error.code === 'ENOENT') {
        console.log(chalk$5.yellow(await t$5('update.NPM_NOT_FOUND')));
      }
      
      reject(error);
    });
  })
}

/**
 * 更新命令处理函数
 */
async function updateCommand$1() {
  try {
    await executeNpmUpdate(packageJson$1.name);
    
    console.log();
    console.log(chalk$5.green.bold(await t$5('update.UPDATE_COMPLETE')));
    
    // 显示最新版本的更新日志
    await showLatestUpdateLogs();
    
  } catch (error) {
    console.log();
    console.log(chalk$5.red.bold(await t$5('update.UPDATE_FAILED')));
    console.log();
    console.log(chalk$5.cyan(await t$5('update.MANUAL_UPDATE_CMD', packageJson$1.name)));
    
    process.exit(1);
  }
}

/**
 * 显示最新版本的更新内容
 */
async function showLatestUpdateLogs() {
  const updateLogs = packageJson$1.updateLogs || [];
  
  if (updateLogs.length === 0) {
    return
  }
  
  console.log();
  console.log(chalk$5.cyan.bold(await t$5('update.CHANGELOG_TITLE')));
  updateLogs.forEach(log => {
    console.log(`   ${log}`);
  });
}

var update = updateCommand$1;

const chalk$4 = source$1;
const { t: t$4 } = i18n;
const { validateConfig: validateConfig$1 } = config;
const { readConfigFile: readConfigFile$1 } = file;
const { validateApiConfig, validateConfigName } = validator;
const { CLAUDE_ENV_KEYS: CLAUDE_ENV_KEYS$1, ERROR_MESSAGES } = constants;
const {
  setSystemEnvVars,
  clearSystemEnvVars: clearSystemEnvVars$1,
  getCurrentConfigName: getCurrentConfigName$1,
  checkEnvStatus: checkEnvStatus$1,
  CONFIG_IDENTIFIER
} = env$1;
const maxText$1 = 30;

/**
 * 显示当前环境变量状态
 */
async function displayEnvStatus() {
  try {
    const status = await checkEnvStatus$1();
    const currentConfig = getCurrentConfigName$1();

    if (currentConfig) {
      console.log(chalk$4.green.bold(await t$4('envManagement.CURRENT_SYSTEM_ENV', currentConfig)));
      console.log();
    }

    if (status.hasEnvVars) {
      // 按照CLAUDE_ENV_KEYS的顺序显示环境变量
      for (const [configKey, envKey] of Object.entries(CLAUDE_ENV_KEYS$1)) {
        if (status.envVars[envKey]) {
          let displayValue = status.envVars[envKey];

          // 对敏感信息进行脱敏处理
          if (configKey === 'key' || configKey === 'token') {
            displayValue = displayValue.length > maxText$1 ? displayValue.slice(0, maxText$1) + '...' : displayValue;
          }

          console.log(`  ${chalk$4.cyan(envKey)}: ${chalk$4.green(displayValue)}`);
        }
      }

      // 显示配置标识符
      if (status.envVars[CONFIG_IDENTIFIER]) {
        console.log(`  ${chalk$4.cyan(CONFIG_IDENTIFIER)}: ${chalk$4.green(status.envVars[CONFIG_IDENTIFIER])}`);
      }
    } else {
      console.log(chalk$4.yellow(await t$4('envManagement.ENV_NOT_DETECTED')));
      console.log(await t$4('envManagement.USE_CMD_TO_SET', chalk$4.cyan('ccapi env <configName>')));
    }
  } catch (error) {
    console.error(chalk$4.red(await t$4('envManagement.GET_ENV_FAILED')), error.message);
  }
}

/**
 * 设置配置到环境变量
 */
async function setEnvFromConfig(configName, options = {}) {
  try {
    // 验证基础配置
    const config = await validateConfig$1();

    // 读取API配置文件
    const apiConfig = await readConfigFile$1(config.apiConfigPath);
    if (!validateApiConfig(apiConfig)) {
      console.error(chalk$4.red((await t$4('test.ERROR')) + ':'), await t$4('envManagement.CONFIG_FORMAT_ERROR'));
      return
    }

    // 验证配置名称是否存在
    if (!validateConfigName(apiConfig, configName)) {
      console.error(chalk$4.red(await t$4('common.CONFIG_ERROR')), `${await t$4(ERROR_MESSAGES.CONFIG_NAME_NOT_FOUND)}: ${configName}`);
      console.log(chalk$4.green(await t$4('common.AVAILABLE_CONFIGS')), Object.keys(apiConfig).join(', '));
      return
    }

    const targetConfig = apiConfig[configName];

    // 处理数组配置，选择合适的索引
    const processedConfig = { ...targetConfig };

    // 根据选项处理数组字段（如果提供了索引选项）
    const indexOptions = ['url', 'key', 'token', 'model', 'fast'];
    for (const field of indexOptions) {
      if (options[field] && Array.isArray(processedConfig[field])) {
        const index = parseInt(options[field]) - 1;
        if (index >= 0 && index < processedConfig[field].length) {
          processedConfig[field] = processedConfig[field][index];
        } else {
          console.error(
            chalk$4.red(await t$4('common.INDEX_ERROR')),
            await t$4('envManagement.INDEX_OUT_OF_RANGE', field, processedConfig[field].length)
          );
          return
        }
      }
    }

    // 设置环境变量
    await setSystemEnvVars(processedConfig, configName);
  } catch (error) {
    const no = error.message.includes('未设置') || error.message.includes('不存在') || error.message.includes('Not set');
    if (no) {
      console.error(chalk$4.red(await t$4('common.CONFIG_ERROR')), error.message);
      console.log(await t$4('claude.USE_SET_CMD', chalk$4.cyan('ccapi set')));
    } else {
      console.error(chalk$4.red(await t$4('envManagement.ENV_CMD_FAILED')), error.message);
    }
    process.exit(1);
  }
}

/**
 * 清除环境变量
 */
async function clearEnvVars() {
  try {
    const status = await checkEnvStatus$1();

    if (!status.hasEnvVars && !status.currentConfig) {
      console.log(chalk$4.yellow(await t$4('envManagement.NO_ENV_VARS_SET')));
      return
    }

    if (status.currentConfig) {
      console.log(chalk$4.yellow.bold(await t$4('envManagement.WILL_CLEAR_ENV_VARS', status.currentConfig)));
      console.log();
    }

    // 列出将要清除的环境变量
    const envVarsToShow = Object.entries(status.envVars);
    for (const [key, value] of envVarsToShow) {
      let displayValue = value;
      if (key.includes('API_KEY') || key.includes('AUTH_TOKEN')) {
        displayValue = displayValue.length > maxText$1 ? displayValue.slice(0, maxText$1) + '...' : displayValue;
      }
      console.log(`  ${chalk$4.cyan(key)}: ${chalk$4.green(displayValue)}`);
    }
    console.log();

    // 使用简单的readline确认操作
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const answer = await new Promise(async (resolve) => {
      const message = await t$4('clear.ENV_CONFIRM');
      rl.question(chalk$4.red(message), (answer) => {
        rl.close();
        resolve(answer.toLowerCase());
      });
    });

    console.log(answer);

    if (answer !== 'y') {
      return
    }

    // 执行清除
    await clearSystemEnvVars$1();
  } catch (error) {
    console.error(chalk$4.red.bold(await t$4('envManagement.CLEAR_ENV_FAILED')), error.message);
    process.exit(1);
  }
}

/**
 * 环境变量命令入口
 */
async function envCommand$1(configName, options = {}) {
  try {
    // 如果没有提供配置名称，显示当前状态
    if (!configName) {
      await displayEnvStatus();
      return
    }

    // 如果是 clear 操作
    if (configName === 'clear') {
      await clearEnvVars();
      return
    }

    // 设置指定配置到环境变量
    await setEnvFromConfig(configName, options);
  } catch (error) {
    console.error(chalk$4.red.bold(await t$4('envManagement.ENV_CMD_FAILED')), error.message);
    process.exit(1);
  }
}

var env = envCommand$1;

const chalk$3 = source$1;
const readline = require$$1$2;
const { validateConfig } = config;
const { readConfigFile, writeConfigFile, backupFile } = file;
const { validateSettingsConfig } = validator;
const { CLAUDE_ENV_KEYS } = constants;
const { 
  clearSystemEnvVars, 
  checkEnvStatus, 
  getCurrentConfigName 
} = env$1;
const { t: t$3 } = i18n;
const maxText = 30;

/**
 * 清除settings.json中的配置字段
 */
function clearSettingsConfig(settingsData) {
  if (!settingsData.env) {
    return settingsData
  }

  // 清除所有相关的环境变量配置
  const envKeys = Object.values(CLAUDE_ENV_KEYS);
  for (const key of envKeys) {
    delete settingsData.env[key];
  }

  return settingsData
}

/**
 * 获取用户确认
 */
async function getUserConfirmation() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(async (resolve) => {
    const message = await t$3('clear.CONFIRM');
    rl.question(chalk$3.red(message), (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y');
    });
  })
}

/**
 * 显示将要清除的内容预览
 */
async function showClearPreview() {
  try {
    const status = await checkEnvStatus();
    const currentConfig = getCurrentConfigName();

    console.log(chalk$3.blue.bold(await t$3('clear.PREPARE_TO_CLEAR')));
    console.log();

    // 显示settings.json中的配置
    try {
      const config = await validateConfig();
      const settingsData = await readConfigFile(config.settingsPath);
      
      if (settingsData.env && Object.keys(settingsData.env).length > 0) {
        console.log(chalk$3.yellow.bold(await t$3('clear.SETTINGS_ENV_CONFIG')));
        for (const [key, value] of Object.entries(settingsData.env)) {
          if (Object.values(CLAUDE_ENV_KEYS).includes(key)) {
            let displayValue = value;
            if (key.includes('API_KEY') || key.includes('AUTH_TOKEN')) {
              displayValue = displayValue.length > maxText ? displayValue.slice(0, maxText) + '...' : displayValue;
            }
            console.log(`  ${chalk$3.cyan(key)}: ${chalk$3.green(displayValue)}`);
          }
        }
        console.log();
      } else {
        console.log(chalk$3.dim(await t$3('clear.NO_SETTINGS_CONFIG')));
        console.log();
      }
    } catch (error) {
      console.log(chalk$3.yellow(await t$3('clear.CANT_READ_SETTINGS')));
      console.log();
    }

    // 显示系统环境变量
    if (status.hasEnvVars || currentConfig) {
      console.log(chalk$3.yellow.bold(await t$3('clear.SYSTEM_ENV_VARS')));
      
      for (const [key, value] of Object.entries(status.envVars)) {
        if (key !== 'CCAPI_CURRENT_CONFIG') {
          let displayValue = value;
          if (key.includes('API_KEY') || key.includes('AUTH_TOKEN')) {
            displayValue = displayValue.length > maxText ? displayValue.slice(0, maxText) + '...' : displayValue;
          }
          console.log(`  ${chalk$3.cyan(key)}: ${chalk$3.green(displayValue)}`);
        }
      }
      console.log();
    } else {
      console.log(chalk$3.dim(await t$3('clear.NO_SYSTEM_ENV_VARS')));
      console.log();
    }

    return status.hasEnvVars || currentConfig || false
  } catch (error) {
    console.error(chalk$3.red(await t$3('clear.CLEAR_PREVIEW_FAILED')), error.message);
    return false
  }
}

/**
 * 全量清理命令
 */
async function clearCommand$1() {
  try {
    // 显示将要清除的内容
    const hasContent = await showClearPreview();

    if (!hasContent) {
      // 检查settings.json
      let hasSettingsConfig = false;
      try {
        const config = await validateConfig();
        const settingsData = await readConfigFile(config.settingsPath);
        if (settingsData.env && Object.keys(settingsData.env).length > 0) {
          hasSettingsConfig = Object.values(CLAUDE_ENV_KEYS).some(key => settingsData.env[key]);
        }
      } catch (error) {
        // 忽略错误，继续检查
      }

      if (!hasSettingsConfig) {
        console.log(chalk$3.green(await t$3('clear.NO_CONFIG_TO_CLEAR')));
        return
      }
    }

    console.log(chalk$3.red.bold(await t$3('clear.WARNING_CLEAR_ALL')));
    console.log(chalk$3.red(await t$3('clear.WILL_CLEAR_SETTINGS')));
    console.log(chalk$3.red(await t$3('clear.WILL_CLEAR_SYSTEM')));
    console.log();

    // 第一次确认
    const firstConfirm = await getUserConfirmation();
    if (!firstConfirm) {
      return
    }

    console.log();
    
    let settingsCleared = false;
    let envCleared = false;

    // 清理 settings.json
    try {
      const config = await validateConfig();
      const settingsData = await readConfigFile(config.settingsPath);
      
      if (validateSettingsConfig(settingsData)) {
        // 备份 settings.json
        const backupPath = await backupFile(config.settingsPath);
        console.log(await t$3('clear.SETTINGS_BACKED_UP', backupPath));

        // 清理配置
        const clearedSettings = clearSettingsConfig(settingsData);
        await writeConfigFile(config.settingsPath, clearedSettings);
        
        console.log(chalk$3.green.bold(await t$3('clear.SETTINGS_CONFIG_CLEARED')));
        settingsCleared = true;
      }
    } catch (error) {
      console.log(chalk$3.yellow(await t$3('clear.SETTINGS_CLEAR_FAILED')), error.message);
    }

    // 清理系统环境变量
    try {
      envCleared = await clearSystemEnvVars();
    } catch (error) {

    }

  } catch (error) {
    console.error(chalk$3.red(await t$3('clear.CLEAR_CMD_FAILED')), error.message);
    process.exit(1);
  }
}

var clear = clearCommand$1;

const chalk$2 = source$1;
const { getCurrentLang, setLang, getSupportedLanguages, isLanguageSupported, t: t$2 } = i18n;

/**
 * 语言管理命令
 * @param {string} lang 可选的语言代码
 */
async function langCommand$1(lang) {
  try {
    // 如果没有提供参数，显示当前语言设置
    if (!lang) {
      const currentLang = await getCurrentLang();
      const supportedLanguages = getSupportedLanguages();

      console.log(
        chalk$2.green(await t$2('commands.lang.current')) + ':',
        chalk$2.cyan(`${currentLang} (${supportedLanguages[currentLang]})`)
      );
      console.log();
      console.log(chalk$2.blue(await t$2('commands.lang.available')) + ':');
      Object.entries(supportedLanguages).forEach(([code, name]) => {
        const isCurrent = code === currentLang;
        const prefix = isCurrent ? chalk$2.green('* ') : '  ';
        console.log(`${prefix}${code} - ${name}`);
      });
      console.log();
      console.log(await t$2('commands.lang.examples'));
      return
    }

    // 验证语言代码
    if (!isLanguageSupported(lang)) {
      console.error(chalk$2.red(await t$2('errors.INVALID_LANGUAGE')));
      return
    }

    // 获取当前语言，如果已经是目标语言则提示
    const currentLang = await getCurrentLang();
    if (currentLang === lang) {
      console.log(chalk$2.yellow(await t$2('errors.SAME_CONFIG')));
      return
    }

    // 设置新语言
    await setLang(lang);

    // 使用新语言显示成功消息
    console.log(chalk$2.green(await t$2('success.LANGUAGE_SWITCHED')));
  } catch (error) {
    console.error(chalk$2.red((await t$2('errors.SET_FAILED')) + ':'), error.message);
    process.exit(1);
  }
}

var lang = langCommand$1;

const chalk$1 = source$1;
const os = require$$0$3;
const path = require$$1;
const toml = toml$1;
const { fileExists, readFileContent, writeFileContent } = file;
const { t: t$1 } = i18n;
const { execSync } = require$$0$2;

/**
 * 读取codex配置文件
 */
async function readCodexConfig() {
  const configPath = path.join(os.homedir(), '.codex', 'config.toml');

  if (!(await fileExists(configPath))) {
    throw new Error(`Codex config file not found: ${configPath}`)
  }

  try {
    const content = await readFileContent(configPath);
    return toml.parse(content)
  } catch (error) {
    throw new Error(`Failed to parse codex config: ${error.message}`)
  }
}

/**
 * 写入codex配置文件
 */
async function writeCodexConfig(config) {
  const configPath = path.join(os.homedir(), '.codex', 'config.toml');

  try {
    const content = toml.stringify(config);
    await writeFileContent(configPath, content);
  } catch (error) {
    throw new Error(`Failed to write codex config: ${error.message}`)
  }
}

/**
 * 检查model_provider是否存在
 */
function checkModelProviderExists(config, providerName) {
  return config.model_providers && config.model_providers[providerName]
}

/**
 * 获取可用的model_providers列表
 */
function getAvailableProviders(config) {
  if (!config.model_providers) {
    return []
  }
  return Object.keys(config.model_providers)
}

/**
 * 设置API Key到auth.json文件中
 */
async function setAuthJsonApiKey(apiKey) {
  try {
    const authPath = path.join(os.homedir(), '.codex', 'auth.json');

    let authData = {};

    // 如果auth.json文件存在，先读取现有内容
    if (await fileExists(authPath)) {
      try {
        const content = await readFileContent(authPath);
        authData = JSON.parse(content);
      } catch (error) {
        console.warn(chalk$1.yellow('警告: 读取auth.json失败，将创建新的配置:'), error.message);
        authData = {};
      }
    }

    // 更新OPENAI_API_KEY字段
    authData.OPENAI_API_KEY = apiKey;

    // 写回auth.json文件
    await writeFileContent(authPath, JSON.stringify(authData, null, 2));

  } catch (error) {
    console.warn(chalk$1.yellow('警告: 设置auth.json失败:'), error.message);
    console.log(chalk$1.yellow(`请手动在 ~/.codex/auth.json 中设置: {"OPENAI_API_KEY": "${apiKey}"}`));
  }
}

/**
 * codex命令处理函数
 */
async function codexCommand$1(providerName) {
  try {
    const configPath = path.join(os.homedir(), '.codex', 'config.toml');

    // 如果没有提供provider名称，显示当前配置和可用选项
    if (!providerName) {
      console.log(chalk$1.green('当前codex配置:'));
      console.log(`  配置文件: ${chalk$1.cyan(configPath)}`);

      try {
        const config = await readCodexConfig();
        const currentProvider = config.model_provider || '未设置';
        console.log(`  当前model_provider: ${chalk$1.yellow(currentProvider)}`);

        const availableProviders = getAvailableProviders(config);
        if (availableProviders.length > 0) {
          console.log(`  可用的model_providers: ${chalk$1.cyan(availableProviders.join(', '))}`);
        } else {
          console.log(`  ${chalk$1.yellow('未找到可用的model_providers配置')}`);
        }

        console.log();
        console.log('使用方法:');
        console.log(`  ${chalk$1.cyan('ccapi codex <provider_name>')} - 切换到指定的model_provider`);
        console.log(`  例如: ${chalk$1.cyan('ccapi codex 88code')}`);
      } catch (error) {
        console.error(chalk$1.red('读取codex配置失败:'), error.message);
      }
      return
    }

    // 读取现有配置
    const config = await readCodexConfig();

    // 检查指定的model_provider是否存在
    if (!checkModelProviderExists(config, providerName)) {
      const availableProviders = getAvailableProviders(config);
      console.error(chalk$1.red('错误:'), `model_provider "${providerName}" 不存在`);
      if (availableProviders.length > 0) {
        console.log(`可用的model_providers: ${chalk$1.cyan(availableProviders.join(', '))}`);
      } else {
        console.log(chalk$1.yellow('配置文件中未找到任何model_providers'));
      }
      return
    }

    // 检查是否已经是当前配置
    if (config.model_provider === providerName) {
      console.log(chalk$1.yellow(`当前已使用 "${providerName}" 配置`));
      return
    }

    // 更新model_provider
    config.model_provider = providerName;
    await writeCodexConfig(config);

    // 获取并设置API Key到auth.json文件
    const providerConfig = config.model_providers[providerName];
    if (providerConfig && providerConfig.api_key) {
      await setAuthJsonApiKey(providerConfig.api_key);
      console.log(chalk$1.green('✓ codex配置切换成功'));
      console.log(`  model_provider: ${chalk$1.cyan(providerName)}`);
      console.log(`  API Key 已写入 ~/.codex/auth.json`);
      console.log(`  配置文件: ${chalk$1.cyan(configPath)}`);
    } else {
      console.log(chalk$1.green('✓ codex配置切换成功'));
      console.log(`  model_provider: ${chalk$1.cyan(providerName)}`);
      console.log(chalk$1.yellow(`  警告: ${providerName} 配置中未找到 api_key 字段`));
      console.log(`  配置文件: ${chalk$1.cyan(configPath)}`);
    }

  } catch (error) {
    console.error(chalk$1.red('codex配置切换失败:'), error.message);
    process.exit(1);
  }
}

var codex = codexCommand$1;

const { Command } = commanderExports;
const chalk = source$1;
const packageJson = require$$2$1;
const { checkUpdateQuietly } = versionChecker;
const { readConfig } = config;
const { t } = i18n;

// 导入命令处理模块
const versionCommand = version;
const setCommand = set;
const claudeCommand = claude;
const updateCommand = update;
const envCommand = env;
const clearCommand = clear;
const langCommand = lang;
const codexCommand = codex;

const program = new Command();

async function checkVersionInBackground() {
  try {
    const configData = await readConfig();
    const update = configData.update !== void 0 ? configData.update : true;
    if (process.argv.includes('update') || !update) {
      return
    }
    const versionInfo = await checkUpdateQuietly();
    if (versionInfo.needsUpdate) {
      console.log(
        chalk.yellow(await t('prompts.NEW_VERSION_AVAILABLE', versionInfo.latestVersion, chalk.bold('`ccapi update`')))
      );
    }
  } catch (error) {}
}

// 异步初始化程序和命令
async function initializeProgram() {
  // 设置基本信息
  program
    .name('ccapi')
    .description(await t('cli.description'))
    .version(packageJson.version);

  // 版本命令
  program.option('-v, --version', await t('cli.version')).action(async () => {
    await versionCommand();
    await checkVersionInBackground();
  });

  // claude 命令
  program
    .command('claude [name]')
    .description(await t('commands.claude.description'))
    .option('-u, --url <index>', await t('commands.claude.urlOption'))
    .option('-k, --key <index>', await t('commands.claude.keyOption'))
    .option('-t, --token <index>', await t('commands.claude.tokenOption'))
    .option('-m, --model <index>', await t('commands.claude.modelOption'))
    .option('-f, --fast <index>', await t('commands.claude.fastOption'))
    .action(async (name, options) => {
      await claudeCommand(name, options);
      await checkVersionInBackground();
    });

  // codex 命令
  program
    .command('codex [provider]')
    .description('切换codex配置中的model_provider')
    .action(async (provider) => {
      await codexCommand(provider);
      await checkVersionInBackground();
    });

  // env 命令
  program
    .command('env [name]')
    .description(await t('commands.env.description'))
    .option('-u, --url <index>', await t('commands.env.urlOption'))
    .option('-k, --key <index>', await t('commands.env.keyOption'))
    .option('-t, --token <index>', await t('commands.env.tokenOption'))
    .option('-m, --model <index>', await t('commands.env.modelOption'))
    .option('-f, --fast <index>', await t('commands.env.fastOption'))
    .action(async (name, options) => {
      await envCommand(name, options);
      await checkVersionInBackground();
    });


  // clear 命令
  program
    .command('clear')
    .description(await t('commands.clear.description'))
    .action(async () => {
      await clearCommand();
      await checkVersionInBackground();
    });

  // lang 命令
  program
    .command('lang [language]')
    .description(await t('commands.lang.description'))
    .action(async (language) => {
      await langCommand(language);
    });

  // update 命令
  program
    .command('update')
    .description(await t('commands.update.description'))
    .action(() => {
      updateCommand();
    });

  // 设置命令
  program
    .command('set')
    .description(await t('commands.set.description'))
    .option('--settings <path>', await t('commands.set.settingsOption'))
    .option('--api <path>', await t('commands.set.apiOption'))
    .action(async (options) => {
      await setCommand(options);
      await checkVersionInBackground();
    });




  return program
}

// 全局错误处理
process.on('uncaughtException', async (error) => {
  console.error(chalk.red(await t('errors.PROGRAM_ERROR') + ':'), error.message);
  if (process.env.NODE_ENV === 'development') {
    console.error(error.stack);
  }
  process.exit(1);
});

process.on('unhandledRejection', async (reason, promise) => {
  console.error(chalk.red(await t('errors.UNHANDLED_PROMISE') + ':'), reason);
  if (process.env.NODE_ENV === 'development') {
    console.error('Promise:', promise);
  }
  process.exit(1);
});

// 主函数 - 异步初始化并运行程序
async function main() {
  try {
    const program = await initializeProgram();
    
    // 解析命令行参数
    program.parse(process.argv);
    
    // 如果没有提供任何参数，显示帮助信息
    if (!process.argv.slice(2).length) {
      program.outputHelp();
    }
  } catch (error) {
    console.error(chalk.red('Program initialization failed:'), error.message);
    process.exit(1);
  }
}

// 运行主函数
main();

module.exports = src$1;
