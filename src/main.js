let settings = {
    maxLinks: 30,
    linkCountType: 'total',
    checkIntervalSec: 60,
    sites: [
        {baseUrl: 'https://scrapbox.io', projects: []}
    ]
};

let fetchCaches = [];

let timer = null;

const SCRAPBOX_FETCH_LIMIT = 300;
const SCRAPBOX_FETCH_OPTIONS = {credentials: 'include', mode: 'cors'};

function getRecentPages() {

    let result = [];

    fetchCaches.forEach(cache => {
        cache.pages.slice(0, settings.maxLinks).forEach(page => {
            result.push({baseUrl: cache.baseUrl, project: cache.project, title: page.title});
        });
    });

    return result;
}

function fetchRecentPages(baseUrl, project, skip, limit) {

    let cache = null;
    fetchCaches.forEach(c => {
        if (c.baseUrl === baseUrl && c.project === project) {
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

    let fetcher = () => {
        settings.sites.forEach(site => {
            site.projects.forEach(project => {
                fetchRecentPages(site.baseUrl, project, 0, SCRAPBOX_FETCH_LIMIT);
            });
        });
        timer = setTimeout(fetcher, settings.checkIntervalSec * 1000);
    };

    fetchCaches = [];
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
    chrome.storage.sync.set(settings, resetFetchTimer);
}

function getMaxLinks() {
    return settings.maxLinks;
}

function updateMaxLinks(value) {
    settings.maxLinks = value;
    saveSettings();
}

function getLinkCountType() {
    return settings.linkCountType;
}

function updateLinkCountType(value) {
    settings.linkCountType = value;
    saveSettings();
}

function getCheckIntervalSec() {
    return settings.checkIntervalSec;
}

function updateCheckIntervalSec(value) {
    settings.checkIntervalSec = value;
    saveSettings();
}

function getSites() {
    return settings.sites;
}

function updateSites(values) {
    settings.sites = values;
    saveSettings();
}

//

loadSettings();
