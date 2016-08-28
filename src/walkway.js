/*
 * Walkway.js
 *
 * Copyright 2016, Connor Atherton - http://connoratherton.com/
 * Released under the MIT Licence
 * http://opensource.org/licenses/MIT
 *
 * Github: http://github.com/ConnorAtherton/Walkway
 */

// Export Walkway depending on environment (AMD, CommonJS or Browser global)
;(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(factory);
  } else if (typeof exports === 'object') {
    // CommonJS
    module.exports = factory();
  } else {
    // Browser globals
    root.Walkway = factory();
  }
}(this, function factory(exports) {
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
   * Currently only supports *path*, *line*, and *polyline* svg elements
   *
   * @param {string} selector The selector of the parent element
   * @returns {string} the complete selector
   * @private
   */

  function _createSelector(selector) {
    var supported = ['path', 'line', 'polyline'];
    var newSelector = supported.reduce(function(prev, curr){
      return prev + selector + ' ' + curr + ', ';
    }, '');
    // chop the last , from the string
    return newSelector.slice(0, -2);
  }

  /*
   * All Walkway instances present on the current page. This is needed for when
   * the tab loses focus and we need to force each animation to finish.
   */
  var _elements = [];
  var _instances = [];

  document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
      return;
    }

    for (var i = 0, instancesLen = _instances.length; i < instancesLen; i++) {
      _instances[i].cancel();
    }

    for (var j = 0, elementsLen = _elements.length; j < elementsLen; j++) {
      _elements[j].complete();
    }
  }, false);

  /*
   * Walkway constructor function
   * opts.selector is the only mandatory param and can be passed in alone
   * as a string
   *
   * @param {object} opts the configuration objects for the instance.
   * @returns {walkway}
   */

  function Walkway(opts) {
    if (!(this instanceof Walkway)) {
      return new Walkway(opts);
    }

    if (typeof opts === 'string') {
      opts = { selector: opts };
    }

    if (!opts.selector) {
      return this.error('A selector needs to be specified');
    }

    this.opts = opts;
    this.selector = opts.selector;
    this.duration = opts.duration || 500;
    this.easing = (typeof opts.easing === 'function') ?
      opts.easing :
      EasingFunctions[opts.easing] || EasingFunctions.easeInOutCubic;
    this.id = false;
    this.elements = this.getElements();
    this.callback = opts.callback;

    this.setInitialStyles();

    _elements = _elements.concat(this.elements);
    _instances.push(this);
  }

  Walkway.prototype = {
    constructor: Walkway,

    /*
     * Prints an error message to the console
     *
     * @param {string} message the message to be displayed
     * @returns {void}
     */
    error: function(message) {
      console.error('Walkway error: ' + message);
    },

    /*
     * Uses a pre-build selector to find and store elements to animate
     *
     * @returns {array} of Path instances
     */
    getElements: function() {
      var self = this;
      var selector = _createSelector(this.selector);
      var els = document.querySelectorAll(selector);
      els = Array.prototype.slice.call(els);

      return els.map(function(el) {
        if(el.tagName === 'path') {
          return new Path(el, self.duration, self.easing);
        } else if (el.tagName === 'line') {
          return new Line(el, self.duration, self.easing);
        } else if(el.tagName === 'polyline') {
          return new Polyline(el, self.duration, self.easing);
        }
      });
    },

    /*
     * Sets initial styles on all elements to be animated
     *
     * @returns {void}
     */
    setInitialStyles: function() {
      this.elements.forEach(function(n) {
        n.el.style.strokeDasharray = n.length + ' ' + n.length;
        n.el.style.strokeDashoffset = n.length;
      });
    },

    /*
     * The general update loop for the animations.
     * Once individal paths are completed they are marked as such and
     * are not updated.
     *
     * @returns {void}
     */
    draw: function(callback) {
      var counter = this.elements.length;
      var allComplete = this.elements.filter(function(el) { return el.done; }).length === counter;
      var element = null;
      var done = false;

      // Overwrite existing callback passed in with options
      this.callback = callback || this.callback;

      if (allComplete) {
        if (this.callback && typeof(this.callback) === 'function') {
          this.callback();
        }

        this.cancel();
        return;
      }

      while (counter--) {
        element = this.elements[counter];
        done = element.update();

        if (done) {
          element.done = true;
        }
      }

      this.id = window.requestAnimationFrame(this.draw.bind(this, callback));
    },

    cancel: function() {
      window.cancelAnimationFrame(this.id);
    },

    redraw: function() {
      this.cancel();

      this.elements.forEach(function(element) {
        element.reset();
      });

      this.draw();
    }
  };

  function WalkwayElement(el, duration, easing) {
    this.el = el;
    this.duration = duration;
    this.easing = easing;
    this.animationStart = null;
    this.animationStarted = false;
  }

  WalkwayElement.prototype = {
    constructor: WalkwayElement,

    /*
     * This contains the general update logic for all supported svg
     * elements.
     *
     * @returns {boolean} true if the animation is complete, false otherwise
     */
    update: function() {
      if (!this.animationStarted) {
        this.animationStart = Date.now();
        this.animationStarted = true;
      }

      var progress = this.easing((Date.now() - this.animationStart) / this.duration);

      this.fill(progress);

      return progress >= 1 ? true : false;
    },

    fill: function(progress) {
      var value = Math.ceil(this.length * (1 - progress));
      this.el.style.strokeDashoffset = value < 0 ? 0 : Math.abs(value);
    },

    complete: function() {
      this.fill(1);
    },

    reset: function() {
      this.done = false;
      this.animationStart = 0;
      this.animationStarted = false;
      this.fill(0);
    }
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
    WalkwayElement.call(this, path, duration, easing);

    this.length = path.getTotalLength();
  }

  /*
   * Constructor for new Line instance
   *
   * @param {node} line actual dom node of the path
   * @param {string} duration how long the animation should take to complete
   * @param {string} easing the type of easing used - default is easeInOutCubic.
   * @returns {line}
   */

  function Line(line, duration, easing) {
    WalkwayElement.call(this, line, duration, easing);

    this.length = getLineLength(line);
  }

  /*
   * Constructor for new Polyline instance
   *
   * @param {node} polyline actual dom node of the path
   * @param {string} duration how long the animation should take to complete
   * @param {string} easing the type of easing used - default is easeInOutCubic.
   * @returns {polyline}
   */
  function Polyline(polyline, duration, easing) {
    WalkwayElement.call(this, polyline, duration, easing);

    this.length = getPolylineLength(polyline);
  }

  Path.prototype = Line.prototype = Polyline.prototype = Object.create(WalkwayElement.prototype);

  /*
   * Calculates the length of a polyline using pythagoras theorem for each line segment
   *
   * @param {node} polyline The polyline element to calculate length of
   * @returns {Number} Length of the polyline
   */

  function getPolylineLength(polyline) {
    var dist = 0;
    var x1, x2, y1, y2;
    var i;
    var points = polyline.points.numberOfItems;

    for (i = 1; i < points; i++){
      x1 = polyline.points.getItem(i - 1).x;
      x2 = polyline.points.getItem(i).x;
      y1 = polyline.points.getItem(i - 1).y;
      y2 = polyline.points.getItem(i).y;

      dist += Math.sqrt(Math.pow((x1 - x2), 2) + Math.pow((y1 - y2), 2));
    }

    return dist;
  }

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

    return Math.sqrt(Math.pow((x1 - x2), 2) + Math.pow((y1 - y2), 2));
  }

  return Walkway;
}));
