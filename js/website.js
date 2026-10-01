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
