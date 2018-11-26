'use strict';

var gulp        = require('gulp'),
    mergeStream = require('merge-stream'),
    config      = require('../gulpconfig').copy;


gulp.task('copy', function() {
  var stream = mergeStream();

  return config.forEach(function(bundle) {
    stream.add(
      gulp.src(bundle.src)
          .pipe(gulp.dest(bundle.dest))
    );
  });

  return stream;
});
