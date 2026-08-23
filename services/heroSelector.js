const heroSelector = (() => {
    function selectRandom(candidates) {
        if (candidates.length === 0) return null;

        return candidates[Math.floor(Math.random() * candidates.length)];
    }

    return { selectRandom };
})();
