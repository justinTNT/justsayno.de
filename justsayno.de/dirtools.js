
var fs = require('fs');


/*
 * get the list of files found in the named directory,
 * and pass on for processing.
 * cb is passed the contents of each file,
 * fcb is called when we're all done
 */
function read_dir (dirname, cb, fcb) {
	fs.readdir(dirname, function(err, files){
		if (err) {
			console.log('failed to read : ' + dirname);
			throw err;
		}
		eachfile(dirname, files, cb, fcb);
	});
}

/*
 * reads contents of named file from specified directory,
 * and returns the contents (as a string) to the callback
 */
function read_file(dname, fname, cback) {
	fs.readFile(dname + '/' + fname, function (err, data) {	// read in the file contents
		if (err) {
			console.log(err);	// debug
			console.log(dname + '/' + fname);	// debug
			throw err;
		} else cback(fname, String(data));
	});
}

/*
 * for a list of files already derived from the named directory,
 * iterate through the list, calling cb with the contents of each file,
 * then calling fcb once they're all processed
 */
function eachfile(dirname, files, cb, fcb) {
	var fn = files.shift();
	if (fn) {
		read_file(dirname, fn, function(cbfname, text) {
			cb(cbfname, text);
			eachfile(dirname, files, cb, fcb);
		});
	} else if (fcb) fcb();
}


/*
 * for a list of files already derived from the named directory,
 * iterate through the list, calling cb with the name of each file,
 * then calling fcb once they're all processed
 */
function touch_file(files, op, fcb) {
	var fn = files.shift();
	if (fn) {
		op(fn, function() {
			touch_file(files, op, fcb);
		});
	} else if (fcb) fcb();
}


/*
 * get the list of files found in the named directory,
 * and pass on for processing.
 * op is passed the name of each file, and a continuation callback
 * fcb is called when we're all done
 */
function touch_dir (dirname, op, fcb) {
	fs.readdir(dirname, function(err, files){
		if (err) {
			console.log('failed to touch : ' + dirname);
			throw err;
		}
		touch_file(files, op, fcb);
	});
}


exports.eachfile = eachfile;
exports.read_dir = read_dir;
exports.touch_dir = touch_dir;
