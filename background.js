if (typeof browser === "undefined") {
    var browser = chrome;
}

browser.action.onClicked.addListener(() => {
    browser.runtime.openOptionsPage().catch(() => {});
});
