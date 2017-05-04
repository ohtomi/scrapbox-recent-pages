class Watcher {

    constructor(watchesRef, fetchersRef, callbackRef, checkIntervalSec) {
        this.watchesRef = watchesRef;
        this.fetchersRef = fetchersRef;
        this.callbackRef = callbackRef;
        this.checkIntervalSec = checkIntervalSec;

        this._timer = null;
        this.cache = [];
    }

    start() {
        if (this._timer) {
            throw new Error('already started');
        }

        this._timer = setInterval(() => {
            if (!this._fetching) {
                this.doWatch();
            }
        }, this.checkIntervalSec * 1000);
    }

    stop() {
        if (this._timer) {
            clearInterval(this._timer);
            this._timer = null;
        }
    }

    doWatch() {

        let watches = this.watchesRef();
        let fetchers = this.fetchersRef();
        let allPages = fetchers
            .map(fetcher => {
                return fetcher.cache;
            })
            .reduce((a, b) => {
                return a.concat(b);
            });

        this.cache = allPages.filter((element, index, array) => {
            let baseUrl = element.baseUrl;
            let project = element.project;
            let title = element.title;
            let updated = element.updated;

            let watch = watches.find((element, index, array) => {
                return element.baseUrl === baseUrl && element.project === project && element.title === title;
            });

            return watch && (!watch.accessed || watch.accessed < updated);
        });

        this.callbackRef(this.cache.length);
    }
}
