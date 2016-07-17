

function addToBlackList(){
    getCurrentTabUrl(function(url){

        // check if already exist
        for(var i=0; i<blackList.length;i++){
            if(blackList[i]==url) return;
        }

        blackList.push(url);
        saveFile();
    });
}

function saveFile(){
    // save lists
    var i,j;
    var str;

    str = "";
    for(j=0;j<whiteList.length;j++) {
        if(str=="") str = whiteList[j];
        else{
            str+= ("::"+whiteList[j]);
        }
    }
    chrome.storage.local.set({'whiteListData': str});

    str = "";
    for(j=0;j<blackList.length;j++) {
        if(str=="") str = blackList[j];
        else{
            str+= ("::"+blackList[j]);
        }
    }
    chrome.storage.local.set({'blackListData': str});

    chrome.storage.local.set({'needReload': true});
}

function loadFile(callBack){
    // get list
    var i;
    chrome.storage.local.get("whiteListData",function(data){
        var str = data.whiteListData;
        whiteList = [];

        if(str!=undefined) {
            var spw = str.split("::");
            for (i = 0; i < spw,length; i++) {
                whiteList[i] = spw[i];
            }
        }

        // load black
        chrome.storage.local.get("blackListData",function(data){
            var str = data.blackListData;
            blackList = [];
            if(str!=undefined) {
                var spb = str.split("::");
                for (i = 0; i < spb.length; i++) {
                    blackList[i] = spb[i];
                }
            }


            // purify just read lists
            purifiedBlack = [];
            for (i = 0; i < blackList.length; i++) {
                purifiedBlack.push(purifyUrl(blackList[i]));
            }
            
            purifiedWhite = [];
            for (i = 0; i < whiteList.length; i++) {
                purifiedWhite.push(purifyUrl(whiteList[i]));
            }

            if(callBack!=undefined) callBack();

        });

    });

}

function test(){
    // get list
    var i;
    chrome.storage.local.get("whiteListData",function(data){
        var str = data.whiteListData;
        console.log("load: " + str);
        //whiteList = [];

        if(str!=undefined) {
            var spw = str.split("::");
            for (i = 0; i < spw.length; i++) {
                whiteList[i] = spw[i];
            }
        }

        // load black
        chrome.storage.local.get("blackListData",function(data){
            var str = data.blackListData;
            console.log("load: " + str);
            //blackList = [];
            if(str!=undefined) {
                var spb = str.split("::");
                for (i = 0; i < spb.length; i++) {
                    blackList[i] = spb[i];
                }
            }

        });

    });

}