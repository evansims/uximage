**uxImage is yet another JavaScript library for doing wicked awesome responsive image stuff.** It handles fun things like:

* Responsive image scaling based on the dimensions of a parent container.
* Automatic swapping of larger or smaller images based on predefined breakpoints.
* Lazily loading images when the user needs to see them, and unloading them when they don't (to conserve memory.)
* Automatically using alternative WebP copies of images when the browser supports it (to save on bandwidth.)
* Figuring out whether the visitor is on a slow connection (and optionally showing smaller or more heavily compressed images.)

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
+ **width** / **height** - Optional, but highly recommended. Used in responsive scaling calculations. If not provided, uxImage will first load the smallest version of the image available into memory to determine these values. This means a potentially unnecessary network call and rendering delay you should try to avoid. (These can be assigned via CSS rules, alternatively.)

The ```ux-image``` class defines this DIV as a uxImage element. Duh.

The ```ondemand``` class tells the library to treat this as a "lazy loading" image. These images aren't loaded until the browser scrolls near the image to reduce bandwidth usage and memory consumption. After the browser scrolls a fair distance past the image, it is unloaded to (again) save on memory and page rendering performance. This is awesome for mobile devices, but all users can benefit from the technique.

**Important** - You'll want to make sure your HTTP server is assigning appropriate caching headers to your assets. Lazy loading can involve a lot of images being loaded in and out of memory, so you want to be sure that visitors are only hitting your servers once for those files. That's on you, cowboy.

## What makes this different?

Other libraries only consider the device __screen resolution__ for their breakpoints. _"Small screen? Show this. Large? Show that."_ They're just emulating CSS media queries.

uxImage is truly responsive in that it's breakpoint system is based upon the width of the parent container. As your responsive layout grows and shrinks and changes, for whatever the reason might be, uxImage can dynamically change the images it's displaying to take advantage of the available space, and reduce memory usage intelligently.

## Requirements

+ There are **no library dependencies**.
+ **A browser with JavaScript support.** If you're concerned about supporting users without support you might considering providing traditional images inside ```<noscript>``` tags. Browsers won't load those images unless they have support disabled.

## Using It

1. Include the uxImage script in your page.
2. Add a uxImage element to your HTML.
3. Create a new instance of the uxImage library. ```var demo = new uxImage();```
4. Run a quick speed test. ```demo.speedTest();``` (It's optional, but it's a good idea.)
5. Finally, parse your DOM. ```demo.Parse();```
6. Profit?

## Questions and Best Practices

### Where's the Retina/HiDPI support?
@1x is dead. 92.8% of all mobile screens are @1.5x or higher. This library follows a strategy put forth by [Thomas Fuch's "Retinafy" book](http://retinafy.me/) Simply: You should treat all displays as if they are HiDPI, because most will be. Serve up images at roughly twice the resolution you intend them to be viewed at, but apply high levels of compression to those images. Browsers automatically resample and anti-alias images as they're scaled and compression artifacts disappear in the process. The **images will look just as good** as uncompressed copies and **you'll shave 50% or more off your downloaded file sizes**. That's a lot of bandwidth savings, and a huge win for users -- especially those on mobile. All of the demos provided use this approach so you can try it for yourself.

+ I've had good results exporting JPGs at ~30% quality and WebPs at ~60%, but you'll want to experiment for yourself.
+ With Webkit now leading browser usage, it's worth considering offering WebP versions of your images. The bandwidth savings is tremendous.
+ Use Progressive JPEGs. They add a little extra to the file size but will render faster. They're also exempt Mobile WebKit's [image size restrictions](http://duncandavidson.com/blog/2012/03/webkit_retina_bug/).
+ 512, 1024, 2048 and 3072 are a good device-agnostic baseline for image resolutions[[1]](http://blog.cloudfour.com/how-do-you-pick-responsive-images-breakpoints/comment-page-1/#comment-14803) but you'll want to use what makes sense for your situation.

### What about dynamically inserted uxImages?
You can pass a DOM element to the uxImage.Parse() function to only parse for uxImages within that container. After writing your markup to the DOM, just fire that off.

### Using with frameworks like jQuery
uxImage is designed to be framework agnostic, but will fit in just fine with whatever tools you're most comfortable using. For example:

```js
$("article .photo-container").each(function() {
    uxImage.Parse($(this)[0]);
}));
```

###  Asynchronous Module Definition (AMD)
uxImage uses a shim to support modularization APIs, and should work with any library that supports the format. It's known to work with [RequireJS](http://requirejs.org) and [Almond](https://github.com/jrburke/almond).

You can safely merge it using tools like [r.js](http://requirejs.org/docs/optimization.html) or [Grunt](http://gruntjs.com/).

### I'd like to see feature X
My goal is to keep uxImage as lightweight and agile as possible, but I am open to ideas. Open a GitHub issue and we'll talk it out.

### Sites Using uxImage

+ [Crowdmap](https://crowdmap.com)
+ [evansims.com](http://evansims.com)

Let me know if you're using it and I'll add you to the list.
