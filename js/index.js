// 배경의 sticky 경계 안에서만 본문을 표시합니다. 별도 스크롤 영역은 만들지 않습니다.
(() => {
    const panel = document.querySelector('.profile-content__details');
    const body = panel?.querySelector('.profile-content__body');
    const media = document.querySelector('.profile-content__media');
    const content = panel?.closest('.profile-content');
    const mobileLayout = window.matchMedia('(max-width: 1024px)');
    if (!panel || !body) return;
    let frame;

    function updateClip() {
        frame = undefined;
        const rect = panel.getBoundingClientRect();
        const bodyRect = body.getBoundingClientRect();
        const background = getComputedStyle(panel, '::before');
        const inset = parseFloat(background.top);
        const height = Math.min(rect.height, parseFloat(background.height));
        const top = Math.min(Math.max(rect.top, inset), rect.bottom - height);
        const visibleTop = Math.max(top, inset);
        const revealTop = Math.min(rect.height, Math.max(0, visibleTop - rect.top));
        // PC는 하단 40px, 모바일은 하단 24px 위에서부터 배경을 드러냅니다.
        const revealBottom = Math.min(rect.height - revealTop, Math.max(0, rect.bottom - (window.innerHeight - inset)));
        const contentStyle = getComputedStyle(body);
        const visibleBottom = Math.min(top + height, window.innerHeight - inset);
        // 등장 중과 sticky 상태 모두 실제 배경 경계 안쪽에 본문 여백을 확보합니다.
        const contentTop = Math.min(bodyRect.height, Math.max(0, visibleTop - bodyRect.top + parseFloat(contentStyle.paddingTop)));
        const contentBottom = Math.max(contentTop, Math.min(bodyRect.height, visibleBottom - bodyRect.top - parseFloat(contentStyle.paddingBottom)));
        panel.style.setProperty('--panel-reveal-top', `${revealTop}px`);
        panel.style.setProperty('--panel-reveal-bottom', `${revealBottom}px`);
        body.style.setProperty('--panel-clip-top', `${contentTop}px`);
        body.style.setProperty('--panel-clip-bottom', `${bodyRect.height - contentBottom}px`);
        if (media && content) {
            if (mobileLayout.matches) {
                const mediaRect = media.getBoundingClientRect();
                const maskTop = content.getBoundingClientRect().top + parseFloat(getComputedStyle(content, '::before').top);
                // 가려지고 남은 사진 영역의 하단에도 둥근 모서리를 유지합니다.
                const mediaInset = parseFloat(getComputedStyle(media).top);
                const clippedTop = Math.min(mediaRect.height, Math.max(0, mediaInset - mediaRect.top));
                const clipped = Math.min(mediaRect.height - clippedTop, Math.max(0, mediaRect.bottom - maskTop));
                media.style.setProperty('--media-clip-top', `${clippedTop}px`);
                media.style.setProperty('--media-clip-bottom', `${clipped}px`);
            } else {
                media.style.removeProperty('--media-clip-top');
                media.style.removeProperty('--media-clip-bottom');
            }
        }
    }

    function scheduleUpdate() {
        if (frame !== undefined) return;
        frame = requestAnimationFrame(updateClip);
    }

    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate, { passive: true });
    window.addEventListener('pageshow', scheduleUpdate);
    new ResizeObserver(scheduleUpdate).observe(panel);
    document.fonts.ready.then(scheduleUpdate);
    updateClip();
})();

// 실제 글꼴과 화면 너비에 맞춰 제목과 고정 메뉴 사이에 24px을 확보합니다.
(() => {
    const intro = document.querySelector('.portfolio-intro');
    const title = document.querySelector('.portfolio-intro__title');
    const menuButton = document.querySelector('.site-menu__toggle');
    if (!intro || !title || !menuButton) return;

    function updateTitleSpace() {
        const button = menuButton.getBoundingClientRect();
        // 등장 애니메이션의 위치와 무관한 제목의 최종 오른쪽 경계입니다.
        const titleRight = (intro.clientWidth + title.offsetWidth) / 2;
        const titleTop = titleRight + 24 > button.left ? Math.ceil(button.bottom + 24) : 40;
        intro.style.setProperty('--title-top', `${titleTop}px`);
    }

    const observer = new ResizeObserver(updateTitleSpace);
    [intro, title, menuButton].forEach((element) => observer.observe(element));
    window.addEventListener('resize', updateTitleSpace, { passive: true });
    document.fonts.ready.then(updateTitleSpace);
    updateTitleSpace();
})();

// 고정 메뉴: 섹션 이동 후 닫고, Escape 및 바깥 클릭도 지원합니다.
(() => {
    const menu = document.querySelector('.site-menu');
    const toggle = menu?.querySelector('.site-menu__toggle');
    const navigation = menu?.querySelector('nav');
    if (!toggle || !navigation) return;

    function closeMenu() {
        navigation.hidden = true;
        toggle.setAttribute('aria-expanded', 'false');
    }

    toggle.addEventListener('click', () => {
        const open = toggle.getAttribute('aria-expanded') !== 'true';
        toggle.setAttribute('aria-expanded', String(open));
        navigation.hidden = !open;
    });

    navigation.addEventListener('click', (event) => {
        if (!event.target.closest('a')) return;
        closeMenu();
        toggle.focus({ preventScroll: true });
    });

    document.addEventListener('click', (event) => {
        if (!menu.contains(event.target)) closeMenu();
    });

    document.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape' || navigation.hidden) return;
        closeMenu();
        toggle.focus({ preventScroll: true });
    });

    menu.addEventListener('focusout', (event) => {
        if (!menu.contains(event.relatedTarget)) closeMenu();
    });
})();

document.querySelectorAll('.marquee').forEach((marquee) => {
    const track = marquee.querySelector('.marquee__track');
    const [sourceGroup, copyGroup] = track.querySelectorAll('.marquee__group');
    const originalItems = Array.from(sourceGroup.children, (item) => item.cloneNode(true));
    let repetitions = 1;

    function updateMarquee() {
        // 마지막 간격까지 포함한 문구 한 세트의 너비를 구합니다.
        const unitWidth = sourceGroup.getBoundingClientRect().width / repetitions;
        if (!unitWidth) return;

        const viewportWidth = marquee.getBoundingClientRect().width;
        const nextRepetitions = Math.max(1, Math.ceil((viewportWidth + 1) / unitWidth));
        if (nextRepetitions === repetitions) return;

        const content = document.createDocumentFragment();

        for (let repeat = 0; repeat < nextRepetitions; repeat += 1) {
            originalItems.forEach((item) => {
                const clone = item.cloneNode(true);
                if (repeat > 0) clone.setAttribute('aria-hidden', 'true');
                content.append(clone);
            });
        }

        // 각 묶음이 화면을 덮도록 채우고, 두 묶음을 똑같이 맞춥니다.
        sourceGroup.replaceChildren(content);
        copyGroup.replaceChildren(...Array.from(sourceGroup.children, (item) => item.cloneNode(true)));
        repetitions = nextRepetitions;

        // 이동 거리가 늘어난 만큼 시간을 늘려 기존 속도를 유지합니다.
        track.style.setProperty('--marquee-repeat', repetitions);
    }

    updateMarquee();
    new ResizeObserver(updateMarquee).observe(marquee);
    document.fonts.ready.then(updateMarquee);
});

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

    function resetScrollToTop() {
        stopSmoothScroll();
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        currentScroll = 0;
        targetScroll = 0;
    }

    // 첫 표시와 페이지 복원 시 실제 위치와 휠 스크롤 목표 위치를 함께 초기화합니다.
    resetScrollToTop();
    window.addEventListener('pageshow', resetScrollToTop);

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

// 인트로 사진은 스크롤 거리의 30%만큼 따라오며 마퀴 뒤로 32px까지 겹칩니다.
(() => {
    const intro = document.querySelector('.portfolio-intro');
    const photo = intro?.querySelector('.portfolio-intro__image');
    const marquee = intro?.querySelector('.marquee--intro');
    if (!intro || !photo || !marquee) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const followRatio = 0.3;
    const marqueeOverlap = 32;
    let maxOffset = 0;
    let frame;

    function updatePhoto() {
        frame = undefined;
        const scrolled = Math.max(0, -intro.getBoundingClientRect().top);
        const offset = reducedMotion.matches ? 0 : Math.min(scrolled * followRatio, maxOffset);
        photo.style.setProperty('--intro-photo-scroll', `${offset}px`);
    }

    function scheduleUpdate() {
        if (frame !== undefined) return;
        frame = window.requestAnimationFrame(updatePhoto);
    }

    function measureSpace() {
        // offsetTop/Height는 등장 애니메이션이나 translate의 영향을 받지 않습니다.
        const photoBottom = photo.offsetTop + photo.offsetHeight / 2;
        const bottomLimit = marquee.offsetTop + marqueeOverlap;
        // 이름 영역에서도 멈추지 않고, 앞에 표시되는 이름과 마퀴 뒤로 이동합니다.
        maxOffset = Math.max(0, bottomLimit - photoBottom);
        scheduleUpdate();
    }

    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', measureSpace, { passive: true });
    window.addEventListener('pageshow', measureSpace);
    reducedMotion.addEventListener('change', scheduleUpdate);

    const resizeObserver = new ResizeObserver(measureSpace);
    [intro, photo, marquee].forEach((element) => resizeObserver.observe(element));
    document.fonts.ready.then(measureSpace);
    measureSpace();
})();
