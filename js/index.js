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
