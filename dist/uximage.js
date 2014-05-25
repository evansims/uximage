
/* @preserve
 * UXImage 0.2.11
 * http://github.com/evanisms/uximage/
 *
 * Copyright 2014 Evan Sims and other contributors
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the 'Software'),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included
 * in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */

(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  window.UXImage = (function() {
    'use strict';
    function UXImage(options) {
      this.Setup = __bind(this.Setup, this);
      this.onInputEvent = __bind(this.onInputEvent, this);
      this.getBrowserState = __bind(this.getBrowserState, this);
      this.Loop = __bind(this.Loop, this);
      this.Transform = __bind(this.Transform, this);
      this.transformSource = __bind(this.transformSource, this);
      this.setSource = __bind(this.setSource, this);
      this.breakpointProcessor = __bind(this.breakpointProcessor, this);
      this.breakpointApply = __bind(this.breakpointApply, this);
      this.scrollProcessor = __bind(this.scrollProcessor, this);
      this.getElementOffsets = __bind(this.getElementOffsets, this);
      this.Analyze = __bind(this.Analyze, this);
      this.Parse = __bind(this.Parse, this);
      this.checkWebP = __bind(this.checkWebP, this);
      this.speedTestComplete = __bind(this.speedTestComplete, this);
      this.speedTest = __bind(this.speedTest, this);
      var len, o;
      this.options = {
        speedTestUri: '//farm9.staticflickr.com/8519/8629755757_117cdebd73_o.jpg',
        lazyLoadDistance: 500
      };
      this._ready = false;
      this._deviceBandwidth = null;
      this._clientWebPSupport = null;
      this._cachedBreakpointObjects = [];
      this._cachedLazyObjects = [];
      this._inputEventCache = [];
      this._inputEventCache = {
        inputTicking: false,
        viewportScrollTimer: null,
        viewportResizeTimer: null,
        lastKnownScrollX: -1,
        lastKnownScrollY: -1,
        lastKnownHeight: -1,
        lastKnownWidth: -1
      };
      if (options) {
        len = options.length;
        o = 0;
        while (o < len) {
          this.options[options[o]] = options[o];
        }
      }
      if (document.readyState === 'complete' || document.readyState === 'interactive') {
        this.Setup();
      } else if (window !== void 0) {
        window.addEventListener('onload', ((function(_this) {
          return function() {
            _this.Setup();
          };
        })(this)), false);
        document.addEventListener('DOMContentLoaded', ((function(_this) {
          return function() {
            _this.Setup();
          };
        })(this)), false);
      }
    }

    UXImage.prototype.speedTest = function(callback) {
      callback = callback || function() {
        return void 0;
      };
      this.checkWebP((function(_this) {
        return function() {
          var e, testImage, testStart;
          try {
            testImage = new Image();
            testStart = null;
            testImage.onload = function() {
              var bandwidth, connectionKbps, duration;
              duration = ((new Date()).getTime() - testStart) / 1000;
              duration = (duration > 1 ? duration : 1);
              connectionKbps = ((50 * 1024 * 8) / duration) / 1024;
              bandwidth = (connectionKbps >= 150 ? 'high' : 'low');
              _this.speedTestComplete(bandwidth, callback);
            };
            testImage.onerror = function() {
              _this.speedTestComplete('low', callback);
            };
            testImage.onabort = function() {
              _this.speedTestComplete('low', callback);
            };
            testStart = (new Date()).getTime();
            testImage.src = _this.options.speedTestUri + '?r=' + Math.random();
            setTimeout((function() {
              _this.speedTestComplete('low', callback);
            }), (((50 * 8) / 150) * 1000) + 350);
          } catch (_error) {
            e = _error;
            _this.speedTestComplete('low', callback);
          }
        };
      })(this));
    };

    UXImage.prototype.speedTestComplete = function(result, callback) {
      callback = callback || function() {
        return void 0;
      };
      if (!this._deviceBandwidth) {
        this._deviceBandwidth = result;
        callback();
      }
    };

    UXImage.prototype.checkWebP = function(callback) {
      var webP;
      callback = callback || function() {
        return void 0;
      };
      if (this._clientWebPSupport !== null) {
        callback(this._clientWebPSupport);
        return;
      }
      webP = new Image();
      webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
      webP.onload = webP.onerror = (function(_this) {
        return function() {
          if (webP.height === 2 && webP.width === 2) {
            _this._clientWebPSupport = true;
          } else {
            _this._clientWebPSupport = false;
          }
          callback(_this._clientWebPSupport);
        };
      })(this);
    };

    UXImage.prototype.Parse = function(container) {
      var i, images, len;
      container = container || document.body;
      i = 0;
      len = container.length;
      if (len) {
        i = 0;
        while (i < len) {
          this.Parse(container[i]);
          i += 1;
        }
      } else {
        images = container.getElementsByClassName('ux-image');
        len = images.length;
        i = 0;
        while (i < len) {
          this.Analyze(images[i]);
          i += 1;
        }
        this.onInputEvent('scroll');
      }
    };

    UXImage.prototype.Analyze = function(element) {
      var classes, i, len, ondemand;
      if (!element) {
        return;
      }
      classes = [];
      ondemand = false;
      if (element.classList === void 0) {
        classes = element.classList;
      } else {
        classes = element.className.split(' ');
      }
      if (classes.indexOf === void 0) {
        if (classes.indexOf('ondemand') !== -1) {
          ondemand = true;
        }
      } else {
        i = 0;
        len = classes.length;
        while (i < len) {
          if (classes[i] === 'ondemand') {
            ondemand = true;
            break;
          }
          i++;
        }
      }
      if (ondemand) {
        element.setAttribute('data-uximage-state', 'ondemand');
        this._cachedLazyObjects.push(element);
      }
      this.Transform(element);
    };

    UXImage.prototype.getElementOffsets = function(obj) {
      var poX, poY, pos;
      if (!obj) {
        return;
      }
      pos = obj.getBoundingClientRect();
      poX = this._inputEventCache.lastKnownScrollX;
      poY = this._inputEventCache.lastKnownScrollY;
      return {
        x: pos.left + poX,
        y: pos.top + poY
      };
    };

    UXImage.prototype.scrollProcessor = function() {
      var i, image, imagePosition, len, qHide, qShow, retry, top, transformSourceCallback, y;
      if (!this._cachedLazyObjects.length) {
        return;
      }
      top = this._inputEventCache.lastKnownScrollY;
      y = this._inputEventCache.lastKnownHeight;
      qShow = [];
      qHide = [];
      retry = false;
      if (this._deviceBandwidth) {
        i = 0;
        len = this._cachedLazyObjects.length;
        while (i < len) {
          image = this._cachedLazyObjects[i];
          if (image === void 0) {
            delete this._cachedLazyObjects[i];
            continue;
          }
          if (image.getAttribute('data-uximage-state') !== 'ready') {
            retry = true;
            continue;
          }
          imagePosition = this.getElementOffsets(image);
          if (((top + y) >= imagePosition.y - this.options.lazyLoadDistance) && (top <= (imagePosition.y + image.offsetHeight + this.options.lazyLoadDistance))) {
            if (!image.getAttribute('data-loaded')) {
              qShow.push(image);
            }
          } else {
            if (image.getAttribute('data-loaded')) {
              qHide.push(image);
            }
          }
          i += 1;
        }
        transformSourceCallback = function(element) {
          element.setAttribute('data-loaded', 'true');
        };
        i = 0;
        len = qShow.length;
        while (i < len) {
          this.transformSource(qShow[i], transformSourceCallback(qShow[i]));
          i += 1;
        }
        i = 0;
        len = qHide.length;
        while (i < len) {
          qHide[i].style.backgroundImage = '';
          qHide[i].removeAttribute('data-loaded');
          i += 1;
        }
      }
      if (retry || !this._deviceBandwidth) {
        if (this.viewportScrollTimer) {
          clearTimeout(this.viewportScrollTimer);
        }
        this.viewportScrollTimer = setTimeout((function(_this) {
          return function() {
            _this.scrollProcessor();
          };
        })(this), 1000 / 60);
      }
    };

    UXImage.prototype.breakpointApply = function(image, force) {
      var high, low, pos;
      if (!image) {
        return false;
      }
      if (!force && image.getAttribute('data-uximage-state') !== 'ready') {
        return false;
      }
      pos = image.getBoundingClientRect();
      high = parseInt(image.getAttribute('data-breakpoint-high'), 10) || null;
      low = parseInt(image.getAttribute('data-breakpoint'), 10) || null;
      if (high || low) {
        if (high && pos.width >= high && this._deviceBandwidth === 'high') {
          this.setSource(image, image.getAttribute('data-src-high'));
        } else if (low && pos.width <= low || this._deviceBandwidth === 'low') {
          this.setSource(image, image.getAttribute('data-src'));
        } else {
          if (image.getAttribute('data-src-medium')) {
            this.setSource(image, image.getAttribute('data-src-medium'));
          } else {
            this.setSource(image, image.getAttribute('data-src'));
          }
        }
        return true;
      }
      return false;
    };

    UXImage.prototype.breakpointProcessor = function() {
      var len;
      if (!this._deviceBandwidth) {
        return;
      }
      len = this._cachedBreakpointObjects.length;
      if (this._inputEventCache.viewportResizeTimer) {
        clearTimeout(this._inputEventCache.viewportResizeTimer);
        this._inputEventCache.viewportResizeTimer = null;
      }
      if (len) {
        this._inputEventCache.viewportResizeTimer = setTimeout((function(_this) {
          return function() {
            var i;
            i = 0;
            while (i < len) {
              _this.transformSource(_this._cachedBreakpointObjects[i]);
              i += 1;
            }
          };
        })(this), 1000 / 30);
      }
    };

    UXImage.prototype.acceptSourceChange = function(element, src) {
      var curr;
      curr = element.style.backgroundImage;
      if (!curr) {
        return true;
      }
      if (!src.length) {
        return false;
      }
      if (!curr.length && src.length) {
        return true;
      }
      if (curr === src || curr === 'url(' + src + ')' || curr === 'url(\'' + src + '\')' || curr.substring(curr.length - src.length - 1) === src + ')') {
        return false;
      }
      return true;
    };

    UXImage.prototype.setSource = function(element, src) {
      if (!element) {
        return false;
      }
      if (src && this._clientWebPSupport && element.getAttribute('data-use-webp') && src.substring(src.lastIndexOf('.') + 1) !== 'webp') {
        src = src.substring(0, src.lastIndexOf('.') + 1) + 'webp';
      }
      if (this.acceptSourceChange(element, src)) {
        element.style.backgroundImage = 'url(' + src + ')';
      }
    };

    UXImage.prototype.transformSource = function(element, callback) {
      var sources;
      callback = callback || function() {
        return void 0;
      };
      if (!this.breakpointApply(element)) {
        sources = {
          low: element.getAttribute('data-src'),
          medium: element.getAttribute('data-src-medium'),
          high: element.getAttribute('data-src-high')
        };
        if (this._deviceBandwidth === 'low' && sources.low) {
          this.setSource(element, sources.high);
        } else if (this._deviceBandwidth === 'high' && sources.high) {
          this.setSource(element, sources.high);
        } else if (sources.medium) {
          this.setSource(element, sources.medium);
        } else {
          if (sources.low) {
            this.setSource(element, sources.low);
          }
        }
      }
      callback();
    };

    UXImage.prototype.Transform = function(element, callback) {
      var dimensions, ratio, sources, testImage, testSource;
      callback = callback || function() {
        return void 0;
      };
      if (!this._deviceBandwidth) {
        return;
      }
      if (typeof element !== 'object' || element.tagName !== 'DIV') {
        return;
      }
      if (element.getAttribute('data-uximage-state') === 'ready') {
        return;
      }
      sources = {
        low: element.getAttribute('data-src'),
        medium: element.getAttribute('data-src-medium'),
        high: element.getAttribute('data-src-high')
      };
      dimensions = {
        height: element.getAttribute('height') || parseInt(element.style.height, 10) || null,
        width: element.getAttribute('width') || parseInt(element.style.width, 10) || null
      };
      if (!dimensions.width || !dimensions.height) {
        testImage = document.createElement('img');
        document.body.appendChild(testImage);
        testImage.style.display = 'block';
        testImage.style.visibility = 'hidden';
        testSource = sources.low;
        if (!testSource) {
          testSource = sources.medium;
        }
        if (!testSource) {
          testSource = sources.high;
        }
        testImage.onload = (function(_this) {
          return function() {
            element.setAttribute('width', _this.offsetWidth);
            element.setAttribute('height', _this.offsetHeight);
            _this.parentNode.removeChild(_this);
            _this.Transform(element, callback);
          };
        })(this);
        testImage.onerror = (function(_this) {
          return function() {
            element.parentNode.removeChild(element);
            _this.parentNode.removeChild(_this);
          };
        })(this);
        testImage.src = testSource;
      } else {
        ratio = (dimensions.height / dimensions.width) * 100;
        element.style.width = '';
        element.style.height = '';
        element.style.paddingBottom = ratio + '%';
        element.removeAttribute('width');
        element.removeAttribute('height');
        if (this._deviceBandwidth === 'low' && sources.low) {
          if (element.getAttribute('data-uximage-state') !== 'ondemand') {
            this.transformSource(element);
          }
        } else {
          if (element.getAttribute('data-breakpoint-high') || element.getAttribute('data-breakpoint')) {
            this._cachedBreakpointObjects.push(element);
            if (element.getAttribute('data-uximage-state') !== 'ondemand') {
              this.breakpointApply(element, true);
            }
          } else {
            if (element.getAttribute('data-uximage-state') !== 'ondemand') {
              this.transformSource(element);
            }
          }
        }
        element.setAttribute('data-uximage-state', 'ready');
        callback();
      }
    };

    UXImage.prototype.Loop = function(eventType) {
      eventType = eventType || 'scroll';
      if (eventType === 'resize') {
        this.breakpointProcessor();
      } else {
        this.scrollProcessor();
      }
      this._inputEventCache.inputTicking = false;
    };

    UXImage.prototype.getBrowserState = function(eventType) {
      eventType = eventType || 'scroll';
      switch (eventType) {
        case 'resize':
          this._inputEventCache.lastKnownHeight = (window.innerHeight !== void 0 ? window.innerHeight : (document.documentElement || document.body).clientHeight);
          this._inputEventCache.lastKnownWidth = (window.innerWidth !== void 0 ? window.innerWidth : (document.documentElement || document.body).clientWidth);
          break;
        default:
          this._inputEventCache.lastKnownScrollX = (window.pageXOffset !== void 0 ? window.pageXOffset : (document.documentElement || document.body.parentNode || document.body).scrollLeft);
          this._inputEventCache.lastKnownScrollY = (window.pageYOffset !== void 0 ? window.pageYOffset : (document.documentElement || document.body.parentNode || document.body).scrollTop);
      }
      return true;
    };

    UXImage.prototype.onInputEvent = function(eventType) {
      eventType = eventType || 'scroll';
      if (!this._inputEventCache.inputTicking) {
        this._inputEventCache.inputTicking = true;
        if (eventType === 'resize') {
          this.getBrowserState('resize');
        }
        this.getBrowserState('scroll');
        this.requestAnimationFrame(this.Loop(eventType));
      }
    };

    UXImage.prototype.Setup = function() {
      var css, head;
      if (this._ready) {
        return;
      } else {
        this._ready = true;
      }
      head = document.getElementsByTagName('head')[0];
      css = document.createElement('style');
      css.innerHTML = ['.ux-image {', 'display: block;', 'max-width: 100%;', 'height: auto !important;', 'position: relative;', 'background: transparent url(data:image/gif;base64,R0lGODlhAQABAIAAAMz/AAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==) no-repeat center;', '-ms-interpolation-mode: bicubic;', 'image-rendering: optimizeQuality;', '-webkit-perspective: 1000;', '-moz-perspective: 1000;', '-ms-perspective: 1000;', '-o-perspective: 1000;', 'perspective: 1000;', '-webkit-backface-visibility: hidden;', '-moz-backface-visibility: hidden;', '-ms-backface-visibility: hidden;', '-o-backface-visibility: hidden;', 'backface-visibility: hidden;', '-webkit-background-size: cover;', '-moz-background-size: cover;', '-ms-background-size: cover;', '-o-background-size: cover;', 'background-size: cover;', '-webkit-transform: translateZ(0);', '-moz-transform: translateZ(0);', '-ms-transform: translateZ(0);', '-o-transform: translateZ(0);', 'transform: translateZ(0);', '}'].join(' ');
      head.appendChild(css);
      this.getBrowserState('resize');
      this.getBrowserState('scroll');
      document.addEventListener('scroll', ((function(_this) {
        return function() {
          _this.onInputEvent('scroll');
        };
      })(this)), false);
      window.addEventListener('resize', ((function(_this) {
        return function() {
          _this.onInputEvent('resize');
        };
      })(this)), false);
    };

    UXImage.prototype.requestAnimationFrame = function(callback) {
      callback = callback || function() {
        return void 0;
      };
      return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function(callback) {
        window.setTimeout(callback, 16);
      };
    };

    return UXImage;

  })();

  if (typeof define === 'function') {
    define('UXImage', function() {
      return new UXImage();
    });
  }

}).call(this);
