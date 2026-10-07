const fs = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')
const Hexo = require('hexo')

const themeRoot = process.env.BREWSKI_THEME_ROOT || path.resolve(__dirname, '..')

async function createFixture () {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'brewski-scroll-'))
  const theme = path.join(root, 'themes/brewski')
  await fs.mkdir(theme, { recursive: true })
  for (const item of ['layout', 'source', 'languages', '_config.yml']) {
    await fs.cp(path.join(themeRoot, item), path.join(theme, item), { recursive: true })
  }
  await fs.symlink(path.resolve(__dirname, '../node_modules'), path.join(root, 'node_modules'), 'dir')
  await fs.writeFile(path.join(root, 'package.json'), JSON.stringify({
    name: 'brewski-scroll-fixture', private: true, hexo: { version: '8.1.2' },
    dependencies: {
      'hexo-generator-index': '4.0.0',
      'hexo-renderer-marked': '7.0.1',
      'hexo-renderer-pug': '3.0.0'
    }
  }))
  await fs.writeFile(path.join(root, '_config.yml'), `
title: Brewski scroll fixture
author: Test fixture
url: http://localhost
root: /
permalink: :title/
theme: brewski
language: en
timezone: UTC
per_page: 1
pagination_dir: page
theme_config:
  google_analytics:
  comment:
  menu:
    Home: /
    About:
    Archives:
    Impressum:
    GitHub:
    RSS:
`)
  await fs.mkdir(path.join(root, 'source/_posts'), { recursive: true })
  for (let i = 1; i <= 3; i++) {
    const paragraphs = Array.from({ length: 45 }, (_, n) => `<p>Post ${i}, paragraph ${n + 1}. Long content for pagination scrolling.</p>`).join('\n\n')
    await fs.writeFile(path.join(root, `source/_posts/post-${i}.md`), `---\ntitle: Post ${i}\ndate: 2026-09-0${i} 12:00:00\n---\n[Jump to anchor](#anchor)\n\n${paragraphs}\n\n<h2 id="anchor">Anchor</h2>\n\n<!-- more -->\n\n${paragraphs}\n`)
  }
  const hexo = new Hexo(root, { silent: true })
  try {
    await hexo.init()
    await hexo.call('generate')
  } finally {
    await hexo.exit()
  }
  return {
    root,
    publicDir: path.join(root, 'public'),
    read: (url) => fs.readFile(path.join(root, 'public', new URL(url, 'http://localhost').pathname, 'index.html'), 'utf8'),
    close: () => fs.rm(root, { recursive: true, force: true })
  }
}

module.exports = { createFixture }
