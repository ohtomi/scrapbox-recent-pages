let settings = null;
let fetchers = [];
let watcher = null;

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
        let project = decodeURIComponent(pathnameTokens[1]);
        let title = decodeURIComponent(pathnameTokens[2]);
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

    let notifier = (pageUrl, contextMenuUpdater) => {
        if (!pageUrl) {
            return;
        }

        let targetUrl = new URL(pageUrl);
        let pathnameTokens = targetUrl.pathname.split('/');
        if (pathnameTokens.length !== 3 || pathnameTokens[1] === '' || pathnameTokens[2] === '') {
            return;
        }

        let baseUrl = targetUrl.origin;
        let project = decodeURIComponent(pathnameTokens[1]);
        let title = decodeURIComponent(pathnameTokens[2]);
        let accessed = new Date().getTime() / 1000;

        notifyWatchPageAccessed(baseUrl, project, title, accessed);

        if (contextMenuUpdater) {
            contextMenuUpdater(baseUrl, project, title);
        }
    };

    chrome.runtime.onMessage.addListener((req, sender, callback) => {
        notifier(req.leftPageUrl);
        notifier(req.currentPageUrl, (baseUrl, project, title) => {
            let watch = settings.watches.find((element, index, array) => {
                return element.baseUrl === baseUrl && element.project === project && element.title === title;
            });

            chrome.contextMenus.update('watch-this-page', {
                checked: watch != null
            }, () => {
                callback();
            });
        });
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
    settings.watches.forEach(watch => {
        let baseUrl = watch.baseUrl;
        let project = watch.project;

        let fetcher = fetchers.find((element, index, array) => {
            return element.baseUrl === baseUrl && element.project === project;
        });

        if (fetcher) {
            return;
        }

        fetcher = new Fetcher(watch.baseUrl, watch.project, settings.checkIntervalSec, true);
        fetcher.start();
        fetchers.push(fetcher);
    });

    if (watcher) {
        watcher.stop();
    }

    watcher = new Watcher(
        () => {
            return settings.watches;
        },
        () => {
            return fetchers;
        },
        (count) => {
            if (count) {
                chrome.browserAction.setBadgeText({text: count + ''});
            } else {
                chrome.browserAction.setBadgeText({text: ''});
            }
        },
        settings.checkIntervalSec / 2);
    watcher.start();
};

//

async function getAllProjects(baseUrl) {
    return FetcherUtils.fetchAllProjects(baseUrl);
}

function filterRecentPages(allPages, maxLinks, linkCountType) {

    if (allPages.length === 0) {
        return [];
    }

    if (linkCountType === 'total') {

        return allPages
            .sort((a, b) => {
                return b.updated - a.updated;
            })
            .slice(0, maxLinks);

    } else if (linkCountType === 'host') {

        return allPages
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

        return allPages
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

function getRecentPages() {
    let allPages = fetchers
        .map(fetcher => {
            if (fetcher.forWatchOnly) {
                return [];
            } else {
                return fetcher.cache;
            }
        })
        .reduce((a, b) => {
            return a.concat(b);
        });
    return filterRecentPages(allPages, settings.maxLinks, settings.linkCountType);
}

function getWatchPages() {
    return watcher.cache
        .sort((a, b) => {
            return b.updated - a.updated;
        });
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

function getOpenTabType() {
    return settings.openTabType;
}

function updateOpenTabType(value) {
    settings.openTabType = value;
    settings.save();
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

        watcher.doWatch();
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

        watcher.doWatch();
    }
}

function notifyWatchPageAccessed(baseUrl, project, title, accessed) {
    let exist = settings.watches.find((element, index, array) => {
        return element.baseUrl === baseUrl && element.project === project && element.title === title;
    });

    if (exist) {
        exist.accessed = accessed;
        settings.save();

        watcher.doWatch();
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
