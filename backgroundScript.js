
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

var hasBlocked = false;
var currentTab = undefined;
var isCheckingReload = false;
var needInit = true;

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

var ignore = [
    "www",
    "com",
    "tw",
    "m",
    "cn",
    "us",
    "jp"
];

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
    // purify white and black first
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

function checkBlock(str){
    var temp = str;
    var i;

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

function clearLast(str){
    var i, pivot=-1;
    for(i=str.length-1;i>=0;i--){
        if(str[i]=='/') {
            pivot=i;
            break;
        }
    }

    if(pivot==-1) return "";
    else{
        return str.substring(0,pivot);
    }

}

function purifyUrl(url){

    // eliminate prefix http:// or https://
    var i,j,k;
    var pure='', prev, cur, start_pos=-1;
    for(i=1;i<url.length;i++){
        prev = url[i-1];
        cur = url[i];
        if(prev=='/' && cur=='/'){
            start_pos = i+1;
            continue;
        }
        if(start_pos!=-1){
            pure += url[i];
        }
    }

    var spSlash = pure.split("/");
    var purified = "";
    for(i=0;i<spSlash.length;i++){
        var spDot = spSlash[i].split(".");
        var temp = "";
        for(j=0;j<spDot.length;j++){
            var valid = true;
            for(k=0;k<ignore.length;k++){
                var ignoreStr = ignore[k];
                if(spDot[j]==ignoreStr) {
                    valid = false;
                    break;
                }
            }
            if(valid == true) {
                if (temp == "") temp += spDot[j];
                else{
                    temp += ("."+spDot[j]);
                }
            }
        }
        if(temp!="") {
            if (purified == "") {
                purified += temp;
            }
            else {
                purified += ("/" + temp);
            }
        }
    }

    //console.log("purified = " + purified);

    return purified;
}

/**
 * get current url, purify it
 *  and check in black and white list to judge whether need process
 */
function dealingUrl(){
    getCurrentTabUrl(function(url) {

        purifyBlackAndWhite();

        var purified = purifyUrl(url);

        var isBad = checkBlock(purified);

        console.log("black? " + isBad);
        console.log("blacks: " + blackList.toString());

        if(isBad){

            var queryInfo = {
                active: true,
                currentWindow: true
            };

            // chrome.tabs.sendMessage(currentTab.id, {
            //             black: "true"
            // });

            chrome.tabs.query(queryInfo, function(tabs) {
                var tab = tabs[0].id;
                chrome.tabs.sendMessage(tabs[0].id, {black: "true"}, function(response) {
                    //console.log("response: " + response.re);
                });
            });

        }

    });
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

chrome.tabs.onUpdated.addListener( function (tabId, changeInfo, tab) {
  if (changeInfo.status == 'complete') {

      // check if has new setting?
      if(isCheckingReload) return;
      isCheckingReload = true;
      checkIfReload(function(needReload){
          if(needInit){
              loadFile(dealingUrl);
              needInit = false;
          }
          else if(needReload){
              loadFile(dealingUrl);
          }
          else{
              dealingUrl();
          }
      });

  }
});
