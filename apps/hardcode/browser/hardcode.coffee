# elemental updates for routes
callAfter = (route) ->
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
						true
					), -> true


$(window).bind "load", ->		# make sure it gets called after its all loaded
	return						# do stuff after its all loaded


