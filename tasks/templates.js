'use strict';

var gulp     = require('gulp'),
    plumber  = require('gulp-plumber'),
    gulpif   = require('gulp-if'),
    rename   = require('gulp-rename'),
    htmlmin  = require('gulp-htmlmin'),
    browserSync = require('browser-sync'),
    tokenReplace = require('gulp-token-replace'),
    consts   = require('../gulpconfig').scripts.buildConfig,
    config   = require('../gulpconfig').templates;


gulp.task('templates', function() {
    return gulp.src(config.src)
        .pipe(tokenReplace({
          prefix: "{{{{ ",
          suffix: " }}}}",
          global: consts
        }))
        .pipe(plumber())
        .pipe(
          // If production -> HTMLMinifier
          gulpif(global.production, htmlmin(config.htmlmin))
        )
        .pipe(rename({extname: '.html'}))
        .pipe(gulp.dest(config.dest));
});

gulp.task('watch-templates', gulp.parallel('templates'), browserSync.reload);
