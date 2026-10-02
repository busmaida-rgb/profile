(() => {
    const gallery = document.querySelector('.product-detail-pages__swiper');
    if (!gallery || typeof Swiper === 'undefined') return;

    new Swiper(gallery, {
        slidesPerView: 'auto',
        spaceBetween: 40,
        speed: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 400,
        grabCursor: true,
        watchOverflow: true,
        preventClicks: true,
        preventClicksPropagation: true,
        keyboard: { enabled: true, onlyInViewport: true },
        a11y: { slideLabelMessage: '{{index}} / {{slidesLength}} 상세페이지' },
        breakpoints: {
            1025: { slidesPerView: 3, spaceBetween: 40 },
            1600: { slidesPerView: 3, spaceBetween: 80 },
        },
    });
})();
