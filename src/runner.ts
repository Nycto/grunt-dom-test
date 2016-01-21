import dom = require("./dom");
import test = require("./test");

/** Runs a test */
export = function run (testId: number, setup: test.Setup, logic: test.Logic) {

    /** Reports a result back up the chain */
    function report ( result: boolean, message: string ) {
        parent.postMessage( JSON.stringify({
            result: result,
            id: testId || document.location.search.substr(1),
            message: message
        }), "*" );

        if ( result ) {
            document.body.className += " success";
        }
        else {
            var messanger = document.createElement("div");
            messanger.className = "failure";
            messanger.textContent = message;
            document.body.insertBefore(
                messanger, document.body.firstChild);
        }
    }

    // The results of the test
    var complete: { result: boolean; message: string };

    /** The 'done' function that gets passed to the test */
    function done ( result: boolean, message: string ) {

        // The first time `done` is called, record it
        if ( !complete ) {
            complete = { result: result, message: message };

            // Delaying the report allows errors to be caught that
            // happen after 'done' is invoked
            setTimeout(() => { report(complete.result, complete.message); }, 0);
        }

        // A subsequent call to done should be reported as a failure
        else {
            complete = {
                result: false,
                message: result ? "'done' called multiple times" : message
            };
        }
    }


    // If an error is thrown, report a failure
    window.onerror = (err: string) => { done(false, err); };

    // 500ms timeout for running the test
    setTimeout(() => { done(false, "Test Timeout"); }, 500);

    var doc = new dom.Doc(window);

    if ( setup ) {
        setup(doc);
    }

    // Run the test
    logic(() => { done(true, "Passed"); }, doc);
}

