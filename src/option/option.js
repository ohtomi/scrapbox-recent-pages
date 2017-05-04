const getAllProjects = (baseUrl, projectsEl) => {

    let background = chrome.extension.getBackgroundPage();

    let site = background.getSites().find((element, index, array) => {
        return element.baseUrl === baseUrl;
    });

    background.getAllProjects(baseUrl)
        .then(res => {
            res.json().then(data => {

                projectsEl.innerHTML = '';

                data.projects.forEach(p => {
                    let checkboxEl = document.createElement('input');
                    checkboxEl.type = 'checkbox';
                    checkboxEl.name = 'projects';
                    checkboxEl.value = p.name;

                    checkboxEl.checked = site.projects
                        .map(name => {
                            return name === p.name;
                        })
                        .reduce((a, b) => {
                            return a || b;
                        }, false);

                    let labelEl = document.createElement('label');
                    labelEl.appendChild(checkboxEl);
                    labelEl.append(p.displayName);
                    labelEl.appendChild(document.createElement('br'));

                    projectsEl.appendChild(labelEl);
                });
            });
        })
        .catch(e => {

            projectsEl.innerHTML = '';

            let reloadEl = document.createElement('button');
            reloadEl.textContent = 'Fetch projects';
            reloadEl.onclick = () => {
                getAllProjects(baseUrl, projectsEl);
            };
            projectsEl.appendChild(reloadEl);
        });
};

const addNewProjectsPanel = (baseUrl, projects) => {

    let headingEl = document.createElement('h3');
    headingEl.textContent = 'Projects - ' + baseUrl;

    let projectsEl = document.createElement('div');
    projectsEl.classList.add('projects', 'panel');
    projectsEl.dataset.host = baseUrl;

    let containerEl = document.querySelector('#projects-container');
    containerEl.appendChild(headingEl);
    containerEl.appendChild(projectsEl);

    getAllProjects(baseUrl, projectsEl);
};

const addWatchItems = (watches) => {

    let background = chrome.extension.getBackgroundPage();

    let panelEl = document.querySelector('#watches');
    panelEl.innerHTML = '';

    watches
        .sort((a, b) => {
            return a.title.localeCompare(b.title);
        })
        .forEach(watch => {
            let wrapperEl = document.createElement('div');

            wrapperEl.appendChild(document.createTextNode('\u2714 '))

            let titleEl = document.createElement('span');
            titleEl.textContent = watch.title;
            titleEl.title = '[' + watch.project + '] ' + watch.title;
            wrapperEl.appendChild(titleEl);

            panelEl.appendChild(wrapperEl);
        });
};

const loadSettings = () => {

    let background = chrome.extension.getBackgroundPage();

    let maxLinks = background.getMaxLinks();
    let maxLinksEl = document.querySelector(('#max-links'));
    maxLinksEl.value = maxLinks;

    let linkCountType = background.getLinkCountType();
    let linkCountTypeEls = document.querySelectorAll('input[name="link-count-type"]');
    linkCountTypeEls.forEach(linkCountTypeEl => {
        if (linkCountTypeEl.value === linkCountType) {
            linkCountTypeEl.checked = true;
        }
    });

    let checkIntervalSec = background.getCheckIntervalSec();
    let checkIntervalSecEl = document.querySelector('#check-interval-sec');
    checkIntervalSecEl.value = checkIntervalSec;

    let openTabType = background.getOpenTabType();
    let openTabTypeEls = document.querySelectorAll('input[name="open-tab-type"]');
    openTabTypeEls.forEach(openTabTypeEl => {
        if (openTabTypeEl.value === openTabType) {
            openTabTypeEl.checked = true;
        }
    });

    let sites = background.getSites();
    sites.forEach(site => {
        addNewProjectsPanel(site.baseUrl, site.projects);
    });

    let watches = background.getWatches();
    if (watches.length) {
        addWatchItems(watches);
    }
};

const saveSettings = () => {

    let background = chrome.extension.getBackgroundPage();

    let maxLinksEl = document.querySelector(('#max-links'));
    if (maxLinksEl.value) {
        background.updateMaxLinks(maxLinksEl.value);
    }

    let linkCountTypeEls = document.querySelectorAll('input[name="link-count-type"]');
    linkCountTypeEls.forEach(linkCountTypeEl => {
        if (linkCountTypeEl.checked) {
            background.updateLinkCountType(linkCountTypeEl.value);
        }
    });

    let checkIntervalSecEl = document.querySelector('#check-interval-sec');
    if (checkIntervalSecEl.value) {
        background.updateCheckIntervalSec(checkIntervalSecEl.value);
    }

    let openTabTypeEls = document.querySelectorAll('input[name="open-tab-type"]');
    openTabTypeEls.forEach(openTabTypeEl => {
        if (openTabTypeEl.checked) {
            background.updateOpenTabType(openTabTypeEl.value);
        }
    });

    let sites = [];

    let projectsEls = document.querySelectorAll('.projects');
    projectsEls.forEach((projectsEl) => {
        let host = projectsEl.dataset.host;
        let site = {baseUrl: host, projects: []};
        let checkboxEls = projectsEl.querySelectorAll('input[type="checkbox"]');
        checkboxEls.forEach(checkboxEl => {
            if (checkboxEl.checked) {
                site.projects.push(checkboxEl.value);
            }
        });
        sites.push(site);
    });

    if (sites.length) {
        background.updateSites(sites);
    }

    window.close();
};

//

loadSettings();
document.querySelector('#save').addEventListener('click', saveSettings);
