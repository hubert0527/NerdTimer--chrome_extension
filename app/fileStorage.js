
var lastSaveFileDate ;

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

function calculatePastNDaysTotal(pastNDays,callback){
    var i,j,k;
    var pref = ['total-','timeRecordData-'];
    var reqArr=[];
    var str, temp, sp, li;
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

            temp = data[strRec[1][j]];
            rL[j] = 0;
            rW[j] = 0;
            if(temp){
                li = temp.split('::');
                for (k = 0; k < li.length; k++) {
                    sp = li[k].split('||');
                    if(softLockList.indexOf(sp[0])>=0){
                        rL[j] += parseInt(sp[1]);
                    }
                    else if(softLockList.indexOf(sp[0])>=0){
                        rW[j] += parseInt(sp[1]);
                    }
                }
            }
        }


        if(callback){
            callback(rT,rL,rW);
        }

    });

}

function loadPastNDaysForDesignatedWebsite(pastNDays,website,callback){
    var j,k;
    var pref = "timeRecordData-";
    var reqArr=[];
    var str;

    var re=[];


    for (j = 0; j < pastNDays.length; j++) {
        str = pref + pastNDays[j];
        reqArr.push(str);
    }


    chrome.storage.local.get(reqArr,function(data){

        var list,sp,hit;

        for(j=0;j<pastNDays.length;j++){

            if(!data[reqArr[j]]){
                re[j] = 0;
                continue;
            }

            list = data[reqArr[j]].split('::');
            hit = false;
            for(k=0;k<list.length;k++) {
                sp = list[k].split('||');
                if(sp[0]==website){
                    hit = true;
                    re[j] = parseInt(sp[1]);
                    break;
                }
            }
            if(!hit){
                re[j] = 0;
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
        // console.log("currentTime = " + time);
        if(callback) callback(time);
        return time;
    });
}

function saveLastUsedTimer(time,callback){
    chrome.storage.local.set({'lastTimer': time},function(){
        // console.log("save last time = " + time);
        if(callback) callback();
    });
}

function loadLastUsedTimer(callback){
    chrome.storage.local.get('lastTimer',function(storage){
        var time = parseInt(storage.lastTimer);
        // console.log("load last time = " + time);
        if(callback) callback(time);
    });
}

function saveSettings(callback) {
    var data = {};

    data['waitNMinutesButton'] = waitNMinutesButton;

    chrome.storage.local.set(data,function () {
        if(callback) callback();
    });


}

function loadSettings(callback) {
    var set = [
        'waitNMinutesButton'
    ];
    chrome.storage.local.get(set,function (data) {

        if(data && data.waitNMinutesButton) {
            waitNMinutesButton = data.waitNMinutesButton;
        }

        if(callback) callback();

    });
}

function saveBlockerLayout(str,callback) {
    chrome.storage.local.set({'blockerLayout': str},function(){
        if(callback){
            callback();
        }
    });
}

function loadBlockerLayout(callback) {
    chrome.storage.local.get('blockerLayout',function(data){
        if(callback){
            if(data.blockerLayout) blockerLayoutVersion++;
            callback(data.blockerLayout);
        }
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
        if(data.mainMessage!=undefined) mainMessage = data.mainMessage;
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


function loadFile(callBack){
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
        // "singleSoftLock",
        // "singleWhite",
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
        else{
            whiteList = [];
        }

        str = data.softLockList;
        if(str!=undefined && str!="") {
            softLockList = str.split("::");
        }
        else{
            softLockList = [];
        }

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

        if (callBack) callBack();

    });

}

/**
 * difference is that this will merge this time browse data with last time and store
 * @param callBack
 */
function saveFileFully(callBack){

    // save lists
    var i,j;
    var str,str2;
    var date;

    date = new Date();

    // if(designatedDate instanceof Date){
    //     date = designatedDate;
    // }
    // else{
    //     date = new Date();
    // }

    // this fires on date change
    var serializedDate = date.getFullYear()*366+date.getMonth()*31+date.getDate();
    if(lastSaveFileDate && lastSaveFileDate!=serializedDate){
        // just change day, so save file to yesterday
        date.setDate(date.getDate()-1);
        console.log('save file to yesterday: '+date.getDate());
    }
    lastSaveFileDate = serializedDate;

    var formattedDate = date.getFullYear()+'/'+(date.getMonth()+1)+'/'+date.getDate();

    chrome.storage.local.get('installDate',function (data) {
        if(!data || !data.installDate){
            chrome.storage.local.set({installDate:formattedDate});
        }
    });

    console.log("saveFully at date " + formattedDate);

    var storeDataArr={};

    str = "";
    str2 = "";
    console.log(timeRecordNew.toString());
    for(var key in timeRecordNew) {
        if(timeRecordNew.hasOwnProperty(key)){
            // if(!softTimeRecord[key]) softTimeRecord[key] = 0;
            // softTimeRecord[key] += softTimeRecordNew[key];

            if(!timeRecord[key]) {
                console.log('timeRecord = ' + timeRecord[key]);
                timeRecord[key] = 0;
            }
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

            console.log('saved ' + key + ' time ' + timeRecordNew[key] + 'time record = ' + timeRecord[key]);

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
        console.log('save complete');
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

function exportData(callback) {

    var requestArr = [
        'installDate',
        "whiteList",
        "softLockList",
        "timeRecordData",
        "totalTimeRecord"
    ];

    chrome.storage.local.get(requestArr,function (data) {

        var fullData = {};

        fullData['whiteList'] = data.whiteList;
        fullData['softLockList'] = data.softLockList;
        fullData['timeRecordData'] = data.timeRecordData;
        fullData['totalTimeRecord'] = data.totalTimeRecord;

        var startDate = data.installDate;
        if(!startDate){
            if(callback) {
                callback("No Data");
                return;
            }
        }

        var allDate = getAllDatesFromInstallDate(startDate);

        var req2 = [];
        for(var i=0;i<allDate.length;i++){
            req2.push("timeRecordData-"+allDate[i]);
            req2.push("total-"+allDate[i]);
            req2.push("lockedTotal-"+allDate[i]);
            req2.push("whiteTotal-"+allDate[i]);
        }

        chrome.storage.local.get(req2,function (data) {
            for(i=0;i<req2.length;i++){
                fullData[req2[i]] = data[req2[i]];
            }

            var reStr = JSON.stringify(fullData);

            // console.log(reStr);

            if(callback) callback(reStr);

        });

    });
}

function importData(data,callback) {

    chrome.storage.local.set(data,function () {

        // over-write local data
        loadFile(function () {
            chrome.runtime.sendMessage({forceReload:"none"},function(){
                if(callback) callback();
            });
        });
    });

}

function getAllDatesFromInstallDate(dateStr) {

    var re=[];

    var sp = dateStr.split('/');
    var fromYear = sp[0];
    var fromMonth = sp[1]-1; // month is special
    var fromDate = sp[2];

    var today = new Date();
    var toYear = today.getFullYear();
    var toMonth = today.getMonth();
    var toDate = today.getDate();

    for(var y=fromYear;y<=toYear;y++){

        var monthUpperBound=11;
        var monthLowerBound=0;

        if(y==toYear){
            monthUpperBound = toMonth;
        }
        if(y==fromYear){
            monthLowerBound = fromMonth;
        }

        for(var m=monthLowerBound;m<=monthUpperBound;m++){

            var dateUpperBound = daysInMonth(m+1,y);
            var dateLowerBound = 1;

            if(y==toYear && m==toMonth){
                dateUpperBound = toDate;
            }
            if(y==fromYear && m==fromMonth){
                dateLowerBound = fromDate;
            }

            for(var d=dateLowerBound;d<=dateUpperBound;d++){
                var formattedDate = y+'/'+(m+1)+'/'+d;
                re.push(formattedDate);
                // console.log(formattedDate);
            }
        }
    }

    return re;

}