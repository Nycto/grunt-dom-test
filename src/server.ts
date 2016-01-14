/// <reference path="../typings/q/Q.d.ts"/>
/// <reference path="../typings/express/express.d.ts"/>
/// <reference path="../typings/compression/compression.d.ts"/>
/// <reference path="../typings/node/node.d.ts"/>
/// <reference path="../typings/handlebars/handlebars.d.ts"/>

import def = require("./definition");

import Q = require("q");
import fs = require("fs");
import express = require("express");
import compression = require("compression");
import Handlebars = require("handlebars");


///** Loads fresh test data */
//function load () {
//
//    // `require` caches modules. We need to clear that cache before
//    // reloading to ensure we get fresh data
//    Object.keys((<any> require).cache).forEach((key) => {
//        if ( key.match(/test-data\.js$/) ) {
//            delete (<any> require).cache[key];
//        }
//    });
//
//    return require("./test-data.js")();
//}

/** Attempts to read a file, throwing an error if it fails */
function readFile(
    res: express.Response, path: string,
    fn: (content: string) => void
) {
    fs.readFile(path, (err, content) => {
        if (err) {
            res.sendStatus(500);
            res.send(err);
        }
        else {
            fn(content.toString());
        }
    });
}

///** Given a list of file paths, returns the time of the most recent change */
//function newestMTime ( paths: string[] ): number {
//    return paths.reduce((maxTime: number, path: string) => {
//        var stat = fs.statSync(path);
//        if ( !stat ) {
//            throw new Error("Could not stat " + path);
//        }
//        return Math.max(maxTime, stat.mtime);
//    }, 0);
//}
//
//// The JS files needed to run an individual test
//var testJS = [
//    "node_modules/chai/chai.js",
//    "build/private/test-runner.js",
//    "node_modules/watchjs/src/watch.js"
//];
//
//// The library JS, served separately to make debugging easier
//var goboJS = ["build/gobo.debug.js"];
//
///** Serves a javascript file */
//function serveJS (cache: boolean, paths: string[]) {
//    return (req, res) => {
//        Q.all(
//            paths.map(path => {
//                return Q.nfcall(fs.readFile, path, "utf-8");
//            })
//        ).then(
//            (content: string[]) => {
//                if ( cache ) {
//                    res.set("Content-Type", "application/javascript");
//                    res.set("Cache-Control", "public, max-age=300");
//                }
//                content.forEach(data => {
//                    res.write(data);
//                    res.write("\n");
//                });
//                res.end();
//            },
//            (err) => {
//                res.sendStatus(500);
//                res.send(err);
//            }
//        );
//    };
//}
//
///** Serves a map of test suites */
//function serveSuiteList (
//    enableCache: boolean,
//    res: any,
//    suites: Test.SuiteSet
//): void {
//
//    var autoinc = 0;
//
//    var suitePromise = Q.all( Object.keys(suites).map(suite => {
//
//        var testPromises = Object.keys(suites[suite]).map(test => {
//            var bundle = suites[suite][test];
//            var testId = ++autoinc;
//            return getTestHTML(enableCache, bundle, testId).then(html => {
//                return {
//                    test: test,
//                    url: "/" + encodeURIComponent(suite) +
//                        "/" + encodeURIComponent(test),
//                    content: html,
//                    testId: testId
//                };
//            });
//        });
//
//        return Q.all(testPromises).then(testList => {
//            return {
//                suite: suite,
//                url: "/" + encodeURIComponent(suite),
//                tests: testList
//            };
//        });
//    }) );
//
//    readFile(res, "./tests/framework/listing.handlebars", (html) => {
//        suitePromise.then(data => {
//            var template = Handlebars.compile(html);
//            res.set("Content-Type", "text/html");
//            res.send( template({ suites: data }) );
//        });
//    });
//}

function render( template: string, data: any ): Q.Promise<string> {
    var path = __dirname + "/tpl/" + template + ".handlebars";
    return Q.nfcall(fs.readFile, path, "utf-8")
        .then(Handlebars.compile)
        .then(template => { return template(data); });
}

/** Generates the full HTML needed to run a test */
function renderTestHtml ( test: def.Test, id: number ): Q.Promise<string> {
    return render("test", {
        testId: id,
        stylize: id === 0,
        html: test.html,
        logic: test.fn.toString(),
        jsHash: "-"
    });
}

/** Starts a local server that serves up test code */
export class Server {

    /** The list of test suites */
    private suites: def.Suite[] = [];

    /** Sets the test suites */
    setSuites( suites: def.Suite[] ) {
        this.suites = suites;
    }

    /** Servers the list of test suites */
    private serveSuiteList ( req: express.Request, res: express.Response ) {

        var autoinc = 0;

        // Collect a list of data about all the suites
        Q.all(this.suites.map(suite => {

            // Render test HTML for each of the tests
            var testHtml = Q.all(suite.tests.map(test => {
                var id = ++autoinc;
                return renderTestHtml(test, id).then(html => {
                    return {
                        test: test.name,
                        url: "/" + encodeURIComponent(suite.name) +
                            "/" + encodeURIComponent(test.name),
                        content: html,
                        testId: id
                    };
                });
            }));

            // Collect the test data into information about the suite
            return testHtml.then(testList => {
                return {
                    suite: suite.name,
                    url: "/" + encodeURIComponent(suite.name),
                    tests: testList
                };
            });

        })).then(suiteData => {
            // Render the data into a template
            return render("listing", { suites: suiteData });

        }).then(html => {
            // Once rendered, send it ack to the client
            res.set("Content-Type", "text/html");
            res.send(html);

        }).catch((err: Error) => {
            // Handle any exceptions thrown
            console.error(err.stack);
            res.status(500).send(err.stack.toString());

        }).done();
    }

    /** Start a new server */
    start(): Q.Promise<void> {

        var deferred = Q.defer<void>();

        var server = express();

        // enable gzip compression
        server.use( compression() );

        // At the root level, list out all of the tests
        server.get("/", this.serveSuiteList.bind(this));

        server.listen(8080, () => {
            deferred.resolve();
        });

        return deferred.promise;
    }
}


