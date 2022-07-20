module.exports = function (grunt) {
    grunt.initConfig({
            pkg: grunt.file.readJSON('package.json'),
            ts: {
                default: { tsconfig: './tsconfig.json' }
            },
            sass: {
                dist: {
                    options: { sourcemap: false },
                    files: { 'assets/css/project.css': 'src/scss/main.scss' }
                }
            },
            cssmin: {
                options: {
                    mergeIntoShorthands: false,
                    roundingPrecision: -1
                },
                target: {
                    files: { 'assets/css/project.min.css': ['assets/css/project.css'] }
                },
            },
            uglify: {
                development: {
                    files: [{
                        expand: true,
                        cwd: 'staged/js',
                        src: '**/*.js',
                        dest: 'assets/js'
                    }],
                    options: {
                        // mangle: { keep_fnames: true },
                        // compress: { keep_fnames: true },
                        mangle: false,
                        compress: false,
                        sourceMap: false
                    }
                },
            },
            watch: {
                css: {
                    files: 'src/scss/**/*.scss',
                    tasks: ['sass', 'cssmin'],
                },
                ts: {
                    files: 'src/ts/**/*.ts',
                    tasks: ['ts'],
                }
            }
        }
    );

    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-postcss');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-uglify-es');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-ts');
    grunt.registerTask('default', ['watch']);
};
