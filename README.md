
<h1 align="center">🍺 brewski</h1>
<div align="center">
  <strong>A minimal Hexo theme</strong>
</div>
<div align="center">
  <a href="http://makeapullrequest.com">
    <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square" alt="make a pull request" />
  </a>
</div>
<br>
<div align="center">
  <a href="https://github.com/tiaanduplessis/hexo-theme-brewski/watchers">
    <img src="https://img.shields.io/github/watchers/tiaanduplessis/hexo-theme-brewski.svg?style=social" alt="Github Watch Badge" />
  </a>
  <a href="https://github.com/tiaanduplessis/hexo-theme-brewski/stargazers">
    <img src="https://img.shields.io/github/stars/tiaanduplessis/hexo-theme-brewski.svg?style=social" alt="Github Star Badge" />
  </a>
  <a href="https://twitter.com/intent/tweet?text=Check%20out%20hexo-theme-brewski!%20https://github.com/tiaanduplessis/hexo-theme-brewski%20%F0%9F%91%8D">
    <img src="https://img.shields.io/twitter/url/https/github.com/tiaanduplessis/hexo-theme-brewski.svg?style=social" alt="Tweet" />
  </a>
</div>
<br>
<div align="center">
  Built with ❤︎ by <a href="https://github.com/tiaanduplessis">tiaanduplessis</a> and <a href="https://github.com/tiaanduplessis/hexo-theme-brewski/contributors">contributors</a>
</div>

<h2>Table of Contents</h2>
<details>
  <summary>Table of Contents</summary>
  <li><a href="#about">About</a></li>
  <li><a href="#install">Install</a></li>
  <li><a href="#usage">Usage</a></li>
  <li><a href="#update">Update</a></li>
  <li><a href="#contribute">Contribute</a></li>
  <li><a href="#license">License</a></li>
</details>

## About

A minimal theme based on and hacked from [artemis](https://github.com/Dreyer/hexo-theme-artemis). Check out the demo [here](https://tiaanduplessis.github.io/hexo-theme-brewski-demo/).

### Install

From your Hexo project root directory:

Copy the theme into your `themes` sub-directory:

```sh
$ git clone https://github.com/tiaanduplessis/hexo-theme-brewski.git themes/brewski
```

You can also add it as a submodule (plays better with CI like [travis](https://travis-ci.org)):

```sh
$ git submodule add https://github.com/tiaanduplessis/hexo-theme-brewski.git themes/brewski
```

After cloning, install the needed dependencies:

```sh
$ npm install --save hexo-renderer-pug hexo-generator-feed hexo-generator-sitemap
```


### Usage

Modify `theme` setting in `_config.yml` to `brewski`.

You can override the theme options using `theme_config` in the main `_config.yml`:

```yaml
theme: brewski
theme_config:
  logo:
  google_analytics: UA-XXXXXXXX-X
  copyright:
    since: 2016
    name: John Doe
    url: https://www.example.org/john-doe
  menu:
    Home: /
    About: /about
    GitHub: https://github.com/tiaanduplessis
    RSS: /atom.xml
```

### Update

```sh
$cd themes/brewski
$ git pull
```


## Pagination scrolling

The previous/next index and post links return to the top after a completed PJAX
transition. The reset is canceled by a later click, fragment navigation, or
Back/Forward. Initial loads and other links do not receive an additional reset;
Barba's existing history behavior is unchanged. If Barba cannot load, the links
continue to work through normal browser navigation.

## Tests

The development fixture uses Node 24.15 or newer in the Node 24 line (or Node
22.22.2 or newer in the Node 22 line). This is a test-tooling requirement, not a
new requirement for consumers of the static theme.

```sh
npm ci --ignore-scripts
npm test
```

The tests generate real long Hexo index/post pages with Hexo 8.1.2 and the Pug
3.0.0 renderer, then exercise the theme's generated initialization with Barba
1.0.0 in jsdom. Dependencies are development-only; no installation lifecycle
scripts are needed for these fixtures.

Layout and scroll restoration need a real browser as well. Install Playwright's
Chromium through its normal supported setup, then run:

```sh
npm run test:browser
```

An existing Chromium can be selected with `BROWSER_EXECUTABLE=/path/to/chromium`.
This suite uses local generated pages and a local copy of the exact Barba CDN
version, blocking unrelated external requests. It covers index/post pagination,
keyboard activation, a mobile viewport, anchors, Back/Forward, delayed/repeated
clicks, failed PJAX requests, and normal navigation with or without JavaScript.
A passing jsdom suite alone is not a substitute for this browser gate.

The locked Hexo development graph currently includes the unpatched `braces`
[GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) advisory.
Use these fixtures only with trusted local content/patterns. The generated site
ships none of this development graph; its existing Barba 1.0.0 CDN dependency is
unchanged. A clean production audit is not a claim that the full graph is clean.

## Contributing

Contributions are welcome!

1. Fork it.
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D

Or open up [a issue](https://github.com/tiaanduplessis/hexo-theme-brewski/issues).

## License

Licensed under the MIT License.
