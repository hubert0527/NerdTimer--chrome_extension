
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

var singleBlack = [];
var singleWhite = [];

var blackList = [
    "www.facebook.com",
    "m.facebook.com"
];

var whiteList = [
    "www.facebook.com/profile"
];

var purifiedBlack;
var purifiedWhite;


function purifyBlackAndWhite(){
    var i;

    for(i=0;i<singleBlack.length;i++){
        singleBlack[i] = purifyUrl(singleBlack[i]);
    }
    for(i=0;i<singleWhite.length;i++){
        singleWhite[i] = purifyUrl(singleWhite[i]);
    }

    purifiedBlack = new Array(blackList.length);
    for(i=0;i<blackList.length;i++){
        purifiedBlack[i] = purifyUrl(blackList[i]);
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
        for(i=0;i<sL.length;i++){
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
        if(str==singleWhite[i]) return false;
    }
    for(i=0;i<singleBlack.length;i++){
        if(str == singleBlack[i]) return true;
    }

    // search in domain
    do{
        // search white first
        for(i=0;i<purifiedWhite.length;i++){
            if(isInList(temp,purifiedWhite[i])==true) return false;
        }
        // search black
        for(i=0;i<purifiedBlack.length;i++){
            if(isInList(temp,purifiedBlack[i])==true) return true;
        }
    }while( (temp = clearLast(temp))!="" );

    return false;
}

/**
 * get current url, purify it
 *  and check in black and white list to judge whether need process
 */
function dealingUrl(tab){
    //getCurrentTabUrl(function(url) {

        var url = tab.url;

        purifyBlackAndWhite();

        var purified = purifyUrl(url);

        var isBad = checkBlock(purified);

        console.log("black? " + isBad);
        console.log("blacks: " + blackList.toString());
        console.log("whites: " + whiteList.toString());

        if(isBad){

            // var queryInfo = {
            //     active: true,
            //     currentWindow: true
            // };
            // chrome.tabs.query(queryInfo, function(tabs) {
            //     var tab = tabs[0].id;
            //     chrome.tabs.sendMessage(tabs[0].id, {black: "true"}, function(response) {
            //         //console.log("response: " + response.re);
            //     });
            // });

            chrome.tabs.sendMessage(tab.id, {black: "true"}, function(response) {
                console.log("send message to " + tab.url + " id = " + tab.id);
            });

        }
        else{
            // some pages not fully reload while refresh, so force unload
            // var queryInfo = {
            //     active: true,
            //     currentWindow: true
            // };
            // chrome.tabs.query(queryInfo, function(tabs) {
            //     var tab = tabs[0].id;
            //     chrome.tabs.sendMessage(tabs[0].id, {black: "false"}, function(response) {
            //         //console.log("response: " + response.re);
            //     });
            // });
            chrome.tabs.sendMessage(tab.id, {black: "false"}, function(response) {
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
    if (msg && msg.blockerLoadRequest == "giveMeData") {
        loadBlocker();
        sendResponse({"mainMessage":mainMessage.toString()});
    }
    else if(msg && msg.modifyMainMessage){
        mainMessage = msg.modifyMainMessage;
        saveBlocker(function(){
            getCurrentTab(function(tab){
                chrome.tabs.reload(tab.id);
            });
        });
    }
});

chrome.tabs.onUpdated.addListener( function (tabId, changeInfo, tab) {
    if (changeInfo.status == 'complete') {

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

});
