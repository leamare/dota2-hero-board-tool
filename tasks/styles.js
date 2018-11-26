'use strict';

var gulp         = require('gulp'),
    plumber      = require('gulp-plumber'),
    gulpif       = require('gulp-if'),
    concat       = require('gulp-concat'),
    cssnano      = require('gulp-cssnano'),
    replace      = require('gulp-replace'),
    autoprefixer = require('autoprefixer'),
    //sourcemaps   = require('gulp-sourcemaps'),
    browserSync  = require('browser-sync'),
    config       = require('../gulpconfig').styles;


gulp.task('styles', function() {
  return gulp.src(config.src)
    .pipe(plumber())
//     .pipe(
//       // If not production -> init Sourcemaps
//       gulpif( ! global.production, sourcemaps.init())
//     )
    .pipe(concat(config.name)) // Concat all files
//     .pipe(
//       // If not production -> save Sourcemaps
//       gulpif( ! global.production, sourcemaps.write('./'))
//     )
    .pipe(replace('themes/default/assets/fonts/', '../res/fonts/'))
    .pipe(replace('themes/default/assets/images/', '../res/'))
    .pipe(
      // If not production -> Minify CSS
      gulpif(global.production, cssnano(config.cssnano))
    )
    .pipe(gulp.dest(config.dest))
    .pipe(browserSync.stream({match: '**/*.css'})); // Reload browserSync
});
