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

const addNewProjectsPanel = () => {

    let textEl = document.querySelector('#add-new-projects input');
    if (textEl.value === '') {
        return;
    }

    let headingEl = document.createElement('h3');
    headingEl.textContent = 'Projects - ' + textEl.value;

    let projectsEl = document.createElement('div');
    projectsEl.classList.add('projects', 'panel');
    projectsEl.dataset.host = textEl.value;

    let containerEl = document.querySelector('#projects-container');
    containerEl.appendChild(headingEl);
    containerEl.appendChild(projectsEl);

    setTimeout(() => {
        getAllProjects(textEl.value, projectsEl);
        textEl.value = '';
    }, 0);
};

const saveSettings = () => {

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

    chrome.extension.getBackgroundPage().updateSites(sites);
};

getAllProjects('https://scrapbox.io/', document.querySelector('.projects'));

document.querySelector('#add').addEventListener('click', addNewProjectsPanel);
document.querySelector('#save').addEventListener('click', saveSettings);
