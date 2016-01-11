/**
 * The primary entry point for the grunt task
 */

/// <reference path="../typings/gruntjs/gruntjs.d.ts" />

/** The list of valid options that can be passed to this module */
interface UserConfig {
}

/** Primary entry point for the grunt task */
module.exports = function ( grunt: grunt.ITaskComponents ) {
    grunt.registerTask(
        "domTest",
        "Executes unit tests both locally and in browsers",
        function () {

            // Grab a reference to 'this' so we can get the correct type.
            // @see https://github.com/Microsoft/TypeScript/issues/6018
            const task = <grunt.task.ITask> this;

            const options = task.options<UserConfig>({
            });

            console.log(this);
        }
    );
};

