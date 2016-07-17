
if (!chrome.runtime) {
    // Chrome 20-21
    chrome.runtime = chrome.extension;
} else if(!chrome.runtime.onMessage) {
    // Chrome 22-25
    chrome.runtime.onMessage = chrome.extension.onMessage;
    chrome.runtime.sendMessage = chrome.extension.sendMessage;
    chrome.runtime.onConnect = chrome.extension.onConnect;
    chrome.runtime.connect = chrome.extension.connect;
}

// chrome.runtime.sendMessage({onStart: "true"}, function(response) {
//     console.log(response.taskDone);
// });

// document.onload(function(){
//
// });


chrome.extension.onMessage.addListener(function(msg, sender, sendResponse) {

    if (msg.black=="true") {

        $(document.body).css("background-color", "red");

        var mDiv = [
            'var d = document.createElement("div");',
            'd.setAttribute("style", "'
            + 'background-color: red; '
            + 'width: 100px; '
            + 'height: 100px; '
            + 'position: fixed; '
            + 'top: 70px; '
            + 'left: 30px; '
            + 'z-index: 9999; '
            + '");',
            'document.body.appendChild(d);'
        ].join("\n");

        getCurrentTabUrl(function () {
            chrome.tabs.executeScript(currentTab.id, {code: mDiv});
        });

    }
},false);

function getCurrentTabUrl(callback) {
  var queryInfo = {
    active: true,
    currentWindow: true
  };

  chrome.tabs.query(queryInfo, function(tabs) {
    var tab = tabs[0];
    var url = tab.url;
    //console.assert(typeof url == 'string', 'tab.url should be a string');

    currentTab = tab;

    callback(url);
  });

}