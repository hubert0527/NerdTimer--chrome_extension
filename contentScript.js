
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

chrome.extension.onMessage.addListener(function(msg, sender, sendResponse) {

    if (msg && msg.black=="true") {
        var tar = document.getElementById("nerdDiv");
        if(tar!=undefined){
            return;
        }

        var iDiv = document.createElement('div');
        iDiv.id = "nerdDiv";
        $(iDiv).css("background-color","#888888");
        $(iDiv).css("position","fixed");
        $(iDiv).css("width","100%");
        $(iDiv).css("height","100%");
        $(iDiv).css("opacity","0.7");
        $(iDiv).css("z-index","2147483647");
        $(iDiv).css("top","0");
        $(iDiv).css("left","0");

        document.getElementsByTagName("BODY")[0].appendChild(iDiv);

        var path = chrome.extension.getURL("blocker.html");
        $('#nerdDiv').load(path,function(){
            /**
             * write script for loaded blocker html here
             * @type {string}
             */
            //document.getElementById("main_message").textContent = "load!";
        });

    }
    else if(msg.black=="false"){
        var tar = document.getElementById("nerdDiv");
        if(tar!=undefined){
            document.getElementsByTagName("BODY")[0].removeChild(tar);
        }
    }
},false);
