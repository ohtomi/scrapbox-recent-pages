var menuItems = document.querySelectorAll('.menu-item');
menuItems.forEach((menuItem) => {
    menuItem.addEventListener('click', () => {
        var target = menuItem.dataset.menuContent;
        var menuContents = document.querySelectorAll('.menu-content');
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

setTimeout(() => {

    var recentPagesEl = document.querySelector('#recent-pages');
    recentPagesEl.innerHTML = '';

    var recentPages = chrome.extension.getBackgroundPage().getRecentPages();
    recentPages.forEach(page => {

        var linkEl = document.createElement('a');
        linkEl.href = page.baseUrl + '/' + page.project + '/' + page.title;
        linkEl.target = '_blank';
        linkEl.textContent = page.title;
        var wrapperEl = document.createElement('div');
        wrapperEl.appendChild(linkEl);
        recentPagesEl.appendChild(wrapperEl);

    });

    menuItems[0].click();
    menuItems[0].blur();

}, 30);
