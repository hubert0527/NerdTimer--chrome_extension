
$( function() {
    // $( document ).tooltip();
    $('.hover-tooltip').tooltip({position: {
        my: "center",
        at: "bottom+15",
        track: false,
        using:
            function(position, feedback) {
                $(this).css(position);
            }
        }
    });
    $('.focus-tooltip').tooltip({position: {
        my: "center",
        at: "bottom+15",
        track: false,
        using:
            function(position, feedback) {
                $(this).css(position);
            }
        }
    });
    $('.focus-tooltip').tooltip().off("mouseover mouseout");
} );

var ignore = [
    "www",
    "m",
    "cn"
];

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

var fakeLoadTimerInst;

var waitNMinutesButton=5;

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
    loadSettings(function () {
        loadSettingMenu();
    });
    createAboutPage();

    bindChart();

    // console.log("softBlocks: " + softLockList.toString());
    // console.log("whites: " + whiteList.toString());

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
            // chrome.runtime.sendMessage({blockListChange:"none"});
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

var lastWaitNMinutesInput=5;

function loadSettingMenu() {

    $('#waitNMinutesButtonSetting').val(waitNMinutesButton);
    lastWaitNMinutesInput = waitNMinutesButton.toString();

    // timer setting only allow number
    $(document.getElementById("waitNMinutesButtonSetting")).keydown(function (e) {
        // press ENTER
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
        // enable chinese to notify user use wrong input type
        else if(e.which==229){

        }
        // Ensure that it is a number and stop the keypress
        else if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
            e.preventDefault();
        }
    });
    // timer can't have too-high number, MAX=999
    $(document.getElementById("waitNMinutesButtonSetting")).bind("input",function(e){
        var str = $(this).val();
        var val = parseInt(str);
        var lastChar = str.slice(-1);

        if(!val){
            if(lastChar!='' && (lastChar<'ㄅ'||lastChar>'ㄦ')) $(this).val('');
            return;
        }
        else if( (lastChar>'9'||lastChar<'0') && (lastChar<'ㄅ'||lastChar>'ㄦ') ){
            $(this).val(lastWaitNMinutesInput);
            return;
        }
        else if(val>999){
            //$(this).val( str.substring(0,str.length-1) );
            $(this).val(lastWaitNMinutesInput);
            return;
        }

        if(val && val>0) {
            waitNMinutesButton = val;
            saveSettings(function () {
                chrome.runtime.sendMessage({waitNMinutesButtonChange: val});
            });
        }

        lastWaitNMinutesInput = str;
    });

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
                        },4000);
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

    $('#closeDataField').click(function () {
        $('#dataField').fadeOut('fast');
    });

    $('#exportData').click(function () {
        exportData(function (data) {

            $('#dataFieldWarning').css('display', 'none');
            $('#dataFieldAction').off('click')
                .text('複製')
                .click(function () {
                    $('#dataFieldInput').select();
                    document.execCommand("copy");
                });
            $('#dataField').fadeIn();

            $('#dataFieldInput').val(data).select();

        });
    });

    $('#importData').click(function () {

        $('#dataFieldInput').val('');
        $('#dataFieldWarning').css('display','block');
        $('#dataFieldAction').off('click')
            .text('匯入')
            .click(function () {
                var str = $('#dataFieldInput').val();
                var obj;
                // check if is JSON
                try {
                    obj = JSON.parse(str);
                } catch (e) {
                    typeIncorrectWarning();
                    return;
                }

                if(!obj){
                    typeIncorrectWarning();
                    return;
                }

                // prevent from type for fun
                var k = Object.keys(obj);
                if(!k || k.length<2){
                    typeIncorrectWarning();
                    return;
                }

                importData(obj,function () {
                    $('#temporarySuccess').hide().fadeIn(function () {
                        var i = setInterval(function () {
                            clearInterval(i);
                            $('#dataField').fadeOut('slow',function () {
                                $('#temporarySuccess').css('display','none');
                            });
                        },300);
                    });
                });
            });
        $('#dataField').fadeIn('fast');
    });

    $('#customizeBlockerButton').click(function () {
        var code = $('#customizeBlockerInput').val();

        var doc = document.createElement('div');
        doc.innerHTML = code;

        var root = $(doc);
        // if(root.find('#nerdTimerBlockerWrapper').length){
            saveBlockerLayout(code,function () {
                chrome.runtime.sendMessage({changeBlockerLayout:code});
            });
        // }
        // // at least need a wrapper
        // else{
        //     $('#customizeBlockerWarning').hide()
        //         .text('未達基本需求')
        //         .fadeIn('fast',function () {
        //             var inter = setInterval(function () {
        //                 clearInterval(inter);
        //                 $('#customizeBlockerWarning').fadeOut('fast');
        //             },1500);
        //         });
        // }
    });

    $('#customizeBlockerTutorial').click(function () {
        // var path = chrome.extension.getURL("tutorial.html");
        // chrome.tabs.create({ url: path });
        chrome.tabs.create({ url: 'https://hubert0527.github.io/myProjects/nerdTimer/customizedBlockerTutorial/tutorial.html' });
    });
}

function typeIncorrectWarning() {

    $('#temporaryWarning')
        .hide()
        .fadeIn('fast',function () {
            var i = setInterval(function () {
                clearInterval(i);
                $('#temporaryWarning').fadeOut();
            },1500);
        });
}

function createAboutPage() {
    $('#showAbout').click(function () {
        var about = $('#about');
        if(!about.is(':visible')) about.hide().fadeIn('fast');
    });
    $('#closeAbout').click(function () {
        $('#about').fadeOut('fast');
    });

    var manifest = chrome.runtime.getManifest();
    $('#version').text('版本: '+manifest.version);
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

        var t;
        for(i=0;i<possibleList.length;i++){
            t = removeWWW(possibleList[i]);
            domainMapping[t] = possibleList[i];
            possibleList[i] = t;
        }

        var recommand = $("#possibleListRecommended");
        if(type=="white"){
            recommand.append("<li class='possibleListItem'>"+ possibleList.slice(0,1) +"</li>");
        }
        else if(type=="locked"){
            recommand.append("<li class='possibleListItem'>"+ possibleList.slice(-1) +"</li>");
        }

        $(recommand.children()).click(function () {
            var res ;
            var text = $(this).text();
            if(domainMapping[text]) text = domainMapping[text];
            if(type=="white") res = addSubDomainToWhiteList(text);
            else if(type=="locked") res = addSubDomainToSoftLockList(text);
            else return;
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
            else if(res=="locked"){
                tar.text("目標已屬於 鎖定");
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
                $($("#possibleListRecommended").children()).remove();
            });
        });

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
                    var text = $(this).text();
                    if(domainMapping[text]) text = domainMapping[text];
                    var res = addSubDomainToWhiteList(text);
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
                    else if(res=="locked"){
                        tar.text("目標已屬於 鎖定");
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
                        $($("#possibleListRecommended").children()).remove();
                    });
                });
            }
            else if(type=="locked"){
                targetChild.click(function () {
                    var text = $(this).text();
                    if(domainMapping[text]) text = domainMapping[text];
                    var res = addSubDomainToSoftLockList(text);
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
                    else if(res=="locked"){
                        tar.text("目標已屬於 鎖定");
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
                        $($("#possibleListRecommended").children()).remove();
                    });
                });
            }
        }
    });
}

function loadButtons() {
    // document.getElementById("addSinglePageToSoftLockList").addEventListener("click", addSinglePageToSoftLockList);
    document.getElementById("addDomainToSoftLockListMore").addEventListener("click", function () {
        listPossibleAddDomain("locked");
        moveRightTo("#addToListType","#possibleDomain");
    });
    document.getElementById("fastAdd").addEventListener("click", function(){
        getCurrentTabUrl(function (url) {
            addBaseDomainToSoftLockList(url);
        });
    });
    document.getElementById("addDomainToSoftLockList").addEventListener("click", function(){
        getCurrentTabUrl(function (url) {
            var res = addBaseDomainToSoftLockList(url);
            var tar = $('#addToListError');
            if (res == "white") {
                tar.text("目標已屬於 白名單");
                tar.fadeIn('fast', function () {
                    var t = setInterval(function () {
                        clearInterval(t);
                        tar.fadeOut('fast');
                    }, 3000);
                });
            }
            else if (res == "locked") {
                tar.text("目標已屬於 鎖定");
                tar.fadeIn('slow', function () {
                    var t = setInterval(function () {
                        clearInterval(t);
                        tar.fadeOut('slow');
                    }, 1000);
                });
            }
        });
    });
    // document.getElementById("addSinglePageToHardLockList").addEventListener("click", addSinglePageToHardLockList);
    // document.getElementById("addBaseDomainToHardLockList").addEventListener("click", addBaseDomainToHardLockList);
    // document.getElementById("addSinglePageToWhiteList").addEventListener("click", addSinglePageToWhiteList);
    document.getElementById("fastWhite").addEventListener("click", function(){
        getCurrentTabUrl(function (url) {
            addSinglePageToWhiteList(url);
        });
    });
    document.getElementById("addDomainToWhiteList").addEventListener("click", function(){
        getCurrentTabUrl(function (url) {
            var res = addSinglePageToWhiteList(url);
            var tar = $('#addToListError');
            if (res == "white") {
                tar.text("目標已屬於 白名單");
                tar.fadeIn('fast', function () {
                    var t = setInterval(function () {
                        clearInterval(t);
                        tar.fadeOut('fast');
                    }, 3000);
                });
            }
            else if (res == "locked") {
                tar.text("目標已屬於 鎖定");
                tar.fadeIn('slow', function () {
                    var t = setInterval(function () {
                        clearInterval(t);
                        tar.fadeOut('slow');
                    }, 1000);
                });
            }
        });
    });
    document.getElementById("addDomainToWhiteListMore").addEventListener("click", function () {
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
        // console.log("receive event : "+v.toString());
        if(v==MouseEvent) return;
        submitMainMessage(v.toString());
    });
    document.getElementById("mainMessageInput").onkeydown = function(key){
        if(key.which==13 && $('#mainMessageInput').val()==""){
            submitMainMessage('');
        }
    };

    // create sliding button                                                                  // current        target
    document.getElementById("goToAddToListType").addEventListener("click", function(){moveRightTo("#mainPage","#addToListType");});
    document.getElementById("moreSettings").addEventListener("click", function(){moveRightTo("#mainPage","#settingPage");});
    document.getElementById("goToStatistics").addEventListener("click", function(){

        prepareChart(function(){
            moveRightTo("#addToListType","#statistics");
        });

    });

    // create go to remove list buttons
    createRemoveList();

    document.getElementById("goToMainPage1").addEventListener("click", function(){
        loadFile(function () {
            // refresh status
            getCurrentTabUrl(function (url) {
                // check in list
                getWebsiteBlockStatus(url);
            });

            // refresh timer time check if click 5min btn
            chrome.runtime.sendMessage({getTimerTime:"none"},function(res){
                if(timer<=0 && parseInt(res.time)>0){
                    setPopupTimer(res.time);
                }
            });

            if($('#addToListError').is(':visible')) $('#addToListError').css('display','none');

            moveLeftTo("#addToListType","#mainPage");
        });
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
            $($("#possibleListRecommended").children()).remove();
        });
    });

    document.getElementById("goToMainPage11").addEventListener("click", function(){
        loadFile(function () {
            // refresh status
            getCurrentTabUrl(function (url) {
                // check in list
                getWebsiteBlockStatus(url);
            });

            // refresh timer time check if click 5min btn
            chrome.runtime.sendMessage({getTimerTime:"none"},function(res){
                if(timer<=0 && parseInt(res.time)>0){
                    setPopupTimer(res.time);
                }
            });

            moveLeftTo("#settingPage","#mainPage");
            $('#dataField').fadeOut('fast');
        });
    });

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
        // enable chinese to notify user use wrong input type
        else if(e.which==229){

        }
        // Ensure that it is a number and stop the keypress
        else if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
            e.preventDefault();
        }
    });
    // timer can't have too-high number, MAX=999
    $(document.getElementById("waitTime")).bind("input",function(e){
        var str = $(this).val();
        var val = parseInt(str);
        var lastChar = str.slice(-1);

        if(!val){
            if(lastChar!='' && (lastChar<'ㄅ'||lastChar>'ㄦ')) $(this).val('');
            $("#startTimer").fadeOut('fast');
            return;
        }
        else if( (lastChar>'9'||lastChar<'0') && (lastChar<'ㄅ'||lastChar>'ㄦ') ){
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
        else if(isAppClosed){
            lastTimerInput = str;
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
    // document.getElementById("waitTime").addEventListener("focus",function(){
    //     $('#timerInputPop').fadeIn('slow');
    // });
    // document.getElementById("waitTime").addEventListener("focusout",function(){
    //     $('#timerInputPop').fadeOut('fast');
    // });
    // document.getElementById("prompt1").addEventListener("mouseover",function(){
    //     $('#prompt1Pop').fadeIn('fast');
    // });
    // document.getElementById("prompt1").addEventListener("mouseleave",function(){
    //     $('#prompt1Pop').fadeOut('fast');
    // });
    // document.getElementById("statisticsPastNDaysInput").addEventListener("focus",function(){
    //     $('#dayInputPop').fadeIn('slow');
    // });
    // document.getElementById("statisticsPastNDaysInput").addEventListener("focusout",function(){
    //     $('#dayInputPop').fadeOut('fast');
    // });
    // document.getElementById("statisticsNWebsiteInput").addEventListener("focus",function(){
    //     $('#websiteCountInputPop').fadeIn('slow');
    // });
    // document.getElementById("statisticsNWebsiteInput").addEventListener("focusout",function(){
    //     $('#websiteCountInputPop').fadeOut('fast');
    // });
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
        var res = removeWWW(pure.split("/")[0]);
        $(document.getElementById("currentDomain")).text(res);

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
        getWebsiteBlockStatus(url);
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
var removeListHoverLock=false;

function createRemoveList(){
    var i,temp,child,t;
    document.getElementById("removeFromWhite").addEventListener("click", function(){
        moveRightTo("#addToListType","#removeWhite");

        var ul = $('#removeWhiteListDomain');
        if(whiteList.length>0){
            // temporary eliminate "www" and sort
            temp = whiteList.slice(0);
            domainMapping = {};
            for(i=0;i<temp.length;i++){
                t = removeWWW(temp[i]);
                domainMapping[t] = temp[i];
                temp[i] = t;
            }
            temp = sortList(temp);
            //create UI
            for(i=0; i<temp.length;i++){
                if(temp[i]!="") ul.append([
                        '<li class="removeCheckWrapper" style="width: 100%;overflow: auto;">',
                            '<button style="padding: 0;">✕</button>',
                            '<div>'+temp[i]+'</div>',
                            '<p>➤</p>',
                        '</li>'
                    ].join("\n")
                );
            }
            // create button function
            child = ul.children();
            if(child && child.length>0) {
                for (i = 0; i < child.length; i++) {
                    $(child[i]).click(function () {
                        if($($(this).children('button')).is(':hover')) return;
                        var tar = $(this).children('div')[0].textContent;
                        if(domainMapping[tar]) tar = domainMapping[tar];
                        chrome.tabs.create({ url:"http://"+tar});
                    });
                    $(child[i]).mousedown(function () {
                        if($($(this).children('button')).is(':active')) return;
                        $(this).addClass("removeActiveOnlyBack");
                    });
                    $(child[i]).mouseleave(function () {
                        $(this).removeClass("removeActiveOnlyBack");
                    });
                    $(child[i]).not($(child[i]).children()).mouseover(function () {
                        if(removeListHoverLock) return;
                        if($($(this).children('button')).is(':active')) return;
                        if($(this).is(':active')){
                            if(!$($(this).children('button')).is(':active')) {
                                $(this).addClass("removeActiveOnlyBack");
                            }
                        }
                        removeListHoverLock = true;
                        var tar =$($(this).children('p'));
                        tar.css('margin-right','15px');
                        tar.fadeIn(200);
                        tar.animate({marginRight: "5px"},200);
                    });
                    $(child[i]).mouseleave(function () {
                        $(this).removeClass("removeActiveOnlyBack");
                        removeListHoverLock = false;
                        $($(this).children('p')).fadeOut(200);
                    });
                    $($(child[i]).children("button")).click(function(){
                        var tar = $(this).siblings()[0].textContent;
                        if(domainMapping[tar]) tar = domainMapping[tar];
                        // send delete message
                        chrome.runtime.sendMessage({deleteRule:"whiteList::"+tar});
                        // remove from local
                        var index = whiteList.indexOf(tar);
                        whiteList.splice(index,1);

                        // disappear
                        $($(this).parent()).fadeOut('fast');

                        getCurrentTabUrl(function (url) {
                            getWebsiteBlockStatus(url);
                        });
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
                            var text = sib.textContent;
                            if(domainMapping[text]) text = domainMapping[text];
                            if (text == url) {
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

        var ul = $('#removeSoftListDomain');
        var i, temp;
        if(softLockList.length>0) {

            temp = softLockList.slice(0);
            domainMapping = {};
            for(i=0;i<temp.length;i++){
                t = removeWWW(temp[i]);
                domainMapping[t] = temp[i];
                temp[i] = t;
            }
            temp = sortList(temp);

            //create UI
            for (i = 0; i < temp.length; i++) {
                if (temp[i] != "") ul.append([
                        '<li class="removeCheckWrapper" style="width: 100%;overflow: auto;">',
                            '<button style="padding: 0;">✕</button>',
                            '<div>' + temp[i] + '</div>',
                            '<p>➤</p>',
                        '</li>'
                    ].join("\n")
                );
            }
            // create button function
            child = ul.children();
            if (child && child.length > 0) {
                for (i = 0; i < child.length; i++) {
                    $(child[i]).click(function () {
                        if($($(this).children('button')).is(':hover')) return;
                        var tar = $(this).children('div')[0].textContent;
                        if(domainMapping[tar]) tar = domainMapping[tar];
                        chrome.tabs.create({ url:"http://"+tar});
                    });
                    $(child[i]).mousedown(function () {
                        if($($(this).children('button')).is(':active')) return;
                        $(this).addClass("removeActiveOnlyBack");
                    });
                    $(child[i]).mouseleave(function () {
                        $(this).removeClass("removeActiveOnlyBack");
                    });
                    $(child[i]).not($(child[i]).children()).mouseover(function () {
                        if(removeListHoverLock) return;
                        if($($(this).children('button')).is(':active')) return;
                        if($(this).is(':active')){
                            if(!$($(this).children('button')).is(':active')) {
                                $(this).addClass("removeActiveOnlyBack");
                            }
                        }
                        removeListHoverLock = true;
                        var tar =$($(this).children('p'));
                        tar.css('margin-right','15px');
                        tar.fadeIn(200);
                        tar.animate({marginRight: "5px"},200);
                    });
                    $(child[i]).mouseleave(function () {
                        $(this).removeClass("removeActiveOnlyBack");
                        removeListHoverLock = false;
                        $($(this).children('p')).fadeOut(200);
                    });
                    $($(child[i]).children("button")).click(function () {
                        var tar = $(this).siblings()[0].textContent;
                        if(domainMapping[tar]) tar = domainMapping[tar];
                        // send delete message
                        chrome.runtime.sendMessage({deleteRule: "softLockList::" + tar});
                        // remove from local
                        var index = softLockList.indexOf(tar);
                        softLockList.splice(index, 1);

                        // disappear
                        $($(this).parent()).fadeOut('fast');

                        getCurrentTabUrl(function (url) {
                            getWebsiteBlockStatus(url);
                        });
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
                            var text = sib.textContent;
                            if(domainMapping[text]) text = domainMapping[text];
                            if (text == url) {
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

}

var mainMessage="Better stop now!";

function submitMainMessage(newMessage){
    //var newMessage = document.getElementById("mainMessageInput").value;
    loadBlocker(function(){
        if(newMessage!=mainMessage) {
            chrome.runtime.sendMessage({modifyMainMessage: newMessage}, function (response) {
                // console.log("modifyMainMessage as : " + newMessage);
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

        getWebsiteBlockStatus(rawUrl);

        saveFile(function(){
            chrome.runtime.sendMessage({blockListChange:"soft"});
        });


    });
}

function addBaseDomainToSoftLockList(rawUrl){

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

    getWebsiteBlockStatus(rawUrl);

    saveFile(function(){
        chrome.runtime.sendMessage({blockListChange:"soft"});
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

    getWebsiteBlockStatus(url);

    saveFile(function(){
        chrome.runtime.sendMessage({blockListChange:"soft"});
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

function addSinglePageToWhiteList(rawUrl){

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

    getWebsiteBlockStatus(rawUrl);

    saveFile(function(){
        chrome.runtime.sendMessage({blockListChange:"false"});
    });

}

function addBaseDomainToWhiteList(rawUrl){

    //var url = cutOffHeadAndTail(rawUrl);
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

    whiteList.push(url);

    getWebsiteBlockStatus(rawUrl);

    saveFile(function(){
        chrome.runtime.sendMessage({blockListChange:"false"});
    });


}

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

    getWebsiteBlockStatus(url);

    saveFile(function(){
        chrome.runtime.sendMessage({blockListChange:"false"});
    });
}

function getWebsiteBlockStatus(url) {
    chrome.runtime.sendMessage({"getStatus":url}, function(response) {
        if(response==undefined || response.block==undefined)
            $(document.getElementById("isInList")).text(" error");
        else if(response.block=="white") $(document.getElementById("isInList")).text(" white list");
        // else if(response.block=="hard") $(document.getElementById("isInList")).text(" hard block");
        else if(response.block=="soft") $(document.getElementById("isInList")).text(" Locked");
        else $(document.getElementById("isInList")).text(" none");
    });
}

function clearLocalData() {

    $("#timerSet").css('display','none');
    $("#timerNotYetSet").css('display','block').val(10);

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