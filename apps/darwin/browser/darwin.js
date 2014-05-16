
var which_route = ''; // keeps track of which schema in which app we're werking on : leading slash


function hideBars () {
    if (!$('div#topbar').position().top) {
		$('div.bars').stop();
        $('div#botbar').animate({height:'0em'}, function(){
            $('div#topbar').animate({top:'-3em'});  
        });
    }
}


function showBars () {
    if (! $('div#botbar').height()) {
		$('div.bars').stop();
        $('div#botbar').animate({height:'2em'}, function(){
            $('div#topbar').animate({top:'0em'});
        });
    }
}


function setBars2showMyPage () {
	$('div.bars').stop();
    if ($('div#botbar').height())
        $('div#botbar').animate({height:'0em'});
    if ($('div#topbar').position().top) 
		$('div#topbar').animate({top:'0em'});
}


function looksLikeEdit(route) {
	return (route == 'upgrade' || route == 'downgrade' || route.match(/^[a-zA-Z0-9\.\_]+\/edit/));
}


/*
 * callFirst: this kickstarts animation
 * 	parameters:
 * 			route: the current route we're updating to
 * 			almostReady: a callback to be triggered when animation's done
 * 	returns:
 * 		a function to be called when data is loaded: reveal animation + elemental updates
 */
function callFirst(route, almostReady) {

	$('body').animate({ scrollTop: 0}, 1234);

	if (looksLikeEdit(route)) { // need ckeditor ...
		var cke;

		try { cke=CKEDITOR; } catch (err) {};
		if (!cke) { // ... and it's not there yet?
			var realcall = almostReady;
			almostReady = _.after(2, realcall);
			$.getScript('http://' + justsayno.de.staticurl + '/ckeditor/ckeditor.js', function(d, s){
				$.getScript('http://' + justsayno.de.staticurl + '/ckeditor/adapters/jquery.js', function(data, status){
					almostReady();
				});
			});
		}
	}

	var $d = $('div.card');
    if ($d.length) {
    	$d.animate({left:'-50%'}, 666, function(){
	    	almostReady();
		});
        if (looksLikeEdit(route)) {
            hideBars();
        }
    } else {
        $d = $('div.editcard,div.editpage,div.showpage');
        if ($d.length) {
            $d.animate({top:$(window).height()}, 666, function(){
                almostReady();
            });
        }
        if (!looksLikeEdit(route)) {
            showBars();
        }
    }


	return function() {

		// before animate in, replace textarea
		try {
			var cki;
			for (cki in CKEDITOR.instances) {
				CKEDITOR.instances[cki].destroy();
			}
			$('textarea.page').ckeditor(function(){
								}, {
										skin:'v2'
										, height:$(window).height() - 4*$('div#butts').outerHeight()
										, filebrowserBrowseUrl : '/ck_page_browse'
										, filebrowserUploadUrl : '/ck_page_upload'
								});
		} catch (e) {}

		var $d = $('div.card');
        if ($d.length) {
			$('div#mainbit').css({ height:'100%'});
			$d.css({left:'150%'}).animate({left:'50%'}, 333, function(){
				finallyUpdate(route);
    		});
        } else {
            $d = $('div.editcard,div.editpage,div.showpage');
            if ($d.length) {
				$('div#mainbit').css({height:'auto'});
                $d.css({top:$(window).height()}).animate({top:'0em'}, 333, function(){
                    finallyUpdate(route);
                });
				var user = runWithAuth();
				if (user && $d.hasClass('showpage')) {
					setBars2showMyPage();
				} else {
					hideBars();
				}
            }
        }
    };
}


/*
 * elemental updates for routes
 */
function callAfter(route, from) {

	var user = runWithAuth();
	which_route = route;

	if (user) {
		var $p = from.find('div.showpage');
		if ($p.length) {
			$p.addClass('pagewhileloggedin');
		}
		if (which_route == user.handle) {
			$('div#edithomebutt').text('\uf044');
		} else {
			$('div#edithomebutt').text('\uf015');
		}
	}
}


function goHome() {
    var user = runWithAuth();
    if (user) location.hash = '/' + user.handle;
    else location.hash = '/';
}

/*
 * elemental updates for routes
 */
function finallyUpdate(route) {
var $vor;

	$('form').find('input.active').prop('checked', true);	// always push activation

	$('input').focus(function(){
		if ($(this).hasClass('error')) {
			var beauty_opts = {
					positions:['top','bottom'],
					closeWhenOthersOpen:true,
					fill:"#f4d8bc",
					shadow: true,
					shadowOffsetX: 3,
					shadowOffsetY: 3,
					shadowBlur: 8,
					shadowColor: 'rgba(0,0,0,.9)',
					shadowOverlap: false,
					noShadowOpts: {strokeStyle: '#66946a', strokeWidth: 2},
					onkeyup: false,
					trigger: 'none'
						};

			$(this).bt($(this).attr('title'), beauty_opts);
			$(this).btOn();
		}
	});
	$('input[name="cancel"]').click(function(){
		$('div#register').remove();
	});

	$.validator.addMethod('ausmobile', function(val, el){
			return this.optional(el) || /^(\+61(\-)?|0)4[0-9]{2}([ \-])?[0-9]{3}([ \-])?[0-9]{3}$/.test(val);
		}, "Please enter a valid mobile number, in the form 04xx-xxx-xxx");

	$.validator.addMethod('darwinnumber', function(val, el){
			return this.optional(el) || /^(08(\-)?)?8[0-9]{3}([ \-])?[0-9]{4}$/.test(val);
		}, "Please enter a valid darwin number, in the form 08-8xxx-xxxx");

	$.validator.addMethod('goog', function(val, el){
			return this.optional(el) || /^[0-9]+$/.test(val);
			return this.optional(el) || /^[A-Za-z0-9_\.]+$/.test(val);
		}, "Your google+ ID should be a string of digits");

	$.validator.addMethod('twit', function(val, el){
			return this.optional(el) || /^(\@)?[A-Za-z0-9_]+$/.test(val);
		}, "Please enter a valid twitter username");

	$.validator.addMethod('fb', function(val, el){
			return this.optional(el) || /^[a-z\d\.]{5,}$/.test(val);
		}, "Please enter a valid facebook username");

	$.validator.addMethod('link', function(val, el){
			return this.optional(el) || /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(val);
		}, "Please enter a link to your website");

	$vor = $('form').validate({
		rules: {
			mobile: { ausmobile : true }
		},
		invalidHandler: function(){
			$('body').scrollTop(0);
			$('input.error').first().focus();
			return false;
		},
		submitHandler: function(f){
			return false;
		},
		errorPlacement: function(err,el){
			el.attr('title', err.text());
		}
	});


	$('div#butts').find('.ok').click(function(){
		if ($vor.form())
			justsayAJAJ(route,
						function(success){
							goHome();
						}, function(err) {
							alert("ERROR: " + err);
						}, $('form').serialize());
		}).end().find('.cancel').click(function(){
			goHome();
		}).end().find('.downgr').click(function(){
			location.hash = '/downgrade';
		}).end().find('.upgr').click(function(){
			var user = runWithAuth();
			justsayAJAJ('/verify/' + user.handle,
						function(success){
							location.hash = '/upgrade';
						}, function(err) {
							alert("You need to confirm your darwin.email account first.");
						});
		});

}


/*
 * adds the home/ edit buttons if there's an authorised session
 */
function runLoginAnim(o){
	if (o) {
		if (which_route == o.handle) {
			$('div#edithomebutt').text('\uf044');
		} else {
			$('div#edithomebutt').text('\uf015');
		}
		$('div#headingtitle').animate({left:'50%'}, function(){
			$('div#headingtitle').animate({marginLeft:'-3em'}, function(){
				$('div#edithomebutt').animate({marginLeft:'0em'});
			});
		});
	}
}

$(function(){
runWithAuth(runLoginAnim, true);		// if there's a session, update the controls ... but don't prompt for logon just yet ...
justsayUpdate(callAfter, callFirst);	// setup link handling etc
callAfter();							// call for first hash

$('div#edithomebutt').hover(function(){
							$(this).addClass('hoverbutt');
						},function(){
							$(this).removeClass('hoverbutt');
						}).click(function(){
							var user = runWithAuth();
							if (user && which_route == user.handle) {
								location.hash = '/' + user.handle + '/edit';
							} else {
								location.hash = '/' + user.handle;
							}
						});


$('div#onoffbutt').hover(function(){
							if (runWithAuth()) $(this).addClass('offbutt');
							else $(this).addClass('onbutt');
						},function(){
							$(this).removeClass('onbutt').removeClass('offbutt');
						}).click(function(){
							if (runWithAuth()) {
								runWithAuth(null);
								$('div#edithomebutt').animate({marginLeft:'-3em'}, function(){
									$('div#headingtitle').animate({left:'0%'}, function(){
										$('div#headingtitle').animate({marginLeft:'0em'});
									});
								});
							} else runWithAuth(runLoginAnim);
						});

$('body').css({fontSize: Math.round($(window).width()/64)});
});
