require('source-map-support').install()

wserver = require './justsayno.de/wserver'
wscfg = require('./wscfg').options

if wscfg.proxy_name
	wserver.getProxy(wscfg.proxy_name, wscfg.proxy_port, wscfg.clandestine, wscfg.proxies)
else wserver.setProxy(wscfg.proxy_port, wscfg.ip, wscfg.clandestine)

sharedConfig =
	mailopts: wscfg.mailopts
	adminfromemail: wscfg.adminfromemail
	admintoemail: wscfg.admintoemail

for i in wscfg.apps
	if i.appname is 'static'
		sharedConfig.localurl = i.dname

wserver.setupServer wscfg.server_port, wscfg.apps, wscfg.ip, wscfg.setuid, sharedConfig

