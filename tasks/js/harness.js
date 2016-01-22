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
    var Result;
    (function (Result) {
        Result[Result["Pass"] = 0] = "Pass";
        Result[Result["Fail"] = 1] = "Fail";
        Result[Result["Skipped"] = 2] = "Skipped";
    })(Result || (Result = {}));
    ;
    function normalize(result) {
        return {
            name: result.name,
            result: !!(result.result !== Result.Fail),
            message: result.message,
            duration: result.duration
        };
    }
    var ResultBuilder = (function () {
        function ResultBuilder(total, onComplete) {
            this.total = total;
            this.onComplete = onComplete;
            this.created = Date.now();
            this.passed = 0;
            this.failed = 0;
            this.tests = [];
        }
        ResultBuilder.prototype.breakdown = function (duration) {
            var breakdown = this.tests.filter(function (test) {
                return test.result === Result.Fail;
            }).map(normalize);
            if (breakdown.length === 0) {
                breakdown = [{
                        name: "All Tests",
                        result: true,
                        message: "All Tests Passed",
                        duration: duration
                    }];
            }
            return breakdown;
        };
        ResultBuilder.prototype.report = function (result) {
            this.tests.push(result);
            if (result.result === Result.Fail) {
                this.failed++;
            }
            else {
                this.passed++;
            }
            if (this.passed + this.failed === this.total) {
                var duration = Date.now() - this.created;
                this.onComplete({
                    passed: this.passed,
                    failed: this.failed,
                    total: this.total,
                    duration: duration,
                    tests: this.breakdown(duration)
                });
            }
        };
        return ResultBuilder;
    }());
    var TestCase = (function () {
        function TestCase(elem) {
            this.elem = elem;
        }
        TestCase.prototype.skip = function () {
            return this.elem.hasAttribute("test-skip");
        };
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
            if (outcome.result === Result.Pass) {
                report.className += " success";
            }
            else if (outcome.result === Result.Fail) {
                report.className += " failure";
            }
            else {
                report.className += " skipped";
            }
            if (outcome.result === Result.Fail && outcome.message) {
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
                if (result.result === Result.Fail) {
                    onFailure(result, test.url());
                }
                next();
            }
            if (test.skip()) {
                report(Result.Skipped, "Skipped");
                return;
            }
            Messages.subscribe(test.id(), function (data) {
                report(data.result ? Result.Pass : Result.Fail, data.message ? data.message : "");
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
