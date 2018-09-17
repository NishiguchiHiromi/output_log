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
            var errorArray = errorLog.filter(function(v){
                return /^.*   at .*:[0-9]+:[0-9]+/.test(v);
            });
            if(errorArray.length > 0){// ie/edge/chrome
                return errorArray[3]
            }else{
                errorArray = errorLog.filter(function(v){
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
        var name     = "log^" + now + ".txt";

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
                    button.on("click", function(){
                        downLoad();
                    });
                })
            }
            console.log = log;
            console.info = info;
            console.warn = warn;
            console.error = error;
        } else {
            alert('outputLog.jsはこのブラウザには対応していません');
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

    // エラーstack解析用
    p.error = function(){
        try {
            throw new Error("DUMMY");
        } catch(e) {
            originalConsoleLog(e.stack.split(/[\r\n]+/));
        }
    }
    return OutputLog;
})();
// var outputLog = new OutputLog();

var googleDriveClient;
getGoogleAuth().then(loadGoogleDrive).then(function(gClient){
    googleDriveClient = gClient;
});

// google driveのクライアントの生成
function loadGoogleDrive() {
    var p = new Promise(function(resolve, reject) {
        try {
            window.gapi.client.load('drive', 'v3', fncOnDriveApiLoad);
        } catch (e) {
            reject(e);
        }
        function fncOnDriveApiLoad() {
            resolve(window.gapi.client);
        }
    });
    return p;
}

// Google認証
function getGoogleAuth() {
    var objAuthParam = {
        // クライアントIDはGoogle API consoleで取得してください
        'client_id': "286381776457-a9k7o4ol8t8omo653s9rgcah4qh406jj.apps.googleusercontent.com",
        'scope': ['https://www.googleapis.com/auth/drive'],
        'immediate': false
    };
    var p = new Promise(function(resolve, reject) {
        window.gapi.load('auth', {
            'callback': function () {
                window.gapi.auth.authorize(
                    objAuthParam,
                    authResult);
            }
        });
        function authResult(objAuthResult) {
            if (objAuthResult && !objAuthResult.error) {
                resolve(objAuthResult.access_token);
            } else {
                // auth failed.
                reject(objAuthResult);
            }
        }
    });
    return p;
}

// ファイルアップロード
function uploadFile(gClient, base64FileData, fileName, fileType) {
    // 固定文
    const boundary = '-------314159265358979323846';
    const delimiter = '\r\n--' + boundary + '\r\n';
    const closeDelim = '\r\n--' + boundary + '--';
    const contentType = fileType;

    // アップロード先のフォルダ指定など
    var metadata = {
        'name': fileName,
        'mimeType': contentType
    };
    var multipartRequestBody =
        delimiter +
        'content-type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'content-transfer-encoding: base64\r\n' +
        'content-type: ' + contentType + '\r\n\r\n' +
        base64FileData +
        closeDelim;
    var request = gClient.request({
        'path': '/upload/drive/v3/files',
        'method': 'POST',
        'params': {
            'uploadType': 'multipart'
        },
        'headers': {
            'Content-Type': 'multipart/related; boundary="' + boundary + '"'
        },
        'body': multipartRequestBody
    });
    try {
        request.execute(function (objFile) {
            console.log(objFile);
            console.info('upload success !');
        });
    } catch (e) {
        console.error(e);
    }
}

// ドロップゾーンにドラッグしている時のイベント
function dragOver(event) {
    event.preventDefault();
}

// ドロップした時のイベント
function drop(event) {
    if (event.dataTransfer && event.dataTransfer.files instanceof FileList && event.dataTransfer.files.length > 0) {
        // サンプルとして1ファイルのみとする
        var file = event.dataTransfer.files[0];
        var reader = new FileReader();
        // バイナリファイルをbase64に変換
        reader.readAsDataURL(file);
        reader.onload = function(e) {
            var arraySplitBase64 = '';
            if (typeof reader.result === 'string') {
                // base64データのデータ本部を抽出
                arraySplitBase64 = reader.result.split(',');
                // file upload
                uploadFile(googleDriveClient, arraySplitBase64[1], file.name, file.type);
            } else {
                throw 'read file error';
            }
        };
    }
    event.preventDefault();
}



