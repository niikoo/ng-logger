var gulp = require('gulp'),
    ts = require('gulp-typescript'),
    merge = require('merge-stream'),
    sourcemaps = require('gulp-sourcemaps'),
    git = require('gulp-git'),
    bump = require('gulp-bump'),
    tag_version = require('gulp-tag-version'),
    filter = require('gulp-filter'),
    del = require('del'),
    runSequence = require('run-sequence'),
    tsd = require('gulp-tsd'),
    nodemon = require('gulp-nodemon'),
    shell = require('gulp-shell'),
    karma = require('karma');

require('git-guppy')(gulp);

var PATHS = {
    src: 'lib',
    build: 'build',
    test: 'test',
    typings: 'typings'
};

var tsProject = ts.createProject('tsconfig.json', {
    declaration: true,
    outDir: PATHS.build,
    typescript: require('typescript')
});

/**
 * Git Hooks
 */
gulp.task('pre-commit', ['add']);

gulp.task('add', ['default'], function() {
    return gulp.src('.')
        .pipe(git.add({ options: '-A' }));
});

/**
 * Defintions files
 */
gulp.task('definitions', shell.task([
    'node scripts/dts-bundle.js'
]));
/**

 * Dev tasks
 */
gulp.task('tsd:install', function(callback) {
    tsd({
        command: 'reinstall',
        config: './tsd.json'
    }, callback);
});
gulp.task('tsd', ['tsd:install'], shell.task([
    'tsd link'
]));

gulp.task('clean:tsd', function(cb) {
    del([
        PATHS.typings
    ], cb);
});

gulp.task('scripts:dev', function() {
    var tsResult = gulp.src([
            PATHS.src + '/**/*.ts',
            PATHS.test + '/**/*.ts'
        ], { base: "./" })
        .pipe(sourcemaps.init())
        .pipe(ts(tsProject));

    return merge([
        tsResult.js
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('./dest'))
    ]);
});
gulp.task('scripts:dev:watch', ['scripts:dev'], function() {
    gulp.watch([
        PATHS.src + '/**/*.ts',
        PATHS.test + '/**/*.ts',
        PATHS.examples + '/**/*.ts'
    ], ['scripts:dev']);
});

gulp.task('clean:dev', function(cb) {
    del([
        PATHS.src + '/**/*.js',
        PATHS.test + '/**/*.js'
    ], cb);
});

/**
 * Tests tasks
 */
gulp.task('test', ['scripts:dev'], function(cb) {
    karma.server.start({
        configFile: __dirname + '/karma.conf.js',
        singleRun: true
    }, function(exitCode) {
        cb(exitCode === 0 ? undefined : 'There were test failures.');
    });
});

gulp.task('test:watch', ['test'], function() {
    gulp.watch([
        PATHS.src + '/**/*.ts',
        PATHS.test + '/**/*.ts'
    ], ['test']);
});

/**
 * Prod
 */
gulp.task('scripts:prod', function() {
    var tsResult = gulp.src([
            PATHS.src + '/**/*.ts'
        ])
        .pipe(sourcemaps.init())
        .pipe(ts(tsProject));

    return merge([
        tsResult.dts.pipe(gulp.dest(PATHS.build)),
        tsResult.js
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(PATHS.build))
    ]);
});

gulp.task('clean:prod', function(cb) {
    del([
        PATHS.build
    ], cb);
});

/**
 * Cleaning
 */
gulp.task('clean', ['clean:dev', 'clean:prod', 'clean:tsd']);

/**
 * Default
 */
gulp.task('default', function(cb) {
    runSequence(
        'ci',
        'scripts:prod',
        'definitions',
        cb
    );
});

/**
 * CI
 */
gulp.task('ci', function(cb) {
    runSequence(
        'clean',
        'tsd',
        'test',
        cb
    );
});

/**
 * Bumping version
 */
function inc(importance) {
    return gulp.src(['./package.json'])
        .pipe(bump({ type: importance }))
        .pipe(gulp.dest('./'))
        .pipe(git.commit('Bumps for new ' + importance + ' release.'))
        .pipe(filter('package.json'))
        .pipe(tag_version());
}
/**
 * Bumping dist version
 */
function incDist(importance) {
    return gulp.src(['./package.json'])
        .pipe(bump({ type: importance }))
        .pipe(gulp.dest('./'))
        .pipe(git.commit('Bumps for new ' + importance + ' release.'))
        .pipe(filter('package.json'))
        .pipe(tag_version());
}

gulp.task('patch', function() { return inc('patch'); });
gulp.task('feature', function() { return inc('minor'); });
gulp.task('release', function() { return inc('major'); });

gulp.task('patch-dist', function() { return incDist('patch'); });
gulp.task('feature-dist', function() { return incDist('minor'); });
gulp.task('release-dist', function() { return incDist('major'); });