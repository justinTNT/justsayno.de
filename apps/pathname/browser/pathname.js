
var which_route = ''; // keeps track of which schema in which app we're werking on : leading slash

/*
 * elemental updates for routes
 */
function callAfter(route) {
	$('div.story').each(function(){
		var $t = $(this).find('p.teaser');
		var $i = $(this).find('img.image');
		if ($t.text().length) {
			if ($i.attr('src').length) {
				$i.wrap("<div class='imgwrapper'>");
				$i.css({width:'100%'});
			}
			else $t.css({width:'100%'});
		} else {
			$t.remove();
			if ($i.attr('src').length)
				$i.wrap("<p align='center'>");
		}
	});
	setupComments(route);
}




/*
 * adds the home/ edit buttons if there's an authorised session
 */
function runLoginAnim(o){
	if (o) {
		if ('admin' == o.handle) {
			$('span#editbutt').text('\uf044');
		} else {
			$('span#editbutt').text(' ');
		}
		$('span#logonbutt').text('\uf08b');
	} else {
		$('span#editbutt').text(' ');
		$('span#logonbutt').text('\uf090');
	}
}


function editInPlace($d, tag, id) {
	$d.find(tag + '#' + id).click(function(){
		var r='input', v = $(this).text();
		if (tag == 'p') {
			r = 'textarea';
			$(this).replaceWith("<" + r + " id='" + id + "' class='canhide'>" + v + "</" + r + ">")
		} else {
			$(this).replaceWith("<" + r + " id='" + id + "' class='canhide' value='" + v + "'/>");
		}
		$d.find(r + '#' + id).focus().blur(function(){
			var v = $(this).val();
			if (v.length) {
				$(this).replaceWith("<" + tag + "  id='" + id + "' class='canhide'>" + v + "</" + tag + ">")
				if (id == 'image') {
					$d.find('img#postimg').attr('src', v).removeClass('hide4now');
				}
			} else {
				if (id == 'image') {
					$d.find('img#postimg').addClass('hide4now');
				}
			}
			editInPlace($d, tag, id);
		});
	});
}

function looksLikeImage(u) {
	var lastfour = u.substr(u.length-4).toLowerCase();
	var lastfive = u.substr(u.length-5).toLowerCase();
	return (lastfour == '.jpg' || lastfour == '.gif' || lastfour == '.png' || lastfive == '.jpeg');
}


$(function(){
	runWithAuth(runLoginAnim, true);		// if there's a session, update the controls ... but don't prompt for logon just yet ...
	justsayUpdate(callAfter);	// setup link handling etc
	callAfter();							// call for first hash

	$('div#toplogo i.icon-circle-arrow-right').click(function(){
		$('a.url').click();
	}).hover(function(){
		$(this).addClass('hovered');
	}, function(){
		$(this).removeClass('hovered');
	});
	$('div#toplogo i.icon-circle-arrow-left').click(function(){
		var hash = location.hash;
		while (hash.length && ! parseInt(hash, 10))
			hash = hash.substr(1);
		var previouspage = parseInt(hash);
		if (previouspage > 4) {
			previouspage = previouspage - 2;
			location.hash = previouspage;
		} else if (previouspage > 2) {
			previouspage = previouspage - 1;
			location.hash = previouspage;
		}
	}).hover(function(){
		var hash = location.hash;
		while (hash.length && ! parseInt(hash, 10))
			hash = hash.substr(1);
		var previouspage = parseInt(hash);
		if (previouspage > 2)
			$(this).addClass('hovered');
	}, function(){
		$(this).removeClass('hovered');
	});
	$('span#editbutt').hover(function(){
								$(this).addClass('hoverbutt');
							},function(){
								$(this).removeClass('hoverbutt');
							}).click(function(){
								var user = runWithAuth();
								if (user && 'admin' == user.handle) {
									$('body').prepend(justGetFrag('inform.htm'));
									var $d = $('div#modal');

									$('div#closebutt').hover(
										function(){$(this).css('color', '#F55');}
										, function(){$(this).css('color', '#f00');}
									).click(function(){
										$d.remove();
										$('div#modalbg').remove();
									});

									editInPlace($d, 'h1', 'title');
									editInPlace($d, 'p', 'description');
									editInPlace($d, 'span', 'image');

									$d.find('input#url').change(function(){
										var u = $(this).val();
										if (u.substr(0,7) != 'http://') u = 'http://'+u;
										$(this).parent().find('.canhide').addClass('hide4now');
										if (looksLikeImage(u)) {
											$d.find('span#image').text(u);
											$d.find('img#postimg').attr('src', u).removeClass('hide4now')
												.parent().removeClass('hide4now');
											$d.find('button').removeClass('hide4now');
										} else if ($(this).val().length) {
												justsayMakeTheCall('/consider/' + encodeURIComponent(u),
													function(call, ansarr) {
														$d.find('span#image').text(ansarr[0].image);
														$d.find('img#postimg').attr('src', ansarr[0].image);
														$d.find('p#description').text(ansarr[0].description);
														$d.find('h1#title').text(ansarr[0].title);
														$d.find('.hide4now').removeClass('hide4now')
														return true;
													});
										}
									});
									$d.find('button').click(function(){
										var u = $d.find('input#url').val();
										if (u.substr(0,7) != 'http://') u = 'http://'+u;
										var payload = {
											url:u
										  , comment:$d.find('textarea#comment').val()
										};
										if (!looksLikeImage(u)) {
											payload.image = $d.find('span#image').text();
											payload.description = $d.find('p#description').text();
											payload.title = $d.find('h1#title').text();
										}
										justsayAJAJ('/blog/', function(){
											$d.remove();
											$('div#modalbg').remove();
										}, function(err) {
											$d.find('input#url').addClass('error');
										}, payload);
									});
								} 
							});

	$('span#logonbutt').hover(function(){
								if (runWithAuth()) $(this).addClass('offbutt');
								else $(this).addClass('onbutt');
							},function(){
								$(this).removeClass('onbutt').removeClass('offbutt');
							}).click(function(){
								if (runWithAuth()) {
									runWithAuth(null);
									runLoginAnim();
								} else runWithAuth(runLoginAnim);
							});

	$(window).scroll(
		function(){
			$('div.paginationlink').find('a.nextlink').each(function() {
				var $a = $(this)
					, h = $a.attr('href');
				if (h.length) {
					if  ($(window).scrollTop() + $(window).height()  > $a.offset().top + 53) {
						justsayMakeTheCall(h,
							function(call, $temp, $dest) {
								$a.parent().replaceWith($temp);
								return true;
							});
					}
				}
			});
		}
	);

});

