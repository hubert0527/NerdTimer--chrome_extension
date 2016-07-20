
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

chrome.extension.onMessage.addListener(function(msg, sender, sendResponse) {

    if(msg && msg.block=="hard"){
        console.log("got hard block");
        /**
         * TODO: implement hard block html
         */
        var iDiv = document.createElement('div');
        iDiv.id = "nerdDiv";

        document.getElementsByTagName("BODY")[0].appendChild(iDiv);

        var path = chrome.extension.getURL("blocker.html");
        $('#nerdDiv').load(path,function(){
            /**
             * write script for loaded blocker html here
             */
            $("#remindMeLater").css("display","none");
            $("#closeIt").css("display","none");
        });
    }
    else if (msg && msg.block=="soft") {

        if(stopForThisTime) return ;

        console.log("got soft block");
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
                console.log("turn unvisible to visible");
                return;
            }
        }

        var iDiv = document.createElement('div');
        iDiv.id = "nerdDiv";

        document.getElementsByTagName("BODY")[0].appendChild(iDiv);

        var path = chrome.extension.getURL("blocker.html");
        $('#nerdDiv').load(path,function(){
            /**
             * write script for loaded blocker html here
             */
            $("#remindMeLater").click(function(){
                $('#blockerWrapper').fadeOut("slow");
                chrome.runtime.sendMessage({"wait5Min":"true"}, function(response) {
                    console.log("wait5Min");
                });
            });
            $("#closeIt").click(function(){
                stopForThisTime = true;
                $('#blockerWrapper').fadeOut("slow");
            });
            //document.getElementById("main_message").textContent = "load!";
        });

    }
    else if(msg && msg.block=="false"){
        $('#blockerWrapper').fadeOut("slow");
    }
    else if(msg.modifyMainMessage!=undefined){
        var tar = document.getElementById("main_message");
        if(tar) $(tar).text(msg.modifyMainMessage);
    }
},false);
