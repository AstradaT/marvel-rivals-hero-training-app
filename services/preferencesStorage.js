const preferencesStorage = (() => {
    const STORAGE_KEY = 'marvelRivalsPreferences';
    const STORAGE_VERSION = 1;

    const defaultPreferences = {
        bannedHeroIds: [],
        activeRoles: ['Vanguard', 'Duelist', 'Strategist'],
        isMuted: false,
        playerUid: '',
        playerUsername: ''
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
            const validRoles = ['Vanguard', 'Duelist', 'Strategist'];
            const activeRoles = Array.isArray(saved.preferences?.activeRoles)
                ? saved.preferences.activeRoles.filter(role => validRoles.includes(role))
                : defaultPreferences.activeRoles;

            return {
                bannedHeroIds: [...new Set(bannedHeroIds)],
                activeRoles: [...new Set(activeRoles)],
                isMuted: saved.preferences?.isMuted === true,
                playerUid: typeof saved.preferences?.playerUid === 'string'
                    ? saved.preferences.playerUid.trim()
                    : '',
                playerUsername: typeof saved.preferences?.playerUsername === 'string'
                    ? saved.preferences.playerUsername.trim()
                    : ''
            };
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
