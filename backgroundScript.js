
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

var timer=0;
var timerInst;
var isWaitingTimer = false;
var isAppClosed = false;

// content of blocker
var mainMessage="You shall not pass!";

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

// this only record time except this time you browse
var softTimeRecord = [];
var whiteTimeRecord = [];
var totalTimeRecord=0;
// this only record this time browse
var softTimeRecordNew = [];
var whiteTimeRecordNew = [];
var totalTimeRecordNew=0;


var purifiedSoftLock;
var purifiedHardLock;
var purifiedWhite;

function init(){
    loadBlocker();
    loadFile();
    var i;
    for(i=0;i<softLockList.length;i++){
        softTimeRecordNew.append(0);
    }
    for(i=0;i<whiteList.length;i++){
        whiteTimeRecordNew.append(0);
    }
}
init();

function purifyBlackAndWhite(callback){
    var i;

    for(i=0;i<singleHardLock.length;i++){
        singleHardLock[i] = cutOffHeadAndTail(singleHardLock[i]);
    }
    for(i=0;i<singleSoftLock.length;i++){
        singleSoftLock[i] = cutOffHeadAndTail(singleSoftLock[i]);
    }
    for(i=0;i<singleWhite.length;i++){
        singleWhite[i] = cutOffHeadAndTail(singleWhite[i]);
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

    if(callback) callback();
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

function checkBlock(purified, cutted){
    var temp = purified;
    var i;

    // search single page first
    for(i=0;i<singleWhite.length;i++){
        if(cutted==singleWhite[i]) return 0;
    }
    for(i=0;i<singleHardLock.length;i++){
        if(cutted == singleHardLock[i]) return 1;
    }
    for(i=0;i<singleSoftLock.length;i++){
        if(cutted == singleSoftLock[i]) return 2;
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
function dealingUrl(tab,callback){
    //getCurrentTabUrl(function(url) {

        if(tab==undefined || tab.url==undefined) return false;
        var url = tab.url;

        purifyBlackAndWhite();

        var purified = purifyUrl(url);
        var cutted = cutOffHeadAndTail(url);

        var isBad = checkBlock(purified,cutted);

        console.log("block? " + isBad);
        console.log("hardBlock: " + hardLockList.toString());
        console.log("softBlock: " + softLockList.toString());
        console.log("whites: " + whiteList.toString());

        console.log("hardBlockSingle: " + singleHardLock.toString());
        console.log("softBlockSingle: " + singleSoftLock.toString());
        console.log("whitesSingle: " + singleWhite.toString());

        if(isBad==1){
            chrome.tabs.sendMessage(tab.id, {block: "hard"}, function(response) {
                console.log("send message to " + tab.url + " id = " + tab.id);
            });
        }
        else if(isBad==2){

            if(isWaitingTimer==true || isAppClosed==true){
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

        if(callback) callback();

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
        // isWaitingTimer = true;
        // var i = setInterval(function(){
        //     clearInterval(i);
        //     isWaitingTimer = false;
        //     getCurrentTab(dealWithUrlMain);
        // },10000);
        setTimer(300,function(){
            getCurrentTab(dealWithUrlMain);
        });
        getCurrentTab(dealWithUrlMain);
        return false;
    }
    /**
     * content script request for main message for any reason
     */
    else if(msg.getCurrentMainMessage!=undefined){
        sendResponse({mainMessage:mainMessage.toString()});
        console.log("send main message : " + mainMessage.toString());
    }
    else if(msg.checkIfInList){
        checkIfReload(function(needReload){
            if(needReload){
                loadFile(function () {
                    if(msg.checkIfInList=="none"){
                        getCurrentTabUrl(function(url){
                            doCheckIfInList(url,sendResponse);
                        });
                    }
                    else{
                        var url = msg.checkIfInList;
                        doCheckIfInList(url,sendResponse);
                    }
                });
            }
            else{
                if(msg.checkIfInList=="none"){
                    getCurrentTabUrl(function(url){
                        doCheckIfInList(url,sendResponse);
                    });
                }
                else{
                    var url = msg.checkIfInList;
                    doCheckIfInList(url,sendResponse);
                }
            }
        });
    }
    else if(msg && msg.deleteRule){
        var sp = msg.deleteRule.split("::");
        var index;
        if(sp[0]=="singleWhite"){
            index = singleWhite.indexOf(sp[1]);
            singleWhite.splice(index,1);
            saveFile(getCurrentTab(dealWithUrlMain));
        }
        else if(sp[0]=="whiteList"){
            index = whiteList.indexOf(sp[1]);
            whiteList.splice(index,1);
            saveFile(getCurrentTab(dealWithUrlMain));
        }
        else if(sp[0]=="singleSoftLock"){
            index = singleSoftLock.indexOf(sp[1]);
            singleSoftLock.splice(index,1);
            saveFile(getCurrentTab(dealWithUrlMain));
        }
        else if(sp[0]=="softLockList"){
            index = softLockList.indexOf(sp[1]);
            softLockList.splice(index,1);
            saveFile(getCurrentTab(dealWithUrlMain));
        }
        else if(sp[0]=="singleHardLock"){
            index = singleHardLock.indexOf(sp[1]);
            singleHardLock.splice(index,1);
            saveFile(getCurrentTab(dealWithUrlMain));
        }
        else if(sp[0]=="hardLockList"){
            index = hardLockList.indexOf(sp[1]);
            hardLockList.splice(index,1);
            saveFile(getCurrentTab(dealWithUrlMain));
        }
    }
    else if(msg && msg.timerSet){
        setTimer(msg.timerSet,function(){
            getCurrentTab(dealWithUrlMain);
        });
        getCurrentTab(dealWithUrlMain);
        return false;
    }
    else if(msg && msg.getTimerTime){
        sendResponse({time:timer});
    }
    else if(msg && msg.cancelTimer){
        timer = 0;
        clearInterval(timerInst);
        getCurrentTab(dealWithUrlMain);
    }
    else if(msg && msg.isAppClosed){
        if(isAppClosed){
            sendResponse({isAppClosed:"true"});
        }
        else{
            sendResponse({isAppClosed:"false"});
        }
    }
    else if(msg && msg.changeAppStatus){
        if(msg.changeAppStatus=="open"){
            isAppClosed = false;
        }
        else{
            isAppClosed = true;
        }
    }
    else if(msg && msg.forceSaveFully){
        getCurrentTab(function(tab){
            doTimeRecord(tab);
            sendResponse({none:"none"});
        });
    }
    else if(msg && msg.resetAllStatistics){
        var i;
        for(i=0;i<whiteTimeRecord.length;i++) whiteTimeRecord[i] = 0;
        for(i=0;i<whiteTimeRecordNew.length;i++) whiteTimeRecordNew[i] = 0;
        for(i=0;i<softTimeRecord.length;i++) softTimeRecord[i] = 0;
        for(i=0;i<softTimeRecordNew.length;i++) softTimeRecordNew[i] = 0;
        totalTimeRecord = 0;
        totalTimeRecordNew = 0;
        saveFileFully();
    }

    /**
     * IMPORTANT
     * or, the channel will be closed
     */
    return true;
});

function setTimer(time,callback){
    isWaitingTimer = true;
    timer = time;
    var timerInst = setInterval(function(){
        if(timer>0) timer --;
        else{
            clearInterval(timerInst);
            isWaitingTimer = false;
            if(callback!=undefined) callback();
        }
    },1000);
}

function doCheckIfInList(url,sendResponse) {
    purifyBlackAndWhite();
    var purified = purifyUrl(url);
    var cutted = cutOffHeadAndTail(url);
    var isBad = checkBlock(purified,cutted);
    var str;
    if(isBad==0) str = "white";
    else if(isBad==1) str = "hard";
    else if(isBad==2) str = "soft";
    else str = "none";
    sendResponse({block:str});
    console.log("is bad? " + str);
}

/**
 * main thread of checking if tab is block
 * @param tab
 */
function  dealWithUrlMain(tab,callback) {
    // check if has new setting?
    checkIfReload(function(needReload){
        if(needReload){
            loadFile(dealingUrl,tab,callback);
        }
        else{
            dealingUrl(tab,callback);
        }
    });
}

/**
 *  Fire on tab switch
 */
chrome.tabs.onActivated.addListener(function (tabId, windowId) {
    getCurrentTab(function(tab){
        dealWithUrlMain(tab,function(){
            doTimeRecord(tab);
        })
    });
});

function doTimeRecord(tab){
    // do time record
    if(currentPage!="" && currentPageLoadTime!=0){
        var p = purifyUrl(currentPage);
        // find which domain this page belongs to and store value
        var current = getCurrentTime();
        var diff = current-currentPageLoadTime;
        searchDomain(p,diff);

        saveFileFully(function(){

            console.log("temporary save " + tab.url + " with time : " + diff + "ms");
        });

        // load page for next record
        currentPageLoadTime = current;
        currentPage = tab.url;
    }
    else{
        // load page for next record
        currentPageLoadTime = getCurrentTime();
        currentPage = tab.url;
    }
}

/**
 * Fire on page load
 */
var currentPage="";
var currentPageLoadTime=0;
chrome.tabs.onUpdated.addListener( function (tabId, changeInfo, tab) {
    if (changeInfo.status == 'complete') {
        // check block
        dealWithUrlMain(tab,function(){
            doTimeRecord(tab);
        });
    }
});

/**
 * return current time in long expression
 * @returns {number}
 */
function getCurrentTime() {
    var date = new Date();
    return date.getTime();
}

chrome.windows.onRemoved.addListener(function(){
    //saveCurrentTime(getCurrentTime());
    getCurrentTab(function (tab) {
        doTimeRecord(tab);
    })
});

function searchDomain(purified, timeDiff) {
    do{
        // search white first
        for(i=0;i<purifiedWhite.length;i++){
            if(isInList(purified,purifiedWhite[i])==true){
                whiteTimeRecordNew[i] += timeDiff;
            }
        }
        for(i=0;i<purifiedSoftLock.length;i++){
            if(isInList(purified,purifiedSoftLock[i])==true){
                softTimeRecordNew[i] += timeDiff;
            }
        }
    }while( (purified = clearLast(purified))!="" );

}