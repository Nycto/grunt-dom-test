/**
 * The primary entry point for the grunt task
 */

/// <reference path="../typings/gruntjs/gruntjs.d.ts" />

import {Suite} from "./definition";
import {toMocha} from "./local";
import {Server} from "./server";

/** The list of valid options that can be passed to this module */
class Options {
    constructor( public name: string, private grunt: IGrunt ) {}

    /** Return the files registered for this task */
    files(): string[] {
        return this.grunt.file.expand(
            this.grunt.config.get<string[]>(this.name + ".files")
        );
    }
}


/** Primary entry point for the grunt task */
export = function ( grunt: IGrunt ) {

    const opts = new Options("domTest", grunt);

    /** Returns a list of suites */
    function suites(): Suite[] {

        var lib = require("../lib/grunt-dom-test.js").__private;

        lib.clear();

        opts.files().forEach(file => {
            var path = process.cwd() + "/" + file;
            delete (<any> require).cache[path];
            require(path);
        });

        return lib.suites();
    }

    grunt.registerTask(
        opts.name + ":server",
        "Starts a server to run tests in browser",
        function () {

            // Typescript has no way of defining the type for `this`, so
            // we need to rebind and do some casting.
            var self = <grunt.task.ITask> this;

            var done = this.async();

            // Start the server if it hasn't been spun up yet
            var httpServer = new Server( suites );

            httpServer.start().then((url) => {
                grunt.log.subhead("Server started: " + url);
                grunt.log.writeln("");
                done();
            }).catch(err => {
                done(err);
            });
        }
    );

    grunt.registerTask(
        opts.name + ":test",
        "Executes unit tests in Node with jsdom",
        function () {

            // Typescript has no way of defining the type for `this`, so
            // we need to rebind and do some casting.
            var self = <grunt.task.ITask> this;

            var done = self.async();

            toMocha( suites() ).run((failures: number) => {
                done(failures === 0);
            });
        }
    );
};

