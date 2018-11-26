'use strict';

var gulp        = require('gulp'),
    runSequence = require('run-sequence'),
    plumber     = require('gulp-plumber'),
    rev         = require('gulp-rev'),
    revReplace  = require('gulp-rev-replace'),
    config      = require('../gulpconfig').revision;


// Generate revision manifest file
gulp.task('revision-assets', function() {
    return gulp.src(
            config.assets.src,
            { base: config.assets.base }
        )
        .pipe(plumber())
        .pipe(rev())
        .pipe(gulp.dest(config.assets.dest))
        .pipe(rev.manifest())
        .pipe(gulp.dest(config.assets.dest));
});


// Rename assets link in elements
gulp.task('revision-rename', function() {
    var manifestSrc = gulp.src(config.rename.manifestSrc);

    return gulp.src(config.rename.src)
        .pipe(plumber())
        .pipe(revReplace({manifest: manifestSrc}))
        .pipe(gulp.dest(config.rename.dest));
});


// Start revision task
gulp.task('revision', function(cb) {
    runSequence(
        'revision-assets',
        'revision-rename',
        cb
    );
});
