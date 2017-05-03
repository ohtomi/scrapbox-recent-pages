const SCRAPBOX_FETCH_LIMIT = 300;
const SCRAPBOX_FETCH_OPTIONS = {credentials: 'include', mode: 'cors'};

class Fetcher {

    constructor(baseUrl, project, checkIntervalSec) {
        this.baseUrl = baseUrl;
        this.project = project;
        this.checkIntervalSec = checkIntervalSec;

        this._timer = null;
        this._fetching = false;
        this.cache = [];
        this.error = null;
    }

    start() {
        if (this._timer) {
            throw new Error('already started');
        }

        this._timer = setInterval(() => {
            if (!this._fetching) {
                this.doFetch(0, SCRAPBOX_FETCH_LIMIT, []);
            }
        }, this.checkIntervalSec * 1000);
    }

    stop() {
        if (this._timer) {
            clearInterval(this._timer);
            this._timer = null;
        }
    }

    doFetch(skip, limit, pages) {

        this._fetching = true;
        window.fetch(this.baseUrl + '/api/pages/' + this.project + '?skip=' + skip + '&sort=updated&limit=' + limit + '&q=', SCRAPBOX_FETCH_OPTIONS)
            .then(res => {
                res.json()
                    .then(body => {
                        if (body.skip + body.limit < body.count) {
                            this.doFetch(skip + limit, limit, pages.concat(body.pages));
                        } else {
                            this._fetching = false;
                            this.cache = pages.concat(body.pages);
                            this.error = null;
                        }
                    });
            })
            .catch(e => {
                this._fetching = false;
                this.cache = [];
                this.error = e;
            });
    }
}
