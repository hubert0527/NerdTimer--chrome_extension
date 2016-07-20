var ignore = [
    "www",
    "com",
    "tw",
    "m",
    "cn",
    "us",
    "jp"
];

var singleHardLock = [];
var singleSoftLock = [];
var useTime = [];
var singleWhite = [];

var softLockList = [];
var hardLockList = [];
var whiteList = [];

var purifiedSoftLock;
var purifiedHardLock;
var purifiedWhite;

window.addEventListener("DOMContentLoaded", function() {

    loadFile();
    document.getElementById("test").addEventListener("click", test);
    document.getElementById("addSinglePageToSoftLockList").addEventListener("click", addSinglePageToSoftLockList);
    document.getElementById("addBaseDomainToSoftLockList").addEventListener("click", addBaseDomainToSoftLockList);
    document.getElementById("addSinglePageToWhiteList").addEventListener("click", addSinglePageToWhiteList);
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

    // create sliding button
    document.getElementById("goToAddToList").addEventListener("click", function(){moveRightTo("#mainPage","#addToList");});
    document.getElementById("goToMainPage1").addEventListener("click", function(){moveLeftTo("#addToList","#mainPage");});


    console.log("softBlocks: " + softLockList.toString());
    console.log("whites: " + whiteList.toString());

    chrome.runtime.sendMessage({"getCurrentMainMessage":"true"}, function(response) {
        if(response && response.mainMessage!=undefined) {
            document.getElementById("mainMessageInput").value = response.mainMessage;
        }
    });

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

function moveRightTo(cur, tar) {
    tar = $(tar);
    cur = $(cur);
    // slide in
    tar.css("z-index","100");
    tar.css("left","100%");
    tar.css("display","block");
    tar.css("height","100%");
    tar.css("width","100%");
    tar.animate({left: '0'},function () {
        cur.css("display", "none");
        cur.css("position", "absolute");
        tar.css("position","relative");
        tar.css("z-index","0");
    });
}

function moveLeftTo(cur, tar) {
    tar = $(tar);
    cur = $(cur);
    // slide in
    tar.css("z-index","100");
    tar.css("left","-100%");
    tar.css("display","block");
    tar.css("height","100%");
    tar.css("width","100%");
    tar.animate({left: '0'},function () {
        cur.css("display", "none");
        cur.css("position", "absolute");
        tar.css("position","relative");
        tar.css("z-index","0");
    });
}

/**
 * Modes :
 * 1. lock base domain
 * 2. lock only this page
 * 3. lock partly domain (multiple choice)
 * 4. lock on certain key-word
 */

function addSinglePageToSoftLockList(){
    getCurrentTabUrl(function(rawUrl){

        var url = cutOffHeadAndTail(rawUrl);

        // check if already exist
        for(var i=0; i<singleSoftLock.length;i++){
            if(singleSoftLock[i]==url) return;
        }
        for(var i=0; i<singleHardLock.length;i++){
            if(singleHardLock[i]==url) return;
        }
        for(var i=0; i<singleWhite.length;i++){
            if(singleWhite[i]==url) return;
        }

        singleSoftLock.push(url);
        saveFile(function(){
            getCurrentTab(function(tab){
                chrome.tabs.reload(tab.id);
                console.log("add " + url + " to single soft lock and refresh");
            });
        });


    });
}

function addBaseDomainToSoftLockList(){
    getCurrentTabUrl(function(rawUrl){

        var url = cutOffHeadAndTail(rawUrl);

        var temp;
        while( (temp = clearLast(url))!=""){
            url = temp;
        }

        // check if already exist
        for(var i=0; i<softLockList.length;i++){
            if(softLockList[i]==url) return;
        }
        for(var i=0; i<hardLockList.length;i++){
            if(hardLockList[i]==url) return;
        }
        for(var i=0; i<whiteList.length;i++){
            if(whiteList[i]==url) return;
        }

        softLockList.push(url);
        saveFile(function(){
            getCurrentTab(function(tab){
                chrome.tabs.reload(tab.id);
                console.log("add " + url + " to soft block and refresh");
            });
        });


    });
}

function addSubDomainToSoftLockList(rawUrl){

    var url = cutOffHeadAndTail(rawUrl);

    // check if already exist
    for(var i=0; i<softLockList.length;i++){
        if(softLockList[i]==url) return;
    }
    for(var i=0; i<hardLockList.length;i++){
        if(hardLockList[i]==url) return;
    }
    for(var i=0; i<whiteList.length;i++){
        if(whiteList[i]==url) return;
    }

    softLockList.push(url);
    saveFile(function(){
        getCurrentTab(function(tab){
            chrome.tabs.reload(tab.id);
            console.log("add " + url + " to soft lock and refresh");
        });
    });

}

function addSinglePageToHardLockList(){
    getCurrentTabUrl(function(rawUrl){

        var url = cutOffHeadAndTail(rawUrl);

        // check if already exist
        for(var i=0; i<singleSoftLock.length;i++){
            if(singleSoftLock[i]==url) return;
        }
        for(var i=0; i<singleHardLock.length;i++){
            if(singleHardLock[i]==url) return;
        }
        for(var i=0; i<singleWhite.length;i++){
            if(singleWhite[i]==url) return;
        }

        singleHardLock.push(url);
        saveFile(function(){
            getCurrentTab(function(tab){
                chrome.tabs.reload(tab.id);
                console.log("add " + url + " to single soft lock and refresh");
            });
        });


    });
}

function addBaseDomainToHardLockList(){
    getCurrentTabUrl(function(rawUrl){

        var url = cutOffHeadAndTail(rawUrl);

        var temp;
        while( (temp = clearLast(url))!=""){
            url = temp;
        }

        // check if already exist
        for(var i=0; i<softLockList.length;i++){
            if(softLockList[i]==url) return;
        }
        for(var i=0; i<hardLockList.length;i++){
            if(hardLockList[i]==url) return;
        }
        for(var i=0; i<whiteList.length;i++){
            if(whiteList[i]==url) return;
        }

        hardLockList.push(url);
        saveFile(function(){
            getCurrentTab(function(tab){
                chrome.tabs.reload(tab.id);
                console.log("add " + url + " to soft block and refresh");
            });
        });


    });
}

function addSubDomainToHardLockList(rawUrl){

    var url = cutOffHeadAndTail(rawUrl);

    // check if already exist
    for(var i=0; i<softLockList.length;i++){
        if(softLockList[i]==url) return;
    }
    for(var i=0; i<hardLockList.length;i++){
        if(hardLockList[i]==url) return;
    }
    for(var i=0; i<whiteList.length;i++){
        if(whiteList[i]==url) return;
    }

    hardLockList.push(url);
    saveFile(function(){
        getCurrentTab(function(tab){
            chrome.tabs.reload(tab.id);
            console.log("add " + url + " to soft lock and refresh");
        });
    });

}

function addSinglePageToWhiteList(){
    getCurrentTabUrl(function(rawUrl){

        var url = cutOffHeadAndTail(rawUrl);

        // check if already exist
        for(var i=0; i<singleSoftLock.length;i++){
            if(singleSoftLock[i]==url) return;
        }
        for(var i=0; i<singleHardLock.length;i++){
            if(singleHardLock[i]==url) return;
        }
        for(var i=0; i<singleWhite.length;i++){
            if(singleWhite[i]==url) return;
        }

        singleWhite.push(url);
        saveFile(function(){
            getCurrentTab(function(tab){
                chrome.tabs.reload(tab.id);
                console.log("add " + url + " to single white and refresh");
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
        for(var i=0; i<softLockList.length;i++){
            if(softLockList[i]==url) return;
        }
        for(var i=0; i<hardLockList.length;i++){
            if(hardLockList[i]==url) return;
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
    for(var i=0; i<softLockList.length;i++){
        if(softLockList[i]==url) return;
    }
    for(var i=0; i<hardLockList.length;i++){
        if(hardLockList[i]==url) return;
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
