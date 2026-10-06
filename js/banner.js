// Read the live panel position so earlier pins and layout changes cannot stale the range.
(() => {
    const panel = document.querySelector('.banner-designs__panel');
    const branch = panel?.querySelector('.banner-designs__branch');
    if (!branch || !window.gsap) return;

    gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
        const sway = gsap.timeline({
            paused: true,
            defaults: { duration: 1, ease: 'sine.inOut' },
        })
            .fromTo(branch, { rotation: 0 }, { rotation: -2 })
            .to(branch, { rotation: 2 })
            .to(branch, { rotation: 0 });

        let frame;
        let previousProgress = -1;
        function update() {
            frame = undefined;
            const rect = panel.getBoundingClientRect();
            const progress = gsap.utils.clamp(0, 1,
                (window.innerHeight - rect.top) / (window.innerHeight + rect.height));
            if (Math.abs(progress - previousProgress) < .0001) return;
            previousProgress = progress;
            gsap.to(sway, { progress, duration: .35, ease: 'power1.out', overwrite: true });
        }
        function scheduleUpdate() {
            if (frame === undefined) frame = requestAnimationFrame(update);
        }
        window.addEventListener('scroll', scheduleUpdate, { passive: true });
        window.addEventListener('resize', scheduleUpdate, { passive: true });
        window.addEventListener('load', scheduleUpdate);
        const observer = new ResizeObserver(scheduleUpdate);
        observer.observe(document.body);
        observer.observe(panel);
        scheduleUpdate();

        return () => {
            cancelAnimationFrame(frame);
            observer.disconnect();
            window.removeEventListener('scroll', scheduleUpdate);
            window.removeEventListener('resize', scheduleUpdate);
            window.removeEventListener('load', scheduleUpdate);
            gsap.killTweensOf(sway);
        };
    });
})();

(() => {
    const section = document.querySelector('.banner-designs');
    if (!section || typeof Swiper === 'undefined') return;

    // 각 슬라이드의 template 안에서 제목과 설명을 수정합니다.
    const descriptions = [...section.querySelectorAll('template')].map(template => template.content);
    const detail = section.querySelector('.banner-designs__description');
    const current = section.querySelector('.banner-designs__current');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let animation;
    let revision = 0;

    async function updateDescription(swiper, immediate = false) {
        const index = swiper.realIndex;
        const token = ++revision;
        current.textContent = String(index + 1).padStart(2, '0');
        animation?.cancel();
        const replace = () => detail.replaceChildren(descriptions[index].cloneNode(true));
        if (immediate || reducedMotion.matches || !detail.animate) {
            replace();
            return;
        }
        try {
            animation = detail.animate([
                { filter: 'blur(0px)', opacity: 1 },
                { filter: 'blur(8px)', opacity: 0 },
            ], { duration: 180, easing: 'ease-in', fill: 'forwards' });
            await animation.finished;
            if (token !== revision) return;
            replace();
            animation.cancel();
            animation = detail.animate([
                { filter: 'blur(8px)', opacity: 0 },
                { filter: 'blur(0px)', opacity: 1 },
            ], { duration: 260, easing: 'ease-out' });
            await animation.finished;
        } catch (error) {
            if (error.name !== 'AbortError') throw error;
        }
    }

    section.querySelector('.banner-designs__total').textContent = String(descriptions.length).padStart(2, '0');
    new Swiper(section.querySelector('.swiper'), {
        slidesPerView: 'auto',
        spaceBetween: 80,
        speed: 600,
        loop: true,
        grabCursor: true,
        simulateTouch: true,
        autoplay: { delay: 3000, disableOnInteraction: false, pauseOnMouseEnter: true },
        navigation: {
            prevEl: section.querySelector('.banner-designs__prev'),
            nextEl: section.querySelector('.banner-designs__next'),
        },
        a11y: { prevSlideMessage: '이전 배너', nextSlideMessage: '다음 배너' },
        breakpoints: { 1025: { spaceBetween: 40 }, 1600: { spaceBetween: 80 } },
        on: {
            init(swiper) { updateDescription(swiper, true); },
            realIndexChange(swiper) { updateDescription(swiper); },
        },
    });
})();
