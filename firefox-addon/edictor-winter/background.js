/*
Open a new tab, and load "my-page.html" into it.
*/
function openMyPage() {
  console.log("injecting");
   chrome.tabs.create({
     "url": chrome.extension.getURL("edictor/index.html"),
     "active": true
   });
}

chrome.browserAction.onClicked.addListener(openMyPage);

