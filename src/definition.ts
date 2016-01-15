/**
 * The definition of a suite and a test
 */

/// <reference path="../typings/node/node.d.ts"/>

import dom = require("./dom");

import fs = require("fs");

/** A callback used by the test to indicate it is completed */
export type Done = () => void;

/** The user defined test */
export type TestCallback = (done: Done, $: dom.Doc) => void;

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

    constructor( public prefix: string, public name: string ) {}

    /** Returns the full name for this test suite */
    fullName(): string {
        return this.prefix + " " + this.name + " should...";
    }

    /** Returns the paths for all files needed by this suite */
    allFiles(): string[] {
        return this.utilities.concat(this.files);
    }
};

/** Finds the suite with the given name, or returns undefined */
export function findSuite( suites: Suite[], name: string ): Suite {
    for (var suite of suites) {
        if ( suite.name === name ) {
            return suite;
        }
    }
    return undefined;
}

