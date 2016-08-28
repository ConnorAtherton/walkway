# Walkway [![devDependency Status](https://david-dm.org/ConnorAtherton/walkway/dev-status.svg)](https://david-dm.org/ConnorAtherton/walkway#info=devDependencies)

I loved the animations [for the polygon ps4 review](http://www.polygon.com/a/ps4-review) a few months back
and decided to create a small library to re-create them ([simple demo](http://htmlpreview.github.io/?https://github.com/ConnorAtherton/walkway/blob/master/example/index.html)).

It supports `path`, `line` and `polyline` elements.

## Download
#### Bower
```
bower install walkway.js
```

#### npm
```
npm install walkway.js
```

#### CDN
```
http://cdn.jsdelivr.net/walkway/0.0.6/walkway.min.js
```

## How to use

Create a new ```Walkway``` instance with a supplied options object.
When you want to start animating call ```.draw``` on the returned instance
providing an optional callback that will be called when drawing is complete.

``` js
// Create a new instance
var svg = new Walkway(options);
// Draw when ready, providing an optional callback
svg.draw(callback);

// Options passed in as an object, see options below.
var svg = new Walkway({ selector: '#test'});

// Overwriting defaults
var svg = new Walkway({
  selector: '#test',
  duration: '2000',
  // can pass in a function or a string like 'easeOutQuint'
  easing: function (t) {
    return t * t;
  }
});

svg.draw();

// If you don't want to change the default options you can
// also supply the constructor with a selector string.
var svg = new Walkway('#test');

svg.draw(function() {
  console.log('Animation finished');
});
```

All animations will automatically complete when the window containing them loses focus, to another
tab, for example. You can also choose to restart all animations in an event handler. To restart
every animation when the window gains focus again, you can do:

```
document.addEventListener('visibilitychange', function() {
  if (!document.hidden) {
    svg.redraw();
  }
}, false);
```

### Options

- **selector** (*mandatory*) - The selector of the parent element (usually will be a specific svg element)
- **duration** - Time the animation should run for, in ms. Default is 400.
- **easing** - Name of the easing function used for drawing. Default is 'easeInOutCubic'. You can also supply your own function that will be passed the progress and should return a value in the range of [0, 1];

### Easing

All credit for the built-in easing functions go to [gre](https://github.com/gre) from [this gist](https://gist.github.com/gre/1650294).

### Gotchas

Sometimes when exporting from a program like Illustrator elements have no stroke style attached to them. This results in confusion when
Walkway starts the animation and nothing shows up. Just be sure to add base styles that can be overwritten if required.

```sass
svg {
  path, line, polyline {
    stroke: #fff
    stroke-width: 2px
  }

  path {
    fill: transparent
  }
}
```

### Demo
View the example link provided near the top of this README or see it in action on my
[website](http://www.connoratherton.com/walkway).
