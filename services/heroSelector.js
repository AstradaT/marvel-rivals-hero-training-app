const heroSelector = (() => {
    function selectRandom(candidates) {
        if (candidates.length === 0) return null;

        return candidates[Math.floor(Math.random() * candidates.length)];
    }

    function selectQuickRandom(candidates) {
        return selectRandom(candidates);
    }

    function selectTraining(candidates) {
        // Training is intentionally uniform for now. Future priority weighting
        // belongs here without changing Quick Random behavior.
        return selectRandom(candidates);
    }

    return { selectQuickRandom, selectTraining };
})();
