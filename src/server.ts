/// <reference path="../typings/node/node.d.ts"/>
/// <reference path="../typings/q/Q.d.ts"/>
/// <reference path="../typings/express/express.d.ts"/>
/// <reference path="../typings/compression/compression.d.ts"/>

import def = require("./definition");

import Q = require("q");
import fs = require("fs");
import express = require("express");
import compression = require("compression");

function serveSuiteList () {
    // todo
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
            //serveSuiteList(enableCache, res, load());
        });

        server.listen(8080, () => {
            deferred.resolve();
        });

        return deferred.promise;
    }
}


