setInterval(() => {

    let msg = {
        pageUrl: location.href
    };
    chrome.runtime.sendMessage(chrome.runtime.id, msg, (res) => {
    });

}, 30000); // TODO
