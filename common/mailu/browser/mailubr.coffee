
callFirst = -> true		# all good


validateRegoForm = ($f)->
	$field = $f.find("input[type='password']")
	pass = $field.val()
	if not $f.hasClass('edit')
		if pass?.length < 8 then return $field
	$field = $f.find("input.email")
	mail = $field.val()
	if mail?.length is 0
		if $f.hasClass('edit') then return null
		else return $field
	unless mail.match /^[a-zA-Z0-9_\-\.]+@([a-zA-Z0-9-]+\.)+[a-zA-Z0-9-]+$/ then return $field
	return null

setupRegoForm = ($f)->
	unless $f?.length then return
	$f.find('.regoitem input').focus ->
		$(this).removeClass 'error'
		$(this).parent().find('i.icon-info-sign').fadeIn('slow')
		$(this).parent().find('p.desc').hide()
		$(this).parent().find('div.desc').fadeIn()
	.blur ->
		$(this).parent().find('i.icon-info-sign').hide()
		$(this).parent().find('.desc').fadeOut()
	.change ->
		$f.find('div.errmsg').text ''
		disflag = true
		$f.find('input').each ->
			if this.type is 'text' or this.type is 'password'
				if $(this).val().length then disflag = false
		$f.find("[type='submit']").prop 'disabled', disflag

	$f.find('i.icon-info-sign').hover ->
		$(this).parent().find('div.desc').hide()
		$(this).parent().find('p.desc').fadeIn()
	, ->
		$(this).parent().find('p.desc').hide()
		if $(this).css('display') isnt 'none'
			$(this).parent().find('div.desc').fadeIn()
	$f.find('input.cancel').click ->
		if $f.hasClass 'edit' then location.hash = "/"	# no need to display confirmation code
		else location.hash = '/deregister'
	$f.find("[type='submit']").click ->
		if $error = validateRegoForm($f)
			$f.find('div.errmsg').text "Invalid #{$error.attr 'name'}"
			$error.addClass 'error'
		else justsayAJAJ $f.attr("action"), ()->	# success!
			if $f.hasClass 'edit'
				if not $f.find("input[type='text']").val().length	# no new password ...
					return location.hash = "/"	# no need to display confirmation code
			location.hash = "/confirm"
		, (errstr, code)->		# error ...
			if code is 409 then type = 'text'	# conflict - email already used
			else type = 'password' # what else could go rong? probably password??
			$f.find("input[type='#{type}']").addClass 'error'
			$f.find('div.errmsg').text errstr
		, $f.serialize()
		false


which_route = ''

# elemental updates for routes

callAfter = (route) ->
	which_route = route
	unless route?.length
		return location.hash = "/register"

	$("a.logout").click ->
		runWithAuth null
	$("a.login").click ->
		if runWithAuth() then runWithAuth null
		else runWithAuth runLoginAnim

	user = runWithAuth()
	if user
		if which_route is "user/#{user.handle}" then $('div#edithomebutt').text '\uf044'
		else $('div#edithomebutt').text '\uf015'

	$('div.rego input.handle').focus(->
		$(this).removeClass 'error'
	).change ->
		$('div.rego div.errmsg').text ''
		justsayAJAJ '/preregister', (s)->
			location.hash = '/registration'	# server could redirect instead of returning
		, (e)=>
			$(this).blur().addClass 'error'
			$('div.rego div.errmsg').text e
		, handle:$(this).val()
	setupRegoForm $('.registration form')


# redraw if we log in

runLoginAnim = (o) ->
	if o
		if which_route is o.handle then $('div#edithomebutt').text '\uf044'
		else $('div#edithomebutt').text '\uf015'
		$('div#edithomebutt').animate {marginLeft:'-3em'}, ->
			$('div#edithomebutt').animate {marginLeft:'0em'}
	if o?.handle?.length then return location.hash = "/user/#{o.handle}"
	if o?.handle then return location.hash = "/registration"
	return location.hash = "/register"


$ ->
	$('div#edithomebutt').hover(->
		$(this).addClass 'hoverbutt'
	, ->
		$(this).removeClass 'hoverbutt'
	).click ->
		user = runWithAuth()
		if user and which_route is "user/#{user.handle}"
			location.hash = "/edit/#{user.handle}"
		else location.hash = "/user/#{user.handle}"


	$('div#onoffbutt').hover(->
		if runWithAuth() then $(this).addClass 'offbutt'
		else $(this).addClass 'onbutt'
	, ->
		$(this).removeClass('onbutt').removeClass('offbutt')
	).click ->
		if runWithAuth()
			runWithAuth null
			$('div#edithomebutt').animate {marginLeft:'-3em'}
		else runWithAuth runLoginAnim

	runWithAuth runLoginAnim, true # if there's a session, update the controls ... but don't prompt for logon just yet ...
	justsayUpdate callAfter		# setup link handling etc
	callAfter location.hash		# call for first hash

