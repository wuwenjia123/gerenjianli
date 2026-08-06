/**
 * ScrollStack (Native) · 纯原生 JS 实现，无 React/Lenis 依赖 · v2（与 Portfolio 栏目风格统一）
 * ---------------------------------------------------------------------------------------------
 * 对外 API:
 *   createScrollStack({ container, cards, options }) => { destroy }
 *   initCertStack(selectorOrEl, items, opts?)              => { destroy }
 *
 * 新增 opts:
 *   unifiedPortfolioMode  true  => 不包自己的 header/wrap，直接作为 ai-practice-wrap 内部的 scroller 使用
 *                            （与 AI 编程实战 / 前端动效 / PPT 三栏目视觉风格完全一致）
 */
(function (global) {
  'use strict';

  /* ---------------------- 工具 ---------------------- */
  const isMobileViewport = (w) => (w || (typeof window !== 'undefined' ? window.innerWidth : 1024)) < 640;
  const isTabletViewport = (w) => {
    const x = w || (typeof window !== 'undefined' ? window.innerWidth : 1024);
    return x >= 640 && x < 1024;
  };

  const isLowPerfDevice = () => {
    if (typeof window === 'undefined') return false;
    try {
      const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduce) return true;
      const cores = (navigator.hardwareConcurrency || 8) <= 4;
      const mem = (navigator.deviceMemory || 8) <= 4;
      return cores && mem;
    } catch (_) {
      return false;
    }
  };

  const calcProgress = (scrollTop, start, end) => {
    if (end - start <= 0) return scrollTop >= end ? 1 : 0;
    if (scrollTop < start) return 0;
    if (scrollTop > end) return 1;
    return (scrollTop - start) / (end - start);
  };

  const pct = (v, containerHeight) => {
    if (typeof v === 'string' && v.indexOf('%') >= 0) return (parseFloat(v) / 100) * containerHeight;
    return parseFloat(v);
  };

  const raf = (typeof window !== 'undefined' && window.requestAnimationFrame) || function (cb) { return setTimeout(cb, 16); };
  const caf = (typeof window !== 'undefined' && window.cancelAnimationFrame)  || function (id) { clearTimeout(id); };

  /* ---------------------- 响应式参数解析 ---------------------- */
  function resolveActiveProps(options, viewportW, containerHeight, lowPerf) {
    const mobile = isMobileViewport(viewportW);
    const opts = options || {};
    const desktopPresets = {
      itemDistance:       typeof opts.itemDistance       === 'number' ? opts.itemDistance       : 60,
      itemScale:          typeof opts.itemScale          === 'number' ? opts.itemScale          : 0.022,
      itemStackDistance:  typeof opts.itemStackDistance  === 'number' ? opts.itemStackDistance  : 16,
      stackPositionPx:    pct(opts.stackPosition     || '18%', containerHeight),
      scaleEndPositionPx: pct(opts.scaleEndPosition  || '10%', containerHeight),
      baseScale:          typeof opts.baseScale          === 'number' ? opts.baseScale          : 0.86,
      blur:               lowPerf ? 0 : (typeof opts.blurAmount === 'number' ? opts.blurAmount : 1.0),
      rotation:           lowPerf ? 0 : (typeof opts.rotationAmount === 'number' ? opts.rotationAmount : 0.3)
    };
    const mobilePresets = {
      itemDistance:       typeof opts.itemDistanceMobile      === 'number' ? opts.itemDistanceMobile      : 28,
      itemScale:          typeof opts.itemScaleMobile         === 'number' ? opts.itemScaleMobile         : 0.018,
      itemStackDistance:  typeof opts.itemStackDistanceMobile === 'number' ? opts.itemStackDistanceMobile : 10,
      stackPositionPx:    pct(opts.stackPositionMobile     || '14%', containerHeight),
      scaleEndPositionPx: pct(opts.scaleEndPositionMobile  || '6%',  containerHeight),
      baseScale:          typeof opts.baseScaleMobile         === 'number' ? opts.baseScaleMobile         : 0.9,
      blur:               lowPerf ? 0 : (typeof opts.blurAmountMobile === 'number' ? opts.blurAmountMobile : 0.5),
      rotation:           0
    };
    const active = mobile ? mobilePresets : desktopPresets;
    return Object.assign({}, active, { isMobile: mobile, lowPerf: lowPerf });
  }

  /* ---------------------- createScrollStack ---------------------- */
  function createScrollStack(arg) {
    if (!arg || !arg.container) throw new Error('[ScrollStack] options.container 不能为空');
    const container = arg.container;
    const userCards = (arg.cards || []).filter(Boolean);
    if (!userCards.length) throw new Error('[ScrollStack] options.cards 需要至少 1 张卡片');

    const options = Object.assign({
      useWindowScroll: false,
      cardHeightMode: 'content',
      respectReducedMotion: true,
      maxCardsWithBlur: 8,
      mobileDisableLenis: true,
      onStackComplete: null,
      // v2 新增：外层父组件是 ai-practice-wrap（黑灰背景 + 圆角24 + 阴影）时
      // 不要让 scroller 再重复写背景，继承外层即可
      inheritOuterStyle: false
    }, arg.options || {});

    const heightModeClass = options.cardHeightMode === 'content' ? 'scroll-stack--content-height' : '';
    const winScrollClass  = options.useWindowScroll ? 'scroll-stack--use-window-scroll' : '';
    const inheritClass    = options.inheritOuterStyle ? 'scroll-stack--inherit-outer' : '';
    container.className   = [
      'scroll-stack-scroller',
      heightModeClass, winScrollClass, inheritClass,
      (container.className || '')
    ].filter(Boolean).join(' ');

    container.innerHTML = '';
    const inner = document.createElement('div');
    inner.className = 'scroll-stack-inner';
    container.appendChild(inner);

    const cardEls = [];
    userCards.forEach(function (domCard) {
      if (domCard && domCard.nodeType === 1) {
        domCard.classList.add('scroll-stack-card');
        if (options.cardHeightMode === 'content') domCard.classList.add('scroll-stack-card--content');
        inner.appendChild(domCard);
        cardEls.push(domCard);
      }
    });
    const endSpacer = document.createElement('div');
    endSpacer.className = 'scroll-stack-end';
    endSpacer.setAttribute('aria-hidden', 'true');
    inner.appendChild(endSpacer);

    const state = {
      cards: cardEls,
      endEl: endSpacer,
      scroller: container,
      viewport: {
        w: typeof window !== 'undefined' ? window.innerWidth : 0,
        h: typeof window !== 'undefined' ? window.innerHeight : 0
      },
      lowPerf: options.respectReducedMotion && isLowPerfDevice(),
      lastTransforms: new Map(),
      isUpdating: false,
      stackCompleted: false,
      rafId: 0,
      resizeRaf: 0,
      detached: false
    };

    function getScrollData() {
      if (options.useWindowScroll) {
        return {
          scrollTop: window.scrollY || window.pageYOffset || 0,
          containerHeight: window.innerHeight || 0,
          scrollContainer: document.documentElement
        };
      }
      const s = state.scroller;
      return {
        scrollTop: s ? s.scrollTop : 0,
        containerHeight: s ? s.clientHeight : 0,
        scrollContainer: s
      };
    }
    function getElementOffset(el) {
      if (!el) return 0;
      if (options.useWindowScroll) {
        const r = el.getBoundingClientRect();
        return r.top + (window.scrollY || window.pageYOffset || 0);
      }
      return el.offsetTop;
    }

    function applyCardMarginsAndClass() {
      const sd = getScrollData();
      const active = resolveActiveProps(options, state.viewport.w, sd.containerHeight, state.lowPerf);
      state.cards.forEach(function (card, i) {
        if (i < state.cards.length - 1) card.style.marginBottom = active.itemDistance + 'px';
        if (options.cardHeightMode === 'content') card.classList.add('scroll-stack-card--content');
        if (active.isMobile) card.classList.add('scroll-stack-card--mobile');
        else                 card.classList.remove('scroll-stack-card--mobile');
        card.style.transformOrigin = 'top center';
        card.style.backfaceVisibility = 'hidden';
        // 关键：预先设置为 baseScale 的 transform，避免第一帧 JS 计算之前卡片先 scale=1 再缩 → 抖
        const preset = 'translate3d(0,0,0) scale(' + active.baseScale + ')';
        card.style.transform = preset;
        card.style.webkitTransform = preset;
        if (!card.getAttribute('data-wc')) card.setAttribute('data-wc', '0');
      });
      return active;
    }

    function updateTransforms() {
      if (state.detached) return;
      if (!state.cards.length || state.isUpdating) return;
      state.isUpdating = true;

      const sd = getScrollData();
      const active = resolveActiveProps(options, state.viewport.w, sd.containerHeight, state.lowPerf);
      const {
        itemStackDistance, stackPositionPx, scaleEndPositionPx,
        baseScale, itemScale, blur: activeBlurAmount, rotation: rotationAmount, lowPerf
      } = active;

      const scrollTop = sd.scrollTop;
      const endTop = getElementOffset(state.endEl);
      const cardCount = state.cards.length;
      const maxCardsWithBlur = options.maxCardsWithBlur | 0;

      let topCardIndex = -1;
      if (activeBlurAmount > 0 && cardCount <= maxCardsWithBlur) {
        for (let j = 0; j < cardCount; j++) {
          const cTop = getElementOffset(state.cards[j]);
          const jTrigger = cTop - stackPositionPx - itemStackDistance * j;
          if (scrollTop >= jTrigger) topCardIndex = j;
        }
      }

      for (let i = 0; i < cardCount; i++) {
        const card = state.cards[i];
        if (!card) continue;

        const cardTop = getElementOffset(card);
        const triggerStart = cardTop - stackPositionPx - itemStackDistance * i;
        const triggerEnd   = cardTop - scaleEndPositionPx;
        const pinStart = triggerStart;
        const pinEnd   = Math.max(triggerEnd, endTop - sd.containerHeight * 0.5);

        const scaleProgress = calcProgress(scrollTop, triggerStart, triggerEnd);
        const targetScale = baseScale + i * itemScale;
        const scale = 1 - scaleProgress * (1 - targetScale);
        const rotation = (!lowPerf && rotationAmount) ? i * rotationAmount * scaleProgress : 0;

        let blur = 0;
        if (activeBlurAmount > 0 && topCardIndex >= 0 && i < topCardIndex && cardCount <= maxCardsWithBlur) {
          blur = (topCardIndex - i) * activeBlurAmount;
        }

        let translateY = 0;
        if (scrollTop >= pinStart && scrollTop <= pinEnd) {
          translateY = scrollTop - cardTop + stackPositionPx + itemStackDistance * i;
        } else if (scrollTop > pinEnd) {
          translateY = pinEnd - cardTop + stackPositionPx + itemStackDistance * i;
        }

        const t = {
          ty:  Math.round(translateY * 10) / 10,
          sc:  Math.round(scale * 1000) / 1000,
          rot: Math.round(rotation * 10) / 10,
          bl:  Math.round(blur * 10) / 10
        };

        const last = state.lastTransforms.get(i);
        const changed =
          !last ||
          Math.abs(last.ty  - t.ty)  > 0.1 ||
          Math.abs(last.sc  - t.sc)  > 0.001 ||
          Math.abs(last.rot - t.rot) > 0.1 ||
          Math.abs(last.bl  - t.bl)  > 0.1;

        if (changed) {
          const transform = 'translate3d(0,' + t.ty + 'px,0) scale(' + t.sc + ') rotate(' + t.rot + 'deg)';
          card.style.transform = transform;
          if (t.bl > 0) card.style.filter = 'blur(' + t.bl + 'px)';
          else if (card.style.filter) card.style.filter = '';

          const pinnedNow = scrollTop >= pinStart - 50 && scrollTop <= pinEnd + 50;
          const wc = card.getAttribute('data-wc');
          if (pinnedNow && wc !== '1') {
            card.style.willChange = 'transform, filter';
            card.setAttribute('data-wc', '1');
          } else if (!pinnedNow && wc === '1') {
            card.style.willChange = 'auto';
            card.setAttribute('data-wc', '0');
          }
          state.lastTransforms.set(i, t);
        }

        if (i === cardCount - 1 && typeof options.onStackComplete === 'function') {
          const inView = scrollTop >= pinStart && scrollTop <= pinEnd;
          if (inView && !state.stackCompleted) {
            state.stackCompleted = true;
            try { options.onStackComplete(); } catch(_) {}
          } else if (!inView && state.stackCompleted) {
            state.stackCompleted = false;
          }
        }
      }
      state.isUpdating = false;
    }

    function scheduleUpdate() {
      if (state.rafId) caf(state.rafId);
      state.rafId = raf(updateTransforms);
    }

    const scrollTarget = options.useWindowScroll ? window : state.scroller;
    const scrollHandler = function () { scheduleUpdate(); };
    if (scrollTarget.addEventListener) scrollTarget.addEventListener('scroll', scrollHandler, { passive: true });

    function resizeHandler() {
      if (state.resizeRaf) caf(state.resizeRaf);
      state.resizeRaf = raf(function () {
        state.viewport.w = window.innerWidth;
        state.viewport.h = window.innerHeight;
        state.lowPerf = options.respectReducedMotion && isLowPerfDevice();
        applyCardMarginsAndClass();
        state.lastTransforms.clear();
        updateTransforms();
      });
    }
    window.addEventListener('resize', resizeHandler, { passive: true });
    window.addEventListener('orientationchange', resizeHandler, { passive: true });
    if (window.visualViewport && window.visualViewport.addEventListener) {
      window.visualViewport.addEventListener('resize', resizeHandler, { passive: true });
    }

    // 初次：先设置好预设 transform + margins，等两帧 layout 稳定后再执行 update
    applyCardMarginsAndClass();
    (function prime() {
      raf(function () {
        raf(function () {
          updateTransforms();
          // 给卡片一个进场淡入（流畅自然）：初始 opacity 0，下一帧加 is-ready → opacity 1
          state.cards.forEach(function (card, idx) {
            card.style.opacity = '0';
            card.style.transition = 'opacity 420ms cubic-bezier(0.22, 1, 0.36, 1) ' + (40 * Math.min(idx, 12)) + 'ms, transform 0ms, filter 0ms';
            raf(function () {
              if (state.detached) return;
              card.style.opacity = '1';
              card.classList.add('ss-card-ready');
              // 进场过渡结束后清理 transition，保留后面的 hover 样式动画
              setTimeout(function () {
                if (state.detached || !card.isConnected) return;
                card.style.transition = '';
              }, 520 + 40 * Math.min(idx, 12));
            });
          });
        });
      });
    })();

    function destroy() {
      if (state.detached) return;
      state.detached = true;
      if (state.rafId) caf(state.rafId);
      if (state.resizeRaf) caf(state.resizeRaf);
      if (scrollTarget.removeEventListener) scrollTarget.removeEventListener('scroll', scrollHandler);
      window.removeEventListener('resize', resizeHandler);
      window.removeEventListener('orientationchange', resizeHandler);
      if (window.visualViewport && window.visualViewport.removeEventListener) {
        window.visualViewport.removeEventListener('resize', resizeHandler);
      }
      state.lastTransforms.clear();
    }

    return { destroy: destroy, _updateTransforms: updateTransforms };
  }

  /* ---------------------- 构建"ai-card 风格"证书卡片（与上方3个栏目一致） ---------------------- */
  function buildCertAICard(cert, idx) {
    const card = document.createElement('div');
    // 复用上方 3 个栏目的 ai-card 类名（直接继承全局 CSS 的 hover overlay / ai-card-num / ai-popup-img 等）
    card.className = 'ai-card scroll-stack-card scroll-stack-card--content cert-ai-card';
    card.setAttribute('role', 'article');
    card.setAttribute('aria-label', cert.name || ('证书 ' + (idx + 1)));

    // 1) 白色渐变扫过效果（直接与 AI 实战栏目复用 .ai-card-overlay 样式）
    const overlay = document.createElement('div');
    overlay.className = 'ai-card-overlay';
    // 复用样式前，栏目原 CSS 已经给 .ai-card:hover .ai-card-overlay::before 写好了扫过动画
    card.appendChild(overlay);

    // 2) 编号（三列布局第一列：ai-card-num）
    const num = document.createElement('div');
    num.className = 'ai-card-num';
    num.textContent = (idx + 1 < 10 ? '0' : '') + (idx + 1);
    card.appendChild(num);

    // 3) 正文：标题 + desc + tag（三列布局第二列）
    const body = document.createElement('div');
    body.className = 'ai-card-body';

    const title = document.createElement('div');
    title.className = 'ai-card-title';
    title.textContent = cert.name || '';
    body.appendChild(title);

    const descRow = document.createElement('div');
    descRow.className = 'cert-ai-card-desc-row';
    if (cert.tag) {
      const tag = document.createElement('span');
      tag.className = 'cert-ai-card-tag';
      tag.textContent = cert.tag;
      descRow.appendChild(tag);
    }
    if (cert.desc) {
      const desc = document.createElement('div');
      desc.className = 'ai-card-desc cert-ai-card-desc';
      desc.textContent = cert.desc;
      descRow.appendChild(desc);
    }
    body.appendChild(descRow);

    card.appendChild(body);

    // 4) 日期/机构（三列布局第三列：ai-card-date）
    const dateEl = document.createElement('div');
    dateEl.className = 'ai-card-date';
    dateEl.textContent = cert.date || (cert.tag ? cert.tag : '');
    card.appendChild(dateEl);

    // 5) hover 旋转弹出缩略图（与 AI 实战栏目一致的 ai-popup-img）
    const popup = document.createElement('div');
    popup.className = 'ai-popup-img cert-ai-popup-img';
    // 初始不挂背景图，等鼠标移入再写入，避免一次性加载 6 张缩略图占内存
    popup.setAttribute('data-cert-image', cert.image || '');
    popup.setAttribute('aria-hidden', 'true');
    card.appendChild(popup);

    // ----- 交互：鼠标移动更新 ai-popup-img 位置，hover 时加背景图 -----
    function applyPopupBg() {
      if (popup._bgApplied) return;
      popup._bgApplied = true;
      if (cert.image) {
        popup.style.background = '#fafafa url("' + cert.image + '") center/cover no-repeat';
        popup.style.backgroundSize = 'cover';
      }
    }
    function showPopup(e) {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left);
      const y = (e.clientY - rect.top);
      popup.style.left = x + 'px';
      popup.style.top  = y + 'px';
      popup.style.opacity = '1';
      popup.style.transform = 'translate(-50%, -50%) rotate(0deg) scale(1)';
    }
    function hidePopup() {
      popup.style.opacity = '0';
      popup.style.transform = 'translate(-50%, -50%) rotate(-20deg) scale(0.5)';
    }
    // 鼠标拖拽位移判断（避免内部拖拽滚动时触发点击）
    let downX = 0, downY = 0, moved = false;
    card.addEventListener('mousedown', function (e) { downX = e.clientX || 0; downY = e.clientY || 0; moved = false; });
    card.addEventListener('mousemove', function (e) {
      if (Math.abs((e.clientX || 0) - downX) > 4 || Math.abs((e.clientY || 0) - downY) > 4) moved = true;
      applyPopupBg();
      showPopup(e);
    });
    card.addEventListener('mouseleave', function () {
      hidePopup();
    });
    card.addEventListener('mouseenter', function (e) {
      applyPopupBg();
      showPopup(e);
    });

    // 点击 → 用页面全局的 #imageModal 显示大图（与原网格卡片、AI实战预览弹窗保持一致）
    card.addEventListener('click', function (ev) {
      if (moved) return;
      if (ev.target && ev.target.closest('a')) return;
      if (cert.href) {
        try {
          if (cert.href.indexOf('http') === 0 || cert.href.indexOf('/') === 0 || cert.href.indexOf('#') === 0) {
            window.open(cert.href, '_blank', 'noopener');
          } else { location.href = cert.href; }
          return;
        } catch(_) {
          window.open(cert.href, '_blank', 'noopener');
          return;
        }
      }
      if (!cert.image) return;
      try {
        var modal = document.getElementById('imageModal');
        var mi = document.getElementById('modalImage');
        if (modal && mi) {
          modal.style.display = 'flex';
          mi.src = cert.image;
        } else {
          window.open(cert.image, '_blank', 'noopener');
        }
      } catch (_) {
        window.open(cert.image, '_blank', 'noopener');
      }
    });

    return card;
  }

  /* ---------------------- initCertStack ---------------------- */
  function initCertStack(selectorOrEl, items, extraOpts) {
    let host;
    if (typeof selectorOrEl === 'string') host = document.querySelector(selectorOrEl);
    else if (selectorOrEl && selectorOrEl.nodeType === 1) host = selectorOrEl;
    if (!host) {
      console.warn('[initCertStack] 找不到容器:', selectorOrEl);
      return { destroy: function () {} };
    }
    extraOpts = extraOpts || {};
    const unified = !!extraOpts.unifiedPortfolioMode;
    const scrollerMount = document.createElement('div');
    scrollerMount.className = 'cert-stack-scroller-mount';
    // v2：unified 模式下，scroller 直接挂在外层 ai-practice-wrap 内部（黑背景继承外层）
    //      不统一模式下（旧 CertStackSection），scroller 自己写背景 + 圆角（保持向后兼容）
    if (unified) scrollerMount.classList.add('cert-stack--unified');
    else          scrollerMount.classList.add('cert-stack--standalone');

    // 高度：桌面端 76vh，平板 74vh，手机 74vh（更紧凑，与上面栏目视觉高度一致）
    Object.assign(scrollerMount.style, {
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      height: '76vh',
      maxHeight: '820px',
      minHeight: '480px',
      paddingTop: 'calc(1.25rem + env(safe-area-inset-top, 0))',
      paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0))'
    });
    const scrollerEl = document.createElement('div');
    scrollerEl.className = 'scroll-stack-scroller cert-stack-scroller';
    Object.assign(scrollerEl.style, {
      flex: '1 1 auto',
      minHeight: '0',
      // unified 模式下 scroller 背景透明，不抢 ai-practice-wrap 的黑灰背景
      background: unified ? 'transparent' : '',
      boxShadow: 'none',
      borderRadius: '0'
    });
    scrollerMount.appendChild(scrollerEl);

    // 把 #certsGrid 替换为我们创建的 mount（保持原 DOM 结构简单）
    if (host.parentNode) host.parentNode.insertBefore(scrollerMount, host);
    host.remove ? host.remove() : (host.parentNode && host.parentNode.removeChild(host));

    // 卡片渲染：统一使用 ai-card 风格
    const cards = (items || []).map(function (c, i) { return buildCertAICard(c, i); });

    // 堆叠配置（统一模式下额外强制 cardHeightMode=content，inheritOuterStyle=true）
    const createOpts = Object.assign({
      cardHeightMode: 'content',
      useWindowScroll: !!(extraOpts.useWindowScroll),
      inheritOuterStyle: unified,
      respectReducedMotion: true,
      maxCardsWithBlur: 8,
      onStackComplete: extraOpts.onStackAll || null
    }, extraOpts || {});

    const inst = createScrollStack({
      container: scrollerEl,
      cards: cards,
      options: createOpts
    });

    // 手机端动态缩一下 mount 高度（与断点一致）
    function syncMountHeight() {
      const w = window.innerWidth || 1024;
      if (w < 640) {
        scrollerMount.style.height = '74vh';
        scrollerMount.style.maxHeight = 'none';
        scrollerMount.style.minHeight = '420px';
        scrollerMount.style.paddingTop = 'calc(0.5rem + env(safe-area-inset-top, 0))';
        scrollerMount.style.paddingBottom = 'calc(0.5rem + env(safe-area-inset-bottom, 0))';
      } else if (w < 1024) {
        scrollerMount.style.height = '76vh';
        scrollerMount.style.maxHeight = '760px';
        scrollerMount.style.minHeight = '480px';
      } else {
        scrollerMount.style.height = '76vh';
        scrollerMount.style.maxHeight = '820px';
        scrollerMount.style.minHeight = '480px';
      }
    }
    syncMountHeight();
    const winResize = function () { syncMountHeight(); try { inst._updateTransforms(); } catch(_) {} };
    window.addEventListener('resize', winResize, { passive: true });
    window.addEventListener('orientationchange', winResize, { passive: true });

    return {
      destroy: function () {
        try { inst.destroy(); } catch(_) {}
        window.removeEventListener('resize', winResize);
        window.removeEventListener('orientationchange', winResize);
        try {
          if (scrollerMount.parentNode) scrollerMount.parentNode.removeChild(scrollerMount);
        } catch(_) {}
      }
    };
  }

  global.createScrollStack = createScrollStack;
  global.initCertStack    = initCertStack;

})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
