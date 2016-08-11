
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

chrome.extension.onMessage.addListener(function(msg, sender, sendResponse) {

    if(!msg) return;

    if(msg.block=="hard"){
        doHardBlock();
    }
    else if (msg.block=="soft") {
        doSoftBlock();
    }
    else if(msg.block=="false"){
        isFadingOut = true;
        $('#blockerWrapper').fadeOut("slow",function () {
            isFadingOut = false;
        });
    }
    else if(msg.modifyMainMessage){
        var tar = document.getElementById("main_message");
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
                $('#blockerWrapper').fadeOut("slow",function () {
                    isFadingOut = false;
                });
            }
        });
    }
    else if(msg.waitNMinutesButtonChange){
        var time = parseInt(msg.waitNMinutesButtonChange);
        $('#remindMeLaterTime').text(time.toString());
    }
},false);

function doHardBlock(){
    // console.log("got hard block");

    var tar = document.getElementById("blockerWrapper");
    if(tar!=undefined){
        if($(tar).is(":visible")) {
            // already blocked
            // still need to check text
            chrome.runtime.sendMessage({"getCurrentMainMessage":"true"}, function(response) {
                if(response && response.mainMessage!=undefined) {
                    var tar = $('#main_message');
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
            $('#blockerWrapper').fadeIn("slow");
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
        $("#remindMeLater").css("display","none");
        $("#closeIt").css("display","none");
    });
}
function doSoftBlock(){
    if(stopForThisTime) return ;

    // console.log("got soft block");
    var tar = document.getElementById("blockerWrapper");
    if (tar != undefined) {
        getHowManyMinutesOnButton();
        if ($(tar).is(":visible") && !isFadingOut) {
            // already blocked
            // still need to check text
            chrome.runtime.sendMessage({"getCurrentMainMessage": "true"}, function (response) {
                if (response && response.mainMessage != undefined) {
                    var tar = $('#main_message');
                    if (tar.text() != response.mainMessage) {
                        tar.fadeOut('fast', function () {
                            tar.text(response.mainMessage);
                            tar.fadeIn('fast');
                        });
                    }
                }
            });
            return;
        }
        else {
            isFadingOut = false;
            $('#blockerWrapper').fadeIn("slow");
            // console.log("turn unvisible to visible");
            return;
        }
    }

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
        $("#remindMeLater").click(function () {
            var text = $('#remindMeLaterTime').text();
            var val = parseInt(text);

            $('#blockerWrapper').fadeOut("slow");
            chrome.runtime.sendMessage({"wait5Min": val}, function (response) {
                // console.log("wait5Min");
            });
        });
        $("#closeIt").click(function () {
            stopForThisTime = true;
            $('#blockerWrapper').fadeOut("slow");
        });
        //document.getElementById("main_message").textContent = "load!";

        getHowManyMinutesOnButton();
    });

}

function getHowManyMinutesOnButton() {
    chrome.runtime.sendMessage({checkHowManyMinutesShowOnButton:"none"},function (response) {
        if (response.res) $('#remindMeLaterTime').text(response.res);
    });
}


// resume window
window.addEventListener('focus', function() {
    chrome.runtime.sendMessage({resumePage:window.location.href},function(){
        // console.log("resume to browser " + window.location.href + " at " + new Date());
    });
});

// leave window
window.addEventListener('blur', function() {
    chrome.runtime.sendMessage({leavePage:window.location.href},function(){
        // console.log("leave browser " + window.location.href + " at " + new Date());
    });
});