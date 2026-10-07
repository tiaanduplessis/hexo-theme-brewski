const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const http = require('node:http')
const path = require('node:path')
const { test, before, after } = require('node:test')
const { chromium } = require('playwright')
const { createFixture } = require('./fixture.cjs')

let fixture, server, browser, origin
before(async () => {
  fixture = await createFixture()
  server = http.createServer(async (request, response) => {
    try {
      const pathname = new URL(request.url, 'http://localhost').pathname
      let file = path.resolve(fixture.publicDir, '.' + decodeURIComponent(pathname))
      if (!file.startsWith(fixture.publicDir + path.sep) && file !== fixture.publicDir) throw new Error('Invalid path')
      if ((await fs.stat(file)).isDirectory()) file = path.join(file, 'index.html')
      response.setHeader('Content-Type', file.endsWith('.html') ? 'text/html' : file.endsWith('.css') ? 'text/css' : 'image/svg+xml')
      response.end(await fs.readFile(file))
    } catch {
      response.writeHead(404).end('Not found')
    }
  })
  await new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })
  origin = `http://127.0.0.1:${server.address().port}`
  browser = await chromium.launch(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {})
})
after(async () => {
  if (browser) await browser.close()
  if (server) await new Promise(resolve => server.close(resolve))
  if (fixture) await fixture.close()
})

async function open (t, pathname = '/', options = {}) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, ...options })
  t.after(() => context.close())
  await context.route('**/*', async route => {
    const url = route.request().url()
    if (url === 'https://cdnjs.cloudflare.com/ajax/libs/barba.js/1.0.0/barba.min.js') {
      await route.fulfill({ path: require.resolve('barba.js/dist/barba.min.js'), contentType: 'text/javascript' })
    } else if (url.startsWith(origin + '/')) {
      await route.continue()
    } else {
      await route.abort()
    }
  })
  await context.addInitScript(() => {
    window.__scrollCalls = []
    const original = window.scrollTo
    window.scrollTo = function (...args) {
      window.__scrollCalls.push(args)
      return original.apply(this, args)
    }
  })
  const page = await context.newPage()
  await page.goto(origin + pathname)
  if (options.javaScriptEnabled !== false) {
    await page.waitForFunction(() => window.Barba && Barba.Pjax.History.currentStatus())
    await page.evaluate(() => { window.__sameDocument = true })
  }
  return page
}

async function deep (page, selector = '.paginator') {
  await page.locator(selector).scrollIntoViewIfNeeded()
  assert.ok(await page.evaluate(() => window.scrollY > 500), 'fixture must really be scrolled')
}

async function settled (page, pathname) {
  await page.waitForURL(origin + pathname)
  await page.waitForFunction(() => !Barba.Pjax.transitionProgress && document.querySelectorAll('.barba-container').length === 1)
}

for (const [name, start, selector, destination, options] of [
  ['next index page', '/', '.paginator .next', '/page/2/', {}],
  ['previous index page', '/page/2/', '.paginator .prev', '/', {}],
  ['next post', '/post-3/', '.paginator .next', '/post-2/', {}],
  ['previous post', '/post-2/', '.paginator .prev', '/post-3/', {}],
  ['mobile pagination', '/', '.paginator .next', '/page/2/', { viewport: { width: 390, height: 844 }, isMobile: true }]
]) {
  test(name + ' actually returns to the top after PJAX', async t => {
    const page = await open(t, start, options)
    await deep(page)
    await page.locator(selector).click()
    await settled(page, destination)
    await page.waitForFunction(() => window.scrollY === 0)
    assert.equal(await page.evaluate(() => window.__sameDocument), true, 'must use PJAX, not a reload')
    assert.deepEqual(await page.evaluate(() => window.__scrollCalls), [[0, 0]])
  })
}

test('keyboard Enter activates the pagination link', async t => {
  const page = await open(t)
  await deep(page)
  await page.locator('.paginator .next').focus()
  await page.keyboard.press('Enter')
  await settled(page, '/page/2/')
  await page.waitForFunction(() => window.scrollY === 0)
})

test('same-page anchors keep native scrolling and initial fragments are not reset', async t => {
  const page = await open(t)
  await page.locator('a[href="#anchor"]').click()
  await page.waitForURL(origin + '/#anchor')
  assert.ok(await page.evaluate(() => window.scrollY > 500))
  assert.deepEqual(await page.evaluate(() => window.__scrollCalls), [])
  await page.reload()
  assert.ok(await page.evaluate(() => window.scrollY > 500))
  assert.deepEqual(await page.evaluate(() => window.__scrollCalls), [])
})

test('Back and Forward never invoke the pagination reset', async t => {
  const page = await open(t)
  await deep(page)
  await page.locator('.paginator .next').click()
  await settled(page, '/page/2/')
  await deep(page)
  await page.goBack()
  await settled(page, '/')
  assert.deepEqual(await page.evaluate(() => window.__scrollCalls), [[0, 0]])
  await page.goForward()
  await settled(page, '/page/2/')
  assert.deepEqual(await page.evaluate(() => window.__scrollCalls), [[0, 0]])
})

test('failed PJAX requests fall back to normal navigation', async t => {
  const page = await open(t)
  await page.route('**/page/2/', route => route.request().resourceType() === 'xhr' ? route.abort() : route.continue())
  await deep(page)
  await page.locator('.paginator .next').click()
  await page.waitForURL(origin + '/page/2/')
  await page.waitForFunction(() => window.__sameDocument === undefined)
  assert.deepEqual(await page.evaluate(() => window.__scrollCalls), [])
})

test('a repeated click while PJAX is delayed does not retain a stale reset', async t => {
  const page = await open(t)
  let release
  const delayed = new Promise(resolve => { release = resolve })
  let intercepted
  const started = new Promise(resolve => { intercepted = resolve })
  await page.route('**/page/2/', async route => {
    if (route.request().resourceType() === 'xhr') { intercepted(); await delayed }
    await route.continue()
  })
  await deep(page)
  await page.locator('.paginator .next').click()
  await started
  await page.locator('.paginator .next').click()
  release()
  await settled(page, '/page/2/')
  assert.deepEqual(await page.evaluate(() => window.__scrollCalls), [])
})

test('links still navigate with JavaScript disabled', async t => {
  const page = await open(t, '/', { javaScriptEnabled: false })
  await page.locator('.paginator .next').click()
  await page.waitForURL(origin + '/page/2/')
  assert.equal(await page.locator('.barba-container').count(), 1)
})

test('no-barba post titles use a full navigation', async t => {
  const page = await open(t)
  await page.locator('.post-title-link').click()
  await page.waitForURL(origin + '/post-3/')
  assert.equal(await page.evaluate(() => window.__sameDocument), undefined)
})
