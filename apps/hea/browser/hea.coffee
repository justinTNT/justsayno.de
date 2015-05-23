which_route = ""

PP_CONFIG =
	flashVersion: 9
	usePeakData: true
	useWaveformData: false
	useEQData: false
	useFavIcon: true

pagePlayer = new PagePlayer()

callAfter = (route) ->
	if $('ul.playlist').length then pagePlayer.initDOM()

soundManager.onload = ->
	pagePlayer.initDOM()

$ ->
	justsayUpdate callAfter # setup link handling

	$('select#artists').change ->
		ar=$(this).val()
		$('ul.playlist').html ''
		if ar?.length and ar isnt 'selectartist'
			location.hash = ar

	$('select#downloads').change ->
		dl = $(this).val()
		if dl.match /.zip$/ then location.href = "/downloads/#{dl}"

