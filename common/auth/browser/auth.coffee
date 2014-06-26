window.runWithAuth = (->

	# this context stores one of two values
	# either: a string, identifying the anticipated user handle
	# or: an object, that represents the authenticated session user object
	session_user = ''

	# returns the dom element that fails validation
	validateLogin = ($l) ->
		unless ($h = $l.find("[name='login']")).val().length then return $h
		unless ($p = $l.find("[name='password']")).val().length then return $p
		if ($c = $l.find("[name='confirm']")).length
			unless $c.val() is $p.val() then return $c
			unless ($e = $l.find("[name='email']")).val().length then return $e
		null

	drawLogin = ->
		$l = $(justGetFrag("auth.jade") or justGetFrag("auth.htm"))
		$("body").prepend $l
		$l.find("input[type='text'],input[type='password']").focus ->
			$(this).css "backgroundColor", "#fff"
		$l.find("input[name='login']").val session_user	if _.isString(session_user)
		$l.find "form"

	removeLogin = ->
		$("div#loginpage").remove()
		$("div#loginbackdrop").remove()

	loudLogin = (succ, fail) ->
		$login = drawLogin()
		$login.find("[type='submit']").click (e) ->
			if $(this).val() is "Register" and not $login.find("[name='confirm']").length
				newstuff = "<div class='expendable'>" + "<span>Confirm:</span> <input type='password' name='confirm' /><br>" + "<span>Email:</span> <input type='text' name='email' />" + "<div><i>we'll send you an activation email</i></div> </div>"
				$login.animate height: "380px"
				$login.find("input[name='password']").after $(newstuff)
				$login.find("input[name='register']").val "Submit"
				$login.attr "action", "/register"
			else if $(this).val() is "Login" and $login.find("[name='confirm']").length
				$login.animate(height: "240px").find("div.expendable").remove()
				$login.find("input[name='register']").val "Register"
				$login.attr "action", "/login"
			else
				if $error = validateLogin($login) then $error.css "backgroundColor", "#fcc"
				else
					justsayAJAJ $login.attr("action"), ((o) ->	# success!
						session_user = o
						removeLogin()
						succ()
					), ((s) ->		# error ...
						if s?.length
							$login.find("input[name='email'], input[name='login']").each ->
								if $(this).val() is s
									$(this).css "backgroundColor", "#fcc"
									s = ""
						else $login.find("input[type='password']").css "backgroundColor", "#fcc"
					), $login.serialize()
			false

		$login.find("[name=cancel]").click ->
			removeLogin()
			fail()

	doRunWithAuth = (succ, fail, silent) ->
		if session_user and session_user.handle then return succ()
		justsayAJAJ "/silent_login", ((o) ->
			session_user = o
			succ()
		), (o) ->
			session_user = o
			if silent then fail()
			else loudLogin succ, fail

	# default template
	unless justGetFrag("auth.jade")
		justsayno.de.skeleta["auth.htm"] = """
		<div id='loginbackdrop'></div>
		<div id='loginpage'><div id='loginbox'>
		<form action='/login'>
			Name: <input type='text' name='login' /><br>
			Password: <input type='password' name='password' />
				<div style='clear:both'>
					<input type='submit' value='Login'/>
					<input type='button' name='cancel' value='Cancel'/>
					<input class='registerbutton' type='submit' name='register' value='Register'/></div>
				<div class='reminder'>
					<input type='checkbox' name='remember' />remember me on this computer</div>
		</form></div></div>"
		"""

	#
	# instantiating this module returns this function.
	#
	#	** this public function drives authentication.
	#	** it is exposed as runWithAuth
	#	** and takes two parameters: a callback, and a silentflag
	#	*
	#	** Called with no parameter, it simply tests if we have an authenticated session
	#	** To authenticate, pass a callback, which will receive the session user on success (undefined on failure)
	#	** Pass null to logout from the current session
	#
	(cb, silent) ->
		if _.isUndefined(cb)
			return if session_user and session_user.handle then session_user else null
		unless cb
			session_user = {}
			justsayAJAJ "/logout"
		else
			doRunWithAuth (->
				cb session_user
			), cb, silent
)()
