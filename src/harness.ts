/**
 * Scans the DOM for test case links, runs them in an iframe, then
 * reports the results
 */

module Harness {

    /** Unescapes strings to/from HTML interpolation. */
    var unescape: (string) => string = (function() {

        // List of HTML entities for escaping.
        var map = {
            "&amp;":  "&",
            "&lt;":   "<",
            "&gt;":   ">",
            "&quot;": "\"",
            "&#x27;": "'",
            "&#x60;": "`",
            "&#x3D;": "=",
        };

        // A callback used by the regex replacer to replace entities
        function escapeCallback(match: string): string {
            return map[match];
        }

        // Regexes for identifying a key that needs to be escaped
        var source = "(?:" + Object.keys(map).join("|") + ")";
        var regex = new RegExp(source, "g");

        return function unescape(str: string): string {
            return str.replace(regex, escapeCallback);
        };
    }());


    /** The result of a test pass */
    interface TestResult {
        name: string;
        result: boolean;
        message: string;
        duration: number;
    }

    /** The result of an entire test suite */
    interface SuiteResult {
        passed: number;
        failed: number;
        total: number;
        duration: number;
        tests: TestResult[];
    }

    /** Builds a result object */
    class ResultBuilder {

        /** When the result builder was created */
        private created = Date.now();

        /** The number of passed tests */
        private passed = 0;

        /** The number of failed tests */
        private failed = 0;

        /** The final result object */
        private tests: TestResult[] = [];

        /** @constructor */
        constructor (
            private total: number,
            private onComplete: (result: SuiteResult) => void
        ) {}

        /** Adds a result */
        report( result: TestResult ): void {
            this.tests.push(result);
            if ( result.result ) {
                this.passed++;
            }
            else {
                this.failed++;
            }

            if ( this.passed + this.failed === this.total ) {
                this.onComplete({
                    passed: this.passed,
                    failed: this.failed,
                    total: this.total,
                    duration: Date.now() - this.created,
                    tests: this.tests.filter(test => {
                        return !test.result;
                    })
                });
            }
        }
    }

    /** An individual test case */
    class TestCase {

        /** @constructor */
        constructor ( private elem: HTMLElement ) {}

        /** Returns the URL for loading this specific test on its own */
        url(): string {
            return this.elem.getAttribute("test-url");
        }

        /** Returns the ID of this test case */
        id(): string {
            return this.elem.getAttribute("test-case");
        }

        /** Returns the element that reporting information will be added to */
        reportElem(): HTMLElement {
            return <HTMLElement> document.querySelector(
                "[test-report=\"" + this.id() + "\"]");
        }

        /** Runs this test */
        run (): void {
            this.reportElem().className += " running";

            var iframe = document.createElement("iframe");

            var content = unescape(this.elem.textContent.trim());

            ///iframe.src = this.url() + "?" + this.id();

            this.elem.parentNode.insertBefore(iframe, null);

            if ( iframe.hasOwnProperty("srcdoc") ) {
                (<any> iframe).srcdoc = content;
            }
            else {
                // IE support. Apparently setting the content of an iframe
                // is a security issue, so they block it.
                (<any> iframe).contentWindow.contents = content;
                iframe.src = "javascript:window.contents";
            }
        }

        /** Reports a result back to this test case */
        report ( outcome: TestResult ): void {

            var report = this.reportElem();
            report.className = report.className.replace(/\brunning\b/, "");
            report.className += outcome.result ? " success" : " failure";

            if ( !outcome.result && outcome.message ) {
                var error = document.createElement("div");
                error.classList.add("error");
                error.textContent = outcome.message;
                this.elem.parentNode.insertBefore(error, null);
            }
        }

        /** Returns the name of this test case */
        name(): string {
            return this.elem.getAttribute("test-name");
        }
    }

    /** Manages messages received from an iframe */
    module Messages {

        /** The callback that gets executed when a message is received */
        type Listener = ( data: any ) => void;

        /** A map of ids to listeners */
        var listeners: { [id: string]: Listener } = {};

        /** A global handler for listening for messages */
        window.addEventListener("message", function(e) {
            var data = JSON.parse(e.data);

            if ( data.id === undefined ) {
                throw new Error("Message received without an id" + data);
            }

            if ( !listeners[data.id] ) {
                throw new Error("No listener registered for " + data.id);
            }

            listeners[data.id](data);
        });

        /** Registers a function to be called for the given ID */
        export function subscribe ( id: string, callback: Listener ) {
            if ( listeners[id] ) {
                throw new Error("Listener already registered for: " + id);
            }
            listeners[id] = callback;
        }
    }

    /** Starts test execution */
    export function start(
        onComplete: (result: SuiteResult) => void,
        onFailure: (result: TestResult, url: string) => void = null
    ) {

        var tests =
            [].slice.call(document.querySelectorAll("[test-case]"))
                .map(elem => { return new TestCase(elem); });

        var results = new ResultBuilder(tests.length, onComplete);

        /** Runs the next test */
        function next() {
            var test = tests.shift();

            if ( !test ) {
                return;
            }

            var start: number = Date.now();
            var done = false;

            /** Reports on the results of this test */
            function report( passed: boolean, message: string ) {

                if ( done ) {
                    return;
                }

                done = true;

                var result: TestResult = {
                    name: test.name(),
                    result: passed,
                    message: message,
                    duration: Date.now() - start
                };

                test.report(result);
                results.report(result);

                if ( !result.result ) {
                    onFailure(result, test.url());
                }

                // Run the next test
                next();
            }

            // Add a subscriber to listen for the test to finish
            Messages.subscribe(test.id(), data => {
                report(!!data.result, data.message ? data.message : "");
            });

            // Run the test and report an error if it fails to load
            test.run();

            // Move on if the test takes too long to load
            setTimeout( report.bind(null, false, "Timeout"), 5000 );
        }

        for ( var i = 0; i < 6; i++ ) {
            next();
        }
    };
};

