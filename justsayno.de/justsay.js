/*
 * justsay.js
 * =======
 * this is the code which is loaded both in the client and the server in order to weld data to templates
 */

if (typeof $ == 'undefined') {
var jsdom = require('jsdom')
  , myWindow = jsdom.jsdom().createWindow()
  $ = require('jquery').create(myWindow);
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
 * selection : the item
 */
function weldItem (dat, selection) {
	if (typeof dat == 'string' || typeof dat == 'number') {
		setItem(selection,dat);
	} else {
		for (keyatt in dat) {
		var tmpa = keyatt.split('.')
		 ,  key = tmpa[0]
		 ,  attrib = tmpa[1]		// recognises key.attribute
		 ,  styl = tmpa[2]		// recognises key..style or key.ignorethis.style
		 ,  $item;

			if (selection.hasClass(key) || selection.attr('id') == key)
				$item = selection;
			else {
				$item = selection.find("#" + key);
				if (! $item.length) $item = selection.find("." + key);
			}
			if ($item.length) {
				var str = dat[keyatt];
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
							str = '[ obj ]';
						}
						break;

					default:
				}

				if (styl) {
					tmpstyle = $item.attr('style') || "";
					$item.attr('style', styl + ':' + str + ';' + tmpstyle);
				} else if (attrib) $item.attr(attrib, str);
				else setItem($item,str);
			}
		}
	}
	selection.addClass('item_welded_on');
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
				dat=objects[sel]
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
		$selected.each(function(){ $(this).html(envplates[next_template.filename]); });
	} else {
		return weldFunc(data, header_text);		// if there's no templates left, weld the data on
	}
	loadTemps(envplates, templates, weldFunc, data, header_text);	// won't happen if we're welding, cos that returns...
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

	if (request.xhr) {
		if (tpls) {
			o = {objects:objs, templates:tpls};
			response.send(JSON.stringify(o));
		} else response.send(JSON.stringify(objs));
	} else {
		try {
			if (typeof objs == 'string') { // a few admin / debug pages may be built as strings
				response.send('<html><body>' + objs + '</body></html>');
			} else {
				loadTemps(envplates, base_tpls.slice(0), function(data, headtext) {
						if (!tpls) tpls = [];
						loadTemps(envplates, tpls.slice(0), function(data) {
							weldTemps(tpls.slice(0), objs, data, function(responsetxt) {
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

