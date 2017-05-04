let currentPageUrl = null;

let observer = new MutationObserver(() => {
    if (location.href === currentPageUrl) {
        return;
    }

    let message = {
        leftPageUrl: currentPageUrl,
        currentPageUrl: location.href
    };
    chrome.runtime.sendMessage(chrome.runtime.id, message, () => {
    });
    currentPageUrl = location.href;
});

observer.observe(document.body, {childList: true, subtree: true});
