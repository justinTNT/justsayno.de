
var wserver = require('./justsayno.de/wserver');
var wscfg = require('./wscfg').options;


var i, n, p;
for (i=2; (n=process.argv[i]); i++)
        if ((p=parseInt(n, 10))) {
                if (wscfg.server_port == 80)
                        wscfg.server_port = p;
                else wscfg.proxy_port = p;
        } else {
		if (n == 'help' || n == '-h' || n == '--help') {
console.log('USAGE:');
console.log('dev: webserver [altport] [proxyname [proxyport] [ hostname1, hostname2, ... ]]');
console.log('prod: webserver [altport [proxyport]]');
console.log('altport- alternative port for serving http');
console.log('proxyname- address of a remote webserver that will proxy-serv local apps');
console.log('proxyport- portnumber used for proxy client/server comms');
console.log('hostnames- list of hostnames served by proxy');
			return false;
		}
                if (! wscfg.proxy_name)
                        wscfg.proxy_name = n;
		else if (! wscfg.proxies) {
			wscfg.proxies = [n];
                } else {
			wscfg.proxies.push(n);
		}
        }

if (wscfg.proxy_name)
        wserver.getProxy(wscfg.proxy_name, wscfg.proxy_port, wscfg.clandestine, wscfg.proxies);
else wserver.setProxy(wscfg.proxy_port, wscfg.ip, wscfg.clandestine);

wserver.setupServer(wscfg.server_port, wscfg.apps, wscfg.ip, { mailopts: wscfg.mailopts,
																adminemail: wscfg.adminemail });

