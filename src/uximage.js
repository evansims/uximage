
/*!
 * uxImage 2013.07.24
 * http://github.com/evanisms/uximage/

 * Copyright 2013 Evan Sims and other contributors
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:

 * The above copyright notice and this permission notice shall be included
 * in all copies or substantial portions of the Software.

 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */

function uxImage() {

    "use strict";

    this.ready = false;
    this.speedTestUri = '//farm9.staticflickr.com/8519/8629755757_117cdebd73_o.jpg';
    this.deviceBandwidth = null;
    this.clientWebPSupport = null;

    // How far above or below the image element should the viewport be scrolled before
    // the asset is unloaded. Defaults to 500px.
    this.lazyLoadDistance = 500;

    this.cachedBreakpointObjects = [];
    this.cachedLazyObjects = [];

    this.inputEventCache = {
        inputTicking: false,
        viewportScrollTimer: null,
        viewportResizeTimer: null,
        lastKnownScrollX: -1,
        lastKnownScrollY: -1,
        lastKnownHeight: -1,
        lastKnownWidth: -1
    };

    this.speedTest = function(callback) {
        if(!callback) callback = function() {};

        var me = this;
        this.checkWebP(function() {

            try {
                var testImage = new Image(),
                testStart = null;

                testImage.onload = function() {
                    var duration = ( (new Date()).getTime() - testStart ) / 1000;
                    duration = ( duration > 1 ? duration : 1 );

                    var connectionKbps = ( ( 50 * 1024 * 8 ) / duration ) / 1024;
                    var bandwidth = ( connectionKbps >= 150 ? 'high' : 'low' );

                    me.speedTestComplete(bandwidth, callback);
                };

                testImage.onerror = function() {
                    me.speedTestComplete('low', callback);
                };

                testImage.onabort = function() {
                    me.speedTestComplete('low', callback);
                };

                testStart = (new Date()).getTime();
                testImage.src = me.speedTestUri + "?r=" + Math.random();

                setTimeout(function () {
                    me.speedTestComplete('low', callback);
                }, ((((50 * 8) / 150) * 1000) + 350));

            } catch(e) {
                me.speedTestComplete('low', callback);
            }

        });
    };

    this.speedTestComplete = function(result, callback) {
        if(!this.deviceBandwidth) {
            this.deviceBandwidth = result;
            callback();
        }
    };

    this.checkWebP = function(callback) {
        if(!callback) callback = function() {};

        if(this.clientWebPSupport !== null) {
            callback(this.clientWebPSupport);
            return;
        }

        var webP = new Image(),
            me   = this;

        webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
        webP.onload = webP.onerror = function () {
            if(webP.height === 2 && webP.width === 2) {
                me.clientWebPSupport = true;
            } else {
                me.clientWebPSupport = false;
            }

            callback(me.clientWebPSupport);
        };
    };

    this.Parse = function(container) {
        container = container || document.body;

        var i = 0,
            len = container.length;

        if(len) {
            for(i = 0; i < len; i += 1) {
                this.Parse(container[i]);
            }
        } else {
            var images = container.getElementsByClassName("ux-image");
            len = images.length;

            for(i = 0; i < len; i += 1) {
                this.Analyze(images[i]);
            }

            this.onInputEvent("scroll");
        }

    };

    this.Analyze = function(element) {
        var classes  = [],
            ondemand = false;

        if(typeof element.classList === undefined) {
            classes = element.classList;
        } else {
            classes = element.className.split(' ');
        }

        if(typeof classes.indexOf === undefined) {
            if(classes.indexOf('ondemand') != -1) {
                ondemand = true;
            }
        } else {
            for(var i = 0, len = classes.length; i < len; i++) {
                if(classes[i] === 'ondemand') {
                    ondemand = true;
                    break;
                }
            }
        }

        if(ondemand) { // Flag this object
            element.setAttribute('data-uximage-state', 'ondemand');
            this.cachedLazyObjects.push(element);
        }

        this.Transform(element);
    };

    this.getElementOffsets = function(obj) {
        var pos = obj.getBoundingClientRect(),
            poX = this.inputEventCache.lastKnownScrollX,
            poY = this.inputEventCache.lastKnownScrollY;

        return {
            'x': pos.left + poX,
            'y': pos.top + poY
        };
    };

    this.scrollProcessor = function() {
        if(!this.cachedLazyObjects.length) return;

        var me = this,
           top = this.inputEventCache.lastKnownScrollY,
             y = this.inputEventCache.lastKnownHeight,
         qShow = [],
         qHide = [],
         retry = false;

        if(this.deviceBandwidth) {

            for(var i = 0, len = me.cachedLazyObjects.length; i < len; i += 1) {
                var image = me.cachedLazyObjects[i];

                if(image === undefined) {
                    delete me.cachedLazyObjects[i];
                    continue;
                }

                if(image.getAttribute('data-uximage-state') !== "ready") {
                    /*
                    if(window.logCounter === void 0) {
                        window.logCounter = 0;
                    }

                    if(window.logCounter < 50) {
                        window.logCounter++;
                        console.log(image);
                    }
                    */
                    retry = true;
                    continue;
                }

                var imagePosition = me.getElementOffsets(image);

                if(((top + y) >= imagePosition.y - me.lazyLoadDistance) &&
                   ((top) <= (imagePosition.y + image.offsetHeight + me.lazyLoadDistance))) {
                    if(!image.getAttribute("data-loaded")) {
                        qShow.push(image);
                    }
                } else {
                    if(image.getAttribute("data-loaded")) {
                        qHide.push(image);
                    }
                }
            }

            for(i = 0, len = qShow.length; i< len; i += 1) {
                me.transformSource(qShow[i], function() {
                    qShow[i].setAttribute("data-loaded", "true");
                });
            }

            for(i = 0, len = qHide.length; i< len; i += 1) {
                qHide[i].style.backgroundImage = '';
                qHide[i].removeAttribute("data-loaded");
            }

        }

        if(retry || !this.deviceBandwidth) {
            if(this.viewportScrollTimer) {
                clearTimeout(this.viewportScrollTimer);
            }

            this.viewportScrollTimer = setTimeout(function() {
                me.scrollProcessor();
            }, 1000 / 60);
        }

    };

    this.breakpointApply = function(image, force) {
        if(!force && image.getAttribute('data-uximage-state') !== "ready")
            return;

        var me = this,
            pos = image.getBoundingClientRect(),
            high = parseInt(image.getAttribute('data-breakpoint-high'), 10) || null,
            low = parseInt(image.getAttribute('data-breakpoint'), 10) || null;

        if(high || low) {
            if(high && pos.width >= high && this.deviceBandwidth == "high") {
                me.setSource(image, image.getAttribute('data-src-high'));

            } else if(low && pos.width <= low || this.deviceBandwidth == "low") {
                me.setSource(image, image.getAttribute('data-src'));

            } else {
                if(image.getAttribute('data-src-medium')) {
                    me.setSource(image, image.getAttribute('data-src-medium'));
                } else {
                    me.setSource(image, image.getAttribute('data-src'));
                }
            }

            return true;
        }

        return false;
    };

    this.breakpointProcessor = function() {
        if(!this.deviceBandwidth) return;

        var me = this,
            len = me.cachedBreakpointObjects.length;

        if(this.inputEventCache.viewportResizeTimer) {
            clearTimeout(this.inputEventCache.viewportResizeTimer);
            this.inputEventCache.viewportResizeTimer = null;
        }

        if(len) {
            this.inputEventCache.viewportResizeTimer = setTimeout(function() {
                for(var i = 0; i < len; i += 1) {
                    me.transformSource(me.cachedBreakpointObjects[i]);
                }
            }, 1000 / 30);
        }
    };

    this.acceptSourceChange = function(element, src) {
        var curr = element.style.backgroundImage;

        if(!curr.length && src.length) {
            return true;
        }

        if(curr == src || curr == "url(" + src + ")" || curr == "url(\"" + src + "\")" || curr.substring(curr.length - src.length - 1) == src + ")") {
            return false;
        }

        return true;
    };

    this.setSource = function(element, src) {
        if(this.clientWebPSupport && element.getAttribute("data-use-webp") && src.substring(src.lastIndexOf('.') + 1) !== 'webp')
            src = src.substring(0, src.lastIndexOf('.') + 1) + 'webp';

        if(this.acceptSourceChange(element, src)) {
            //console.log(src);
            element.style.backgroundImage = "url(" + src + ")";
        }
    };

    this.transformSource = function(element, callback) {
        callback = callback || function() {};

        if(! this.breakpointApply(element)) {

            var sources = {
                'low': element.getAttribute("data-src"),
                'medium': element.getAttribute("data-src-medium"),
                'high': element.getAttribute("data-src-high")
                };

            if(this.deviceBandwidth == "low" && sources.low) {
                this.setSource(element, sources.high);
            } else if(this.deviceBandwidth == "high" && sources.high) {
                this.setSource(element, sources.high);
            } else if(sources.medium) {
                this.setSource(element, sources.medium);
            } else if(sources.low) {
                this.setSource(element, sources.low);
            }

        }

        callback();
    };

    this.Transform = function(element, callback) {
        if(!callback) callback = function() {};
        if(!this.deviceBandwidth) return;
        if(typeof element != "object" || element.tagName != "DIV") return;
        if(element.getAttribute("data-uximage-state") === "ready") return;

        var me = this;

        var sources = {
            'low': element.getAttribute("data-src"),
            'medium': element.getAttribute("data-src-medium"),
            'high': element.getAttribute("data-src-high")
            };

        var dimensions = {
            'height': element.getAttribute("height") || parseInt(element.style.height, 10) || null,
            'width': element.getAttribute("width") || parseInt(element.style.width, 10) || null
            };

        if(!dimensions.width || !dimensions.height) {

            var testImage = document.createElement('img');
            document.body.appendChild(testImage);
            testImage.style.display = "block";
            testImage.style.visibility = "hidden";

            var testSource = sources.low;
            if(!testSource) testSource = sources.medium;
            if(!testSource) testSource = sources.high;

            testImage.onload = function() {
                element.setAttribute('width', this.offsetWidth);
                element.setAttribute('height', this.offsetHeight);
                this.parentNode.removeChild(this);

                me.Transform(element, callback);
            };

            testImage.onerror = function() {
                //console.log("Error loading image element. Removing from DOM.");
                //console.log(element);

                element.parentNode.removeChild(element); // Remove invalid uximage element.
                this.parentNode.removeChild(this); // Remove test element.
            }

            testImage.src = testSource;

        } else {

            var ratio = (dimensions.height / dimensions.width) * 100;
            element.style.width = "";
            element.style.height = "";
            element.style.paddingBottom = ratio + "%";

            element.removeAttribute("width");
            element.removeAttribute("height");

            if(this.deviceBandwidth == "low" && sources.low) {
                if(element.getAttribute("data-uximage-state") !== "ondemand") {
                    this.transformSource(element);
                }

            } else {
                if(element.getAttribute('data-breakpoint-high') || element.getAttribute('data-breakpoint')) {
                    this.cachedBreakpointObjects.push(element);

                    if(element.getAttribute("data-uximage-state") !== "ondemand") {
                        this.breakpointApply(element, true);
                    }
                }else {
                    if(element.getAttribute("data-uximage-state") !== "ondemand") {
                        this.transformSource(element);
                    }
                }

            }

            element.setAttribute("data-uximage-state", "ready");

            callback();

        }

    };

    this.Loop = function(eventType) {
        eventType = eventType || "scroll";

        if(eventType == "resize") {
            this.breakpointProcessor();
        } else {
            this.scrollProcessor();
        }

        this.inputEventCache.inputTicking = false;
    };

    this.getBrowserState = function(stateType) {
        stateType = stateType || "scroll";

        switch (stateType) {
            case "resize":
                this.inputEventCache.lastKnownHeight = (window.innerHeight !== undefined) ? window.innerHeight : (document.documentElement || document.body).clientHeight;
                this.inputEventCache.lastKnownWidth = (window.innerWidth !== undefined) ? window.innerWidth : (document.documentElement || document.body).clientWidth;
                break;
            default:
                this.inputEventCache.lastKnownScrollX = (window.pageXOffset !== undefined) ? window.pageXOffset : (document.documentElement || document.body.parentNode || document.body).scrollLeft;
                this.inputEventCache.lastKnownScrollY = (window.pageYOffset !== undefined) ? window.pageYOffset : (document.documentElement || document.body.parentNode || document.body).scrollTop;
                break;
        }

        return true;
    }

    this.onInputEvent = function(eventType) {
        eventType = eventType || "scroll";

        if(!this.inputEventCache.inputTicking) {
            this.inputEventCache.inputTicking = true;

            if(eventType == "resize") {
                this.getBrowserState("resize");
            }

            this.getBrowserState("scroll");

            this.requestAnimationFrame( this.Loop(eventType) );
        }
    };

    this.Setup = function() {

        if(this.ready)
            return;
        else
            this.ready = true;

        var head = document.getElementsByTagName("head")[0],
            css  = document.createElement('style'),
            me   = this;

        css.innerHTML = ['.ux-image {',
                        'display: block;',
                        'max-width: 100%;',
                        'height: auto !important;',
                        'position: relative;',

                        'background: transparent url(data:image/gif;base64,R0lGODlhAQABAIAAAMz/AAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==) no-repeat center;',

                        '-webkit-perspective: 1000;',
                        '-moz-perspective: 1000;',
                        '-ms-perspective: 1000;',
                        '-o-perspective: 1000;',
                        'perspective: 1000;',

                        '-webkit-backface-visibility: hidden;',
                        '-moz-backface-visibility: hidden;',
                        '-ms-backface-visibility: hidden;',
                        '-o-backface-visibility: hidden;',
                        'backface-visibility: hidden;',

                        '-webkit-background-size: cover;',
                        '-moz-background-size: cover;',
                        '-ms-background-size: cover;',
                        '-o-background-size: cover;',
                        'background-size: cover;',

                        '-webkit-transform: translateZ(0);',
                        '-moz-transform: translateZ(0);',
                        '-ms-transform: translateZ(0);',
                        '-o-transform: translateZ(0);',
                        'transform: translateZ(0);',
                        '}'].join(' ');

        head.appendChild(css);

        this.getBrowserState("resize");
        this.getBrowserState("scroll");

        // Detect when lazy loaded images enter or leave our viewport range.
        document.addEventListener('scroll', function() {
            me.onInputEvent('scroll');
        }, false);

        // Detect new breakpoints.
        window.addEventListener('resize', function() {
            me.onInputEvent('resize');
        }, false);
    };

    this.requestAnimationFrame = function(callback) {
        return window.requestAnimationFrame ||
               window.webkitRequestAnimationFrame ||
               window.mozRequestAnimationFrame ||
               window.oRequestAnimationFrame ||
               window.msRequestAnimationFrame ||
               function(callback) {
                   window.setTimeout(callback, 16); // ~60FPS ideally.
               };
    };

    if(window !== void 0 && window.uxImageGlobal !== void 0) {
        return window.uxImageGlobal;
    } else {
        if(document.readyState === "complete" || document.readyState === "interactive") {
            this.Setup();
        } else if(window !== void 0) {
            var me = this;
            window.addEventListener("onload", function () { me.Setup(); }, false);
            document.addEventListener("DOMContentLoaded", function () { me.Setup(); }, false);
        }

        window.uxImageGlobal = this;
        return window.uxImageGlobal;
    }

}

/* ADM/RequireJS wrapper. */
if(typeof define == 'function') {
    define('uxImage', function() {
        return new uxImage();
    });
}
