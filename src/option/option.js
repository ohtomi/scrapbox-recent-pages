const getAllProjects = (baseUrl, projectsEl) => {

    if (baseUrl.substring(baseUrl.length - 1) === '/') {
        baseUrl = baseUrl.substring(0, baseUrl.length - 1);
    }

    window.fetch(baseUrl + '/api/projects', {credentials: 'include', mode: 'cors'})
        .then(res => {
            res.json().then(data => {

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
            // TODO
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

    setTimeout(() => {
        getAllProjects(baseUrl, projectsEl);
    }, 0);
};

const loadSettings = () => {

    let background = chrome.extension.getBackgroundPage();

    let maxLinks = background.getMaxLinks();
    let maxLinksEl = document.querySelector(('#max-links'));
    maxLinksEl.value = maxLinks;

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
