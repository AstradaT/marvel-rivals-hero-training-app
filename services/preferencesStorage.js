const preferencesStorage = (() => {
    const STORAGE_KEY = 'marvelRivalsPreferences';
    const STORAGE_VERSION = 1;

    const defaultPreferences = {
        bannedHeroIds: [],
        activeRoles: ['Vanguard', 'Duelist', 'Strategist'],
        isMuted: false,
        appMode: 'training',
        playerUid: '',
        playerUsername: ''
    };

    function sanitize(preferences) {
        const source = preferences && typeof preferences === 'object'
            ? preferences
            : {};
        const bannedHeroIds = Array.isArray(source.bannedHeroIds)
            ? source.bannedHeroIds.filter(id => typeof id === 'string')
            : [];
        const validRoles = ['Vanguard', 'Duelist', 'Strategist'];
        const activeRoles = Array.isArray(source.activeRoles)
            ? source.activeRoles.filter(role => validRoles.includes(role))
            : defaultPreferences.activeRoles;

        return {
            bannedHeroIds: [...new Set(bannedHeroIds)],
            activeRoles: [...new Set(activeRoles)],
            isMuted: source.isMuted === true,
            appMode: ['quickRandom', 'training'].includes(source.appMode)
                ? source.appMode
                : defaultPreferences.appMode,
            playerUid: typeof source.playerUid === 'string' ? source.playerUid.trim() : '',
            playerUsername: typeof source.playerUsername === 'string'
                ? source.playerUsername.trim()
                : ''
        };
    }

    function load() {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
            if (!saved || saved.version !== STORAGE_VERSION) {
                return { ...defaultPreferences };
            }

            return sanitize(saved.preferences);
        } catch (error) {
            console.warn('Could not restore preferences:', error);
            return { ...defaultPreferences };
        }
    }

    function save(preferences) {
        const sanitizedPreferences = sanitize(preferences);
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            version: STORAGE_VERSION,
            preferences: sanitizedPreferences
        }));

        return sanitizedPreferences;
    }

    return { load, save };
})();
