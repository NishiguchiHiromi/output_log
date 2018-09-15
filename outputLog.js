var OutputLog = (function() {
    var originalConsoleLog = console.log;
    var originalConsoleInfo = console.info;
    var originalConsoleWarn = console.warn;
    var originalConsoleError = console.error;
    var customInfo = console.log.bind(null, "%c%s", "color:blue;");
    var customWarn = console.log.bind(null, "%c%s", "color:orange;");
    var customError = console.log.bind(null, "%c%s", "color:red;");
    var result = '';
    var isObject = function(value) {
        if (
            (Object.prototype.toString.call(value) === '[object Object]')
            && (!Array.isArray(value))
            && (value !== null)
            && (typeof value !== 'undefined')
        ) {
            return true;
        }
        return false;
    };

    //オブジェクトを文字列化する関数
    //JSON.stringify を利用して
    //  {valueA: 123, valueB: "123"}
    //という形式の文字列を作成する
    var objToString = function(obj) {
        var items = JSON.stringify(obj).split(',');
        items = items.map(function(element, index, array) {
            return element.replace(/(.+:)(.*)/,
                function(string, capture1, capture2) {
                    return capture1.replace(/\"/g, '') + capture2;
                }).replace(/:/g, ': ');
            //[:]の前後でcapture1/2に分割して、
            //その後に[:]の前だけ["]を削除して
            //[:]は[: ]に置換
        });
        return items.join(', ');
        //[,]は[, ]に置換
    };

    var getCallStack = function () {
        try {
            throw new Error("DUMMY");
        } catch(e) {
            var errorLog = e.stack.split(/[\r\n]+/);
            // originalConsoleLog(errorLog);
            // originalConsoleLog(errorLog[2]);
            var errorArray = errorLog
            .filter(function(v){
                return /^.*   at .*:[0-9]+:[0-9]+/.test(v);
            });
            if(errorArray.length > 0){// ie/edge/chrome
                return errorArray[3]
            }else{
                errorArray = errorLog
                .filter(function(v){
                    return v.startsWith("@file:");
                });
                if(errorArray.length > 0){// firefox
                    return errorArray[0]
                }
                return "場所不明"
            }
        }
    }

    var logMake = function(message, logType){
        var l = "";
        var now = new Date();
        l += now.toLocaleTimeString() + ":" + ("000" + now.getMilliseconds()).slice(-3);
        l += "\t"
        l += logType + " "
        l += "\t"
        if (isObject(message)) {
            l += objToString(message);
        } else {
            l += message;
        }
        l += "\t\t\t"
        l += getCallStack();
        result += l + "\n";
        return l;
    }
    
    var log = function(message) {
        var l = logMake(message, "log")
        originalConsoleLog(l)
    };

    var info = function(message) {
        var l = logMake(message, "info")
        customInfo(l)
    };

    var warn = function(message) {
        var l = logMake(message, "warn")
        customWarn(l)
    };

    var error = function(message) {
        var l = logMake(message, "error")
        customError(l)
    };

    var downLoad = function() {
        var now = new Date();
        var mimeType = 'text/plain';
        var name     = "log^" 
        // + now.toLocaleTimeString()
        + now
        + ".txt";

        // BOMは文字化け対策
        var bom  = new Uint8Array([0xEF, 0xBB, 0xBF]);
        var blob = new Blob([bom, result], {type : mimeType});

        if (window.navigator.msSaveBlob) {
            // for IE
            window.navigator.msSaveBlob(blob, name)
        }
        else if (window.URL && window.URL.createObjectURL) {
            $("<a>", {
                id : "myLog",
                href: window.URL.createObjectURL(blob),
                download: name
            }).appendTo('body');
            var a = $('#myLog')[0];
            a.click();
            $('#myLog').remove();
        }
        else {
            // for Safari
            window.open('data:' + mimeType + ';base64,' + window.Base64.encode(result), '_blank');
        }
        
    };

    var button
    var init = function(){
        if (typeof Blob !== "undefined") {
            if(!button){
                $('body').ready(function(){
                    $('body').append('<button id="export" >ろぐ</button>');
                    button = $("#export");
                    button.css("position","fixed")
                    button.css("z-index","2147483647")
                    button.css("top","10px")
                    button.css("right","10px")
                    // button.css("font-size","30px")
                    // button.width("75px")
                    // button.height("50px")
                    button.on("click", function(){  // 出力ボタンを押した場合は、setBlobUrl関数に値を渡して実行
                        downLoad();
                    });
                })
            }
            console.log = log;
            console.info = info;
            console.warn = warn;
            console.error = error;
        } else {
            alert('このブラウザには対応していません');
        }
    }
  
   
    // constructor
    var OutputLog = function() {
        init();
    };

    var p = OutputLog.prototype;
  
    p.enable = function() {
        init();
    };
    p.disable = function() {
        console.log = originalConsoleLog;
        console.info = originalConsoleInfo;
        console.warn = originalConsoleWarn;
        console.error = originalConsoleError;
        button.remove();
        button = null;
    };
    p.reset = function(){
        result = '';
    }
    p.downLoad = downLoad;
    p.error = function(){
        try {
            throw new Error("DUMMY");
        } catch(e) {
            originalConsoleLog(e.stack.split(/[\r\n]+/));
        }
    }
    return OutputLog;
})();
var outputLog = new OutputLog();







