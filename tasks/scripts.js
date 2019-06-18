'use strict';

var gulp       = require('gulp'),
    plumber    = require('gulp-plumber'),
    gulpif     = require('gulp-if'),
    concat     = require('gulp-concat'),
    minify     = require('gulp-minify'),
    sourcemaps = require('gulp-sourcemaps'),
    browserSync = require('browser-sync'),
    inject     = require('gulp-inject-string'),
    config     = require('../gulpconfig').scripts;


gulp.task('scripts', function() {
  let constList = '';
  for (let key in config.buildConfig) {
    constList += `const __${key}__ = '${config.buildConfig[key]}'; \n`;
  }

  return gulp.src(config.src)
    .pipe(plumber())
    .pipe(
      gulpif( ! global.production, sourcemaps.init())
    )
    .pipe(concat(config.name)) // Concat all files
    .pipe(inject.prepend(constList))
    .pipe(
      gulpif( ! global.production, sourcemaps.write('./'))
    )
    .pipe(
      gulpif(global.production, minify())
    )
    .pipe(gulp.dest(config.dest));
});

gulp.task('watch-scripts', gulp.parallel('scripts'), browserSync.reload);
