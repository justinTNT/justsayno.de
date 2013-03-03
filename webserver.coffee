require 'coffee-script'
require 'longjohn'

wserver = require './justsayno.de/wserver'
wscfg = require('./wscfg').options

if wscfg.proxy_name
	wserver.getProxy(wscfg.proxy_name, wscfg.proxy_port, wscfg.clandestine, wscfg.proxies)
else wserver.setProxy(wscfg.proxy_port, wscfg.ip, wscfg.clandestine)

sharedConfig =
	mailopts: wscfg.mailopts
	adminemail: wscfg.adminemail

for i in wscfg.apps
	if wscfg.apps[i].appname is 'static'
		sharedConfig.localurl = wscfg.apps[i].dname

wserver.setupServer wscfg.server_port, wscfg.apps, wscfg.ip, wscfg.setuid, sharedConfig

