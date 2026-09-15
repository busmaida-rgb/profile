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
