/*
 * grunt-dom-test
 * https://github.com/Nycto/grunt-dom-test
 *
 * Copyright (c) 2015 Nycto
 * Licensed under the MIT license.
 */

/* globals module */
module.exports = function(grunt) {
    "use strict";

    var tsOptions = {
        sourceMap: false,
        module: 'amd',
        target: 'es5',
        basePath: 'src'
    };

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        tslint: {
            options: {
                configuration: grunt.file.readJSON("tslint.json")
            },
            dist: {
                src: ['src/**/*.ts']
            }
        },

        ts: {
            lib: {
                src: 'src/lib.ts',
                out: 'build/lib.js',
                options: tsOptions
            },
            tasks: {
                src: 'src/task.ts',
                out: 'build/task.js',
                options: tsOptions
            },
            harness: {
                src: 'src/harness.ts',
                out: 'tasks/js/harness.js',
                options: tsOptions
            },
            runner: {
                src: 'src/runner.ts',
                out: 'build/runner.js',
                options: tsOptions
            }
        },

        concat: {
            lib: {
                src: [ 'src/define/node.js', 'build/lib.js' ],
                dest: 'lib/grunt-dom-test.js',
            },
            tasks: {
                src: [ 'src/define/node.js', 'build/task.js' ],
                dest: 'tasks/grunt-dom-test.js',
            },
            runner: {
                src: [ 'src/define/browser.js', 'build/runner.js' ],
                dest: 'tasks/js/runner.js',
            }
        },

        jshint: {
            files: ['Gruntfile.js', 'src/**/*.js'],
            options: {
                bitwise: true,
                camelcase: true,
                curly: true,
                eqeqeq: true,
                forin: true,
                immed: true,
                indent: 4,
                latedef: true,
                newcap: true,
                noarg: true,
                nonew: true,
                noempty: true,
                undef: true,
                unused: true,
                strict: true,
                trailing: true,
                maxlen: 80
            }
        },

        copy: {
            tpls: {
                expand: true,
                cwd: 'src/',
                src: 'tpl/**',
                dest: 'tasks/'
            }
        },

        watch: {
            ts: {
                files: ['src/**/*.ts', 'src/define.js', 'src/tpl/**'],
                tasks: ['default']
            },
            concat: {
                files: ['src/**/*.js'],
                tasks: ['js']
            },
            copy: {
                files: ['src/tpl/**'],
                tasks: ['copy']
            }
        },

        clean: [ "build", "tasks", "lib", "etc", "dest" ]
    });

    // These plugins provide necessary tasks.
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-tslint');
    grunt.loadNpmTasks('grunt-ts');

    // By default, lint and run all tests.
    grunt.registerTask('default', ['tslint', 'ts', 'js', 'copy']);
    grunt.registerTask('js', ['jshint', 'concat']);

};
