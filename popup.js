var blackList = [
    "www.facebook.com",
    "m.facebook.com"
];

var whiteList = [
    "www.facebook.com/profile"
];

var ignore = [
    "www",
    "com",
    "tw",
    "m",
    "cn",
    "us",
    "jp"
];

var purifiedBlack;
var purifiedWhite;
//
// $(window).load(function(){
//     loadFile();
//     console.log("blacks: " + blackList.toString());
//     console.log("whites: " + whiteList.toString());
//     $(window).load(function(){
//         $(document.getElementsByTagName("BODY")).css("background-color","red");
//     });
// });

window.addEventListener("DOMContentLoaded", function() {

    loadFile();
    document.getElementById("test").addEventListener("click", test);
    document.getElementById("addToBlackList").addEventListener("click", addOnlyThisPageToBlackList);
    document.getElementById("addToWhiteList").addEventListener("click", addToWhiteList);

    console.log("blacks: " + blackList.toString());
    console.log("whites: " + whiteList.toString());

});

var refreshTab = "";

/**
 * four modes
 * 1. lock this domain
 * 2. lock only this page
 * 3. lock partly domain (multiple choice)
 */
function addBaseDomainToBlackList(){
    getCurrentTabUrl(function(url){

        // check if already exist
        for(var i=0; i<blackList.length;i++){
            if(blackList[i]==url) return;
        }
        for(var i=0; i<whiteList.length;i++){
            if(whiteList[i]==url) return;
        }

        blackList.push(url);
        saveFile(function(){
            getCurrentTab(function(tab){
                chrome.tabs.reload(tab.id);
                console.log("add to black and refresh");
            });
        });


    });
}

function addOnlyThisPageToBlackList(){
    getCurrentTabUrl(function(url){

        // check if already exist
        for(var i=0; i<blackList.length;i++){
            if(blackList[i]==url) return;
        }
        for(var i=0; i<whiteList.length;i++){
            if(whiteList[i]==url) return;
        }

        blackList.push(url);
        saveFile(function(){
            getCurrentTab(function(tab){
                chrome.tabs.reload(tab.id);
                console.log("add to black and refresh");
            });
        });


    });
}

function addToWhiteList(){
    getCurrentTabUrl(function(url){

        // check if already exist
        for(var i=0; i<whiteList.length;i++){
            if(whiteList[i]==url) return;
        }
        for(var i=0; i<blackList.length;i++){
            if(blackList[i]==url) return;
        }

        whiteList.push(url);
        saveFile(function(){
            getCurrentTab(function(tab){
                chrome.tabs.reload(tab.id);
                console.log("add to white and refresh");
            });
        });
    });
}

function getCurrentTab(callback) {
    var queryInfo = {
        active: true,
        currentWindow: true
    };

    chrome.tabs.query(queryInfo, function(tabs) {
        var tab = tabs[0];

        callback(tab);
    });
}
