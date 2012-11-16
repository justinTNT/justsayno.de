<!DOCTYPE html>  

<!-- paulirish.com/2008/conditional-stylesheets-vs-css-hacks-answer-neither/ --> 
<!--[if lt IE 7 ]> <html lang="en" class="no-js ielt9 ie6"> <![endif]-->
<!--[if IE 7 ]>    <html lang="en" class="no-js ielt9 ie7"> <![endif]-->
<!--[if IE 8 ]>    <html lang="en" class="no-js ielt9 ie8"> <![endif]-->
<!--[if IE 9 ]>    <html lang="en" class="no-js ie9"> <![endif]-->
<!--[if (gt IE 9)|!(IE)]><!--> <html lang="en" class="no-js"> <!--<![endif]-->
<head>
  <meta charset="utf-8">

  <!-- Always force latest IE rendering engine (even in intranet) & Chrome Frame 
       Remove this if you use the .htaccess -->
  <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">

  <!--  Mobile viewport optimized: j.mp/bplateviewport -->
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <meta name="description" content="">
  <meta name="author" content="">


  <!-- Place favicon.ico & apple-touch-icon.png in the root of your domain and delete these references -->
  <link rel="shortcut icon" href="{{STATIC}}{{APP}}/favicon.ico">
  <link rel="apple-touch-icon" href="{{STATIC}}{{APP}}/apple-touch-icon.png">


  <!-- CSS : implied media="all" -->
  <link rel="stylesheet" href="{{STATIC}}css/basestyle.css?v=2">

  <!-- Uncomment if you are specifically targeting less enabled mobile browsers
  <link rel="stylesheet" media="handheld" href="css/handheld.css?v=2">  -->
 
  <link rel="stylesheet" href="/{{APP}}.css">

</head>

<body>
  <!--	All JavaScript at the bottom, except for :
		this crazy nonsense which decides whether to rewrite the url -->
  <script type="text/javascript" language="javascript">
			var p = window.location.pathname;
			var h = window.location.hash;
			var host = window.location.host;
			var prot = window.location.protocol;
			while (h.charAt(0) == '#') h=h.substring(1);
			while (p.charAt(0) == '/') p=p.substring(1);
			if (p.indexOf('.') < 0) { // wanna be able to load resources without ajax
				if (p.length) {
					if (!h.length) h = '/'+p;
					else h=p;
					window.location.href = prot + '//' + host + '/#' + h;
				} else if (!h.length)
					window.location.href = prot + '//' + host + '/#/';
			}
  </script>

  <div id="boilerplate-container">
  </div> <!--! end of #container -->


  <!-- Javascript at the bottom for fast page loading -->

  <!-- Grab Google CDN's jQuery, with a protocol relative URL; fall back to local if offline -->
  <script src="//ajax.googleapis.com/ajax/libs/jquery/1.8.3/jquery.js"></script>
  <script>window.jQuery || document.write('<script src="{{STATIC}}/jquery/jquery.js"><\/script>')</script>

  <!-- all else, concatenated (libs first) (and uglified in production) --> 
  <script src="/{{APP}}.js"></script>
  

  <!--[if lt IE 7 ]>
    <script src="{{STATIC}}js/dd_belatedpng.js"></script>
  <!--
    <script type="text/javascript" language="javascript"> DD_belatedPNG.fix('img, .png_bg'); //fix any <img> or .png_bg background-images </script>
	-->
  <![endif]-->

</body>
</html>
