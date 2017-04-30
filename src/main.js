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

function filterRecentPages(fetchCaches, maxLinks, linkCountType) {

    if (fetchCaches.length === 0) {
        return [];
    }

    if (linkCountType === 'total') {

        return fetchCaches
            .map(cache => {
                return cache.pages.slice(0, maxLinks)
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
            .slice(0, maxLinks);

    } else if (linkCountType === 'host') {

        return fetchCaches
            .map(cache => {
                return cache.pages.slice(0, maxLinks)
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
                let bag = a.find((element, index, array) => {
                    return element.baseUrl === b.baseUrl;
                });

                if (bag) {
                    bag.items.push(b);
                } else {
                    bag = {baseUrl: b.baseUrl, items: [b]};
                    a.push(bag);
                }
                return a;
            }, [])
            .map(c => {
                return c.items.slice(0, maxLinks)
                    .map(item => {
                        return {baseUrl: item.baseUrl, project: item.project, title: item.title}
                    });
            })
            .reduce((a, b) => {
                return a.concat(b);
            });

    } else if (linkCountType === 'project') {

        return fetchCaches
            .map(cache => {
                return cache.pages.slice(0, maxLinks)
                    .map(page => {
                        return {baseUrl: cache.baseUrl, project: cache.project, title: page.title};
                    });
            })
            .reduce((a, b) => {
                return a.concat(b);
            });

    }
}

function getRecentPages() {
    return filterRecentPages(fetchCaches, settings.maxLinks, settings.linkCountType);
}

function fetchRecentPages(baseUrl, project, skip, limit, pages) {

    window.fetch(baseUrl + '/api/pages/' + project + '?skip=' + skip + '&sort=updated&limit=' + limit + '&q=', SCRAPBOX_FETCH_OPTIONS)
        .then(res => {
            res.json().then(body => {

                if (body.skip + body.limit < body.count) {
                    fetchRecentPages(baseUrl, project, skip + limit, limit, pages.concat(body.pages));
                } else {
                    let cache = fetchCaches.find((element, index, array) => {
                        return element.baseUrl === baseUrl && element.project === project;
                    });

                    if (cache) {
                        cache.pages = pages.concat(body.pages);
                    } else {
                        cache = {baseUrl: baseUrl, project: project, pages: pages.concat(body.pages)};
                        fetchCaches.push(cache);
                    }

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
                fetchRecentPages(site.baseUrl, project, 0, SCRAPBOX_FETCH_LIMIT, []);
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

if (chrome.storage) {
    loadSettings();
}
