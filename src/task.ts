/**
 * The primary entry point for the grunt task
 */

/// <reference path="../typings/gruntjs/gruntjs.d.ts" />

import def = require("./definition");
import local = require("./local");
import server = require("./server");

/** The list of valid options that can be passed to this module */
class Options {
    constructor( public name: string, private grunt: IGrunt ) {}

    /** Return the files registered for this task */
    files(): string[] {
        return this.grunt.file.expand(
            this.grunt.config.get<string[]>(this.name + ".files")
        );
    }

    /** Returns the list of suites defined by the consuming package */
    suites(): def.Suite[] {
        var domTest = require("../lib/grunt-dom-test.js").__private;

        domTest.clear();

        this.files().forEach(file => {
            var path = process.cwd() + "/" + file;
            delete (<any> require).cache[path];
            require(path);
        });

        return domTest.suites();
    }
}

/** Primary entry point for the grunt task */
export = function ( grunt: IGrunt ) {

    const opts = new Options("domTest", grunt);

    // Will be assigned the server instance the first time the task runs
    var httpServer;

    grunt.registerTask(
        opts.name,
        "Executes unit tests both locally and in browsers",
        function () {

            // Typescript has no way of defining the type for `this`, so
            // we need to rebind and do some casting.
            var self = <grunt.task.ITask> this;

            // Start the server if it hasn't been spun up yet
            if ( !httpServer ) {
                httpServer = new server.Server();
                httpServer.start().then(() => {
                    grunt.log.subhead("Server started");
                    grunt.log.writeln("");
                });
            }

            var done = self.async();

            var suites = opts.suites();

            // Update the http server with the new list of tests
            httpServer.setSuites( suites );

            local.toMocha(suites).run((failures: number) => {
                done(failures === 0);
            });
        }
    );
};

