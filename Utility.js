
function sortList(list){
    var temp = list.slice(0);
    // sorting
    temp.sort(function(aa,bb){
        if(aa < bb) return -1;
        else if(aa > bb) return 1;
        else return 0;
    });
    return temp;
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

function purifyUrl(url){

    // eliminate prefix http:// or https://
    var i,j,k;

    var pure = cutOffHeadAndTail(url);

    var spSlash = pure.split("/");
    var purified = "";
    for(i=0;i<spSlash.length;i++){
        var spDot = spSlash[i].split(".");
        var temp = "";
        for(j=0;j<spDot.length;j++){
            var valid = true;
            for(k=0;k<ignore.length;k++){
                var ignoreStr = ignore[k];
                if(spDot[j]==ignoreStr) {
                    valid = false;
                    break;
                }
            }
            if(valid == true) {
                if (temp == "") temp += spDot[j];
                else{
                    temp += ("."+spDot[j]);
                }
            }
        }
        if(temp!="") {
            if (purified == "") {
                purified += temp;
            }
            else {
                purified += ("/" + temp);
            }
        }
    }

    //console.log("purified = " + purified);

    return purified;
}

function clearLast(str){
    var i, pivot=-1;
    for(i=str.length-1;i>=0;i--){
        if(str[i]=='/') {
            pivot=i;
            break;
        }
    }

    if(pivot==-1) return "";
    else{
        return str.substring(0,pivot);
    }

}

function getCurrentTab(callback) {
    var queryInfo = {
        active: true,
        currentWindow: true
    };

    chrome.tabs.query(queryInfo, function(tabs) {
        var tab = tabs[0];

        callback(tab);
    });
}

function getCurrentTabUrl(callback) {
  var queryInfo = {
    active: true,
    currentWindow: true
  };

  chrome.tabs.query(queryInfo, function(tabs) {
    var tab = tabs[0];
    var url = tab.url;
    //console.assert(typeof url == 'string', 'tab.url should be a string');

    currentTab = tab;

    callback(url);
  });

}

