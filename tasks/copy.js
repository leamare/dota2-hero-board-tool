'use strict';

var gulp        = require('gulp'),
    mergeStream = require('merge-stream'),
    browserSync = require('browser-sync'),
    tokenReplace = require('gulp-token-replace'),
    gulpif      = require('gulp-if'),
    consts      = require('../gulpconfig').scripts.buildConfig,
    config      = require('../gulpconfig').copy;


gulp.task('copy', function(cb) {
  var stream = mergeStream();

  config.forEach(function(bundle) {
    stream.add(
      gulp.src(bundle.src)
          .pipe(gulpif(!bundle.binary, tokenReplace({
              prefix: "{{{{ ",
              suffix: " }}}}",
              global: consts
            }))
          )
          .pipe(gulp.dest(bundle.dest))
    );
  });

  cb();
  return stream;
});

gulp.task('watch-copy', gulp.parallel('copy'), browserSync.reload);
