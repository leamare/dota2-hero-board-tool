'use strict';

var gulp   = require('gulp'),
    del    = require('del'),
    config = require('../gulpconfig').clean;


gulp.task('clean', function(cb) {
  del(config.src).then(function(paths) {
    cb();
  });
});
