/*
 * justsay.js
 * =======
 * this is the code which is loaded both in the client and the server in order to weld data to templates
 */

if (typeof $ == 'undefined') {					// no jquery? server side
var jsdom = require('jsdom');
  document = jsdom.jsdom();		// global window object: we should really move to cheerio
  window = document.defaultView;
  $ = require('jquery').create(window);
  _ = require('underscore');
}



/* 
 * this is because of the weird behaviour in firefox,
 * when setting innerHTML on a block element inside an anchor creates a new namespace anchor inside the block.
 * I guess we should avoid those style errors, but every other browser manages it, so I'm dodgying it up for firefox
 * this assumes that if we're filling an elemnt inside an anchor, it's only text anyway ...
 * we are calling html because of the html often loaded from rich text editors
 */
function setItem($i, str) {
    $i.html(str);

	// working with ckEditor, this is a common error:
	// <p><p></p></p> is invalid, and strict tools like jsdom will choke.
	// other tools will let it thru, possibly bypassing styling
	// Since this is such a common error, let's head it off ...
	if ($i.prop('tagName') == 'P') {
		if (str.toLowerCase().indexOf('<p>') >= 0) {
			var $tmp = $(str);
			if ($tmp.prop('tagName') == 'P')
				$i.html($tmp.html());
		}
	}

	// this bug is awesome!
    if ($.browser.mozilla) {
        var tmp = $i.html();
        if (tmp.substr(0, 9) == '<a xmlns=') {
            $i.text(str);
        }
    }
}




/*
 * weld data to an item
 * ====================
 * dat : the data
 * $s : the item
 */
function weldItem (dat, $s) {
	if (typeof dat == 'string' || typeof dat == 'number') setItem($s,dat);
	else {
		for (keyatt in dat) {
		var tmpa = keyatt.split('.')
		 ,  key = tmpa[0]
		 ,  attrib = tmpa[1]		// recognises key.attribute
		 ,  $item;

			if ($s.hasClass(key) || $s.attr('id') == key) $item = $s;
			else {
				$item = $s.find("#" + key);
				if (! $item.length) $item = $s.find("." + key);
			}
			if ($item.length) {
				var str = dat[keyatt];
				if ($item.hasClass(key) && _.isArray(str)) {
					var l = str.length;
					var $newone;
					for (var i=0; i<l; i++) {
						if (i<l-1) {
							$newone=$item.clone();
						}
						weldItem(str[i], $item);
						if (i<l-1) {
							$item.after($newone);
							$item=$newone;
						}
					}
				} else {
					switch (typeof str) {
						case 'function':
							throw 'unexpected function : ' + str.substr(23) + '...';
							break;

						case 'object':
							if (str.getMonth) {
								var y = str.getYear();
								var m = str.getMonth() + 1;
								m++;
								if (m < 10) m = '0'+m;
								var d = str.getDate() + 1;
								if (d < 10) d = '0'+d;
								var d = str.getYear();
								str = y + ' - ' + m + '-' + d;
							} else {
								for (var k in str) {
									weldItem(str[k], $item);		
								}
								delete str; // nothing more to do with it
							}
							break;

						default:
					}

					if (str) {
						if (attrib) {
							if (attrib == 'text') {
								$tmp = $item.children().clone()
								$item.html(str);
								$item.append($tmp);
							} else if (attrib == 'textpre') {
								$tmp = $item.children().clone()
								$item.html(str);
								$item.prepend($tmp);
							} else {
								$item.attr(attrib, str);
							}
						} else {
							setItem($item,str);
						}
					}
				}
			}
		}
	}
	$s.addClass('item_welded_on');
}

/*
 * weld a list of data to templates
 * ================================
 * templates - the list of templates to do the work in
 * objects : list of objects, with elements like  { selector.attribute: 'databasevalue' }
 * data - the DOM document we're building
 * sendEmOff - callback function. Give it everything but the <html> tag.
 */
function weldTemps(templates, objects, data, sendEmOff) {
	if (templates.length < 1) {
		sendEmOff(data[0].innerHTML.substr(6));
	} else {
		var nt = templates.pop();
		var select = nt.selector;
		var $selected = data;
		if (! $selected.is(select))
			$selected = data.find(select);
		if (! $selected.length)
            throw "bad selector " + select;

		for (var sel in objects) {
			var dat, l, $s;
			$s = data.find("#"+sel);
			if (! $s.length) $s = data.find("."+sel);
//			if (! $s.length) throw "bad selector " + sel + " in template " + select;
			$s = $s.not('.item_welded_on');
			if ($s.length) {
				dat=objects[sel];
				if (typeof dat == 'string' || typeof dat == 'number') {
					weldItem(dat, $s);
				} else if (l=dat.length) {
					var $newone;
					for (var i=0; i<l; i++) {
						if (i<l-1) {
							$newone=$s.clone();
						}
						weldItem(dat[i], $s);
						if (i<l-1) {
							$s.after($newone);
							$s=$newone;
						}
					}
				} else weldItem(dat, $s);
			} else { 
				// at some point I thought this was useful:
				/*
				var tempo = {};
				tempo[sel] = objects[sel];
				weldItem(tempo, data); */
			}
		}

		weldTemps(templates, objects, data, sendEmOff);
	}
}


/*
 * load templates
 * ==============
 * this function has two roles :
 *  with three arguments, it'll build a new DOM document from the template
 *  with a the fourth argument, it will add templates to the existing DOM document
 * envplates : all templates loaded for this app env
 * templates : list of templates
 * weldFunc : callback.
 * data : the DOM document we're building, or undefined to begin a new one, or a string to name an alternative boilerplate!
 * header_text : pass along the header to add to the populated template
 *
 * this got more complicated when data took on a third state (for alt boilerplate)
 * so, to spell it out:
 * we commonly call loadTemps with 3 parameters.
 * It then loads the default boilerplate into a DOM instance,
 * and recursively calls itself, stepping through the templates in the second parameter.
 *
 * BUT
 *
 * we occassionally may call loadTemps with 4 parameters :
 * 	the fourth (rare, optional) parameter being an alternative boilerplate filename
 *
 * When loadTemps calls itself, it passes on the DOM it is building as the fourth parameter,
 * and the HTML up to the end of the head as the fifth.
 * We need to carry around that string, because of some misbehaviour of jsdom which I can't quite remember right now,
 * which munged the head along the way ...
 */
function loadTemps(envplates, templates, weldFunc, data, header_text) {
var hash=null; // boilerplate hash (filename)

	if (! data) {						// no data means use standard boilerplate
		hash = 'boilerplate.tpl';
	} else if (typeof data == 'string') {
		hash = data;
	}
	if (hash) {
		data = $('<html>');
		str = envplates[hash];
		data[0].innerHTML = "<html>"+str.substr(str.indexOf("</head>")+7);
		header_text = str.substr(0, str.indexOf("</head>")+7);
	} else if (templates.length > 0) {
		var next_template = templates.shift();
		var $selected = data;
		if (! $selected.is(next_template.selector))
			$selected = data.find(next_template.selector);
		if (! $selected.length)
            throw "bad selector " + next_template.selector;
		$selected.each(function(){
			this.innerHTML = envplates[next_template.filename];
			//$(this).html(envplates[next_template.filename]);
		});
	} else {
		return weldFunc(data, header_text);		// if there's no templates left, weld the data on
	}
	loadTemps(envplates, templates, weldFunc, data, header_text);	// won't happen if we're welding, cos that returns...
}




function addFBmetaItem($m, selector) {
	var s = "";

	$m.each(function(){
		var $s = $(this);
		if ($s.hasClass(selector)) {
			s = $s.attr('src');
			if (!s || !s.length)
				s = $s.text();
			if (s.length) {
				s = "<meta property='og:" + selector + "' content='" + s + "'/>\n"; 
			}
		}
	});

	return s;
}

function addFBmeta(head, resp) {
	var newh = head;
	var $m = $("<html>" + resp + "</html>").find('.fbmeta');
	if ($m.length) {
		var i = head.indexOf('<meta');
		newh = head.substr(0, i)
			+ addFBmetaItem($m, 'title') + addFBmetaItem($m, 'image') + addFBmetaItem($m, 'description')
			+ head.substr(i);
	}
	return newh;
}



/*
 * build response from templates and objects
 * =========================================
 * either sends objects + template list to client or builds DOM document from templates
 *
 * envplates :	all templates loaded for this app env
 * base_tpls :	list of template names (hashing envplates)
 *				if it's not an ajax call, these are immediately applied to boilerplate
 * tpls :		list of (skeletal) template names (hashing envplates)
 *				if it's not an ajax call, these are embedded into the base 'plates.
 *				but, if it is ajah, we send this list of names,
 *				along with the objects that will be welded in them.
 * objs :		list of objects, with elements like  { selector.attribute: 'databasevalue' }
 * alt_bp :		[OPTIONAL] alternative boilerplate filename
 *
 * now, sometimes we're not filling templates, we're just sending a list of objects via ajaj
 * in that case, there's only 4 arguments. otherwise, there's also:
 *
 */
function justsayRespond(envplates, request, response, base_tpls, tpls, objs, alt_bp) {
var o;

	if (tpls && ! _.isArray(tpls)) tpls = [tpls];

	if (request.xhr) {
		if (tpls) {
			o = {objects:objs, templates:tpls};
			response.send(JSON.stringify(o));
		} else {
			if (arguments.length == 4) objs = base_tpls;
			response.send(JSON.stringify(objs));
		}
	} else {
		try {
			if (typeof objs == 'string') { // a few admin / debug pages may be built as strings
				response.send('<html><body>' + objs + '</body></html>');
			} else {
				if (!base_tpls) base_tpls = [];
				if (! _.isArray(base_tpls)) base_tpls = [base_tpls];
				loadTemps(envplates, base_tpls.slice(0), function(data, headtext) {
						if (!tpls) tpls = [];
						loadTemps(envplates, tpls.slice(0), function(data) {
							weldTemps(tpls.slice(0), objs, data, function(responsetxt) {
								headtext = addFBmeta(headtext, responsetxt);
								response.send(headtext + responsetxt);
							});
						}, data);
				}, alt_bp);
			}
		} catch (e) {
			console.log('error filling templates:');
			console.log(e);
			response.send("Error. " + e);
		}
	}
}

if (typeof exports != 'undefined') {
	exports.respond = justsayRespond;
}

