/**
 * The primary entry point for defining DOM Test components
 */

import def = require("./definition");
import dom = require("./dom");
import test = require("./test");

var suites: def.Suite[] = [];

/** A fluent interface for defining a test */
class TestBuilder {
    constructor(
        protected title: string,
        private html: string,
        protected built: (name: def.Test) => SuiteBuilder
    ) {}

    /** Sets the test function */
    in(test: test.Logic): SuiteBuilder {
        return this.built( new def.Test(this.title, this.html, test, false) );
    }

    /** Sets the test function, but marks the test for skipping */
    skip(test: test.Logic): SuiteBuilder {
        return this.built( new def.Test(this.title, this.html, test, true) );
    }
}

/** An extension to the test defining interface that allows html to be set */
class HtmlTestBuilder extends TestBuilder {
    constructor(title: string, built: (name: def.Test) => SuiteBuilder) {
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
    private suite: def.Suite;

    constructor ( suitePrefix: string, suiteTitle: string ) {
        this.suite = new def.Suite(suitePrefix, suiteTitle);
        suites.push(this.suite);
    }

    /** A function to run before running a test */
    setup ( fn: test.Setup ): this {
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

