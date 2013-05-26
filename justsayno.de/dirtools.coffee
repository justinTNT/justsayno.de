
###
# get the list of files found in the named directory,
# and pass on for processing.
# cb is passed the contents of each file,
# fcb is called when we're all done
###
read_dir = (dirname, cb, fcb) ->
	fs.readdir dirname, (err, files) ->
		if not err then return eachfile dirname, files, cb, fcb
		if err.code is 'ENOENT'
			console.log "directory not found : #{dirname}"
			return fcb?()
		console.log "failed to read_dir : #{dirname}"
		console.dir err
		throw err


###
# reads contents of named file from specified directory,
# and returns the contents (as a string) to the callback
###
read_file = (dname, fname, cback) ->
	fs.readFile "#{dname}/#{fname}", (err, data) -> # read in the file contents
		if not err then return cback fname, String(data)
		console.dir err						# debug
		console.log "failed to read_file #{dname}/#{fname}"		# debug
		throw err


###
# for a list of files already derived from the named directory,
# iterate through the list, calling cb with the contents of each file,
# then calling fcb once they're all processed
###
eachfile = (dirname, files, cb, fcb) ->
	if not (fn = files.shift()) then return fcb?()
	read_file dirname, fn, (cbfname, text) ->
		cb cbfname, text
		eachfile dirname, files, cb, fcb


###
# for a list of files already derived from the named directory,
# iterate through the list, calling cb with the name of each file,
# then calling fcb once they're all processed
###
touch_file = (files, op, fcb) ->
	if not (fn = files.shift()) then return fcb?()
	op fn, -> touch_file files, op, fcb


###
# get the list of files found in the named directory,
# and pass on for processing.
# op is passed the name of each file, and a continuation callback
# fcb is called when we're all done
###
touch_dir = (dirname, op, fcb) ->
	fs.readdir dirname, (err, files) ->
		if not err then return touch_file files, op, fcb
		if err.code is 'ENOENT'
			console.log "directory not found: #{dirname}"
			return fcb?()
		console.log "failed to touch : #{dirname}"
		console.dir err
		throw err

fs = require("fs")
exports.eachfile = eachfile
exports.read_dir = read_dir
exports.touch_dir = touch_dir
