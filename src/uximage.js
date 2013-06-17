
/*!
 * uxImage 2013.05.18
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
	this.speedTestUri = '//farm9.staticflickr.com/8519/8629755757_117cdebd73_o.jpg';
	this.deviceRetina = 1;
	this.deviceBandwidth = null;
	this.clientWebPSupport = null;

	// How far above or below the image element should the viewport be scrolled before
	// the asset is unloaded. Defaults to 500px.
	this.lazyLoadDistance = 500;

	this.cachedBreakpointObjects = [];
	this.cachedLazyObjects = [];
	this.throttleProcessor = {};

	this.eventOccured = { viewportScrolled: false, viewportResized: false };

	this.speedTest = function(callback) {
		if(!callback) callback = function() {}

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
	}

	this.Parse = function(container) {

		if(!container)
			container = document.body;

		if(container.length) {
			for(var i = 0, len = container.length; i < len; i += 1) {
				this.Parse(container[i]);
			}
		} else {
			images = container.getElementsByClassName("ux-image");
			for(var i = 0, len = images.length; i < len; i += 1) {
				this.Analyze(images[i]);
			}
		}

	}

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
			element.setAttribute('data-ondemand-state', 'pre');
			this.cachedLazyObjects.push(element);
		} else {
			element.setAttribute('data-loaded', 'true');
		}

		this.Transform(element);
	}

	this.getElementOffsets = function(obj) {
		var posX = obj.offsetLeft;
		var posY = obj.offsetTop;

		while(obj.offsetParent) {
			if(obj == document.getElementsByTagName('body')[0]) {
				break;
			} else {
				posX = posX+obj.offsetParent.offsetLeft;
				posY = posY+obj.offsetParent.offsetTop;
				obj  = obj.offsetParent;
			}
		}

		return {'x': posX, 'y': posY};
	}

	this.scrollProcessor = function() {
		if(!this.cachedLazyObjects.length) return;
		if(!this.deviceBandwidth) return;

		var me = this;

		if(me.throttleProcessor.scroll) clearTimeout(me.throttleProcessor.scroll);

		me.throttleProcessor.scroll = setTimeout(function () {
			var doc = document.documentElement,
			   body = document.body,
			    top = (doc && doc.scrollTop || body && body.scrollTop || 0),
			      y = (window.innerHeight || e.clientHeight || g.clientHeight || 0);

			for(var i = 0, len = me.cachedLazyObjects.length; i < len; i += 1) {
				var image = me.cachedLazyObjects[i];

				if(image.getAttribute('data-ondemand-state') !== "ready")
					continue;

				imagePosition = me.getElementOffsets(image);

				if(((top + y) >= imagePosition.y - me.lazyLoadDistance) &&
				   ((top) <= (imagePosition.y + image.offsetHeight + me.lazyLoadDistance))) {
				   	if( ! image.getAttribute('data-loaded')) {
				   		image.setAttribute('data-loaded', 'true');
						me.Transform(image);
					}
				} else {
					if(image.getAttribute('data-loaded')) {
						image.style.backgroundImage = '';
						image.removeAttribute('data-loaded');
					}
				}
			}
		}, 20);
	}

	this.breakpointApply = function(image) {
		if( ! image.getAttribute('data-loaded'))
			return;

		var me = this;

		if(image.getAttribute('data-breakpoint-high') || image.getAttribute('data-breakpoint')) {
			if(image.offsetWidth >= parseInt(image.getAttribute('data-breakpoint-high'))) {
				me.setSource(image, image.getAttribute('data-src-high'));

			} else if(image.offsetWidth >= parseInt(image.getAttribute('data-breakpoint'))) {
				me.setSource(image, image.getAttribute('data-src-medium'));

			} else if(image.offsetWidth < parseInt(image.getAttribute('data-breakpoint'))) {
				me.setSource(image, image.getAttribute('data-src'));

			}
		}
	}

	this.breakpointProcessor = function() {
		if(this.throttleProcessor.resize) clearTimeout(this.throttleProcessor.resize);
		if(!this.deviceBandwidth) { this.breakpointProcessor(); }

		var me = this;
		this.throttleProcessor.resize = setTimeout(function () {
			for(var i = 0, len = me.cachedBreakpointObjects.length; i < len; i += 1) {
				me.breakpointApply(me.cachedBreakpointObjects[i]);
			}
		}, 150);
	}

	this.acceptSourceChange = function(element, src) {
		var curr = element.style.backgroundImage;

		if(!curr.length && src.length)
			return true;

		if(new RegExp("/(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)? (\/|\/([\w#!:.?+=&%@!\-\/]))?/").test(src)) {
			if(curr == "url(" + src + ")")
				return false;
			else
				return true;
		} else {
			if(curr.substring(curr.length - src.length - 1) == src + ")")
				return false;
			else
				return true;
		}
	}

	this.setSource = function(element, src) {
		if(this.clientWebPSupport && element.getAttribute("data-use-webp") && src.substring(src.lastIndexOf('.') + 1) !== 'webp')
			src = src.substring(0, src.lastIndexOf('.') + 1) + 'webp';

		if(this.acceptSourceChange(element, src))
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

			testImage.src = testSource;

		} else {

			var ratio = (dimensions.height / dimensions.width) * 100;
			element.style.paddingBottom = ratio + "%";

			if(element.getAttribute('data-ondemand-state') == 'pre') {
				element.setAttribute('data-ondemand-state', 'ready');

			} else {
				if(this.deviceBandwidth == "low" && sources.low) {
					this.setSource(element, sources.low);

				} else {
					if(element.getAttribute('data-breakpoint-high') || element.getAttribute('data-breakpoint')) {
						this.cachedBreakpointObjects.push(element);
						this.breakpointApply(element);
					}else {
						if(this.deviceBandwidth == "high" && sources.high) {
							this.setSource(element, sources.high);
						} else if(sources.medium) {
							this.setSource(element, sources.medium);
						} else if(sources.low) {
							this.setSource(element, sources.low);
						}
					}

				}
			}

			this.viewportScrolled = true;
			this.viewportResized = true;

			callback();

		}

	}

	this.getPixelDensity = function() {
		if(typeof window.devicePixelRatio !== undefined) // WebKit
			this.deviceRetina = (window.devicePixelRatio > 1);
		else if(typeof window.matchMedia !== undefined) // Gecko
			this.deviceRetina = !(window.matchMedia("(-moz-device-pixel-ratio:1.0)").matches);
	}

	this.Setup = function() {

		if(this.ready)
			return
		else
			this.ready = true;

		this.getPixelDensity();

		var head = document.getElementsByTagName("head")[0],
		    css  = document.createElement('style'),
		    me   = this;

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
						'}';

		head.appendChild(css);

		// Update pixel density every so often to detect when moving viewport between retina and non-retina displays.
		setInterval(function() {
			me.getPixelDensity();
		}, 5000);

		setInterval(function() {
			if(me.viewportScrolled) {
				me.viewportScrolled = false;
				me.scrollProcessor();
			}

			if(me.viewportResized) {
				me.viewportResized = false;
				me.breakpointProcessor();
				me.scrollProcessor();
			}

		}, 50);

		// Detect when lazy loaded images enter or leave our viewport range.
		document.addEventListener('scroll', function() {
			me.viewportScrolled = true;
		}, false);

		// Detect when new breakpoints are hit.
		window.addEventListener('resize', function() {
			me.viewportResized = true;
		}, false);
	}

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
