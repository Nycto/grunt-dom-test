/// <reference path="definition.ts"/>
/// <reference path="../typings/mocha/mocha.d.ts"/>

module Local {

    var Mocha = require("mocha");

    /** Wraps a test in a jsdom document */
    function buildTest ( test: Def.Test ): Mocha.ITest {
        return new Mocha.Test(test.name, function (done: () => void) {
            done();
        });
    }

    /** Converts a DOM-Test Suite object to a Mocha suite */
    export function toMocha ( suites: Def.Suite[] ): Mocha {
        var root: any = new Mocha();

        suites.forEach(suite => {
            var mochaSuite = new Mocha.Suite(suite.name);
            root.suite.addSuite(mochaSuite);

            suite.tests.forEach(test => {
                mochaSuite.addTest( buildTest(test) );
            });
        });

        return <Mocha> root;
    }
}

