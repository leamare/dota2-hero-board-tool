'use strict';

var gulp       = require('gulp'),
    plumber    = require('gulp-plumber'),
    concat     = require('gulp-concat'),
    config     = require('../gulpconfig');


gulp.task('vendor', function() {
  config.vendor.src = config.createVendorList();

  return gulp.src(config.vendor.src)
    .pipe(plumber())
    .pipe(concat(config.vendor.name))
    .pipe(gulp.dest(config.vendor.dest));
});
