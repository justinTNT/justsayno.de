/*
 * given an existing list,
 * this function will call superfish on it,
 * center justify,
 * and hijack the links to make it behave nicely for AJaH
 */ 
function superify($ul, where) {
	$ul.superfish();

	$ul.css('display', 'inline'); // for ie6 double indent bug
	updateLinks($ul);

	$ul.find('a').each(function(){	// this clause ensures it closes when we select
		var f=$(this).click;
		$(this).click(function(){
			$(this).blur();
			f();
		});
	});

	var w = $ul.width();
	if ($(where).width() > w) {
		$(where).css('left','50%');
		$ul.css('marginLeft', -w/2 + 'px');
	}
}


/*
 * loads menu data from backend,
 * rearranges as superfish lists
 * and then updates the links
 */
function setupMenu(where) {
var menuid = $(where).attr('id');
var $ul;

	if (menuid.substr(0,5) == 'menu-')
		menuid = menuid.substr(5);

	$ul = $(where).find('ul');


	if (! $ul.length) {	// no menu list

		justsayAJAJ('/menu/' + menuid, function(o){
			var notdone = true;
			var e, i, $item, $ul;
			$ul = $('<ul class="sf-menu">');
			$ul.appendTo($(where));
			while (notdone) {
				notdone = false;
				for (i=0; i<o.length; i++) {
					e=o[i];
					if (!$ul.find('li#' + e.item).length) { // only add on items not already there ...
						if (!e.parent_item || !e.parent_item.length || $('li#' + e.parent_item).length) {
							$item = $('<li>');
							$item.attr('id', e.item);
							if (e.link.length) {
								$item.html('<a>' + e.title + '</a>');
								$item.find('a').attr('href', e.link);
							} else {
								$item.text(e.title);
							}
							if (e.parent_item && e.parent_item.length) {
								$o = $('li#' + e.parent_item);
								if ($o.find('ul').length) $o = $o.find('ul');
								else {
									$o.append($('<ul>'));
									$o = $o.find('ul');
								}
								$o.append($item);
							} else {
								$ul.append($item);
							}
						} else {
							notdone = true; // wait for next loop, maybe parent will be there by then
						}
					}
				}
			}

			superify($ul, where);

		}, function(txt, err) {
			// error: ignore? 
		});

	} else if (! $ul.hasClass('sf-menu')) {
		superify($ul, where);
	}
}

