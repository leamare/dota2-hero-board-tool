'use strict';

var gulp        = require('gulp'),
    runSequence = require('run-sequence');


gulp.task('build', function(cb) {
  runSequence(
    'clean',
    [
      'styles',
      'vendor',
      'scripts',
      'templates',
      'images',
      'copy'
    ],
    cb
  );
});

gulp.task('prod', function(cb) {
    global.production = true;

    runSequence(
        'build',
        'revision',
        cb
    );
});
