let settings = {
    maxLinks: 30,
    linkCountType: 'total',
    checkIntervalSec: 60,
    sites: [
        {baseUrl: 'https://scrapbox.io', projects: []}
    ],
    watches: []
};

//

function createContextMenu() {
    chrome.contextMenus.onClicked.addListener((info, tab) => {
        let targetUrl = new URL(info.pageUrl);
        let pathnameTokens = targetUrl.pathname.split('/');
        if (pathnameTokens.length !== 3 || pathnameTokens[1] === '' || pathnameTokens[2] === '') {
            alert('Cannot watch because this is project home page.');
            return;
        }

        let checked = info.checked;
        let baseUrl = targetUrl.origin;
        let project = decodeURI(pathnameTokens[1]);
        let title = decodeURI(pathnameTokens[2]);
        let accessed = new Date().getTime() / 1000;

        if (checked) {
            addWatch({baseUrl: baseUrl, project: project, title: title, accessed: accessed});
        } else {
            deleteWatch({baseUrl: baseUrl, project: project, title: title, accessed: accessed});
        }
    });

    let contextMenuAvailableUrlPatterns = settings.sites
        .map(site => {
            return site.baseUrl + '/*/*';
        });

    chrome.contextMenus.create({
        id: 'watch-this-page',
        type: 'checkbox',
        title: 'Watch this page',
        contexts: ['all'],
        documentUrlPatterns: contextMenuAvailableUrlPatterns
    });

    chrome.runtime.onMessage.addListener((req, sender, callback) => {
        let currentUrl = new URL(req.pageUrl);
        let pathnameTokens = currentUrl.pathname.split('/');
        if (pathnameTokens.length !== 3 || pathnameTokens[1] === '' || pathnameTokens[2] === '') {
            return;
        }

        let baseUrl = currentUrl.origin;
        let project = decodeURI(pathnameTokens[1]);
        let title = decodeURI(pathnameTokens[2]);
        let accessed = new Date().getTime() / 1000;

        let watch = settings.watches.find((element, index, array) => {
            return element.baseUrl === baseUrl && element.project === project && element.title === title;
        });

        chrome.contextMenus.update('watch-this-page', {
            checked: watch != null
        }, () => {
            callback();
        });

        notifyWatchPageAccessed(baseUrl, project, title, accessed);
    });
}

//

let fetchCaches = [];
let watchCaches = [];

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
                return cache.pages.slice(0, maxLinks).map(page => {
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
                return cache.pages.slice(0, maxLinks).map(page => {
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
                return c.items.slice(0, maxLinks).map(item => {
                    return {baseUrl: item.baseUrl, project: item.project, title: item.title}
                });
            })
            .reduce((a, b) => {
                return a.concat(b);
            });

    } else if (linkCountType === 'project') {

        return fetchCaches
            .map(cache => {
                return cache.pages.slice(0, maxLinks).map(page => {
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

                    cache.pages.forEach(page => {
                        let watch = settings.watches.find((element, index, array) => {
                            return element.baseUrl === baseUrl && element.project === project && element.title === page.title;
                        });
                        if (!watch) {
                            return;
                        }

                        let wcache = watchCaches.find((element, index, array) => {
                            return element.baseUrl === baseUrl && element.project === project && element.pages.length === 1 && element.pages[0].title === page.title;
                        });

                        if (watch.accessed < page.updated) {
                            if (!wcache) {
                                wcache = {baseUrl: baseUrl, project: project, pages: [page]};
                                watchCaches.push(wcache);
                            } else {
                                wcache.pages = [page];
                            }
                        } else {
                            if (wcache) {
                                watchCaches = watchCaches.filter((element, index, array) => {
                                    return element.baseUrl !== wcache.baseUrl || element.project !== wcache.project || element.pages.length !== 1 || element.pages[0].title !== wcache.pages[0].title;
                                })
                            }
                        }
                    });

                    if (watchCaches.length) {
                        chrome.browserAction.setBadgeText({text: watchCaches.length + ''});
                    } else {
                        chrome.browserAction.setBadgeText({text: ''});
                    }
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

        settings.watches = current.watches || settings.watches;

        resetFetchTimer();
        createContextMenu();
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

function getWatches() {
    return settings.watches;
}

function addWatch(value) {
    let exist = settings.watches.find((element, index, array) => {
        return element.baseUrl === value.baseUrl && element.project === value.project && element.title === value.title;
    });

    if (!exist) {
        settings.watches.push(value);
        saveSettings();
    }
}

function deleteWatch(value) {
    let exist = settings.watches.find((element, index, array) => {
        return element.baseUrl === value.baseUrl && element.project === value.project && element.title === value.title;
    });

    if (exist) {
        settings.watches = settings.watches.filter((element, index, array) => {
            return element.baseUrl !== value.baseUrl || element.project !== value.project || element.title !== value.title;
        });
        saveSettings();
    }
}

function notifyWatchPageAccessed(baseUrl, project, title, accessed) {
    let exist = settings.watches.find((element, index, array) => {
        return element.baseUrl === baseUrl && element.project === project && element.title === title;
    });

    if (exist) {
        exist.accessed = accessed;
        saveSettings();
    }
}

//

if (chrome) {
    loadSettings();
}
