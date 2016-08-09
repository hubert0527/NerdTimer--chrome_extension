var ignore = [
    "www",
    "m",
    "cn"
];

var chart;

var isAppClosed = false;

var timer = 0;
var timerInst;

// var singleHardLock = [];
var singleSoftLock = [];
var singleWhite = [];

var softLockList = [];
// var hardLockList = [];
var whiteList = [];

// this only record time except this time you browse
// var softTimeRecord = {};
// var whiteTimeRecord = {};
var timeRecord={};
var totalTimeRecord=0;

// store only today data
/**
 * this use dictionary cuz not guaranteed that every website will be surfed every day
 */
// var todayWhiteTimeRecord = {};
// var todaySoftTimeRecord = {};
var todayTimeRecord = {};
var todayWhiteTotalTimeRecord=0;
var todaySoftTotalTimeRecord=0;
var todayTotalTimeRecord=0;

var purifiedSoftLock;
// var purifiedHardLock;
var purifiedWhite;

var chartMode = 0;
var chartMode0OptionRec = -1;
var chartMode1OptionRec = -1;
var chartMode2OptionRec = -1;

/**
 * main thread, load almost everything except remove list
 */
window.addEventListener("DOMContentLoaded", function() {

    loadFile();

    loadTopCol();
    loadMainPageTimer();
    loadMainMessage();
    loadPops();
    loadTimerBlock();
    loadButtons();
    loadCloseButton();

    console.log("softBlocks: " + softLockList.toString());
    console.log("whites: " + whiteList.toString());

    // loadCurrentTime(function(time){
    //     time = parseInt(time);
    //     //var str = time.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
    //     time = new Date(time);
    //     console.log(time);
    //     $('#dateTime').text(time);
    // });

});

/**
 * check if app is closed
 */
chrome.runtime.sendMessage({isAppClosed:"none"},function(re){
    if(re && re.isAppClosed=="true"){

        // turn bg to red
        isAppClosed = true;
        $('body').css("background-color","red");
        $('.subPage').css("background-color","red");
        // $(this).text("open");

        // clean toggle button animation only for short time slack
        var btn = $("#closeButton");
        btn.toggleClass('slideAnimation');
        btn.css("transition","none");
        document.getElementById("switchBtn").checked = true;
        var i = setInterval(function(){
            btn.toggleClass('slideAnimation');
            btn.css("transition",".4s");
            clearInterval(i);
        },100);

        // hide timer submit
        $('#startTimer').css("display","none");
    }
    else{
        // default
    }
});

function loadCloseButton() {
    $('#closeButton').click(function(){
        // open
        if(isAppClosed){
            isAppClosed = false;
            $('body').css("background-color","lightseagreen");
            $('.subPage').css("background-color","lightseagreen");
            // $(this).text("close");

            // deal with timer
            var time = parseInt($('#waitTime').val());
            if(time && time!=0){
                $('#startTimer').fadeIn("fast");
            }

            chrome.runtime.sendMessage({changeAppStatus:"open"});
            getCurrentTab(function(tab){
                chrome.tabs.sendMessage(tab.id,{blockListChange:"none"});
            });
        }
        // close
        else{
            isAppClosed = true;
            $('body').css("background-color","red");
            $('.subPage').css("background-color","red");
            // $(this).text("open");

            // deal with timer
            $('#startTimer').fadeOut();
            if(timer>0){
                // cancel timer
                clearInterval(timerInst);
                chrome.runtime.sendMessage({cancelTimer:"true"});
                $("#timerSet").fadeOut("slow",function(){
                    $("#timerNotYetSet").fadeIn("slow");
                    timer = 0;
                    document.getElementById("timeDisplay").textContent = "00:00:00";
                });
            }

            chrome.runtime.sendMessage({changeAppStatus:"close"});
            getCurrentTab(function(tab){
                chrome.tabs.sendMessage(tab.id,{block:"false"});
            });
        }
    });
}

function listPossibleAddDomain(type) {
    var i ;
    if(type=="white"){
        $('#addToDomainType').text("加入白名單");
    }
    else if(type=="locked"){
        $('#addToDomainType').text("加入鎖定");
    }

    getCurrentTabUrl(function (url) {
        url = purifyUrl(url);

        var possibleList = [];
        while(url!=""){
            possibleList.push(url);
            url = clearLast(url);
        }

        var ul = $("#possibleList");
        for(i=possibleList.length-1;i>=0;i--){
            ul.append("<li class='possibleListItem'></li>");
        }
        var children = ul.children();
        for(i=possibleList.length-1;i>=0;i--){
            var targetChild = $(children[i]);
            targetChild.text(possibleList[possibleList.length-i-1]);
            if(type=="white"){
                targetChild.click(function () {
                    var res = addSubDomainToWhiteList($(this).text());
                    var tar = $('#addToListError');
                    if(res=="white"){
                        tar.text("目標已屬於 白名單");
                        tar.fadeIn('fast',function () {
                            var t = setInterval(function () {
                                clearInterval(t);
                                tar.fadeOut('fast');
                            },3000);
                        });
                        return;
                    }
                    else if(res=="white"){
                        tar.text("目標已屬於 白名單");
                        tar.fadeIn('slow',function () {
                            var t = setInterval(function () {
                                clearInterval(t);
                                tar.fadeOut('slow');
                            },1000);
                        });
                        return;
                    }
                    moveLeftTo("#possibleDomain","#addToListType",function(){
                        $($("#possibleList").children()).remove();
                    });
                });
            }
            else if(type=="locked"){
                targetChild.click(function () {
                    var res = addSubDomainToSoftLockList($(this).text());
                    var tar = $('#addToListError');
                    if(res=="white"){
                        tar.text("目標已屬於 白名單");
                        tar.fadeIn('slow',function () {
                            var t = setInterval(function () {
                                clearInterval(t);
                                tar.fadeOut('slow');
                            },1000);
                        });
                        return;
                    }
                    else if(res=="white"){
                        tar.text("目標已屬於 白名單");
                        tar.fadeIn('fast',function () {
                            var t = setInterval(function () {
                                clearInterval(t);
                                tar.fadeOut('fast');
                            },3000);
                        });
                        return;
                    }
                    moveLeftTo("#possibleDomain","#addToListType",function(){
                        $($("#possibleList").children()).remove();
                    });
                });
            }
        }
    });
}

var pastNDayTimerInst;
var lastDayInput = "7";

var pastNWebsiteTimerInst;
var lastWebsiteInput = "10";

var fakeLoadTimerInst;

function loadButtons() {
    // document.getElementById("addSinglePageToSoftLockList").addEventListener("click", addSinglePageToSoftLockList);
    document.getElementById("addDomainToSoftLockList").addEventListener("click", function () {
        listPossibleAddDomain("locked");
        moveRightTo("#addToListType","#possibleDomain");
    });
    document.getElementById("fastAdd").addEventListener("click", addBaseDomainToSoftLockList);
    // document.getElementById("addSinglePageToHardLockList").addEventListener("click", addSinglePageToHardLockList);
    // document.getElementById("addBaseDomainToHardLockList").addEventListener("click", addBaseDomainToHardLockList);
    // document.getElementById("addSinglePageToWhiteList").addEventListener("click", addSinglePageToWhiteList);
    document.getElementById("fastWhite").addEventListener("click", addSinglePageToWhiteList);
    document.getElementById("addDomainToWhiteList").addEventListener("click", function () {
        listPossibleAddDomain("white");
        moveRightTo("#addToListType","#possibleDomain");
    });
    // document.getElementById("submitMainMessage").addEventListener("click", function(){
    //     var v = $("#mainMessageInput").val();
    //     console.log("receive event : "+v.toString());
    //     if(v==MouseEvent) return;
    //     submitMainMessage(v.toString());
    // });
    $(document.getElementById("mainMessageInput")).bind('input', function() {
        var v = $(this).val();
        console.log("receive event : "+v.toString());
        if(v==MouseEvent) return;
        submitMainMessage(v.toString());
    });
    document.getElementById("mainMessageInput").onkeydown = function(key){
        if(key.which==13 && $('#mainMessageInput').val()==""){
            submitMainMessage('');
        }
    };
    
    $('#clearAllData').click(function () {
        $('#warningContent1').text("確定清除所有資料？");
        $('#warningContent2').text("(此操作無法回復)");
        $('#warningCheck').css('display','block');
        $('#warningFakeLoad').css('display','none');
        $('#warningPop').fadeIn('fast',function () {
            $('#warningYes').click(function () {
                $('#warningYes').unbind( "click" );
                $('#warningNo').unbind( "click" );
                $('#warningCheck').fadeOut('fast',function () {
                    $('#warningCancel').click(function(){
                        clearInterval(fakeLoadTimerInst);
                        $('#warningCancel').unbind( "click" );
                        $('#warningPop').fadeOut('fast');
                    });
                    $('#warningFakeLoad').fadeIn('fast',function () {
                        fakeLoadTimerInst = setInterval(function(){
                            clearInterval(fakeLoadTimerInst);
                            clearAllData();
                            clearLocalData();
                            chrome.runtime.sendMessage({clearAllData:"true"});
                            resetMainPageStyles();
                            $('#warningPop').fadeOut('fast');
                            $('#warningCancel').unbind( "click" );
                        },5000);
                    });
                });
            });
            $('#warningNo').click(function () {
                $('#warningPop').fadeOut('fast');
                $('#warningYes').unbind( "click" );
                $('#warningNo').unbind( "click" );
            });
        })
    });

    // create sliding button                                                                  // current        target
    document.getElementById("goToAddToListType").addEventListener("click", function(){moveRightTo("#mainPage","#addToListType");});
    document.getElementById("moreSettings").addEventListener("click", function(){moveRightTo("#mainPage","#settingPage");});
    document.getElementById("goToStatistics").addEventListener("click", function(){

        //chrome.runtime.sendMessage({forceSaveFully:"none"},function(res){
            loadFile(function(){

                // init
                // force program to re load all components
                chartMode = -1;
                changeToMode(0);

                // button for mode 0
                $('#statisticsForEachWebsite').click(function(){
                    if(chartMode!=0){
                        clearInterval(pastNDayTimerInst);
                        changeToMode(0);
                    }
                });

                // button for mode 1
                $('#statisticsPastNDays').click(function(){
                    if(chartMode!=1){
                        clearInterval(pastNWebsiteTimerInst);
                        changeToMode(1);
                    }
                });

                // button for mode 2
                $('#statisticsUn').click(function(){
                    if(chartMode!=2){
                        clearInterval(pastNDayTimerInst);
                        clearInterval(pastNWebsiteTimerInst);
                        changeToMode(2);
                    }
                });

                createNWebsiteInput();

                createNDayInput();

                moveRightTo("#addToListType","#statistics");

            });
        //});

    });

    // create go to remove list buttons
    createRemoveList();

    document.getElementById("goToMainPage1").addEventListener("click", function(){
        loadFile();

        // refresh status
        getCurrentTabUrl(function (url) {
            // check in list
            chrome.runtime.sendMessage({"getStatus":url}, function(response) {
                if(response==undefined || response.block==undefined)
                    $(document.getElementById("isInList")).text(" error");
                if(response.block=="white") $(document.getElementById("isInList")).text(" white list");
                // else if(response.block=="hard") $(document.getElementById("isInList")).text(" hard block");
                else if(response.block=="soft") $(document.getElementById("isInList")).text(" Locked");
                else if(response.block=="none") $(document.getElementById("isInList")).text(" none");
            });
        });

        // refresh timer time check if click 5min btn
        chrome.runtime.sendMessage({getTimerTime:"none"},function(res){
            if(timer<=0 && parseInt(res.time)>0){
                setPopupTimer(res.time);
            }
        });

        moveLeftTo("#addToListType","#mainPage");
    });
    document.getElementById("goToMainPage6").addEventListener("click", function(){
        moveLeftTo("#removeWhite","#addToListType",function () {
            // var ul = $('#removeWhiteListSingle');
            // $(ul.children()).remove();
            var ul = $('#removeWhiteListDomain');
            $(ul.children()).remove();
        });
    });
    document.getElementById("goToMainPage7").addEventListener("click", function(){
        moveLeftTo("#removeSoft","#addToListType",function(){
            // var ul = $('#removeSoftListSingle');
            // $(ul.children()).remove();
            var ul = $('#removeSoftListDomain');
            $(ul.children()).remove();
        });
    });

    // document.getElementById("goToMainPage8").addEventListener("click", function(){
    //     moveLeftTo("#removeHard","#addToListType",function(){
    //         var ul = $('#removeHardListSingle');
    //         $(ul.children()).remove();
    //         ul = $('#removeHardListDomain');
    //         $(ul.children()).remove();
    //     });
    //
    // });
    document.getElementById("goToMainPage9").addEventListener("click", function(){
        moveLeftTo("#statistics","#addToListType",function(){

            $('#chartPopupTop').css('display','none');

            var me = $("#statistics");
            $('#chartArea').remove();
            me.append(
                '<canvas id="chartArea" width="225" height="160"></canvas>'
            );

            $('#statisticsPastNDaysBlock').css('display','none');
            $('#statisticsForEachWebsiteOptions').css('display','none');

        });
    });

    document.getElementById("goToMainPage10").addEventListener("click", function(){
        moveLeftTo("#possibleDomain","#addToListType",function(){
            $($("#possibleList").children()).remove();
        });
    });

    document.getElementById("goToMainPage11").addEventListener("click", function(){
        loadFile();

        // refresh status
        getCurrentTabUrl(function (url) {
            // check in list
            chrome.runtime.sendMessage({"getStatus":url}, function(response) {
                if(response==undefined || response.block==undefined)
                    $(document.getElementById("isInList")).text(" error");
                if(response.block=="white") $(document.getElementById("isInList")).text(" white list");
                // else if(response.block=="hard") $(document.getElementById("isInList")).text(" hard block");
                else if(response.block=="soft") $(document.getElementById("isInList")).text(" Locked");
                else if(response.block=="none") $(document.getElementById("isInList")).text(" none");
            });
        });

        // refresh timer time check if click 5min btn
        chrome.runtime.sendMessage({getTimerTime:"none"},function(res){
            if(timer<=0 && parseInt(res.time)>0){
                setPopupTimer(res.time);
            }
        });

        moveLeftTo("#settingPage","#mainPage");
    });

}

function createNWebsiteInput() {
    $(document.getElementById("statisticsNWebsiteInput")).keydown(function (e) {
        // Allow: backspace, delete, tab, escape, enter and .
        if ($.inArray(e.keyCode, [46, 8, 9, 27, 13, 110, 190]) !== -1 ||
             // Allow: Ctrl+A
            (e.keyCode == 65 && e.ctrlKey === true) ||
             // Allow: Ctrl+C
            (e.keyCode == 67 && e.ctrlKey === true) ||
             // Allow: Ctrl+X
            (e.keyCode == 88 && e.ctrlKey === true) ||
             // Allow: home, end, left, right
            (e.keyCode >= 35 && e.keyCode <= 39)) {
                 // let it happen, don't do anything
        }
        // Ensure that it is a number and stop the keypress
        else if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
            e.preventDefault();
        }
    });

    // create options for mode 1
    $('#statisticsNWebsiteInput').bind("input",function(){

        clearInterval(pastNWebsiteTimerInst);

        var str = $(this).val();
        var val = parseInt(str);
        var lastChar = str.slice(-1);

        if(!val){
            if(lastChar!='') $(this).val('');
            return;
        }
        else if(val>100){
            //$(this).val( str.substring(0,str.length-1) );
            $(this).val(lastWebsiteInput);
            str = lastWebsiteInput;
        }

        lastWebsiteInput = str;

        pastNWebsiteTimerInst = setInterval(function(){
            // over 500ms no further input
            var web = parseInt($('#statisticsNWebsiteInput').val());
            changeToMode(web*10);

            clearInterval(pastNWebsiteTimerInst);
        },500);
    });
}

function createNDayInput() {
    $(document.getElementById("statisticsPastNDaysInput")).keydown(function (e) {
        // Allow: backspace, delete, tab, escape, enter and .
        if ($.inArray(e.keyCode, [46, 8, 9, 27, 13, 110, 190]) !== -1 ||
             // Allow: Ctrl+A
            (e.keyCode == 65 && e.ctrlKey === true) ||
             // Allow: Ctrl+C
            (e.keyCode == 67 && e.ctrlKey === true) ||
             // Allow: Ctrl+X
            (e.keyCode == 88 && e.ctrlKey === true) ||
             // Allow: home, end, left, right
            (e.keyCode >= 35 && e.keyCode <= 39)) {
                 // let it happen, don't do anything
        }
        // Ensure that it is a number and stop the keypress
        else if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
            e.preventDefault();
        }
    });

    // create options for mode 1
    $('#statisticsPastNDaysInput').bind("input",function(){

        clearInterval(pastNDayTimerInst);

        var str = $(this).val();
        var val = parseInt(str);
        var lastChar = str.slice(-1);

        if(!val){
            if(lastChar!='') $(this).val('');
            return;
        }
        else if(val>365){
            //$(this).val( str.substring(0,str.length-1) );
            $(this).val(lastDayInput);
            str = lastDayInput;
        }

        lastDayInput = str;

        // 1 is an exception which cannot complete a graph
        if(val==1) return;

        pastNDayTimerInst = setInterval(function(){
            // over 500ms no further input
            var day = parseInt($('#statisticsPastNDaysInput').val());
            changeToMode(day*10 + 1);

            clearInterval(pastNDayTimerInst);
        },500);
    });
}

/**
 * Notation: A + B , which B < 10
 *
 * A: options
 *      0  :    if have prev value record, use that. Or, use init value.
 *      1+ :    use this option
 *
 * B: mode
 *      0: website top ranking mode
 *      1: past N day flow
 *
 * @param changeToMode
 */
function changeToMode(changeToMode) {

    var mode = changeToMode%10;
    var option = Math.round(changeToMode/10);
    var prevMode = chartMode%10;

    // remove previous chart
    $('#chartArea').remove();
    $("#statistics").append('<canvas id="chartArea" width="225" height="160"></canvas>');


    if(mode==0){
        // run prev, or default
        if(option==0) {
            var selectBox = $('#statisticsForEachWebsiteOptions');
            var inputBox = $('#statisticsNWebsiteInput');

            // init
            if(prevMode==-1){
                selectBox.css("display","block");
            }
            else if(prevMode==1){
                $('#statisticsPastNDaysBlock').fadeOut('fast',function(){selectBox.fadeIn('fast');});
            }

            // // jump to target option if this chart was used before
            // if(chartMode0OptionRec!=-1) {
            //     selectBox.val(chartMode0OptionRec.toString());
            // }
            // else{
            //     selectBox.val('1');
            //     chartMode0OptionRec = 1;
            // }
            // jump to target option if this chart was used before
            if(chartMode0OptionRec!=-1) {
                inputBox.val(chartMode0OptionRec.toString());
            }
            else{
                inputBox.val('10');
                chartMode0OptionRec = 10;
            }

            changeToMode = chartMode0OptionRec*10
            drawChart(changeToMode);
        }
        else{
            chartMode0OptionRec = option;
            drawChart(changeToMode);
        }
    }
    else if(mode==1){
        // run prev, or default
        if(option==0) {
            var inputBox = $('#statisticsPastNDaysInput');
            if(prevMode==0){
                $('#statisticsForEachWebsiteOptions').fadeOut('fast',function(){$('#statisticsPastNDaysBlock').fadeIn('fast');});
            }

            // jump to target option if this chart was used before
            if(chartMode1OptionRec!=-1) {
                inputBox.val(chartMode1OptionRec.toString());
            }
            else{
                inputBox.val('7');
                chartMode1OptionRec = 7;
            }

            changeToMode = chartMode1OptionRec*10+1;
            drawChart(changeToMode);
        }
        else{
            chartMode1OptionRec = option;
            drawChart(changeToMode);
        }
    }
    else if(mode==2){
        // run prev, or default
        if(option==0) {

        }
        else{

        }
    }

    chartMode = changeToMode;
}


function daysInMonth(month,year) {
    // cuz month 0 is January in JS, this gets last month' last date
    return new Date(year, month, 0).getDate();
}

function getPastNDays(n){

    var i;
    var re = [];

    var today = new Date();
    var year = today.getFullYear();
    var month = today.getMonth()+1;
    var date = today.getDate();
    var dayCount, min;

    var pref = year+'/'+month+'/';

    // this month is enough
    if(date>=n){
        for(i=n-1;i>=0;i--){
            re.push(pref+(date-i));
        }
        return re;
    }

    for(i=0;i<date;i++){
        re.push(pref+(date-i));
    }

    n-=date;

    while(n>0){
        if(month>1) month --;
        else{
            year --;
            month = 12;
        }

        pref = year+'/'+month+'/';
        dayCount = daysInMonth(month,year);

        min = n > dayCount ? dayCount : n;
        n -= min;

        // if min is 1, means only require a day, which will only take the last day of month, so bound is 0
        for(i=0;i<min;i++){
            re.push( pref+(dayCount-i) );
        }
    }

    return re.reverse();
}

/**
 * parse N top from dual list and return a dual list
 *
 *  dual list is as form [ [domain] , [value] ]
 *
 * @param n
 * @param li
 */
function getFirstNInList(n,li) {
    var i;
    var min;
    var reD =[];
    var reV = [];

    li.sort(function(aa,bb){
        if(aa[1]>bb[1]) return -1;
        else if (aa[1]<bb[1]) return 1;
        else {
            if(aa[0]>bb[0]) return 1;
            else return -1;
        }
    });

    min = n < li.length ? n : li.length;
    for(i=0;i<min;i++){
        reD[i] = li[i][0];
        reV[i] = li[i][1];
    }

    return [reD,reV];
}

function formattingTimeArr(arr){
    var i;
    var re = [];
    var sec, min, hr, day, month;
    var temp;
    for(i=0;i<arr.length;i++){
        temp = arr[i];
        temp = Math.floor(temp/1000);
        sec = temp%60;
        temp = Math.floor(temp/60);
        min = temp%60;
        temp = Math.floor(temp/60);
        hr = temp;

        re[i] = hr+"h "+min+"m "+sec+"s";
    }
    return re;
}

function generateNColor(n){
    var re = [];
    var di = Math.round(120/n);
    var degree;
    for(var i=0;i<n;i++){
        // r = 255 - di*i;
        // g = di*i;
        // if(r<0) r = 0;
        // if(g>255) g=255;
        degree = di*i;
        re.push("hsl("+ degree +",100%,50%)");
    }
    return re;
}

function getIndexesInList(arr,list) {
    var re=[];
    for(var i=0;i<arr.length;i++){
        if(list.indexOf(arr[i])!=-1){
            re.push(i);
        }
    }
    return re;
}

/**
 * implement 4 modes, draw three kinds of chart
 *
 * 0: default, show top N most used domain including white list
 * 10: show top N most used domain excludes white list
 *
 * 1: past 7 days totalTime-Locked-white use time line
 *
 */
function drawChart(modeFull){

    var mode = modeFull%10;
    var option = Math.round(modeFull/10);

    var n;
    var days = option;
    var li=[], i, key;
    var tTime=[], tDomain=[];

    // chart must use
    var data, chartType, chartOption={};
    var ctx = $('#chartArea');
    // bar prop
    var barDist, borderColors=[], borderWidth, timeValue, domainName=[], colors, listCategory=[], formattedTime;
    // line prop
    var lineLocked, lineWhite, lineTotal;


    if(mode==0){
        // mixed top N
        // if(option==1) {

            n = option;

            if(Object.keys(timeRecord).length==0){
                notifyNoData();
                return;
            }

            // get fist N data
            for(key in timeRecord ){
                if(timeRecord.hasOwnProperty(key)){
                    li.push([key,timeRecord[key]]);
                }
            }
            // for(key in whiteTimeRecord ){
            //     if(whiteTimeRecord.hasOwnProperty(key)){
            //         li.push([key,whiteTimeRecord[key]]);
            //     }
            // }
            // for(key in softTimeRecord ){
            //     if(softTimeRecord.hasOwnProperty(key)){
            //         li.push([key,softTimeRecord[key]]);
            //     }
            // }

            li = getFirstNInList(n, li);

            timeValue = li[1];
            for (i = li[1].length; i < n; i++) timeValue.push(0);
            for (i = 0; i < li[0].length; i++) {
                domainName.push(li[0][i]);
            }
            for (i = li[0].length; i < n; i++) domainName.push("");

            formattedTime = formattingTimeArr(li[1]);
            colors = generateNColor(n);
            for (i = 0; i < timeValue.length; i++) borderColors.push("black");

            // remove color of domain in white List
            var softIndex = getIndexesInList(domainName,softLockList);
            for(i=0;i<colors.length;i++) {
                if( softIndex.indexOf(i)<0){
                    colors[i] = "black";
                }
            }
            var whiteIndex = getIndexesInList(domainName,whiteList);
            for (i = 0; i < whiteIndex.length; i++) {
                colors[whiteIndex[i]] = "white";
                //borderColors[whiteIndex[i]]="white";
            }

            // deal with category
            for(i=0;i<timeValue.length;i++){
                listCategory[i] = "未加入";
            }
            for (i = 0; i < softIndex.length; i++) {
                listCategory[softIndex[i]] = "鎖定";
            }
            for (i = 0; i < whiteIndex.length; i++) {
                listCategory[whiteIndex[i]] = "白名單";
            }
        // }

        // // only listed top N
        // else if(option==2){
        //
        //     // get fist N data
        //     for(key in timeRecord){
        //         if(timeRecord.hasOwnProperty(key) && softLockList.indexOf(key)>=0){
        //             li.push([key,timeRecord[key]]);
        //         }
        //     }
        //     if(li.length==0){
        //         notifyNoData();
        //         return;
        //     }
        //     li = getFirstNInList(n,li);
        //
        //     timeValue = li[1];
        //     for(i=li[1].length;i<n;i++) timeValue.push(0);
        //     for(i=0;i<li[0].length;i++){
        //         domainName.push(li[0][i]);
        //     }
        //     for(i=li[0].length;i<n;i++) domainName.push("");
        //
        //     formattedTime =formattingTimeArr(li[1]);
        //     colors = generateNColor(n);
        //     for(i=0;i<timeValue.length;i++) borderColors.push("black");
        //
        // }
        //
        // // only white top N
        // else if(option==3){
        //
        //     // get fist N data
        //     for(key in timeRecord){
        //         if(timeRecord.hasOwnProperty(key) && whiteList.indexOf(key)>=0){
        //             li.push([key,timeRecord[key]]);
        //         }
        //     }
        //     if(li.length==0){
        //         notifyNoData();
        //         return;
        //     }
        //     li = getFirstNInList(n,li);
        //
        //     timeValue = li[1];
        //     for(i=li[1].length;i<n;i++) timeValue.push(0);
        //     for(i=0;i<li[0].length;i++){
        //         domainName.push(li[0][i]);
        //     }
        //     for(i=li[0].length;i<n;i++) domainName.push("");
        //
        //     formattedTime =formattingTimeArr(li[1]);
        //     colors = generateNColor(n);
        //     for(i=0;i<timeValue.length;i++) borderColors.push("black");
        // }


        chartType="bar";

        // change border and bar dist types
        if (n <= 10) {
            borderWidth = 3;
            barDist = 0.8;
        }
        else if (n < 20) {
            borderWidth = 2;
            barDist = 0.9;
        }
        else if(n<50){
            borderWidth = 1;
            barDist = 0.95;
        }
        else {
            borderWidth = 0;
            barDist = 1;
        }

        chartOption={
            legend: {
                display: false
            },
            // hover pop up
            tooltips:{
                callbacks:{
                    label : function(tooltipItem,data){
                        var index = tooltipItem.index;
                        return formattedTime[index];
                    },
                    afterLabel : function(tooltipItem,data){
                        return listCategory[tooltipItem.index];
                    }
                }
            },
            scales: {
                xAxes: [{
                    display: false,
                    barPercentage: barDist
                }],
                yAxes: [{
                    display: false
                }]
            },
            defaultFontColor: '#000',
            responsive: false
        };

        data = {
            labels: domainName,
            datasets: [{
                label: "time used: ",
                data: timeValue,
                backgroundColor: colors,
                borderColor: borderColors,
                borderWidth: borderWidth
            }]

        };

        chart = new Chart(ctx,{
            type: chartType,
            data: data,
            options: chartOption
        });

        document.getElementById('chartArea').onclick = function(evt){
            var activePoints = chart.getElementsAtEvent(evt);
            if(activePoints && activePoints[0]) {
                var label = activePoints[0]._model.label;
                console.log("clicked on " + label);
                createTopPopup(label);
            }
            else{
                if($('#chartPopupTop').is(':visible')){
                    $('#chartPopupTop').fadeOut('fast');
                }
            }
        };

    }
    else if(mode==1){
        chartType="line";

        var pastNDays=getPastNDays(days);

        loadPastNDaysTotalStr(pastNDays,function (lineTotal,lineLocked,lineWhite) {

            var labelsLocked=[];
            for(i=0;i<days;i++) labelsLocked.push("Locked");
            var labelsWhite=[];
            for(i=0;i<days;i++) labelsWhite.push("White");
            var labelsTotal=[];
            for(i=0;i<days;i++) labelsTotal.push("Total");

            data = {
                labels: pastNDays,
                datasets: [{
                    label: 'Locked',
                    data: lineLocked,
                    backgroundColor: 'rgba(255,0,0,0.7)',
                    borderColor: 'black',
                    borderWidth: 2,
                    lineTension: 0.4,
                    spanGaps: true
                },{
                    label: 'White',
                    data: lineWhite,
                    backgroundColor: 'rgba(255,255,255,0.7)',
                    borderColor: 'black',
                    borderWidth: 2,
                    lineTension: 0.4,
                    spanGaps: true
                },{
                    label: 'Total',
                    data: lineTotal,
                    backgroundColor: 'rgba(255,255,0,0.7)',
                    borderColor: 'black',
                    borderWidth: 2,
                    lineTension: 0.4,
                    spanGaps: true
                }]

            };

            chartOption= {
                legend: {
                    display: false
                },
                tooltips:{
                    callbacks: {
                        label: function (tooltipItem, data) {
                            var index = tooltipItem.index;
                            var dataSetsIndex = tooltipItem.datasetIndex;
                            var time;
                            if(dataSetsIndex==0) time = lineLocked[index];
                            else if(dataSetsIndex==1) time = lineWhite[index];
                            else if(dataSetsIndex==2) time = lineTotal[index];
                            else return "ERROR";

                            time/=1000;
                            var sec = Math.floor(time%60);
                            time/=60;
                            var min = Math.floor(time%60);
                            time/=60;
                            var hr = Math.floor(time%60);

                            return hr+'h '+min+'m '+sec+'s';
                        },
                        afterLabel : function(tooltipItem,data){
                            var dataSetsIndex = tooltipItem.datasetIndex;
                            if(dataSetsIndex==0) return "鎖定網站總計";
                            else if(dataSetsIndex==1) return "白名單網站總計";
                            else if(dataSetsIndex==2) return "總瀏覽時間";
                            else return "ERROR";
                        }
                    }
                },
                scales: {
                    xAxes: [{
                        ticks: {
                            display: false,
                            padding: 100
                        }
                    }],
                    yAxes: [{
                        // display: false
                        ticks: {
                            display: false
                        }
                    }]
                }
            };

            chart = new Chart(ctx,{
                type: chartType,
                data: data,
                options: chartOption
            });
        });
    }



}

function createTopPopup(url) {

    var top = $('#chartPopupTop');

    var lastChild = $('#chartPopupTopActions').children();
    if(lastChild){
        $(lastChild).remove();
    }

    if(top.is(':visible')){
        top.fadeOut('fast',function () {
            prepareTopPopupContent(url);
            top.fadeIn('fast');
        });
    }
    else{
        prepareTopPopupContent(url);
        top.fadeIn('fast');
    }

}
function prepareTopPopupContent(url) {
    var top = $('#chartPopupTop');

    top.css('display','flex').hide();

    var actions = $('#chartPopupTopActions');

    $('#closePopupTop').click(function () {
        $('#chartPopupTop').fadeOut('fast');
    });
    $('#addingDomainName').text(url);

    if(whiteList.indexOf(url)>=0){
        actions.append('<button id="removeFromWhiteListBtnJustCreated" class="popupTopBtn">自白名單移除</button>');
        $('#removeFromWhiteListBtnJustCreated').click(function () {
            var index = whiteList.indexOf(url);
            whiteList.splice(index,1);
            saveFile(function(){
                getCurrentTab(function(tab){
                    chrome.tabs.sendMessage(tab.id,{blockListChange:"false"});
                });
                var me = $("#statistics");
                $('#chartArea').remove();
                me.append(
                    '<canvas id="chartArea" width="225" height="160"></canvas>'
                );
                drawChart(chartMode);
            });
            top.fadeOut('fast');
        });
    }
    else if(softLockList.indexOf(url)>=0){
        actions.append('<button id="removeFromSoftLockListBtnJustCreated" class="popupTopBtn">自鎖定移除</button>');
        $('#removeFromSoftLockListBtnJustCreated').click(function () {
            var index = softLockList.indexOf(url);
            softLockList.splice(index,1);
            saveFile(function(){
                getCurrentTab(function(tab){
                    chrome.tabs.sendMessage(tab.id,{blockListChange:"false"});
                });
                var me = $("#statistics");
                $('#chartArea').remove();
                me.append(
                    '<canvas id="chartArea" width="225" height="160"></canvas>'
                );
                drawChart(chartMode);
            });
            top.fadeOut('fast');
        });
    }
    else{
        actions.append('<button id="addToWhiteListBtnJustCreated" class="popupTopBtn">白名單</button>');
        actions.append('<button id="addToSoftLockListBtnJustCreated" class="popupTopBtn">鎖定</button>');
        $('#addToSoftLockListBtnJustCreated').click(function () {
            softLockList.push(url);
            saveFile(function(){
                getCurrentTab(function(tab){
                    chrome.tabs.sendMessage(tab.id,{blockListChange:"soft"});
                });
                var me = $("#statistics");
                $('#chartArea').remove();
                me.append(
                    '<canvas id="chartArea" width="225" height="160"></canvas>'
                );
                drawChart(chartMode);
            });
            top.fadeOut('fast');
        });
        $('#addToWhiteListBtnJustCreated').click(function () {
            whiteList.push(url);
            saveFile(function(){
                getCurrentTab(function(tab){
                    chrome.tabs.sendMessage(tab.id,{blockListChange:"false"});
                });
                var me = $("#statistics");
                $('#chartArea').remove();
                me.append(
                    '<canvas id="chartArea" width="225" height="160"></canvas>'
                );
                drawChart(chartMode);
            });
            top.fadeOut('fast');
        });
    }
}

function notifyNoData() {
    var ctx = $('#chartArea')[0].getContext('2d');
    ctx.font = "30px serif";
    ctx.fillText("No Data",60,80);
}

function loadTimerBlock() {
    document.getElementById("startTimer").addEventListener("click",function(){
        if(timer>0) return;
        var time = parseInt(document.getElementById("waitTime").value);
        if(time && time>0) {
            $("#timerNotYetSet").fadeOut("slow",function(){
                $("#timerSet").fadeIn("slow");
            });
            saveLastUsedTimer(time, function () {
                chrome.runtime.sendMessage({timerSet: time});
                setPopupTimer(time*60);
            });
        }
    });
    // timer setting only allow number
    $(document.getElementById("waitTime")).keydown(function (e) {
        // press ENTER
        if(e.which==13){
            if(timer>0) return;
            var time = parseInt(document.getElementById("waitTime").value);
            if(time && time>0) {
                saveLastUsedTimer(time, function () {
                    chrome.runtime.sendMessage({timerSet: time});
                    setPopupTimer(time*60);
                });
                $("#timerNotYetSet").fadeOut("slow",function(){
                        $("#timerSet").fadeIn("slow");
                    });
            }
        }
        // Allow: backspace, delete, tab, escape, enter and .
        else if ($.inArray(e.keyCode, [46, 8, 9, 27, 13, 110, 190]) !== -1 ||
             // Allow: Ctrl+A
            (e.keyCode == 65 && e.ctrlKey === true) ||
             // Allow: Ctrl+C
            (e.keyCode == 67 && e.ctrlKey === true) ||
             // Allow: Ctrl+X
            (e.keyCode == 88 && e.ctrlKey === true) ||
             // Allow: home, end, left, right
            (e.keyCode >= 35 && e.keyCode <= 39)) {
                 // let it happen, don't do anything
        }
        // Ensure that it is a number and stop the keypress
        else if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
            e.preventDefault();
        }
    });
    // timer can't have too-high number, MAX=999
    $(document.getElementById("waitTime")).bind("input",function(){
        var str = $(this).val();
        var val = parseInt(str);
        var lastChar = str.slice(-1);

        if(!val){
            if(lastChar!='') $(this).val('');
            $("#startTimer").fadeOut('fast');
            return;
        }
        else if(lastChar>'9' || lastChar<'0'){
            if(!val){
                $("#startTimer").fadeOut('fast');
            }
            else {
                $(this).val(lastTimerInput);
            }
            return;
        }
        else if(val>999){
            //$(this).val( str.substring(0,str.length-1) );
            $(this).val(lastTimerInput);
            return;
        }

        if(!$("#startTimer").is(':visible')) $("#startTimer").fadeIn('fast');

        lastTimerInput = str;
    });

    // cancel timer
    document.getElementById("cancelTimer").addEventListener("click",function(){
        clearInterval(timerInst);
        chrome.runtime.sendMessage({cancelTimer:"true"});
        $("#timerSet").fadeOut("slow",function(){
            $("#timerNotYetSet").fadeIn("slow");
            timer = 0;
            document.getElementById("timeDisplay").textContent = "00:00:00";
        });
    });
}

function loadPops() {
    document.getElementById("waitTime").addEventListener("focus",function(){
        $('#timerInputPop').fadeIn('slow');
    });
    document.getElementById("waitTime").addEventListener("focusout",function(){
        $('#timerInputPop').fadeOut('fast');
    });
    // document.getElementById("prompt1").addEventListener("mouseover",function(){
    //     $('#prompt1Pop').fadeIn('fast');
    // });
    // document.getElementById("prompt1").addEventListener("mouseleave",function(){
    //     $('#prompt1Pop').fadeOut('fast');
    // });
    document.getElementById("statisticsPastNDaysInput").addEventListener("focus",function(){
        $('#dayInputPop').fadeIn('slow');
    });
    document.getElementById("statisticsPastNDaysInput").addEventListener("focusout",function(){
        $('#dayInputPop').fadeOut('fast');
    });
    document.getElementById("statisticsNWebsiteInput").addEventListener("focus",function(){
        $('#websiteCountInputPop').fadeIn('slow');
    });
    document.getElementById("statisticsNWebsiteInput").addEventListener("focusout",function(){
        $('#websiteCountInputPop').fadeOut('fast');
    });
}

function loadTopCol(){
        // find current domain
    getCurrentTabUrl(function (url) {
        // set domain
        // var pure = cutOffHeadAndTail(url);
        // if(pure.substring(0,3)=="www"){
        //     pure = pure.substring(4);
        // }
        var pure = purifyUrl(url);
        var res = pure.split("/");
        $(document.getElementById("currentDomain")).text(res[0]);

        // check if domain is too long
        var cli = document.getElementById("currentDomain").clientWidth;
        var scr = document.getElementById("currentDomain").scrollWidth;

        while(scr > cli){
            cli = document.getElementById("currentDomain").clientWidth;
            scr = document.getElementById("currentDomain").scrollWidth;
            var lineH = parseInt(($("#currentDomain").css('font-size')));
            if(lineH>15){
                lineH--;
                $("#currentDomain").css('font-size',lineH+"px");
            }
            else{
                $("#currentDomain").css('word-wrap',"break-word");
                break;
            }
        }

        // check in list
        chrome.runtime.sendMessage({"getStatus":url}, function(response) {
            if(response==undefined || response.block==undefined)
                $(document.getElementById("isInList")).text(" error");
            if(response.block=="white") $(document.getElementById("isInList")).text(" white list");
            // else if(response.block=="hard") $(document.getElementById("isInList")).text(" hard block");
            else if(response.block=="soft") $(document.getElementById("isInList")).text(" Locked");
            else if(response.block=="none") $(document.getElementById("isInList")).text(" none");
        });
    });
}

function loadMainMessage() {
    chrome.runtime.sendMessage({"getCurrentMainMessage":"true"}, function(response) {
        if(response && response.mainMessage!=undefined) {
            document.getElementById("mainMessageInput").value = response.mainMessage;
        }
    });
}

function loadMainPageTimer(){
    // load last used timer
    loadLastUsedTimer(function(time){
        time = parseInt(time);
        if(time>999) time=999;
        if(time) {
            document.getElementById("waitTime").value = time;
            lastTimerInput = time;
        }
        else{
            document.getElementById("waitTime").value = 10;
            lastTimerInput = 10;
        }
    });
    // set timer status showing
    chrome.runtime.sendMessage({getTimerTime:"none"},function(res){
        // run only on initial
        if(res.time>0) {
            $('#timerSet').css("display","block");
        }
        else{
            $('#timerNotYetSet').css("display","block");
        }
        setPopupTimer(res.time);
    });

}

function setPopupTimer(timeInSec){

    timer = timeInSec;
    if(!timer || timer<=0) {
        document.getElementById("timeDisplay").textContent = "00:00:00";
        return;
    }
    var sec = (timer%60).toString();
    var min = (Math.floor(timer/60)%60).toString();
    var hr = (Math.floor(timer/3600)).toString();
    if(sec<10){
        sec = "0"+sec;
    }
    if(min<10){
        min = "0"+min;
    }
    if(hr<10){
        hr = "0"+hr;
    }
    document.getElementById("timeDisplay").textContent = hr + ":" + min + ":" + sec;
    timerInst = setInterval(function(){
        //console.log("time = " + timer + ", min = " + timer/60 + " sec = " + timer%60);
        if(timer<=0){
            timer = 0;
            clearInterval(timerInst);
            $("#timerSet").fadeOut("slow",function(){
                $("#timerNotYetSet").fadeIn("slow");
            });
            return;
        }

        timer --;
        sec = (timer%60).toString();
        min = (Math.floor(timer/60)%60).toString();
        hr = (Math.floor(timer/3600)).toString();
        if(sec<10){
        sec = "0"+sec;
        }
        if(min<10){
            min = "0"+min;
        }
        if(hr<10){
            hr = "0"+hr;
        }
        document.getElementById("timeDisplay").textContent = hr + ":" + min + ":" + sec;
    },1000);

}

var lastTimerInput;

function createRemoveList(){
    document.getElementById("removeFromWhite").addEventListener("click", function(){
        moveRightTo("#addToListType","#removeWhite");
        // var ul = $('#removeWhiteListSingle');
        // var i;
        //
        // if(singleWhite.length>0){
        //     // temporary eliminate "www" and sort
        //     var temp = singleWhite.slice(0);
        //     for(i=0;i<temp.length;i++){
        //         // if(temp[i].substring(0,3)=="www"){
        //         //     temp[i] = temp[i].substring(4);
        //         // }
        //         //temp[i] = purifyUrl(temp[i]);
        //     }
        //     temp = sortList(temp);
        //     // create UI
        //     for(i=0; i<temp.length;i++){
        //         if(temp[i]!="") ul.append([
        //                 '<li class="removeCheckWrapper" style="width: 100%;overflow: auto;">',
        //                     '<button><p>X</p></button>',
        //                     '<div>'+temp[i]+'</div>',
        //                 '</li>'
        //             ].join("\n")
        //         );
        //     }
        //     // create button function
        //     var child = ul.children();
        //     if(child && child.length>0) {
        //         for (i = 0; i < child.length; i++) {
        //             $($(child[i]).children("button")).click(function(){
        //                 var tar = $(this).siblings()[0].textContent;
        //                 // send delete message
        //                 chrome.runtime.sendMessage({deleteRule:"singleWhite::"+tar});
        //                 // remove from local
        //                 var index = singleWhite.indexOf(tar);
        //                 singleWhite.splice(index,1);
        //
        //                 // disappear
        //                 $($(this).parent()).fadeOut('fast');
        //             });
        //         }
        //     }
        //     // high light current tab
        //     getCurrentTabUrl(function(url){
        //         // url = cutOffHeadAndTail(url);
        //         // if(url.substring(0,3)=="www"){
        //         //     url = url.substring(4);
        //         // }
        //         url = purifyUrl(url);
        //         var child = $('#removeWhiteListSingle').children();
        //         if(child && child.length>0) {
        //             for (i = 0; i < child.length; i++) {
        //                 var sib = $($(child[i]).children("button")).siblings()[0];
        //                 var t = sib.textContent;
        //                 if(sib.textContent==url){
        //                     $(child[i]).css("background-color","yellow");
        //                 }
        //             }
        //         }
        //     });
        // }
        // else{
        //     ul.append([
        //             '<li class="removeCheckWrapper" style="width: 100%;overflow: auto;">',
        //             '<div style="text-align: center;width: 100%;">(empty)</div>',
        //             '</li>'
        //         ].join("\n")
        //     );
        // }

        var ul = $('#removeWhiteListDomain');
        if(whiteList.length>0){
            // temporary eliminate "www" and sort
            temp = whiteList.slice(0);
            for(i=0;i<temp.length;i++){
                // if(temp[i].substring(0,3)=="www"){
                //     temp[i] = temp[i].substring(4);
                // }
                //temp[i] = purifyUrl(temp[i]);
            }
            temp = sortList(temp);
            //create UI
            for(i=0; i<temp.length;i++){
                if(temp[i]!="") ul.append([
                        '<li class="removeCheckWrapper" style="width: 100%;overflow: auto;">',
                            '<button><p>X</p></button>',
                            '<div>'+temp[i]+'</div>',
                        '</li>'
                    ].join("\n")
                );
            }
            // create button function
            child = ul.children();
            if(child && child.length>0) {
                for (i = 0; i < child.length; i++) {
                    $($(child[i]).children("button")).click(function(){
                        var tar = $(this).siblings()[0].textContent;
                        // send delete message
                        chrome.runtime.sendMessage({deleteRule:"whiteList::"+tar});
                        // remove from local
                        var index = whiteList.indexOf(tar);
                        whiteList.splice(index,1);

                        // disappear
                        $($(this).parent()).fadeOut('fast');
                    });
                }
            }
            // high light current tab
            getCurrentTabUrl(function(url){
                url = purifyUrl(url);
                var child = $('#removeWhiteListDomain').children();
                if (child && child.length > 0) {
                    while (url != "") {
                        for (i = 0; i < child.length; i++) {
                            var sib = $($(child[i]).children("button")).siblings()[0];
                            if (sib.textContent == url) {
                                $(child[i]).css("background-color", "yellow");
                            }
                        }
                        url = clearLast(url)
                    }
                }
            });
        }
        else{
            ul.append([
                    '<li class="removeCheckWrapper" style="width: 100%;overflow: auto;">',
                    '<div style="text-align: center;width: 100%;">(empty)</div>',
                    '</li>'
                ].join("\n")
            );
        }
    });

    document.getElementById("removeFromSoft").addEventListener("click", function(){
        moveRightTo("#addToListType","#removeSoft");
        // var ul = $('#removeSoftListSingle');
        // var i;
        //
        // if(singleSoftLock.length>0){
        //     // temporary eliminate "www" and sort
        //     var temp = singleSoftLock.slice(0);
        //     for(i=0;i<temp.length;i++){
        //         // if(temp[i].substring(0,3)=="www"){
        //         //     temp[i] = temp[i].substring(4);
        //         // }
        //         //temp[i] = purifyUrl(temp[i]);
        //     }
        //     temp = sortList(temp);
        //     // create UI
        //     for(i=0; i<temp.length;i++){
        //         if(temp[i]!="") ul.append([
        //                 '<li class="removeCheckWrapper" style="width: 100%;overflow: auto;">',
        //                     '<button><p>X</p></button>',
        //                     '<div>'+temp[i]+'</div>',
        //                 '</li>'
        //             ].join("\n")
        //         );
        //     }
        //     // create button function
        //     var child = ul.children();
        //     if(child && child.length>0) {
        //         for (i = 0; i < child.length; i++) {
        //             $($(child[i]).children("button")).click(function(){
        //                 var tar = $(this).siblings()[0].textContent;
        //                 // send delete message
        //                 chrome.runtime.sendMessage({deleteRule:"singleSoftLock::"+tar});
        //                 // remove from local
        //                 var index = singleSoftLock.indexOf(tar);
        //                 singleSoftLock.splice(index,1);
        //
        //                 // disappear
        //                 $($(this).parent()).fadeOut('fast');
        //             });
        //         }
        //     }
        //     // high light current tab
        //     getCurrentTabUrl(function(url){
        //         // url = cutOffHeadAndTail(url);
        //         // if(url.substring(0,3)=="www"){
        //         //     url = url.substring(4);
        //         // }
        //         url = purifyUrl(url);
        //         var child = $('#removeSoftListSingle').children();
        //         if(child && child.length>0) {
        //             for (i = 0; i < child.length; i++) {
        //                 var sib = $($(child[i]).children("button")).siblings()[0];
        //                 if(sib.textContent==url){
        //                     $(child[i]).css("background-color","yellow");
        //                 }
        //             }
        //         }
        //     });
        // }
        // else{
        //     ul.append([
        //             '<li class="removeCheckWrapper" style="width: 100%;overflow: auto;">',
        //             '<div style="text-align: center;width: 100%;">(empty)</div>',
        //             '</li>'
        //         ].join("\n")
        //     );
        // }

        var ul = $('#removeSoftListDomain');
        var i, temp;
        if(softLockList.length>0) {
            // temporary eliminate "www" and sort
            temp = softLockList.slice(0);
            for (i = 0; i < temp.length; i++) {
                // if (temp[i].substring(0, 3) == "www") {
                //     temp[i] = temp[i].substring(4);
                // }
                //temp[i] = purifyUrl(temp[i]);
            }
            temp = sortList(temp);
            //create UI
            for (i = 0; i < temp.length; i++) {
                if (temp[i] != "") ul.append([
                        '<li class="removeCheckWrapper" style="width: 100%;overflow: auto;">',
                        '<button><p>X</p></button>',
                        '<div>' + temp[i] + '</div>',
                        '</li>'
                    ].join("\n")
                );
            }
            // create button function
            child = ul.children();
            if (child && child.length > 0) {
                for (i = 0; i < child.length; i++) {
                    $($(child[i]).children("button")).click(function () {
                        var tar = $(this).siblings()[0].textContent;
                        // send delete message
                        chrome.runtime.sendMessage({deleteRule: "softLockList::" + tar});
                        // remove from local
                        var index = softLockList.indexOf(tar);
                        softLockList.splice(index, 1);

                        // disappear
                        $($(this).parent()).fadeOut('fast');
                    });
                }
            }
            // high light current tab
            getCurrentTabUrl(function (url) {
                // url = cutOffHeadAndTail(url);
                // if (url.substring(0, 3) == "www") {
                //     url = url.substring(4);
                // }
                url = purifyUrl(url);
                var child = $('#removeSoftListDomain').children();
                if (child && child.length > 0) {
                    while (url != "") {
                        for (i = 0; i < child.length; i++) {
                            var sib = $($(child[i]).children("button")).siblings()[0];
                            if (sib.textContent == url) {
                                $(child[i]).css("background-color", "yellow");
                            }
                        }
                        url = clearLast(url)
                    }
                }
            });
        }
        else{
            ul.append([
                    '<li class="removeCheckWrapper" style="width: 100%;overflow: auto;">',
                    '<div style="text-align: center;width: 100%;">(empty)</div>',
                    '</li>'
                ].join("\n")
            );
        }
    });
    
    // document.getElementById("removeFromHard").addEventListener("click", function(){
    //     moveRightTo("#addToListType","#removeHard");
    //     var ul = $('#removeHardListSingle');
    //     var i;
    //
    //     // temporary eliminate "www" and sort
    //     var temp = singleHardLock.slice(0);
    //     for(i=0;i<temp.length;i++){
    //         if(temp[i].substring(0,3)=="www"){
    //             temp[i] = temp[i].substring(4);
    //         }
    //     }
    //     sortList(temp);
    //     // create UI
    //     for(i=0; i<temp.length;i++){
    //         if(temp[i]!="") ul.append([
    //                 '<li class="removeCheckWrapper" style="width: 100%;overflow: auto;">',
    //                     '<button><p>X</p></button>',
    //                     '<div>'+temp[i]+'</div>',
    //                 '</li>'
    //             ].join("\n")
    //         );
    //     }
    //     // create button function
    //     var child = ul.children();
    //     if(child && child.length>0) {
    //         for (i = 0; i < child.length; i++) {
    //             $($(child[i]).children("button")).click(function(){
    //                 var tar = $(this).siblings()[0].textContent;
    //                 // send delete message
    //                 chrome.runtime.sendMessage({deleteRule:"singleHardLock::"+tar});
    //                 // remove from local
    //                 var index = singleHardLock.indexOf(tar);
    //                 singleHardLock.splice(index,1);
    //
    //                 // disappear
    //                 $($(this).parent()).fadeOut('fast');
    //             });
    //         }
    //     }
    //     // high light current tab
    //     getCurrentTabUrl(function(url){
    //         url = cutOffHeadAndTail(url);
    //         if(url.substring(0,3)=="www"){
    //             url = url.substring(4);
    //         }
    //         var child = $('#removeHardListSingle').children();
    //         if(child && child.length>0) {
    //             for (i = 0; i < child.length; i++) {
    //                 var sib = $($(child[i]).children("button")).siblings()[0];
    //                 if(sib.textContent==url){
    //                     $(child[i]).css("background-color","yellow");
    //                 }
    //             }
    //         }
    //     });
    //
    //     ul = $('#removeHardListDomain');
    //     // temporary eliminate "www" and sort
    //     temp = hardLockList.slice(0);
    //     for(i=0;i<temp.length;i++){
    //         if(temp[i].substring(0,3)=="www"){
    //             temp[i] = temp[i].substring(4);
    //         }
    //     }
    //     sortList(temp);
    //     //create UI
    //     for(i=0; i<temp.length;i++){
    //         if(temp[i]!="") ul.append([
    //                 '<li class="removeCheckWrapper" style="width: 100%;overflow: auto;">',
    //                     '<button><p>X</p></button>',
    //                     '<div>'+temp[i]+'</div>',
    //                 '</li>'
    //             ].join("\n")
    //         );
    //     }
    //     // create button function
    //     child = ul.children();
    //     if(child && child.length>0) {
    //         for (i = 0; i < child.length; i++) {
    //             $($(child[i]).children("button")).click(function(){
    //                 var tar = $(this).siblings()[0].textContent;
    //                 // send delete message
    //                 chrome.runtime.sendMessage({deleteRule:"hardLockList::"+tar});
    //                 // remove from local
    //                 var index = hardLockList.indexOf(tar);
    //                 hardLockList.splice(index,1);
    //
    //                 // disappear
    //                 $($(this).parent()).fadeOut('fast');
    //             });
    //         }
    //     }
    //     // high light current tab
    //     getCurrentTabUrl(function(url){
    //         url = cutOffHeadAndTail(url);
    //         if(url.substring(0,3)=="www"){
    //             url = url.substring(4);
    //         }
    //         var child = $('#removeHardListDomain').children();
    //         if(child && child.length>0) {
    //             for (i = 0; i < child.length; i++) {
    //                 var sib = $($(child[i]).children("button")).siblings()[0];
    //                 if(sib.textContent==url){
    //                     $(child[i]).css("background-color","yellow");
    //                 }
    //             }
    //         }
    //     });
    // });
}

var mainMessage="Better stop now!";

function submitMainMessage(newMessage){
    //var newMessage = document.getElementById("mainMessageInput").value;
    if(newMessage==undefined) return;
    loadBlocker(function(){
        if(newMessage!=mainMessage) {
            chrome.runtime.sendMessage({modifyMainMessage: newMessage}, function (response) {
                console.log("modifyMainMessage as : " + newMessage);
            });
            getCurrentTab(function(tab){
                chrome.tabs.sendMessage(tab.id,{modifyMainMessage: newMessage});
            });
        }
    });
}


var nextLayer = 1;

function moveRightTo(cur, tar,callback) {
    tar = $(tar);
    cur = $(cur);
    // slide in
    tar.css("z-index",nextLayer.toString());
    nextLayer++;
    tar.css("left","100%");
    tar.css("display","block");
    // tar.css("height","90%");
    // tar.css("width","90%");
    // cur.css("position", "absolute");
    // tar.css("position","relative");
    tar.animate({left: '0'},function () {
        //cur.css("display", "none");
        if(callback!=undefined) callback();
    });
}

function moveLeftTo(cur, tar, callback) {

    tar = $(tar);
    cur = $(cur);
    // slide in
    nextLayer--;
    // cur.css("position", "absolute");
    // tar.css("position","relative");
    cur.animate({left: '100%'},function () {
        cur.css("display", "none");
        if(callback!=undefined) callback();
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

        // var url = cutOffHeadAndTail(rawUrl);
        var url = purifyUrl(rawUrl);

        // check if already exist
        for(var i=0; i<singleSoftLock.length;i++){
            if(singleSoftLock[i]==url) return;
        }
        // for(var i=0; i<singleHardLock.length;i++){
        //     if(singleHardLock[i]==url) return;
        // }
        for(var i=0; i<singleWhite.length;i++){
            if(singleWhite[i]==url) return;
        }

        singleSoftLock.push(url);
        $(document.getElementById("isInList")).text(" Locked");

        saveFile(function(){
            getCurrentTab(function(tab){
                chrome.tabs.sendMessage(tab.id,{blockListChange:"soft"});
            });
        });


    });
}

function addBaseDomainToSoftLockList(){
    getCurrentTabUrl(function(rawUrl){

        // var url = cutOffHeadAndTail(rawUrl);
        var url = purifyUrl(rawUrl);

        var temp;
        while( (temp = clearLast(url))!=""){
            url = temp;
        }

        // check if already exist
        for(var i=0; i<softLockList.length;i++){
            if(softLockList[i]==url) return "locked";
        }
        // for(var i=0; i<hardLockList.length;i++){
        //     if(hardLockList[i]==url) return;
        // }
        for(var i=0; i<whiteList.length;i++){
            if(whiteList[i]==url) return "white";
        }

        softLockList.push(url);
        $(document.getElementById("isInList")).text(" Locked");

        saveFile(function(){
            getCurrentTab(function(tab){
                chrome.tabs.sendMessage(tab.id,{blockListChange:"soft"});
            });
        });


    });
}

function addSubDomainToSoftLockList(url){

    //var url = cutOffHeadAndTail(rawUrl);
    //var url = purifyUrl(rawUrl);

    // check if already exist
    for(var i=0; i<softLockList.length;i++){
        if(softLockList[i]==url) return "locked";
    }
    // for(var i=0; i<hardLockList.length;i++){
    //     if(hardLockList[i]==url) return;
    // }
    for(var i=0; i<whiteList.length;i++){
        if(whiteList[i]==url) return "white";
    }

    softLockList.push(url);
    $(document.getElementById("isInList")).text(" Locked");

    saveFile(function(){
        getCurrentTab(function(tab){
            chrome.tabs.sendMessage(tab.id,{blockListChange:"soft"});
        });
    });

}

// function addSinglePageToHardLockList(){
//     getCurrentTabUrl(function(rawUrl){
//
//         var url = cutOffHeadAndTail(rawUrl);
//
//         // check if already exist
//         for(var i=0; i<singleSoftLock.length;i++){
//             if(singleSoftLock[i]==url) return;
//         }
//         for(var i=0; i<singleHardLock.length;i++){
//             if(singleHardLock[i]==url) return;
//         }
//         for(var i=0; i<singleWhite.length;i++){
//             if(singleWhite[i]==url) return;
//         }
//
//         singleHardLock.push(url);
//
//         saveFile(function(){
//             getCurrentTab(function(tab){
//                 chrome.tabs.sendMessage(tab.id,{blockListChange:"hard"});
//             });
//         });
//
//
//     });
// }
//
// function addBaseDomainToHardLockList(){
//     getCurrentTabUrl(function(rawUrl){
//
//         var url = cutOffHeadAndTail(rawUrl);
//
//         var temp;
//         while( (temp = clearLast(url))!=""){
//             url = temp;
//         }
//
//         // check if already exist
//         for(var i=0; i<softLockList.length;i++){
//             if(softLockList[i]==url) return;
//         }
//         for(var i=0; i<hardLockList.length;i++){
//             if(hardLockList[i]==url) return;
//         }
//         for(var i=0; i<whiteList.length;i++){
//             if(whiteList[i]==url) return;
//         }
//
//         hardLockList.push(url);
//
//         saveFile(function(){
//             getCurrentTab(function(tab){
//                 chrome.tabs.sendMessage(tab.id,{blockListChange:"hard"});
//             });
//         });
//
//
//     });
// }
//
// function addSubDomainToHardLockList(rawUrl){
//
//     var url = cutOffHeadAndTail(rawUrl);
//
//     // check if already exist
//     for(var i=0; i<softLockList.length;i++){
//         if(softLockList[i]==url) return;
//     }
//     for(var i=0; i<hardLockList.length;i++){
//         if(hardLockList[i]==url) return;
//     }
//     for(var i=0; i<whiteList.length;i++){
//         if(whiteList[i]==url) return;
//     }
//
//     hardLockList.push(url);
//
//     saveFile(function(){
//         getCurrentTab(function(tab){
//             chrome.tabs.sendMessage(tab.id,{blockListChange:"hard"});
//         });
//     });
//
// }

// function addSinglePageToWhiteList(){
//     getCurrentTabUrl(function(rawUrl){
//
//         //var url = cutOffHeadAndTail(rawUrl);
//         var url = purifyUrl(rawUrl);
//
//         // check if already exist
//         for(var i=0; i<singleSoftLock.length;i++){
//             if(singleSoftLock[i]==url) return;
//         }
//         // for(var i=0; i<singleHardLock.length;i++){
//         //     if(singleHardLock[i]==url) return;
//         // }
//         for(var i=0; i<singleWhite.length;i++){
//             if(singleWhite[i]==url) return;
//         }
//
//         singleWhite.push(url);
//         $(document.getElementById("isInList")).text(" white list");
//
//         saveFile(function(){
//             getCurrentTab(function(tab){
//                 chrome.tabs.sendMessage(tab.id,{blockListChange:"false"});
//             });
//         });
//
//
//     });
// }

function addSinglePageToWhiteList(){
    getCurrentTabUrl(function(rawUrl){

        //var url = cutOffHeadAndTail(rawUrl);
        var url = purifyUrl(rawUrl);

        // check if already exist
        for(var i=0; i<softLockList.length;i++){
            if(softLockList[i]==url) return "locked";
        }
        for(var i=0; i<whiteList.length;i++){
            if(whiteList[i]==url) return "white";
        }

        whiteList.push(url);
        $(document.getElementById("isInList")).text(" white list");

        saveFile(function(){
            getCurrentTab(function(tab){
                chrome.tabs.sendMessage(tab.id,{blockListChange:"false"});
            });
        });


    });
}

// function addBaseDomainToWhiteList(){
//     getCurrentTabUrl(function(rawUrl){
//
//         //var url = cutOffHeadAndTail(rawUrl);
//         var url = purifyUrl(rawUrl);
//
//         var temp;
//         while( (temp = clearLast(url))!=""){
//             url = temp;
//         }
//
//         // check if already exist
//         for(var i=0; i<softLockList.length;i++){
//             if(softLockList[i]==url) return;
//         }
//         // for(var i=0; i<hardLockList.length;i++){
//         //     if(hardLockList[i]==url) return;
//         // }
//         for(var i=0; i<whiteList.length;i++){
//             if(whiteList[i]==url) return;
//         }
//
//         whiteList.push(url);
//         $(document.getElementById("isInList")).text(" white list");
//
//         saveFile(function(){
//             getCurrentTab(function(tab){
//                 chrome.tabs.sendMessage(tab.id,{blockListChange:"false"});
//             });
//         });
//
//
//     });
// }

function addSubDomainToWhiteList(url){

    //var url = cutOffHeadAndTail(rawUrl);
    //var url = purifyUrl(rawUrl);

    // check if already exist
    for(var i=0; i<whiteList.length;i++){
        if(whiteList[i]==url) return "white";
    }
    for(var i=0; i<softLockList.length;i++){
        if(softLockList[i]==url) return "locked";
    }
    // for(var i=0; i<hardLockList.length;i++){
    //     if(hardLockList[i]==url) return;
    // }

    whiteList.push(url);
    $(document.getElementById("isInList")).text(" white list");
    
    saveFile(function(){
        getCurrentTab(function(tab){
            chrome.tabs.sendMessage(tab.id,{blockListChange:"false"});
        });
    });
}

function clearLocalData() {
    isAppClosed = false;
    timer = 0;
    clearInterval(timerInst);

    singleSoftLock = [];
    singleWhite = [];
    softLockList = [];
    whiteList = [];

    // softTimeRecord = {};
    // whiteTimeRecord = {};
    timeRecord = {};
    totalTimeRecord=0;

    // todayWhiteTimeRecord = {};
    // todaySoftTimeRecord = {};
    todayTimeRecord = {};
    todayWhiteTotalTimeRecord=0;
    todaySoftTotalTimeRecord=0;
    todayTotalTimeRecord=0;

    purifiedSoftLock=[];
    purifiedWhite=[];
}

function resetMainPageStyles() {
    $('body').css("background-color","lightseagreen");
    document.getElementById("switchBtn").checked = false;
    $('#waitTime').val("10");
    $('#startTimer').fadeIn('fast');
    $('.subPage').css("background-color","lightseagreen");
    $("#isInList").text(" none");
    $('#mainMessageInput').val("You shall not pass!");
}