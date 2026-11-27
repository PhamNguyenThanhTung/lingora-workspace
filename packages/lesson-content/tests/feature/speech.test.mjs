import test from 'node:test';
import assert from 'node:assert/strict';
import React, { act } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createRoot } from 'react-dom/client';
import {
  SpeakButton,
  getUnavailableSpeechMessage,
  isSpeechSupported,
  pickVoice,
  resolveSpeechLang,
} from '../../src/index.ts';

const h = React.createElement;

function createMockDom() {
  class MiniEvent {
    constructor(type, init = {}) {
      this.type = type;
      this.bubbles = Boolean(init.bubbles);
      this.cancelable = Boolean(init.cancelable);
      this.key = init.key ?? '';
      this.code = init.code ?? '';
      this.defaultPrevented = false;
      this.propagationStopped = false;
      this.target = null;
      this.currentTarget = null;
    }
    preventDefault() {
      this.defaultPrevented = true;
    }
    stopPropagation() {
      this.propagationStopped = true;
    }
    stopImmediatePropagation() {
      this.propagationStopped = true;
    }
  }

  class MiniNode {
    constructor(nodeType, ownerDocument) {
      this.nodeType = nodeType;
      this.ownerDocument = ownerDocument;
      this.parentNode = null;
      this.childNodes = [];
      this._listeners = new Map();
    }
    get firstChild() {
      return this.childNodes[0] ?? null;
    }
    get lastChild() {
      return this.childNodes[this.childNodes.length - 1] ?? null;
    }
    get nextSibling() {
      if (!this.parentNode) return null;
      const idx = this.parentNode.childNodes.indexOf(this);
      return idx >= 0 ? (this.parentNode.childNodes[idx + 1] ?? null) : null;
    }
    get previousSibling() {
      if (!this.parentNode) return null;
      const idx = this.parentNode.childNodes.indexOf(this);
      return idx > 0 ? this.parentNode.childNodes[idx - 1] : null;
    }
    appendChild(child) {
      return this.insertBefore(child, null);
    }
    insertBefore(child, referenceNode) {
      if (child.parentNode) {
        child.parentNode.removeChild(child);
      }
      child.parentNode = this;
      if (!referenceNode) {
        this.childNodes.push(child);
      } else {
        const idx = this.childNodes.indexOf(referenceNode);
        if (idx === -1) this.childNodes.push(child);
        else this.childNodes.splice(idx, 0, child);
      }
      return child;
    }
    removeChild(child) {
      const idx = this.childNodes.indexOf(child);
      if (idx !== -1) {
        this.childNodes.splice(idx, 1);
        child.parentNode = null;
      }
      return child;
    }
    addEventListener(type, listener) {
      if (!this._listeners.has(type)) this._listeners.set(type, new Set());
      this._listeners.get(type).add(listener);
    }
    removeEventListener(type, listener) {
      this._listeners.get(type)?.delete(listener);
    }
    dispatchEvent(event) {
      if (!event.target) event.target = this;
      let current = this;
      while (current) {
        event.currentTarget = current;
        const listeners = current._listeners?.get(event.type);
        if (listeners) {
          for (const listener of [...listeners]) {
            listener.call(current, event);
          }
        }
        if (!event.bubbles || event.propagationStopped) break;
        current = current.parentNode;
      }
      return !event.defaultPrevented;
    }
  }

  class MiniText extends MiniNode {
    constructor(text, ownerDocument) {
      super(3, ownerDocument);
      this.nodeValue = String(text);
    }
    get textContent() {
      return this.nodeValue;
    }
    set textContent(value) {
      this.nodeValue = String(value);
    }
  }

  class MiniElement extends MiniNode {
    constructor(tagName, ownerDocument, namespaceURI = 'http://www.w3.org/1999/xhtml') {
      super(1, ownerDocument);
      this.tagName = tagName.toUpperCase();
      this.nodeName = this.tagName;
      this.namespaceURI = namespaceURI;
      this.attributes = new Map();
      this.style = {
        setProperty: () => {},
        removeProperty: () => {},
      };
      this.disabled = false;
      this.className = '';
      this.type = '';
      this.tabIndex = tagName.toLowerCase() === 'button' ? 0 : -1;
    }
    setAttribute(name, value) {
      const str = String(value);
      this.attributes.set(name, str);
      if (name === 'disabled') this.disabled = true;
      if (name === 'class') this.className = str;
      if (name === 'type') this.type = str;
      if (name === 'tabindex') this.tabIndex = Number(str);
    }
    getAttribute(name) {
      if (name === 'disabled') return this.disabled ? '' : null;
      if (name === 'class' && this.className) return this.className;
      if (name === 'type' && this.type) return this.type;
      return this.attributes.has(name) ? this.attributes.get(name) : null;
    }
    hasAttribute(name) {
      if (name === 'disabled') return Boolean(this.disabled);
      return this.attributes.has(name);
    }
    removeAttribute(name) {
      this.attributes.delete(name);
      if (name === 'disabled') this.disabled = false;
      if (name === 'class') this.className = '';
    }
    focus() {
      if (!this.disabled) {
        this.ownerDocument.activeElement = this;
      }
    }
    click() {
      if (this.disabled) return;
      this.dispatchEvent(new MiniEvent('click', { bubbles: true, cancelable: true }));
    }
    pressKey(key) {
      const keyEvent = new MiniEvent('keydown', { bubbles: true, cancelable: true, key });
      const notPrevented = this.dispatchEvent(keyEvent);
      if (
        notPrevented &&
        !this.disabled &&
        this.tagName === 'BUTTON' &&
        (key === 'Enter' || key === ' ')
      ) {
        this.click();
      }
    }
    querySelectorAll(selector) {
      const results = [];
      const tag = selector.toUpperCase();
      const visit = (node) => {
        for (const child of node.childNodes) {
          if (child.nodeType === 1) {
            if (child.tagName === tag) results.push(child);
            visit(child);
          }
        }
      };
      visit(this);
      return results;
    }
    querySelector(selector) {
      return this.querySelectorAll(selector)[0] ?? null;
    }
  }

  class MiniDocument extends MiniNode {
    constructor() {
      super(9, null);
      this.ownerDocument = this;
      this.activeElement = null;
      this.documentElement = new MiniElement('html', this);
      this.body = new MiniElement('body', this);
      this.documentElement.appendChild(this.body);
      this.appendChild(this.documentElement);
    }
    createElement(tagName) {
      return new MiniElement(tagName, this);
    }
    createElementNS(ns, tagName) {
      return new MiniElement(tagName, this, ns);
    }
    createTextNode(text) {
      return new MiniText(text, this);
    }
  }

  const document = new MiniDocument();
  class HTMLIFrameElement extends MiniElement {}
  const windowObj = {
    document,
    navigator: {},
    HTMLElement: MiniElement,
    HTMLIFrameElement,
    SVGElement: MiniElement,
    Element: MiniElement,
    Node: MiniNode,
    Event: MiniEvent,
    addEventListener: () => {},
    removeEventListener: () => {},
  };
  document.defaultView = windowObj;
  return { document, window: windowObj, MiniEvent };
}

function createMockSpeechSynthesis(initialVoices = []) {
  let voices = [...initialVoices];
  const calls = [];
  const utterances = [];
  const listeners = new Map();

  class MockUtterance {
    constructor(text) {
      this.text = text;
      this.lang = '';
      this.voice = null;
      this.rate = 1;
      this.onend = null;
      this.onerror = null;
    }
  }

  const synth = {
    getVoices() {
      return voices;
    },
    cancel() {
      calls.push({ type: 'cancel' });
    },
    speak(utterance) {
      calls.push({ type: 'speak', utterance });
      utterances.push(utterance);
    },
    addEventListener(type, listener) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(listener);
    },
    removeEventListener(type, listener) {
      listeners.get(type)?.delete(listener);
    },
    setVoices(nextVoices) {
      voices = [...nextVoices];
      for (const listener of [...(listeners.get('voiceschanged') ?? [])]) {
        listener({ type: 'voiceschanged' });
      }
    },
  };

  return { synth, MockUtterance, calls, utterances };
}

async function withMockBrowser(setup, run) {
  const prevWindow = globalThis.window;
  const prevDocument = globalThis.document;
  const prevUtterance = globalThis.SpeechSynthesisUtterance;
  const prevActEnv = globalThis.IS_REACT_ACT_ENVIRONMENT;

  const dom = createMockDom();
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  globalThis.window = dom.window;
  globalThis.document = dom.document;

  if (setup?.speech) {
    dom.window.speechSynthesis = setup.speech.synth;
    dom.window.SpeechSynthesisUtterance = setup.speech.MockUtterance;
    globalThis.SpeechSynthesisUtterance = setup.speech.MockUtterance;
  } else {
    delete globalThis.SpeechSynthesisUtterance;
  }

  const container = dom.document.createElement('div');
  dom.document.body.appendChild(container);
  const root = createRoot(container);

  try {
    await run({ dom, container, root });
  } finally {
    await act(async () => {
      root.unmount();
    });
    if (prevWindow === undefined) delete globalThis.window;
    else globalThis.window = prevWindow;
    if (prevDocument === undefined) delete globalThis.document;
    else globalThis.document = prevDocument;
    if (prevUtterance === undefined) delete globalThis.SpeechSynthesisUtterance;
    else globalThis.SpeechSynthesisUtterance = prevUtterance;
    if (prevActEnv === undefined) delete globalThis.IS_REACT_ACT_ENVIRONMENT;
    else globalThis.IS_REACT_ACT_ENVIRONMENT = prevActEnv;
  }
}

test('EXT-04 §3A.4 ca 1: resolveSpeechLang maps course codes, uppercase, regional variants, and empty inputs', () => {
  assert.equal(resolveSpeechLang('ja'), 'ja-JP');
  assert.equal(resolveSpeechLang('zh'), 'zh-CN');
  assert.equal(resolveSpeechLang('en'), 'en-US');
  assert.equal(resolveSpeechLang('fr'), 'fr-FR');

  assert.equal(resolveSpeechLang('JA'), 'ja-JP');
  assert.equal(resolveSpeechLang('ZH'), 'zh-CN');
  assert.equal(resolveSpeechLang('EN'), 'en-US');
  assert.equal(resolveSpeechLang('FR'), 'fr-FR');

  assert.equal(resolveSpeechLang('ja_JP'), 'ja-JP');
  assert.equal(resolveSpeechLang(' ja_jp '), 'ja-JP');
  assert.equal(resolveSpeechLang('en_GB'), 'en-GB');
  assert.equal(resolveSpeechLang('zh_Hant'), 'zh-CN');
  assert.equal(resolveSpeechLang('zh_TW'), 'zh-TW');
  assert.equal(resolveSpeechLang('ja-x-lingora-1'), 'ja-JP');

  assert.equal(resolveSpeechLang(''), undefined);
  assert.equal(resolveSpeechLang('   '), undefined);
  assert.equal(resolveSpeechLang(null), undefined);
  assert.equal(resolveSpeechLang(undefined), undefined);
  assert.equal(resolveSpeechLang('not valid!'), undefined);
});

test('EXT-04 §3A.4 ca 2: pickVoice prefers exact match, falls back to base lang, and returns null on mismatch', () => {
  const enDefault = { lang: 'en-US', name: 'English Default', default: true };
  const frVoice = { lang: 'fr-FR', name: 'French' };
  const jaBase = { lang: 'ja', name: 'Japanese Base' };
  const jaExact = { lang: 'ja-JP', name: 'Japanese Exact' };
  const jaUnderscore = { lang: 'ja_jp', name: 'Japanese Underscore' };

  // Full code match preferred over base match even when base appears first
  assert.equal(pickVoice([enDefault, jaBase, jaExact], 'ja-JP'), jaExact);
  assert.equal(pickVoice([enDefault, jaUnderscore], 'ja-JP'), jaUnderscore);

  // Base language fallback when full regional code is missing
  assert.equal(pickVoice([enDefault, jaBase, frVoice], 'ja-JP'), jaBase);
  assert.equal(pickVoice([enDefault, jaExact], 'ja'), jaExact);

  // Never falls back to wrong-language default voice
  assert.equal(pickVoice([enDefault, frVoice], 'ja-JP'), null);
  assert.equal(pickVoice([enDefault, frVoice], 'zh-CN'), null);
  assert.equal(pickVoice([], 'ja-JP'), null);
  assert.equal(pickVoice(null, 'ja-JP'), null);
  assert.equal(pickVoice([enDefault], ''), null);
});

test('EXT-04 §3A.4 ca 3: SSR rendering and isSpeechSupported do not throw and render nothing without window', () => {
  assert.equal(typeof window, 'undefined');
  assert.equal(isSpeechSupported(), false);

  const html = renderToStaticMarkup(
    h(SpeakButton, { text: '学生', languageCode: 'ja' })
  );
  assert.equal(html, '');
});

test('EXT-04 §3A.4 ca 3: SpeakButton renders nothing when Web Speech API is absent', async () => {
  await withMockBrowser(null, async ({ container, root }) => {
    assert.equal(isSpeechSupported(), false);
    await act(async () => {
      root.render(h(SpeakButton, { text: '学生', languageCode: 'ja' }));
    });
    assert.equal(container.querySelectorAll('button').length, 0);
  });
});

test('EXT-04 §3A.4 ca 3: SpeakButton handles voiceschanged, calls cancel before speak with rate 0.9, and toggles speaking state', async () => {
  const speech = createMockSpeechSynthesis([]);

  await withMockBrowser({ speech }, async ({ container, root }) => {
    assert.equal(isSpeechSupported(), true);

    await act(async () => {
      root.render(h(SpeakButton, { text: '学生', languageCode: 'ja' }));
    });

    // Initially getVoices() returned [] -> button disabled with localized unavailable message
    let btn = container.querySelector('button');
    assert.ok(btn, 'SpeakButton should render once Web Speech API is supported');
    assert.equal(btn.disabled, true);
    assert.equal(btn.getAttribute('data-speech-state'), 'unavailable');
    assert.equal(btn.getAttribute('title'), getUnavailableSpeechMessage('ja'));
    assert.equal(btn.getAttribute('aria-label'), 'Thiết bị chưa có giọng đọc tiếng Nhật');

    // Simulate browser firing voiceschanged with English + Japanese voices
    await act(async () => {
      speech.synth.setVoices([
        { lang: 'en-US', name: 'English', default: true },
        { lang: 'ja-JP', name: 'Kyoko' },
      ]);
    });

    btn = container.querySelector('button');
    assert.equal(btn.disabled, false);
    assert.equal(btn.getAttribute('data-speech-state'), 'idle');
    assert.equal(btn.getAttribute('aria-label'), 'Nghe phát âm: 学生');
    assert.equal(btn.getAttribute('aria-pressed'), 'false');

    // Click button -> cancel() then speak(), lang=ja-JP, text=学生, rate=0.9
    await act(async () => {
      btn.click();
    });

    assert.equal(speech.calls.length, 2);
    assert.equal(speech.calls[0].type, 'cancel');
    assert.equal(speech.calls[1].type, 'speak');
    const firstUtterance = speech.utterances[0];
    assert.equal(firstUtterance.text, '学生');
    assert.equal(firstUtterance.lang, 'ja-JP');
    assert.equal(firstUtterance.rate, 0.9);
    assert.equal(firstUtterance.voice?.lang, 'ja-JP');

    btn = container.querySelector('button');
    assert.equal(btn.getAttribute('data-speech-state'), 'speaking');
    assert.equal(btn.getAttribute('aria-pressed'), 'true');
    assert.match(btn.className, /lingora-speak-btn--speaking/);

    // Rapid second click cancels first utterance and keeps speaking state for second utterance
    await act(async () => {
      btn.click();
    });
    assert.equal(speech.calls.length, 4);
    assert.equal(speech.calls[2].type, 'cancel');
    assert.equal(speech.calls[3].type, 'speak');
    const secondUtterance = speech.utterances[1];

    // Late onend from cancelled first utterance must NOT clear speaking state of second
    await act(async () => {
      firstUtterance.onend?.();
    });
    assert.equal(container.querySelector('button').getAttribute('data-speech-state'), 'speaking');

    // onend of active utterance clears speaking state
    await act(async () => {
      secondUtterance.onend?.();
    });
    btn = container.querySelector('button');
    assert.equal(btn.getAttribute('data-speech-state'), 'idle');
    assert.equal(btn.getAttribute('aria-pressed'), 'false');
  });
});

test('EXT-04 §3A.4 ca 3: SpeakButton stays disabled with message when only wrong-language voices exist', async () => {
  const speech = createMockSpeechSynthesis([
    { lang: 'en-US', name: 'English', default: true },
    { lang: 'fr-FR', name: 'French' },
  ]);

  await withMockBrowser({ speech }, async ({ container, root }) => {
    await act(async () => {
      root.render(h(SpeakButton, { text: '学生', languageCode: 'ja' }));
    });

    const btn = container.querySelector('button');
    assert.ok(btn);
    assert.equal(btn.disabled, true);
    assert.equal(btn.getAttribute('data-speech-state'), 'unavailable');
    assert.equal(btn.getAttribute('aria-label'), 'Thiết bị chưa có giọng đọc tiếng Nhật');
    assert.equal(btn.getAttribute('title'), 'Thiết bị chưa có giọng đọc tiếng Nhật');

    await act(async () => {
      btn.click();
    });
    assert.equal(speech.calls.length, 0);
  });
});

test('EXT-04 §3A.4 ca 6: SpeakButton is keyboard accessible (focusable, aria-label, Enter/Space trigger speech)', async () => {
  const speech = createMockSpeechSynthesis([{ lang: 'ja-JP', name: 'Kyoko' }]);

  await withMockBrowser({ speech }, async ({ dom, container, root }) => {
    await act(async () => {
      root.render(h(SpeakButton, { text: '先生', languageCode: 'ja' }));
    });

    const btn = container.querySelector('button');
    assert.ok(btn);
    assert.equal(btn.tagName, 'BUTTON');
    assert.equal(btn.getAttribute('type'), 'button');
    assert.ok(btn.tabIndex >= 0, 'SpeakButton must be reachable via Tab');
    assert.equal(btn.getAttribute('aria-label'), 'Nghe phát âm: 先生');

    // Focus like Tab navigation, then activate with Enter
    btn.focus();
    assert.equal(dom.document.activeElement, btn);

    await act(async () => {
      btn.pressKey('Enter');
    });
    assert.equal(speech.utterances.length, 1);
    assert.equal(speech.utterances[0].text, '先生');

    await act(async () => {
      speech.utterances[0].onend?.();
    });

    // Activate with Space
    await act(async () => {
      btn.pressKey(' ');
    });
    assert.equal(speech.calls[2].type, 'cancel');
    assert.equal(speech.calls[3].type, 'speak');
    assert.equal(speech.utterances.length, 2);

    // onerror clears speaking state
    await act(async () => {
      speech.utterances[1].onerror?.();
    });
    assert.equal(container.querySelector('button').getAttribute('data-speech-state'), 'idle');

    // Switching text while speaking cancels active utterance and resets state
    await act(async () => {
      btn.click();
    });
    assert.equal(container.querySelector('button').getAttribute('data-speech-state'), 'speaking');

    await act(async () => {
      root.render(h(SpeakButton, { text: '学校', languageCode: 'ja' }));
    });
    assert.equal(container.querySelector('button').getAttribute('data-speech-state'), 'idle');
    assert.equal(container.querySelector('button').getAttribute('aria-label'), 'Nghe phát âm: 学校');
    assert.equal(speech.calls[speech.calls.length - 1].type, 'cancel');
  });
});
