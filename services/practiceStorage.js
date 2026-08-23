const practiceStorage = (() => {
    const STORAGE_KEY = 'marvelRivalsPracticeBlock';
    const STORAGE_VERSION = 1;

    function clear() {
        localStorage.removeItem(STORAGE_KEY);
    }

    function save(practiceBlock) {
        if (!practiceBlock) {
            clear();
            return;
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            version: STORAGE_VERSION,
            activePracticeBlock: practiceBlock
        }));
    }

    function load() {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
            if (!saved) return null;

            // Version 0 stored the practice block directly. Return either shape
            // so app.js can validate it against the current hero roster.
            const savedBlock = saved.version === STORAGE_VERSION
                ? saved.activePracticeBlock
                : saved;

            if (!savedBlock || typeof savedBlock !== 'object') {
                clear();
                return null;
            }

            return savedBlock;
        } catch (error) {
            console.warn('Could not restore practice block:', error);
            clear();
            return null;
        }
    }

    return { clear, load, save };
})();
