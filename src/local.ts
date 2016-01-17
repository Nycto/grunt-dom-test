/// <reference path="../typings/mocha/mocha.d.ts"/>
/// <reference path="../typings/q/Q.d.ts"/>
/// <reference path="../typings/jsdom/jsdom.d.ts"/>
/// <reference path="../typings/node/node.d.ts"/>

import def = require("./definition");
import dom = require("./dom");

import jsdom = require("jsdom");
import Mocha = require("mocha");
import fs = require("fs");
import Q = require("q");

/** Adds a script tag to the given doc */
function addScript( doc: Document, path: string ): Q.Promise<void> {
    var deferred = Q.defer<void>();

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
function buildTest ( suite: def.Suite, test: def.Test ): Mocha.ITest {
    return new (<any> Mocha).Test(test.name, (done: MochaDone) => {

        // Redirect calls to console.* to the node instance, but handle
        // errors ourself
        var virtualConsole = (<any> jsdom).createVirtualConsole()
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
                test.fn(done, new dom.Doc(window, window.document));
            })
            .catch(done)
            .finally(() => { window.close(); })
            .done();
    });
}

/** Converts a DOM-Test Suite object to a Mocha suite */
export function toMocha ( suites: def.Suite[] ): Mocha {
    var root: any = new Mocha();

    suites.forEach(suite => {
        var mochaSuite = new (<any> Mocha).Suite(suite.fullName() + "...");
        root.suite.addSuite(mochaSuite);

        suite.tests.forEach(test => {
            mochaSuite.addTest( buildTest(suite, test) );
        });
    });

    return <Mocha> root;
}

