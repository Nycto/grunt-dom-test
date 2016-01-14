/// <reference path="definition.ts"/>
/// <reference path="dom.ts"/>
/// <reference path="../typings/mocha/mocha.d.ts"/>
/// <reference path="../typings/q/Q.d.ts"/>

module Local {

    var jsdom = require("jsdom");
    var Mocha = require("mocha");
    var fs = require("fs");
    var Q = require("q");

    /** Adds a script tag to the given doc */
    function addScript( doc: Document, path: string ): Q.Promise<void> {
        var deferred = Q.defer();

        var script = doc.createElement("script");
        script.addEventListener("load", () => {
            deferred.resolve();
        });
        script.addEventListener("error", () => {
            deferred.reject(new Error("Failed to load " + path));
        });

        script.type = "text/javascript";
        script.src = "file://" + process.cwd() + "/" + path;

        doc.getElementsByTagName("head")[0].appendChild(script);

        return deferred.promise;
    }

    /** Wraps a test in a jsdom document */
    function buildTest ( suite: Def.Suite, test: Def.Test ): Mocha.ITest {
        return new Mocha.Test(test.name, (done: MochaDone) => {

            // Redirect calls to console.* to the node instance, but handle
            // errors ourself
            var virtualConsole = jsdom.createVirtualConsole()
                .sendTo(console, { omitJsdomErrors: true });
            virtualConsole.on("jsdomError", done);

            // Create the jsdom environment
            var doc = jsdom.jsdom(test.html, {
                url: "file://" + process.cwd() + "/test.html",
                virtualConsole: virtualConsole,
                features: {
                    FetchExternalResources: ["script"],
                    ProcessExternalResources: ["script"],
                    SkipExternalResources: false
                }
            });

            var window = <Window> doc.defaultView;

            // Add all the scripts
            var scripts: Q.Promise<void>[] = suite.allFiles()
                .map(path => { return addScript(window.document, path); });

            // Once the scripts are added, execute the test
            Q.all(scripts)
                .then(() => {
                    test.fn(done, new DOM.Doc(window, window.document));
                })
                .catch(done)
                .finally(() => { window.close(); })
                .done();
        });
    }

    /** Converts a DOM-Test Suite object to a Mocha suite */
    export function toMocha ( suites: Def.Suite[] ): Mocha {
        var root: any = new Mocha();

        suites.forEach(suite => {
            var mochaSuite = new Mocha.Suite(suite.name);
            root.suite.addSuite(mochaSuite);

            suite.tests.forEach(test => {
                mochaSuite.addTest( buildTest(suite, test) );
            });
        });

        return <Mocha> root;
    }
}

