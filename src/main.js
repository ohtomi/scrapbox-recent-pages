var settings = {
    maxLinks: 30,
    checkIntervalSec: 60,
    sites: []
};

var fetchCaches = [];

var timer = null;

const SCRAPBOX_FETCH_LIMIT = 300;
const SCRAPBOX_FETCH_OPTIONS = {credentials: 'include', mode: 'cors'};

function getRecentPages() {

    var result = [];

    fetchCaches.forEach(cache => {
        result.push({baseUrl: cache.baseUrl, project: cache.project, pages: cache.pages.slice(0, settings.maxLinks)});
    });

    return result;
}

function fetchRecentPages(baseUrl, project, skip, limit) {

    var cache = null;
    fetchCaches.forEach(c => {
        if (c.baseUrl === baseUrl) {
            cache = c;
        }
    });

    if (!cache) {
        cache = {baseUrl: baseUrl, project: project, pages: []};
        fetchCaches.push(cache);
    } else {
        cache.pages = [];
    }

    window.fetch(baseUrl + '/api/pages/' + project + '?skip=' + skip + '&sort=updated&limit=' + limit + '&q=', SCRAPBOX_FETCH_OPTIONS)
        .then(res => {
            res.json().then(body => {

                cache.pages = cache.pages.concat(body.pages);
                if (body.skip + body.limit < body.count) {
                    fetchRecentPages(baseUrl, project, skip + limit, limit);
                } else {
                    // TODO
                }

            });
        })
        .catch(e => {
            // TODO
        });
}

function resetFetchTimer() {

    if (timer) {
        clearTimeout(timer);
        timer = null;
    }

    var fetcher = () => {
        settings.sites.forEach(site => {
            site.projects.forEach(project => {
                fetchRecentPages(site.baseUrl, project, 0, SCRAPBOX_FETCH_LIMIT);
            });
        });
        timer = setTimeout(fetcher, settings.checkIntervalSec * 1000);
    };

    fetcher();
}

function loadSettings() {

    chrome.storage.sync.get({}, (current) => {
        settings.maxLinks = current.maxLinks || settings.maxLinks;
        settings.checkIntervalSec = current.checkIntervalSec || settings.checkIntervalSec;

        if (current.sites) {
            current.sites.forEach(site => {
                settings.sites[site.baseUrl] = site.projects;
            });
        }

        resetFetchTimer();
    });
}

function saveSettings() {
    chrome.storage.sync.set(settings);
}

function updateMaxLinks(value) {
    settings.maxLinks = value;
    saveSettings();
}

function updateCheckIntervalSec(value) {
    settings.checkIntervalSec = value;
    saveSettings();
}

function updateSites(values) {
    settings.sites = values;
    saveSettings();
}

//

loadSettings();
