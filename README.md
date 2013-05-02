**uxImage is yet another JavaScript library for doing wicked awesome responsive image stuff.** It handles fun things like:

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

Not that different from what you're doing now, right? Now let's get wild:

```html
<div class="ux-image ondemand"
     data-src="test-small.jpg"
     data-src-medium="test-medium.jpg"
     data-src-high="test-high.jpg"
     data-breakpoint="480"
     data-breakpoint-high="960"
     width="960" height="540">Accessible text.</div>
```

Better call Kenny Loggins, because we just entered the danger zone. This is an advanced example of a uxImage. It's a DIV with some HTML5 data attributes assigned that help customize the rendering behavior. You can put whatever you'd like inside it - accessibility text, noscript fallbacks, overlays, whatever your heart desires.

+ **data-src** - The smallest version of the image, preferably compressed and ideal for ~3G cellular networks.
+ **data-src-medium** - The standard version of the image, suitable for desktop and tablets.
+ **data-src-high** - The largest version of the image you want to deliver, intended for hidpi and high resolution devices.
+ **data-use-webp** - If this attribute is set, uxImage will replace the file extension of the images (see above) with .webp. If the browser doesn't support WebP, it does nothing.
+ **data-breakpoint** - If the parent container is larger than this value, swap to the medium version of this image. Below it and swap to the small version.
+ **data-breakpoint-high** - Like above, except for swapping between the medium and high resolution version of the image.
+ **width** / **height** - Optional, but highly recommended. Used in responsive scaling calculations. If not provided, uxImage will first load the smallest version of the image available into memory to determine these values. This means a potentially unnecessary network call and rendering delay you should try to avoid.

The ```ux-image``` class defines this DIV as a uxImage element. Duh.

The ```ondemand``` class tells the library to treat this as a "lazy loading" image. These images aren't loaded until the visitor scrolls near the image to reduce bandwidth usage and memory consumption. After the visitor scrolls a fair distance past the image, it is unloaded to (again) save on memory and performance. This is awesome for mobile devices, but all users can benefit from the technique.

**Important** - You'll want to make sure your HTTP server is assigning appropriate caching headers to your assets. Lazy loading can involve a lot of images being loaded in and out of memory, so you want to be sure that visitors are only hitting your servers once for those files. That's on you, cowboy.

## Why uxImage?

I think it's pretty swell and does a few really useful tricks that other libraries don't.

## Requirements

None. Boosh.

## Using It

1. Include the JS file. Derp.
2. Add a uxImage element to your HTML. See above examples or the demos.
3. Create a new instance of the uxImage library. ```var demo = new uxImage();```
4. Run a quick speed test. ```demo.speedTest();``` (It's optional, but it's a good idea.)
5. Finally, parse your DOM. ```demo.Parse();```
6. Profit?

## Strategy

### Retina Support
This library follows the strategy put forth by [Thomas Fuch's "Retinafy" book](http://retinafy.me/). Basically, you should treat all displays as if they are HiDPI by default and serve up images at double the resolution you intend them to be viewed at on the page (just as you would with "@2X" CSS hacks.)

The trick is heavily compressing your images. Because your browser is automatically resampling these images as they're downscaled, compression artifacts disappear in the antialiasing. The images look just as good as uncompressed copies, but you'll shave 50% or more off the file sizes. That's a lot of bandwidth savings.

I recommend exporting your JPGs at 30% quality and WebPs at 60%. All of the demos provided use this approach so you can try it for yourself.

