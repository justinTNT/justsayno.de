# keeps track of which schema in which app we're werking on : leading slash
callFirst = ->
	true

#  change layout depending on whether there's a story, or just an image
tidyPix = ($context) ->
	$("div.story").not('.alreadytidied').each ->
		$(this).addClass 'alreadytidied'
		$t = $(this).find(".teaser")
		$i = $(this).find("img.image")
		s = $i?.attr('src')
		if $t.text().length
			if s?.length then $i.wrap "<div class='imgwrapper'>"
			else $i.remove()
		else
			if s?.length then $i.wrap "<p align='center'>"


#
# elemental updates for routes
#
callAfter = (route) ->
	tidyPix()
	$("span.tags").click -> location.hash = "/tag/#{$(this).text()}"
	setupComments route

#
# * adds the home/ edit buttons if there's an authorised session
#
runLoginAnim = (o) ->
	if o
		$("i.maybe-login").removeClass('icon-signin').addClass('icon-signout')
		if "admin" is o.handle then $("i.maybe-edit").addClass 'icon-edit'
	else
		$("i.maybe-edit").removeClass 'icon-edit'
		$("i.maybe-login").addClass('icon-signin').removeClass('icon-signout')

editInPlace = ($d, tag, id) ->
	$d.find(tag + "#" + id).click ->
		r = "input"
		v = $(this).text()
		if tag is "p"
			r = "textarea"
			$(this).replaceWith "<" + r + " id='" + id + "' class='canhide'>" + v + "</" + r + ">"
		else
			$(this).replaceWith "<" + r + " id='" + id + "' class='canhide' value='" + v + "'/>"
		$d.find(r + "#" + id).focus().blur ->
			v = $(this).val()
			if v.length
				$(this).replaceWith "<" + tag + "	id='" + id + "' class='canhide'>" + v + "</" + tag + ">"
				$d.find("img#postimg").attr("src", v).removeClass "hide4now"	if id is "image"
			else
				$d.find("img#postimg").addClass "hide4now"	if id is "image"
			editInPlace $d, tag, id


looksLikeImage = (u) ->
	lastfour = u.substr(u.length - 4).toLowerCase()
	lastfive = u.substr(u.length - 5).toLowerCase()
	lastfour is ".jpg" or lastfour is ".gif" or lastfour is ".png" or lastfive is "jpeg"


addTag = (t) ->
	if not t or not t.length then return
	$t = $("<span class='tags'>#{t}<i class='icon-remove-sign'></i></span>")
	$('.intaglist .taglist').append $t
	$t.find('i').click ->
		$(this).parent().remove()

which_route = ""

$ ->
	runWithAuth runLoginAnim, true # if there's a session, update the controls ... but don't prompt for logon just yet ...
	justsayUpdate callAfter # setup link handling etc
	callAfter() # call for first hash
	$("i.maybe-edit").hover((->
		$(this).addClass "hoverbutt"
	), (->
		$(this).removeClass "hoverbutt"
	)).click ->
		user = runWithAuth()
		if not user or "admin" isnt user.handle then return false

		$("body").prepend justGetFrag("inform.jade")
		$d = $("div#modal")
		$("i.icon-remove-sign").hover((->
			$(this).addClass "hoverbutt"
		), (->
			$(this).removeClass "hoverbutt"
		)).click ->
			$d.remove()
			$("div#modalbg").remove()

		editInPlace $d, "h1", "title"
		editInPlace $d, "p", "description"
		editInPlace $d, "span", "image"
		$d.find("input#url").change ->
			u = $(this).val()
			u = "http://" + u	unless u.substr(0, 7) is "http://"
			$(this).parent().find(".canhide").addClass "hide4now"
			if looksLikeImage(u)
				$d.find("span#image").text u
				$d.find("img#postimg").attr("src", u).removeClass("hide4now").parent().removeClass "hide4now"
				$d.find("button").removeClass "hide4now"
			else if $(this).val().length
				justsayMakeTheCall "/consider/" + encodeURIComponent(u), (call, ansarr) ->
					$d.find("span#image").text ansarr[0].image
					$d.find("img#postimg").attr "src", ansarr[0].image
					$d.find("p#description").text ansarr[0].description
					$d.find("h1#title").text ansarr[0].title
					$d.find(".hide4now").removeClass "hide4now"
					true

		$d.find("button").click ->
			u = $d.find("input#url").val()
			u = "http://" + u	unless u.substr(0, 7) is "http://"
			payload =
				url: u
				comment: $d.find("textarea#comment").val()

			unless looksLikeImage(u)
				payload.image = $d.find("span#image").text()
				payload.description = $d.find("p#description").text()
				payload.title = $d.find("h1#title").text()
				$tags = $('.intaglist .taglist').find('.tags')
				if $tags.length
					payload.tags = []
					$tags.each -> payload.tags.push $(this).text()
			justsayAJAJ "/blog/", (->
				$d.remove()
				$("div#modalbg").remove()
			), ((err) ->
				$d.find("input#url").addClass "error"
			), payload

		$d.find('input.intag, select.intag').change ->
			addTag $(this).val()
			$(this).val('')

		justsayAJAJ "/tags", (tags)->
			for tag in tags
				$d.find('select.intag').append "<option value='#{tag}'>#{tag}</option>"

	$("i.maybe-login").hover((->
		$(this).addClass "hoverbutt"
	), (->
		$(this).removeClass "hoverbutt"
	)).click ->
		if runWithAuth()
			runWithAuth null
			runLoginAnim()
		else
			runWithAuth runLoginAnim

	$(window).scroll ->
		$("div.paginationlink").find("a.nextlink").each ->
			$a = $(this)
			h = $a.attr("href")
			if h and h.length
				if $(window).scrollTop() + $(window).height() > $a.offset().top + 53
					justsayMakeTheCall h, ((call, $temp, $dest) ->
						$a.parent().replaceWith $temp.html()
						tidyPix()
						true
					), callFirst


