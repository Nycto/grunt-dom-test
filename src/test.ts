import {Doc} from "./dom";

/** Executed before the test is run */
export type Setup = ( $: Doc ) => void;

/** A callback used by the test to indicate it is completed */
export type Done = () => void;

/** The user defined test */
export type Logic = (done: Done, $: Doc) => void;

