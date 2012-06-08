
/*
 * elemental updates for routes
 */
function finallyUpdate(route) {

	setupComments(route);

	$('.main-news-content').hover(
		function(){
			$(this).addClass('hilited');
		},
		function(){
			$(this).removeClass('hilited');
		}
	).click(function(){
		$(this).find('a:first').click();
		return false;
	});

	$('form').submit(function(){
		var valid=true;

		if (valid) {
			$('form').find(':submit').hide();
			$.post($(this).attr('action'), $(this).serialize(), function(success){
				alert(success);
			}, 'text');
		}
		return false;
	});
	$('form').find('.agepicker').each(function(){
		$(this).datepicker({ dateFormat: 'yy-mm-dd'
							,minDate: '-99Y'
							,defaultDate: '-40Y'
							,changeMonth: true
							,changeYear: true});
	});
	$('form').find('.eventpicker').each(function(){
		$(this).datepicker({ dateFormat: 'yy-mm-dd' });
	});
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
	var $d = $('div#innermaintabbox');
	$d.height($d.height()).animate({'min-height':0, height:3}, 666, function(){
				almostReady();
			});

	return function() {
		var h = $('div#maintab').height();
		if (h > 430 && h < 820) h = 820;
		$('div#innermaintabbox').animate({height:h}, 666, function(){
				$(this).css({'min-height':h}).css({height:'auto'});
			});
		finallyUpdate(route);
	};
}



function callAfter(route, from) {

/*
***
 * this is the stress test tool
 *
	setTimeout(function(){
		var $a, l = $('a').length;
		do {
			var c = (10 * l * Math.random() + 5)/10;
			$a = $('a').eq(c);
			if (!$a.length) $a = null;
			else if (!$a.attr('href')) $a = null;
			else if ($a.attr('href').substr(0,7) == 'http://') $a = null;
		} while (!$a);
		$a.click();
		
	}, 12345*(0.5+Math.random()));
 *
***
 */

}


justsayUpdate(callAfter, callFirst);
setupMenu('#menu-lnac');

