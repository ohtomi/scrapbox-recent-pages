const SCRAPBOX_FETCH_LIMIT = 300;
const SCRAPBOX_FETCH_OPTIONS = {credentials: 'include', mode: 'cors'};

class Fetcher {

    constructor(baseUrl, project, checkIntervalSec) {
        this.baseUrl = baseUrl;
        this.project = project;
        this.checkIntervalSec = checkIntervalSec;

        this.timer = null;
        this.cache = [];
        this.error = null;
    }

    static start(baseUrl, project, checkIntervalSec) {
        let instance = new Fetcher(baseUrl, project, checkIntervalSec);
        instance.doFetch(0, SCRAPBOX_FETCH_LIMIT, []);
        return instance;
    }

    stop() {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }

    doFetch(skip, limit, pages) {

        window.fetch(this.baseUrl + '/api/pages/' + this.project + '?skip=' + skip + '&sort=updated&limit=' + limit + '&q=', SCRAPBOX_FETCH_OPTIONS)
            .then(res => {
                res.json()
                    .then(body => {
                        if (body.skip + body.limit < body.count) {
                            this.doFetch(skip + limit, limit, pages.concat(body.pages));
                        } else {
                            this.timer = setTimeout(() => this.doFetch(0, SCRAPBOX_FETCH_LIMIT, []), this.checkIntervalSec * 1000);
                            this.cache = pages.concat(body.pages);
                            this.error = null;
                        }
                    });
            })
            .catch(e => {
                this.timer = setTimeout(() => this.doFetch(0, SCRAPBOX_FETCH_LIMIT, []), this.checkIntervalSec * 1000);
                this.cache = [];
                this.error = e;
            });
    }
}
