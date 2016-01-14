/// <reference path="../typings/node/node.d.ts"/>
/// <reference path="dom.ts"/>

/**
 * The definition of a suite and a test
 */
module Def {

    var fs = require("fs");

    /** A callback used by the test to indicate it is completed */
    export type Done = () => void;

    /** The user defined test */
    export type TestCallback = (done: Done, $: DOM.Doc) => void;

    /** Bundled data about a test */
    export class Test {
        constructor (
            public name: string,
            public html: string,
            public fn: TestCallback
        ) {}
    }

    /** A suite is a set of named tests */
    export class Suite {

        /** Individual files to load */
        files: string[] = [];

        /** Utilities that can be concatenated together */
        utilities: string[] = [];

        /** Tests in this suite */
        tests: Test[] = [];

        constructor( public name: string ) {}

        /** Returns the paths for all files needed by this suite */
        allFiles(): string[] {
            return this.utilities.concat(this.files);
        }

        /** Returns the JavaScript source for all files needed by this suite */
        source(): string {
            return this.utilities
                .concat(this.files)
                .map(file => { return fs.readFileSync(file); })
                .join("\n");
        }
    };
}

