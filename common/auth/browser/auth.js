
jQuery.cookie = function(name, value) {
    if (typeof value != 'undefined') {
        if (value === null) value = '';
        document.cookie = name+ '=' +encodeURIComponent(value);
	} else if (document.cookie && document.cookie != '') {
		var cookies = document.cookie.split(';');
		for (var i = 0; i < cookies.length; i++) {
			var cookie = jQuery.trim(cookies[i]);
			if (cookie.substring(0, name.length + 1) == (name + '=')) {
				return decodeURIComponent(cookie.substring(name.length + 1));
			}
		}
	}
    return null;
};

var session_user = {};


function validateLogin($l) {
var $p, $c, $e, $h;

	if (! ($h = $l.find("[name='login']")).val().length) return $h;
	if (! ($p = $l.find("[name='password']")).val().length) return $p;
	if (($c = $l.find("[name='confirm']")).length) {
		if ($c.val() != $p.val()) return $c;
		if (!($e=$l.find("[name='email']")).val().length) return $e;
	}
	return null;
}

function drawLogin() {
	var login = "<div id='loginbackdrop'></div><div id='loginpage'><div id='loginbox'>"
+ "<form action='/login'>"
+ "Name: <input type='text' name='login' /><br>Password: <input type='password' name='password' />"
+ "<input type='submit' value='Login'/> <input type='button' name='cancel' value='Cancel'/> <input type='submit' name='register' value='Register'/>"
+ "</form></div></div>";
	var $l = $(login);
	$('body').prepend($l);
	$l.find("input[type='text'],input[type='password']").focus(function(){
		$(this).css('backgroundColor', '#fff');
	});
	return $l.find('form');
}
function removeLogin() {
	$('div#loginpage').remove();
	$('div#loginbackdrop').remove();
}
function loudLogin(succ, fail) {
	$login = drawLogin();
	$login.find("[type='submit']").click(function(e){
		if ($(this).val()=='Register' && ! $login.find("[name='confirm']").length) {
			var newstuff = "<div class='expendable'>"
	+ "<span>Confirm:</span> <input type='password' name='confirm' /><br>"
	+ "<span>Email:</span> <input type='text' name='email' />"
	+ "<i>we'll send you an activation email</i> </div>";
			$login.animate({height:'380px'});
			$login.find("input[name='password']").after($(newstuff));
			$login.find("input[name='register']").val('Submit');
			$login.attr('action', '/register');
		}
		else if ($(this).val()=='Login' && $login.find("[name='confirm']").length) {
			$login.animate({height:'240px'}).find('div.expendable').remove();
			$login.find("input[name='register']").val('Register');
			$login.attr('action', '/login');
		} else {
			$error = validateLogin($login);
			if ($error) {
				$error.css('backgroundColor', '#fcc');
			} else {
				justsayAJAJ($login.attr('action'),
					function(o){
						session_user = o;
						removeLogin();
						succ();
						$.cookie('login', o.handle)
						$.cookie('pass', o.pass);
					}, function(s){
						if (s.length) {
							$login.find("input[name='email'], input[name='login']").each(function(){
								if ($(this).val() == s) {
									$(this).css('backgroundColor', '#fcc');
									s = '';
								}
							});
						} 
						if (s.length)
							$login.find("input[type='password']").css('backgroundColor', '#fcc');
					}, $login.serialize());
			}
		}
		return false;
	});
	$login.find("[name=cancel]").click(function(){
		removeLogin();
		fail();
	});
}

function runWithAuth(succ, fail) {
	if (session_user.handle)
		return succ();
	justsayAJAJ('/silent_login',
		function(o){
			session_user = o;
			succ();
		}, function() {
			justsayAJAJ('/login',
				function(o){
					session_user = o;
					succ();
				}, function() {
					loudLogin(succ, fail);
				}, "login=" + $.cookie('login') +"&pass="+ $.cookie('pass'));
		});
}

