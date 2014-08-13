(function(window) {

  var lastTime = 0;
  var vendors = ['ms', 'moz', 'webkit', 'o'];
  for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
    window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
    window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
  }

  if (!window.requestAnimationFrame)
    window.requestAnimationFrame = function(callback, element) {
      var currTime = new Date().getTime();
      var timeToCall = Math.max(0, 16 - (currTime - lastTime));
      var id = window.setTimeout(function() {
          callback(currTime + timeToCall);
        },
        timeToCall);
      lastTime = currTime + timeToCall;
      return id;
    };

  if (!window.cancelAnimationFrame)
    window.cancelAnimationFrame = function(id) {
      clearTimeout(id);
    };

  //
  // Private
  //
  var defaults = {};
  var pathSelector = ' path';

  function _createSelector(selector) {
    var supported = ['path'];
    selector = supported.reduce(function(prev, curr){
      return prev + selector + ' ' + current + ', ';
    }, '');
    // chop the last , from the string
    console.log(selector.splice(-1, 2));
    return selector.splice(-1, 2);
  }

  function LineAnimate(opts) {
    if (!(this instanceof LineAnimate))
      return new LineAnimate(opts);

    this.opts = opts || {};
    this.selector = opts.selector;
    this.paths = this.getPaths();
    this.setInitialStyles();
    this.id = false;
  }

  LineAnimate.prototype.setInitialStyles = function() {
    this.paths.forEach(function(n) {
      n.el.style.strokeDasharray = n.length + ' ' + n.length;
      n.el.style.strokeDashoffset = n.length;
    });
  }

  LineAnimate.prototype.getPaths = function() {
    var els = document.querySelectorAll(this.selector + pathSelector);
    els = Array.prototype.slice.call(els);
    return els.map(function(path) {
      return new Path(path);
    });
  }

  LineAnimate.prototype.draw = function() {
    var counter = this.paths.length;
    var path;

    if (counter === 0)
      return window.cancelAnimationFrame(this.id);

    while (counter--) {
      path = this.paths[counter];
      var done = path.update();

      if (done)
        this.paths.splice(counter, 1);
    }

    this.id = window.requestAnimationFrame(this.draw.bind(this));
  }

  function Path(path, duration, easing) {
    this.el = path; // dom element
    this.length = path.getTotalLength(); // total length of the path
    this.duration = 2000 || duration; // time the animation should run
    this.easing = null; // for now
    this.animationStart = null;
    this.animationStarted = false;
  }

  Path.prototype.update = function() {
    if (!this.animationStarted) {
      this.animationStart = Date.now();
      this.animationStarted = true;
    }

    var progress = (Date.now() - this.animationStart) / this.duration;
    if (progress >= 1) {
      return true;
    } else {
      this.el.style.strokeDashoffset = Math.floor(this.length * (1 - progress));
      return false;
    }
  }



  this.LineAnimate = LineAnimate;

})(this);
