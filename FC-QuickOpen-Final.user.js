// ==UserScript==
// @name         FC Quick Open Final
// @namespace    fc-quick-open-final
// @version      1.1
// @description  Native EA Open + Quick Open with press effect and broader animation skip
// @match        https://www.ea.com/ea-sports-fc/ultimate-team/web-app/*
// @match        https://www.ea.com/*/ea-sports-fc/ultimate-team/web-app/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    const WRAPPER_CLASS = 'fcqo-final-wrapper';
    const PATCHED = 'data-fcqo-final';

    let quickMode = false;
    let hookInstalled = false;

    // =========================================================
    // 1. PACK ANIMATION SKIP
    // =========================================================

    function installAnimationHook() {

        if (hookInstalled) {
            return true;
        }

        let Controller = null;

        try {
            Controller =
                window.UTPackAnimationViewController ||
                (
                    typeof UTPackAnimationViewController !== 'undefined'
                        ? UTPackAnimationViewController
                        : null
                );
        } catch (_) {}

        if (
            !Controller ||
            !Controller.prototype ||
            typeof Controller.prototype.runAnimation !== 'function'
        ) {
            return false;
        }

        const proto = Controller.prototype;
        const originalRunAnimation = proto.runAnimation;

        proto.runAnimation = function () {

            if (!quickMode) {
                return originalRunAnimation.apply(
                    this,
                    arguments
                );
            }

            if (this.running) {
                return;
            }

            this.running = true;

            try {

                const view =
                    typeof this.getView === 'function'
                        ? this.getView()
                        : null;

                if (view) {

                    try {
                        if (typeof view.setPackTier === 'function') {
                            view.setPackTier(this.packTier);
                        }
                    } catch (_) {}

                    try {
                        if (typeof view.generateItem === 'function') {
                            view.generateItem(this.presentedItem);
                        }
                    } catch (_) {}
                }

                /*
                 * Don't run the visual animation.
                 * Continue immediately.
                 */
                this.animationTimeout =
                    window.setTimeout(
                        () => {

                            try {

                                if (typeof this.runCallback === 'function') {
                                    this.runCallback();
                                }

                            } finally {
                                quickMode = false;
                            }

                        },
                        0
                    );

                return;

            } catch (error) {

                console.error(
                    '[FC Quick Open] skip failed',
                    error
                );

                quickMode = false;

                return originalRunAnimation.apply(
                    this,
                    arguments
                );
            }
        };

        hookInstalled = true;

        console.log(
            '✅ FC Quick Open animation hook ready'
        );

        return true;
    }

    setInterval(
        installAnimationHook,
        250
    );

    // =========================================================
    // 2. HELPERS
    // =========================================================

    function text(el) {

        return (
            el?.innerText ||
            el?.textContent ||
            ''
        )
            .replace(/\s+/g, ' ')
            .trim()
            .toLowerCase();
    }

    function visible(el) {

        if (!el) return false;

        const rect =
            el.getBoundingClientRect();

        return (
            rect.width > 150 &&
            rect.height > 35
        );
    }

    function belongsToPack(openButton) {

        let node =
            openButton.parentElement;

        for (
            let i = 0;
            i < 8 && node;
            i++
        ) {

            const t =
                text(node);

            if (
                t.includes('pack') &&
                (
                    t.includes('items') ||
                    t.includes('players') ||
                    t.includes('rare') ||
                    t.includes('mixed')
                )
            ) {
                return true;
            }

            node =
                node.parentElement;
        }

        return false;
    }

    // =========================================================
    // 3. TURN EA'S REAL OPEN INTO OPEN | QUICK OPEN
    // =========================================================

    function patchOpenButton(openButton) {

        if (
            !openButton ||
            openButton.hasAttribute(PATCHED)
        ) {
            return;
        }

        openButton.setAttribute(
            PATCHED,
            '1'
        );

        const parent =
            openButton.parentElement;

        if (!parent) return;

        const wrapper =
            document.createElement('div');

        wrapper.className =
            WRAPPER_CLASS;

        wrapper.style.cssText = `
            position: relative !important;
            display: flex !important;
            width: 100% !important;
            height: 54px !important;
            gap: 10px !important;
            align-items: stretch !important;
        `;

        parent.insertBefore(
            wrapper,
            openButton
        );

        wrapper.appendChild(
            openButton
        );

        /*
         * EA's REAL Open button stays over the whole area,
         * invisible, so the user's real tap reaches EA.
         */
        openButton.style.setProperty(
            'position',
            'absolute',
            'important'
        );

        openButton.style.setProperty(
            'inset',
            '0',
            'important'
        );

        openButton.style.setProperty(
            'width',
            '100%',
            'important'
        );

        openButton.style.setProperty(
            'height',
            '100%',
            'important'
        );

        openButton.style.setProperty(
            'opacity',
            '0',
            'important'
        );

        openButton.style.setProperty(
            'z-index',
            '10',
            'important'
        );

        openButton.style.setProperty(
            'cursor',
            'pointer',
            'important'
        );

        // =========================
        // VISUAL OPEN
        // =========================

        const openVisual =
            document.createElement('div');

        openVisual.textContent =
            'Open';

        openVisual.style.cssText = `
            flex: 1 1 0 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            border-radius: 28px !important;
            background:
                linear-gradient(
                    180deg,
                    rgb(52,185,210) 0%,
                    rgb(82,118,206) 55%,
                    rgb(102,79,203) 100%
                ) !important;
            color: white !important;
            font-size: 18px !important;
            font-weight: 700 !important;
            font-family: inherit !important;
            pointer-events: none !important;
            user-select: none !important;
            transition:
                transform 0.08s ease,
                filter 0.08s ease,
                opacity 0.08s ease !important;
        `;

        // =========================
        // VISUAL QUICK OPEN
        // =========================

        const quickVisual =
            document.createElement('div');

        quickVisual.textContent =
            'Quick Open';

        quickVisual.style.cssText = `
            flex: 1 1 0 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            border-radius: 28px !important;
            background:
                linear-gradient(
                    180deg,
                    rgb(52,185,210) 0%,
                    rgb(82,118,206) 55%,
                    rgb(102,79,203) 100%
                ) !important;
            color: white !important;
            font-size: 18px !important;
            font-weight: 700 !important;
            font-family: inherit !important;
            pointer-events: none !important;
            user-select: none !important;
            transition:
                transform 0.08s ease,
                filter 0.08s ease,
                opacity 0.08s ease !important;
        `;

        wrapper.appendChild(
            openVisual
        );

        wrapper.appendChild(
            quickVisual
        );

        // =====================================================
        // 4. PRESS EFFECT
        // =====================================================

        function pressOn(el) {
            el.style.transform = 'scale(0.97)';
            el.style.filter = 'brightness(0.72)';
            el.style.opacity = '0.92';
        }

        function pressOff() {
            openVisual.style.transform = 'scale(1)';
            openVisual.style.filter = 'brightness(1)';
            openVisual.style.opacity = '1';

            quickVisual.style.transform = 'scale(1)';
            quickVisual.style.filter = 'brightness(1)';
            quickVisual.style.opacity = '1';
        }

        function getTapX(event) {

            if (
                typeof event.clientX === 'number' &&
                event.clientX > 0
            ) {
                return event.clientX;
            }

            if (
                event.touches &&
                event.touches.length
            ) {
                return event.touches[0].clientX;
            }

            return null;
        }

        function setModeAndPress(event) {

            const rect =
                wrapper.getBoundingClientRect();

            const x =
                getTapX(event);

            if (x === null) return;

            const middle =
                rect.left +
                rect.width / 2;

            if (x >= middle) {

                installAnimationHook();

                quickMode = true;

                pressOn(
                    quickVisual
                );

                console.log(
                    '⚡ Quick Open'
                );

            } else {

                quickMode = false;

                pressOn(
                    openVisual
                );

                console.log(
                    '📦 Normal Open'
                );
            }
        }

        // =====================================================
        // 5. REAL USER TAP
        // =====================================================

        openButton.addEventListener(
            'pointerdown',
            setModeAndPress,
            true
        );

        openButton.addEventListener(
            'touchstart',
            setModeAndPress,
            true
        );

        openButton.addEventListener(
            'mousedown',
            setModeAndPress,
            true
        );

        openButton.addEventListener(
            'pointerup',
            pressOff,
            true
        );

        openButton.addEventListener(
            'pointercancel',
            pressOff,
            true
        );

        openButton.addEventListener(
            'touchend',
            pressOff,
            true
        );

        openButton.addEventListener(
            'mouseup',
            pressOff,
            true
        );

        openButton.addEventListener(
            'mouseleave',
            pressOff,
            true
        );

        /*
         * Keep quick mode alive long enough
         * for EA to load slower/bigger packs.
         */
        openButton.addEventListener(
            'click',
            () => {

                setTimeout(
                    pressOff,
                    120
                );

                setTimeout(
                    () => {
                        quickMode = false;
                    },
                    15000
                );

            },
            false
        );
    }

    // =========================================================
    // 6. FIND EA OPEN BUTTONS
    // =========================================================

    function scan() {

        document
            .querySelectorAll(
                'button, [role="button"]'
            )
            .forEach(el => {

                if (
                    el.hasAttribute(PATCHED)
                ) {
                    return;
                }

                if (
                    text(el) !== 'open'
                ) {
                    return;
                }

                if (!visible(el)) {
                    return;
                }

                if (!belongsToPack(el)) {
                    return;
                }

                patchOpenButton(el);
            });
    }

    let scanQueued =
        false;

    const observer =
        new MutationObserver(() => {

            if (scanQueued) {
                return;
            }

            scanQueued =
                true;

            requestAnimationFrame(
                () => {

                    scanQueued =
                        false;

                    scan();
                }
            );
        });

    function start() {

        if (!document.body) {

            setTimeout(
                start,
                100
            );

            return;
        }

        observer.observe(
            document.body,
            {
                childList: true,
                subtree: true
            }
        );

        scan();
    }

    start();

    console.log(
        '✅ FC Quick Open Final loaded'
    );

})();