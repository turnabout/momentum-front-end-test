var gulp = require('gulp'),
	sass = require('gulp-sass'),
	gulpIf = require('gulp-if'),
	cssnano = require('gulp-cssnano'),
	uglify = require('gulp-uglify'),
	imagemin = require('gulp-imagemin'),
	browserSync = require('browser-sync').create(),
	useref = require('gulp-useref'),
	cache = require('gulp-cache'),
	del = require('del'),
	runSequence = require('run-sequence'),
	autoprefixer = require('gulp-autoprefixer');


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
		.pipe(gulpIf('*.js', uglify()))
		.pipe(gulpIf('*.css', cssnano()))
		.pipe(gulpIf('*.css', autoprefixer({
			browsers: ['last 4 versions'],
			cascade: false
		})))
		.pipe(gulp.dest('dist'))
});

gulp.task('images', function() {
	return gulp.src('app/images/**/*.+(png|jpg|gif|svg)')
	.pipe(cache(imagemin({
			interlaced: true
		})))
	.pipe(gulp.dest('dist/images'))
});

gulp.task('fonts', function() {
	return gulp.src('app/fonts/**/*')
		.pipe(gulp.dest('dist/fonts'))
});

gulp.task('clean:dist', function() {
	return del.sync('dist');
});

gulp.task('cache:clear', function(callback) {
	return cache.clearAll(callback);
});

gulp.task('build', function(callback) {
	runSequence('clean:dist',
		['sass', 'useref', 'images', 'fonts'],
		callback
	)
});