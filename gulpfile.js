var gulp = require('gulp');
var less = require('gulp-less');
var webpack = require('webpack-stream');
var uglify = require('gulp-uglify');
var util = require('gulp-util');
var gulpif = require('gulp-if');
var buffer = require('vinyl-buffer');

gulp.task('build', function(cb) {

    gulp.src('index.html')
        .pipe(gulp.dest('out/client'));
    
    gulp.src('default.less')
        .pipe(less())
        .pipe(gulp.dest('out/client'));

    gulp.src('src/client/app.jsx')
        .pipe(webpack(
            {
                module: {
                    loaders: [
                        {
                            test: /\.jsx$/,
                            loader: 'babel-loader',
                            query: {
                                presets: ['react']
                            }
                        }
                    ]
                },
                resolve: {
                    extensions: ['', '.js', '.jsx']
                },
                target: 'web',
                output: {
                    filename: 'client.js'
                }
            }
        ))
        .pipe(buffer())
        .pipe(gulpif(util.env.uglify || util.env.minify || util.env.production, uglify()))
        .pipe(gulp.dest('out/client'));

    gulp.src('src/server.js')
        .pipe(gulp.dest('out/server'));
    
});

gulp.task('default', ['build']);
