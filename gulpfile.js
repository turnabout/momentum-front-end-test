var gulp = require('gulp');
var	sass = require('gulp-sass');
var	gulpIf = require('gulp-if');
var	cssnano = require('gulp-cssnano');
var	uglify = require('gulp-uglify');
var	imagemin = require('gulp-imagemin');
var	browserSync = require('browser-sync').create();
var	useref = require('gulp-useref');
var	cache = require('gulp-cache');
var	del = require('del');
var	runSequence = require('run-sequence');
var	autoprefixer = require('gulp-autoprefixer');
var babel = require('gulp-babel');


// Development tasks
gulp.task('sass', function() {
	return gulp.src('app/scss/*.scss')
		.pipe(sass())
		.pipe(gulp.dest('app/css'))
		.pipe(browserSync.reload({
			stream: true
		}))
});

gulp.task('browserSync', function() {
	browserSync.init({
		server: {
			baseDir: 'app'
		},
	})
});

gulp.task('watch', function() {
	gulp.watch('app/scss/**/*.scss', ['sass']);
	gulp.watch('app/*.html', browserSync.reload);
	gulp.watch('app/js/**/*.js', browserSync.reload);
});

gulp.task('default', function(callback) {
	runSequence(['sass', 'browserSync'],
		'watch',
		callback
	)
});


// Production tasks
gulp.task('useref', function() {
	return gulp.src('app/*.html')
		.pipe(useref())
		.pipe(gulpIf('*.js', babel({presets: ['es2015']})))
		.pipe(gulpIf('*.js', uglify()))
		.pipe(gulpIf('*.css', cssnano()))
		.pipe(gulpIf('*.css', autoprefixer({
			browsers: ['> 1%', 'IE 8'],
			remove: false,
			cascade: false
		})))
		.pipe(gulp.dest('dist'))
});

gulp.task('cleanDist', function() {
	return del('dist');
});

gulp.task('build', function(callback) {
	runSequence('cleanDist',
		['sass', 'useref'],
		callback
	)
});

gulp.task('browserSyncDist', function() {
	browserSync.init({
		server: {
			baseDir: 'dist'
		},
	})
});

gulp.task('serve', function(callback) {
	runSequence('build', 'browserSyncDist', callback);
});