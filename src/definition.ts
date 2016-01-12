/**
 * The definition of a suite and a test
 */
module Def {

    /** A callback used by the test to indicate it is completed */
    export type Done = () => void;

    /** An interface for interacting with the DOM */
    export interface DomHelper {}

    /** The user defined test */
    export type TestCallback = (done: Done, $: DomHelper) => void;

    /** Bundled data about a test */
    export class Test {
        constructor (
            public name: string,
            public html: string,
            public logic: TestCallback
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
    };
}

