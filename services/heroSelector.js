const heroSelector = (() => {
    function selectRandom(candidates) {
        if (candidates.length === 0) return null;

        return candidates[Math.floor(Math.random() * candidates.length)];
    }

    function selectQuickRandom(candidates) {
        return selectRandom(candidates);
    }

    function selectTraining(candidates, weightsByHeroId = {}) {
        if (candidates.length === 0) return null;

        const weightedCandidates = candidates.map(candidate => ({
            candidate,
            weight: Math.max(0, Number(weightsByHeroId[candidate?.id]) || 1)
        }));
        const totalWeight = weightedCandidates.reduce((total, item) => total + item.weight, 0);
        if (totalWeight <= 0) return selectRandom(candidates);

        let threshold = Math.random() * totalWeight;
        for (const item of weightedCandidates) {
            threshold -= item.weight;
            if (threshold < 0) return item.candidate;
        }

        return weightedCandidates.at(-1).candidate;
    }

    return { selectQuickRandom, selectTraining };
})();
