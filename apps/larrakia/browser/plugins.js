/*
 *  * urlInternal - v1.0 - 10/7/2009
 *   * http://benalman.com/projects/jquery-urlinternal-plugin/
 *    * 
 *     * Copyright (c) 2009 "Cowboy" Ben Alman
 *      * Dual licensed under the MIT and GPL licenses.
 *       * http://benalman.com/about/license/
 *        */
(function($){var g,i=!0,r=!1,m=window.location,h=Array.prototype.slice,b=m.href.match(/^((https?:\/\/.*?\/)?[^#]*)#?.*$/),u=b[1]+"#",t=b[2],e,l,f,q,c,j,x="elemUrlAttr",k="href",y="src",p="urlInternal",d="urlExternal",n="urlFragment",a,s={};function w(A){var z=h.call(arguments,1);return function(){return A.apply(this,z.concat(h.call(arguments)))}}$.isUrlInternal=q=function(z){if(!z||j(z)){return g}if(a.test(z)){return i}if(/^(?:https?:)?\/\//i.test(z)){return r}if(/^[a-z\d.-]+:/i.test(z)){return g}return i};$.isUrlExternal=c=function(z){var A=q(z);return typeof A==="boolean"?!A:A};$.isUrlFragment=j=function(z){var A=(z||"").match(/^([^#]?)([^#]*#).*$/);return !!A&&(A[2]==="#"||z.indexOf(u)===0||(A[1]==="/"?t+A[2]===u:!/^https?:\/\//i.test(z)&&$('<a href="'+z+'"/>')[0].href.indexOf(u)===0))};function v(A,z){return this.filter(":"+A+(z?"("+z+")":""))}$.fn[p]=w(v,p);$.fn[d]=w(v,d);$.fn[n]=w(v,n);function o(D,C,B,A){var z=A[3]||e()[(C.nodeName||"").toLowerCase()]||"";return z?!!D(C.getAttribute(z)):r}$.expr[":"][p]=w(o,q);$.expr[":"][d]=w(o,c);$.expr[":"][n]=w(o,j);$[x]||($[x]=function(z){return $.extend(s,z)})({a:k,base:k,iframe:y,img:y,input:y,form:"action",link:k,script:y});e=$[x];$.urlInternalHost=l=function(B){B=B?"(?:(?:"+Array.prototype.join.call(arguments,"|")+")\\.)?":"";var A=new RegExp("^"+B+"(.*)","i"),z="^(?:"+m.protocol+")?//"+m.hostname.replace(A,B+"$1").replace(/\\?\./g,"\\.")+(m.port?":"+m.port:"")+"/";return f(z)};$.urlInternalRegExp=f=function(z){if(z){a=typeof z==="string"?new RegExp(z,"i"):z}return a};l("www")})(jQuery);
/*
 * jQuery hashchange event - v1.3 - 7/21/2010
 * http://benalman.com/projects/jquery-hashchange-plugin/
 * 
 * Copyright (c) 2010 "Cowboy" Ben Alman
 * Dual licensed under the MIT and GPL licenses.
 * http://benalman.com/about/license/
 */
(function($,e,b){var c="hashchange",h=document,f,g=$.event.special,i=h.documentMode,d="on"+c in e&&(i===b||i>7);function a(j){j=j||location.href;return"#"+j.replace(/^[^#]*#?(.*)$/,"$1")}$.fn[c]=function(j){return j?this.bind(c,j):this.trigger(c)};$.fn[c].delay=50;g[c]=$.extend(g[c],{setup:function(){if(d){return false}$(f.start)},teardown:function(){if(d){return false}$(f.stop)}});f=(function(){var j={},p,m=a(),k=function(q){return q},l=k,o=k;j.start=function(){p||n()};j.stop=function(){p&&clearTimeout(p);p=b};function n(){var r=a(),q=o(m);if(r!==m){l(m=r,q);$(e).trigger(c)}else{if(q!==m){location.href=location.href.replace(/#.*/,"")+q}}p=setTimeout(n,$.fn[c].delay)}$.browser.msie&&!d&&(function(){var q,r;j.start=function(){if(!q){r=$.fn[c].src;r=r&&r+a();q=$('<iframe tabindex="-1" title="empty"/>').hide().one("load",function(){r||l(a());n()}).attr("src",r||"javascript:0").insertAfter("body")[0].contentWindow;h.onpropertychange=function(){try{if(event.propertyName==="title"){q.document.title=h.title}}catch(s){}}}};j.stop=k;o=function(){return a(q.location.href)};l=function(v,s){var u=q.document,t=$.fn[c].domain;if(v!==s){u.title=h.title;u.open();t&&u.write('<script>document.domain="'+t+'"<\/script>');u.close();q.location.hash=v}}})();return j})()})(jQuery,this);// Underscore.js 1.1.6
// (c) 2011 Jeremy Ashkenas, DocumentCloud Inc.
// Underscore is freely distributable under the MIT license.
// Portions of Underscore are inspired or borrowed from Prototype,
// Oliver Steele's Functional, and John Resig's Micro-Templating.
// For all details and documentation:
// http://documentcloud.github.com/underscore
(function(){var p=this,C=p._,m={},i=Array.prototype,n=Object.prototype,f=i.slice,D=i.unshift,E=n.toString,l=n.hasOwnProperty,s=i.forEach,t=i.map,u=i.reduce,v=i.reduceRight,w=i.filter,x=i.every,y=i.some,o=i.indexOf,z=i.lastIndexOf;n=Array.isArray;var F=Object.keys,q=Function.prototype.bind,b=function(a){return new j(a)};typeof module!=="undefined"&&module.exports?(module.exports=b,b._=b):p._=b;b.VERSION="1.1.6";var h=b.each=b.forEach=function(a,c,d){if(a!=null)if(s&&a.forEach===s)a.forEach(c,d);else if(b.isNumber(a.length))for(var e=
0,k=a.length;e<k;e++){if(c.call(d,a[e],e,a)===m)break}else for(e in a)if(l.call(a,e)&&c.call(d,a[e],e,a)===m)break};b.map=function(a,c,b){var e=[];if(a==null)return e;if(t&&a.map===t)return a.map(c,b);h(a,function(a,g,G){e[e.length]=c.call(b,a,g,G)});return e};b.reduce=b.foldl=b.inject=function(a,c,d,e){var k=d!==void 0;a==null&&(a=[]);if(u&&a.reduce===u)return e&&(c=b.bind(c,e)),k?a.reduce(c,d):a.reduce(c);h(a,function(a,b,f){!k&&b===0?(d=a,k=!0):d=c.call(e,d,a,b,f)});if(!k)throw new TypeError("Reduce of empty array with no initial value");
return d};b.reduceRight=b.foldr=function(a,c,d,e){a==null&&(a=[]);if(v&&a.reduceRight===v)return e&&(c=b.bind(c,e)),d!==void 0?a.reduceRight(c,d):a.reduceRight(c);a=(b.isArray(a)?a.slice():b.toArray(a)).reverse();return b.reduce(a,c,d,e)};b.find=b.detect=function(a,c,b){var e;A(a,function(a,g,f){if(c.call(b,a,g,f))return e=a,!0});return e};b.filter=b.select=function(a,c,b){var e=[];if(a==null)return e;if(w&&a.filter===w)return a.filter(c,b);h(a,function(a,g,f){c.call(b,a,g,f)&&(e[e.length]=a)});return e};
b.reject=function(a,c,b){var e=[];if(a==null)return e;h(a,function(a,g,f){c.call(b,a,g,f)||(e[e.length]=a)});return e};b.every=b.all=function(a,c,b){var e=!0;if(a==null)return e;if(x&&a.every===x)return a.every(c,b);h(a,function(a,g,f){if(!(e=e&&c.call(b,a,g,f)))return m});return e};var A=b.some=b.any=function(a,c,d){c||(c=b.identity);var e=!1;if(a==null)return e;if(y&&a.some===y)return a.some(c,d);h(a,function(a,b,f){if(e=c.call(d,a,b,f))return m});return e};b.include=b.contains=function(a,c){var b=
!1;if(a==null)return b;if(o&&a.indexOf===o)return a.indexOf(c)!=-1;A(a,function(a){if(b=a===c)return!0});return b};b.invoke=function(a,c){var d=f.call(arguments,2);return b.map(a,function(a){return(c.call?c||a:a[c]).apply(a,d)})};b.pluck=function(a,c){return b.map(a,function(a){return a[c]})};b.max=function(a,c,d){if(!c&&b.isArray(a))return Math.max.apply(Math,a);var e={computed:-Infinity};h(a,function(a,b,f){b=c?c.call(d,a,b,f):a;b>=e.computed&&(e={value:a,computed:b})});return e.value};b.min=function(a,
c,d){if(!c&&b.isArray(a))return Math.min.apply(Math,a);var e={computed:Infinity};h(a,function(a,b,f){b=c?c.call(d,a,b,f):a;b<e.computed&&(e={value:a,computed:b})});return e.value};b.sortBy=function(a,c,d){return b.pluck(b.map(a,function(a,b,f){return{value:a,criteria:c.call(d,a,b,f)}}).sort(function(a,b){var c=a.criteria,d=b.criteria;return c<d?-1:c>d?1:0}),"value")};b.sortedIndex=function(a,c,d){d||(d=b.identity);for(var e=0,f=a.length;e<f;){var g=e+f>>1;d(a[g])<d(c)?e=g+1:f=g}return e};b.toArray=
function(a){if(!a)return[];if(a.toArray)return a.toArray();if(b.isArray(a))return a;if(b.isArguments(a))return f.call(a);return b.values(a)};b.size=function(a){return b.toArray(a).length};b.first=b.head=function(a,b,d){return b!=null&&!d?f.call(a,0,b):a[0]};b.rest=b.tail=function(a,b,d){return f.call(a,b==null||d?1:b)};b.last=function(a){return a[a.length-1]};b.compact=function(a){return b.filter(a,function(a){return!!a})};b.flatten=function(a){return b.reduce(a,function(a,d){if(b.isArray(d))return a.concat(b.flatten(d));
a[a.length]=d;return a},[])};b.without=function(a){var c=f.call(arguments,1);return b.filter(a,function(a){return!b.include(c,a)})};b.uniq=b.unique=function(a,c){return b.reduce(a,function(a,e,f){if(0==f||(c===!0?b.last(a)!=e:!b.include(a,e)))a[a.length]=e;return a},[])};b.intersect=function(a){var c=f.call(arguments,1);return b.filter(b.uniq(a),function(a){return b.every(c,function(c){return b.indexOf(c,a)>=0})})};b.zip=function(){for(var a=f.call(arguments),c=b.max(b.pluck(a,"length")),d=Array(c),
e=0;e<c;e++)d[e]=b.pluck(a,""+e);return d};b.indexOf=function(a,c,d){if(a==null)return-1;var e;if(d)return d=b.sortedIndex(a,c),a[d]===c?d:-1;if(o&&a.indexOf===o)return a.indexOf(c);d=0;for(e=a.length;d<e;d++)if(a[d]===c)return d;return-1};b.lastIndexOf=function(a,b){if(a==null)return-1;if(z&&a.lastIndexOf===z)return a.lastIndexOf(b);for(var d=a.length;d--;)if(a[d]===b)return d;return-1};b.range=function(a,b,d){arguments.length<=1&&(b=a||0,a=0);d=arguments[2]||1;for(var e=Math.max(Math.ceil((b-a)/
d),0),f=0,g=Array(e);f<e;)g[f++]=a,a+=d;return g};b.bind=function(a,b){if(a.bind===q&&q)return q.apply(a,f.call(arguments,1));var d=f.call(arguments,2);return function(){return a.apply(b,d.concat(f.call(arguments)))}};b.bindAll=function(a){var c=f.call(arguments,1);c.length==0&&(c=b.functions(a));h(c,function(c){a[c]=b.bind(a[c],a)});return a};b.memoize=function(a,c){var d={};c||(c=b.identity);return function(){var b=c.apply(this,arguments);return l.call(d,b)?d[b]:d[b]=a.apply(this,arguments)}};b.delay=
function(a,b){var d=f.call(arguments,2);return setTimeout(function(){return a.apply(a,d)},b)};b.defer=function(a){return b.delay.apply(b,[a,1].concat(f.call(arguments,1)))};var B=function(a,b,d){var e;return function(){var f=this,g=arguments,h=function(){e=null;a.apply(f,g)};d&&clearTimeout(e);if(d||!e)e=setTimeout(h,b)}};b.throttle=function(a,b){return B(a,b,!1)};b.debounce=function(a,b){return B(a,b,!0)};b.once=function(a){var b=!1,d;return function(){if(b)return d;b=!0;return d=a.apply(this,arguments)}};
b.wrap=function(a,b){return function(){var d=[a].concat(f.call(arguments));return b.apply(this,d)}};b.compose=function(){var a=f.call(arguments);return function(){for(var b=f.call(arguments),d=a.length-1;d>=0;d--)b=[a[d].apply(this,b)];return b[0]}};b.after=function(a,b){return function(){if(--a<1)return b.apply(this,arguments)}};b.keys=F||function(a){if(a!==Object(a))throw new TypeError("Invalid object");var b=[],d;for(d in a)l.call(a,d)&&(b[b.length]=d);return b};b.values=function(a){return b.map(a,
b.identity)};b.functions=b.methods=function(a){return b.filter(b.keys(a),function(c){return b.isFunction(a[c])}).sort()};b.extend=function(a){h(f.call(arguments,1),function(b){for(var d in b)b[d]!==void 0&&(a[d]=b[d])});return a};b.defaults=function(a){h(f.call(arguments,1),function(b){for(var d in b)a[d]==null&&(a[d]=b[d])});return a};b.clone=function(a){return b.isArray(a)?a.slice():b.extend({},a)};b.tap=function(a,b){b(a);return a};b.isEqual=function(a,c){if(a===c)return!0;var d=typeof a;if(d!=
typeof c)return!1;if(a==c)return!0;if(!a&&c||a&&!c)return!1;if(a._chain)a=a._wrapped;if(c._chain)c=c._wrapped;if(a.isEqual)return a.isEqual(c);if(b.isDate(a)&&b.isDate(c))return a.getTime()===c.getTime();if(b.isNaN(a)&&b.isNaN(c))return!1;if(b.isRegExp(a)&&b.isRegExp(c))return a.source===c.source&&a.global===c.global&&a.ignoreCase===c.ignoreCase&&a.multiline===c.multiline;if(d!=="object")return!1;if(a.length&&a.length!==c.length)return!1;d=b.keys(a);var e=b.keys(c);if(d.length!=e.length)return!1;
for(var f in a)if(!(f in c)||!b.isEqual(a[f],c[f]))return!1;return!0};b.isEmpty=function(a){if(b.isArray(a)||b.isString(a))return a.length===0;for(var c in a)if(l.call(a,c))return!1;return!0};b.isElement=function(a){return!!(a&&a.nodeType==1)};b.isArray=n||function(a){return E.call(a)==="[object Array]"};b.isArguments=function(a){return!(!a||!l.call(a,"callee"))};b.isFunction=function(a){return!(!a||!a.constructor||!a.call||!a.apply)};b.isString=function(a){return!!(a===""||a&&a.charCodeAt&&a.substr)};
b.isNumber=function(a){return!!(a===0||a&&a.toExponential&&a.toFixed)};b.isNaN=function(a){return a!==a};b.isBoolean=function(a){return a===!0||a===!1};b.isDate=function(a){return!(!a||!a.getTimezoneOffset||!a.setUTCFullYear)};b.isRegExp=function(a){return!(!a||!a.test||!a.exec||!(a.ignoreCase||a.ignoreCase===!1))};b.isNull=function(a){return a===null};b.isUndefined=function(a){return a===void 0};b.noConflict=function(){p._=C;return this};b.identity=function(a){return a};b.times=function(a,b,d){for(var e=
0;e<a;e++)b.call(d,e)};b.mixin=function(a){h(b.functions(a),function(c){H(c,b[c]=a[c])})};var I=0;b.uniqueId=function(a){var b=I++;return a?a+b:b};b.templateSettings={evaluate:/<%([\s\S]+?)%>/g,interpolate:/<%=([\s\S]+?)%>/g};b.template=function(a,c){var d=b.templateSettings;d="var __p=[],print=function(){__p.push.apply(__p,arguments);};with(obj||{}){__p.push('"+a.replace(/\\/g,"\\\\").replace(/'/g,"\\'").replace(d.interpolate,function(a,b){return"',"+b.replace(/\\'/g,"'")+",'"}).replace(d.evaluate||
null,function(a,b){return"');"+b.replace(/\\'/g,"'").replace(/[\r\n\t]/g," ")+"__p.push('"}).replace(/\r/g,"\\r").replace(/\n/g,"\\n").replace(/\t/g,"\\t")+"');}return __p.join('');";d=new Function("obj",d);return c?d(c):d};var j=function(a){this._wrapped=a};b.prototype=j.prototype;var r=function(a,c){return c?b(a).chain():a},H=function(a,c){j.prototype[a]=function(){var a=f.call(arguments);D.call(a,this._wrapped);return r(c.apply(b,a),this._chain)}};b.mixin(b);h(["pop","push","reverse","shift","sort",
"splice","unshift"],function(a){var b=i[a];j.prototype[a]=function(){b.apply(this._wrapped,arguments);return r(this._wrapped,this._chain)}});h(["concat","join","slice"],function(a){var b=i[a];j.prototype[a]=function(){return r(b.apply(this._wrapped,arguments),this._chain)}});j.prototype.chain=function(){this._chain=!0;return this};j.prototype.value=function(){return this._wrapped}})();
var JSON;if(!JSON){JSON={}}(function(){function f(n){return n<10?"0"+n:n}if(typeof Date.prototype.toJSON!=="function"){Date.prototype.toJSON=function(key){return isFinite(this.valueOf())?this.getUTCFullYear()+"-"+f(this.getUTCMonth()+1)+"-"+f(this.getUTCDate())+"T"+f(this.getUTCHours())+":"+f(this.getUTCMinutes())+":"+f(this.getUTCSeconds())+"Z":null};String.prototype.toJSON=Number.prototype.toJSON=Boolean.prototype.toJSON=function(key){return this.valueOf()}}var cx=/[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,escapable=/[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,gap,indent,meta={"\b":"\\b","\t":"\\t","\n":"\\n","\f":"\\f","\r":"\\r",'"':'\\"',"\\":"\\\\"},rep;function quote(string){escapable.lastIndex=0;return escapable.test(string)?'"'+string.replace(escapable,function(a){var c=meta[a];return typeof c==="string"?c:"\\u"+("0000"+a.charCodeAt(0).toString(16)).slice(-4)})+'"':'"'+string+'"'}function str(key,holder){var i,k,v,length,mind=gap,partial,value=holder[key];if(value&&typeof value==="object"&&typeof value.toJSON==="function"){value=value.toJSON(key)}if(typeof rep==="function"){value=rep.call(holder,key,value)}switch(typeof value){case"string":return quote(value);case"number":return isFinite(value)?String(value):"null";case"boolean":case"null":return String(value);case"object":if(!value){return"null"}gap+=indent;partial=[];if(Object.prototype.toString.apply(value)==="[object Array]"){length=value.length;for(i=0;i<length;i+=1){partial[i]=str(i,value)||"null"}v=partial.length===0?"[]":gap?"[\n"+gap+partial.join(",\n"+gap)+"\n"+mind+"]":"["+partial.join(",")+"]";gap=mind;return v}if(rep&&typeof rep==="object"){length=rep.length;for(i=0;i<length;i+=1){if(typeof rep[i]==="string"){k=rep[i];v=str(k,value);if(v){partial.push(quote(k)+(gap?": ":":")+v)}}}}else{for(k in value){if(Object.prototype.hasOwnProperty.call(value,k)){v=str(k,value);if(v){partial.push(quote(k)+(gap?": ":":")+v)}}}}v=partial.length===0?"{}":gap?"{\n"+gap+partial.join(",\n"+gap)+"\n"+mind+"}":"{"+partial.join(",")+"}";gap=mind;return v}}if(typeof JSON.stringify!=="function"){JSON.stringify=function(value,replacer,space){var i;gap="";indent="";if(typeof space==="number"){for(i=0;i<space;i+=1){indent+=" "}}else{if(typeof space==="string"){indent=space}}rep=replacer;if(replacer&&typeof replacer!=="function"&&(typeof replacer!=="object"||typeof replacer.length!=="number")){throw new Error("JSON.stringify")}return str("",{"":value})}}if(typeof JSON.parse!=="function"){JSON.parse=function(text,reviver){var j;function walk(holder,key){var k,v,value=holder[key];if(value&&typeof value==="object"){for(k in value){if(Object.prototype.hasOwnProperty.call(value,k)){v=walk(value,k);if(v!==undefined){value[k]=v}else{delete value[k]}}}}return reviver.call(holder,key,value)}text=String(text);cx.lastIndex=0;if(cx.test(text)){text=text.replace(cx,function(a){return"\\u"+("0000"+a.charCodeAt(0).toString(16)).slice(-4)})}if(/^[\],:{}\s]*$/.test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,"@").replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,"]").replace(/(?:^|:|,)(?:\s*\[)+/g,""))){j=eval("("+text+")");return typeof reviver==="function"?walk({"":j},""):j}throw new SyntaxError("JSON.parse")}}}());
(function($){
	/* hoverIntent by Brian Cherne */
	$.fn.hoverIntent = function(f,g) {
		// default configuration options
		var cfg = {
			sensitivity: 7,
			interval: 100,
			timeout: 0
		};
		// override configuration options with user supplied object
		cfg = $.extend(cfg, g ? { over: f, out: g } : f );

		// instantiate variables
		// cX, cY = current X and Y position of mouse, updated by mousemove event
		// pX, pY = previous X and Y position of mouse, set by mouseover and polling interval
		var cX, cY, pX, pY;

		// A private function for getting mouse position
		var track = function(ev) {
			cX = ev.pageX;
			cY = ev.pageY;
		};

		// A private function for comparing current and previous mouse position
		var compare = function(ev,ob) {
			ob.hoverIntent_t = clearTimeout(ob.hoverIntent_t);
			// compare mouse positions to see if they've crossed the threshold
			if ( ( Math.abs(pX-cX) + Math.abs(pY-cY) ) < cfg.sensitivity ) {
				$(ob).unbind("mousemove",track);
				// set hoverIntent state to true (so mouseOut can be called)
				ob.hoverIntent_s = 1;
				return cfg.over.apply(ob,[ev]);
			} else {
				// set previous coordinates for next time
				pX = cX; pY = cY;
				// use self-calling timeout, guarantees intervals are spaced out properly (avoids JavaScript timer bugs)
				ob.hoverIntent_t = setTimeout( function(){compare(ev, ob);} , cfg.interval );
			}
		};

		// A private function for delaying the mouseOut function
		var delay = function(ev,ob) {
			ob.hoverIntent_t = clearTimeout(ob.hoverIntent_t);
			ob.hoverIntent_s = 0;
			return cfg.out.apply(ob,[ev]);
		};

		// A private function for handling mouse 'hovering'
		var handleHover = function(e) {
			// next three lines copied from jQuery.hover, ignore children onMouseOver/onMouseOut
			var p = (e.type == "mouseover" ? e.fromElement : e.toElement) || e.relatedTarget;
			while ( p && p != this ) { try { p = p.parentNode; } catch(e) { p = this; } }
			if ( p == this ) { return false; }

			// copy objects to be passed into t (required for event object to be passed in IE)
			var ev = jQuery.extend({},e);
			var ob = this;

			// cancel hoverIntent timer if it exists
			if (ob.hoverIntent_t) { ob.hoverIntent_t = clearTimeout(ob.hoverIntent_t); }

			// else e.type == "onmouseover"
			if (e.type == "mouseover") {
				// set "previous" X and Y position based on initial entry point
				pX = ev.pageX; pY = ev.pageY;
				// update "current" X and Y position based on mousemove
				$(ob).bind("mousemove",track);
				// start polling interval (self-calling timeout) to compare mouse coordinates over time
				if (ob.hoverIntent_s != 1) { ob.hoverIntent_t = setTimeout( function(){compare(ev,ob);} , cfg.interval );}

			// else e.type == "onmouseout"
			} else {
				// unbind expensive mousemove event
				$(ob).unbind("mousemove",track);
				// if hoverIntent state is true, then call the mouseOut function after the specified delay
				if (ob.hoverIntent_s == 1) { ob.hoverIntent_t = setTimeout( function(){delay(ev,ob);} , cfg.timeout );}
			}
		};

		// bind the function to the two event listeners
		return this.mouseover(handleHover).mouseout(handleHover);
	};
	
})(jQuery);
/*
 *  Color animation jQuery-plugin
 *   http://www.bitstorm.org/jquery/color-animation/
 *    Copyright 2011 Edwin Martin <edwin@bitstorm.org>
 *     Released under the MIT and GPL licenses.
 *     */
(function(d){function i(){var b=d("script:first"),a=b.css("color"),c=false;if(/^rgba/.test(a))c=true;else try{c=a!=b.css("color","rgba(0, 0, 0, 0.5)").css("color");b.css("color",a)}catch(e){}return c}function g(b,a,c){var e="rgb"+(d.support.rgba?"a":"")+"("+parseInt(b[0]+c*(a[0]-b[0]),10)+","+parseInt(b[1]+c*(a[1]-b[1]),10)+","+parseInt(b[2]+c*(a[2]-b[2]),10);if(d.support.rgba)e+=","+(b&&a?parseFloat(b[3]+c*(a[3]-b[3])):1);e+=")";return e}function f(b){var a,c;if(a=/#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})/.exec(b))c=
[parseInt(a[1],16),parseInt(a[2],16),parseInt(a[3],16),1];else if(a=/#([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])/.exec(b))c=[parseInt(a[1],16)*17,parseInt(a[2],16)*17,parseInt(a[3],16)*17,1];else if(a=/rgb\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*\)/.exec(b))c=[parseInt(a[1]),parseInt(a[2]),parseInt(a[3]),1];else if(a=/rgba\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9\.]*)\s*\)/.exec(b))c=[parseInt(a[1],10),parseInt(a[2],10),parseInt(a[3],10),parseFloat(a[4])];return c}
d.extend(true,d,{support:{rgba:i()}});var h=["color","backgroundColor","borderBottomColor","borderLeftColor","borderRightColor","borderTopColor","outlineColor"];d.each(h,function(b,a){d.fx.step[a]=function(c){if(!c.init){c.a=f(d(c.elem).css(a));c.end=f(c.end);c.init=true}c.elem.style[a]=g(c.a,c.end,c.pos)}});d.fx.step.borderColor=function(b){if(!b.init)b.end=f(b.end);var a=h.slice(2,6);d.each(a,function(c,e){b.init||(b[e]={a:f(d(b.elem).css(e))});b.elem.style[e]=g(b[e].a,b.end,b.pos)});b.init=true}})(jQuery);
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
			if (! $s.length) throw "bad selector " + sel + " in template " + select;
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
function swxRespond(envplates, request, response, base_tpls, tpls, objs, alt_bp) {
var o;

	if (request.xhr) {
		if (tpls) {
			o = {objects:objs, templates:tpls};
			response.send(JSON.stringify(o));
		} else response.send(JSON.stringify(objs));
	} else {
		try {
			if (typeof objs == 'string') { // a few justsay admin / debug pages may be built as strings
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
	exports.respond = swxRespond;
}

/*
 * browserbootstrap
 * ================
 * this is the file which kick starts justsay in the client,
 * by hijacking links (thanks ben altman for url internal and hashchange)
 * and calling the common weld gear from justsay.js
 */

function updateLinks(frag){
		frag.find('a:urlInternal').each(function() {			// all internal links,
			if (! $(this).hasClass('hardlink')) {
				var h=$(this).attr('href');					// get the href
				if (h.substring(0,7) == 'http://') {		// if it's a fully qualified URL
					h=h.substr(8);							// skip past the protocol,
					h=h.substr(h.indexOf('/'));				// up to the path
				}
				if (h.indexOf('.') < 0) {			// don't intercept local files with '.' extension
					if (h.charAt(0) != '/') h='/'+h;		// make sure there's a leading slash
					$(this).data('ajax_link', h);
					$(this).click(function(){							// when it's clicked,
						location.hash = $(this).data('ajax_link');		// rewrite the fragment
						return false;						// trust the router to make the server call
					});	
				}
			}
		});
}

/*
 * we mostly do ajaj (Asynchronous Json, Assisted by Javascript)
 * and this wrapper helps make it smooth
 */
function justsayAJAJ (route, succ, fail, data) {
	$.ajax({
		url:route,
		cache:false,
		type:(data ? 'POST' : 'GET'),
		data:data,
		beforeSend:function(jqXHR, settings){
			settings['HTTP_X_REQUESTED_WITH'] = 'XMLHttpRequest';
		},
		success:function(ajaxdata, txtsts, jqXHR){
			if (succ) {
				if (ajaxdata == 'OK') succ();
				else succ($.parseJSON(ajaxdata));
			}
		},
		error:function(jqXHR, ststxt, err){
/*
* DEBUGGING
				alert('AJAX ERROR for ' + route + ': ' + ststxt + ':' + err);
*/
			if (fail) {
				fail(jqXHR.responseText, err);
			}
		}
	});
}



/*
 * justsayMakeTheCall - this is the function called by our script in the browser to setup hashchange.
 * ===========
 * this function is the guts of justsayUpdate below.
 * but its also useful for adhoc server calls, where we need to process results through anti-plates:
 * (if it's an adhoc call that just returns objects, go straight to justsayAJAJ)
 */

function justsayMakeTheCall(servercall, callBefore, callBack, callFirst) {

	if (callFirst) callFirst(servercall);

	justsayAJAJ(servercall,
		function(txdata){
			var $dest_cont=null, $temp_cont;

			if (_.isArray(txdata)) {			// straight data comes in an array

				if (callBefore) callBefore(servercall, txdata);
				if (callBack) callBack(servercall);

			} else {							// template data comes in an object with objs, temps and dest

				if (txdata && servercall.length)
					$dest_cont = $(txdata.templates[0].selector);
				else $dest_cont = $('div#boilerplate-container');

				if (callBefore)
					$temp_cont = $dest_cont.clone();	// load the new data into temp 'plates
				else $temp_cont = $dest_cont;			// otherwise, weld the new data in place on the page

				if (txdata) {
					loadTemps(justsayskeleta, txdata.templates.slice(0), function(data) {
						weldTemps(txdata.templates, txdata.objects, data, function(responsetxt) {
							if (callBefore)
								if (! callBefore(servercall, $temp_cont, $dest_cont))	// if the callback returns false,
									$dest_cont.html($temp_cont.html());				// copy the welded templates to the page
							updateLinks($dest_cont);
							if (callBack) callBack(servercall);
						});
					}, $temp_cont);
				} else {
					if (callBack) callBack(servercall);
				}

			}
		}, function(ststxt, err){
			location.href=servercall; // force refresh on ajax error
		});
}


function servercallFromHash() {
	var servercall = location.hash;
	while (servercall.charAt(0) == '#')
		servercall = servercall.substr(1);
	while (servercall.charAt(0) == '/')
		servercall = servercall.substr(1);
	return servercall;
}


/*
 * justsayUpdate - this is the function called by our script in the browser to setup hashchange
 * ===========
 *
 * callBefore - this function is called before the page is updated.
 * 				parameters : route, from, to
 *              if callBefore is null, then all incoming data is welded directly to the page
 *              otherwise, if there's no templates named (ie. it's pure ajaj) then :
 *              	from holds the objects, to is empty, and this function must do all the work.
 *              if callBefore redraws the page, eg to perform a nifty animation, it should return true;
 *              if callBefore returns false, then justsayUpdate goes on to redraw the page (copy from->to)
 *
 * callBack   - this function is called after the page is updated with the new data,
 *              with the route string as the only parameter.
 *              This is a good place to recalculate stuff after the page is redrawn
 *
 * callFirst	- even before the AJAX action is sent;
 * 					if not null, this usually kickstarts animation (eg fade out)
 *
 */

function justsayUpdate (callBefore, callBack, callFirst){

	$(window).hashchange(function(){
		justsayMakeTheCall(servercallFromHash(), callBefore, callBack, callFirst);
	});

	if (servercallFromHash())
		$(window).hashchange();
	updateLinks($('div#boilerplate-container'));
}

