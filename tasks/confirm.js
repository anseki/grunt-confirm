/*
 * grunt-confirm
 * https://github.com/anseki/grunt-confirm
 *
 * Copyright (c) 2015 anseki
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  var readlineSync = require('readline-sync'),
    RE_CTRL_CHAR = /\x1B\[\d+m/,
    HL_IN = '\x1B[1m', HL_OUT = '\x1B[22m';

  // Wrap handler
  function callHandler(handler, argsArray, handlerClass) {
    try {
      return handler.apply(grunt.task.current, argsArray);
    } catch (e) {
      grunt.log.error('"' + handlerClass + '" failed.');
      grunt.fail.fatal(e);
    }
  }

  grunt.registerMultiTask('confirm',
    'Abort or continue the tasks flow according to an answer to the question,' +
      ' the tasks pause and wait it.', function() {

    var options = this.options(), question, answer, filesArray;

    function getFiles(that) {
      if (!filesArray) {
        filesArray = [];
        that.files.forEach(function(f) {
          var srcArray = f.src.filter(function(filepath) {
            // Warn on and remove invalid source files (if nonull was set).
            if (!grunt.file.exists(filepath)) {
              grunt.log.warn('Source file "' + filepath + '" not found.');
              return false;
            } else {
              return true;
            }
          });
          // Grunt not supports empty src.
          if (srcArray.length) { filesArray.push({src: srcArray, dest: f.dest}); }
        });
      }
      return filesArray;
    }
    function hl(text) {
      text = '' + text;
      return RE_CTRL_CHAR.test(text) ? text : HL_IN + text + HL_OUT;
    }

    question = typeof options.question === 'function' ?
      callHandler(options.question, [getFiles(this)], 'question') :
      options.question;

    if (question) {
      answer = readlineSync.question(hl(question + ' :'));
      if (!(typeof options.continue === 'function' ?
          callHandler(options.continue, [answer, getFiles(this)], 'continue') :
          options.continue)) {
        grunt.log.ok('Tasks are aborted.');
        grunt.task.clearQueue();
      }
    }
  });
};
