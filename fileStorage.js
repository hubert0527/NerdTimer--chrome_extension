function saveFile(callBack){
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
    chrome.storage.local.set({'whiteListData': str},function(){
        str = "";
        for(j=0;j<blackList.length;j++) {
            if(str=="") str = blackList[j];
            else{
                str+= ("::"+blackList[j]);
            }
        }
        chrome.storage.local.set({'blackListData': str},function(){

            str = "";
            for(j=0;j<singleWhite.length;j++) {
                if(str=="") str = singleWhite[j];
                else{
                    str+= ("::"+singleWhite[j]);
                }
            }
            chrome.storage.local.set({'singleWhiteData': str},function(){

                str = "";
                for(j=0;j<singleBlack.length;j++) {
                    if(str=="") str = singleBlack[j];
                    else{
                        str+= ("::"+singleBlack[j]);
                    }
                }
                chrome.storage.local.set({'singleBlackData': str},function(){

                    chrome.storage.local.set({'needReload': true},function(){
                        if(callBack!=undefined) callBack();
                    });

                });

            });

        });

    });

}


function loadFile(callBack,tab){
    // get list
    var i;
    chrome.storage.local.get("whiteListData",function(data){
        var str = data.whiteListData;
        whiteList = [];

        if(str!=undefined) {
            var spw = str.split("::");
            for (i = 0; i < spw.length; i++) {
                whiteList.push(spw[i]);
            }
        }

        // load black
        chrome.storage.local.get("blackListData",function(data){
            var str = data.blackListData;
            blackList = [];
            if(str!=undefined) {
                var spb = str.split("::");
                for (i = 0; i < spb.length; i++) {
                    blackList.push(spb[i]);
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

            chrome.storage.local.get("singleBlackData",function(data) {
                var str = data.singleBlackData;
                singleBlack = [];
                if (str != undefined) {
                    var spsb = str.split("::");
                    for (i = 0; i < spsb.length; i++) {
                        singleBlack.push(spsb[i]);
                    }
                }
                chrome.storage.local.get("singleWhiteData",function(data) {
                    var str = data.singleWhiteData;
                    singleWhite = [];
                    if (str != undefined) {
                        var spsw = str.split("::");
                        for (i = 0; i < spsw.length; i++) {
                            singleWhite.push(spsw[i]);
                        }
                    }

                    if(callBack!=undefined) callBack(tab);

                });
            });

        });

    });

}

function test(){
    // get list
    var i;
    chrome.storage.local.get("whiteListData",function(data){
        var str = data.whiteListData;
        console.log("load white: " + str);
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
            console.log("load black: " + str);
            //blackList = [];
            if(str!=undefined) {
                var spb = str.split("::");
                for (i = 0; i < spb.length; i++) {
                    blackList[i] = spb[i];
                }
            }

            chrome.storage.local.get("singleBlackData",function(data) {
                var str = data.singleBlackData;
                console.log("load single black: " + str);
                singleBlack = [];
                if (str != undefined) {
                    var spsb = str.split("::");
                    for (i = 0; i < spsb.length; i++) {
                        singleBlack.push(spsb[i]);
                    }
                }
                chrome.storage.local.get("singleWhiteData",function(data) {
                    var str = data.singleWhiteData;
                    console.log("load single white: " + str);
                    singleWhite = [];
                    if (str != undefined) {
                        var spsw = str.split("::");
                        for (i = 0; i < spsw.length; i++) {
                            singleWhite.push(spsw[i]);
                        }
                    }


                });
            });

        });

    });

}