
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

function init() {
    checkUserLayout(function (code) {
        createNerdDiv(code);
    });

    chrome.extension.onMessage.addListener(nerdTimerMessageListener);

    // resume window
    window.addEventListener('focus',sendResumePageMessage);
    // leave window
    window.addEventListener('blur',sendLeavePageMessage);

}
init();

function nerdTimerMessageListener(msg, sender, sendResponse) {

    if(!msg) return;

    if (msg.block=="soft") {
        doSoftBlock();
    }
    else if(msg.block=="false" || msg.block=="white" || msg.block=="none"){
        isFadingOut = true;
        $('#nerdDiv').fadeOut("slow",function () {
            isFadingOut = false;
        });
    }
    // use undefined cuz message might be empty string
    else if(msg.modifyMainMessage !=undefined){
        var tar = document.getElementById("nerdTimerMainMessage");
        if(tar) $(tar).text(msg.modifyMainMessage);
    }
    // else if(msg.blockListChange){
    //     chrome.runtime.sendMessage({checkIfInList:"none"},function (res) {
    //         if (res && res.block=="soft") {
    //             doSoftBlock();
    //         }
    //         else if(res && (res.block=="false"||res.block=="white"||res.block=="none")){
    //             isFadingOut = true;
    //             $('#nerdTimerBlockerWrapper').fadeOut("slow",function () {
    //                 isFadingOut = false;
    //             });
    //         }
    //     });
    // }
    else if(msg.waitNMinutesButtonChange){
        var time = parseInt(msg.waitNMinutesButtonChange);
        $('#nerdTimerRemindMeLaterTime').text(time.toString());
    }
    else if(msg.updateNerdDivCode){
        if(msg.version>0 && msg.version!=currentVersion){
            currentVersion = msg.version;
            $('#nerdDiv').fadeOut('slow',function () {
                $('#nerdDiv').remove();
                createNerdDiv(msg.updateNerdDivCode);
            });
        }
    }
}

function useUserLayout(code) {
    var cssIndex = code.indexOf('<style>');
    var cssEnd = code.indexOf('</style>');
    var jsIndex = code.indexOf('<script>');
    var jsEnd = code.indexOf('</script>');
    var css,js;
    if(cssIndex!=-1 && cssEnd!=-1){
        css = code.substring(cssIndex,cssEnd+7);
    }
    if(jsIndex>=0 && jsEnd!=-1){
        js = code.substring(jsIndex,jsEnd+7);
    }

    var doc = document.createElement('div');
    doc.innerHTML = code;
    // innerHTML only records html
    var html = doc.innerHTML;

    console.log('html='+html);
    console.log('css='+css);
    console.log('js='+js);
}

// function doHardBlock(){
//     // console.log("got hard block");
//
//     var tar = document.getElementById("nerdTimerBlockerWrapper");
//     if(tar!=undefined){
//         if($(tar).is(":visible")) {
//             // already blocked
//             // still need to check text
//             chrome.runtime.sendMessage({"getCurrentMainMessage":"true"}, function(response) {
//                 if(response && response.mainMessage!=undefined) {
//                     var tar = $('#nerdTimerMainMessage');
//                     if(tar.text()!=response.mainMessage) {
//                         tar.fadeOut('fast', function () {
//                             tar.text(response.mainMessage);
//                             tar.fadeIn('fast');
//                         });
//                     }
//                 }
//             });
//             return;
//         }
//         else{
//             $('#nerdTimerBlockerWrapper').fadeIn("slow");
//             // console.log("turn unvisible to visible");
//             return;
//         }
//     }
//
//     var iDiv = document.createElement('div');
//     iDiv.id = "nerdDiv";
//
//     var body = document.getElementsByTagName("BODY")[0];
//     if(body){
//         body.appendChild(iDiv);
//     }
//     else{
//         document.getElementsByTagName("HTML")[0].appendChild(iDiv);;
//     }
//
//
//     var path = chrome.extension.getURL("blocker.html");
//     $('#nerdDiv').load(path,function(){
//         /**
//          * write script for loaded blocker html here
//          */
//         $("#nerdTimerRemindMeLater").css("display","none");
//         $("#nerdTimerCloseIt").css("display","none");
//     });
// }

var currentVersion=0;

function checkUserLayout(callback) {
    chrome.runtime.sendMessage({blockerLayoutVersionCheck:'none'},function (res) {

        // console.log('v='+res.version+' code='+res.code);

        var version = res.version;
        if(version>0) currentVersion = version;

        var code;
        if(res) code = res.code;
        if(callback) callback(code);
    });
}

function doSoftBlock(){

    if(stopForThisTime) return ;

    // console.log("got soft block");
    var tar = document.getElementById("nerdTimerBlockerWrapper");
    if (tar != undefined) {
        getHowManyMinutesOnButton();
        if ($('#nerdDiv').is(":visible") && !isFadingOut) {
            // already blocked
            // still need to check text
            requestMainMessage();
        }
        else {
            isFadingOut = false;
            $('#nerdDiv').fadeIn("slow");
            // console.log("turn unvisible to visible");
        }
    }
}

function createNerdDiv(code) {

    // remove previous nerDiv if exist
    $('#nerdTimerRemindMeLater').off('click');
    $('#nerdTimerCloseIt').off('click');
    $('#nerdDiv').remove();

    var iDiv = document.createElement('div');
    iDiv.id = "nerdDiv";

    var body = document.getElementsByTagName("BODY")[0];
    if (body) {
        body.appendChild(iDiv);
    }
    else {
        document.getElementsByTagName("HTML")[0].appendChild(iDiv);
    }

    // if uses user defined html
    if(code){
        $('#nerdDiv').html(code)
            .hide();
        prepareNerdDivContent();
        addNerdDivBasicStyle();
    }
    else {
        var path = chrome.extension.getURL("blocker.html");
        $('#nerdDiv').load(path, function () {
            addNerdDivBasicStyle();
            prepareNerdDivContent();
        }).hide();
    }
}

function addNerdDivBasicStyle() {
    $('#nerdDiv').css({
        top:'0',
        left:'0',
        position: 'fixed',
        'z-index': 2147483647
    });
}

function prepareNerdDivContent() {

    /**
     * write script for loaded blocker html here
     */
    $("#nerdTimerRemindMeLater").click(function (event) {
        event.preventDefault();
        var text = $('#nerdTimerRemindMeLaterTime').text();
        var val = parseInt(text);

        $('#nerdDiv').fadeOut("slow");
        chrome.runtime.sendMessage({"wait5Min": val}, function (response) {
            // console.log("wait5Min");
        });
    });
    $("#nerdTimerCloseIt").click(function (event) {
        event.preventDefault();
        stopForThisTime = true;
        $('#nerdDiv').fadeOut("slow");
    });

    requestBlockState();
    requestMainMessage();
    getHowManyMinutesOnButton();
}

function requestBlockState() {

    //TODO: request query tab url from background script for NEWTAB
    var url = cutOffHeadAndTail(window.location.href);
    console.log(url);

    // newtab is an exception
    chrome.runtime.sendMessage({"pageJustLoaded": url}, function (response) {
        if(!response) return;

        if (response.block=="soft") {
            doSoftBlock();
        }
        else if(response.block=="false" || response.block=="white" || response.block=="none"){
            isFadingOut = true;
            $('#nerdDiv').fadeOut("slow",function () {
                isFadingOut = false;
            });
        }
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

function sendResumePageMessage() {
    try{
        chrome.runtime.sendMessage({resumePage:window.location.href},function(){
            // console.log("resume to browser " + window.location.href + " at " + new Date());
        });
    }catch (e){
        // can't remove handler, need fix
    }
}

function sendLeavePageMessage() {
    try {
        chrome.runtime.sendMessage({leavePage: window.location.href}, function () {
            // console.log("leave browser " + window.location.href + " at " + new Date());
        });
    }catch (e){
        // can't remove handler, need fix
    }
}

function cutOffHeadAndTail(url){
    var i;
    var pure='', prev, cur, start_pos=-1;
    var alreadyPure = true;
    for(i=1;i<url.length-1;i++){
        prev = url[i-1];
        cur = url[i];
        if(prev=='/' && cur=='/'){
            start_pos = i+1;
            alreadyPure = false;
            continue;
        }
        if(start_pos!=-1){
            pure += url[i];
        }
    }
    if(url[i]!='/') pure+=url[i];

    if(alreadyPure){
        // still need to cut off tail
        if(url[url.length-1]=='/') {
            return url.substring(0, url.length-1);
        }
        else{
            return url;
        }
    }

    return pure;
}