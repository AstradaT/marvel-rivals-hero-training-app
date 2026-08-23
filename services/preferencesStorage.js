const preferencesStorage = (() => {
    const STORAGE_KEY = 'marvelRivalsPreferences';
    const STORAGE_VERSION = 1;

    const defaultPreferences = {
        bannedHeroIds: []
    };

    function load() {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
            if (!saved || saved.version !== STORAGE_VERSION) {
                return { ...defaultPreferences };
            }

            const bannedHeroIds = Array.isArray(saved.preferences?.bannedHeroIds)
                ? saved.preferences.bannedHeroIds.filter(id => typeof id === 'string')
                : [];

            return { bannedHeroIds: [...new Set(bannedHeroIds)] };
        } catch (error) {
            console.warn('Could not restore preferences:', error);
            return { ...defaultPreferences };
        }
    }

    function save(preferences) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            version: STORAGE_VERSION,
            preferences
        }));
    }

    return { load, save };
})();
