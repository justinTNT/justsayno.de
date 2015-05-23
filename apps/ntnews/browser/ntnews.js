
function removeEmptyDates(){
	var lastm = "", lasty = "";
	$('div.art-date').each(function(){
		$m = $(this).find('.month');
		$y = $(this).find('.year');
		if ($m.length) {
			if ($m.text().length) {
				if ($m.text() == lastm) {
					$m.remove();
					$m = null;
				} else {
					lastm = $m.text();
				}
			} else {
				$m.remove();
				$m = null;
			}
		}
		if ($y.length) {
			if ($y.text().length) {
				if ($y.text() == lasty) {
					$y.remove();
					$y = null;
				} else {
					lasty = $y.text();
				}
			} else {
				$y.remove();
				$y = null;
			}
		}
		if (!$m&&!$y) $(this).remove();
	});
}

function callFirst() {
	return true;
}

function callAfter(route) {
	$(window).scrollTop(0);
	setupComments(route);
	$('a.btn-footer').click(function(){
		$(window).scrollTop(0);
		return false;
	});
	removeEmptyDates();
}


justsayUpdate(callAfter);

    function answerScroll() {
		$('div.paginationlink:last').find('a.nextlink').each(function() {
			var $a = $(this);
			if  ($(window).scrollTop() + $(window).height() + 53 > $a.offset().top) {
				$(window).unbind('scroll');
				justsayMakeTheCall($(this).attr('href'),
					function(call, $temp, $dest) {
						$a.parent().replaceWith($temp);
						removeEmptyDates();
						$(window).scroll(answerScroll);
						return true;
					}, callFirst);
			}
		});
	}

$(window).scroll(answerScroll);

