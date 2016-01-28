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


/** Response to a request with HTML */
function serveHtml( res: express.Response, html: Q.Promise<string> ) {
    html.then(content => {
        res.set("Content-Type", "text/html");
        res.send(content);

    }).catch((err: Error) => {
        console.error(err.stack);
        res.status(500).send(err.stack.toString());

    }).done();
}

/** Renders data into a named template */
function render( file: string, data: any ): Q.Promise<string> {
    var path = __dirname + "/tpl/" + file + ".handlebars";
    return Q.nfcall(fs.readFile, path, "utf-8")
        .then(Handlebars.compile)
        .then(template => { return template(data); });
}

/** Generates the full HTML needed to run a test */
function renderTestHtml (
    suite: def.Suite,
    test: def.Test,
    id: number = 0
): Q.Promise<string> {
    return render("test", {
        name: suite.fullName() + " " + test.name,
        js: suite.allFiles(),
        testId: id,
        stylize: id === 0,
        html: test.html,
        setup: suite.setup ? suite.setup.toString() : "null",
        logic: test.fn.toString(),
        jsHash: "-"
    });
}

/** Servers the list of test suites */
function renderSuiteList ( suites: def.Suite[] ) {

    var autoinc = 0;

    // Collect a list of data about all the suites
    return Q.all(suites.map(suite => {

        // Render test HTML for each of the tests
        var testHtml = Q.all(suite.tests.map(test => {
            var id = ++autoinc;
            return renderTestHtml(suite, test, id).then(html => {
                return {
                    test: test.name,
                    url: "/" + encodeURIComponent(suite.name) +
                        "/" + encodeURIComponent(test.name),
                    content: html,
                    testId: id,
                    skip: test.skip
                };
            });
        }));

        // Collect the test data into information about the suite
        return testHtml.then(testList => {
            return {
                suite: suite.fullName(),
                url: "/" + encodeURIComponent(suite.name),
                tests: testList
            };
        });

    })).then(suiteData => {
        // Render the data into a template
        return render("listing", { suites: suiteData });
    });
}

/** Serves a list of javascript files */
function serveJs (
    res: express.Response, cache: boolean, paths: string[]
) {
    var contents = paths.map(path => {
        return Q.nfcall(fs.readFile, path, "utf-8");
    });

    Q.all(contents).then(
        (content: string[]) => {
            if ( cache ) {
                res.set("Content-Type", "application/javascript");
                res.set("Cache-Control", "public, max-age=300");
            }
            content.forEach(data => {
                res.write(data);
                res.write("\n");
            });
            res.end();
        },
        (err) => {
            res.status(500);
            res.send(err);
        }
    );
}

/** Starts a local server that serves up test code */
export class Server {

    constructor( private getSuites: () => def.Suite[] ) {}

    /** Start a new server, returning a URL at which it can be accessed */
    start(): Q.Promise<string> {

        var deferred = Q.defer<string>();

        var server = express();

        // enable gzip compression
        server.use( compression() );

        // Serve the test harness javascript
        server.get("/js/harness.js", (req, res) => {
            serveJs(res, false, [ __dirname + "/js/harness.js" ]);
        });

        // Serve the test harness javascript
        server.get("/js/runner.js", (req, res) => {
            serveJs(res, false, [ __dirname + "/js/runner.js" ]);
        });

        // Serve any other requested JS
        server.get(/^\/js\/user\/(.+)$/, (req, res) => {
            var path: string = req.params[0];
            if ( !this.getSuites().some(s => { return s.isJsNeeded(path); }) ) {
                res.sendStatus(403);
            }
            else {
                serveJs(res, false, [ process.cwd() + "/" + path ]);
            }
        });

        // At the root level, list out all of the tests
        server.get("/", (req, res) => {
            serveHtml(res, renderSuiteList(this.getSuites()));
        });

        //Serve a single test suite
        server.get("/:suite", (req, res) => {
            var suite = def.findSuite(this.getSuites(), req.params.suite);
            if ( suite ) {
                serveHtml(res, renderSuiteList([ suite ]));
            }
            else {
                res.sendStatus(404);
            }
        });

        // Serve an HTML file with a specific test
        server.get("/:suite/:test", (req, res) => {
            var suite = def.findSuite(this.getSuites(), req.params.suite);
            if ( suite ) {
                var test = suite.findTest(req.params.test);
                if ( test ) {
                    serveHtml(res, renderTestHtml(suite, test));
                }
                else {
                    res.sendStatus(404);
                }
            }
            else {
                res.sendStatus(404);
            }
        });

        server.listen(8080, () => {
            deferred.resolve("http://localhost:8080");
        });

        return deferred.promise;
    }
}


