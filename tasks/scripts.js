'use strict';

var gulp       = require('gulp'),
    plumber    = require('gulp-plumber'),
    gulpif     = require('gulp-if'),
    concat     = require('gulp-concat'),
    minify     = require('gulp-minify'),
    sourcemaps = require('gulp-sourcemaps'),
    browserSync = require('browser-sync'),
    config     = require('../gulpconfig').scripts;


gulp.task('scripts', function() {
  return gulp.src(config.src)
    .pipe(plumber())
    .pipe(
      gulpif( ! global.production, sourcemaps.init())
    )
    .pipe(concat(config.name)) // Concat all files
    .pipe(
      gulpif( ! global.production, sourcemaps.write('./'))
    )
    .pipe(
      gulpif(global.production, minify())
    )
    .pipe(gulp.dest(config.dest));
});

gulp.task('watch-scripts', gulp.parallel('scripts'), browserSync.reload);
