var sys = require("sys");
var fs = require("fs");
var path = require("path");

var im = require('imagemagick');


var pathname = "/home/ec2-user/justsayno.de/apps/pathname/browser/images";

function convert (files, count) {

	if (! files.length) return;
	var f = files.shift();
console.log("file " + f);
    if (!f|| !f.length) return f;

	count++;
	console.log(count + " " + f);
    var src_image = pathname + "/jlj/" + f;
    var dest_image = pathname + "/" + count + ".jpg"

	im.resize({srcPath:src_image, progressive:true, quality:1, filter:'Box', dstPath:dest_image, width:1024}, function(err, stdout, stderr){
		console.log('resized ' + src_image + ' to ' + dest_image);
		if (err) console.log('err: ' + stderr);
		else console.log(stdout);
		convert(files, count);
	});
}


fs.readdir(pathname+"/jlj/", function(err1, files){
	if(err1){ 
		console.log(err1);
	} else {
		console.log(pathname);
		files.sort();
		convert(files, 0);
	}
});

