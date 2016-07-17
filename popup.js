
var blackList = [
    "www.facebook.com",
    "m.facebook.com"
];

var whiteList = [
    "www.facebook.com/profile"
];

var ignore = [
    "www",
    "com",
    "tw",
    "m",
    "cn",
    "us",
    "jp"
];

var purifiedBlack;
var purifiedWhite;

window.addEventListener("DOMContentLoaded", function() {

    loadFile();
    document.getElementById("test").addEventListener("click", test);
    document.getElementById("add").addEventListener("click", addToBlackList);

    console.log("blacks: " + blackList.toString());

});

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

function purifyUrl(url){

    // eliminate prefix http:// or https://
    var i,j,k;
    var pure='', prev, cur, start_pos=-1;
    for(i=1;i<url.length;i++){
        prev = url[i-1];
        cur = url[i];
        if(prev=='/' && cur=='/'){
            start_pos = i+1;
            continue;
        }
        if(start_pos!=-1){
            pure += url[i];
        }
    }

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