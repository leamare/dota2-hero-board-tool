'use strict';

var requireDir = require('require-dir'),
    gulp        = require('gulp'),
    browserSync = require('browser-sync'),
    config      = require('./gulpconfig');

// Set default environment
global.production = false;

// Require all tasks in gulp folder, including subfolders
requireDir('./tasks', { recurse: true });

gulp.task('build', (done) => {
  gulp.series(
    'clean',
    gulp.parallel(
      'styles',
      'vendor',
      'scripts',
      'templates',
      'images',
      'copy'
    )
  )(done);
});

gulp.task('prod', (done) => {
    global.production = true;

    gulp.series(
      'build',
      'revision'
    )(done);
});

gulp.task('watch', gulp.series('build', () => {
    browserSync.init(config.watch.browserSync);

    gulp.watch(config.watch.src.styles, gulp.parallel('styles'));
    gulp.watch(config.watch.src.scripts, gulp.parallel('watch-scripts'));
    gulp.watch(config.watch.src.templates, gulp.parallel('watch-templates'));
    gulp.watch(config.watch.src.images, gulp.parallel('watch-images'));
    gulp.watch(config.watch.src.copy, gulp.parallel('watch-copy'));
}));


gulp.task('default', gulp.parallel('build'));
