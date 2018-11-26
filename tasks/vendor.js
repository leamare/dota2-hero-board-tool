'use strict';

var gulp       = require('gulp'),
    plumber    = require('gulp-plumber'),
    concat     = require('gulp-concat'),
    config     = require('../gulpconfig').vendor;


gulp.task('vendor', function() {
  return gulp.src(config.src)
    .pipe(plumber())
    .pipe(concat(config.name))
    .pipe(gulp.dest(config.dest));
});
