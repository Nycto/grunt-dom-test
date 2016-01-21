/**
 * The definition of a suite and a test
 */

/// <reference path="../typings/node/node.d.ts"/>

import test = require("./test");
import dom = require("./dom");

import fs = require("fs");

/** Bundled data about a test */
export class Test {
    constructor (
        public name: string,
        public html: string,
        public fn: test.Logic
    ) {}
}

/** Finds an item with the given name among a list of named items */
function find<T extends { name: string }>( list: T[], name: string ): T {
    for (var item of list) {
        if ( item.name === name ) {
            return item;
        }
    }
    return undefined;
}

/** A suite is a set of named tests */
export class Suite {

    /** Individual files to load */
    files: string[] = [];

    /** Utilities that can be concatenated together */
    utilities: string[] = [];

    /** Tests in this suite */
    tests: Test[] = [];

    /** A function that is executed before each test */
    setup: test.Setup = null;

    constructor( public prefix: string, public name: string ) {}

    /** Returns the full name for this test suite */
    fullName(): string {
        return this.prefix + " " + this.name + " should";
    }

    /** Returns the paths for all files needed by this suite */
    allFiles(): string[] {
        return this.utilities.concat(this.files);
    }

    /** Returns whether the given JS file is needed as part of this suite */
    isJsNeeded ( path: string ) {
        return this.files.some(js => { return js === path; }) ||
            this.utilities.some(js => { return js === path; });
    }

    /** Finds a test by name */
    findTest( name: string ): Test {
        return find(this.tests, name);
    }
};

/** Finds the suite with the given name, or returns undefined */
export function findSuite( suites: Suite[], name: string ): Suite {
    return find(suites, name);
}

