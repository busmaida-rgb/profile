(() => {
    const mouse = window.matchMedia('(hover: hover) and (pointer: fine)');
    const dot = document.createElement('div');
    dot.className = 'cursor-dot';
    dot.setAttribute('aria-hidden', 'true');
    const label = document.createElement('span');
    label.textContent = 'scroll';
    dot.appendChild(label);
    document.body.appendChild(dot);

    let pointer = null;
    let scrollFrame = 0;
    const updateSection = () => {
        if (!pointer) return;
        const target = document.elementFromPoint(pointer.x, pointer.y);
        dot.classList.toggle('is-scroll', Boolean(target?.closest('#website-projects')));
        const isProjectLink = Boolean(target?.closest('#website-projects .website-project__device, #website-projects .website-project__title-link'));
        dot.classList.toggle('is-click', isProjectLink);
        const text = isProjectLink ? 'click' : 'scroll';
        if (label.textContent !== text) label.textContent = text;
    };
    const hide = () => dot.classList.remove('is-visible');
    document.addEventListener('pointermove', (event) => {
        if (!mouse.matches || event.pointerType !== 'mouse') {
            hide();
            return;
        }
        dot.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0) translate(-50%, -50%)`;
        pointer = { x: event.clientX, y: event.clientY };
        updateSection();
        dot.classList.add('is-visible');
    }, { passive: true });
    window.addEventListener('scroll', () => {
        if (scrollFrame) return;
        scrollFrame = requestAnimationFrame(() => {
            scrollFrame = 0;
            updateSection();
        });
    }, { passive: true });
    window.addEventListener('resize', updateSection);
    document.documentElement.addEventListener('pointerleave', hide);
    window.addEventListener('blur', hide);
    document.addEventListener('visibilitychange', hide);
    mouse.addEventListener('change', hide);
})();
