/**
 * The definition of a suite and a test
 */
module Definition {

    /** A callback used by the test to indicate it is completed */
    export type Done = () => void;

    /** An interface for interacting with the DOM */
    interface DomHelper {}

    /** The user defined test */
    export type TestCallback = (done: Done, $: DomHelper) => void;

    class Test {
    }

    class Suite {
    }
}
