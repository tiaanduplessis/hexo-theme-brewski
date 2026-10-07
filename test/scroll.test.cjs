const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const { test, before, after } = require('node:test')
const { JSDOM } = require('jsdom')
const { createFixture } = require('./fixture.cjs')

let fixture
let barba
before(async () => {
  fixture = await createFixture()
  barba = await fs.readFile(require.resolve('barba.js'), 'utf8')
})
after(async () => { if (fixture) await fixture.close() })

async function open (pathname = '/', withBarba = true) {
  const html = await fixture.read(pathname)
  const dom = new JSDOM(html, { url: 'http://localhost' + pathname, runScripts: 'outside-only' })
  const { window } = dom
  // Let jsdom's own load complete before starting the generated initialization.
  await new Promise(resolve => window.addEventListener('load', resolve, { once: true }))
  const calls = []
  const errors = []
  window.addEventListener('error', event => {
    errors.push(event.error)
    event.preventDefault()
  })
  window.scrollTo = (...args) => calls.push(args)
  if (withBarba) {
    window.eval(barba)
    window.Barba.Utils.xhr = url => fixture.read(url)
  }
  const inline = [...window.document.scripts].filter(script => !script.src).at(-1).textContent
  window.eval(inline)
  window.document.dispatchEvent(new window.Event('DOMContentLoaded'))
  assert.deepEqual(errors, [], 'generated initialization must not throw')
  return { dom, window, calls, close: () => window.close() }
}

function click (page, selector, options = {}) {
  const link = page.window.document.querySelector(selector)
  assert.ok(link, selector)
  link.dispatchEvent(new page.window.MouseEvent('click', { bubbles: true, cancelable: true, ...options }))
}

function completed (page) {
  return new Promise(resolve => {
    const listener = () => {
      page.window.Barba.Dispatcher.off('transitionCompleted', listener)
      resolve()
    }
    page.window.Barba.Dispatcher.on('transitionCompleted', listener)
  })
}

async function navigate (page, selector) {
  const done = completed(page)
  click(page, selector)
  await done
}

function deferred () {
  let resolve
  const promise = new Promise(r => { resolve = r })
  return { promise, resolve }
}

for (const [name, pathname, selector, destination] of [
  ['next index page', '/', '.paginator .next', '/page/2/'],
  ['previous index page', '/page/2/', '.paginator .prev', '/'],
  ['next post', '/post-3/', '.paginator .next', '/post-2/'],
  ['previous post', '/post-2/', '.paginator .prev', '/post-3/']
]) {
  test(name + ' scrolls once after the old container is removed', async t => {
    const page = await open(pathname)
    t.after(page.close)
    const oldContainer = page.window.document.querySelector('.barba-container')
    const calls = page.calls
    page.window.scrollTo = (...args) => {
      assert.equal(oldContainer.isConnected, false)
      assert.equal(page.window.document.querySelectorAll('.barba-container').length, 1)
      calls.push(args)
    }
    await navigate(page, selector)
    assert.equal(page.window.location.pathname, destination)
    assert.deepEqual(calls, [[0, 0]])
  })
}

test('initial load including a fragment does not request a reset', async t => {
  const page = await open('/#anchor')
  t.after(page.close)
  assert.deepEqual(page.calls, [])
})

test('unrelated read-more navigation does not request a reset', async t => {
  const page = await open()
  t.after(page.close)
  await navigate(page, '.read-more')
  assert.deepEqual(page.calls, [])
})

test('a delayed response does not reset before successful completion', async t => {
  const page = await open()
  t.after(page.close)
  const response = deferred()
  page.window.Barba.Utils.xhr = () => response.promise
  const done = completed(page)
  click(page, '.paginator .next')
  assert.deepEqual(page.calls, [])
  response.resolve(await fixture.read('/page/2/'))
  await done
  assert.deepEqual(page.calls, [[0, 0]])
})

for (const interruption of ['repeated click', 'newer click', 'popstate', 'hashchange']) {
  test(interruption + ' cancels an in-flight pagination reset', async t => {
    const page = await open()
    t.after(page.close)
    const response = deferred()
    page.window.Barba.Utils.xhr = url => url.endsWith('/page/2/') ? response.promise : new Promise(() => {})
    // A real browser leaves the document on Barba's full-page fallback. Keep
    // that fallback observable here, and never resolve the superseding request.
    page.window.Barba.Pjax.forceGoTo = () => {}
    const done = completed(page)
    click(page, '.paginator .next')
    if (interruption === 'repeated click') click(page, '.paginator .next')
    if (interruption === 'newer click') click(page, '.read-more')
    if (interruption === 'popstate') page.window.dispatchEvent(new page.window.PopStateEvent('popstate'))
    if (interruption === 'hashchange') page.window.dispatchEvent(new page.window.HashChangeEvent('hashchange'))
    response.resolve(await fixture.read('/page/2/'))
    await done
    assert.deepEqual(page.calls, [])
  })
}

test('a same-page anchor click cancels pending pagination without interception', async t => {
  const page = await open()
  t.after(page.close)
  const response = deferred()
  page.window.Barba.Utils.xhr = () => response.promise
  const done = completed(page)
  click(page, '.paginator .next')
  const anchor = page.window.document.querySelector('a[href="#anchor"]')
  const event = new page.window.MouseEvent('click', { bubbles: true, cancelable: true })
  anchor.dispatchEvent(event)
  assert.equal(event.defaultPrevented, false)
  response.resolve(await fixture.read('/page/2/'))
  await done
  assert.deepEqual(page.calls, [])
})

test('a mismatched completed URL cannot reset the viewport', async t => {
  const page = await open()
  t.after(page.close)
  page.window.Barba.Utils.xhr = () => new Promise(() => {})
  click(page, '.paginator .next')
  page.window.Barba.Dispatcher.trigger('transitionCompleted', { url: 'http://localhost/other/' })
  assert.deepEqual(page.calls, [])
})

test('Back and Forward do not add pagination resets', async t => {
  const page = await open()
  t.after(page.close)
  await navigate(page, '.paginator .next')
  page.calls.length = 0
  let done = completed(page)
  page.window.history.back()
  await done
  assert.equal(page.window.location.pathname, '/')
  done = completed(page)
  page.window.history.forward()
  await done
  assert.equal(page.window.location.pathname, '/page/2/')
  assert.deepEqual(page.calls, [])
})

test('ordinary modified and no-barba links retain their default behavior', async t => {
  const page = await open()
  t.after(page.close)
  for (const [selector, options] of [['.paginator .next', { ctrlKey: true }], ['.post-title-link', {}]]) {
    const event = new page.window.MouseEvent('click', { bubbles: true, cancelable: true, ...options })
    page.window.document.querySelector(selector).dispatchEvent(event)
    assert.equal(event.defaultPrevented, false)
  }
  assert.deepEqual(page.calls, [])
})

test('missing Barba still leaves real links and no initialization error', async t => {
  const page = await open('/', false)
  t.after(page.close)
  assert.equal(page.window.document.querySelector('.paginator .next').getAttribute('href'), '/page/2/')
  assert.deepEqual(page.calls, [])
})
