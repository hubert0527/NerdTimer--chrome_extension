
var stopForThisTime = false;

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

var isFadingOut = false;

chrome.extension.onMessage.addListener(nerdTimerMessageListener);

/**
 * Fire this upon page DOM loaded to check if block as fast as we could
 */
chrome.runtime.sendMessage({pageJustLoaded: 'none'}, function (res) {
    var blockState = res.blockState;
    if (blockState == 'soft') {
        doSoftBlock();
    }
    else if (blockState == 'white') {
        isFadingOut = true;
        $('#nerdTimerBlockerWrapper').fadeOut("slow", function () {
            isFadingOut = false;
        });
    }
});

function nerdTimerMessageListener(msg, sender, sendResponse) {

    if(!msg) return;

    if (msg.block=="soft") {
        doSoftBlock();
    }
    else if(msg.block=="false" || msg.block=="white" || msg.block=="none"){
        isFadingOut = true;
        $('#nerdTimerBlockerWrapper').fadeOut("slow",function () {
            isFadingOut = false;
        });
    }
    else if(msg.modifyMainMessage){
        var tar = document.getElementById("nerdTimerMainMessage");
        if(tar) $(tar).text(msg.modifyMainMessage);
    }
    else if(msg.blockListChange){
        chrome.runtime.sendMessage({checkIfInList:"none"},function (res) {
            if(res && res.block=="hard"){
                doHardBlock();
            }
            else if (res && res.block=="soft") {
                doSoftBlock();
            }
            else if(res && (res.block=="false"||res.block=="white"||res.block=="none")){
                isFadingOut = true;
                $('#nerdTimerBlockerWrapper').fadeOut("slow",function () {
                    isFadingOut = false;
                });
            }
        });
    }
    else if(msg.waitNMinutesButtonChange){
        var time = parseInt(msg.waitNMinutesButtonChange);
        $('#nerdTimerRemindMeLaterTime').text(time.toString());
    }
}

function doHardBlock(){
    // console.log("got hard block");

    var tar = document.getElementById("nerdTimerBlockerWrapper");
    if(tar!=undefined){
        if($(tar).is(":visible")) {
            // already blocked
            // still need to check text
            chrome.runtime.sendMessage({"getCurrentMainMessage":"true"}, function(response) {
                if(response && response.mainMessage!=undefined) {
                    var tar = $('#nerdTimerMainMessage');
                    if(tar.text()!=response.mainMessage) {
                        tar.fadeOut('fast', function () {
                            tar.text(response.mainMessage);
                            tar.fadeIn('fast');
                        });
                    }
                }
            });
            return;
        }
        else{
            $('#nerdTimerBlockerWrapper').fadeIn("slow");
            // console.log("turn unvisible to visible");
            return;
        }
    }

    var iDiv = document.createElement('div');
    iDiv.id = "nerdDiv";

    var body = document.getElementsByTagName("BODY")[0];
    if(body){
        body.appendChild(iDiv);
    }
    else{
        document.getElementsByTagName("HTML")[0].appendChild(iDiv);;
    }


    var path = chrome.extension.getURL("blocker.html");
    $('#nerdDiv').load(path,function(){
        /**
         * write script for loaded blocker html here
         */
        $("#nerdTimerRemindMeLater").css("display","none");
        $("#nerdTimerCloseIt").css("display","none");
    });
}
function doSoftBlock(){
    if(stopForThisTime) return ;

    // console.log("got soft block");
    var tar = document.getElementById("nerdTimerBlockerWrapper");
    if (tar != undefined) {
        getHowManyMinutesOnButton();
        if ($(tar).is(":visible") && !isFadingOut) {
            // already blocked
            // still need to check text
            requestMainMessage();
            return;
        }
        else {
            isFadingOut = false;
            $('#nerdTimerBlockerWrapper').fadeIn("slow");
            // console.log("turn unvisible to visible");
            return;
        }
    }

    createNerdDiv();

}

function createNerdDiv() {
    var iDiv = document.createElement('div');
    iDiv.id = "nerdDiv";

    var body = document.getElementsByTagName("BODY")[0];
    if (body) {
        body.appendChild(iDiv);
    }
    else {
        document.getElementsByTagName("HTML")[0].appendChild(iDiv);
    }

    var path = chrome.extension.getURL("blocker.html");
    $('#nerdDiv').load(path, function () {

        /**
         * write script for loaded blocker html here
         */
        $("#nerdTimerRemindMeLater").click(function () {
            var text = $('#nerdTimerRemindMeLaterTime').text();
            var val = parseInt(text);

            $('#nerdTimerBlockerWrapper').fadeOut("slow");
            chrome.runtime.sendMessage({"wait5Min": val}, function (response) {
                // console.log("wait5Min");
            });
        });
        $("#nerdTimerCloseIt").click(function () {
            stopForThisTime = true;
            $('#nerdTimerBlockerWrapper').fadeOut("slow");
        });

        requestMainMessage();
        getHowManyMinutesOnButton();

        $('#nerdTimerBlockerWrapper').fadeIn("slow");
    });
}

function requestMainMessage() {
    chrome.runtime.sendMessage({"getCurrentMainMessage": "true"}, function (response) {
        if (response && response.mainMessage != undefined) {
            var tar = $('#nerdTimerMainMessage');
            if (tar.text() != response.mainMessage) {
                tar.fadeOut('fast', function () {
                    tar.text(response.mainMessage);
                    tar.fadeIn('fast');
                });
            }
        }
    });
}

function getHowManyMinutesOnButton() {
    chrome.runtime.sendMessage({checkHowManyMinutesShowOnButton:"none"},function (response) {
        if (response.res) $('#nerdTimerRemindMeLaterTime').text(response.res);
    });
}


// resume window
window.addEventListener('focus',sendResumePageMessage);

function sendResumePageMessage() {
    chrome.runtime.sendMessage({resumePage:window.location.href},function(){
        // console.log("resume to browser " + window.location.href + " at " + new Date());
    });
}

// leave window
window.addEventListener('blur',sendLeavePageMessage);

function sendLeavePageMessage() {
    chrome.runtime.sendMessage({leavePage:window.location.href},function(){
        // console.log("leave browser " + window.location.href + " at " + new Date());
    });
}