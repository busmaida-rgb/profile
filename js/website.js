(() => {
    const mockups = Array.from(document.querySelectorAll('.case-feature img'), (image) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'case-feature__crossfade';
        if (image.classList.contains('case-feature__laptop')) {
            wrapper.classList.add('case-feature__laptop');
        }

        const overlay = image.cloneNode(false);
        overlay.removeAttribute('id');
        overlay.classList.add('case-feature__overlay');
        overlay.alt = '';
        overlay.setAttribute('aria-hidden', 'true');
        overlay.loading = 'eager';
        overlay.src = image.getAttribute('src').replace(/(\.[^/.]+)$/, '2$1');

        image.before(wrapper);
        wrapper.append(image, overlay);
        return overlay;
    });

    if (!mockups.length) return;

    let showAlternate = false;
    window.setInterval(() => {
        if (!mockups.every((image) => image.complete && image.naturalWidth > 0)) return;

        showAlternate = !showAlternate;
        mockups.forEach((image) => {
            image.classList.toggle('is-visible', showAlternate);
        });
    }, 3000);
})();

// 각 프로젝트의 시작 위치와 하단 사이에서만 사이트 버튼을 이동합니다.
(() => {
    const page = document.querySelector('.website-case');
    if (!page) return;
    const links = Array.from(page.querySelectorAll('.case-links, .marun-link'));
    page.classList.add('has-bounded-links');

    function updateLinks() {
        const positions = links.map((link) => {
            const section = link.parentElement;
            const bounds = section.getBoundingClientRect();
            // Padding also reserves the same inset below the visible buttons.
            const inset = parseFloat(getComputedStyle(link).paddingBottom) || 0;
            const origin = link.offsetTop;
            const maximum = Math.max(0, section.clientHeight - origin - link.offsetHeight);
            return Math.min(maximum, Math.max(0, inset - bounds.top - origin));
        });
        links.forEach((link, index) => {
            link.style.transform = `translateY(${positions[index]}px)`;
        });
    }

    window.addEventListener('scroll', updateLinks, { passive: true });
    window.addEventListener('resize', updateLinks, { passive: true });
    window.addEventListener('pageshow', updateLinks);
    const observer = new ResizeObserver(updateLinks);
    links.forEach((link) => {
        observer.observe(link.parentElement);
        observer.observe(link);
    });
    document.fonts.ready.then(updateLinks);
    updateLinks();
})();

// PC 휠 입력만 부드럽게 보간합니다. 터치 스크롤과 접근성 설정은 브라우저 기본 동작을 유지합니다.
(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = window.matchMedia('(pointer: fine)');
    const easing = 0.08;
    let currentScroll = window.scrollY;
    let targetScroll = currentScroll;
    let animationFrame;
    let isAnimating = false;

    function getMaxScroll() {
        return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    }

    function stopSmoothScroll() {
        if (animationFrame) {
            window.cancelAnimationFrame(animationFrame);
            animationFrame = undefined;
        }

        currentScroll = window.scrollY;
        targetScroll = currentScroll;
        isAnimating = false;
    }

    window.addEventListener('pageshow', stopSmoothScroll);

    function animateScroll() {
        currentScroll += (targetScroll - currentScroll) * easing;

        if (Math.abs(targetScroll - currentScroll) < 0.5) {
            currentScroll = targetScroll;
            window.scrollTo(0, currentScroll);
            animationFrame = undefined;
            isAnimating = false;
            return;
        }

        window.scrollTo(0, currentScroll);
        animationFrame = window.requestAnimationFrame(animateScroll);
    }

    function getWheelDelta(event) {
        if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) return event.deltaY * 16;
        if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) return event.deltaY * window.innerHeight;
        return event.deltaY;
    }

    window.addEventListener('wheel', (event) => {
        if (document.querySelector('.image-modal[open]')) return;
        if (reducedMotion.matches || !finePointer.matches || event.ctrlKey || event.shiftKey) return;

        event.preventDefault();

        if (!isAnimating) {
            currentScroll = window.scrollY;
            targetScroll = currentScroll;
            isAnimating = true;
        }

        targetScroll = Math.min(Math.max(targetScroll + getWheelDelta(event), 0), getMaxScroll());

        if (!animationFrame) {
            animationFrame = window.requestAnimationFrame(animateScroll);
        }
    }, { passive: false });

    window.addEventListener('scroll', () => {
        if (!isAnimating) {
            currentScroll = window.scrollY;
            targetScroll = currentScroll;
        }
    }, { passive: true });

    window.addEventListener('pointerdown', stopSmoothScroll, { passive: true });
    window.addEventListener('keydown', stopSmoothScroll);
    window.addEventListener('resize', () => {
        targetScroll = Math.min(targetScroll, getMaxScroll());
    }, { passive: true });

    reducedMotion.addEventListener('change', stopSmoothScroll);
})();

(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    document.querySelectorAll('.case-footer a[href^="#"]').forEach((link) => {
        link.addEventListener('click', (event) => {
            const target = document.querySelector(link.getAttribute('href'));
            if (!target) return;
            event.preventDefault();
            target.scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'start' });
        });
    });
    document.querySelector('[data-close-tab]')?.addEventListener('click', () => {
        window.close();
        window.setTimeout(() => {
            document.querySelector('.case-close-message').hidden = false;
        }, 200);
    });
})();
