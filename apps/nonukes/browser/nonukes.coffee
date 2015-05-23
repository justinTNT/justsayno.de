
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


#  rearrange recently loaded titles, and make them big.
tameTits = ($context) ->
	$('.titles').not('.bigtext').each ()->
		$t = $(this).find '>.title'
		t = $t.text().split ' '
		if t.length > 10
			while t.length
				if (l=t.length)>10 then l = (l%20 or 18)/2
				$t.text t[0...l].join(' ')
				t = t[l..]
				if t.length then $t = $('<div class="title">').insertAfter $t
	$('.titles').not('.bigtext').bigtext()


# elemental updates for routes
callAfter = (route) ->
	tidyPix()
	tameTits()
	$("span.tags").click -> location.hash = "/tag/#{$(this).text()}"
	setupComments route


# adds the home/ edit buttons if there's an authorised session
runLoginAnim = (o) ->
	if o
		$("i.maybe-login").removeClass('icon-signin').addClass('icon-signout')
		if "admin" is o.handle then $("i.maybe-edit").addClass 'icon-edit'
	else
		$("i.maybe-edit").removeClass 'icon-edit'
		$("i.maybe-login").addClass('icon-signin').removeClass('icon-signout')


which_route = ""

$ ->
	runWithAuth runLoginAnim, true # if there's a session, update the controls ... but don't prompt for logon just yet ...
	justsayUpdate callAfter # setup link handling etc
	callAfter() # call for first hash
	setupEdit()
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
						tameTits()
						true
					), -> true


$(window).bind "load", ->			# make sure it gets called after the fonts are loaded,
	$('.titles').bigtext()			# otherwise it might have calculated it for the standard font


