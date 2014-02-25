admin_table_fields = null # list of fields for the current schema
admin_table_records = [] # list of loaded data for the current schema
admin_table_names = [] # list of table names
idvals = {}
vocabularies = {}
which_route = "" # keeps track of which schema in which app we're werking on : mind the leading slash
adminflag = false # do we think we're superadmin?

abbreviateName = (name) ->
	p = name.indexOf(".")
	return abbreviateName(name.substr(p + 1))	if p >= 0
	name

displayName = (field) ->
	return field.displayname	if field.displayname
	abbreviateName field.name

# simple helper to get index of which listed record to edit
editIndex = ->
	eto_i = -1
	$allrs = $("div.admin_table_record")
	$eto = $(".edit_this_one")
	if $eto.length
		i = 0
		while i < $allrs.length
			if $eto[0] is $allrs[i]
				eto_i = i
				break
			i++
	eto_i

showSave = -> $("i#saveconfig").show()

saveCfg = ->
	i = 0
	while i < admin_table_fields.length
		admin_table_fields[i].listorder = i
		i++
	$.post "/update_config" + which_route,
		list: JSON.stringify(admin_table_fields)
	, ->
		$("i#saveconfig").hide()

logOut = ->
	unless which_route.length
		location.href = "/sessions/new"
	else
		$.post "/session/end", ->
			location.href = "/"

delData = ->
	delarray = []
	$allrs = $("div.admin_table_record")
	$("input.deleteme:checked").each ->
		the_id = $(this).attr("id")
		the_id = the_id.substr(7)
		delarray.push the_id
	if which_route is "/vocabs"
		post_route = "/remove_voc"
	else if which_route.substr(0, 7) is "/vocab/"
		post_route = "/remove_voc/" + which_route.substr(7)
	else
		post_route = "/remove_from" + which_route
	$.post post_route,
		id_array: JSON.stringify(delarray)
	, ->
		i = 0
		while i < $allrs.length
			$nextrec = $($allrs[i])
			if $nextrec.find("input.deleteme").is(":checked")
				admin_table_records[i]["_id"] = null
				$nextrec.addClass "already_deleted"
			i++
		$("input.deleteme:checked").remove()
		$("button#less").hide()

addInstance = (o, wtf) ->
	if which_route is "/vocabs"
		$.post "/add_voc/" + o.vocab, {}, ->
			admin_table_records.push o
			wtf()
			false
	else if which_route.substr(0, 7) is "/vocab/"
		$.post "/add_voc/" + which_route.substr(7) + "/" + o.taxon, {}, ->
			admin_table_records.push o
			wtf()
			false
	else
		$.post "/add_to" + which_route,
			obj: JSON.stringify(o)
		, ->
			wtf()
			false

updateInstance = (id, o, wtf) ->
	$.post "/update" + which_route,
		id: id
		obj: JSON.stringify(o)
	, ->
		wtf()
		false


# when the list of fields being displayed is created, or added to
# $f points to the dom obj for the fieldname
# wtf takes a field object and 'closes' it
setupNewField = ($f, wtf) ->
	$f.hover (->
		if $("div.ui-resizable-resizing").length + $("div.ui-draggable-dragging").length is 0
			$(this).find("i.icon-remove-sign").stop().animate {opacity: "1"}, 1234
	# close button on hover
	), ->
		$(this).find("i.icon-remove-sign").stop().animate {opacity: "0"}, 123

	$f.find("i.icon-remove-sign").click -> # remove column on close button
		id = @id.substr(6)
		field = _.detect(admin_table_fields, (f) ->
			f.name is id
		)
		$(this).parent().remove()
		wtf field
		showSave()
		showPlusButt()


# file upload callbacks
uploadGood = ($who) ->
	$who.css
		color: "#284"
		backgroundColor: "#fff"
	$("div#modalmask").remove()

uploadProgress = ($who) ->
	$who.css "backgroundColor", "#ffa"

uploadBad = ($who) ->
	$who.css "backgroundColor", "#fba"
	$("div#modalmask").remove()

showAllInstanceFields = ->
	_.each admin_table_fields, (field) ->
		field.edited = true	if field.name isnt "id" and field.name isnt "_id"
	showSave()
	drawInstancePage()

setupNewInstanceField = ($f, context_flag) ->
	setupNewField $f, (field) ->
		field.edited = false
		$("input#input_" + field.name).parent().remove()
	$f.find(":first").bind "contextmenu", ->
		edit_flags = []
		if context_flag.match(/String/) # valid for String and [String]
			edit_flags = edit_flags.concat([
				name: "default"
				title: "Text"
			])
		if context_flag is "String" # valid only for String, not [String]
			edit_flags = edit_flags.concat([
				{
					name: "richtext"
					title: "Rich Text Editor"
				}
				{
					name: "upload"
					title: "File Upload"
				}
			])
		showContextMenu $(this).parent().attr("id"), edit_flags
		false

findInstanceFieldHeight = (field) ->
	if field.editflags is "upload" then return 54
	else if field.editflags is "richtext"
		if field.editheight then return field.editheight
		return 334
	44 # default


# draws the box with the list of labels
drawFieldBox = ->
	$fb = $("<div class=\"instancelabels\"></div>")
	sorted = _.sortBy(admin_table_fields, (f) ->
		f.editorder
	)
	
	# if editing users, don't show per-userpriv list for admin, or if there's only one option
	skipBools = false
	if which_route is "/admin"
		eto_i = editIndex()
		if eto_i >= 0
			skipBools = admin_table_records[eto_i]["name"] is "admin" or _.select(sorted, (f) ->
				f.listflags is "Boolean"
			).length is 1
	$("div.instancelabels").remove()
	_.each sorted, (field) ->
		$fb.append $("<div class=\"instancelabelholder\" id=\"instance_" + field.name + "\"><div class=\"instancelabel\">" + displayName(field) + "</div></div>")	if field.edited and not (skipBools and field.listflags is "Boolean")

	tmpw = 123
	id4w = _.detect(admin_table_fields, (f) ->
		f.name is "_id"
	)
	tmpw = id4w.editwidth	if id4w
	tmpw = 123	if tmpw < 123
	$fb.width tmpw
	$("div#detailtab").append $fb
	if adminflag
		$("div.instancelabelholder").each ->
			fieldname = $(this).attr("id")
			fieldname = fieldname.substr(fieldname.indexOf("_") + 1)
			if fieldname isnt "id" and fieldname isnt "_id"
				f = _.detect(admin_table_fields, (field) ->
					field.name is fieldname
				)
				$(this).append "<i id=\"close-" + fieldname + "\" class=\"icon-remove-sign\"></i>"
				setupNewInstanceField $(this), f.listflags

		setupPlusButt $("div.instancelabels").append("<i class=\"icon-plus-sign\"></i>"), showAllInstanceFields
		
		# the whole field box (the entire list of labels, not each label)
		# is resizable
		#			minHeight:$(this).height(),
		#			maxHeight:$(this).height(),
		$fb.resizable
			handles: "e"
			minWidth: 123
			maxWidth: 444
			stop: (e, ui) ->
				_.detect(admin_table_fields, (f) ->
					f.name is "_id"
				).editwidth = ui.element.width()
				ui.element.css # reset these styles, cos they mess with dragging ...
					left: ""
					top: ""
				showSave()

		
		# make each label draggable vertically :
		# with a helper that extends right across the page
		# and with the new order saved in field.editorder
		# and the corresponding input moved accordingly.
		$("div.instancelabelholder").draggable( # relabel on double-click
			axis: "y"
			helper: "clone"
			stack: ".instancelabelholder"
			start: (e, ui) ->
				$("i.icon-remove-sign").stop().animate {opacity: "0"}, 123
				ui.helper.animate(
					borderColor: "#EEE8D5"
				, "fast").css
					backgroundColor: "#FDF6E3"
					zIndex: "123"
			stop: (e, ui) ->
				$et = $(e.target)
				idstr = $et.attr("id").substr(9)
				movedf = _.detect(sorted, (f) ->
					f.name is idstr
				)
				h = 0
				newlist = []
				doneflag = false
				changedflag = true
				i = 0
				while i < sorted.length
					if sorted[i].edited
						if ui.position.top <= $et.position().top
							if not doneflag and ui.position.top <= h
								newlist.push movedf
								doneflag = true
								changedflag = false	if sorted[i] is movedf
							unless sorted[i] is movedf
								newlist.push sorted[i]
								h += findInstanceFieldHeight(sorted[i])	unless doneflag
						else
							unless sorted[i] is movedf
								newlist.push sorted[i]
								h += findInstanceFieldHeight(sorted[i])	unless doneflag
							if not doneflag and ui.position.top <= h
								doneflag = true
								changedflag = false	if sorted[i] is movedf
								newlist.push movedf
					else
						newlist.push sorted[i]
					i++
				newlist.push movedf	unless doneflag
				i = 0
				while i < newlist.length
					_.detect(admin_table_fields, (f) ->
						f.name is newlist[i].name
					).editorder = i
					i++
				sorted = newlist
				if changedflag
					drawInstancePage()
				else
					$(".ui-draggable-dragging").remove()
		).dblclick ->
			$that = $(this)
			$(this).find(".instancelabel").each ->
				$(this).replaceWith "<input class=\"minoredit\" value=\"" + $(this).html() + "\" />"
				$that.find("input").change ->
					id = $that.attr("id")
					id = id.substr(id.indexOf("_") + 1)
					_.detect(admin_table_fields, (f) ->
						f.name is id
					).displayname = $(this).val()
					showSave()
					$(this).replaceWith "<div class='instancelabel'>" + $(this).val() + "</div>"



#
# * returns true if the instance edit form is valid,
# * otherwise highlights the first invalid field
#
validateField = ($instanceInput) ->
	fn = $instanceInput.attr("id")
	return true	unless fn # no validation on things that don't have "instin_.." ids
	fn = fn.substr(7) # skip "instin_"
	field = _.detect(admin_table_fields, (f) ->
		f.name is fn
	)
	if false
		$(this).addClass "invalid_field"
		return false
	true

# returns true if the instance edit form field is valid,
# otherwise highlights the field as invalid
validateForm = ->
	flag = true
	$("div.instanceinput").each ->
		unless validateField($(this)) then flag = false
	return flag


# creates the list of files to display in chooser
# files is a list of {name,date,size} objects
# $where is the DOM object to append the list to
# selected is a callback which takes the filename
addFiles = (files, $where, selected) ->
	l = 0
	if files then l = files.length
	i = 0
	while i < l
		$where.append $("<div class='file_list_file'> \t\t\t\t\t<div class='filelist_name'>" + files[i].filelist_name.substr(0, 44) + "</div> \t\t\t\t\t<div class='filelist_size'>" + files[i].filelist_size + "</div> \t\t\t\t\t<div class='filelist_date'>" + files[i].filelist_date.substr(0, files[i].filelist_date.indexOf("T")) + "</div> \t\t\t\t\t</div>")
		i++
	$b.find("div.file_list_file").click(->
		selected $(this).find("div.filelist_name").text()
	).hover (->
		$(this).animate {backgroundColor: "#FDF6E3"}, "fast"
	), ->
		$(this).animate {backgroundColor: "#FFF"}, "fast"


#
# * make file upload werk, with hidden input@file
#
makeUploadValueBox = ($newin, field) ->
	
	#
	# activate the browse button
	#
	$newin.find("input").one "click", ->
		$whichin = $(this)
		$.ajax
			url: "/browse" + which_route + "?subdir=" + field.uploadpath
			cache: false
			beforeSend: (jqXHR, settings) ->
				settings["HTTP_X_REQUESTED_WITH"] = "XMLHttpRequest"

			success: (ajaxdata, txtsts, jqXHR) ->
				file_list = $.parseJSON(ajaxdata)
				
				#				if (file_list != null) {
				$m = $("<div class='modal_file_list'>")
				$t = $("<p class='title_file_list'>Select a file from the list, or " + "<input type='button' class='decoy' style='margin-top:1em;margin-bottom:1em' value='upload'/>" + "<input type='file' id='fileupload_" + field.name + "' name='fileupload_" + field.name + "' style='width:0px; height:0px;'/>" + " your own.</p>")
				$t.append "<div><div class='filelist_name'>Name</div> <div class='filelist_size'>Size</div> <div class='filelist_date'>Date</div></div>"
				$m.append $t
				$m.append "<i id=\"file_list_close\" class=\"icon-remove-sign\"></i>"
				$b = $("<div class='file_list_list'>")
				$m.append $b
				$("body").append $m
				$("div#file_list_close").click(->
					$m.remove()
					makeUploadValueBox $newin, field
				).animate(
					opacity: "0.5"
				, 1234).hover (->
					$(this).stop().animate {opacity: "1"}, 123
				), ->
					$(this).stop().animate {opacity: "0.5"}, 1234

				addFiles file_list, $b, (fn) ->
					$whichin.val(fn).addClass "altered"
					$m.remove()
					makeUploadValueBox $newin, field

				
				# sortable columns
				$t.find("div div").click ->
					sortup = true
					cname = $(this).attr("class")
					jname = cname.substr(cname.indexOf("filelist_"))
					i = jname.indexOf(" ")
					jname = jname.substr(0, i)	if i > 0
					if $(this).hasClass("sortup")
						$(this).removeClass "sortup"
						sortup = false
					else
						$(this).addClass "sortup"
					new_list = file_list
					new_list = _.sortBy(file_list, (f) ->
						unless sortup
							if jname is "filelist_size" # size is a number
								-f[jname]
							else
								_.map f[jname].split(""), (c) -> # _ reverse string sort!
									0xffff - c.charCodeAt()
						else f[jname]
					)
					$b.html ""
					addFiles new_list, $b, (fn) ->
						$whichin.val(fn).addClass "altered"
						$m.remove()
						makeUploadValueBox $newin, field


				
				# upload button
				$t.find("input.decoy").click ->
					$(this).next().click().change ->
						fn = $(this).val()
						fn = fn.substr(i + 1)	while (i = fn.indexOf("\\")) >= 0
						fn = fn.substr(i + 1)	while (i = fn.indexOf("/")) >= 0
						$whichin.val fn
						xhr2 = new XMLHttpRequest()
						uri = "/upload" + which_route + "?subdir=" + field.uploadpath
						xhr2.open "POST", uri, true
						xhr2.upload.addEventListener "error", (->
							uploadBad $whichin
						), false
						xhr2.upload.addEventListener "abort", (->
							uploadBad $whichin
						), false
						xhr2.upload.addEventListener "progress", (->
							uploadProgress $whichin
						), false
						xhr2.onload = (e) ->
							alert "Error: " + xhr2.status	unless xhr2.status is 200
							$whichin.val(xhr2.getResponseHeader("final-filename")).addClass "altered"
							uploadGood $whichin
							makeUploadValueBox $newin, field

						xhr2.setRequestHeader "Cache-Control", "no-cache"
						xhr2.setRequestHeader "X-Requested-With", "XMLHttpRequest"
						xhr2.setRequestHeader "X-File-Name", fn
						$("div#context-menu").after "<div id=\"modalmask\" class=\"greyout\"></div>"
						$m.remove()
						xhr2.send @files[0]
						false

					false


			
			error: (jqXHR, ststxt, err) ->
				# alert('AJAX ERROR: ' +ststxt + ':' + err);
				makeUploadValueBox $newin, field

		false

padStr = (i) ->
	(if i < 10 then "0" else "") + i

date2str = (d) ->
	if d
		if d and d.getMonth # good enuff test for Date?
			d = d.getFullYear() + "-" + padStr(1 + d.getMonth()) + "-" + padStr(d.getDate())
		else d = d.substr(0, d.indexOf("T"))	if d.length
	d

wrapSelect = (field, s) ->
	"<select id=\"input_" + field.name + "\">" + "<option class=\"emptyprompt\"></option>" + s + "</select>"

makeIDselect = (field) ->
	s = ""
	a = idvals[field.editflags]
	for i of a
		s += "<option value=\"" + a[i].id + "\">" + a[i].name.replace(/_/g, " ") + "</option>"
	wrapSelect field, s

makeVoxSelect = (field) ->
	s = ""
	a = vocabularies[field.editflags]
	for i of a
		s += "<option value=\"" + a[i] + "\">" + a[i].replace(/_/g, " ") + "</option>"
	wrapSelect field, s

createDifferentInput = (field, cb) ->
	# create input element
	field.editflags = ""	if typeof field.editflags is "undefined"
	switch field.editflags # editflags selects different ways of displaying a string (configurable)
		when "richtext"
			cb $("<textarea class=\"enrichme\" name=\"" + field.name + "\" id=\"input_" + field.name + "\"></textarea>")
		when "upload"
			field.uploadpath = "upload"	unless field.uploadpath
			cb $("<div class=\"uploadfields\" id=\"upload_" + field.name + "\"><span class=\"uploadurl\">...</span>&nbsp;/<span class=\"uploadpath\">" + field.uploadpath + "</span>/&nbsp;" + "<input type=\"text\" name=\"" + field.name + "\" id=\"input_" + field.name + "\"></input>" + "</div>")
		when "", "default"
			switch field.listflags # listflags selects different supported mongo data types (from schema)
				when "Boolean"
					cb $("<input type=\"checkbox\" name=\"" + field.name + "\" id=\"input_" + field.name + "\"/>" + field.name)
				when "Date"
					cb $("<input type=\"text\" name=\"" + field.name + "\" id=\"input_" + field.name + "\"></input>")
				when "[String]"
					cb $("<div class=\"multi " + field.name + "\">" + "<input type=\"text\" name=\"" + field.name + "\" id=\"input_" + field.name + "\"></input>" + "</div>")
				else
					cb $("<input type=\"text\" name=\"" + field.name + "\" id=\"input_" + field.name + "\"></input>")
		else # dynamic editflags
			switch field.listflags
				when "ObjectId"
					cb $(makeIDselect(field))
				when "[ObjectId]"
					cb $("<div class=\"multi " + field.name + "\">" + makeIDselect(field) + "</div>")
				when "[String]"
					cb $("<div class=\"multi " + field.name + "\">" + makeVoxSelect(field) + "</div>")
				else
					cb $(makeVoxSelect(field))

#
# * resize the field input on an instance edit page
#
makeEditResizable = ($where) ->
	$where.resizable
		handles: "e"
		minWidth: 124
		maxWidth: 1234
		helper: "ghostedinput"
		ghost: true
		stop: (e, ui) ->
			$the_in = ui.element
			$the_in = $the_in.find("INPUT")	if $the_in[0].tagName isnt "INPUT" and $the_in[0].tagName isnt "SELECT"
			id = $the_in.attr("id")
			id = id.substr(id.indexOf("_") + 1)
			id = id.substr(0, id.indexOf("_"))	if $the_in.parent().hasClass("multi")
			$the_in.width _.detect(admin_table_fields, (f) ->
				f.name is id
			).editwidth = ui.element.width()
			showSave() # we might want to save any re-arrangement of the fields

addValueBox = (field, $newin, $where, eto_i) ->
	$where.append $newin
	h = findInstanceFieldHeight(field)
	$newin.add($where).height(h).width field.editwidth
	$("div#instance_" + field.name).height h
	
	# setup validation handling
	if eto_i >= 0
		if field.editflags is "upload"
			$setthisone = $newin.find("input:first")
		else
			$setthisone = $newin
		valtoset = admin_table_records[eto_i][field.name]
		switch field.listflags
			when "Date"
				$setthisone.val date2str(valtoset)
			when "Boolean"
				$setthisone.attr "checked", valtoset
			when "[String]", "[ObjectId]"
				i = 0
				$setthisone = $newin.find("input,select")
				if valtoset and valtoset.length
					i = 0
					while i < valtoset.length
						$nxton = $setthisone.clone()
						$nxton.attr "id", $setthisone.attr("id") + "_" + i
						$nxton.val valtoset[i]
						$nxton.insertBefore $setthisone
						$nxton.width field.edithwidth
						i++
				$setthisone.width field.edithwidth
			else $setthisone.val valtoset
	else $newin.val ""
	if $newin.hasClass("multi")
		$newin.add($newin.parent()).removeAttr("width").css "width", "auto"
		$newin.find("select").height h
	else
		$newin.width field.editwidth
	$newin.find("input,select").width field.editwidth	unless field.editflags is "upload"
	$newin.change ->
		$(this).addClass "altered"
		if $(this).hasClass("multi")
			$lastone = $(this).find("select:last, input:last")
			kids = $(this).children()
			if $lastone.val().length
				$newon = $lastone.clone()
				$newon.val ""
				$lastone.attr "id", $lastone.attr("id") + "_" + (kids.length - 1)
				$newon.insertAfter $lastone
			else
				if kids.length
					i = 0
					while i < kids.length - 1
						$(kids[i]).remove()	unless $(kids[i]).val().length
						i++
		if validateField($(this), eto_i)
			$("button#save").show()	if validateForm(eto_i)
		else
			$("button#save").hide()

	
	#
	# 	 * there's a lot of extra logic for some types
	# 	 * so let's break em out into a separate function
	#
	if field.editflags is "upload" then makeUploadValueBox $newin, field
	else if field.listflags is "Date"
		$newin.datepicker
			dateFormat: "yy-mm-dd"
			defaultDate: $newin.val()

	if adminflag # some features only open to admin :
		
		# maybe make it resizable
		makeEditResizable $where	if field.editflags is "default" or field.editflags is ""
		if field.editflags is "upload" # admin can change upload path
			$newin.find("span.uploadpath").css("color", "#9bd").click ->
				$("<input type='text' class='temp' value='" + $(this).text() + "'>").insertAfter($(this).hide()).focus().blur ->
					$target = $(this).parent().find("span.uploadpath")
					unless $target.text() is $(this).val()
						txt = $(this).val()
						txt = txt.substr(1, txt.length - 1)	while txt.length and (txt.charAt(0) is "/")
						txt = txt.substr(0, txt.length - 1)	while txt.length and (txt.charAt(txt.length - 1) is "/")
						$target.text txt
						id = $(this).parent().parent().attr("id")
						id = id.substr(id.indexOf("_") + 1)
						_.detect(admin_table_fields, (f) ->
							f.name is id
						).uploadpath = txt
						showSave() # might want to save the new uploadpath
					$target.show()
					$(this).remove()


	
	# add ckeditor widgets to elements that need enriching
	if $newin.hasClass("enrichme")
		cki = CKEDITOR.instances["input_" + field.name]
		cki.destroy()	if cki
		$newin.ckeditor (->
			spanid = @container.$.id
			$instance = $("#" + spanid).parent()
			h = $("#" + spanid).height()
			spanid = spanid.substr(spanid.indexOf("input_") + 6)
			field = _.detect(admin_table_fields, (f) ->
				f.name is spanid
			)
			if field.editheight
				h = field.editheight
				$("#" + spanid).height h
				@resize field.editwidth, field.editheight
			$instance.height h
			$("div#instance_" + spanid).height h
		),
			skin: "v2"
			filebrowserBrowseUrl: "/ck_browse"
			filebrowserUploadUrl: "/ck_upload"

		cki = CKEDITOR.instances["input_" + field.name]
		if cki
			cki.on "resize", (e) ->
				f_id = @container.$.id
				i = f_id.indexOf("input_") + 6
				f_id = f_id.substr(i)
				field = _.detect(admin_table_fields, (f) ->
					f.name is f_id
				)
				w = $(e.editor.getResizable().$).width()
				h = $(e.editor.getResizable().$).height()
				if adminflag and (w isnt field.editwidth or h isnt field.editheight)
					field.editwidth = w
					field.editheight = h
					showSave()
				$("div#instance_" + field.name).height field.editheight
				$("div#instin_" + field.name).height field.editheight
				e.editor.resetDirty()
				false

		$where.width "999px"

#
# makes the value (data entry) input or widget for each field
#
makeValueBox = (field, $where, eto_i) ->
	createDifferentInput field, ($newin) ->
		addValueBox field, $newin, $where, eto_i

drawValueBox = ->
	$vb = $("<div class=\"instanceinputs\"></div>")
	$eto = $(".edit_this_one")
	eto_i = editIndex()
	
	# if editing users, don't show per-userpriv list for admin, or if there's only one option
	skipBools = false
	if which_route is "/admin"
		eto_i = editIndex()
		if eto_i >= 0
			skipBools = admin_table_records[eto_i]["name"] is "admin" or _.select(sorted, (f) ->
				f.listflags is "Boolean"
			).length is 1
	$("div.instanceinputs").remove()
	$("div#detailtab").append $vb
	sorted = _.sortBy(admin_table_fields, (f) ->
		f.editorder
	)
	_.each sorted, (field) ->
		if field.edited
			unless skipBools and field.listflags is "Boolean"
				$commontainer = $("<div class=\"instanceinput\" id=\"instin_" + field.name + "\"></div>")
				$vb.append $commontainer
				makeValueBox field, $commontainer, eto_i
			else console.log " I think i need to do something here ..."	if field.listflags is "[String]"

	$vb.append "<button id=\"save\">Save</button><button id=\"cancel\">Cancel</button>\""
	$("button#cancel").click ->
		hideInstancePage()

	$("button#save").click ->
		newobj = {}
		for instance of CKEDITOR.instances
			if CKEDITOR.instances[instance].checkDirty()
				CKEDITOR.instances[instance].updateElement()
				$("#" + instance).addClass "altered"
		$(".instanceinput .altered").each ->
			if $(this).hasClass("multi")
				kids = $(this).children()
				fieldname = $(kids[kids.length - 1]).attr("id")	if kids.length
			else
				fieldname = $(this).attr("id")
			fieldname = fieldname.substr(fieldname.indexOf("_") + 1)
			field = _.detect(admin_table_fields, (f) ->
				f.name is fieldname
			)
			switch field.listflags
				when "[String]", "[ObjectId]"
					newobj[fieldname] = []
					kids = $(this).children()
					if kids.length
						i = 0

						while i < kids.length - 1
							newobj[fieldname].push $(kids[i]).val()	if $(kids[i]).val().length
							i++
				when "Date"
					newobj[fieldname] = new Date($(this).val().replace(/-/g, "/"))
				when "Boolean"
					newobj[fieldname] = $(this).is(":checked")
				else
					newobj[fieldname] = $(this).val()
			if eto_i >= 0
				admin_table_records[eto_i][fieldname] = newobj[fieldname]
				$f = $eto.find("div.record_field_" + fieldname)
				if field.listflags is "Boolean"
					$f.html((if $(this).is(":checked") then "&#9746" else "")).css textAlign: "center"
				else if field.listflags is "[String]" or field.listflags is "[ObjectId]"
					$f.html ""
					if newobj[field.name]
						if newobj[field.name].length is 1
							$f.html newobj[field.name][0]
						else $f.html newobj[field.name][0] + "..."	if newobj[field.name].length
				else
					$f.text $(this).val()


		$("input.hasDatepicker").each ->
			$(this).datepicker "destroy"


		if eto_i >= 0
			if admin_table_records[eto_i]["modified_date"]
				nowtoday = new Date()
				admin_table_records[eto_i]["modified_date"] = nowtoday
				$eto.find("div.record_field_modified_date").text date2str(nowtoday)
			setTimeout (->
				updateInstance admin_table_records[eto_i]["_id"], newobj, ->
					$eto.removeClass("edit_this_one").addClass "already_edited"
					hideInstancePage()
			), 23
		else
			addInstance newobj, ->
				drawListPage()


fadeInListPage = ->
	$("div#maintab").addClass("current").stop().css(
		display: "block"
		opacity: "0.1"
	).animate {opacity: "1.0"}, 666, ->
		$(this).css "opacity", "1.0"
		showPlusButt()

fadeOutListPage = ->
	$("div#maintab").removeClass("current").stop().animate {opacity: "0.1"}, 666, ->
		$(this).css "opacity", "0"
		$(this).css "display", "none"

scrollDownInstancePage = (cb) ->
	h = $(window).height() + 23
	$("div#detailtab").removeClass("current").stop().animate {top: h + "px"},
		duration: 666
		complete: ->
			$(this).css("display", "none").html ""
		step: (now, fx) ->
			if h
				if now > h / 4
					h = 0
					cb()

scrollUpInstancePage = ->
	$("div#detailtab").addClass("current").stop().css("display", "block").animate {top: "99px"}, 666, ->
		showPlusButt()


scrollUpWindow = ->
	$("html, body").animate {scrollTop: 0}, 666

destroyRichEditors = ->
	unless typeof CKEDITOR is "undefined"
		for cki of CKEDITOR.instances
			i = CKEDITOR.instances[cki]
			i.destroy false

hideInstancePage = ->
	unless $("div#detailtab").css("display") is "none"
		scrollUpWindow()
		scrollDownInstancePage fadeInListPage
	destroyRichEditors()

drawWithVox = ->
	destroyRichEditors()
	drawFieldBox()
	drawValueBox()
	scrollUpWindow()
	scrollUpInstancePage()
	fadeOutListPage()

drawInstancePage = ->
	closePlusMenu()
	vocabularies = {}
	justsayAJAJ "/vox_n_tax", (o) ->
		vocabularies = o
		drawWithVox()


drawListPage = ->
	$("div.admin_table_records").html "" # clear the dom representation of the list ...
	if which_route is "/vocabs" or which_route.substr(0, 7) is "/vocab/"
		drawData 0
	else
		admin_table_records.length = 0 # clear the list itself
		#	$('.stayVisible').removeClass('stayVisible').css('visibility', 'hidden'); // and remove any sorting options
		getData()
	hideInstancePage()

closeContextMenu = ->
	$("div#modalmask").remove()
	$("div#context-menu").html("").fadeOut()
	false

addContextField = (id, name, title) ->
	title = name	unless title
	$("div#context-menu-fields").append $("<div class=\"context-field\" id=\"" + id + "_context_" + name + "\">" + title + "</div>")



# constructs the context menu for changing field types (editflags)
# takes an optional list of (string) type overrides:
# otherwise, it might uses tablenames as types for objectid

showContextMenu = (field_id, whichtags) ->
	$loc = $("div#" + field_id + " >div")
	field_id = field_id.substr(9)
	$("div#context-menu").html("<div id=\"context-menu-fields\"></div>").css(
		left: 23 + $loc.offset().left
		top: $loc.offset().top
	).after "<div id=\"modalmask\"></div>"
	if whichtags.length
		_.each whichtags, (tag) ->
			addContextField field_id, tag.name, tag.title

		plusvoxflag = true
		for vocab of vocabularies
			if vocabularies[vocab].length
				if plusvoxflag
					$("div#context-menu-fields").append "<div class='contextmenubreak'></div>"
					plusvoxflag = false
				addContextField field_id, vocab
	else
		addContextField field_id, "", "raw ID"
		$("div#context-menu-fields").append "<div class='contextmenubreak'></div>"
		tt = $("a#table-name").text() # this tablename
		_.each admin_table_names, (t) -> # each tablename
			addContextField field_id, t	unless t is tt

	$("div#modalmask").click ->
		closeContextMenu()

	$("div.context-field").hover(->
		$(this).css "background-color", "#fff"
	, ->
		$(this).css "background", "transparent"
	).click ->
		f_id = $(this).attr("id")
		i = f_id.indexOf("_context_")
		flag_name = f_id.substr(i + 9)
		f_id = f_id.substr(0, i)
		field = _.detect(admin_table_fields, (f) ->
			f.name is f_id
		)
		unless field.editflags is flag_name
			field.editflags = flag_name
			showSave()
			
			# redraw input
			#
			# after removing what's there, we might need to abstract out guts of drawvaluebox to get the field redrawn
			# then might want to recalc the height of the corresponding label ...
			eto_i = editIndex()
			$where = $("div#instin_" + field.name)
			$where.empty()
			
			#			if (field.listflags == 'ObjectId' && field.editflags != '' && !idvals[field.editflags]) {
			#				justsayAJAJ('/keys/' + field.editflags, function(a){
			#					idvals[field.editflags] = a;
			#					makeValueBox(field, $where, eto_i);
			#				});
			#			} else {
			makeValueBox field, $where, eto_i
			makeEditResizable $where	if field.editflags is "default" or field.editflags is ""
		
		#}
		closeContextMenu()

	$("div#context-menu").fadeIn 666


closePlusMenu = ->
	$("div#plus-menu").html("").fadeOut()
	$("div#modalmask").remove()
	false

showPlusMenu = ->
	$("div#plus-menu").html("<div id=\"plus-menu-fields\"></div>").css(
		left: $("div.current i.icon-plus-sign").offset().left
		top: $("div.current i.icon-plus-sign").offset().top
	).after "<div id=\"modalmask\"></div>"
	$("div#modalmask").click ->
		closePlusMenu()

	_.each admin_table_fields, (field) ->
		if $("div#maintab").hasClass("current") and not field.listed or $("div#detailtab").hasClass("current") and not field.edited
			$f = $("<div class=\"plus-field\" id=\"plus_menu_field_" + field.name + "\"></div>")
			$f.html field.name
			$("div#plus-menu-fields").append $f

	$("div.plus-field").hover(->
		$(this).css "background-color", "#fff"
	, ->
		$(this).css "background", "transparent"

	).click ->
		id = @id.substr(16) # plus_menu_field_xxx
		field = _.detect(admin_table_fields, (f) ->
			f.name is id
		)
		field.listed = true
		$f = addNewField(field)
		drawNewColumn field
		makeFieldResizable $f
		showSave()
		showPlusButt()
		closePlusMenu()

	$("div#plus-menu").fadeIn 666

showPlusButt = ->
	if $("div#maintab").hasClass("current")
		if _.all(admin_table_fields, (f) ->
			f.listed or f.name is "_id" or f.name is "id"
		)
			$("div.current i.icon-plus-sign").fadeOut()
		else
			$("div.current i.icon-plus-sign").fadeIn 666, ->
				$("div.current i.icon-plus-sign").animate {opacity: "0.5"}, 1234
	else
		if _.all(admin_table_fields, (f) ->
			f.edited or f.name is "_id" or f.name is "id"
		)
			$("div.current i.icon-plus-sign").fadeOut()
		else
			$("div.current i.icon-plus-sign").fadeIn 666, ->
				$("div.current i.icon-plus-sign").animate {opacity: "0.5"}, 1234

blurFresh = ->
	$("i#refreshbutt").css "color", "#bbb"

showRefreshButt = ->
	$("i#refreshbutt").show().click(->
		tmp = $(this).click(false)
		justsayAJAJ "/refresh", (->
			$(this).click tmp
			blurFresh()
		), blurFresh, {}
	).hover (->
		$(this).css "color", "#fff"
	), blurFresh

setupPlusButt = ($plusbutt, wtf) ->
	$plusbutt.find("i.icon-plus-sign").css(opacity: "0.5").hover(->
		$("div.current i.icon-plus-sign").stop().animate {opacity: "1"}, 123
	, ->
		$("div.current i.icon-plus-sign").stop().animate {opacity: "0.5"}, 1234
	).click ->
		wtf()
		false

makeFieldResizable = ($f) ->
	if adminflag
		# reset these styles, cos they mess with dragging ...
		$f.resizable(
			handles: "e"
			minWidth: 44
			maxWidth: 444
			alsoResize: ".record_" + $f.attr("id")
			start: (e, ui) ->
				ui.element.css position: ""
				$("i.icon-remove-sign").stop().animate {opacity: "0"}, 123

			resize: (e, ui) ->
				ui.element.css left: "0px"

			stop: (e, ui) ->
				_.detect(admin_table_fields, (f) ->
					f.name is ui.element.attr("id").substr(6)
				).listwidth = ui.element.width()
				ui.element.css(
					position: ""
					left: ""
					top: ""
				).find(".ui-resizable-handle").css
					left: ""
					right: "0px"
				showSave()
		).draggable
			axis: "x"
			helper: "clone"
			stack: ".admin_table_field"
			start: (e, ui) ->
				$("i.icon-remove-sign").stop().animate {opacity: "0"}, 123
				ui.helper.animate({borderColor: "#EEE8D5"}, "fast").css
					backgroundColor: "#FDF6E3"
					zIndex: "123"


			stop: (e, ui) ->
				newlist = []
				$et = $(e.target)
				$et.css position: ""
				idstr = $et.find("i.icon-remove-sign").attr("id").substr(6)
				movedf = _.detect(admin_table_fields, (f) ->
					f.name is idstr
				)
				w = $("div.admin_table_fields").offset().left
				doneflag = false
				changedflag = true
				i = 0

				while i < admin_table_fields.length
					if admin_table_fields[i].listed
						if ui.position.left <= $et.position().left
							if not doneflag and ui.position.left <= w
								newlist.push movedf
								w += movedf.listwidth
								doneflag = true
								changedflag = false	if admin_table_fields[i] is movedf
							unless admin_table_fields[i] is movedf
								newlist.push admin_table_fields[i]
								w += admin_table_fields[i].listwidth
						else
							unless admin_table_fields[i] is movedf
								newlist.push admin_table_fields[i]
								w += admin_table_fields[i].listwidth
							if not doneflag and ui.position.left <= w + movedf.listwidth
								newlist.push movedf
								w += movedf.listwidth
								doneflag = true
								changedflag = false	if admin_table_fields[i] is movedf
					i++
				newlist.push movedf	unless doneflag
				admin_table_fields = newlist
				if changedflag
					drawFields()
					drawData 0
					showSave()

makeFieldsResizable = ->
	$(".admin_table_field").each ->
		makeFieldResizable $(this)

setupNewListField = ($f) ->
	setupNewField $f, (field) ->
		field.listed = false
		$("div.record_field_" + field.name).remove()


# when the list of fields being displayed is created, or added to
sortableNewField = ($f) ->
	$f.dblclick -> # sort on double-click
		$b = $(this).find("i.icon-caret-up")
		if $b.hasClass("stayVisible")
			$b = $(this).find("i.icon-caret-down")
		else $b = null	if $(this).find("i.icon-caret-down").hasClass("stayVisible")
		$(".stayVisible").removeClass("stayVisible").css "visibility", "hidden"
		$b.addClass("stayVisible").css "visibility", "visible"	if $b
		admin_table_records.length = 0
		$("div.admin_table_records").html ""
		getData()
		false


# draw the data that corresponds to the (previously hidden) field which we just added
drawNewColumn = (field) ->
	$allrs = $("div.admin_table_record")
	i = 0
	while i < $allrs.length
		$f = $("<div class=\"admin_table_record_field record_field_" + field.name + "\"></div>")
		$f.width field.listwidth
		if field.listflags is "Date"
			$f.text date2str(admin_table_records[i][field.name])
		else if field.listflags is "Boolean"
			$f.html((if admin_table_records[i][field.name] then "&#9746" else "")).css textAlign: "center"
		else if field.listflags is "[String]" or field.listflags is "[ObjectId]"
			if admin_table_records[i][field.name]
				if admin_table_records[i][field.name].length is 1
					$f.html admin_table_records[i][field.name][0]
				else
					$f.html admin_table_records[i][field.name][0] + "..."
		else
			$f.html admin_table_records[i][field.name]
		$($allrs[i]).append $f
		i++

# draw the data that comes in via ajaj
drawData = (pos) ->
	$("div#addmore").remove()
	$allrs = $("div.admin_table_records")
	if $allrs.length is 0
		$allrs = $("<div class=\"admin_table_records\"></div>")
		$("div.admin_table_fields").after $allrs
	i = pos
	while i < admin_table_records.length
		$r = $("<div class=\"admin_table_record\"></div>")
		if admin_table_records[i]["_id"] is null
			$r.addClass "already_deleted"
		else
			if which_route is "/vocabs"
				keyfieldname = "vocab"
			else if which_route.substr(0, 7) is "/vocab/"
				keyfieldname = "taxon"
			else
				keyfieldname = "_id"
			$r.append "<input type=\"checkbox\" class=\"deleteme\" id=\"delete_" + admin_table_records[i][keyfieldname] + "\" /></div>"
		$allrs.append $r
		_.each admin_table_fields, (field) ->
			if field.listed
				if field.listflags is "Date"
					list_content = date2str(admin_table_records[i][field.name])
				else if field.listflags is "ObjectId" and field.editflags isnt ""
					a = idvals[field.editflags]
					j = 0

					while j < a.length
						if a[j].id is admin_table_records[i][field.name]
							list_content = a[j].name
							break
						j++
				else
					list_content = admin_table_records[i][field.name]
					if field.listflags is "[String]"
						if not list_content or not list_content.length
							list_content = ""
						else if list_content.length is 1
							list_content = list_content[0]
						else
							list_content = list_content[0] + "..."
					else if field.listflags is "[ObjectId]"
						if not list_content or not list_content.length
							list_content = ""
						else
							if a = idvals[field.editflags]
								j = 0

								while j < a.length
									if a[j].id is list_content[0]
										if list_content.length is 1
											list_content = a[j].name
										else
											list_content = a[j].name + "..."
										break
									j++
					else list_content = list_content.substr(0, 69)	if list_content.length > 69	if list_content	unless field.listflags is "Boolean"
				$f = $("<div class=\"admin_table_record_field record_field_" + field.name + "\"></div>")
				$f.width field.listwidth
				if field.listflags is "Boolean"
					$f.html((if list_content then "&#9746" else "")).css textAlign: "center"
				else
					$f.text list_content
				$r.append $f
		i++
	makeFieldsResizable()
	$("input.deleteme").hover(->
		unless $(this).is(":checked")
			$(this).animate {opacity: "1"}, 333
	, ->
		unless $(this).is(":checked")
			$(this).animate {opacity: "0"}, 123
	).click (e) ->
		if $(".deleteme:checked").length
			$("button#less").show()
		else
			$("button#less").hide()
		e.stopPropagation()

	$allrs.append "<div id=\"addmore\"></div>"
	$("div#addmore").append "<button id=\"less\">DELETE</button>"
	$("button#less").show()	if $(".deleteme:checked").length
	$("button#less").click ->
		delData()
		false

	if i - pos is 20 # we got another full 20 records
		$("div#addmore").append "<button id=\"more\">More ...</button>"
		$("button#more").click ->
			getData()

	$("div#addmore").append '<button id="add">ADD</button>'
	$("button#add").click ->
		$("div.edit_this_one").removeClass "edit_this_one"
		drawInstancePage()

	$("div.admin_table_record").hover(->
		$("div.admin_table_record").find(".hovering").removeClass "hovering"
		$(this).addClass "hovering"
	, ->
		$(this).removeClass "hovering"
	).click ->
		if which_route is "/vocabs"
			location.hash = "/vocab/#{$(this).text()}"
		else unless which_route.substr(0, 7) is "/vocab/"
			$("div.edit_this_one").removeClass "edit_this_one"
			unless $(this).hasClass "already_deleted"
				$(this).addClass "edit_this_one"
				drawInstancePage()
		false


# when the list of fields being displayed is created, or added to
getData = ->
	route = "#{which_route}/list/#{admin_table_records.length}"
	$(".stayVisible").each -> # there can be only one ...
		name = @id.substr(@id.indexOf("-") + 1)
		order = @id.substr(0, @id.indexOf("-"))
		name = "-" + name	if order is "desc"
		route = route + "/" + name

	$.ajax
		url: route
		cache: false
		beforeSend: (jqXHR, settings) ->
			settings["HTTP_X_REQUESTED_WITH"] = "XMLHttpRequest"

		success: (ajaxdata, txtsts, jqXHR) ->
			i = admin_table_records.length
			admin_table_records = admin_table_records.concat($.parseJSON(ajaxdata))
			drawData i

		error: (jqXHR, ststxt, err) ->
			drawData 0


#
#* DEBUGGING
#					alert('AJAX ERROR: ' +ststxt + ':' + err);
#					$('div#container').html(jqXHR.responseText);
#
addNewField = (field) ->
	$f = $('<div id="field_' + field.name + '" class="admin_table_field"></div>')
	$f.width(field.listwidth).html displayName(field)
	if ($p = $("div.current i.icon-plus-sign")).length
		$p.before $f
	else
		$("div.admin_table_fields").append $f
	if which_route isnt "/vocabs" and which_route.substr(0, 7) isnt "/vocab/"
		$f.append '<i id="desc-' + field.name + '" class="icon-caret-down"></div>  <i id="asc-' + field.name + '" class="icon-caret-up"></div>'
		if adminflag
			$f.append '<i id="close-' + field.name + '" class="icon-remove-sign"></i>'
			setupNewListField $f
		sortableNewField $f
		
		# before anyone tries to sort, or load more, let's make sure this field is the last listed ...
		newlist = []
		i = 0

		while i < admin_table_fields.length
			newlist.push admin_table_fields[i]	unless admin_table_fields[i] is field
			i++
		newlist.push field
		admin_table_fields = newlist
	$f

# initiate the list of fields being displayed
drawFields = ->
	$("div#maintab").html '<div class="admin_table_fields"></div>'
	_.each admin_table_fields, (field) ->
		if field.listed then addNewField field
	if adminflag
		setupPlusButt $("div.admin_table_fields").append('<i class="icon-plus-sign"></i>'), showPlusMenu
		showPlusButt()

# callAfter: callback for when hash changes and new data is called up
# (either array of obs or anti-template data)
# - just loads the table: all the real work happens on the page
callAfter = (route, from)->
	which_route = "/" + route
	unless _.isArray(from) # just the list of tables ...
		admin_table_names.length = 0
		admin_table_records.length = 0
		$("div.admin_table_records").html ""
		$("a#table-name").html ""
		from.find("a.table").each ->
			t = $(this).text()
			if t is "admin"
				adminflag = true # if the server sent the admin table, that means we're logged in as the superadmin
				showRefreshButt()
			else
				admin_table_names.push t

		if admin_table_names.length is 1 # if there's only one table, just go to it.
			hideInstancePage()
			location.hash = "/" + admin_table_names[0]
	else
		if which_route is "/vocabs"
			admin_table_fields = [
				name: "vocab"
				listed: true
				edited: true
				listwidth: 123
				editwidth: 123
			]
			admin_table_records = from
			drawFields()
			drawData 0
		else if which_route.substr(0, 7) is "/vocab/"
			admin_table_fields = [
				name: "taxon"
				listed: true
				edited: true
				listwidth: 123
				editwidth: 123
			]
			admin_table_records = _.select(from, (f) -> # ignore falsy which started it all ...
				f.taxon
			)
			drawFields()
			drawData 0
		else
			admin_table_fields = from
			if which_route is "/admin"
				if adminflag or _.select(admin_table_fields, (f) ->
					f.listflags is "Boolean"
				).length is 1
					_.each admin_table_fields, (field) ->
						if field.listflags is "Boolean" then field.listed = false

			drawFields()
			callcount = 1
			_.each admin_table_fields, (field) ->
				callcount++	if field.listflags.match(/ObjectId/) and field.editflags isnt "" and not idvals[field.editflags]

			getDataAfter = _.after(callcount, getData)
			_.each admin_table_fields, (field) ->
				if field.listflags.match(/ObjectId/) and field.editflags isnt "" and not idvals[field.editflags]
					justsayAJAJ "/keys/#{field.editflags}", (a) ->
						idvals[field.editflags] = a
						getDataAfter()
			getDataAfter()
		$("a#table-name").html route
		$("button#loginlogout").html("Logout").show()
	
	# who'dathunk: turns out,
	# this is a good place to work out whether we're logging in or out ...
	$b = $("button#loginlogout")
	if route.substr(0, 8) is ""
		$b.html("Login").show()
	else unless route.substr(0, 8) is "/session"
		$b.html("Logout").show()
	else $b.hide()
	$b.click ->
		logOut()
	
	# other header links ...
	$("i#saveconfig").click ->
		saveCfg()
	hideInstancePage()

justsayUpdate callAfter

$("button#loginlogout").click ->
	logOut()


$.getScript "http://#{justsayno.de.localurl}/ckeditor/ckeditor.js", (d, s) ->
	$.getScript "http://#{justsayno.de.localurl}/ckeditor/adapters/jquery.js", (data, status) ->

$("input#login").focus()
