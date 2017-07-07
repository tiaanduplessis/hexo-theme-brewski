
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


## Contributing

Contributions are welcome!

1. Fork it.
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D

Or open up [a issue](https://github.com/tiaanduplessis/form-extract/issues).

## License

Licensed under the MIT License.
