class Settings {

    constructor(settings) {
        this.maxLinks = settings.maxLinks || 30;
        this.linkCountType = settings.linkCountType || 'total';
        this.checkIntervalSec = settings.checkIntervalSec || 60;
        this.sites = settings.sites || [{baseUrl: 'https://scrapbox.io', projects: []}];
        this.watches = settings.watches || [];
    }

    static async load() {
        let p = new Promise((resolve, reject) => {
            chrome.storage.local.get(['maxLinks', 'linkCountType', 'checkIntervalSec', 'sites', 'watches'], (current) => {
                resolve(new Settings(current));
            });
        });
        return await p;
    }

    async save() {
        let p = new Promise((resolve, reject) => {
            chrome.storage.local.set(this, () => {
                resolve();
            });
        });
        return await p;
    }
}
