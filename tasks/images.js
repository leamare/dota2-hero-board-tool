'use strict';

var gulp     = require('gulp'),
    plumber  = require('gulp-plumber'),
    gulpif   = require('gulp-if'),
    imagemin = require('gulp-imagemin'),
    pngquant = require('imagemin-pngquant'),
    browserSync = require('browser-sync'),
    config   = require('../gulpconfig').images;


gulp.task('images', function(cb) {
  config.forEach(function(config) {
    gulp.src(config.src)
        .pipe(plumber())
        .pipe(
          // If not production -> Iamges minification
          gulpif(global.production,
            imagemin({
                progressive: true,
                svgoPlugins: [{removeViewBox: false}],
                interlaced: true,
                use: [pngquant()]
            })
          )
        )
        .pipe(gulp.dest(config.dest));
  });

  cb();
});

gulp.task('watch-images', gulp.parallel('images'), browserSync.reload);
