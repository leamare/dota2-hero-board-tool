'use strict';

var gulp        = require('gulp'),
    browserSync = require('browser-sync'),
    config      = require('../gulpconfig').watch;


gulp.task('watch-scripts', ['scripts'], browserSync.reload);
gulp.task('watch-templates', ['templates'], browserSync.reload);
gulp.task('watch-images', ['images'], browserSync.reload);
gulp.task('watch-copy', ['copy'], browserSync.reload);


gulp.task('watch', ['build'], function() {
    browserSync.init(config.browserSync);

    gulp.watch(config.src.styles, ['styles']);
    gulp.watch(config.src.scripts, ['watch-scripts']);
    gulp.watch(config.src.templates, ['watch-templates']);
    gulp.watch(config.src.images, ['watch-images']);
    gulp.watch(config.src.copy, ['watch-copy']);
});
