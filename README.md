uxImage is yet another method of doing cool responsive image stuff. It's a standalone JavaScript library that handles fun stuff like:

* Responsive image scaling
* Retina/HiDPI asset swapping (see the Strategy section for tips on this)
* Dynamic asset swapping triggered by viewport resizing
* "Lazy"/on-demand asset loading
* Automatically use WebP versions of image assets when the browser supports it.
* Bandwidth detection to limit image assets on slow network connections

The library is intended to be as lightweight as possible and avoids imposing dependencies. However, as with other techniques out there, it requires you to adapt your markup.

```<div class="ux-image ondemand" data-src="test-small.jpg" data-src-medium="test-medium.jpg" data-src-high="test-high.jpg" data-breakpoint="480" data-breakpoint-high="960" width="960" height="540">Accessible text.</div>```

The above is an example of a uxImage element. It's a DIV with some HTML5 data attributes assigned that help customize the rendering behavior. You can put whatever you'd like inside it - accessibility text, noscript fallbacks, etc.

	**data-src** - The smallest version of the image assets, preferrably compressed and suitable over ~3G cellular networks.
	**data-src-medium** - The standard version of the image assets, suitable for desktop or tablets.
	**data-src-high** - The largest version of the image you want to deliver, intended for hidpi or high resolution devices.

	**data-use-webp** - If this attribute is set, uxImage will replace the file extension of the above attributes with .webp on devices that support the file format.

	**data-breakpoint** - If the container element is resized larger than this value, swap to the medium version of this image. Below? Swap to the small/mobile version.
	**data-breakpoint-high** - Beyond this value and swap to the high resoution version of the image.

	**width** / **height** - Optional, but highly recommended. Used in responsive scaling calculations. If not provided, uxImage will first load the smallest version of the image available into memory to determine these values. This means a potentially unnecessary, extra network call you should avoid if at all possible.

The ```ux-image``` class defines this DIV as a uxImage element. The ```ondemand``` class informs uxImage to treat this as a "lazy" image; i.e. don't load it until the user can vew the image within their browser's window bounds.

## Requirements

None. Boosh.

## Using It

1. Include the JS file. Derp.
2. Insert a uxImage element into your HTML. See above.
3. Create a new instance of uxImage. ```var demo = new uxImage();```
4. I suggest initiating a speedTest() as a first step. ```demo.speedTest();``` It's optional, but it's a good idea.
5. Finally, parse your DOM. ```demo.Parse();```
6. Profit?

## Strategy

This library follows the strategy put forth by [Thomas Fuch's "Retinafy" book](http://retinafy.me/). Instead of loading 2X image assets specifically for retina displays, the intended use for uxImage is to load double (or even higher) resolution versions of image assets, and simply applying high levels of compresion. Images are automatically downscaled and antialiased by browsers at a fraction of the bandwidth cost.

In my tests, 30% JPG quality of 60% WebP quality looked equally good on normal or retina displays at double resolution. This technique usually results in 50% file size savings, often times much more, and you get improved picture quality across all devices, not just HiDPI.
