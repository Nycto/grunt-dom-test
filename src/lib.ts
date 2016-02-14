/**
 * The primary entry point for defining DOM Test components
 */

import {Suite, Test} from "./definition";
import {Logic, Setup} from "./test";

var suites: Suite[] = [];

/** A fluent interface for defining a test */
class TestBuilder {
    constructor(
        protected title: string,
        private html: string,
        protected built: (name: Test) => SuiteBuilder
    ) {}

    /** Sets the test function */
    in(test: Logic): SuiteBuilder {
        return this.built( new Test(this.title, this.html, test, false) );
    }

    /** Sets the test function, but marks the test for skipping */
    skip(test: Logic): SuiteBuilder {
        return this.built( new Test(this.title, this.html, test, true) );
    }
}

/** An extension to the test defining interface that allows html to be set */
class HtmlTestBuilder extends TestBuilder {
    constructor(title: string, built: (name: Test) => SuiteBuilder) {
        super(title, "", built);
    }

    /** Sets the HTML to use for this test */
    using( html: string ): TestBuilder {
        return new TestBuilder(this.title, html, this.built);
    }
}

/** Defines the content of a test suite */
class SuiteBuilder {

    /** The suite being constructed */
    private suite: Suite;

    constructor ( suitePrefix: string, suiteTitle: string ) {
        this.suite = new Suite(suitePrefix, suiteTitle);
        suites.push(this.suite);
    }

    /** A function to run before running a test */
    setup ( fn: Setup ): this {
        this.suite.setup = fn;
        return this;
    }

    /** Loads an individual file */
    withFile ( path: string ): this {
        this.suite.files.push(path);
        return this;
    }

    /** Utilities are concatenated together when loaded */
    withUtility ( path: string ): this {
        this.suite.utilities.push(path);
        return this;
    }

    /** Defines the suite of test cases */
    should ( testTitle: string ): HtmlTestBuilder {
        return new HtmlTestBuilder(testTitle, (test) => {
            this.suite.tests.push(test);
            return this;
        });
    }

    /** Starts a new suite */
    and ( suiteTitle: string ): SuiteBuilder {
        var builder = new SuiteBuilder( "", suiteTitle );
        builder.setup( this.suite.setup );
        this.suite.files.forEach(file => { builder.withFile(file); });
        this.suite.utilities.forEach(util => { builder.withUtility(util); });
        return builder;
    }
}

/** Creates a function that starts creating a new suite */
function buildSuite(prefix: string): (name: string) => SuiteBuilder {
    return (name) => { return new SuiteBuilder(prefix, name); };
}

export = {
    a: buildSuite("A"),
    an: buildSuite("An"),
    the: buildSuite("The"),
    given: buildSuite("Given"),
    __private: {
        clear: () => { suites = []; },
        suites: () => { return suites; }
    }
};

