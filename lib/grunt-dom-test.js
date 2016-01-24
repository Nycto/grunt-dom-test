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


var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
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
define("lib", ["require", "exports", "definition"], function (require, exports, def) {
    "use strict";
    var suites = [];
    var TestBuilder = (function () {
        function TestBuilder(title, html, built) {
            this.title = title;
            this.html = html;
            this.built = built;
        }
        TestBuilder.prototype.in = function (test) {
            return this.built(new def.Test(this.title, this.html, test, false));
        };
        TestBuilder.prototype.skip = function (test) {
            return this.built(new def.Test(this.title, this.html, test, true));
        };
        return TestBuilder;
    }());
    var HtmlTestBuilder = (function (_super) {
        __extends(HtmlTestBuilder, _super);
        function HtmlTestBuilder(title, built) {
            _super.call(this, title, "", built);
        }
        HtmlTestBuilder.prototype.using = function (html) {
            return new TestBuilder(this.title, html, this.built);
        };
        return HtmlTestBuilder;
    }(TestBuilder));
    var SuiteBuilder = (function () {
        function SuiteBuilder(suitePrefix, suiteTitle) {
            this.suite = new def.Suite(suitePrefix, suiteTitle);
            suites.push(this.suite);
        }
        SuiteBuilder.prototype.setup = function (fn) {
            this.suite.setup = fn;
            return this;
        };
        SuiteBuilder.prototype.withFile = function (path) {
            this.suite.files.push(path);
            return this;
        };
        SuiteBuilder.prototype.withUtility = function (path) {
            this.suite.utilities.push(path);
            return this;
        };
        SuiteBuilder.prototype.should = function (testTitle) {
            var _this = this;
            return new HtmlTestBuilder(testTitle, function (test) {
                _this.suite.tests.push(test);
                return _this;
            });
        };
        SuiteBuilder.prototype.and = function (suiteTitle) {
            var builder = new SuiteBuilder("", suiteTitle);
            builder.setup(this.suite.setup);
            this.suite.files.forEach(function (file) { builder.withFile(file); });
            this.suite.utilities.forEach(function (util) { builder.withUtility(util); });
            return builder;
        };
        return SuiteBuilder;
    }());
    function buildSuite(prefix) {
        return function (name) { return new SuiteBuilder(prefix, name); };
    }
    return {
        a: buildSuite("A"),
        an: buildSuite("An"),
        the: buildSuite("The"),
        given: buildSuite("Given"),
        __private: {
            clear: function () { suites = []; },
            suites: function () { return suites; }
        }
    };
});
