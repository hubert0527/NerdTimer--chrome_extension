var chart;

var chartMode = 0;
var chartMode0OptionRec = -1;
var chartMode1OptionRec = -1;
var chartMode2OptionRec = -1;

var pastNDayTimerInst;
var lastDayInput = "7";

var pastTimeLineTimerInst;
var lastTimeLineInput = "7";

var pastNWebsiteTimerInst;
var lastWebsiteInput = "10";

/**
 * Due to showing url without 'www' is better,
 *      but we need to read value of domain string showing to do operation.
 * So, we do this mapping, map back the original url before doing operations.
 * @type {{}}
 */
var domainMapping = {};

function bindChart() {
    // button for mode 0
    $('#statisticsForEachWebsite').click(function(){
        if(chartMode!=0){
            clearInterval(pastNDayTimerInst);
            clearInterval(pastTimeLineTimerInst);
            changeToMode(0);
        }
    });

    // button for mode 1
    $('#statisticsPastNDays').click(function(){
        if(chartMode!=1){
            clearInterval(pastNWebsiteTimerInst);
            clearInterval(pastTimeLineTimerInst);
            changeToMode(1);
        }
    });

    // button for mode 2
    $('#statisticsWebsiteTimeLine').click(function(){
        if(chartMode!=2){
            clearInterval(pastNDayTimerInst);
            clearInterval(pastNWebsiteTimerInst);
            changeToMode(2);
        }
    });

    createNWebsiteInput();

    createNDayInput();

    createTimeLineInput();
}

function prepareChart(callback) {
    //chrome.runtime.sendMessage({forceSaveFully:"none"},function(res){
    //     loadFile(function(){

            // init
            // force program to re load all components
            chartMode = -1;
            changeToMode(0);

            if(callback) callback();

        // });
    //});
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
    $('iframe.chartjs-hidden-iframe').remove();
    $('#chartArea').remove();
    $("#statistics").append('<canvas id="chartArea" width="225" height="160"></canvas>');

    var mode0Box = $('#statisticsForEachWebsiteOptions');
    var mode1Box = $('#statisticsPastNDaysBlock');
    var mode2Box = $('#statisticsTimeLineBlock');
    var mode2Select = $('#timeLineOptions');


    if(mode==0){
        // run prev, or default
        if(option==0) {
            var inputBox = $('#statisticsNWebsiteInput');

            var kill = $([mode1Box[0],mode2Box[0],mode2Select[0]]);
            var c=0;
            kill.fadeOut('fast',function(){
                c++;
                if(c==kill.length) mode0Box.fadeIn('fast');
            });

            // init
            if(prevMode==-1){
                mode0Box.css("display","block");
            }

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

        // if(mode1Box.is(':visible')){
        //     mode1Box.fadeOut('fast',function(){mode0Box.fadeIn('fast');});
        // }
        // if(mode2Box.is(':visible')){
        //     mode2Box.fadeOut('fast',function(){mode0Box.fadeIn('fast');});
        // }
        // if(mode2Select.is(':visible')){
        //     mode2Box.fadeOut('fast',function(){mode0Box.fadeIn('fast');});
        // }

    }
    else if(mode==1){
        // run prev, or default
        if(option==0) {
            var inputBox = $('#statisticsPastNDaysInput');

            var kill = $([mode0Box[0],mode2Box[0],mode2Select[0]]);
            var c = 0;
            kill.fadeOut('fast',function(){
                c++;
                if(c==kill.length) mode1Box.fadeIn('fast');
            });

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

        // if(mode0Box.is(':visible')){
        //     mode0Box.fadeOut('fast',function(){mode1Box.fadeIn('fast');});
        // }
        // if(mode2Box.is(':visible')){
        //     mode2Box.fadeOut('fast',function(){mode1Box.fadeIn('fast');});
        // }
        // if(mode2Select.is(':visible')){
        //     mode2Box.fadeOut('fast',function(){mode1Box.fadeIn('fast');});
        // }

    }
    else if(mode==2){

        createTimeLineSelect();

        // this mode specifically use narrower space
        var me = $("#statistics");
        $('iframe.chartjs-hidden-iframe').remove();
        $('#chartArea').remove();
        me.append(
            '<canvas id="chartArea" width="225" height="130" style="margin-top: 30px;"></canvas>'
        );

        // run prev, or default
        if(option==0) {
            var inputBox = $('#statisticsTimeLineInput');

            var kill = $([mode0Box[0],mode1Box[0]]);
            var c=0;
            kill.fadeOut('fast',function(){
                c++;
                if(c==kill.length) {
                    mode2Box.fadeIn('fast');
                    mode2Select.fadeIn('fast');
                }
            });

            // jump to target option if this chart was used before
            if(chartMode2OptionRec!=-1) {
                inputBox.val(chartMode2OptionRec.toString());
            }
            else{
                inputBox.val('7');
                chartMode2OptionRec = 7;
            }

            changeToMode = chartMode2OptionRec*10+2;
            drawChart(changeToMode);

        }
        else{
            chartMode2OptionRec = option;
            drawChart(changeToMode);
        }

        // if(mode0Box.is(':visible')){
        //     mode0Box.fadeOut('fast',function(){
        //         mode2Box.fadeIn('fast');
        //         mode2Select.fadeIn('fast');
        //     });
        // }
        // if(mode1Box.is(':visible')){
        //     mode1Box.fadeOut('fast',function(){
        //         mode2Box.fadeIn('fast');
        //         mode2Select.fadeIn('fast');
        //     });
        // }

    }

    chartMode = changeToMode;
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
    var li=[], i, j, key;
    var tTime=[], tDomain=[];

    // chart must use
    var data, chartType, chartOption={};
    var ctx = $('#chartArea');
    // bar prop
    var barDist, borderColors=[], borderWidth, timeValue, domainName=[], colors, listCategory=[], formattedTime;
    // line prop
    var lineLocked, lineWhite, lineTotal;


    if(mode==0){

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
            listCategory[i] = "未加入 (點擊加入)";
        }
        for (i = 0; i < softIndex.length; i++) {
            listCategory[softIndex[i]] = "鎖定 (點擊解除)";
        }
        for (i = 0; i < whiteIndex.length; i++) {
            listCategory[whiteIndex[i]] = "白名單 (點擊解除)";
        }

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

        var temp;
        domainMapping = {};
        for(i=0;i<domainName.length;i++){
            temp = removeWWW(domainName[i]);
            domainMapping[temp] = domainName[i];
            domainName[i] = temp;
        }

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
                // console.log("clicked on " + label);
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

        calculatePastNDaysTotal(pastNDays,function (lineTotal,lineLocked,lineWhite) {

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

    else if(mode==2){
        chartType="line";

        var targetWebsite = $('#timeLineOptionsSelect').val();
        if(domainMapping[targetWebsite]){
            console.log("mapping "+targetWebsite+" to "+domainMapping[targetWebsite]);
            targetWebsite = domainMapping[targetWebsite];
        }

        var pastNDays=getPastNDays(days);

        loadPastNDaysForDesignatedWebsite(pastNDays,targetWebsite,function (timeData) {

            data = {
                labels: pastNDays,
                datasets: [{
                    data: timeData,
                    backgroundColor: 'red',
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
                            var time = timeData[index];

                            time/=1000;
                            var sec = Math.floor(time%60);
                            time/=60;
                            var min = Math.floor(time%60);
                            time/=60;
                            var hr = Math.floor(time%60);

                            return hr+'h '+min+'m '+sec+'s';
                        },
                        afterLabel : function(tooltipItem,data){
                            var index = tooltipItem.index;
                            return pastNDays[index];
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
        $(this).off('click');
    });
    $('#addingDomainName').text(url);

    if(domainMapping[url]){
        console.log("mapping "+url+" to "+domainMapping[url]);
        url = domainMapping[url];
    }

    if(whiteList.indexOf(url)>=0){
        actions.append('<button id="removeFromWhiteListBtnJustCreated" class="popupTopBtn">自白名單移除</button>');
        $('#removeFromWhiteListBtnJustCreated').click(function () {
            var index = whiteList.indexOf(url);
            whiteList.splice(index,1);
            saveFile(function(){
                getCurrentTab(function(tab){
                    chrome.tabs.sendMessage(tab.id,{blockListChange:"false"});
                    getWebsiteBlockStatus(tab.url);
                });
                var me = $("#statistics");
                $('iframe.chartjs-hidden-iframe').remove();
                $('#chartArea').remove();
                me.append(
                    '<canvas id="chartArea" width="225" height="160"></canvas>'
                );
                drawChart(chartMode);
            });
            top.fadeOut('fast');
            $(this).off('click');
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
                    getWebsiteBlockStatus(tab.url);
                });
                var me = $("#statistics");
                $('iframe.chartjs-hidden-iframe').remove();
                $('#chartArea').remove();
                me.append(
                    '<canvas id="chartArea" width="225" height="160"></canvas>'
                );
                drawChart(chartMode);
            });
            top.fadeOut('fast');
            $(this).off('click');
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
                    getWebsiteBlockStatus(tab.url);
                });
                var me = $("#statistics");
                $('iframe.chartjs-hidden-iframe').remove();
                $('#chartArea').remove();
                me.append(
                    '<canvas id="chartArea" width="225" height="160"></canvas>'
                );
                drawChart(chartMode);
            });
            top.fadeOut('fast');
            $(this).off('click');
        });
        $('#addToWhiteListBtnJustCreated').click(function () {
            whiteList.push(url);
            saveFile(function(){
                getCurrentTab(function(tab){
                    chrome.tabs.sendMessage(tab.id,{blockListChange:"false"});
                });
                getWebsiteBlockStatus(url);
                var me = $("#statistics");
                $('iframe.chartjs-hidden-iframe').remove();
                $('#chartArea').remove();
                me.append(
                    '<canvas id="chartArea" width="225" height="160"></canvas>'
                );
                drawChart(chartMode);
            });
            top.fadeOut('fast');
            $(this).off('click');
        });
    }
}

function notifyNoData() {
    var ctx = $('#chartArea')[0].getContext('2d');
    ctx.font = "30px serif";
    ctx.fillText("No Data",60,80);
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
        // enable chinese to notify user use wrong input type
        else if(e.which==229){

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
            if(lastChar!='' && (lastChar<'ㄅ'||lastChar>'ㄦ')) $(this).val('');
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
        // enable chinese to notify user use wrong input type
        else if(e.which==229){

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
            if(lastChar!='' && (lastChar<'ㄅ'||lastChar>'ㄦ')) $(this).val('');
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

function createTimeLineInput() {
    $(document.getElementById("statisticsTimeLineInput")).keydown(function (e) {
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

    // create options for mode 1
    $('#statisticsTimeLineInput').bind("input",function(){

        clearInterval(pastTimeLineTimerInst);

        var str = $(this).val();
        var val = parseInt(str);
        var lastChar = str.slice(-1);

        if(!val){
            if(lastChar!='' && (lastChar<'ㄅ'||lastChar>'ㄦ')) $(this).val('');
            return;
        }
        else if(val>365){
            //$(this).val( str.substring(0,str.length-1) );
            $(this).val(lastTimeLineInput);
            str = lastTimeLineInput;
        }

        lastTimeLineInput = str;

        // 1 is an exception which cannot complete a graph
        if(val==1) return;

        pastTimeLineTimerInst = setInterval(function(){
            // over 500ms no further input
            var day = parseInt($('#statisticsTimeLineInput').val());
            changeToMode(day*10 + 2);

            clearInterval(pastTimeLineTimerInst);
        },500);
    });

}

function createTimeLineSelect() {

    var lock=$('#timeLineOptionsSelectLocked');
    var white=$('#timeLineOptionsSelectWhite');
    var other=$('#timeLineOptionsSelectOther');


    $(lock.children()).remove();
    $(white.children()).remove();
    $(other.children()).remove();

    var i,j;
    var all = Object.keys(timeRecord);

    var temp;
    domainMapping = {};
    for(i=0;i<all.length;i++){
        temp = removeWWW(all[i]);
        domainMapping[temp] = all[i];
        all[i] = temp;
    }

    var firL="";
    var firW="";
    var firO="";

    all = sortList(all);

    var originalUrl;

    for(i=0;i<all.length;i++){

        if(domainMapping[all[i]]){
            originalUrl = domainMapping[all[i]];
        }
        else{
            originalUrl = all[i];
        }

        if(softLockList.indexOf(originalUrl)>=0){
            if(firL=="") firL = all[i];
            //lock.push(all[i]);
            lock.append('<option>'+all[i]+'</option>')
        }
        else if(whiteList.indexOf(originalUrl)>=0){
            if(firW=="") firW = all[i];
            //white.push(all[i]);
            white.append('<option>'+all[i]+'</option>')
        }
        else{
            if(firO=="") firO = all[i];
            //other.push(all[i]);
            other.append('<option>'+all[i]+'</option>')
        }
    }


    var select = $('#timeLineOptionsSelect');
    if(firL) select.val(firL);
    else if(firW) select.val(firW);
    else select.val(firO);

    select.off('change');
    
    select.change(function () {
        var me = $("#statistics");
        $('iframe.chartjs-hidden-iframe').remove();
        $('#chartArea').remove();
        me.append(
            '<canvas id="chartArea" width="225" height="130" style="margin-top: 30px;"></canvas>'
        );
        drawChart(chartMode);
    });

}