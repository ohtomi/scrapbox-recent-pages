const getAllProjects = (baseUrl, projectsEl) => {

    let background = chrome.extension.getBackgroundPage();

    background.getAllProjects(baseUrl)
        .then(res => {
            res.json().then(data => {

                projectsEl.innerHTML = '';

                for (index in data.projects) {
                    let p = data.projects[index];
                    let checkboxEl = document.createElement('input');
                    checkboxEl.type = 'checkbox';
                    checkboxEl.name = 'projects';
                    checkboxEl.value = p.name;
                    let labelEl = document.createElement('label');
                    labelEl.appendChild(checkboxEl);
                    labelEl.append(p.displayName);
                    labelEl.appendChild(document.createElement('br'));
                    projectsEl.appendChild(labelEl);
                }
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

    let sites = background.getSites();
    sites.forEach(site => {
        addNewProjectsPanel(site.baseUrl, site.projects);
    });
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
};

//

loadSettings();
document.querySelector('#save').addEventListener('click', saveSettings);
