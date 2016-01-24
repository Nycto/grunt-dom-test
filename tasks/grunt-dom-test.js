/* globals require, module */
/* exported define */

/** Transforms amd modules into commonjs modules */
var define = (function () {
    "use strict";

    var modules = {};

    return function ( name, depends, callback ) {
        var exports = {};

        // Resolve any dependencies and invoke the callback
        var result = callback.apply(null, depends.map(function (dependency) {
            if ( dependency === "require" ) {
                return require;
            }
            else if ( dependency === "exports" ) {
                return exports;
            }
            else if ( modules.hasOwnProperty(dependency) ) {
                return modules[dependency];
            }
            else {
                return require(dependency);
            }
        }));

        result = result || exports;

        if ( name === "lib" || name === "task" ) {
            module.exports = result;
        }
        else {
            modules[name] = result;
        }
    };
}());


define("dom", ["require", "exports"], function (require, exports) {
    "use strict";
    function name(fn) {
        if (fn.name) {
            return fn.name;
        }
        else {
            var ret = fn.toString().substr("function ".length);
            ret = ret.substr(0, ret.indexOf("("));
            return ret;
        }
    }
    var Elem = (function () {
        function Elem(elem) {
            this.elem = elem;
            this.doc = this.elem.ownerDocument;
            this.win = this.doc.defaultView;
        }
        Elem.prototype.as = function (typename) {
            if (this.elem instanceof typename) {
                return this.elem;
            }
            else {
                throw new Error("Element is not a " + name(typename));
            }
        };
        Elem.prototype.text = function () {
            return this.elem.textContent;
        };
        Elem.prototype.hasClass = function (klass) {
            var elem = this.as(HTMLElement);
            return elem.className.split(" ").indexOf(klass) !== -1;
        };
        Elem.prototype.click = function () {
            var clickevent = this.doc.createEvent("MouseEvents");
            clickevent.initEvent("click", true, true);
            this.elem.dispatchEvent(clickevent);
        };
        Elem.prototype.styles = function () {
            var elem = this.as(this.win.HTMLElement);
            return this.win.getComputedStyle(elem);
        };
        Elem.prototype.isVisible = function () {
            return this.styles().display !== "none";
        };
        Elem.prototype.keyEvent = function (eventType, keyCode, mods) {
            var event = this.doc.createEvent("KeyboardEvent");
            if (event.initKeyEvent) {
                event.initKeyEvent(eventType, true, true, null, mods.ctrl || false, mods.alt || false, mods.shift || false, mods.meta || false, keyCode, keyCode);
            }
            else if (event.initKeyboardEvent) {
                event.initKeyboardEvent(eventType, true, true, null, keyCode, keyCode, null, "", null);
                var setEventProperty = function (property, value) {
                    Object.defineProperty(event, property, {
                        get: function () { return value; }
                    });
                };
                setEventProperty("keyCode", keyCode);
                setEventProperty("shiftKey", !!mods.shift);
                setEventProperty("ctrlKey", !!mods.ctrl);
                setEventProperty("altKey", !!mods.alt);
                setEventProperty("metaKey", !!mods.meta);
            }
            else {
                throw new Error("Simulated keyboard events not supported!");
            }
            this.elem.dispatchEvent(event);
        };
        Elem.prototype.keyUp = function (keyCode, mods) {
            if (mods === void 0) { mods = {}; }
            this.keyEvent("keyup", keyCode, mods);
        };
        Elem.prototype.keyDown = function (keyCode, mods) {
            if (mods === void 0) { mods = {}; }
            this.keyEvent("keydown", keyCode, mods);
        };
        Elem.prototype.typeInto = function (value) {
            var input = this.as(this.win.HTMLInputElement);
            input.value = value;
            var event = this.doc.createEvent("UIEvent");
            event.initEvent("input", true, true);
            input.dispatchEvent(event);
        };
        Elem.prototype.setCheckbox = function (checked) {
            var input = this.as(this.win.HTMLInputElement);
            input.checked = checked;
            var event = this.doc.createEvent("HTMLEvents");
            event.initEvent("change", false, true);
            input.dispatchEvent(event);
        };
        Elem.prototype.focus = function () {
            this.as(this.win.HTMLElement).focus();
        };
        Elem.prototype.isFocused = function () {
            return this.doc.activeElement === this.elem;
        };
        return Elem;
    }());
    var QueryResult = (function () {
        function QueryResult(nodes) {
            this.nodes = nodes;
            this.count = nodes.length;
            this.length = nodes.length;
        }
        QueryResult.prototype.one = function () {
            if (this.length !== 1) {
                throw new Error("Expected only one result, but found " + this.length);
            }
            return new Elem(this.nodes[0]);
        };
        QueryResult.prototype.first = function () {
            if (this.length === 0) {
                throw new Error("Expected at least one result, but found none");
            }
            return new Elem(this.nodes[0]);
        };
        QueryResult.prototype.forEach = function (fn) {
            for (var i = 0; i < this.length; i++) {
                fn(new Elem(this.nodes[i]));
            }
        };
        return QueryResult;
    }());
    var Doc = (function () {
        function Doc(window) {
            this.window = window;
            this.win = window;
            this.document = window.document;
            this.doc = window.document;
            this.body = new Elem(this.document.body);
            this.html = new Elem(this.document.documentElement);
        }
        Doc.prototype.query = function (selector) {
            return new QueryResult(this.doc.querySelectorAll(selector));
        };
        Doc.prototype.id = function (id) {
            var elem = this.doc.getElementById(id);
            if (!elem) {
                throw new Error("Could not find element with id " + id);
            }
            return new Elem(elem);
        };
        return Doc;
    }());
    exports.Doc = Doc;
});
define("test", ["require", "exports"], function (require, exports) {
    "use strict";
});
define("definition", ["require", "exports"], function (require, exports) {
    "use strict";
    var Test = (function () {
        function Test(name, html, fn, skip) {
            this.name = name;
            this.html = html;
            this.fn = fn;
            this.skip = skip;
        }
        return Test;
    }());
    exports.Test = Test;
    function find(list, name) {
        for (var _i = 0, list_1 = list; _i < list_1.length; _i++) {
            var item = list_1[_i];
            if (item.name === name) {
                return item;
            }
        }
        return undefined;
    }
    var Suite = (function () {
        function Suite(prefix, name) {
            this.prefix = prefix;
            this.name = name;
            this.files = [];
            this.utilities = [];
            this.tests = [];
            this.setup = null;
        }
        Suite.prototype.fullName = function () {
            return this.prefix + " " + this.name + " should";
        };
        Suite.prototype.allFiles = function () {
            return this.utilities.concat(this.files);
        };
        Suite.prototype.isJsNeeded = function (path) {
            return this.files.some(function (js) { return js === path; }) ||
                this.utilities.some(function (js) { return js === path; });
        };
        Suite.prototype.findTest = function (name) {
            return find(this.tests, name);
        };
        return Suite;
    }());
    exports.Suite = Suite;
    ;
    function findSuite(suites, name) {
        return find(suites, name);
    }
    exports.findSuite = findSuite;
});
define("local", ["require", "exports", "dom", "jsdom", "mocha", "q"], function (require, exports, dom, jsdom, Mocha, Q) {
    "use strict";
    function addScript(doc, path) {
        var deferred = Q.defer();
        var script = doc.createElement("script");
        script.addEventListener("load", function () {
            deferred.resolve();
        });
        script.addEventListener("error", function () {
            deferred.reject(new Error("Failed to load " + path));
        });
        script.type = "text/javascript";
        script.src = "file://" + process.cwd() + "/" + path;
        doc.getElementsByTagName("head")[0].appendChild(script);
        return deferred.promise;
    }
    function convertAssertion(err) {
        var converted = new Error();
        ["message", "showDiff", "actual", "expected", "stack"].forEach(function (key) {
            if (err.hasOwnProperty(key)) {
                converted[key] = err[key];
            }
        });
        return converted;
    }
    function buildTest(suite, test) {
        if (test.skip) {
            return new Mocha.Test(test.name);
        }
        return new Mocha.Test(test.name, function (done) {
            var virtualConsole = jsdom.createVirtualConsole()
                .sendTo(console, { omitJsdomErrors: true });
            virtualConsole.on("jsdomError", function (err) { done(err); });
            var doc = jsdom.jsdom(test.html, {
                url: "file://" + process.cwd() + "/test.html",
                virtualConsole: virtualConsole,
                features: {
                    FetchExternalResources: ["script"],
                    ProcessExternalResources: ["script"],
                    SkipExternalResources: false
                }
            });
            var window = doc.defaultView;
            var scripts = suite.allFiles()
                .map(function (path) { return addScript(window.document, path); });
            Q.all(scripts)
                .then(function () {
                var doc = new dom.Doc(window);
                if (suite.setup) {
                    suite.setup(doc);
                }
                test.fn(function () { done(); }, doc);
            })
                .catch(function (err) {
                done(err instanceof Error ? err : convertAssertion(err));
            })
                .finally(function () { window.close(); })
                .done();
        });
    }
    function toMocha(suites) {
        var root = new Mocha();
        suites.forEach(function (suite) {
            var mochaSuite = new Mocha.Suite(suite.fullName() + "...");
            root.suite.addSuite(mochaSuite);
            suite.tests.forEach(function (test) {
                mochaSuite.addTest(buildTest(suite, test));
            });
        });
        return root;
    }
    exports.toMocha = toMocha;
});
define("server", ["require", "exports", "definition", "q", "fs", "express", "compression", "handlebars"], function (require, exports, def, Q, fs, express, compression, Handlebars) {
    "use strict";
    function serveHtml(res, html) {
        html.then(function (content) {
            res.set("Content-Type", "text/html");
            res.send(content);
        }).catch(function (err) {
            console.error(err.stack);
            res.status(500).send(err.stack.toString());
        }).done();
    }
    function render(file, data) {
        var path = __dirname + "/tpl/" + file + ".handlebars";
        return Q.nfcall(fs.readFile, path, "utf-8")
            .then(Handlebars.compile)
            .then(function (template) { return template(data); });
    }
    function renderTestHtml(suite, test, id) {
        if (id === void 0) { id = 0; }
        return render("test", {
            js: suite.allFiles(),
            testId: id,
            stylize: id === 0,
            html: test.html,
            setup: suite.setup ? suite.setup.toString() : "null",
            logic: test.fn.toString(),
            jsHash: "-"
        });
    }
    function renderSuiteList(suites) {
        var autoinc = 0;
        return Q.all(suites.map(function (suite) {
            var testHtml = Q.all(suite.tests.map(function (test) {
                var id = ++autoinc;
                return renderTestHtml(suite, test, id).then(function (html) {
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
            return testHtml.then(function (testList) {
                return {
                    suite: suite.fullName(),
                    url: "/" + encodeURIComponent(suite.name),
                    tests: testList
                };
            });
        })).then(function (suiteData) {
            return render("listing", { suites: suiteData });
        });
    }
    function serveJs(res, cache, paths) {
        var contents = paths.map(function (path) {
            return Q.nfcall(fs.readFile, path, "utf-8");
        });
        Q.all(contents).then(function (content) {
            if (cache) {
                res.set("Content-Type", "application/javascript");
                res.set("Cache-Control", "public, max-age=300");
            }
            content.forEach(function (data) {
                res.write(data);
                res.write("\n");
            });
            res.end();
        }, function (err) {
            res.status(500);
            res.send(err);
        });
    }
    var Server = (function () {
        function Server(getSuites) {
            this.getSuites = getSuites;
        }
        Server.prototype.start = function () {
            var _this = this;
            var deferred = Q.defer();
            var server = express();
            server.use(compression());
            server.get("/js/harness.js", function (req, res) {
                serveJs(res, false, [__dirname + "/js/harness.js"]);
            });
            server.get("/js/runner.js", function (req, res) {
                serveJs(res, false, [__dirname + "/js/runner.js"]);
            });
            server.get(/^\/js\/user\/(.+)$/, function (req, res) {
                var path = req.params[0];
                if (!_this.getSuites().some(function (s) { return s.isJsNeeded(path); })) {
                    res.sendStatus(403);
                }
                else {
                    serveJs(res, false, [process.cwd() + "/" + path]);
                }
            });
            server.get("/", function (req, res) {
                serveHtml(res, renderSuiteList(_this.getSuites()));
            });
            server.get("/:suite", function (req, res) {
                var suite = def.findSuite(_this.getSuites(), req.params.suite);
                if (suite) {
                    serveHtml(res, renderSuiteList([suite]));
                }
                else {
                    res.sendStatus(404);
                }
            });
            server.get("/:suite/:test", function (req, res) {
                var suite = def.findSuite(_this.getSuites(), req.params.suite);
                if (suite) {
                    var test = suite.findTest(req.params.test);
                    if (test) {
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
            server.listen(8080, function () {
                deferred.resolve("http://localhost:8080");
            });
            return deferred.promise;
        };
        return Server;
    }());
    exports.Server = Server;
});
define("task", ["require", "exports", "local", "server"], function (require, exports, local, server) {
    "use strict";
    var Options = (function () {
        function Options(name, grunt) {
            this.name = name;
            this.grunt = grunt;
        }
        Options.prototype.files = function () {
            return this.grunt.file.expand(this.grunt.config.get(this.name + ".files"));
        };
        return Options;
    }());
    return function (grunt) {
        var opts = new Options("domTest", grunt);
        function suites() {
            var lib = require("../lib/grunt-dom-test.js").__private;
            lib.clear();
            opts.files().forEach(function (file) {
                var path = process.cwd() + "/" + file;
                delete require.cache[path];
                require(path);
            });
            return lib.suites();
        }
        grunt.registerTask(opts.name + ":server", "Starts a server to run tests in browser", function () {
            var self = this;
            var done = this.async();
            var httpServer = new server.Server(suites);
            httpServer.start().then(function (url) {
                grunt.log.subhead("Server started: " + url);
                grunt.log.writeln("");
                done();
            }).catch(function (err) {
                done(err);
            });
        });
        grunt.registerTask(opts.name + ":test", "Executes unit tests in Node with jsdom", function () {
            var self = this;
            var done = self.async();
            local.toMocha(suites()).run(function (failures) {
                done(failures === 0);
            });
        });
    };
});
