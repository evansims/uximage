### @preserve
# UXImage 0.2.11
# http://github.com/evanisms/uximage/
#
# Copyright 2014 Evan Sims and other contributors
# Permission is hereby granted, free of charge, to any person obtaining a
# copy of this software and associated documentation files (the 'Software'),
# to deal in the Software without restriction, including without limitation
# the rights to use, copy, modify, merge, publish, distribute, sublicense,
# and/or sell copies of the Software, and to permit persons to whom the
# Software is furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included
# in all copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS
# OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
# THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
# FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
# DEALINGS IN THE SOFTWARE.
###

class window.UXImage

  'use strict'

  constructor: (options) ->
    # Load up default options.
    @options = {
      speedTestUri: '//farm9.staticflickr.com/8519/8629755757_117cdebd73_o.jpg'
      lazyLoadDistance: 500
    }

    @_ready = false
    @_deviceBandwidth = null
    @_clientWebPSupport = null
    @_cachedBreakpointObjects = []
    @_cachedLazyObjects = []
    @_inputEventCache = []
    @_inputEventCache = {
      inputTicking: false
      viewportScrollTimer: null
      viewportResizeTimer: null
      lastKnownScrollX: -1
      lastKnownScrollY: -1
      lastKnownHeight: -1
      lastKnownWidth: -1
    }

    if options
      len = options.length
      o = 0
      while o < len
        @options[options[o]] = options[o]

    if document.readyState is 'complete' or document.readyState is 'interactive'
      @Setup()
    else if window isnt undefined
      window.addEventListener 'onload', (=>
        @Setup()
        return
      ), false
      document.addEventListener 'DOMContentLoaded', (=>
        @Setup()
        return
      ), false

  speedTest: (callback) =>
    callback = callback or ->
      undefined

    @checkWebP =>
      try
        testImage = new Image()
        testStart = null
        testImage.onload = =>
          duration = ((new Date()).getTime() - testStart) / 1000
          duration = ((if duration > 1 then duration else 1))
          connectionKbps = ((50 * 1024 * 8) / duration) / 1024
          bandwidth = ((if connectionKbps >= 150 then 'high' else 'low'))
          @speedTestComplete bandwidth, callback
          return

        testImage.onerror = =>
          @speedTestComplete 'low', callback
          return

        testImage.onabort = =>
          @speedTestComplete 'low', callback
          return

        testStart = (new Date()).getTime()
        testImage.src = @options.speedTestUri + '?r=' + Math.random()
        setTimeout (=>
          @speedTestComplete 'low', callback
          return
        ), ((((50 * 8) / 150) * 1000) + 350)
      catch e
        @speedTestComplete 'low', callback
      return

    return

  speedTestComplete: (result, callback) =>
    callback = callback or ->
      undefined

    unless @_deviceBandwidth
      @_deviceBandwidth = result
      callback()
    return

  checkWebP: (callback) =>
    callback = callback or ->
      undefined

    if @_clientWebPSupport isnt null
      callback @_clientWebPSupport
      return

    webP = new Image()
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA'

    webP.onload = webP.onerror = =>
      if webP.height is 2 and webP.width is 2
        @_clientWebPSupport = true
      else
        @_clientWebPSupport = false
      callback @_clientWebPSupport
      return

    return

  Parse: (container) =>
    container = container or document.body
    i = 0
    len = container.length

    if len
      i = 0
      while i < len
        @Parse container[i]
        i += 1
    else
      images = container.getElementsByClassName('ux-image')
      len = images.length
      i = 0
      while i < len
        @Analyze images[i]
        i += 1
      @onInputEvent 'scroll'
    return

  Analyze: (element) =>
    return  unless element

    classes = []
    ondemand = false

    if element.classList is undefined
      classes = element.classList
    else
      classes = element.className.split(' ')
    if classes.indexOf is undefined
      ondemand = true  unless classes.indexOf('ondemand') is -1
    else
      i = 0
      len = classes.length

      while i < len
        if classes[i] is 'ondemand'
          ondemand = true
          break
        i++

    if ondemand # Flag this object
      element.setAttribute 'data-uximage-state', 'ondemand'
      @_cachedLazyObjects.push element

    @Transform element
    return

  getElementOffsets: (obj) =>
    return  unless obj

    pos = obj.getBoundingClientRect()
    poX = @_inputEventCache.lastKnownScrollX
    poY = @_inputEventCache.lastKnownScrollY

    {
      x: pos.left + poX
      y: pos.top + poY
    }

  scrollProcessor: =>
    return  unless @_cachedLazyObjects.length

    top = @_inputEventCache.lastKnownScrollY
    y = @_inputEventCache.lastKnownHeight
    qShow = []
    qHide = []
    retry = false

    if @_deviceBandwidth
      i = 0
      len = @_cachedLazyObjects.length

      while i < len
        image = @_cachedLazyObjects[i]
        if image is undefined
          delete @_cachedLazyObjects[i]

          continue
        if image.getAttribute('data-uximage-state') isnt 'ready'
          retry = true
          continue
        imagePosition = @getElementOffsets(image)
        if ((top + y) >= imagePosition.y - @options.lazyLoadDistance) and
        ((top) <= (imagePosition.y + image.offsetHeight + @options.lazyLoadDistance))
          qShow.push image  unless image.getAttribute('data-loaded')
        else
          qHide.push image  if image.getAttribute('data-loaded')
        i += 1

      transformSourceCallback = (element) ->
        element.setAttribute 'data-loaded', 'true'
        return

      i = 0
      len = qShow.length

      while i < len
        @transformSource qShow[i], transformSourceCallback(qShow[i])
        i += 1
      i = 0
      len = qHide.length

      while i < len
        qHide[i].style.backgroundImage = ''
        qHide[i].removeAttribute 'data-loaded'
        i += 1
    if retry or not @_deviceBandwidth
      clearTimeout @viewportScrollTimer  if @viewportScrollTimer
      @viewportScrollTimer = setTimeout(=>
        @scrollProcessor()
        return
      , 1000 / 60)
    return

  breakpointApply: (image, force) =>
    return false  unless image
    return false  if not force and image.getAttribute('data-uximage-state') isnt 'ready'

    pos = image.getBoundingClientRect()
    high = parseInt(image.getAttribute('data-breakpoint-high'), 10) or null
    low = parseInt(image.getAttribute('data-breakpoint'), 10) or null
    if high or low
      if high and pos.width >= high and @_deviceBandwidth is 'high'
        @setSource image, image.getAttribute('data-src-high')
      else if low and pos.width <= low or @_deviceBandwidth is 'low'
        @setSource image, image.getAttribute('data-src')
      else
        if image.getAttribute('data-src-medium')
          @setSource image, image.getAttribute('data-src-medium')
        else
          @setSource image, image.getAttribute('data-src')
      return true
    false

  breakpointProcessor: =>
    return  unless @_deviceBandwidth

    len = @_cachedBreakpointObjects.length
    if @_inputEventCache.viewportResizeTimer
      clearTimeout @_inputEventCache.viewportResizeTimer
      @_inputEventCache.viewportResizeTimer = null
    if len
      @_inputEventCache.viewportResizeTimer = setTimeout(=>
        i = 0

        while i < len
          @transformSource @_cachedBreakpointObjects[i]
          i += 1
        return
      , 1000 / 30)
    return

  acceptSourceChange: (element, src) ->
    curr = element.style.backgroundImage

    return true  unless curr
    return false  unless src.length
    return true  if not curr.length and src.length
    return false  if curr is src or curr is 'url(' + src + ')' or

    curr is 'url(\'' + src + '\')' or
    curr.substring(curr.length - src.length - 1) is src + ')'
    true

  setSource: (element, src) =>
    return false  unless element

    src = src.substring(0, src.lastIndexOf('.') + 1) + 'webp'  if src and
    @_clientWebPSupport and element.getAttribute('data-use-webp') and
    src.substring(src.lastIndexOf('.') + 1) isnt 'webp'

    if @acceptSourceChange(element, src)
      element.style.backgroundImage = 'url(' + src + ')'

    return

  transformSource: (element, callback) =>
    callback = callback or ->
      undefined

    unless @breakpointApply(element)
      sources = {
        low: element.getAttribute('data-src')
        medium: element.getAttribute('data-src-medium')
        high: element.getAttribute('data-src-high')
      }

      if @_deviceBandwidth is 'low' and sources.low
        @setSource element, sources.high
      else if @_deviceBandwidth is 'high' and sources.high
        @setSource element, sources.high
      else if sources.medium
        @setSource element, sources.medium
      else @setSource element, sources.low  if sources.low
    callback()
    return

  Transform: (element, callback) =>
    callback = callback or ->
      undefined

    return  unless @_deviceBandwidth
    return  if typeof element isnt 'object' or element.tagName isnt 'DIV'
    return  if element.getAttribute('data-uximage-state') is 'ready'

    sources = {
      low: element.getAttribute('data-src')
      medium: element.getAttribute('data-src-medium')
      high: element.getAttribute('data-src-high')
    }

    dimensions = {
      height: element.getAttribute('height') or parseInt(element.style.height, 10) or null
      width: element.getAttribute('width') or parseInt(element.style.width, 10) or null
    }

    if not dimensions.width or not dimensions.height
      testImage = document.createElement('img')
      document.body.appendChild testImage
      testImage.style.display = 'block'
      testImage.style.visibility = 'hidden'
      testSource = sources.low
      testSource = sources.medium  unless testSource
      testSource = sources.high  unless testSource
      testImage.onload = =>
        element.setAttribute 'width', @offsetWidth
        element.setAttribute 'height', @offsetHeight
        @parentNode.removeChild this
        @Transform element, callback
        return

      testImage.onerror = =>
        #console.log('Error loading image element. Removing from DOM.');
        element.parentNode.removeChild element # Remove invalid uximage element.
        @parentNode.removeChild this # Remove test element.
        return

      testImage.src = testSource
    else
      ratio = (dimensions.height / dimensions.width) * 100
      element.style.width = ''
      element.style.height = ''
      element.style.paddingBottom = ratio + '%'
      element.removeAttribute 'width'
      element.removeAttribute 'height'
      if @_deviceBandwidth is 'low' and sources.low
        if element.getAttribute('data-uximage-state') isnt 'ondemand'
          @transformSource element
      else
        if element.getAttribute('data-breakpoint-high') or
        element.getAttribute('data-breakpoint')
          @_cachedBreakpointObjects.push element

          if element.getAttribute('data-uximage-state') isnt 'ondemand'
            @breakpointApply element, true
        else
          if element.getAttribute('data-uximage-state') isnt 'ondemand'
            @transformSource element

      element.setAttribute 'data-uximage-state', 'ready'
      callback()
    return

  Loop: (eventType) =>
    eventType = eventType or 'scroll'

    if eventType is 'resize'
      @breakpointProcessor()
    else
      @scrollProcessor()
    @_inputEventCache.inputTicking = false
    return

  getBrowserState: (eventType) =>
    eventType = eventType or 'scroll'

    switch eventType
      when 'resize'
        @_inputEventCache.lastKnownHeight = (if (window.innerHeight isnt undefined) then window.innerHeight else (document.documentElement or document.body).clientHeight)
        @_inputEventCache.lastKnownWidth = (if (window.innerWidth isnt undefined) then window.innerWidth else (document.documentElement or document.body).clientWidth)
      else
        @_inputEventCache.lastKnownScrollX = (if (window.pageXOffset isnt undefined) then window.pageXOffset else (document.documentElement or document.body.parentNode or document.body).scrollLeft)
        @_inputEventCache.lastKnownScrollY = (if (window.pageYOffset isnt undefined) then window.pageYOffset else (document.documentElement or document.body.parentNode or document.body).scrollTop)
    true

  onInputEvent: (eventType) =>
    eventType = eventType or 'scroll'

    unless @_inputEventCache.inputTicking
      @_inputEventCache.inputTicking = true
      @getBrowserState 'resize'  if eventType is 'resize'
      @getBrowserState 'scroll'
      @requestAnimationFrame @Loop(eventType)
    return

  Setup: =>
    if @_ready
      return
    else
      @_ready = true

    head = document.getElementsByTagName('head')[0]
    css = document.createElement('style')
    css.innerHTML = [
      '.ux-image {'
      'display: block;'
      'max-width: 100%;'
      'height: auto !important;'
      'position: relative;'
      'background: transparent url(data:image/gif;base64,R0lGODlhAQABAIAAAMz/AAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==) no-repeat center;'
      '-ms-interpolation-mode: bicubic;'
      'image-rendering: optimizeQuality;'
      '-webkit-perspective: 1000;'
      '-moz-perspective: 1000;'
      '-ms-perspective: 1000;'
      '-o-perspective: 1000;'
      'perspective: 1000;'
      '-webkit-backface-visibility: hidden;'
      '-moz-backface-visibility: hidden;'
      '-ms-backface-visibility: hidden;'
      '-o-backface-visibility: hidden;'
      'backface-visibility: hidden;'
      '-webkit-background-size: cover;'
      '-moz-background-size: cover;'
      '-ms-background-size: cover;'
      '-o-background-size: cover;'
      'background-size: cover;'
      '-webkit-transform: translateZ(0);'
      '-moz-transform: translateZ(0);'
      '-ms-transform: translateZ(0);'
      '-o-transform: translateZ(0);'
      'transform: translateZ(0);'
      '}'
    ].join(' ')
    head.appendChild css
    @getBrowserState 'resize'
    @getBrowserState 'scroll'

    # Detect when lazy loaded images enter or leave our viewport range.
    document.addEventListener 'scroll', (=>
      @onInputEvent 'scroll'
      return
    ), false

    # Detect new breakpoints.
    window.addEventListener 'resize', (=>
      @onInputEvent 'resize'
      return
    ), false
    return

  requestAnimationFrame: (callback) ->
    callback = callback or ->
      undefined

    window.requestAnimationFrame or window.webkitRequestAnimationFrame or
    window.mozRequestAnimationFrame or window.oRequestAnimationFrame or
    window.msRequestAnimationFrame or (callback) ->
      window.setTimeout callback, 16 # ~60FPS ideally.
      return

# ADM/RequireJS wrapper.
if typeof define is 'function'
  define 'UXImage', ->
    new UXImage()
