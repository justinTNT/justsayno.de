fs = require 'fs'
k = require 'knox'
path = require "path"

headers = { 'x-amz-acl': 'public-read' }


# ensures dir exists before running f
runInDir = (dir, f) ->
	fs.mkdir dir, 0o755, (err) ->
		if not err then return f()
		parent = dir.substr(0, dir.lastIndexOf '/')
		runInDir parent, (err) ->
			if err then return f(err)
			runInDir dir, f


module.exports = (env) ->

	if env.s3
		client = k.createClient env.s3

	getNearestName = (filename, pathname, cb, extension, count) ->
		if not count
			count = 0
			extension = path.extname filename
			filename = path.basename filename, extension
			countstr = ""
		else countstr = "_#{count}"
		statthis = "#{pathname}/#{filename}#{countstr}#{extension}"
		if client
			client.headFile statthis, headers, (err)->
				if err
					count++
					getNearestName filename, pathname, cb, extension, count
				else cb "#{filename}#{countstr}#{extension}"
		else
			runInDir statthis, (err)->
				if not err
					fs.stat statthis, (err, stats) ->
						if err
							count++
							getNearestName filename, pathname, cb, extension, count
						else cb "#{filename}#{countstr}#{extension}"

	# from: path to /tmp file to load into static bucket / path
	# to: relative destination path of file
	# cb: (err, filename) where filename is the (potentially revised) filename
	return (from, to, cb) ->
		if not client
			to = "#{process.cwd()}/apps/static/public/#{to}"
		getNearestName from, to, (err, newname) ->
			if newname then filename = newname
			else filename = path.basename from
			if client
				client.putFile from, "#{to}/#{filename}", headers, (err, res) ->
					if err
						cb err
					if res.statusCode == 200
						cb null, filename
					else cb res.statusCode
			else
				fs.rename from, "#{to}/#{filename}", (err) ->
					if err then cb err
					else cb null, filename

