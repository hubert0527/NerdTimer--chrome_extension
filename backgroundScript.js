
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

function init(){
    loadBlocker();
    loadFile();
}
init();

var isWaiting5Min = false;

// content of blocker
var mainMessage="Better stop now!";

var currentTab = undefined;
var isCheckingReload = false;
var needInit = true;

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


function purifyBlackAndWhite(){
    var i;

    for(i=0;i<singleHardLock.length;i++){
        singleHardLock[i] = purifyUrl(singleHardLock[i]);
    }
    for(i=0;i<singleSoftLock.length;i++){
        singleSoftLock[i] = purifyUrl(singleSoftLock[i]);
    }
    for(i=0;i<singleWhite.length;i++){
        singleWhite[i] = purifyUrl(singleWhite[i]);
    }

    purifiedHardLock = new Array(hardLockList.length);
    for(i=0;i<hardLockList.length;i++){
        purifiedHardLock[i] = purifyUrl(hardLockList[i]);
    }
    purifiedSoftLock = new Array(softLockList.length);
    for(i=0;i<softLockList.length;i++){
        purifiedSoftLock[i] = purifyUrl(softLockList[i]);
    }
    purifiedWhite = new Array(whiteList.length);
    for(i=0;i<whiteList.length;i++){
        purifiedWhite[i] = purifyUrl(whiteList[i]);
    }
}

function isInList(mstr, lstr){
    // l=list, m=mine
    var sL = lstr.split("/");
    var sM = mstr.split("/");
    var i,j,k;

    if(sL.length==sM.length){
        if(sL[0]!=sM[0]){
            return false;
        }
        for(i=1;i<sL.length;i++){
            var conL = [];
            var conM = [];
            var cursor;
            // split item by special characters which is not Eng_char or number
            cursor = 0;
            for(j=0;j<sL[i].length;j++){
                if( (sL[i][j]>='a'&&sL[i][j]<='z') ||
                    (sL[i][j]>='A'&&sL[i][j]<='Z') ||
                    (sL[i][j]>='0'&&sL[i][j]<='9')){
                    // not special;
                }
                else{
                    conL.push(sL[i].substring(cursor,j));
                    cursor = j+1;
                }
            }
            conL.push(sL[i].substring(cursor,j));
            cursor = 0;
            for(j=0;j<sM[i].length;j++){
                if( (sM[i][j]>='a'&&sM[i][j]<='z') ||
                    (sM[i][j]>='A'&&sM[i][j]<='Z') ||
                    (sM[i][j]>='0'&&sM[i][j]<='9')){
                    // not special;
                }
                else{
                    conM.push(sM[i].substring(cursor,j));
                    cursor = j+1;
                }
            }
            conM.push(sM[i].substring(cursor,j));

            // if M contains all L item, then match count ++
            // Or, they are different
            var isIn;
            for(j=0;j<conL.length;j++){
                isIn = false;
                for(k=0;k<conM.length;k++){
                    if(conL[j]==conM[k]) isIn = true;
                }
                if(isIn==false) return false;
            }
        }

        // exactly match without interruption
        return true;

    }
    // not about time to judge
    return false;
}

/**
 * cut current searching URL and compare to each stored list item
 * TODO: remove comparable object from list each time case not match
 * @param str
 * @returns {boolean}
 */

function checkBlock(str){
    var temp = str;
    var i;

    // search single page first
    for(i=0;i<singleWhite.length;i++){
        if(str==singleWhite[i]) return 0;
    }
    for(i=0;i<singleHardLock.length;i++){
        if(str == singleHardLock[i]) return 1;
    }
    for(i=0;i<singleSoftLock.length;i++){
        if(str == singleSoftLock[i]) return 2;
    }

    // search in domain
    do{
        // search white first
        for(i=0;i<purifiedWhite.length;i++){
            if(isInList(temp,purifiedWhite[i])==true) return 0;
        }
        // search block
        for(i=0;i<purifiedHardLock.length;i++){
            if(isInList(temp,purifiedHardLock[i])==true) return 1;
        }
        for(i=0;i<purifiedSoftLock.length;i++){
            if(isInList(temp,purifiedSoftLock[i])==true) return 2;
        }
    }while( (temp = clearLast(temp))!="" );

    return -1;
}

/**
 * get current url, purify it
 *  and check in black and white list to judge whether need process
 */
function dealingUrl(tab){
    //getCurrentTabUrl(function(url) {

        if(tab==undefined || tab.url==undefined) return false;
        var url = tab.url;

        purifyBlackAndWhite();

        var purified = purifyUrl(url);

        var isBad = checkBlock(purified);

        console.log("block? " + isBad);
        console.log("hardBlock: " + hardLockList.toString());
        console.log("softBlock: " + softLockList.toString());
        console.log("whites: " + whiteList.toString());

        if(isBad==1){
            chrome.tabs.sendMessage(tab.id, {block: "hard"}, function(response) {
                console.log("send message to " + tab.url + " id = " + tab.id);
            });
        }
        else if(isBad==2){

            if(isWaiting5Min==true){
                chrome.tabs.sendMessage(tab.id, {block: "false"}, function(response) {
                    console.log("send message to " + tab.url + " id = " + tab.id);
                });
                return;
            }

            chrome.tabs.sendMessage(tab.id, {block: "soft"}, function(response) {
                console.log("send message to " + tab.url + " id = " + tab.id);
            });
        }
        else{
            chrome.tabs.sendMessage(tab.id, {block: "false"}, function(response) {
                console.log("send message to " + tab.url + " id = " + tab.id);
            });
        }

    //});
}

/**
 * check if after last reload, whether the list has been saved and need another reload
 * @param callBack
 */
function checkIfReload(callBack){

    var needReload;

    chrome.storage.local.get("needReload",function(data) {
        var needReload = data.needReload;

        chrome.storage.local.set({'needReload': false},function(){
            isCheckingReload = false;
        });

        callBack(needReload);
    });

}

chrome.extension.onMessage.addListener(function(msg, sender, sendResponse) {
    /**
     * content script request for data for any reason
     */
    if (msg && msg.blockerLoadRequest == "giveMeData") {
        loadBlocker();
        sendResponse({"mainMessage":mainMessage.toString()});
    }
    /**
     * popup script request modify main message
     */
    else if(msg && msg.modifyMainMessage!=undefined){
        mainMessage = msg.modifyMainMessage;
        saveBlocker(function(){
            // getCurrentTab(function(tab){
            //     chrome.tabs.reload(tab.id);
            // });
        });
    }
    /**
     * content script request bg script stop sending soft block for 5 min
     */
    else if(msg.wait5Min!=undefined){
        isWaiting5Min = true;
        var i = setInterval(function(){
            clearInterval(i);
            isWaiting5Min = false;
            getCurrentTab(dealWithUrlMain);
        },10000);

    }
    /**
     * content script request for main message for any reason
     */
    else if(msg.getCurrentMainMessage!=undefined){
        sendResponse({mainMessage:mainMessage.toString()});
    }

    if(msg.checkIfInList){
        checkIfReload(function(needReload){
            if(needReload){
                loadFile(function () {
                    var url = msg.checkIfInList;
                    purifyBlackAndWhite();
                    var purified = purifyUrl(url);
                    var isBad = checkBlock(purified);
                    var str;
                    if(isBad==0) str = "white";
                    else if(isBad==1) str = "hard";
                    else if(isBad==2) str = "soft";
                    else str = "none";
                    sendResponse({block:str});
                    console.log("is bad? " + str);
                });
            }
            else{
                var url = msg.checkIfInList;
                purifyBlackAndWhite();
                var purified = purifyUrl(url);
                var isBad = checkBlock(purified);
                    var str;
                    if(isBad==0) str = "white";
                    else if(isBad==1) str = "hard";
                    else if(isBad==2) str = "soft";
                    else str = "none";
                    sendResponse({block:str});
                console.log("is bad? " + str);
            }
        });
    }
    /**
     * IMPORTANT
     * or, the channel will be closed
     */
    return true;
});

/**
 * main thread of checking if tab is block
 * @param tab
 */
function  dealWithUrlMain(tab) {
    // check if has new setting?
    checkIfReload(function(needReload){
        if(needReload){
            loadFile(dealingUrl,tab);
        }
        else{
            dealingUrl(tab);
        }
    });
}

/**
 * Fire on page load
 */
chrome.tabs.onUpdated.addListener( function (tabId, changeInfo, tab) {
    if (changeInfo.status == 'complete') {
        dealWithUrlMain(tab);
    }
});
/**
 *  Fire on tab switch
 */
chrome.tabs.onActivated.addListener(function (tabId, windowId) {
    getCurrentTab(dealWithUrlMain);
});
