
function resizeCont() {
	$('div#main').height($('div#container').height()+69);
}


function callFirst() {
	return true;
}

function callAfter(route) {
	$(window).scrollTop(0);
	resizeCont();
	setupComments(route);
	$('a.btn-footer').click(function(){
		$(window).scrollTop(0);
		return false;
	});
}

justsayUpdate(callAfter);

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
						}, callFirst);
				}
			}
		});
	}
);

