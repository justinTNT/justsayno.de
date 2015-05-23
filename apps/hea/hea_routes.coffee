ft = require '../../justsayno.de/fieldtools'
track = require('./schema/track').name;

module.exports = (env)->

	Track = env.db.model track
	basetemps = [ {selector:'#boilerplate-container', filename:'hea.jade'} ]

	env.app.get '/', (req, res)->
		which_fields = {handle:'artist.value', artist:'artist'}
		temps = [{selector:'#artists', filename:'artist.jade'}]
		Track.find (err, artists)->
			if err then return res.send err
			allObjs = artist: ft.translateFields _.uniq(artists, (i)->i.handle), which_fields
			console.dir allObjs
			env.respond req, res, basetemps, temps, allObjs

	env.app.get '/:artist', (req, res)->
		which_fields = {link:'track.href', title:'track'}
		temps = [{selector:'.playlist', filename:'track.jade'}]
		Track.find {handle:req.params.artist}, (err, tracks)->
			if err then return res.send err
			tracks = _.map tracks, (t)->{title:t.title, link:"//#{env.s3.bucket}/homebrew/#{t.handle}/#{t.track}.mp3"}
			allObjs = tracks: ft.translateFields tracks, which_fields
			env.respond req, res, basetemps, temps, allObjs

