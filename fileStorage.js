/**
 * return in a array of time integer
 *
 * @param pastNDays
 * @param callback
 */
function loadPastNDaysTotalStr(pastNDays,callback){
    var i,j;
    var pref = ['total-','lockedTotal-','whiteTotal-'];
    var reqArr=[];
    var str, temp;
    var strRec = [];

    var rT=[];
    var rL=[];
    var rW=[];

    for(i=0;i<pref.length;i++){
        strRec[i] = [];
    }

    for(i=0;i<pref.length;i++) {
        for (j = 0; j < pastNDays.length; j++) {
            str = pref[i] + pastNDays[j];
            reqArr.push(str);
            strRec[i][j] = str;
        }
    }

    chrome.storage.local.get(reqArr,function(data){
        for(j=0;j<pastNDays.length;j++){
            temp = parseInt(data[strRec[0][j]]);
            if(!temp) rT[j] = 0;
            else rT[j] = temp;

            temp = parseInt(data[strRec[1][j]]);
            if(!temp) rL[j] = 0;
            else rL[j] = temp;

            temp = parseInt(data[strRec[2][j]]);
            if(!temp) rW[j] = 0;
            else rW[j] = temp;
        }


        if(callback){
            callback(rT,rL,rW);
        }

    });

}

function loadPastNDaysStr(pastNDays,callback){
    var i,j;
    var pref = ['total-','locked-','white-'];
    var reqArr=[];
    var str;
    var strRec = [];

    var re=[];

    for(i=0;i<pref.length;i++) {
        for (j = 0; j < pastNDays.length; j++) {
            str = pref[i] + pastNDays[j];
            reqArr.push(str);
            strRec[i][j] = str;
        }
    }

    chrome.storage.local.get(reqArr,function(data){
        for(i=0;i<pref.length;i++){
            for(j=0;j<pastNDays.length;j++){
                re[i][j] = data[strRec[i][j]];
            }
        }

        if(callback){
            callback(re);
        }

    });

}

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


/**
 * this save method don't deal anything about time
 * @param callBack
 */
function saveFile(callBack){

    // save lists
    var i,j;
    var str;
    var storeData = {};

    str = "";
    for(j=0;j<whiteList.length;j++) {
        if(str=="") str = whiteList[j];
        else{
            str+= ("::"+whiteList[j]);
        }
    }
    storeData['whiteList'] = str;

    // str = "";
    // for(var key in whiteTimeRecord) {
    //     if(whiteTimeRecord.hasOwnProperty(key)) {
    //         if (str == "") str = key + "||" + whiteTimeRecord[key];
    //         else {
    //             str += ("::" + key + "||" + whiteTimeRecord[key]);
    //         }
    //     }
    // }
    // storeData['whiteListData'] = str;

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
        if(str=="") str = softLockList[j];
        else{
            str+= ("::"+softLockList[j]);
        }
    }
    storeData['softLockList'] = str;

    // str = "";
    // for(var key in softTimeRecord) {
    //     if(softTimeRecord.hasOwnProperty(key)) {
    //         if (str == "") str = key + "||" + softTimeRecord[key];
    //         else {
    //             str += ("::" + key + "||" + softTimeRecord[key]);
    //         }
    //     }
    // }
    // storeData['softLockListData'] = str;

    // str = "";
    // for (j = 0; j < singleWhite.length; j++) {
    //     if (str == "") str = singleWhite[j];
    //     else {
    //         str += ("::" + singleWhite[j]);
    //     }
    // }
    // storeData['singleWhite'] = str;
    //
    // str = "";
    // for (j = 0; j < singleSoftLock.length; j++) {
    //     if (str == "") str = singleSoftLock[j];
    //     else {
    //         str += ("::" + singleSoftLock[j]);
    //     }
    // }
    // storeData['singleSoftLock'] = str;

    // str = "";
    // for (j = 0; j < singleHardLock.length; j++) {
    //     if (str == "") str = singleHardLock[j];
    //     else {
    //         str += ("::" + singleHardLock[j]);
    //     }
    // }
    // storeData['singleHardLockData'] = str;

    storeData['needReload'] = true;

    chrome.storage.local.set(storeData, function () {
        if (callBack != undefined) callBack();
    });

}


function loadFile(callBack,tab,callback2){
    // get list
    var i, sp2;

    var date = new Date();
    var formattedDate = date.getFullYear()+'/'+(date.getMonth()+1)+'/'+date.getDate();

    var requestArr = [
        "whiteList",
        // "whiteListData",
        "softLockList",
        // "softLockListData",
        "timeRecordData",
        "singleSoftLock",
        "singleWhite",
        "totalTimeRecord",
        // "locked-"+formattedDate, // use time of a single day of locked domain
        // "white-"+formattedDate,
        "timeRecordData-"+formattedDate,
        "total-"+formattedDate,
        "lockedTotal-"+formattedDate, // TOTAL use time of a single day of locked domain
        "whiteTotal-"+formattedDate
    ];

    chrome.storage.local.get(requestArr,function(data){

        var str;

        str = data.whiteList;
        if(str!=undefined && str!="") {
            whiteList = str.split("::");
        }
        // purify just read lists
        purifiedWhite = [];
        for (i = 0; i < whiteList.length; i++) {
            purifiedWhite.push(purifyUrl(whiteList[i]));
        }

        // str = data.whiteListData;
        // whiteTimeRecord = {};
        //
        // if(str!=undefined && str!="") {
        //     var sp = str.split("::");
        //     for (i = 0; i < sp.length; i++) {
        //         // split for time record
        //         sp2 = sp[i].split("||");
        //         sp2[1] = parseInt(sp2[1]);
        //         if(sp2[1]){
        //             whiteTimeRecord[sp2[0]] = parseInt(sp2[1]);
        //         }
        //     }
        // }

        // str = data.hardLockListData;
        // hardLockList = [];
        // if(str!=undefined && str!="") {
        //     sp = [];
        //     sp = str.split("::");
        //     for (i = 0; i < sp.length; i++) {
        //         hardLockList.push(sp[i]);
        //     }
        // }

        str = data.softLockList;
        if(str!=undefined && str!="") {
            softLockList = str.split("::");
        }
        // purify just read lists
        purifiedSoftLock = [];
        for (i = 0; i < softLockList.length; i++) {
            purifiedSoftLock.push(purifyUrl(softLockList[i]));
        }

        // str = data.softLockListData;
        // softTimeRecord = {};
        // if (str != undefined && str!="") {
        //     sp = [];
        //     sp = str.split("::");
        //     for (i = 0; i < sp.length; i++) {
        //         // split for time record
        //         sp2 = sp[i].split("||");
        //         sp2[1] = parseInt(sp2[1]);
        //         if(sp2[1]){
        //             softTimeRecord[sp2[0]] = parseInt(sp2[1]);
        //         }
        //     }
        // }


        // purifiedHardLock = [];
        // for (i = 0; i < hardLockList.length; i++) {
        //     purifiedHardLock.push(purifyUrl(hardLockList[i]));
        // }

        str = data.timeRecordData;
        timeRecord = {};

        if(str!=undefined && str!="") {
            var sp = str.split("::");
            for (i = 0; i < sp.length; i++) {
                // split for time record
                sp2 = sp[i].split("||");
                sp2[1] = parseInt(sp2[1]);
                if(sp2[1]){
                    timeRecord[sp2[0]] = parseInt(sp2[1]);
                }
            }
        }


        str = data.singleSoftLock;
        if (str != undefined && str!="") {
            singleSoftLock = str.split("::");
        }

        // str = data.singleHardLockData;
        // singleHardLock = [];
        // if (str != undefined && str!="") {
        //     var spsb = str.split("::");
        //     for (i = 0; i < spsb.length; i++) {
        //         singleHardLock.push(spsb[i]);
        //     }
        // }

        str = data.singleWhite;
        if (str != undefined && str!="") {
            singleWhite = str.split("::");
        }

        var sp1, sp2;
        // read today time data
        str = data["timeRecordData-"+formattedDate];
        if (str != undefined && str!="") {
            sp1 = str.split("::");
            for (i = 0; i < sp1.length; i++) {
                sp2 = sp1[i].split('||');
                todayTimeRecord[sp2[0]] = parseInt(sp2[1]);
            }
        }

        // str = data["locked-"+formattedDate];
        // if (str != undefined && str!="") {
        //     sp1 = str.split("::");
        //     for (i = 0; i < sp1.length; i++) {
        //         sp2 = sp1[i].split('||');
        //         todaySoftTimeRecord[sp2[0]] = parseInt(sp2[1]);
        //     }
        // }
        //
        // str = data["white-"+formattedDate];
        // if (str != undefined && str!="") {
        //     sp1 = str.split("::");
        //     for (i = 0; i < sp1.length; i++) {
        //         sp2 = sp1[i].split('||');
        //         todayWhiteTimeRecord[sp2[0]] = parseInt(sp2[1]);
        //     }
        // }

        var p = parseInt(data.totalTimeRecord);
        if(p){
            totalTimeRecord = p;
        }
        else{
            totalTimeRecord = 0;
        }

        p = parseInt(data['whiteTotal-'+formattedDate]);
        if(p){
            todayWhiteTotalTimeRecord = p;
        }
        else{
            todayWhiteTotalTimeRecord = 0;
        }

        p = parseInt(data['lockedTotal-'+formattedDate]);
        if(p){
            todaySoftTotalTimeRecord = p;
        }
        else{
            todaySoftTotalTimeRecord = 0;
        }

        p = parseInt(data["total-"+formattedDate]);
        if(p){
            todayTotalTimeRecord = p;
        }
        else{
            todayTotalTimeRecord = 0;
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

    if(lockSaveFile) return;

    // save lists
    var i,j;
    var str,str2;
    var date = new Date();
    var formattedDate = date.getFullYear()+'/'+(date.getMonth()+1)+'/'+date.getDate();
    var storeDataArr={};

    str = "";
    str2 = "";
    for(var key in timeRecordNew) {
        if(timeRecordNew.hasOwnProperty(key)){
            // if(!softTimeRecord[key]) softTimeRecord[key] = 0;
            // softTimeRecord[key] += softTimeRecordNew[key];

            if(!timeRecord[key]) timeRecord[key] = 0;
            timeRecord[key] += timeRecordNew[key];

            if (!todayTimeRecord[key]) todayTimeRecord[key] = 0;
            todayTimeRecord[key] += timeRecordNew[key];

            // save to daily statistics
            for(i=0;i<softLockList.length;i++) {
                if(softLockList[i]==key) {
                    todaySoftTotalTimeRecord += timeRecordNew[key];
                }
            }
            for(i=0;i<whiteList.length;i++) {
                if(whiteList[i]==key) {
                    todayWhiteTotalTimeRecord += timeRecordNew[key];
                }
            }

            todayTotalTimeRecord += timeRecordNew[key];
            totalTimeRecord += timeRecordNew[key];
        }
    }
    // discard no use data
    timeRecordNew = {};

    str = "";
    for(var key in timeRecord) {
        if(timeRecord.hasOwnProperty(key)) {
            if (str == "") str = key + "||" + timeRecord[key];
            else {
                str += ("::" + key + "||" + timeRecord[key]);
            }
        }
    }
    storeDataArr['timeRecordData'] = str;

    str = "";
    for(var key in todayTimeRecord) {
        if(todayTimeRecord.hasOwnProperty(key)) {
            if (str == "") str = key + "||" + todayTimeRecord[key];
            else {
                str += ("::" +  key + "||" + todayTimeRecord[key]);
            }
        }
    }
    storeDataArr['timeRecordData-'+formattedDate] = str;



    str = "";
    for(j=0;j<whiteList.length;j++) {
        if(str=="") str = whiteList[j];
        else{
            str+= ("::"+whiteList[j]);
        }
    }
    storeDataArr['whiteList'] = str;

    storeDataArr['whiteTotal-'+formattedDate] = todayWhiteTotalTimeRecord;

    str = "";
    for(j=0;j<softLockList.length;j++) {
        if(str=="") str = softLockList[j];
        else{
            str+= ("::"+softLockList[j]);
        }
    }
    storeDataArr['softLockList'] = str;

    storeDataArr['lockedTotal-'+formattedDate] = todaySoftTotalTimeRecord;


    // store single
    // str = "";
    // for (j = 0; j < singleWhite.length; j++) {
    //     if (str == "") str = singleWhite[j];
    //     else {
    //         str += ("::" + singleWhite[j]);
    //     }
    // }
    // storeDataArr['singleWhite'] = str;
    //
    // // store single
    // str = "";
    // for (j = 0; j < singleSoftLock.length; j++) {
    //     if (str == "") str = singleSoftLock[j];
    //     else {
    //         str += ("::" + singleSoftLock[j]);
    //     }
    // }
    // storeDataArr['singleSoftLock'] = str;

    // str = "";
    // for (j = 0; j < singleHardLock.length; j++) {
    //     if (str == "") str = singleHardLock[j];
    //     else {
    //         str += ("::" + singleHardLock[j]);
    //     }
    // }
    // storeDataArr['singleHardLockData'] = str;

    if(totalTimeRecordNew){
        totalTimeRecord += totalTimeRecordNew;
        todayTotalTimeRecord += totalTimeRecordNew;
        totalTimeRecordNew = 0;
    }

    // save total time use
    storeDataArr['totalTimeRecord'] = totalTimeRecord;
    storeDataArr['total-'+formattedDate] = todayTotalTimeRecord;


    // update needReload
    storeDataArr['needReload'] = true;


    chrome.storage.local.set(storeDataArr, function () {
            if (callBack != undefined) callBack();
    });

}

function clearAllData(){
    chrome.storage.local.clear(function() {
        var error = chrome.runtime.lastError;
        if (error) {
            console.error(error);
        }
    });
}