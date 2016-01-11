/**
 * The primary entry point for defining DOM Test components
 */

/// <reference path="definition.ts" />

module Builder {

    /** A fluent interface for defining a test */
    class TestBuilder {
        constructor(
            protected title: string,
            protected suite: SuiteBuilder,
            private html: string
        ) {}

        /** Sets the test function */
        in(test: Definition.TestCallback): SuiteBuilder {
            return this.suite;
        }
    }

    /** An extension to the test defining interface that allows html to be set */
    class HtmlTestBuilder extends TestBuilder {
        constructor(title: string, suite: SuiteBuilder) {
            super(title, suite, "");
        }

        /** Sets the HTML to use for this test */
        using( html: string ): TestBuilder {
            return new TestBuilder(this.title, this.suite, html);
        }
    }

    /** Used to define individual tests */
    type Should = (title: string) => HtmlTestBuilder;

    /** Defines the content of a test suite */
    class SuiteBuilder {

        /** Individual files to load */
        private files: string;

        /** Utilities that can be concatenated together */
        private utilities: string;

        constructor ( private suiteTitle: string ) {}

        /** Loads an individual file */
        withFile ( path: string ): this {
            return this;
        }

        /** Utilities are concatenated together when loaded */
        withUtility ( path: string ): this {
            return this;
        }

        /** Defines the suite of test cases */
        should ( testTitle: string ): HtmlTestBuilder {
            return new HtmlTestBuilder(testTitle, this);
        }
    }

    /** Creates a function that starts creating a new suite */
    export function buildSuite(prefix: string): (name: string) => SuiteBuilder {
        return (name) => { return new SuiteBuilder(prefix + name); };
    }
}

export = {
    a: Builder.buildSuite("A "),
    an: Builder.buildSuite("An "),
    the: Builder.buildSuite("The "),
    given: Builder.buildSuite("Given ")
};

