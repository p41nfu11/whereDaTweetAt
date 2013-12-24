var fs = require('fs');
var logFileName = "whereDaTweetAt.log";
var logFileMAX = 10.0; //IN MB

function getFilesizeInBytes(filename) {
    var stats = fs.statSync(filename);
    var fileSizeInBytes = stats["size"];
    return fileSizeInBytes;
}

function truncateFile(fileName){
    fs.open(fileName,"w",function(err,fd){
        console.log("Log file Cleared");
        fs.close(fd);
    });
}

function deleteFile(fileName){
    fs.unlink(fileName, function (err) {
        if (err) throw err;
        console.log('successfully deleted ' + fileName);
    });
}

setInterval(function(){
    fs.exists(logFileName, function(exists) {
        if (exists) {
            var size = getFilesizeInBytes(logFileName);
            var sizeInMB = size/1000000.0;
            console.log ("Log File Size is : " + sizeInMB + " MB" );
            if(sizeInMB>=logFileMAX){
                console.log("Log File Too Big..truncating...");
                truncateFile(logFileName);
            }
        }
        else {
            console.log("Log File is Missing");
            truncateFile(logFileName); //create a new blank one
        }
    });
},3000);