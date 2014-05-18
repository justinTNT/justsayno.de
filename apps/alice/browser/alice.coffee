
callFirst = -> true		# all good


validateRegoForm = ($f)->
	$field = $f.find("input[type='password']")
	pass = $field.val()
	if pass?.length < 8 then return $field
	$field = $f.find("input.email")
	mail = $field.val()
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
	$f.find('i.icon-info-sign').hover ->
		$(this).parent().find('div.desc').hide()
		$(this).parent().find('p.desc').fadeIn()
	, ->
		$(this).parent().find('p.desc').hide()
		if $(this).css('display') isnt 'none'
			$(this).parent().find('div.desc').fadeIn()
	$f.find('input.cancel').click ->
		justsayAJAJ '/deregister'
	$f.find("[type='submit']").click ->
		if $error = validateRegoForm($f)
			$f.find('div.errmsg').text "Invalid #{$error.attr 'name'}"
			$error.addClass 'error'
		else justsayAJAJ $f.attr("action"), ()->	# success!
			location.hash = "/confirm"	# server could redirect instead of returning
		, (errstr, code)->		# error ...
			if code is 409 then type = 'text'	# conflict - email already used
			else type = 'password' # what else could go rong? probably password??
			$f.find("input[type='#{type}']").addClass 'error'
			$f.find('div.errmsg').text errstr
		, $f.serialize()
		false



# elemental updates for routes

callAfter = (route) ->
	unless route?.length
		console.log 'going to register because of no route'	# jTNT remove
		return location.hash = "/register"

	$("a.logout").click ->
		runWithAuth null
	$("a.login").click ->
		if runWithAuth() then runWithAuth null
		else runWithAuth runLoginAnim
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
	if o?.handle?.length then return location.hash = "/user/#{o.handle}"
	if o?.handle then return location.hash = "/registration"
	return location.hash = "/register"


$ ->
	runWithAuth runLoginAnim, true # if there's a session, update the controls ... but don't prompt for logon just yet ...
	justsayUpdate callAfter		# setup link handling etc
	callAfter location.hash		# call for first hash

