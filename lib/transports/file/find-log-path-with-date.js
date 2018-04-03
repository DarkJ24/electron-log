'use strict';

var fs   = require('fs');
var path = require('path');
var os   = require('os');
var getAppName = require('./get-app-name');

module.exports = findLogPath;

/**
 * Try to determine a platform-specific path where can write logs
 * @param {string} [appName] Used to determine the first folder name
 * @param {string} [date] Used to determine the date's folder name
 * @return {string|boolean}
 */
function findLogPath(appName, date) {
  appName = appName || getAppName();
  if (!appName) {
    return false;
  }

  var homeDir = os.homedir ? os.homedir() : process.env['HOME'];
  
  var dir;
  switch (process.platform) {
    case 'linux': {
      dir = prepareDir(process.env['XDG_CONFIG_HOME'], appName, 'logs', date)
        .or(homeDir, '.config', appName, 'logs', date)
        .or(process.env['XDG_DATA_HOME'], appName, 'logs', date)
        .or(homeDir, '.local', 'share', appName, 'logs', date)
        .result;
      break;
    }

    case 'darwin': {
      dir = prepareDir(homeDir, 'Library', 'Logs', appName, date)
        .or(homeDir, 'Library', 'Application Support', appName, 'logs', date)
        .result;
      break;
    }

    case 'win32': {
      dir = prepareDir(process.env['APPDATA'], appName, 'logs', date)
        .or(homeDir, 'AppData', 'Roaming', appName, 'logs', date)
        .result;
      break;
    }
  }

  if (dir) {
    return path.join(dir, 'log.log');
  } else {
    return false;
  }
}


function prepareDir(dirPath) {
  // jshint -W040
  if (!this || this.or !== prepareDir || !this.result) {
    if (!dirPath) {
      return { or: prepareDir };
    }

    //noinspection JSCheckFunctionSignatures
    dirPath = path.join.apply(path, arguments);
    mkDir(dirPath);

    try {
      fs.accessSync(dirPath, fs.W_OK);
    } catch (e) {
      return { or: prepareDir };
    }
  }

  return {
    or: prepareDir,
    result: (this ? this.result : false) || dirPath
  };
}

function mkDir(dirPath, root) {
  var dirs = dirPath.split(path.sep);
  var dir = dirs.shift();
  root = (root || '') + dir + path.sep;

  try {
    fs.mkdirSync(root);
  } catch (e) {
    if (!fs.statSync(root).isDirectory()) {
      throw new Error(e);
    }
  }

  return !dirs.length || mkDir(dirs.join(path.sep), root);
}
