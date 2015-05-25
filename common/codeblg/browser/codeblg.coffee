
editInPlace = ($d, tag, id) ->
	$d.find(tag + "#" + id).click ->
		v = $(this).text()
		if tag is "p"
			r = "textarea"
		else
		    r = "input"
		$(this).replaceWith "<#{r} id='#{id}' class='canhide'>#{v}</#{r}>"
		$d.find("#{r}##{id}").focus().blur ->
			v = $(this).val()
			if v.length
				v = v.replace(/\n/g, '\n<br>')
				$(this).replaceWith "<#{tag} id='#{id}' class='canhide'>#{v}</#{tag}>"
			editInPlace $d, tag, id


addTag = (t) ->
	if not t or not t.length then return
	$t = $("<span class='tags'>#{t}<i class='icon-remove-sign'></i></span>")
	$('.intaglist .taglist').append $t
	$t.find('i').click ->
		$(this).parent().remove()


window.setupEdit = ->
	$("i.maybe-edit").hover((->
		$(this).addClass "hoverbutt"
	), (->
		$(this).removeClass "hoverbutt"
	)).click ->
		user = runWithAuth()
		if not user or "admin" isnt user.handle then return false

		$("body").prepend justGetFrag("inform.jade")
		$d = $("div#modal")
		$("i.icon-remove-sign").hover((->
			$(this).addClass "hoverbutt"
		), (->
			$(this).removeClass "hoverbutt"
		)).click ->
			$d.remove()
			$("div#modalbg").remove()

		editInPlace($d, "h1", "title").click()
		editInPlace $d, "p", "description"

		$d.find("button").click ->
			payload =
				description: $d.find("p#description").html()
				title:       $d.find("h1#title").text()
				name:        $d.find("input#name").text()

			$tags = $('.intaglist .taglist').find('.tags')
			if $tags.length
				payload.tags = []
				$tags.each -> payload.tags.push $(this).text()
			justsayAJAJ "/blog/", (->
				$d.remove()
				$("div#modalbg").remove()
			), ((err) ->
				$d.find("h1#title").addClass "error"
			), payload

		$d.find('input.intag, select.intag').change ->
			addTag $(this).val()
			$(this).val('')

		justsayAJAJ "/tags", (tags)->
			for tag in tags
				$d.find('select.intag').append "<option value='#{tag}'>#{tag}</option>"

