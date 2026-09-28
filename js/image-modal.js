(() => {
    const selector = '.popup-project__image, .banner-designs__swiper .swiper-slide > img';
    const images = document.querySelectorAll(selector);
    if (!images.length) return;

    const modal = document.createElement('dialog');
    modal.className = 'image-modal';
    modal.setAttribute('aria-label', '디자인 이미지 확대 보기');
    modal.innerHTML = `
        <div class="image-modal__toolbar">
            <button type="button" class="image-modal__close" autofocus aria-label="이미지 확대 보기 닫기">닫기 ×</button>
        </div>
        <div class="image-modal__viewer"><img class="image-modal__image" alt=""></div>`;
    document.body.append(modal);
    const viewer = modal.querySelector('.image-modal__viewer');
    const preview = modal.querySelector('img');
    let trigger;
    let autoplay;
    let pointerStart;

    images.forEach(image => {
        image.classList.add('image-preview-trigger');
        image.tabIndex = 0;
        image.setAttribute('role', 'button');
        image.setAttribute('aria-haspopup', 'dialog');
        image.setAttribute('aria-label', `${image.alt || '디자인 이미지'} 확대 보기`);
    });

    function setZoom(expanded) {
        const width = Math.max(preview.naturalWidth, preview.getBoundingClientRect().width * 2);
        if (expanded) preview.style.setProperty('--image-zoom-width', `${width}px`);
        viewer.classList.toggle('is-zoomed', expanded);
        viewer.scrollTo(0, 0);
    }

    function open(image) {
        if (modal.open) return;
        trigger = image;
        preview.src = image.dataset.fullSrc || image.currentSrc || image.src;
        preview.alt = image.alt;
        setZoom(false);
        const swiper = document.querySelector('.banner-designs__swiper')?.swiper;
        autoplay = swiper?.autoplay?.running ? swiper.autoplay : null;
        autoplay?.stop();
        document.documentElement.classList.add('has-image-modal');
        modal.showModal();
    }

    document.addEventListener('pointerdown', event => {
        pointerStart = { x: event.clientX, y: event.clientY };
    }, { passive: true });
    document.addEventListener('click', event => {
        const image = event.target.closest(selector);
        if (!image) return;
        if (event.detail && pointerStart && Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) > 8) return;
        if (event.detail && image.closest('.swiper')?.swiper?.allowClick === false) return;
        open(image);
    });
    document.addEventListener('keydown', event => {
        if (!event.target.matches(selector) || !['Enter', ' '].includes(event.key)) return;
        event.preventDefault();
        open(event.target);
    });
    modal.querySelector('.image-modal__close').addEventListener('click', () => modal.close());
    viewer.addEventListener('click', event => {
        if (event.target === viewer && (!pointerStart || Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) <= 8)) modal.close();
    });
    preview.addEventListener('click', () => setZoom(!viewer.classList.contains('is-zoomed')));
    modal.addEventListener('close', () => {
        document.documentElement.classList.remove('has-image-modal');
        setZoom(false);
        preview.removeAttribute('src');
        autoplay?.start();
        autoplay = null;
        trigger?.focus({ preventScroll: true });
    });
})();
