function getAllProjects(baseUrl, projectsEl) {

    if (baseUrl.substring(baseUrl.length - 1) === '/') {
        baseUrl = baseUrl.substring(0, baseUrl.length - 1);
    }

    window.fetch(baseUrl + '/api/projects', {credentials: 'include', mode: 'cors'})
        .then((res) => {
            res.json().then((data) => {
                for (index in data.projects) {
                    var p = data.projects[index];
                    var checkboxEl = document.createElement('input');
                    checkboxEl.type = 'checkbox'
                    checkboxEl.name = 'projects';
                    checkboxEl.value = p.name;
                    var labelEl = document.createElement('label');
                    labelEl.appendChild(checkboxEl)
                    labelEl.append(p.displayName);
                    labelEl.appendChild(document.createElement('br'))
                    projectsEl.appendChild(labelEl);
                }
            });
        })
        .catch((e) => {
            // TODO
        });
}

function addNewProjectsPanel() {

    var textEl = document.querySelector('#add-new-projects input');
    if (textEl.value === '') {
        return;
    }

    var headingEl = document.createElement('h3');
    headingEl.textContent = 'Projects - ' + textEl.value;

    var projectsEl = document.createElement('div');
    projectsEl.classList.add('projects', 'panel');
    projectsEl.dataset.host = textEl.value;

    var containerEl = document.querySelector('#projects-container');
    containerEl.appendChild(headingEl);
    containerEl.appendChild(projectsEl);

    setTimeout(() => {
        getAllProjects(textEl.value, projectsEl);
        textEl.value = '';
    }, 0);
}

function loadSettings() {

    chrome.storage.sync.get({projects: []}, (settings) => {
        settings.projects.forEach((setting) => {
            // TODO
            console.log(setting);
        });
    });
}

function saveSettings() {

    var settings = {projects: []};

    var projectsEls = document.querySelectorAll('.projects');
    projectsEls.forEach((projectsEl) => {
        var host = projectsEl.dataset.host;
        var setting = {name: host, projects: []};
        var checkboxEls = projectsEl.querySelectorAll('input[type="checkbox"]');
        checkboxEls.forEach((checkboxEl) => {
            if (checkboxEl.checked) {
                setting.projects.push(checkboxEl.value);
            }
        });
        settings.projects.push(setting);
    });

    chrome.storage.sync.set(settings);
}

loadSettings();
getAllProjects('https://scrapbox.io/', document.querySelector('.projects'));

document.querySelector('#add').addEventListener('click', addNewProjectsPanel);
document.querySelector('#save').addEventListener('click', saveSettings);
