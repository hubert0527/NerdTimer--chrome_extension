
function saveCurrentTime(time){
    time = time.toString();
    chrome.storage.local.set({'currentTime': time});
}
function loadCurrentTime(callback){
    chrome.storage.local.get('currentTime',function(storage){
        var time = parseInt(storage.currentTime);
        if(!time) time = 0;
        console.log("currentTime = " + time);
        if(callback) callback(time);
        return time;
    });
}

function saveLastUsedTimer(time,callback){
    chrome.storage.local.set({'lastTimer': time},function(){
        console.log("save last time = " + time);
        if(callback) callback();
    });
}

function loadLastUsedTimer(callback){
    chrome.storage.local.get('lastTimer',function(storage){
        var time = parseInt(storage.lastTimer);
        console.log("load last time = " + time);
        if(callback) callback(time);
    });
}

function saveBlocker(callback){
    chrome.storage.local.set({'mainMessage': mainMessage},function(){
        if(callback){
            callback();
        }
    });
}

function loadBlocker(callback){
    chrome.storage.local.get('mainMessage',function(data){
        if(data.mainMessage!="" && data.mainMessage!=undefined) mainMessage = data.mainMessage;
        if(callback){
            callback();
        }
    });
}

function saveFile(callBack){
    // save lists
    var i,j;
    var str;

    str = "";
    for(j=0;j<whiteList.length;j++) {
        if(str=="") str = whiteList[j];
        else{
            str+= ("::"+whiteList[j]);
        }
    }
    chrome.storage.local.set({'whiteListData': str},function(){
        str = "";
        for(j=0;j<hardLockList.length;j++) {
            if(str=="") str = hardLockList[j];
            else{
                str+= ("::"+hardLockList[j]);
            }
        }
        chrome.storage.local.set({'hardLockListData': str},function(){

            str = "";
            for(j=0;j<softLockList.length;j++) {
                if(str=="") str = softLockList[j];
                else{
                    str+= ("::"+softLockList[j]);
                }
            }
            chrome.storage.local.set({'softLockListData': str},function() {

                str = "";
                for (j = 0; j < singleWhite.length; j++) {
                    if (str == "") str = singleWhite[j];
                    else {
                        str += ("::" + singleWhite[j]);
                    }
                }
                chrome.storage.local.set({'singleWhiteData': str}, function () {

                    str = "";
                    for (j = 0; j < singleSoftLock.length; j++) {
                        if (str == "") str = singleSoftLock[j];
                        else {
                            str += ("::" + singleSoftLock[j]);
                        }
                    }
                    chrome.storage.local.set({'singleSoftLockData': str}, function () {

                        str = "";
                        for (j = 0; j < singleHardLock.length; j++) {
                            if (str == "") str = singleHardLock[j];
                            else {
                                str += ("::" + singleHardLock[j]);
                            }
                        }
                        chrome.storage.local.set({'singleHardLockData': str}, function () {
                            chrome.storage.local.set({'needReload': true}, function () {
                                if (callBack != undefined) callBack();
                            });
                        });

                    });

                });
            });

        });

    });

}


function loadFile(callBack,tab){
    // get list
    var i;
    chrome.storage.local.get("whiteListData",function(data){
        var str = data.whiteListData;
        whiteList = [];

        if(str!=undefined && str!="") {
            var sp = str.split("::");
            for (i = 0; i < sp.length; i++) {
                whiteList.push(sp[i]);
            }
        }

        // load block
        chrome.storage.local.get("hardLockListData",function(data){
            var str = data.hardLockListData;
            hardLockList = [];
            if(str!=undefined && str!="") {
                sp = [];
                sp = str.split("::");
                for (i = 0; i < sp.length; i++) {
                    hardLockList.push(sp[i]);
                }
            }
            chrome.storage.local.get("softLockListData",function(data) {
                var str = data.softLockListData;
                softLockList = [];
                if (str != undefined && str!="") {
                    sp = [];
                    sp = str.split("::");
                    for (i = 0; i < sp.length; i++) {
                        softLockList.push(sp[i]);
                    }
                }


                // purify just read lists
                purifiedSoftLock = [];
                for (i = 0; i < softLockList.length; i++) {
                    purifiedSoftLock.push(purifyUrl(softLockList[i]));
                }
                purifiedHardLock = [];
                for (i = 0; i < hardLockList.length; i++) {
                    purifiedHardLock.push(purifyUrl(hardLockList[i]));
                }

                purifiedWhite = [];
                for (i = 0; i < whiteList.length; i++) {
                    purifiedWhite.push(purifyUrl(whiteList[i]));
                }

                chrome.storage.local.get("singleSoftLockData", function (data) {
                    var str = data.singleSoftLockData;
                    singleSoftLock = [];
                    if (str != undefined && str!="") {
                        var spsb = str.split("::");
                        for (i = 0; i < spsb.length; i++) {
                            singleSoftLock.push(spsb[i]);
                        }
                    }
                    chrome.storage.local.get("singleHardLockData", function (data) {
                        var str = data.singleHardLockData;
                        singleHardLock = [];
                        if (str != undefined && str!="") {
                            var spsb = str.split("::");
                            for (i = 0; i < spsb.length; i++) {
                                singleHardLock.push(spsb[i]);
                            }
                        }
                        chrome.storage.local.get("singleWhiteData", function (data) {
                            var str = data.singleWhiteData;
                            singleWhite = [];
                            if (str != undefined && str!="") {
                                var spsw = str.split("::");
                                for (i = 0; i < spsw.length; i++) {
                                    singleWhite.push(spsw[i]);
                                }
                            }

                            if (callBack != undefined) callBack(tab);

                        });
                    });
                });
            });

        });

    });

}

// function test(){
//     // get list
//     var i;
//     chrome.storage.local.get("whiteListData",function(data){
//         var str = data.whiteListData;
//         console.log("load white: " + str);
//         //whiteList = [];
//
//         if(str!=undefined) {
//             var spw = str.split("::");
//             for (i = 0; i < spw.length; i++) {
//                 whiteList[i] = spw[i];
//             }
//         }
//
//         // load black
//         chrome.storage.local.get("blackListData",function(data){
//             var str = data.blackListData;
//             console.log("load black: " + str);
//             //blackList = [];
//             if(str!=undefined) {
//                 var spb = str.split("::");
//                 for (i = 0; i < spb.length; i++) {
//                     blackList[i] = spb[i];
//                 }
//             }
//
//             chrome.storage.local.get("singleBlackData",function(data) {
//                 var str = data.singleBlackData;
//                 console.log("load single black: " + str);
//                 singleBlack = [];
//                 if (str != undefined) {
//                     var spsb = str.split("::");
//                     for (i = 0; i < spsb.length; i++) {
//                         singleBlack.push(spsb[i]);
//                     }
//                 }
//                 chrome.storage.local.get("singleWhiteData",function(data) {
//                     var str = data.singleWhiteData;
//                     console.log("load single white: " + str);
//                     singleWhite = [];
//                     if (str != undefined) {
//                         var spsw = str.split("::");
//                         for (i = 0; i < spsw.length; i++) {
//                             singleWhite.push(spsw[i]);
//                         }
//                     }
//
//                     // getCurrentTab(function(tab){
//                     //     chrome.tabs.sendMessage(tab.id, {none: "none"}, function(response) {
//                     //         console.log("send message to " + tab.url + " id = " + tab.id);
//                     //     });
//                     // });
//
//                 });
//             });
//
//         });
//
//     });
//
// }