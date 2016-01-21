/*
 * grunt-dom-test
 * https://github.com/Nycto/grunt-dom-test
 *
 * Copyright (c) 2015 Nycto
 * Licensed under the MIT license.
 */

module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        copy: {
            release: {
                expand: true,
                cwd: 'build/',
                src: [ 'lib/**/*', 'tasks/**/*', 'package.json' ],
                dest: '.'
            }
        },
    });

    // These plugins provide necessary tasks.
    grunt.loadNpmTasks('grunt-contrib-copy');

    grunt.registerTask('default', ['copy']);

};
