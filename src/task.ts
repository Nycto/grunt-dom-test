/**
 * The primary entry point for the grunt task
 */

/// <reference path="../typings/gruntjs/gruntjs.d.ts" />
/// <reference path="definition.ts" />

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
    suites(): Def.Suite[] {
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

    grunt.registerTask(
        opts.name,
        "Executes unit tests both locally and in browsers",
        function () {
            console.log( opts.suites() );
        }
    );
};

