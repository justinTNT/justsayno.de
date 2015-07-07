_ = require('underscore')
ft = require('../../justsayno.de/fieldtools')
card = require('./schema/card').name
fs = require('fs')
bodyParser = require('body-parser')

awesome =
  fb: '&#xf082;'
  twit: '&#xf099;'
  goog: '&#xf0d5;'
  street: '&#xf015; &nbsp;'
  postal: '&#xf003; &nbsp;'
  phone: '&#xf095; '
  fax: '<b> f </b> &nbsp;'
  mobile: '<b>m </b> '

social =
  fb: 'http://facebook.com/'
  twit: 'http://twitter.com/'
  goog: 'http://plus.google.com/'

makeAwesome = (i, txt) ->
  if txt.length or social[i]
    return '<span class=\'awesome\'>' + awesome[i] + '</span>' + txt
  ''

###
# ensures dir exists before running f
###

runInDir = (dir, f) ->
  fs.mkdir dir, 0755, (err) ->
    f()
    return
  return

###
# this convoluted conclusion to the very simple file load
# is cos we might want to rename it if it already exists ...
###

finishFileLoad = (from, to, count, cb) ->
  fs.stat to, (err, stats) ->
    i = undefined
    if !err
      if count
        while to.charAt(to.length - 1) != '_'
          to = to.substr(0, to.length - 1)
        to = to.substr(0, to.length - 1)
      to = to + '_' + count.toString()
      count++
      finishFileLoad from, to, count, cb
    else
      fs.rename from, to
      while (i = to.indexOf('/')) >= 0
        to = to.substr(i + 1)
      cb to
    return
  return

STRstatdirlist = (path, files, stats, cb) ->
  if files.length
    fn = files.shift()
    fs.stat path + fn, (err, s) ->
      if !err
        mt = JSON.stringify(s.mtime)
        stats.push
          filelist_name: fn
          filelist_date: mt
          filelist_size: s.size
      STRstatdirlist path, files, stats, cb
      return
  else
    cb stats
  return

module.exports = (env) ->
  urlencodedParser = bodyParser.urlencoded(extended: true)
  Card = env.db.model(card)

  doc2card = (doc) ->
    all_objs = {}
    if !doc
      return all_objs
    if doc._doc
      doc = doc._doc
    if doc.upgrade
      all_objs.showpage = page: doc.page
    else
      delete doc.page
      all_objs.card = ft.translateFields(doc)
      c = all_objs.card[0]
      for i of c
        if social[i]
          if c[i].length
            c[i + '.href'] = social[i] + c[i] + '/'
        else if i == 'link'
          if c[i].length
            c[i + '.href'] = 'http://' + c[i] + '/'
        else if i == 'use_email'
          if c[i]
            c['email'] = c.email
            c['email.href'] = 'mailto:' + c.email
        else if i == 'use_dmail'
          if c[i] and !c['use_email']
            c['email'] = c.name + '@' + env.url
            c['email.href'] = 'mailto:' + c.email
        if awesome[i]
          if i == 'mobile' and (!c.phone or !c.phone.length)
            c[i] = makeAwesome('phone', c[i])
          else if social[i]
            if c[i].length
              c[i] = makeAwesome(i, '')
            else
              delete c[i]
          else if c[i].length
            c[i] = makeAwesome(i, c[i])
          else
            delete c[i]
    all_objs

  rspnd = (e, r, d, q, s, n, t, o) ->
    # noticed I was doin a lot of this ...
    if r or !d
      return n()
    t = [ {
      selector: '#mainbit'
      filename: t
    } ]
    e.respond q, s, e.basetemps, t, o
    return

  loggedIn = (user, handle) ->
    if !handle
      handle = user.handle
    user and user.pass and user.handle == handle

  getMyCard = (req, next, f) ->
    if loggedIn(req.session.user, req.params.card)
      Card.findOne { name: req.session.user.handle }, (err, doc) ->
        if err or !doc
          throw err
        f doc._doc
        return
    else
      next()
    return

  editCard = (req, res, next, flip) ->
    getMyCard req, next, (card) ->
      `var o`
      err = null
      if flip == true or card.upgrade and flip != false
        o = 
          name: card.name
          page: card.page
        rspnd env, err, card, req, res, next, 'editpage.htm', editpage: ft.translateFields(o)
      else
        f = [
          'url'
          'name'
          'email'
        ]
        card.url = env.url
        card.email = req.session.user.handle + '@alicesprings.email'
        o = {}
        for keys of card
          if _.indexOf(f, keys) == -1
            if keys == 'use_email' or keys == 'use_dmail'
              o[keys] = keys + '.checked'
            else
              o[keys] = keys + '.value'
        f.push o
        rspnd env, err, card, req, res, next, 'editcard.htm', editcard: ft.translateFields(card, f)

  on404orCreate = (req, res, next) ->
    if loggedIn(req.session.user, req.params.notfound)
      c =
        name: req.params.notfound
        contactemail: req.session.user.email
        email: req.session.user.handle + '@alicesprings.email'
        active: false
      new Card(c).save (err) ->
        rspnd env, err, c, req, res, next, 'editcard.htm', card: ft.translateFields(c)
        return
    else
      Card.findOne { name: '404' }, (err, doc) ->
        rspnd env, err, doc, req, res, next, 'showcard.htm', doc2card(doc)
        return
    return

  env.app.get '/ck_page_browse', (req, res) ->
    if !loggedIn(req.session.user)
      next()
    else
      subdir = "/#{env.appname}/#{req.session.user.handle}/"
      topath = "#{process.cwd()}/apps/static/public#{subdir}"
      runInDir topath, ->
        fs.readdir topath, (err, files) ->
          temps = [ {
            selector: '#maintab'
            filename: 'filebrowse.htm'
          } ]
          browsebase = [ {
            selector: '#boilerplate-container'
            filename: 'browse.htm'
          } ]
          url = "http://#{env.staticurl}#{subdir}"
          STRstatdirlist topath, files, [], (stats) ->
            env.respond req, res, browsebase, temps,
              hidden_url: url
              file_list_file: stats
            , 'browse.tpl'

  env.app.post '/ck_page_upload', urlencodedParser, (req, res) ->
    return next() if not loggedIn(req.session.user)
    subdir = "/#{env.appname}/#{req.session.user.handle}"
    topath = "#{process.cwd()}/apps/static/public#{subdir}"
    runInDir topath, ->
      funcNum = req.param('CKEditorFuncNum')
      url = "http://#{env.staticurl}#{subdir}/"
      finishFileLoad req.files.upload.path, "#{topath}/#{req.files.upload.name}", 0, (to) ->
        res.write "<script type='text/javascript'> window.parent.CKEDITOR.tools.callFunction(#{funcNum}, '#{url}#{req.files.upload.name}', '');</script>"
        res.end()

  env.app.get '/', (req, res, next) ->
    Card.findOne { name: 'alicesprings' }, (err, doc) ->
      rspnd env, err, doc, req, res, next, 'showcard.htm', doc2card(doc)

  env.app.post '/:card/edit', urlencodedParser, (req, res, next) ->
    getMyCard req, next, (card) ->
      o = req.body
      o['modified_date'] = new Date
      if !card.contactemail
        o.contactemail = req.session.user.email
      if !card.email
        o.email = req.session.user.email

      # generically, it might be good to have a switch to turn email on,
      # and contactemail might be the default email.
      # but for alicesprings.email, we want to force display of email,
      # and we want to force use of the domain mail
      o.use_email = true # specific to alicesprings.email !!
      o.use_dmail = true # specific to alicesprings.email !!
      o.email = req.session.user.handle + '@alicesprings.email'
      if !o.active
        o.active = false
      Card.update { _id: card['_id'] }, { $set: o }, (err) ->
        if err
          throw err
        res.send 'OK'

  env.app.post '/upgrade', urlencodedParser, (req, res, next) ->
    getMyCard req, next, (card) ->
      o =
        page: req.body.page
        upgrade: true
        modified_date: new Date
      Card.update { _id: card['_id'] }, { $set: o }, (err) ->
        throw err if err
        res.send 'OK'

  env.app.post '/downgrade', urlencodedParser, (req, res, next) ->
    getMyCard req, next, (card) ->
      o = req.body
      o.upgrade = false
      o['modified_date'] = new Date
      Card.update { _id: card['_id'] }, { $set: o }, (err) ->
        throw err if err
        res.send 'OK'

  env.app.get '/:card/edit', (req, res, next) ->
    editCard req, res, next                        #  undefined   =>   edit as last saved

  env.app.get '/downgrade', (req, res, next) ->
    editCard req, res, next, false                 # false   =>   edit as card

  env.app.get '/upgrade', (req, res, next) ->
    editCard req, res, next, true                  # true   =>   edit as page

  env.app.get '/:card', (req, res, next) ->
    Card.findOne { name: req.params.card }, (err, doc) ->
      doc = doc?._doc
      return next() if err or not doc
      if loggedIn(req.session.user, req.params.card)
        # create if not exist
        if _.keys(doc).length <= 3
          return rspnd(env, err, doc, req, res, next, 'editcard.htm', card: ft.translateFields(doc))
        # otherwise faLl thru to default display behaviour
      else
        # show 404 if found but not active
        return next() if not doc.active

      type = if doc['upgrade']
        'page'
	  else
        'card'
      rspnd env, err, doc, req, res, next, "show#{type}.htm", doc2card(doc)

  env.app.get '/:notfound', (req, res, next) ->
    on404orCreate req, res, next

  env.app.get '/:notfound/:action', (req, res, next) ->
    on404orCreate req, res, next
