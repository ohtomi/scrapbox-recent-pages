let settings = null;
let fetchers = [];

//

const createContextMenu = () => {
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

    let contextMenuAvailableUrlPatterns = settings.sites.map(site => {
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
};

const resetFetchTimer = () => {

    fetchers.forEach(fetcher => {
        fetcher.stop();
    });

    fetchers = [];

    settings.sites.forEach(site => {
        site.projects.forEach(project => {
            let fetcher = new Fetcher(site.baseUrl, project, settings.checkIntervalSec);
            fetcher.start();
            fetchers.push(fetcher);
        });
    });
};

//

function filterRecentPages(fetchCaches, maxLinks, linkCountType) {

    if (fetchCaches.length === 0) {
        return [];
    }

    if (linkCountType === 'total') {

        return fetchCaches
            .sort((a, b) => {
                return b.updated - a.updated;
            })
            .slice(0, maxLinks);

    } else if (linkCountType === 'host') {

        return fetchCaches
            .reduce((hosts, cache) => {
                let host = hosts.find((element, index, array) => {
                    return element.baseUrl === cache.baseUrl;
                });
                if (!host) {
                    host = {baseUrl: cache.baseUrl, pages: [cache]};
                    hosts.push(host);
                } else {
                    host.pages.push(cache);
                }
                return hosts;
            }, [])
            .map(host => {
                return host.pages
                    .sort((a, b) => {
                        return b.updated - a.updated;
                    })
                    .slice(0, maxLinks);
            })
            .reduce((a, b) => {
                return a.concat(b);
            });

    } else if (linkCountType === 'project') {

        return fetchCaches
            .reduce((projects, cache) => {
                let project = projects.find((element, index, array) => {
                    return element.baseUrl === cache.baseUrl && element.project === cache.project;
                });
                if (!project) {
                    project = {baseUrl: cache.baseUrl, project: cache.project, pages: [cache]};
                    projects.push(project);
                } else {
                    project.pages.push(cache);
                }
                return projects;
            }, [])
            .map(project => {
                return project.pages
                    .sort((a, b) => {
                        return b.updated - a.updated;
                    })
                    .slice(0, maxLinks);
            })
            .reduce((a, b) => {
                return a.concat(b);
            });

    }
}

let watchCaches = [];

function getRecentPages() {
    let fetchCaches = fetchers
        .map(fetcher => {

            // TODO
            fetcher.cache.forEach(page => {
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

            return fetcher.cache;
        })
        .reduce((a, b) => {
            return a.concat(b);
        });
    return filterRecentPages(fetchCaches, settings.maxLinks, settings.linkCountType);
}

function getMaxLinks() {
    return settings.maxLinks;
}

function updateMaxLinks(value) {
    settings.maxLinks = value;
    settings.save();
}

function getLinkCountType() {
    return settings.linkCountType;
}

function updateLinkCountType(value) {
    settings.linkCountType = value;
    settings.save();
}

function getCheckIntervalSec() {
    return settings.checkIntervalSec;
}

function updateCheckIntervalSec(value) {
    settings.checkIntervalSec = value;
    settings.save().then(() => {
        resetFetchTimer();
    })
}

function getSites() {
    return settings.sites;
}

function updateSites(values) {
    settings.sites = values;
    settings.save().then(() => {
        resetFetchTimer();
    })
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
        settings.save();
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
        settings.save();
    }
}

function notifyWatchPageAccessed(baseUrl, project, title, accessed) {
    let exist = settings.watches.find((element, index, array) => {
        return element.baseUrl === baseUrl && element.project === project && element.title === title;
    });

    if (exist) {
        exist.accessed = accessed;
        settings.save();
    }
}

//

if (chrome.storage) {
    Settings.load().then(s => {
        settings = s;
        resetFetchTimer();
        createContextMenu();
    });
}
