uxImage is yet another method of doing wicked awesome responsive image stuff. It's a standalone JavaScript library that handles fun things like:

* Responsive image scaling based on the dimensions of the parent container.
* Dynamically swapping out larger or smaller images based on predefined breakpoints.
* Swapping out images for Retina/HiDPI displays.
* Lazily loading images when the user needs to see them, and unloading them when they don't (to conserve memory.)
* Automatically using alternative WebP copies of images when the browser supports it (to save on bandwidth.)
* Figuring out whether the visitor is on a slow connection (and showing smaller or heavily compressed images instead.)

The library is intended to be as lightweight as possible and avoids imposing dependencies. You should be able to run it alongside any other frameworks or libraries without conflicts. However, as with other techniques out there, it requires you to adapt your markup.

Here's a barebones example:

```html
<div class="ux-image" data-src="test-small.jpg" width="960" height="540">Accessible text.</div>
```

Not that different from what you're doing now, right? Now let's go wild:

```html
<div class="ux-image ondemand"
     data-src="test-small.jpg"
     data-src-medium="test-medium.jpg"
     data-src-high="test-high.jpg"
     data-breakpoint="480"
     data-breakpoint-high="960"
     width="960" height="540">Accessible text.</div>
```

The above is an example of a uxImage element. It's a DIV with some HTML5 data attributes assigned that help customize the rendering behavior. You can put whatever you'd like inside it - accessibility text, noscript fallbacks, etc.

+ **data-src** - The smallest version of the image, preferably compressed and suitable over ~3G cellular networks.
+ **data-src-medium** - The standard version of the image, suitable for desktop or tablets.
+ **data-src-high** - The largest version of the image you want to deliver, intended for hidpi or high resolution devices.
+ **data-use-webp** - If this attribute is set, uxImage will replace the file extension of the above attributes with .webp on devices that support the file format.
+ **data-breakpoint** - If the container element is resized larger than this value, swap to the medium version of this image. Below? Swap to the small/mobile version.
+ **data-breakpoint-high** - Beyond this value and swap to the high resolution version of the image.
+ **width** / **height** - Optional, but highly recommended. Used in responsive scaling calculations. If not provided, uxImage will first load the smallest version of the image available into memory to determine these values. This means a potentially unnecessary, extra network call you should avoid if at all possible.

The ```ux-image``` class defines this DIV as a uxImage element. The ```ondemand``` class informs uxImage to treat this as a "lazy" image; i.e. don't load it until the user can view the image within their browser's window bounds.

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

### Retina Support
This library follows the strategy put forth by [Thomas Fuch's "Retinafy" book](http://retinafy.me/). Instead of loading 2X image assets specifically for retina displays, the intended use for uxImage is to load double (or even higher) resolution versions of image assets, and simply applying high levels of compression. Images are automatically downscaled and antialiased by browsers at a fraction of the bandwidth cost.

In my tests, 30% JPG quality of 60% WebP quality looked equally good on normal or retina displays at double resolution. This technique usually results in 50% file size savings, often times much more, and you get improved picture quality across all devices, not just HiDPI.

### Lazy Loading
This library automatically unload lazy loaded images after the viewport is scrolled past a threshold. This is done to conserve memory on mobile devices and provide better page performance on sites that implemented "infinite scrolling" techniques.
