'use strict';

var gulp        = require('gulp'),
    mergeStream = require('merge-stream'),
    browserSync = require('browser-sync'),
    config      = require('../gulpconfig').copy;


gulp.task('copy', function(cb) {
  var stream = mergeStream();

  config.forEach(function(bundle) {
    stream.add(
      gulp.src(bundle.src)
          .pipe(gulp.dest(bundle.dest))
    );
  });

  cb();
  return stream;
});

gulp.task('watch-copy', gulp.parallel('copy'), browserSync.reload);
