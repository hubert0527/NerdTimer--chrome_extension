
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


/**
 * check if after last reload, whether the list has been saved and need another reload
 * @param callBack
 */
function checkIfReload(callBack){

    var needReload;

    chrome.storage.local.get("needReload",function(data) {
        var needReload = data.needReload;

        chrome.storage.local.set({"needReload": false},function(){
            isCheckingReload = false;
        });

        if(callBack) callBack(needReload);
    });

}


function saveFile(callBack){
    // save lists
    var i,j;
    var str;
    var storeData = {};

    str = "";
    for(j=0;j<whiteList.length;j++) {
        if(str=="") str = whiteList[j] +"||"+whiteTimeRecord[j];
        else{
            str+= ("::"+whiteList[j] +"||"+whiteTimeRecord[j]);
        }
    }
    storeData['whiteListData'] = str;

    // str = "";
    // for(j=0;j<hardLockList.length;j++) {
    //     if(str=="") str = hardLockList[j];
    //     else{
    //         str+= ("::"+hardLockList[j]);
    //     }
    // }
    // storeData['hardLockListData'] = str;

    str = "";
    for(j=0;j<softLockList.length;j++) {
        if(str=="") str = softLockList[j] +"||"+softTimeRecord[j];
        else{
            str+= ("::"+softLockList[j] +"||"+softTimeRecord[j]);
        }
    }
    storeData['softLockListData'] = str;

    str = "";
    for (j = 0; j < singleWhite.length; j++) {
        if (str == "") str = singleWhite[j];
        else {
            str += ("::" + singleWhite[j]);
        }
    }
    storeData['singleWhiteData'] = str;

                    str = "";
                    for (j = 0; j < singleSoftLock.length; j++) {
                        if (str == "") str = singleSoftLock[j];
                        else {
                            str += ("::" + singleSoftLock[j]);
                        }
                    }
    storeData['singleSoftLockData'] = str;

    str = "";
    for (j = 0; j < singleHardLock.length; j++) {
        if (str == "") str = singleHardLock[j];
        else {
            str += ("::" + singleHardLock[j]);
        }
    }
    storeData['singleHardLockData'] = str;

    storeData['needReload'] = true;

    chrome.storage.local.set(storeData, function () {
        if (callBack != undefined) callBack();
    });

}


function loadFile(callBack,tab,callback2){
    // get list
    var i, sp2;

    var requestArr = [
        "whiteListData",
        "softLockListData",
        "singleSoftLockData",
        "singleWhiteData",
        "totalTimeRecord"
    ];

    chrome.storage.local.get(requestArr,function(data){
        var str = data.whiteListData;
        whiteList = [];
        whiteTimeRecord = [];

        if(str!=undefined && str!="") {
            var sp = str.split("::");
            for (i = 0; i < sp.length; i++) {
                // split for time record
                sp2 = sp[i].split("||");
                whiteList.push(sp2[0]);
                sp2[1] = parseInt(sp2[1]);
                if(sp2[1]){
                    whiteTimeRecord.push(sp2[1]);
                }
                else{
                    whiteTimeRecord.push(0);
                }
            }
        }

        // str = data.hardLockListData;
        // hardLockList = [];
        // if(str!=undefined && str!="") {
        //     sp = [];
        //     sp = str.split("::");
        //     for (i = 0; i < sp.length; i++) {
        //         hardLockList.push(sp[i]);
        //     }
        // }

        str = data.softLockListData;
        softLockList = [];
        softTimeRecord = [];
        if (str != undefined && str!="") {
            sp = [];
            sp = str.split("::");
            for (i = 0; i < sp.length; i++) {
                // split for time record
                sp2 = sp[i].split("||");
                softLockList.push(sp2[0]);
                sp2[1] = parseInt(sp2[1]);
                if(sp2[1]){
                    softTimeRecord.push(sp2[1]);
                }
                else{
                    softTimeRecord.push(0);
                }
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

        str = data.singleSoftLockData;
        singleSoftLock = [];
        if (str != undefined && str!="") {
            var spsb = str.split("::");
            for (i = 0; i < spsb.length; i++) {
                singleSoftLock.push(spsb[i]);
            }
        }

        // str = data.singleHardLockData;
        // singleHardLock = [];
        // if (str != undefined && str!="") {
        //     var spsb = str.split("::");
        //     for (i = 0; i < spsb.length; i++) {
        //         singleHardLock.push(spsb[i]);
        //     }
        // }

        str = data.singleWhiteData;
        singleWhite = [];
        if (str != undefined && str!="") {
            var spsw = str.split("::");
            for (i = 0; i < spsw.length; i++) {
                singleWhite.push(spsw[i]);
            }
        }

        var p = parseInt(data.totalTimeRecord);
        if(p){
            totalTimeRecord = p;
        }
        else{
            totalTimeRecord = 0;
        }

        if (callBack && callback2) callBack(tab,callback2);
        else if (callBack) callBack(tab);

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

/**
 * difference is that this will merge this time browse data with last time and store
 * @param callBack
 */
function saveFileFully(callBack){
    // save lists
    var i,j;
    var str,str2;
    var date = new Date();
    var formattedDate = date.getYear()+'/'+date.getMonth+'/'+date.getDate();
    var storeDataArr={};

    str = "";
    str2="";

    // white and white time
    for(j=0;j<whiteList.length;j++) {
        if(!whiteTimeRecord[j]) whiteTimeRecord[j] = 0;
        if(!whiteTimeRecordNew[j]) whiteTimeRecordNew[j] = 0;
        whiteTimeRecord[j] += whiteTimeRecordNew[j];
        if(str=="") str = whiteList[j] +"||"+whiteTimeRecord[j];
        else{
            str+= ("::"+whiteList[j] +"||"+whiteTimeRecord[j]);
        }

        // save to daily statistics
        todayWhiteTimeRecord[j]+=whiteTimeRecordNew[j];
        if(str2=="") str2 = whiteList[j]+'||'+todayWhiteTimeRecord[j];
        else str2+= '::'+whiteList[j]+'||'+todayWhiteTimeRecord[j];
        // no need to sync
        storeDataArr['white-'+formattedDate] = str2;

        whiteTimeRecordNew[j] = 0;
    }
    if(storeDataArr!={}) chrome.storage.local.set(storeDataArr);
    console.log("store : " + str);
    storeDataArr['whiteListData'] = str;


    // str = "";
    // for(j=0;j<hardLockList.length;j++) {
    //     if(str=="") str = hardLockList[j];
    //     else{
    //         str+= ("::"+hardLockList[j]);
    //     }
    // }
    // storeDataArr['hardLockListData'] = str;

    str = "";
    str2="";
    for(j=0;j<softLockList.length;j++) {
        if(!softTimeRecord[j]) softTimeRecord[j] = 0;
        if(!softTimeRecordNew[j]) softTimeRecordNew[j] = 0;
        softTimeRecord[j] += softTimeRecordNew[j];
        if(str=="") str = softLockList[j] +"||"+softTimeRecord[j];
        else{
            str+= ("::"+softLockList[j] +"||"+softTimeRecord[j]);
        }

        // save to daily statistics
        todaySoftTimeRecord[j]+=softTimeRecordNew[j];
        if(str2=="") str2 = softLockList[j]+'||'+todaySoftTimeRecord[j];
        else str2+= '::'+softLockList[j]+'||'+todaySoftTimeRecord[j];
        storeDataArr['locked-'+formattedDate] = str2;

        softTimeRecordNew[j] = 0;
    }
    console.log("store : " + str);
    storeDataArr['softLockListData'] = str;


    str = "";
    for (j = 0; j < singleWhite.length; j++) {
        if (str == "") str = singleWhite[j];
        else {
            str += ("::" + singleWhite[j]);
        }
    }
    storeDataArr['singleWhiteData'] = str;

    str = "";
    for (j = 0; j < singleSoftLock.length; j++) {
        if (str == "") str = singleSoftLock[j];
        else {
            str += ("::" + singleSoftLock[j]);
        }
    }
    storeDataArr['singleSoftLockData'] = str;

    str = "";
    for (j = 0; j < singleHardLock.length; j++) {
        if (str == "") str = singleHardLock[j];
        else {
            str += ("::" + singleHardLock[j]);
        }
    }
    storeDataArr['singleHardLockData'] = str;

    totalTimeRecord += totalTimeRecordNew;
    str = totalTimeRecord.toString();
    totalTimeRecordNew = 0;
    storeDataArr['totalTimeRecord'] = str;

    // save to daily statistics
    todayTotalTimeRecord+=totalTimeRecordNew;
    storeDataArr['locked-'+formattedDate] = todayTotalTimeRecord.toString();

    storeDataArr['needReload'] = true;


    chrome.storage.local.set(storeDataArr, function () {
            if (callBack != undefined) callBack();
    });

}