const store = {};

global.localStorage = {
    getItem(key) {
        return store[key] ?? null;
    },
    setItem(key, value) {
        store[key] = String(value);
    },
    removeItem(key) {
        delete store[key];
    },
    clear() {
        Object.keys(store).forEach((key) => delete store[key]);
    }
};
