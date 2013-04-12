
/*!
 * uxImage 2013.04.08
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

	this.ready = false;
	this.speedTestUri = 'http://farm9.staticflickr.com/8519/8629755757_117cdebd73_o.jpg';
	this.deviceRetina = 1;
	this.deviceBandwidth = null;
	this.clientWebPSupport = null;

	this.cachedBreakpointObjects = [];
	this.cachedLazyObjects = [];
	this.throttleProcessor = {};

	this.speedTest = function(callback) {
		if(!callback) callback = function() {}

		var me = this;
		this.checkWebP(function() {
			var testImage = new Image(); //document.createElement('img');
			var testStart = null;

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
		});
	}

	this.speedTestComplete = function(result, callback) {
		if(!this.deviceBandwidth) {
			this.deviceBandwidth = result;
			callback();
		}
	}

	this.checkWebP = function(callback) {
		if(!callback) callback = function() {};

		if(this.clientWebPSupport != null) {
			callback();
			return;
		}

		var webP = new Image();
		var me = this;

    	webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    	webP.onload = webP.onerror = function () {
    		if(webP.height === 2 && webP.width === 2) {
    			me.clientWebPSupport = true;
    		} else {
    			me.clientWebPSupport = false;
    		}

    		callback();
    	};
	}

	this.Parse = function(container) {

		if(!container)
			container = document.getElementsByTagName("body");

		if(container.length) {
			for(var i = 0; i < container.length; i += 1) {
				this.Parse(container[i]);
			}
		} else {
			images = container.getElementsByClassName("ux-image");
			for(var i = 0; i < images.length; i += 1) {
				this.Analyze(images[i]);
			}
		}

		this.scrollProcessor();
		this.breakpointProcessor();

	}

	this.Analyze = function(element) {
		var classes = [];
		var ondemand = false;

		if(typeof element.classList != "undefined") {
			classes = element.classList;
		} else {
			classes = element.className.split(' ');
		}

		if(typeof classes.indexOf != "undefined") {
			if(classes.indexOf('ondemand') != -1) {
				ondemand = true;
			}
		} else {
			for(var i = 0; i < classes.length; i++) {
				if(classes[i] === 'ondemand') {
					ondemand = true;
					break;
				}
			}
		}

		if(ondemand) {
			element.setAttribute('data-ondemand-state', 'fresh');
			this.cachedLazyObjects.push(element);
		} else {
			this.Transform(element);
		}
	}

	this.scrollProcessor = function() {
		if(!this.cachedLazyObjects.length) return;
		if(!this.deviceBandwidth) return;

		 var me = this;
		var doc = document.documentElement, body = document.body;
		var top = (doc && doc.scrollTop || body && body.scrollTop || 0);
		  var y = (window.innerHeight || e.clientHeight || g.clientHeight || 0);

		for(var i = 0; i < this.cachedLazyObjects.length; i += 1) {
			if((top + y) >= (this.cachedLazyObjects[i].offsetTop - 10)) {
				this.Transform(this.cachedLazyObjects[i], function() {
					me.cachedLazyObjects.splice(i, 1);
				});
			}
		}

		this.breakpointProcessor();
	}

	this.breakpointProcessor = function() {
		if(this.throttleProcessor) clearTimeout(this.throttleProcessor);
		if(!this.deviceBandwidth) { this.breakpointProcessor(); }

		var me = this;
		this.throttleProcessor = setTimeout(function () {
			for(var i = 0; i < me.cachedBreakpointObjects.length; i += 1) {
				if(me.cachedBreakpointObjects[i].getAttribute('data-breakpoint-high') || me.cachedBreakpointObjects[i].getAttribute('data-breakpoint')) {
					if(me.cachedBreakpointObjects[i].offsetWidth >= parseInt(me.cachedBreakpointObjects[i].getAttribute('data-breakpoint-high'))) {
						if(!me.compareSource(me.cachedBreakpointObjects[i], me.cachedBreakpointObjects[i].getAttribute('data-src-high')))
							me.setSource(me.cachedBreakpointObjects[i], me.cachedBreakpointObjects[i].getAttribute('data-src-high'));

					} else if(me.cachedBreakpointObjects[i].offsetWidth >= parseInt(me.cachedBreakpointObjects[i].getAttribute('data-breakpoint'))) {
						if(!me.compareSource(me.cachedBreakpointObjects[i], me.cachedBreakpointObjects[i].getAttribute('data-src-medium')))
							me.setSource(me.cachedBreakpointObjects[i], me.cachedBreakpointObjects[i].getAttribute('data-src-medium'));

					} else if(me.cachedBreakpointObjects[i].offsetWidth < parseInt(me.cachedBreakpointObjects[i].getAttribute('data-breakpoint'))) {
						if(!me.compareSource(me.cachedBreakpointObjects[i], me.cachedBreakpointObjects[i].getAttribute('data-src')))
							me.setSource(me.cachedBreakpointObjects[i], me.cachedBreakpointObjects[i].getAttribute('data-src'));

					}
				}
			}
		}, 150);
	}

	this.compareSource = function(element, src) {
		if(element.getAttribute("data-use-webp") && this.clientWebPSupport)
			src = src.substring(0, src.lastIndexOf('.') + 1) + 'webp';

		if(element.style.backgroundImage.substring(element.style.backgroundImage.lastIndexOf('/') + 1) == src + ")")
			return true;
		else
			return false;
	}

	this.setSource = function(element, src) {
		if(element.getAttribute("data-use-webp") && this.clientWebPSupport)
			src = src.substring(0, src.lastIndexOf('.') + 1) + 'webp';

		element.style.backgroundImage = "url(" + src + ")";
	}

	this.Transform = function(element, callback) {
		if(!callback) callback = function() {}
		if(!this.deviceBandwidth) return;
		if(typeof element != "object" || element.tagName != "DIV") return;

		var me = this;

		var sources = {
			'low': element.getAttribute("data-src"),
			'medium': element.getAttribute("data-src-medium"),
			'high': element.getAttribute("data-src-high")
			};

		var dimensions = {
			'height': element.getAttribute("height"),
			'width': element.getAttribute("width")
			}

		if(!dimensions.width || !dimensions.height) {

			var testImage = document.createElement('img');
			document.getElementsByTagName("body")[0].appendChild(testImage);
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

			testImage.src = testSource;

		} else {

			var ratio = (dimensions.height / dimensions.width) * 100;
			element.style.paddingBottom = ratio + "%";

			if(this.deviceBandwidth == "low" && sources.low) {
				this.setSource(element, sources.low);

			} else {
				if(element.getAttribute('data-breakpoint-high') || element.getAttribute('data-breakpoint')) {
					this.cachedBreakpointObjects.push(element);
				}else {
					if(sources.medium) {
						this.setSource(element, sources.medium);
					} else if(sources.low) {
						this.setSource(element, sources.low);
					}
				}

			}

			callback();

		}

	}

	this.Setup = function() {
		if(this.ready)
			return
		else
			this.ready = true;

		this.deviceRetina = (('devicePixelRatio' in window && devicePixelRatio > 1) || ('matchMedia' in window && !matchMedia("(-moz-device-pixel-ratio:1.0)").matches));

		var head = document.getElementsByTagName("head")[0];
		var css = document.createElement('style');
		    css.innerHTML = '.ux-image {' +
		                    'max-width: 100%;' +
		                    'height: auto !important;' +
		                    'position: relative;' +
		                    'text-indent: -9999px;' +
		                    'background: transparent url(data:image/gif;base64,R0lGODlhAQABAIAAAMz/AAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==) no-repeat center;' +
		                    '-moz-background-size: cover;' +
		                    '-webkit-background-size: cover;' +
		                    'background-size: cover;' +
                            'image-rendering: optimizeQuality;' +
		                    'color: #fff;' +
		                    '}';
		head.appendChild(css);

		var me = this;
		document.addEventListener('scroll', function() {
			me.scrollProcessor();
		}, false);
		window.addEventListener('resize', function() {
			me.breakpointProcessor();
			me.scrollProcessor();
		}, false);
	}

	var me = this;

	if(document.readyState === "complete") {
		me.Setup();
	} else {
		window.addEventListener("onload", function () { me.Setup(); }, false);
		document.addEventListener("DOMContentLoaded", function () { me.Setup(); }, false);
	}

	return this;

}
