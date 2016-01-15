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
function renderTestHtml ( test: def.Test, id: number = 0 ): Q.Promise<string> {
    return render("test", {
        testId: id,
        stylize: id === 0,
        html: test.html,
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

/** Starts a local server that serves up test code */
export class Server {

    /** The list of test suites */
    private suites: def.Suite[] = [];

    /** Sets the test suites */
    setSuites( suites: def.Suite[] ) {
        this.suites = suites;
    }

    /** Start a new server */
    start(): Q.Promise<void> {

        var deferred = Q.defer<void>();

        var server = express();

        // enable gzip compression
        server.use( compression() );

        // At the root level, list out all of the tests
        server.get("/", (req, res) => {
            serveHtml(res, renderSuiteList(this.suites));
        });

        //Serve a single test suite
        server.get("/:suite", (req, res) => {
            var suite = def.findSuite(this.suites, req.params.suite);
            if ( suite ) {
                serveHtml(res, renderSuiteList([ suite ]));
            }
            else {
                res.sendStatus(404);
            }
        });

        // Serve an HTML file with a specific test
        server.get("/:suite/:test", (req, res) => {
            var suite = def.findSuite(this.suites, req.params.suite);
            if ( suite ) {
                var test = suite.findTest(req.params.test);
                if ( test ) {
                    serveHtml(res, renderTestHtml(test));
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
            deferred.resolve();
        });

        return deferred.promise;
    }
}


