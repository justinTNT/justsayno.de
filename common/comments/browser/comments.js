
function replaceAddComm($addtarget) {
	var submitstr = 'add your comment ...';
	$f = $("<form class='addcomment' action='" + $addtarget.attr('href') + "'><textarea name='comment' rows=9 cols=45>" + submitstr + "</textarea><input class='savecomment' type='submit' value='Save'/></form>");
	$addtarget.replaceWith($f);
	$('body').animate({ scrollTop: $f.offset().top-53 });
	$f.find('textarea').focus(function(){
		if ($(this).val() == submitstr) {
			$(this).val('');
		}
	});
	$f.submit(function(){
		var $c = $f.find('textarea');
		runWithAuth(function(){
			$f.find('input').hide();
			justsayAJAJ($f.attr('action'),
				function(){
					$c.replaceWith("<div class='mycomment'>" + $c.val() + "</div>");
					$f.find('span').text('you added:');
					$f.find('input').remove();
				}, function(e) {
					$f.find('input').show();
				}, $c.serialize());
			}, function(e) {
				if (e) if (e.length) alert('authentication failed: ' + e);
			});
		return false;
	});
	return false;
}


function displayComment(r) {
var s;

	s = "<div class='comment border-bubble'>" + r.comment ;
	if (r.link)
		s +=  "<div class='commentname'><a href='" + r.link + "'>" + r.name + "</a></div>";
	else s +=  "<div class='commentname'>" + r.name + "</div>";
	s += "<div class='border-point'></div> <div class='speachpoint'></div> </div>" 
	  + "<div class='comment_reply'>"
		+ "<a class='addcomment spch-bub-inside' href='" + route.replace(/\//g," ") + '/comment/' + r._id + "'><span class='point'></span><em>reply</em></a></div> <p><br></p>";

	return s;
}


function displayComments(a) {
	var s="";
	_.each(a, function(i){
		var r = _.detect(comment_records, function(c) { return c._id == i; });
		s += "<div class='eachcomment'>" + displayComment(r) + displayComments(r.children) + "</div>";
	});
	return s;
}


function getComments(r) {

	route = r;
		
	justsayAJAJ(route.replace(/\//g," ") + '/comments',
		function(ajaxdata){
			comment_records = ajaxdata;
			_.each(comment_records, function(r) {
				if (r.parent) {
					c = _.detect(comment_records, function(c) { return c._id == r.parent; });
					if (c.children) c.children.push(r._id);
					else c.children = [r._id];
				}
			});
			
			var c_str = displayComments(_.pluck(
								_.select(comment_records
									, function(c){ return (c.parent?false:true); }
								), '_id'));

			var rep_c_str = c_str + "<div class='addnewcomment'> <a class='addcomment spch-bub-inside' href='" + route.replace(/\//g," ") + "/comment/'> \
									<span class='point'></span> \
									<em>add a new comment</em> </a></div>";

			$('body').animate({ scrollTop: $('a.comments').offset().top-53 });
			$('a.comments').replaceWith(rep_c_str);

			if (c_str.length) {
				$('a.addcomment').click(function(){
					return replaceAddComm($(this));
				});
			} else {
				replaceAddComm($('a.addcomment'));
			}
		},
		function(ststxt, err){
		}
	);
}



function setupComments(route) {
var $cc;

	$cc = $('span.commentcnt');
	if ($cc.length) {
		var cnt = $cc.text();
		$cc = $cc.parent().addClass('spch-bub-inside').html("<span class='point'></span><em></em>").find('em');
		if (cnt == "0") {
			$cc.text("Be the first to make a comment");
		} else {
			$cc.text(cnt + " comments");
		}
	}

	$('a.comments').click(function(){
		if (! $(this).hasClass('disabled')) {
			$(this).addClass('disabled');
			getComments(route);	
		}
		return false;
	});
}

