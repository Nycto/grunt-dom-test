/* globals setTimeout */
/* exported define */

/**
 * An in browser implementation of 'define'
 */
var define = define || (function () {
    "use strict";

    // the map of loaded modules
    var modules = {};

    // A list of modules waiting on other modules
    var pending = {};

    /** Returns whether a module is one of the built in defaults */
    function isBuiltIn(name) {
        return name === "require" || name === "exports" || name === "module";
    }

    /** Returns whether a module has been loaded */
    function isDefined(name) {
        return modules.hasOwnProperty(name);
    }

    /** Returns whether all of a list of dependencies are defined */
    function allDefined(names) {
        for ( var i = 0; i < names.length; i++ ) {
            if ( !isBuiltIn(names[i]) && !isDefined(names[i]) ) {
                return false;
            }
        }
        return true;
    }

    /** Allows modules already loaded to be returned */
    function require(name) {
        if ( isDefined(name) ) {
            return modules[name];
        }
        else {
            throw new Error("Module has not been loaded: " + name);
        }
    }

    /** Schedules execution of a function as soon as possible */
    function tick(fn) {
        // TODO: This is actually rather slow. A better solution would batch
        // execute the functions in a single setTimeout call.
        setTimeout(fn, 0);
    }

    /** Executes a module and stores the results */
    function exec( name, dependencies, fn ) {

        // Execute this function and store the results
        tick(function () {
            var module = { exports: {} };

            // Resolve any dependencies and invoke the callback
            var result = fn.apply(null, dependencies.map(function (depend) {
                if ( depend === "require" ) {
                    return require;
                }
                else if ( depend === "exports" ) {
                    return module.exports;
                }
                else if ( depend === "module" ) {
                    return module;
                }
                else {
                    return modules[depend];
                }
            }));

            modules[name] = result || module.exports;

            // Resolve anything waiting on this module
            if ( pending[name] ) {
                for ( var i = 0; i < pending[name].length; i++ ) {
                    pending[name][i]();
                }
                delete pending[name];
            }
        });
    }

    /** Stores a function for later when all its dependencies aren't met */
    function enqueue(name, dependencies, fn) {

        // Checks whether all the dependencies are available and executes
        // the callback when they are
        function checkComplete () {
            if ( allDefined(dependencies) ) {
                exec(name, dependencies, fn);
            }
        }

        // Add a listener for any dependencies that aren't resolved
        for ( var i = 0; i < dependencies.length; i++ ) {
            if (!isBuiltIn(dependencies[i]) && !isDefined(dependencies[i])) {
                if ( !pending[dependencies[i]] ) {
                    pending[dependencies[i]] = [];
                }
                pending[dependencies[i]].push(checkComplete);
            }
        }
    }

    /** The define implementation, but with exact arguments required */
    function normalizedDefine(name, dependencies, fn) {
        if ( isDefined(name) ) {
            throw new Error("Module already defined: " + name);
        }
        else if ( !allDefined(dependencies) ) {
            enqueue(name, dependencies, fn);
        }
        else {
            exec(name, dependencies, fn);
        }
    }

    /** receives the call to define and redistributes the arguments */
    return function define(name, dependencies, fn) {
        if ( typeof name === "function" ) {
            normalizedDefine(undefined, [], name);
        }
        else if ( typeof dependencies === "function" ) {
            if ( typeof name === "string" ) {
                normalizedDefine(name, [], dependencies);
            }
            else {
                normalizedDefine(undefined, name, dependencies);
            }
        }
        else {
            normalizedDefine(name, dependencies, fn);
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
define("runner", ["require", "exports", "dom"], function (require, exports, dom) {
    "use strict";
    return function run(name, testId, setup, logic) {
        function report(result, message) {
            parent.postMessage(JSON.stringify({
                result: result,
                id: testId || document.location.search.substr(1),
                message: message
            }), "*");
            if (result) {
                document.body.className += " success";
            }
            else {
                var messanger = document.createElement("div");
                messanger.className = "failure";
                messanger.textContent = message;
                document.body.insertBefore(messanger, document.body.firstChild);
            }
            var duration = Date.now() - window.performance.timing.domLoading;
            window.global_test_results = {
                passed: result ? 1 : 0,
                failed: result ? 0 : 1,
                total: 1,
                duration: duration,
                tests: [
                    {
                        name: name,
                        result: result,
                        message: message,
                        duration: duration
                    }
                ]
            };
        }
        var complete;
        function done(result, message) {
            if (!complete) {
                complete = { result: result, message: message };
                setTimeout(function () { report(complete.result, complete.message); }, 0);
            }
            else {
                complete = {
                    result: false,
                    message: result ? "'done' called multiple times" : message
                };
            }
        }
        window.onerror = function (err) { done(false, err); };
        setTimeout(function () { done(false, "Test Timeout"); }, 500);
        var doc = new dom.Doc(window);
        if (setup) {
            setup(doc);
        }
        logic(function () { done(true, "Passed"); }, doc);
    };
});
