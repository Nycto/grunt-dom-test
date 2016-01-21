var Harness;
(function (Harness) {
    var unescape = (function () {
        var map = {
            "&amp;": "&",
            "&lt;": "<",
            "&gt;": ">",
            "&quot;": "\"",
            "&#x27;": "'",
            "&#x60;": "`",
            "&#x3D;": "=",
        };
        function escapeCallback(match) {
            return map[match];
        }
        var source = "(?:" + Object.keys(map).join("|") + ")";
        var regex = new RegExp(source, "g");
        return function unescape(str) {
            return str.replace(regex, escapeCallback);
        };
    }());
    var ResultBuilder = (function () {
        function ResultBuilder(total, onComplete) {
            this.total = total;
            this.onComplete = onComplete;
            this.created = Date.now();
            this.passed = 0;
            this.failed = 0;
            this.tests = [];
        }
        ResultBuilder.prototype.report = function (result) {
            this.tests.push(result);
            if (result.result) {
                this.passed++;
            }
            else {
                this.failed++;
            }
            if (this.passed + this.failed === this.total) {
                this.onComplete({
                    passed: this.passed,
                    failed: this.failed,
                    total: this.total,
                    duration: Date.now() - this.created,
                    tests: this.tests.filter(function (test) {
                        return !test.result;
                    })
                });
            }
        };
        return ResultBuilder;
    }());
    var TestCase = (function () {
        function TestCase(elem) {
            this.elem = elem;
        }
        TestCase.prototype.url = function () {
            return this.elem.getAttribute("test-url");
        };
        TestCase.prototype.id = function () {
            return this.elem.getAttribute("test-case");
        };
        TestCase.prototype.reportElem = function () {
            return document.querySelector("[test-report=\"" + this.id() + "\"]");
        };
        TestCase.prototype.run = function () {
            this.reportElem().className += " running";
            var iframe = document.createElement("iframe");
            var content = unescape(this.elem.textContent.trim());
            this.elem.parentNode.insertBefore(iframe, null);
            if (iframe.hasOwnProperty("srcdoc")) {
                iframe.srcdoc = content;
            }
            else {
                iframe.contentWindow.contents = content;
                iframe.src = "javascript:window.contents";
            }
        };
        TestCase.prototype.report = function (outcome) {
            var report = this.reportElem();
            report.className = report.className.replace(/\brunning\b/, "");
            report.className += outcome.result ? " success" : " failure";
            if (!outcome.result && outcome.message) {
                var error = document.createElement("div");
                error.classList.add("error");
                error.textContent = outcome.message;
                this.elem.parentNode.insertBefore(error, null);
            }
        };
        TestCase.prototype.name = function () {
            return this.elem.getAttribute("test-name");
        };
        return TestCase;
    }());
    var Messages;
    (function (Messages) {
        var listeners = {};
        window.addEventListener("message", function (e) {
            var data = JSON.parse(e.data);
            if (data.id === undefined) {
                throw new Error("Message received without an id" + data);
            }
            if (!listeners[data.id]) {
                throw new Error("No listener registered for " + data.id);
            }
            listeners[data.id](data);
        });
        function subscribe(id, callback) {
            if (listeners[id]) {
                throw new Error("Listener already registered for: " + id);
            }
            listeners[id] = callback;
        }
        Messages.subscribe = subscribe;
    })(Messages || (Messages = {}));
    function start(onComplete, onFailure) {
        if (onFailure === void 0) { onFailure = null; }
        var tests = [].slice.call(document.querySelectorAll("[test-case]"))
            .map(function (elem) { return new TestCase(elem); });
        var results = new ResultBuilder(tests.length, onComplete);
        function next() {
            var test = tests.shift();
            if (!test) {
                return;
            }
            var start = Date.now();
            var done = false;
            function report(passed, message) {
                if (done) {
                    return;
                }
                done = true;
                var result = {
                    name: test.name(),
                    result: passed,
                    message: message,
                    duration: Date.now() - start
                };
                test.report(result);
                results.report(result);
                if (!result.result) {
                    onFailure(result, test.url());
                }
                next();
            }
            Messages.subscribe(test.id(), function (data) {
                report(!!data.result, data.message ? data.message : "");
            });
            test.run();
            setTimeout(report.bind(null, false, "Timeout"), 5000);
        }
        for (var i = 0; i < 6; i++) {
            next();
        }
    }
    Harness.start = start;
    ;
})(Harness || (Harness = {}));
;
