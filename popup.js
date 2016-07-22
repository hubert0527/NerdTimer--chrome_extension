var ignore = [
    "www",
    "com",
    "tw",
    "m",
    "cn",
    "us",
    "jp"
];

var timer = 0;

var singleHardLock = [];
var singleSoftLock = [];
var useTime = [];
var singleWhite = [];

var softLockList = [];
var hardLockList = [];
var whiteList = [];

var purifiedSoftLock;
var purifiedHardLock;
var purifiedWhite;

window.addEventListener("DOMContentLoaded", function() {

    loadFile();
    
    // find current domain
    getCurrentTabUrl(function (url) {
        // set domain
        var pure = cutOffHeadAndTail(url);
        if(pure.substring(0,3)=="www"){
            pure = pure.substring(4);
        }
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
        chrome.runtime.sendMessage({"checkIfInList":url}, function(response) {
            if(response==undefined || response.block==undefined)
                $(document.getElementById("isInList")).text(" error");
            if(response.block=="white") $(document.getElementById("isInList")).text(" white list");
            else if(response.block=="hard") $(document.getElementById("isInList")).text(" hard block");
            else if(response.block=="soft") $(document.getElementById("isInList")).text(" soft block");
            else if(response.block=="none") $(document.getElementById("isInList")).text(" not set");
        });
    });

    // set timer
    loadLastUsedTimer(function(time){
        time = parseInt(time);
        if(time) {
            document.getElementById("waitTime").value = time;
        }
        else{
            document.getElementById("waitTime").value = 10;
        }
    });
    document.getElementById("startTimer").addEventListener("click",function(){
        if(timer>0) return;
        var time = parseInt(document.getElementById("waitTime").value);
        saveLastUsedTimer(time,function(){
            chrome.runtime.sendMessage({timerSet:time});
            setPopupTimer(time);
        });
    });
    
    document.getElementById("addSinglePageToSoftLockList").addEventListener("click", addSinglePageToSoftLockList);
    document.getElementById("addBaseDomainToSoftLockList").addEventListener("click", addBaseDomainToSoftLockList);
    document.getElementById("addSinglePageToHardLockList").addEventListener("click", addSinglePageToHardLockList);
    document.getElementById("addBaseDomainToHardLockList").addEventListener("click", addBaseDomainToHardLockList);
    document.getElementById("addSinglePageToWhiteList").addEventListener("click", addSinglePageToWhiteList);
    document.getElementById("addBaseDomainToWhiteList").addEventListener("click", addBaseDomainToWhiteList);
    document.getElementById("submitMainMessage").addEventListener("click", function(){
        var v = $("#mainMessageInput").val();
        console.log("receive event : "+v.toString());
        if(v==MouseEvent) return;
        submitMainMessage(v.toString());
    });
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

    // create sliding button                                                                  // current        target
    document.getElementById("goToAddToListType").addEventListener("click", function(){moveRightTo("#mainPage","#addToListType");});
    document.getElementById("goToSoftBlock").addEventListener("click", function(){moveRightTo("#addToListType","#addToSoftBlockList");});
    document.getElementById("goToHardBlock").addEventListener("click", function(){moveRightTo("#addToListType","#addToHardBlockList");});
    document.getElementById("goToWhiteList").addEventListener("click", function(){moveRightTo("#addToListType","#addToWhiteList");});
    document.getElementById("goToMainMessageSetting").addEventListener("click", function(){
        moveRightTo("#mainPage","#modifyMainMessage");
        chrome.runtime.sendMessage({"getCurrentMainMessage":"true"}, function(response) {
            if(response && response.mainMessage!=undefined) {
                document.getElementById("mainMessageInput").value = response.mainMessage;
            }
        });
    });
    document.getElementById("goToTimeSetting").addEventListener("click", function(){
        moveRightTo("#mainPage","#timeSetting");
        // set timer status showing
        chrome.runtime.sendMessage({getTimerTime:"none"},function(res){
            setPopupTimer(res.time);
        });
    });

    createRemoveList();

    document.getElementById("goToMainPage1").addEventListener("click", function(){
        loadFile();

        // refresh status
        getCurrentTabUrl(function (url) {
            // check in list
            chrome.runtime.sendMessage({"checkIfInList":url}, function(response) {
                if(response==undefined || response.block==undefined)
                    $(document.getElementById("isInList")).text(" error");
                if(response.block=="white") $(document.getElementById("isInList")).text(" white list");
                else if(response.block=="hard") $(document.getElementById("isInList")).text(" hard block");
                else if(response.block=="soft") $(document.getElementById("isInList")).text(" soft block");
                else if(response.block=="none") $(document.getElementById("isInList")).text(" not set");
            });
        });
        moveLeftTo("#addToListType","#mainPage");
    });
    document.getElementById("goToMainPage2").addEventListener("click", function(){moveLeftTo("#addToSoftBlockList","#addToListType");});
    document.getElementById("goToMainPage9").addEventListener("click", function(){moveLeftTo("#timeSetting","#mainPage");});
    document.getElementById("goToMainPage3").addEventListener("click", function(){moveLeftTo("#addToHardBlockList","#addToListType");});
    document.getElementById("goToMainPage4").addEventListener("click", function(){moveLeftTo("#addToWhiteList","#addToListType");});
    document.getElementById("goToMainPage5").addEventListener("click", function(){moveLeftTo("#modifyMainMessage","#mainPage");});
    document.getElementById("goToMainPage6").addEventListener("click", function(){
        moveLeftTo("#removeWhite","#addToWhiteList",function () {
            var ul = $('#removeWhiteListSingle');
            $(ul.children()).remove();
            ul = $('#removeWhiteListDomain');
            $(ul.children()).remove();
        });
    });
    document.getElementById("goToMainPage7").addEventListener("click", function(){
        moveLeftTo("#removeSoft","#addToSoftBlockList",function(){
            var ul = $('#removeSoftListSingle');
            $(ul.children()).remove();
            ul = $('#removeSoftListDomain');
            $(ul.children()).remove();
        });
    });
    document.getElementById("goToMainPage8").addEventListener("click", function(){
        moveLeftTo("#removeHard","addToHardBlockList",function(){
            var ul = $('#removeHardListSingle');
            $(ul.children()).remove();
            ul = $('#removeHardListDomain');
            $(ul.children()).remove();
        });

    });


    console.log("softBlocks: " + softLockList.toString());
    console.log("whites: " + whiteList.toString());

});

function setPopupTimer(time){

    timer = time;
    if(timer<=0) {
        document.getElementById("timeDisplay").textContent = " 00 : 00";
        return;
    }
    var sec = (timer%60).toString();
    var min = (Math.floor(timer/60)).toString();
    if(sec<10){
        sec = "0"+sec;
    }
    if(min<10){
        min = "0"+min;
    }
    document.getElementById("timeDisplay").textContent =  min + " : " + sec;
    var i = setInterval(function(){
        console.log("time = " + timer + ", min = " + timer/60 + " sec = " + timer%60);
        timer --;
        sec = (timer%60).toString();
        min = (Math.floor(timer/60)).toString();
        if(sec<10){
        sec = "0"+sec;
        }
        if(min<10){
            min = "0"+min;
        }
        document.getElementById("timeDisplay").textContent = min + " : " + sec;
        if(timer<=0) clearInterval(i);
    },1000);

}

function createRemoveList(){
    document.getElementById("removeFromWhite").addEventListener("click", function(){
        moveRightTo("#addToWhiteList","#removeWhite");
        var ul = $('#removeWhiteListSingle');
        var i;

        // temporary eliminate "www" and sort
        var temp = singleWhite.slice(0);
        for(i=0;i<temp.length;i++){
            if(temp[i].substring(0,3)=="www"){
                temp[i] = temp[i].substring(4);
            }
        }
        sortList(temp);
        // create UI
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
        var child = ul.children();
        if(child && child.length>0) {
            for (i = 0; i < child.length; i++) {
                $($(child[i]).children("button")).click(function(){
                    var tar = $(this).siblings()[0].textContent;
                    // send delete message
                    chrome.runtime.sendMessage({deleteRule:"singleWhite::"+tar});
                    // remove from local
                    var index = singleWhite.indexOf(tar);
                    singleWhite.splice(index,1);

                    // disappear
                    $($(this).parent()).fadeOut('fast');
                });
            }
        }
        // high light current tab
        getCurrentTabUrl(function(url){
            url = cutOffHeadAndTail(url);
            if(url.substring(0,3)=="www"){
                url = url.substring(4);
            }
            var child = $('#removeWhiteListSingle').children();
            if(child && child.length>0) {
                for (i = 0; i < child.length; i++) {
                    var sib = $($(child[i]).children("button")).siblings()[0];
                    var t = sib.textContent;
                    if(sib.textContent==url){
                        $(sib).css("background-color","yellow");
                    }
                }
            }
        });

        ul = $('#removeWhiteListDomain');
        // temporary eliminate "www" and sort
        temp = whiteList.slice(0);
        for(i=0;i<temp.length;i++){
            if(temp[i].substring(0,3)=="www"){
                temp[i] = temp[i].substring(4);
            }
        }
        sortList(temp);
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
            url = cutOffHeadAndTail(url);
            if(url.substring(0,3)=="www"){
                url = url.substring(4);
            }
            var child = $('#removeWhiteListDomain').children();
            if(child && child.length>0) {
                for (i = 0; i < child.length; i++) {
                    var sib = $($(child[i]).children("button")).siblings()[0];
                    if(sib.textContent==url){
                        $(sib).css("background-color","yellow");
                    }
                }
            }
        });
    });
    document.getElementById("removeFromSoft").addEventListener("click", function(){
        moveRightTo("#addToSoftBlockList","#removeSoft");
        var ul = $('#removeSoftListSingle');
        var i;

        // temporary eliminate "www" and sort
        var temp = singleSoftLock.slice(0);
        for(i=0;i<temp.length;i++){
            if(temp[i].substring(0,3)=="www"){
                temp[i] = temp[i].substring(4);
            }
        }
        sortList(temp);
        // create UI
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
        var child = ul.children();
        if(child && child.length>0) {
            for (i = 0; i < child.length; i++) {
                $($(child[i]).children("button")).click(function(){
                    var tar = $(this).siblings()[0].textContent;
                    // send delete message
                    chrome.runtime.sendMessage({deleteRule:"singleSoftLock::"+tar});
                    // remove from local
                    var index = singleSoftLock.indexOf(tar);
                    singleSoftLock.splice(index,1);

                    // disappear
                    $($(this).parent()).fadeOut('fast');
                });
            }
        }
        // high light current tab
        getCurrentTabUrl(function(url){
            url = cutOffHeadAndTail(url);
            if(url.substring(0,3)=="www"){
                url = url.substring(4);
            }
            var child = $('#removeSoftListSingle').children();
            if(child && child.length>0) {
                for (i = 0; i < child.length; i++) {
                    var sib = $($(child[i]).children("button")).siblings()[0];
                    if(sib.textContent==url){
                        $(sib).css("background-color","yellow");
                    }
                }
            }
        });

        ul = $('#removeSoftListDomain');
        // temporary eliminate "www" and sort
        temp = softLockList.slice(0);
        for(i=0;i<temp.length;i++){
            if(temp[i].substring(0,3)=="www"){
                temp[i] = temp[i].substring(4);
            }
        }
        sortList(temp);
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
                    chrome.runtime.sendMessage({deleteRule:"softLockList::"+tar});
                    // remove from local
                    var index = softLockList.indexOf(tar);
                    softLockList.splice(index,1);

                    // disappear
                    $($(this).parent()).fadeOut('fast');
                });
            }
        }
        // high light current tab
        getCurrentTabUrl(function(url){
            url = cutOffHeadAndTail(url);
            if(url.substring(0,3)=="www"){
                url = url.substring(4);
            }
            var child = $('#removeSoftListDomain').children();
            if(child && child.length>0) {
                for (i = 0; i < child.length; i++) {
                    var sib = $($(child[i]).children("button")).siblings()[0];
                    if(sib.textContent==url){
                        $(sib).css("background-color","yellow");
                    }
                }
            }
        });
    });
    document.getElementById("removeFromHard").addEventListener("click", function(){
        moveRightTo("#addToHardBlockList","#removeHard");
        var ul = $('#removeHardListSingle');
        var i;

        // temporary eliminate "www" and sort
        var temp = singleHardLock.slice(0);
        for(i=0;i<temp.length;i++){
            if(temp[i].substring(0,3)=="www"){
                temp[i] = temp[i].substring(4);
            }
        }
        sortList(temp);
        // create UI
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
        var child = ul.children();
        if(child && child.length>0) {
            for (i = 0; i < child.length; i++) {
                $($(child[i]).children("button")).click(function(){
                    var tar = $(this).siblings()[0].textContent;
                    // send delete message
                    chrome.runtime.sendMessage({deleteRule:"singleHardLock::"+tar});
                    // remove from local
                    var index = singleHardLock.indexOf(tar);
                    singleHardLock.splice(index,1);

                    // disappear
                    $($(this).parent()).fadeOut('fast');
                });
            }
        }
        // high light current tab
        getCurrentTabUrl(function(url){
            url = cutOffHeadAndTail(url);
            if(url.substring(0,3)=="www"){
                url = url.substring(4);
            }
            var child = $('#removeHardListSingle').children();
            if(child && child.length>0) {
                for (i = 0; i < child.length; i++) {
                    var sib = $($(child[i]).children("button")).siblings()[0];
                    if(sib.textContent==url){
                        $(sib).css("background-color","yellow");
                    }
                }
            }
        });

        ul = $('#removeHardListDomain');
        // temporary eliminate "www" and sort
        temp = hardLockList.slice(0);
        for(i=0;i<temp.length;i++){
            if(temp[i].substring(0,3)=="www"){
                temp[i] = temp[i].substring(4);
            }
        }
        sortList(temp);
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
                    chrome.runtime.sendMessage({deleteRule:"hardLockList::"+tar});
                    // remove from local
                    var index = hardLockList.indexOf(tar);
                    hardLockList.splice(index,1);

                    // disappear
                    $($(this).parent()).fadeOut('fast');
                });
            }
        }
        // high light current tab
        getCurrentTabUrl(function(url){
            url = cutOffHeadAndTail(url);
            if(url.substring(0,3)=="www"){
                url = url.substring(4);
            }
            var child = $('#removeHardListDomain').children();
            if(child && child.length>0) {
                for (i = 0; i < child.length; i++) {
                    var sib = $($(child[i]).children("button")).siblings()[0];
                    if(sib.textContent==url){
                        $(sib).css("background-color","yellow");
                    }
                }
            }
        });
    });
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
    tar.css("height","90%");
    tar.css("width","90%");
    cur.css("position", "absolute");
    tar.css("position","relative");
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
    cur.css("position", "absolute");
    tar.css("position","relative");
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

        var url = cutOffHeadAndTail(rawUrl);

        // check if already exist
        for(var i=0; i<singleSoftLock.length;i++){
            if(singleSoftLock[i]==url) return;
        }
        for(var i=0; i<singleHardLock.length;i++){
            if(singleHardLock[i]==url) return;
        }
        for(var i=0; i<singleWhite.length;i++){
            if(singleWhite[i]==url) return;
        }

        singleSoftLock.push(url);
        sortList(singleSoftLock);
        saveFile(function(){
            getCurrentTab(function(tab){
                chrome.tabs.sendMessage(tab.id,{blockListChange:"soft"});
            });
        });


    });
}

function addBaseDomainToSoftLockList(){
    getCurrentTabUrl(function(rawUrl){

        var url = cutOffHeadAndTail(rawUrl);

        var temp;
        while( (temp = clearLast(url))!=""){
            url = temp;
        }

        // check if already exist
        for(var i=0; i<softLockList.length;i++){
            if(softLockList[i]==url) return;
        }
        for(var i=0; i<hardLockList.length;i++){
            if(hardLockList[i]==url) return;
        }
        for(var i=0; i<whiteList.length;i++){
            if(whiteList[i]==url) return;
        }

        softLockList.push(url);
        sortList(softLockList);
        saveFile(function(){
            getCurrentTab(function(tab){
                chrome.tabs.sendMessage(tab.id,{blockListChange:"soft"});
            });
        });


    });
}

function addSubDomainToSoftLockList(rawUrl){

    var url = cutOffHeadAndTail(rawUrl);

    // check if already exist
    for(var i=0; i<softLockList.length;i++){
        if(softLockList[i]==url) return;
    }
    for(var i=0; i<hardLockList.length;i++){
        if(hardLockList[i]==url) return;
    }
    for(var i=0; i<whiteList.length;i++){
        if(whiteList[i]==url) return;
    }

    softLockList.push(url);
    sortList(softLockList);
    saveFile(function(){
        getCurrentTab(function(tab){
            chrome.tabs.sendMessage(tab.id,{blockListChange:"soft"});
        });
    });

}

function addSinglePageToHardLockList(){
    getCurrentTabUrl(function(rawUrl){

        var url = cutOffHeadAndTail(rawUrl);

        // check if already exist
        for(var i=0; i<singleSoftLock.length;i++){
            if(singleSoftLock[i]==url) return;
        }
        for(var i=0; i<singleHardLock.length;i++){
            if(singleHardLock[i]==url) return;
        }
        for(var i=0; i<singleWhite.length;i++){
            if(singleWhite[i]==url) return;
        }

        singleHardLock.push(url);
        sortList(singleHardLock);
        saveFile(function(){
            getCurrentTab(function(tab){
                chrome.tabs.sendMessage(tab.id,{blockListChange:"hard"});
            });
        });


    });
}

function addBaseDomainToHardLockList(){
    getCurrentTabUrl(function(rawUrl){

        var url = cutOffHeadAndTail(rawUrl);

        var temp;
        while( (temp = clearLast(url))!=""){
            url = temp;
        }

        // check if already exist
        for(var i=0; i<softLockList.length;i++){
            if(softLockList[i]==url) return;
        }
        for(var i=0; i<hardLockList.length;i++){
            if(hardLockList[i]==url) return;
        }
        for(var i=0; i<whiteList.length;i++){
            if(whiteList[i]==url) return;
        }

        hardLockList.push(url);
        sortList(hardLockList);
        saveFile(function(){
            getCurrentTab(function(tab){
                chrome.tabs.sendMessage(tab.id,{blockListChange:"hard"});
            });
        });


    });
}

function addSubDomainToHardLockList(rawUrl){

    var url = cutOffHeadAndTail(rawUrl);

    // check if already exist
    for(var i=0; i<softLockList.length;i++){
        if(softLockList[i]==url) return;
    }
    for(var i=0; i<hardLockList.length;i++){
        if(hardLockList[i]==url) return;
    }
    for(var i=0; i<whiteList.length;i++){
        if(whiteList[i]==url) return;
    }

    hardLockList.push(url);
    sortList(hardLockList);
    saveFile(function(){
        getCurrentTab(function(tab){
            chrome.tabs.sendMessage(tab.id,{blockListChange:"hard"});
        });
    });

}

function addSinglePageToWhiteList(){
    getCurrentTabUrl(function(rawUrl){

        var url = cutOffHeadAndTail(rawUrl);

        // check if already exist
        for(var i=0; i<singleSoftLock.length;i++){
            if(singleSoftLock[i]==url) return;
        }
        for(var i=0; i<singleHardLock.length;i++){
            if(singleHardLock[i]==url) return;
        }
        for(var i=0; i<singleWhite.length;i++){
            if(singleWhite[i]==url) return;
        }

        singleWhite.push(url);
        sortList(singleWhite);
        saveFile(function(){
            getCurrentTab(function(tab){
                chrome.tabs.sendMessage(tab.id,{blockListChange:"false"});
            });
        });


    });
}

function addBaseDomainToWhiteList(){
    getCurrentTabUrl(function(rawUrl){

        var url = cutOffHeadAndTail(rawUrl);

        var temp;
        while( (temp = clearLast(url))!=""){
            url = temp;
        }

        // check if already exist
        for(var i=0; i<softLockList.length;i++){
            if(softLockList[i]==url) return;
        }
        for(var i=0; i<hardLockList.length;i++){
            if(hardLockList[i]==url) return;
        }
        for(var i=0; i<whiteList.length;i++){
            if(whiteList[i]==url) return;
        }

        whiteList.push(url);
        sortList(whiteList);
        saveFile(function(){
            getCurrentTab(function(tab){
                chrome.tabs.sendMessage(tab.id,{blockListChange:"false"});
            });
        });


    });
}

function addSubDomainToWhiteList(rawUrl){

    var url = cutOffHeadAndTail(rawUrl);

    // check if already exist
    for(var i=0; i<whiteList.length;i++){
        if(whiteList[i]==url) return;
    }
    for(var i=0; i<softLockList.length;i++){
        if(softLockList[i]==url) return;
    }
    for(var i=0; i<hardLockList.length;i++){
        if(hardLockList[i]==url) return;
    }

    whiteList.push(url);
    sortList(whiteList);
    saveFile(function(){
        getCurrentTab(function(tab){
            chrome.tabs.sendMessage(tab.id,{blockListChange:"false"});
        });
    });
}

