/*
 * Walkway.js
 *
 * Copyright 2014, Connor Atherton - http://connoratherton.com/
 * Released under the MIT Licence
 * http://opensource.org/licenses/MIT
 *
 * Github:  http://github.com/ConnorAtherton/Walkway
 */

// Export Walkway depending on environment (AMD, CommonJS or Browser global)
;(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['exports'], function (exports) {
      factory(root);
    });
  } else if (typeof exports === 'object') {
    // CommonJS
    factory(exports);
  } else {
    // Browser globals
    factory(root);
  }
}(this, function (exports) {
  'use strict';

  /*
   * Shim for requestAnimationFrame on older browsers
   */

  var lastTime = 0;
  window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
  window.cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame;

  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = function(callback, element) {
      var currTime = new Date().getTime();
      var timeToCall = Math.max(0, 16 - (currTime - lastTime));
      var id = window.setTimeout(function() {
        callback(currTime + timeToCall);
      }, timeToCall);

      lastTime = currTime + timeToCall;
      return id;
    };
  }

  if (!window.cancelAnimationFrame) {
    window.cancelAnimationFrame = function(id) {
      clearTimeout(id);
    };
  }

  /*
   * Easing Functions - inspired from http://gizma.com/easing/
   * only considering the t value for the range [0, 1] => [0, 1]
   *
   * Taken from https://gist.github.com/gre/1650294
   */

  var EasingFunctions = {
    // no easing, no acceleration
    linear: function (t) { return t; },
    // accelerating from zero velocity
    easeInQuad: function (t) { return t*t; },
    // decelerating to zero velocity
    easeOutQuad: function (t) { return t*(2-t); },
    // acceleration until halfway, then deceleration
    easeInOutQuad: function (t) { return t<0.5 ? 2*t*t : -1+(4-2*t)*t; },
    // accelerating from zero velocity
    easeInCubic: function (t) { return t*t*t; },
    // decelerating to zero velocity
    easeOutCubic: function (t) { return (--t)*t*t+1; },
    // acceleration until halfway, then deceleration
    easeInOutCubic: function (t) { return t<0.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1; },
    // accelerating from zero velocity
    easeInQuart: function (t) { return t*t*t*t; },
    // decelerating to zero velocity
    easeOutQuart: function (t) { return 1-(--t)*t*t*t; },
    // acceleration until halfway, then deceleration
    easeInOutQuart: function (t) { return t<0.5 ? 8*t*t*t*t : 1-8*(--t)*t*t*t; },
    // accelerating from zero velocity
    easeInQuint: function (t) { return t*t*t*t*t; },
    // decelerating to zero velocity
    easeOutQuint: function (t) { return 1+(--t)*t*t*t*t; },
    // acceleration until halfway, then deceleration
    easeInOutQuint: function (t) { return t<0.5 ? 16*t*t*t*t*t : 1+16*(--t)*t*t*t*t; }
  };

  /*
   * Creates a selector used to select all element to animate
   * Currently only supports *path* and *line* svg elements
   *
   * TODO: In the future support more svg elements
   *
   * @param {string} selector The selector of the parent element
   * @returns {string} the complete selector
   * @private
   */

  function _createSelector(selector) {
    var supported = ['path', 'line'];
    var newSelector = supported.reduce(function(prev, curr){
      return prev + selector + ' ' + curr + ', ';
    }, '');
    // chop the last , from the string
    return newSelector.slice(0, -2);
  }

  /*
   * Walkway constructor function
   * opts.selector is the only mandatory param and can be passed in alone
   * as a string
   *
   * @param {object} opts the configuration objects for the instance.
   * @returns {walkway}
   */

  function Walkway(opts) {
    if (!(this instanceof Walkway))
      return new Walkway(opts);

    if(typeof opts === 'string')
      opts = { selector: opts };

    if (!opts.selector)
      return this.error('A selector needs to be specified');

    this.opts = opts;
    this.selector = opts.selector;
    this.duration = opts.duration || 500;
    this.easing = EasingFunctions[opts.easing] || EasingFunctions.easeInOutCubic;
    this.paths = this.getPaths();
    this.setInitialStyles();
    this.id = false;
  }

  /*
   * Prints an error message to the console
   *
   * @param {string} message the message to be displayed
   * @returns {void}
   */

  Walkway.prototype.error = function(message) {
    console.log('Walkway error: ' + message);
  };

  /*
   * Uses a pre-build selector to find and store elements to animate
   *
   * @returns {array} of Path instances
   */

  Walkway.prototype.getPaths = function() {
    var self = this;
    var selector = _createSelector(this.selector);
    var els = document.querySelectorAll(selector);
    els = Array.prototype.slice.call(els);

    return els.map(function(el) {
      if(el.tagName === 'path') {
        return new Path(el, self.duration, self.easing);
      } else if (el.tagName === 'line') {
        return new Line(el, self.duration, self.easing);
      }
    });
  };

  /*
   * Sets initial styles on all elements to be animated
   *
   * @returns {void}
   */

  Walkway.prototype.setInitialStyles = function() {
    this.paths.forEach(function(n) {
      n.el.style.strokeDasharray = n.length + ' ' + n.length;
      n.el.style.strokeDashoffset = n.length;
    });
  };

  /*
   * The general update loop for the animations.
   * Once individal paths are finished they are spliced
   * from the array. Once the array is empty the animation is stopped.
   *
   * @returns {void}
   */

  Walkway.prototype.draw = function(callback) {
    var counter = this.paths.length;
    var path;

    if (counter === 0) {
      if (callback && typeof(callback) === 'function') {
        callback();
      }
      return window.cancelAnimationFrame(this.id);
    }

    while (counter--) {
      path = this.paths[counter];
      var done = path.update();

      if (done)
        this.paths.splice(counter, 1);
    }

    this.id = window.requestAnimationFrame(this.draw.bind(this, callback));
  };

  /*
   * Constructor for new path instance
   *
   * @param {node} path actual dom node of the path
   * @param {string} duration how long the animation should take to complete
   * @param {string} easing the type of easing used - default is easeInOutCubic.
   * @returns {Path}
   */

  function Path(path, duration, easing) {
    this.el = path;
    this.length = path.getTotalLength(); // total length of the path
    this.duration = duration;
    this.easing = easing;
    this.animationStart = null;
    this.animationStarted = false;
  }

  /*
   * Updates path style until the animation is complete
   *
   * @returns {boolean} Returns true if the path animation is finished, false otherwise
   */

  Path.prototype.update = function() {
    if (!this.animationStarted) {
      this.animationStart = Date.now();
      this.animationStarted = true;
    }

    var progress = this.easing((Date.now() - this.animationStart) / this.duration);
    if (progress >= 1) return true;

    this.el.style.strokeDashoffset = Math.floor(this.length * (1 - progress));
    return false;
  };

  /*
   * Constructor for new Line instance
   *
   * @param {node} line actual dom node of the path
   * @param {string} duration how long the animation should take to complete
   * @param {string} easing the type of easing used - default is easeInOutCubic.
   * @returns {line}
   */

  function Line(line, duration, easing) {
    this.el = line;
    this.length = getLineLength(line);
    this.duration = duration;
    this.easing = easing;
    this.animationStart = null;
    this.animationStarted = false;
  }

  /*
   * Updates line style until the animation is complete
   *
   * @returns {boolean} Returns true if the line animation is finished, false otherwise
   */

  Line.prototype.update = function() {
    if (!this.animationStarted) {
      this.animationStart = Date.now();
      this.animationStarted = true;
    }

    var progress = this.easing((Date.now() - this.animationStart) / this.duration);
    if (progress >= 1) return true;

    this.el.style.strokeDashoffset = Math.floor(this.length * (1 - progress));
    return false;
  };

  /*
   * Calculates the length a line using pythagoras theorem
   *
   * @param {node} line The line element to calculate length of
   * @returns {Number} Length of the line
   */

  function getLineLength(line) {
    var x1 = line.getAttribute('x1');
    var x2 = line.getAttribute('x2');
    var y1 = line.getAttribute('y1');
    var y2 = line.getAttribute('y2');
    // if (x2 > x1) var tmp = x1; x1 = x2; x2 = tmp;
    // if (y2 > y1) var tmp = y1; y1 = y2; y2 = tmp;
    return Math.sqrt(Math.pow((x1 - x2), 2) + Math.pow((y1 - y2), 2));
  }

  exports.Walkway = Walkway;
}));

