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

    let linkEl = document.createElement('a');
    linkEl.href = page.baseUrl + '/' + page.project + '/' + page.title;
    linkEl.target = '_blank';
    linkEl.textContent = page.title;
    linkEl.onclick = () => {
        background.notifyWatchPageAccessed(page.baseUrl, page.project, page.title, new Date().getTime() / 1000);
    };
    let wrapperEl = document.createElement('div');
    wrapperEl.appendChild(linkEl);
    recentPagesEl.appendChild(wrapperEl);

});

let watchPagesEl = document.querySelector('#watch-pages');
watchPagesEl.innerHTML = '';

let watchPages = background.getWatchPages();
watchPages.forEach(page => {

    let linkEl = document.createElement('a');
    linkEl.href = page.baseUrl + '/' + page.project + '/' + page.title;
    linkEl.target = '_blank';
    linkEl.textContent = page.title;
    linkEl.onclick = () => {
        background.notifyWatchPageAccessed(page.baseUrl, page.project, page.title, new Date().getTime() / 1000);
    };
    let wrapperEl = document.createElement('div');
    wrapperEl.appendChild(linkEl);
    watchPagesEl.appendChild(wrapperEl);

});

setTimeout(() => {
    menuItems[0].click();
    menuItems[0].blur();
}, 30);
