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

    if (settings.linkCountType === 'total') {

        return fetchCaches
            .map(cache => {
                return cache.pages.slice(0, settings.maxLinks)
                    .map(page => {
                        return {baseUrl: cache.baseUrl, project: cache.project, title: page.title, updated: page.updated};
                    });
            })
            .reduce((a, b) => {
                return a.concat(b);
            })
            .sort((a, b) => {
                return b.updated - a.updated;
            })
            .slice(0, settings.maxLinks);

    } else if (settings.linkCountType === 'host') {

        return fetchCaches
            .map(cache => {
                return cache.pages.slice(0, settings.maxLinks)
                    .map(page => {
                        return {baseUrl: cache.baseUrl, project: cache.project, title: page.title, updated: page.updated};
                    });
            })
            .reduce((a, b) => {
                return a.concat(b);
            })
            .sort((a, b) => {
                return b.updated - a.updated;
            })
            .reduce((a, b) => {
                a.forEach(bag => {
                    if (bag.baseUrl === b.baseUrl) {
                        bag.items = bag.items.push(b);
                        return a;
                    }
                });
                a.push({baseUrl: b.baseUrl, items: [b]});
                return a;
            }, [])
            .map(c => {
                return c.items.slice(0, settings.maxLinks)
                    .map(item => {
                        return {baseUrl: item.baseUrl, project: item.project, title: item.title}
                    });
            })
            .reduce((a, b) => {
                return a.concat(b);
            });

    } else if (settings.linkCountType === 'project') {

        return fetchCaches
            .map(cache => {
                return cache.pages.slice(0, settings.maxLinks)
                    .map(page => {
                        return {baseUrl: cache.baseUrl, project: cache.project, title: page.title};
                    });
            })
            .reduce((a, b) => {
                return a.concat(b);
            });

    }
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
