(() => {
    const closeButton = document.querySelector('.pdp-close');
    const closeMessage = document.querySelector('.pdp-close-message');

    closeButton?.addEventListener('click', () => {
        window.close();
        window.setTimeout(() => {
            if (closeMessage) closeMessage.hidden = false;
        }, 200);
    });
})();
