let menuItems = document.querySelectorAll('.menu-item');
menuItems.forEach((menuItem) => {
    menuItem.addEventListener('click', () => {
        let target = menuItem.dataset.menuContent;
        let menuContents = document.querySelectorAll('.menu-content');
        menuContents.forEach((menuContent) => {
            menuContent.classList.remove('menu-content_active');
            if (menuContent.id === target) {
                menuContent.classList.add('menu-content_active');
            }
        });

        menuItems.forEach((m) => {
            m.classList.remove('menu-item_active');
        });
        menuItem.classList.add('menu-item_active');
    });
});

let background = chrome.extension.getBackgroundPage();

let recentPagesEl = document.querySelector('#recent-pages');
recentPagesEl.innerHTML = '';

let recentPages = background.getRecentPages();
recentPages.forEach(page => {

    let wrapperEl = document.createElement('div');

    let linkEl = document.createElement('a');
    linkEl.href = page.baseUrl + '/' + page.project + '/' + page.title;
    linkEl.target = '_blank';
    linkEl.textContent = page.title;
    linkEl.onclick = () => {
        background.notifyWatchPageAccessed(page.baseUrl, page.project, page.title, new Date().getTime() / 1000);
    };
    wrapperEl.appendChild(linkEl);

    if (page.image) {
        let imageEl = document.createElement('img');
        imageEl.src = page.image;
        wrapperEl.appendChild(imageEl);
    }

    wrapperEl.appendChild(document.createElement('br'));

    let projectEl = document.createElement('span');
    projectEl.textContent = page.project;
    wrapperEl.appendChild(projectEl);

    let updatedEl = document.createElement('span');
    updatedEl.textContent = new Date(page.updated * 1000).toLocaleString();
    wrapperEl.appendChild(updatedEl);

    recentPagesEl.appendChild(wrapperEl);

});

let watchPagesEl = document.querySelector('#watch-pages');
watchPagesEl.innerHTML = '';

let watchPages = background.getWatchPages();
watchPages.forEach(page => {

    let wrapperEl = document.createElement('div');

    let linkEl = document.createElement('a');
    linkEl.href = page.baseUrl + '/' + page.project + '/' + page.title;
    linkEl.target = '_blank';
    linkEl.textContent = page.title;
    linkEl.onclick = () => {
        background.notifyWatchPageAccessed(page.baseUrl, page.project, page.title, new Date().getTime() / 1000);
    };
    wrapperEl.appendChild(linkEl);

    if (page.image) {
        let imageEl = document.createElement('img');
        imageEl.src = page.image;
        wrapperEl.appendChild(imageEl);
    }

    wrapperEl.appendChild(document.createElement('br'));

    let projectEl = document.createElement('span');
    projectEl.textContent = page.project;
    wrapperEl.appendChild(projectEl);

    let updatedEl = document.createElement('span');
    updatedEl.textContent = new Date(page.updated * 1000).toLocaleString();
    wrapperEl.appendChild(updatedEl);

    watchPagesEl.appendChild(wrapperEl);

});

let markEl = document.createElement('button');
markEl.textContent = 'Mark as read';
markEl.onclick = () => {
    markEl.disabled = true;
    watchPages.forEach(page => {
        background.notifyWatchPageAccessed(page.baseUrl, page.project, page.title, new Date().getTime() / 1000);
    });
    setTimeout(() => {
        watchPagesEl.innerHTML = '';
        setTimeout(() => {
            window.close();
        }, 1000);
    }, 1000);
};
watchPagesEl.prepend(markEl);

setTimeout(() => {
    if (background.getOpenTabType() === 'recent-pages') {
        menuItems[0].click();
    } else if (background.getOpenTabType() === 'watch-pages') {
        menuItems[1].click();
    }
    menuItems[0].blur();
}, 30);
