var singleBlack = [];
var singleWhite = [];

var blackList = [
    "none"
];

var whiteList = [
    "none"
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
    document.getElementById("addCurrentPageToBlackList").addEventListener("click", addSinglePageToBlackList);
    document.getElementById("addBaseDomainToBlackList").addEventListener("click", addBaseDomainToBlackList);
    document.getElementById("addCurrentPageToWhiteList").addEventListener("click", addSinglePageToWhiteList);
    document.getElementById("addBaseDomainToWhiteList").addEventListener("click", addBaseDomainToWhiteList);
    document.getElementById("submitMainMessage").addEventListener("click", submitMainMessage);
    $(document.getElementById("mainMessageInput")).bind('input', function() {
            submitMainMessage($(this).val());
        });
    document.getElementById("mainMessageInput").onkeydown = function(key){
        if(key.which==13 && $('#mainMessageInput').val()==""){
            submitMainMessage("");
        }
    };

    console.log("blacks: " + blackList.toString());
    console.log("whites: " + whiteList.toString());

});


var mainMessage="Better stop now!";

function submitMainMessage(newMessage){
    //var newMessage = document.getElementById("mainMessageInput").value;
    if(newMessage==undefined) return;
    loadBlocker(function(){
        if(newMessage!=mainMessage) {
            chrome.runtime.sendMessage({modifyMainMessage: newMessage}, function (response) {
                console.log("modifyMainMessage");
            });
            getCurrentTab(function(tab){
                chrome.tabs.sendMessage(tab.id,{modifyMainMessage: newMessage});
            });
        }
    });
}

/**
 * four modes
 * 1. lock this domain
 * 2. lock only this page
 * 3. lock partly domain (multiple choice)
 */

function addSinglePageToBlackList(){
    getCurrentTabUrl(function(rawUrl){

        var url = cutOffHeadAndTail(rawUrl);

        // check if already exist
        for(var i=0; i<singleBlack.length;i++){
            if(singleBlack[i]==url) return;
        }
        for(var i=0; i<singleWhite.length;i++){
            if(singleWhite[i]==url) return;
        }

        singleBlack.push(url);
        saveFile(function(){
            getCurrentTab(function(tab){
                chrome.tabs.reload(tab.id);
                console.log("add " + url + " to single black and refresh");
            });
        });


    });
}

function addBaseDomainToBlackList(){
    getCurrentTabUrl(function(rawUrl){

        var url = cutOffHeadAndTail(rawUrl);

        var temp;
        while( (temp = clearLast(url))!=""){
            url = temp;
        }

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
                console.log("add " + url + " to black and refresh");
            });
        });


    });
}

function addSubDomainToBlackList(rawUrl){

    var url = cutOffHeadAndTail(rawUrl);

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
            console.log("add " + url + " to black and refresh");
        });
    });

}

function addSinglePageToWhiteList(){
    getCurrentTabUrl(function(rawUrl){

        var url = cutOffHeadAndTail(rawUrl);

        // check if already exist
        for(var i=0; i<singleBlack.length;i++){
            if(singleBlack[i]==url) return;
        }
        for(var i=0; i<singleWhite.length;i++){
            if(singleWhite[i]==url) return;
        }

        singleWhite.push(url);
        saveFile(function(){
            getCurrentTab(function(tab){
                chrome.tabs.reload(tab.id);
                console.log("add " + url + " to single black and refresh");
            });
        });


    });
}

function addBaseDomainToWhiteList(){
    getCurrentTabUrl(function(rawUrl){

        var url = cutOffHeadAndTail(rawUrl);

        var temp;
        while( (temp = clearLast(url))!=""){
            url = temp;
        }

        // check if already exist
        for(var i=0; i<blackList.length;i++){
            if(blackList[i]==url) return;
        }
        for(var i=0; i<whiteList.length;i++){
            if(whiteList[i]==url) return;
        }

        whiteList.push(url);
        saveFile(function(){
            getCurrentTab(function(tab){
                chrome.tabs.reload(tab.id);
                console.log("add " + url + " to white and refresh");
            });
        });


    });
}

function addSubDomainToWhiteList(rawUrl){

    var url = cutOffHeadAndTail(rawUrl);

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
            console.log("add " + url + " to white and refresh");
        });
    });
}

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
