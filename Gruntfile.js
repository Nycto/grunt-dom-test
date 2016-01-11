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
                out: 'lib/domTest.js',
                options: tsOptions
            },
            tasks: {
                src: 'src/task.ts',
                out: 'tasks/grunt-dom-test.js',
                options: tsOptions
            }
        },

        watch: {
            files: ['src/**/*.ts'],
            tasks: ['tslint', 'ts']
        },
    });

    // These plugins provide necessary tasks.
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-tslint');
    grunt.loadNpmTasks('grunt-ts');

    // By default, lint and run all tests.
    grunt.registerTask('default', ['tslint', 'ts']);

};
