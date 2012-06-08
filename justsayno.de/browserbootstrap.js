/*
 * browserbootstrap
 * ================
 * this is the file which kick starts justsay in the client,
 * by hijacking links (thanks ben altman for url internal and hashchange)
 * and calling the common weld gear from justsay.js
 */

function updateLinks(frag){
		frag.find('a:urlInternal').each(function() {			// all internal links,
			if (! $(this).hasClass('hardlink')) {
				var h=$(this).attr('href');					// get the href
				if (h.substring(0,7) == 'http://') {		// if it's a fully qualified URL
					h=h.substr(8);							// skip past the protocol,
					h=h.substr(h.indexOf('/'));				// up to the path
				}
				if (h.indexOf('.') < 0) {			// don't intercept local files with '.' extension
					if (h.charAt(0) != '/') h='/'+h;		// make sure there's a leading slash
					$(this).data('ajax_link', h);
					$(this).click(function(){							// when it's clicked,
						location.hash = $(this).data('ajax_link');		// rewrite the fragment
						return false;						// trust the router to make the server call
					});	
				}
			}
		});
}

/*
 * we mostly do ajaj (Asynchronous Json, Assisted by Javascript)
 * and this wrapper helps make it smooth
 */
function justsayAJAJ (route, succ, fail, data) {
	$.ajax({
		url:route,
		cache:false,
		type:(data ? 'POST' : 'GET'),
		data:data,
		beforeSend:function(jqXHR, settings){
			settings['HTTP_X_REQUESTED_WITH'] = 'XMLHttpRequest';
		},
		success:function(ajaxdata, txtsts, jqXHR){
			if (succ) {
				if (ajaxdata == 'OK') succ();
				else succ($.parseJSON(ajaxdata));
			}
		},
		error:function(jqXHR, ststxt, err){
/*
* DEBUGGING
				alert('AJAX ERROR for ' + route + ': ' + ststxt + ':' + err);
*/
			if (fail) {
				fail(jqXHR.responseText, err);
			}
		}
	});
}



/*
 * justsayMakeTheCall - this is the function called by our script in the browser to setup hashchange.
 * ===========
 * this function is the guts of justsayUpdate below.
 * but its also useful for adhoc server calls, where we need to process results through anti-plates:
 * (if it's an adhoc call that just returns objects, go straight to justsayAJAJ)
 */

function justsayMakeTheCall(servercall, callAfter, callFirst) {
var almostReady, animReveal = null, updatePageWhenReady = null;

	almostReady = _.after(2, function(){
		updatePageWhenReady();
	});
	if (callFirst) animReveal = callFirst(servercall, almostReady);


	justsayAJAJ(servercall,
		function(txdata){
			var $dest_cont=null, $temp_cont;

			if (_.isArray(txdata)) {			// straight data comes in an array

				callAfter(servercall, txdata);

			} else {							// template data comes in an object with objs, temps and dest

				if (txdata && servercall.length)
					$dest_cont = $(txdata.templates[0].selector);
				else $dest_cont = $('div#boilerplate-container');

				if (animReveal)							 // ie.  we called first, and it did something
					$temp_cont = $dest_cont.clone();	// load the new data into temp 'plates
				else $temp_cont = $dest_cont;			// otherwise, weld the new data in place on the page

				if (txdata) {
					loadTemps(justsayskeleta, txdata.templates.slice(0), function(data) {
						weldTemps(txdata.templates, txdata.objects, data, function(responsetxt) {
							callAfter(servercall, $temp_cont);
							if (animReveal) {
								updatePageWhenReady = function() {
									$dest_cont.html($temp_cont.html());
									updateLinks($dest_cont);
									animReveal();
								};
								almostReady();
							} else updateLinks($dest_cont);
						});
					}, $temp_cont);
				} else {
					callAfter(servercall);
				}

			}
		}, function(ststxt, err){
			location.href=servercall; // force refresh on ajax error
		});
}



function servercallFromHash() {
	var servercall = location.hash;
	while (servercall.charAt(0) == '#')
		servercall = servercall.substr(1);
	while (servercall.charAt(0) == '/')
		servercall = servercall.substr(1);
	return servercall;
}


/*
 * justsayUpdate - this is the function called by our script in the browser to setup hashchange
 * ===========
 *
 * callAfter - this function is called to update the page with new data
 * 		parameters : route: the current route we're updating to
 * 					 from: [optional] either an array of pure data we're updating with,
 * 					 		OR the (potentially temporary buffer) jquery fragment we're updating
 *              	if callFirst is null, then all incoming data is welded directly to the page, and
 *              	the end of this is a good place to recalculate stuff after the page is redrawn
 *
 * callFirst	- if not null, this can kickstarts the hide animation (eg fade out)
 *		parameters: route: the current route we're updating to
 * 					almostReady: a callback to be triggered when animation's done
 * 		returns:	function to call for reveal animation (or null, if we decided not to handle this route)
 *
 */

function justsayUpdate (callAfter, callFirst){

	$(window).hashchange(function(){
		justsayMakeTheCall(servercallFromHash(), callAfter, callFirst);
	});

	if (servercallFromHash())
		$(window).hashchange();
	updateLinks($('div#boilerplate-container'));
}


