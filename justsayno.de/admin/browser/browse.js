function getUrlParam(paramName) {
  var reParam = new RegExp('(?:[\?&]|&amp;)' + paramName + '=([^&]+)', 'i') ;
  var match = window.location.search.match(reParam) ;
 
  return (match && match.length > 1) ? match[1] : '' ;
}


function setupList() {
	$('div.file_list_file').click(function(){
		var funcNum = getUrlParam('CKEditorFuncNum');
		var fileUrl = $('div#hidden_url').text() + $(this).find('div.filelist_name').text();
		window.opener.CKEDITOR.tools.callFunction(funcNum, fileUrl);
		window.close();
	}).hover(function(){
		$(this).animate({ backgroundColor: "#FDF6E3" }, 'fast');
	}, function(){
		$(this).animate({ backgroundColor: "#FFF" }, 'fast');
	});
}

$(window).load(function(){
	$('div#maintab div.filelist_date').each(function(){
		var tmp = $.parseJSON($(this).text());
		tmp = tmp.substr(0, tmp.indexOf('T'));
		$(this).text(tmp);
	});

	setupList();
	$('div.title_file_list').find('div').click(function(){
		var sortup=true;
		var cname = $(this).attr('class');
		var jname = cname.substr(cname.indexOf('filelist_')+9);
		var i = jname.indexOf(' ');
		if (i>0) jname = jname.substr(0, i);
		if ($(this).hasClass('sortup')) {
			$(this).removeClass('sortup');
			sortup = false;
		} else $(this).addClass('sortup');
		var file_list = $('div.file_list_file');
		var new_list = _.sortBy(file_list, function(f) {
			if (!sortup) {
				if (jname == 'size') { // size is a number
					return -parseInt($(f).find('div.filelist_' + jname).text());
				}
				return _.map($(f).find('div.filelist_' + jname).text().split(''), function(c){ return 0xffff - c.charCodeAt(); }); // _ reverse string sort!
			} else {
				if (jname == 'size') { // size is a number
					return  parseInt($(f).find('div.filelist_' + jname).text());
				}
				return $(f).find('div.filelist_' + jname).text();
			}
		});
		$('div#maintab').html('').append(new_list);
		setupList();
	});
});
