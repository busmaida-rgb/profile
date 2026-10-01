// 다음 팝업 상단이 화면 중앙을 통과하면 PC의 고정 설명만 교체합니다.
document.querySelectorAll('.content-designs').forEach((section) => {
    const images = [...section.querySelectorAll('.popup-project__image')];
    const descriptions = [...section.querySelectorAll('.popup-project > .popup-project__description')];
    const detail = section.querySelector('.content-designs__detail .popup-project__description');
    const desktop = window.matchMedia('(min-width: 1025px)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let active = -1;
    let frame;
    let animation;
    let revision = 0;

    function replaceDescription(index) {
        detail.replaceChildren(...[...descriptions[index].childNodes].map(node => node.cloneNode(true)));
    }

    async function showDescription(index, immediate) {
        const currentRevision = ++revision;
        animation?.cancel();
        active = index;
        if (immediate || reducedMotion.matches || !detail.animate) {
            replaceDescription(index);
            return;
        }
        try {
            animation = detail.animate([
                { filter: 'blur(0px)', opacity: 1 },
                { filter: 'blur(8px)', opacity: 0 },
            ], { duration: 180, easing: 'ease-in', fill: 'forwards' });
            await animation.finished;
            if (currentRevision !== revision) return;
            replaceDescription(index);
            animation.cancel();
            animation = detail.animate([
                { filter: 'blur(8px)', opacity: 0 },
                { filter: 'blur(0px)', opacity: 1 },
            ], { duration: 260, easing: 'ease-out' });
            await animation.finished;
        } catch (error) {
            // 빠른 역스크롤이나 화면 크기 변경으로 취소된 전환은 버립니다.
            if (error.name !== 'AbortError') throw error;
        }
    }

    function update() {
        frame = undefined;
        if (!desktop.matches) {
            ++revision;
            animation?.cancel();
            active = -1;
            return;
        }
        let next = 0;
        images.forEach((image, index) => {
            if (image.getBoundingClientRect().top <= window.innerHeight * 0.5) next = index;
        });
        if (next !== active) showDescription(next, active === -1);
    }

    function scheduleUpdate() {
        if (frame === undefined) frame = requestAnimationFrame(update);
    }

    replaceDescription(0);
    section.classList.add('is-enhanced');
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate, { passive: true });
    window.addEventListener('pageshow', scheduleUpdate);
    window.addEventListener('load', scheduleUpdate, { once: true });
    desktop.addEventListener('change', scheduleUpdate);
    reducedMotion.addEventListener('change', () => {
        active = -1;
        scheduleUpdate();
    });
    document.fonts.ready.then(scheduleUpdate);
    scheduleUpdate();
});

// PC와 모바일 모두 팝업 영역 하단이 화면 중앙 이상으로 올라오면 전환합니다.
(() => {
    const group = document.querySelector('.content-designs-group');
    const popupSection = document.querySelector('#content-designs');
    if (!group || !popupSection) return;
    let frame;
    function update() {
        frame = undefined;
        group.classList.toggle('is-poster', popupSection.getBoundingClientRect().bottom <= window.innerHeight * 0.5);
    }
    function scheduleUpdate() {
        if (frame === undefined) frame = requestAnimationFrame(update);
    }
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate, { passive: true });
    window.addEventListener('pageshow', scheduleUpdate);
    window.addEventListener('load', scheduleUpdate, { once: true });
    new ResizeObserver(scheduleUpdate).observe(group);
    document.fonts.ready.then(scheduleUpdate);
    scheduleUpdate();
})();

// PC에서만 섹션을 고정하고 세로 스크롤 거리를 가로 이동으로 변환합니다.
(() => {
    const section = document.querySelector('.website-projects');
    const track = section?.querySelector('.website-projects__track');
    if (!track || !window.gsap || !window.ScrollTrigger) return;

    gsap.registerPlugin(ScrollTrigger);
    gsap.matchMedia().add('(min-width: 1025px) and (prefers-reduced-motion: no-preference)', () => {
        section.classList.add('is-horizontal');
        const distance = () => Math.max(0, track.scrollWidth - section.clientWidth);
        const tween = gsap.to(track, {
            x: () => -distance(),
            ease: 'none',
            scrollTrigger: {
                trigger: section,
                start: 'top top',
                end: () => `+=${distance()}`,
                pin: true,
                scrub: true,
                invalidateOnRefresh: true,
                anticipatePin: 1,
            },
        });

        // 화면 밖 썸네일로 키보드 포커스가 이동하면 해당 프로젝트를 보여줍니다.
        const viewport = section.querySelector('.website-projects__viewport');
        function revealFocusedProject(event) {
            const card = event.target.closest('.website-project');
            if (!card) return;
            viewport.scrollLeft = 0;
            const gutter = parseFloat(getComputedStyle(track).paddingLeft);
            const offset = Math.min(distance(), Math.max(0, card.offsetLeft - gutter));
            window.scrollTo({ top: tween.scrollTrigger.start + offset, behavior: 'instant' });
        }
        track.addEventListener('focusin', revealFocusedProject);
        return () => {
            track.removeEventListener('focusin', revealFocusedProject);
            section.classList.remove('is-horizontal');
        };
    });

    document.fonts.ready.then(() => ScrollTrigger.refresh());
    window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
})();

// Flower silhouettes follow scroll progress, including the desktop pinned track.
(() => {
    const section = document.querySelector('.website-projects');
    if (!section || !window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);
    gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
        const layer = document.createElement('div');
        layer.className = 'website-projects__petals';
        layer.setAttribute('aria-hidden', 'true');
        const layout = [
            [6, 12, 24, -32], [22, 46, 36, 24], [42, 8, 22, 68],
            [63, 34, 30, -48], [82, 10, 40, 38], [94, 61, 26, -20],
            [12, 78, 32, 52], [54, 73, 26, -65], [33, 91, 20, 15],
            [73, 85, 38, 76], [37, 32, 28, -12], [87, 43, 22, 42],
        ];
        const petals = layout.map(([left, top, size, rotation], index) => {
            const petal = document.createElement('span');
            petal.className = 'website-projects__petal';
            petal.style.cssText = `left:${left}%;top:${top}%;--petal-size:${size * 1.15}px;--petal-opacity:${.13 + (index % 3) * .045}`;
            layer.append(petal);
            gsap.set(petal, { rotation });
            return petal;
        });
        section.prepend(layer);
        const timeline = gsap.timeline({
            scrollTrigger: {
                trigger: section,
                start: 'top bottom',
                end: () => {
                    const track = section.querySelector('.website-projects__track');
                    const pinnedDistance = section.classList.contains('is-horizontal')
                        ? Math.max(0, track.scrollWidth - section.clientWidth) : 0;
                    return `+=${window.innerHeight + section.offsetHeight + pinnedDistance}`;
                },
                scrub: 1.8,
                invalidateOnRefresh: true,
            },
        });
        petals.forEach((petal, index) => {
            const direction = index % 2 ? 1 : -1;
            timeline.fromTo(petal, {
                x: -direction * 35,
                y: -65,
                rotation: layout[index][3],
            }, {
                x: direction * (65 + index * 5),
                y: () => Math.min(section.offsetHeight * .22, 190) + index * 4,
                rotation: layout[index][3] + direction * (65 + index * 7),
                duration: 1,
                ease: 'sine.inOut',
            }, 0);
        });
        return () => layer.remove();
    });
})();

// 실제 푸터 위치로 계산해 PC pin 구간과 레이아웃 변경에도 진행률을 맞춥니다.
(() => {
    const footer = document.querySelector('.site-footer');
    if (!footer || !window.gsap) return;

    const root = document.documentElement;
    const detailBackground = document.querySelector('.product-detail-pages .content-designs__background');
    const color = (token) => getComputedStyle(root).getPropertyValue(token).trim();
    const transition = gsap.timeline({ paused: true });
    transition.fromTo(root, {
        '--page-background': color('--beige'),
    }, {
        '--page-background': color('--gray'),
        duration: 1,
        ease: 'none',
    }, 0);
    if (detailBackground) {
        transition.fromTo(detailBackground, { opacity: 1 }, {
            opacity: 0,
            // 푸터가 화면 높이의 20%만큼 들어오면 글자를 완전히 숨깁니다.
            duration: 0.2,
            ease: 'none',
        }, 0);
    }

    let frame;
    function update() {
        frame = undefined;
        const height = window.innerHeight;
        const progress = Math.min(1, Math.max(0, (height - footer.getBoundingClientRect().top) / height));
        transition.progress(progress);
    }
    function scheduleUpdate() {
        if (frame === undefined) frame = requestAnimationFrame(update);
    }

    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate, { passive: true });
    window.addEventListener('pageshow', scheduleUpdate);
    window.addEventListener('load', scheduleUpdate, { once: true });
    window.visualViewport?.addEventListener('resize', scheduleUpdate);
    window.ScrollTrigger?.addEventListener('refresh', scheduleUpdate);
    const resizeObserver = new ResizeObserver(scheduleUpdate);
    resizeObserver.observe(document.body);
    resizeObserver.observe(footer);
    document.fonts.ready.then(scheduleUpdate);
    update();
})();

// 배경의 sticky 경계 안에서만 본문을 표시합니다. 별도 스크롤 영역은 만들지 않습니다.
(() => {
    const panel = document.querySelector('.profile-content__details');
    const body = panel?.querySelector('.profile-content__body');
    const media = document.querySelector('.profile-content__media');
    const content = panel?.closest('.profile-content');
    const mobileLayout = window.matchMedia('(max-width: 1024px)');
    if (!panel || !body) return;
    let frame;
    let mediaOffset = 0;

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
        if (media && content && !mobileLayout.matches) {
            // 사진의 하단이 소개·스킬 패널 끝에 닿으면 함께 위로 이동합니다.
            const stickyBottom = media.getBoundingClientRect().bottom - mediaOffset;
            mediaOffset = Math.min(0, rect.bottom - stickyBottom);
            media.style.setProperty('--media-end-offset', `${mediaOffset}px`);

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

    let previousScroll = Math.max(0, window.scrollY);
    let scrollFrame;

    function setMenuHidden(hidden) {
        if (hidden) closeMenu();
        menu.classList.toggle('is-scroll-hidden', hidden);
        menu.inert = hidden;
    }

    function updateMenuVisibility() {
        scrollFrame = undefined;
        const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
        const currentScroll = Math.min(maxScroll, Math.max(0, window.scrollY));
        const difference = currentScroll - previousScroll;

        if (currentScroll <= 0) {
            setMenuHidden(false);
        } else if (Math.abs(difference) < 4) {
            return;
        } else {
            setMenuHidden(difference > 0);
        }
        previousScroll = currentScroll;
    }

    window.addEventListener('scroll', () => {
        if (scrollFrame === undefined) {
            scrollFrame = requestAnimationFrame(updateMenuVisibility);
        }
    }, { passive: true });

    window.addEventListener('pageshow', () => {
        previousScroll = Math.max(0, window.scrollY);
        setMenuHidden(false);
    });

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

// Reveal profile text on its first viewport entry.
(() => {
    const elements = document.querySelectorAll('.profile-section-heading, .profile-about__body');
    if (!elements.length || !window.gsap || !window.ScrollTrigger) return;

    gsap.registerPlugin(ScrollTrigger);
    gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
        elements.forEach(element => {
            gsap.fromTo(element, {
                clipPath: 'inset(0 100% 0 0)',
            }, {
                clipPath: 'inset(0 0% 0 0%)',
                duration: 1,
                ease: 'power2.out',
                clearProps: 'clipPath',
                scrollTrigger: {
                    trigger: element,
                    start: 'top 90%',
                    once: true,
                },
            });
        });
    });
})();

// Observe live heading visibility so earlier pinned sections cannot stale the start position.
(() => {
    const headings = document.querySelectorAll('.website-projects__heading, .content-designs__heading, .banner-designs__heading');
    if (!headings.length || !window.gsap || !window.IntersectionObserver) return;

    gsap.matchMedia().add({
        motion: '(prefers-reduced-motion: no-preference)',
        desktop: '(min-width: 1025px)',
    }, context => {
        if (!context.conditions.motion) return;
        const reveals = new Map();
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                reveals.get(entry.target).play();
                observer.unobserve(entry.target);
            });
        }, { rootMargin: '0px 0px -15% 0px', threshold: 0 });

        headings.forEach(heading => {
            const fromRight = context.conditions.desktop && !!heading.closest('.content-designs--poster');
            reveals.set(heading, gsap.fromTo(heading.children, {
                clipPath: fromRight ? 'inset(0 0 0 100%)' : 'inset(0 100% 0 0)',
            }, {
                clipPath: 'inset(0 0% 0 0%)',
                duration: 1,
                ease: 'power2.out',
                paused: true,
                clearProps: 'clipPath',
            }));
            observer.observe(heading);
        });
        return () => observer.disconnect();
    });
})();

// Reveal each visible row from left to right, keeping a trigger for every card.
(() => {
    const cards = document.querySelectorAll('.profile-skills .skill-card');
    if (!cards.length || !window.gsap || !window.ScrollTrigger) return;

    gsap.registerPlugin(ScrollTrigger);
    gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
        cards.forEach(card => {
            const reveal = gsap.fromTo(card, {
                translate: '0px 24px',
                opacity: 0,
            }, {
                translate: '0px 0px',
                opacity: 1,
                duration: 0.8,
                paused: true,
                ease: 'power2.out',
                clearProps: 'translate,opacity',
            });
            ScrollTrigger.create({
                trigger: card,
                start: 'top 90%',
                once: true,
                onEnter: () => {
                    // Read the current layout so resized and single-column grids stay in order.
                    const column = [...cards].filter(other =>
                        Math.abs(other.offsetTop - card.offsetTop) <= 1 &&
                        other.offsetLeft < card.offsetLeft
                    ).length;
                    reveal.delay(column * 0.12).restart(true);
                },
            });
        });
    });
})();

// Each mobile project has its own device gallery; desktop keeps its scroll-driven track.
(() => {
    if (typeof Swiper === 'undefined') return;
    const mobile = window.matchMedia('(max-width: 1024px)');
    const galleries = [...document.querySelectorAll('.website-project__gallery')];
    // Swiper's cleanStyles removes slide styles, including our device dimensions.
    const deviceStyles = galleries.flatMap(gallery =>
        [...gallery.querySelectorAll('.website-project__device')].map(device => ({
            device,
            style: device.getAttribute('style'),
        }))
    );
    let sliders = [];
    function updateGalleries() {
        sliders.forEach(slider => slider.destroy(true, true));
        deviceStyles.forEach(({ device, style }) => {
            if (style === null) device.removeAttribute('style');
            else device.setAttribute('style', style);
        });
        sliders = mobile.matches ? galleries.map(gallery => new Swiper(gallery, {
            slidesPerView: 'auto', spaceBetween: 40,
            slidesOffsetBefore: 24, slidesOffsetAfter: 24,
            watchOverflow: true, grabCursor: true,
            a11y: { containerMessage: gallery.getAttribute('aria-label') },
        })) : [];
        window.ScrollTrigger?.refresh();
    }
    mobile.addEventListener('change', updateGalleries);
    updateGalleries();
})();

// Reveal each footer text block and divider when it enters the viewport.
(() => {
    const footer = document.querySelector('.site-footer');
    if (!footer || !window.gsap || !window.IntersectionObserver) return;

    gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
        const elements = footer.querySelectorAll('.site-footer__title span, .site-footer__description, .site-footer__divider, .site-footer__email');
        const reveals = new Map();
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                reveals.get(entry.target).play();
                observer.unobserve(entry.target);
            });
        });
        elements.forEach(element => {
            reveals.set(element, gsap.fromTo(element, {
                clipPath: 'inset(0 100% 0 0)',
            }, {
                clipPath: 'inset(0 0% 0 0)',
                duration: 1,
                ease: 'power2.out',
                paused: true,
                clearProps: 'clipPath',
            }));
            observer.observe(element);
        });
        return () => observer.disconnect();
    });
})();

// Reveal complete website projects and the banner body on viewport entry.
(() => {
    const elements = document.querySelectorAll('article.website-project, .banner-designs__body');
    if (!elements.length || !window.gsap || !window.IntersectionObserver) return;

    gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
        const reveals = new Map();
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                reveals.get(entry.target).play();
                observer.unobserve(entry.target);
            });
        }, { rootMargin: '0px 0px -10% 0px', threshold: 0 });

        elements.forEach(element => {
            reveals.set(element, gsap.fromTo(element, {
                translate: '0px 24px',
                opacity: 0,
            }, {
                translate: '0px 0px',
                opacity: 1,
                duration: 0.8,
                ease: 'power2.out',
                paused: true,
                clearProps: 'translate,opacity',
            }));
            observer.observe(element);
        });
        return () => observer.disconnect();
    });
})();
