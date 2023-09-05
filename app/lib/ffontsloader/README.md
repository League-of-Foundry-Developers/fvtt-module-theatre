[![Build Status](https://app.travis-ci.com/MurDaD/ffontsloader.svg?branch=master)](https://app.travis-ci.com/MurDaD/fontsloader)
[![codecov](https://codecov.io/gh/MurDaD/ffontsloader/branch/master/graph/badge.svg?token=48MMJ01ZGM)](https://codecov.io/gh/MurDaD/fontsloader)
[![ts-recommended-style](https://img.shields.io/badge/code%20style-recommended-brightgreen.svg)](https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/eslint-plugin/src/configs/eslint-recommended.ts)
[![contributions welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg?style=flat-square)](https://github.com/MurDaD/ffontsloader/issues)

#### Demo: https://murdad.github.io/ffontsloader/demo/index.html

# 🚀 Faster Fonts Loader
Fonts Loader gives you total control over the fonts loading via `@font-face`. You're getting a common interface to load fonts regardless of source. Some popular online libraries are included, like [Google Font API](https://developers.google.com/fonts/). You can also load fonts from self-hosted sources and control them via FontsLoader events tool.

## Compatibility with Web Font Loader

Fonts Loader is compatible with [Web Font Loader](https://github.com/typekit/webfontloader). Interface is same, just replace ` WebFont.load()` with `FontsLoader.load()`.

## Get Started

To use the Fonts Loader library, just include it in your page and tell it which fonts to load. For example, you could load fonts from [Google Fonts](http://www.google.com/fonts/) using the Fonts Loader hosted on [Google Hosted Libraries](https://developers.google.com/speed/libraries/) using the following code.

```html
<script src="https://murdad.github.io/ffontsloader/dist/fontsloader.js"></script>
<script>
  FontsLoader.load({
    google: {
      families: ['Droid Sans', 'Droid Serif']
    }
  });
</script>
```

It is also possible to load fonts asynchronosly, here is an example:
```html
<script src="https://murdad.github.io/ffontsloader/dist/fontsloader.js"></script>
<script>
    const { FontsLoader } = window;
    (async function() {
        await FontsLoader.load({
            google: {
                families: ['Tangerine', 'IBM Plex Sans Thai Looped:300,700:latin,greek']
            }
        });
    })();
</script>
```

Or using npm

```
$ npm i --save ffontsloader
```

## Configuration

The Fonts Loader configuration is passed directly to the `FontsLoader.load` method. It defines which fonts to load from each web font provider and gives you the option to specify callbacks for certain events.

### Events

Fonts Loader provides an event system that developers can hook into. It gives you notifications of the font loading sequence in both CSS and JavaScript.

* `loading` - This event is triggered when all fonts have been requested.
* `active` - This event is triggered when the fonts have rendered.
* `inactive` - This event is triggered when the browser does not support linked fonts *or* if none of the fonts could be loaded.
* `fontloading` - This event is triggered once for each font that's loaded.
* `fontactive` - This event is triggered once for each font that renders.
* `fontinactive` - This event is triggered if the font can't be loaded.

CSS events are implemented as classes on the `html` element. The following classes are set on the `html` element:

```css
.wf-loading
.wf-active
.wf-inactive
.wf-<familyname>-<fvd>-loading
.wf-<familyname>-<fvd>-active
.wf-<familyname>-<fvd>-inactive
```

The `<familyname>` placeholder will be replaced by a sanitized version of the name of each font family. Spaces and underscores are removed from the name, and all characters are converted to lower case. For example, `Droid Sans` becomes `droidsans`. The `<fvd>` placeholder is a [Font Variation Description](https://github.com/typekit/fvd). Put simply, it's a shorthand for describing the style and weight of a particular font. Here are a few examples:

```css
/* n4 */
@font-face { font-style: normal; font-weight: normal; }

/* i7 */
@font-face { font-style: italic; font-weight: bold; }
```

Keep in mind that `font-weight: normal` maps to `font-weight: 400` and `font-weight: bold` maps to `font-weight: 700`. If no style/weight is specified, the default `n4` (`font-style: normal; font-weight: normal;`) will be used.

If fonts are loaded multiple times on a single page, the CSS classes continue to update to reflect the current state of the page. The global `wf-loading` class is applied whenever fonts are being requested (even if other fonts are already active or inactive). The `wf-inactive` class is applied only if none of the fonts on the page have rendered. Otherwise, the `wf-active` class is applied (even if some fonts are inactive).

JavaScript events are implemented as callback functions on the configuration object.

```javascript
FontsLoader.load({
  loading: function() {},
  active: function() {},
  inactive: function() {},
  fontloading: function(familyName, fvd) {},
  fontactive: function(familyName, fvd) {},
  fontinactive: function(familyName, fvd) {},
});
```

The `fontloading`, `fontactive` and `fontinactive` callbacks are passed the family name and font variation description of the font that concerns the event.

It is possible to disable setting classes on the HTML element by setting the `classes` configuration parameter to `false` (defaults to `true`).

```javascript
FontsLoader.load({
  classes: false,
});
```

You can also disable font events (callbacks) by setting the `events` parameter to `false` (defaults to `true`).

```javascript
FontsLoader.load({
  events: false,
});
```

If both events and classes are disabled, the Fonts Loader does not perform font watching and only acts as a way to insert @font-face rules in the document.

### Timeouts

Since the Internet is not 100% reliable, it's possible that a font will fail to load. The `fontinactive` event will be triggered after 5 seconds if the font fails to render. If *at least* one font successfully renders, the `active` event will be triggered, else the `inactive` event will be triggered.

You can change the default timeout by using the `timeout` option on the configuration object.

NOTE: if FontFace callback is triggered that all fonts have been loaded, the timeout would be ignored.

```javascript
FontsLoader.load({
  google: {
    families: ['Droid Sans'],
  },
  timeout: 2000, // Set the timeout to two seconds
});
```

The timeout value should be in milliseconds, and defaults to 3000 milliseconds (3 seconds) if not supplied.

### Custom

To load fonts from any external stylesheet, use the `custom` module. Here you'll
need to specify the font family names you're trying to load, and optionally the url of the stylesheet that provides the `@font-face` declarations for those fonts.

You can specify a specific font variation or set of variations to load and watch
by appending the variations separated by commas to the family name separated by
a colon. Variations are specified using [FVD notation](https://github.com/typekit/fvd).

```javascript
FontsLoader.load({
  custom: {
    families: ['My Font', 'My Other Font:n4,i4,n7'],
    urls: ['/fonts.css'],
  },
});
```

Or you can also load families as objects

```javascript
FontsLoader.load({
  custom: {
    families: [
      {
        name: 'My Font',
        url: '/font.css',
      },
      {
        name: 'My Other Font',
        url: '/other-font.css',
      },
    ],
  },
});
```

In this example, the `fonts.css` file might look something like this:

```css
@font-face {
  font-family: 'My Font';
  src: ...;
}
@font-face {
  font-family: 'My Other Font';
  font-style: normal;
  font-weight: normal; /* or 400 */
  src: ...;
}
@font-face {
  font-family: 'My Other Font';
  font-style: italic;
  font-weight: normal; /* or 400 */
  src: ...;
}
@font-face {
  font-family: 'My Other Font';
  font-style: normal;
  font-weight: bold; /* or 700 */
  src: ...;
}
```

## TODO
- [ ] Add more tests
- [ ] Increase coverage
- [ ] Rewrite README.md
- [ ] Update demos
- [ ] Implement native loader for custom fonts
- [ ] Add React, Angular and Vue examples
- [ ] Add more font API sources
- [ ] Use Google API v2

