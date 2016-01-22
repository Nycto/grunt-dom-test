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
                out: 'build/tmp/lib.js',
                options: tsOptions
            },
            tasks: {
                src: 'src/task.ts',
                out: 'build/tmp/task.js',
                options: tsOptions
            },
            harness: {
                src: 'src/harness.ts',
                out: 'build/tasks/js/harness.js',
                options: tsOptions
            },
            runner: {
                src: 'src/runner.ts',
                out: 'build/tmp/runner.js',
                options: tsOptions
            }
        },

        concat: {
            lib: {
                src: [ 'src/define/node.js', 'build/tmp/lib.js' ],
                dest: 'build/lib/grunt-dom-test.js',
            },
            tasks: {
                src: [ 'src/define/node.js', 'build/tmp/task.js' ],
                dest: 'build/tasks/grunt-dom-test.js',
            },
            runner: {
                src: [ 'src/define/browser.js', 'build/tmp/runner.js' ],
                dest: 'build/tasks/js/runner.js',
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
                dest: 'build/tasks/'
            },

            pkgjson: {
                expand: true,
                cwd: '.',
                src: 'package.json',
                dest: 'build/'
            },

            final: {
                expand: true,
                cwd: 'build/',
                src: [ 'lib/**/*', 'tasks/**/*' ],
                dest: '.'
            }
        },

        watch: {
            ts: {
                files: ['src/**/*.ts'],
                tasks: ['default']
            },
            concat: {
                files: ['src/**/*.js'],
                tasks: ['js', 'copy:final']
            },
            copy: {
                files: ['src/tpl/**'],
                tasks: ['copy:tpls', 'copy:final']
            },
            pkgjson: {
                files: ['package.json'],
                tasks: ['copy:pkgjson']
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
    grunt.loadNpmTasks('grunt-continue');
    grunt.loadNpmTasks('grunt-tslint');
    grunt.loadNpmTasks('grunt-ts');

    // By default, lint and run all tests.
    grunt.registerTask('default', ['tslint', 'ts', 'js', 'copy']);
    grunt.registerTask('js', ['jshint', 'concat']);

    grunt.registerTask('dev', ['continue:on', 'default', 'watch']);
};
