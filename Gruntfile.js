/*
 * grunt-dom-test
 * https://github.com/Nycto/grunt-dom-test
 *
 * Copyright (c) 2015 Nycto
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

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
            }
        },

        concat: {
            lib: {
                src: [ 'src/define.js', 'build/lib.js' ],
                dest: 'lib/grunt-dom-test.js',
            },
            tasks: {
                src: [ 'src/define.js', 'build/task.js' ],
                dest: 'tasks/grunt-dom-test.js',
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
            files: ['src/**/*.ts', 'src/define.js', 'src/tpl/**'],
            tasks: ['default']
        },
    });

    // These plugins provide necessary tasks.
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-tslint');
    grunt.loadNpmTasks('grunt-ts');

    // By default, lint and run all tests.
    grunt.registerTask('default', ['tslint', 'ts', 'concat', 'copy']);

};
