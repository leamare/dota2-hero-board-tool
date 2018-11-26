'use strict';

var requireDir = require('require-dir');

// Set default environment
global.production = false;

// Require all tasks in gulp folder, including subfolders
requireDir('./tasks', { recurse: true });
