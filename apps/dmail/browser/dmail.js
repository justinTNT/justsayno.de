// Generated by CoffeeScript 1.7.1
(function() {
  var approximateEmailRegExp, callAfter, callFirst, runLoginAnim, setupRegoForm, validateRegoForm;

  callFirst = function() {
    return true;
  };

  approximateEmailRegExp = new RegExp('mymail@domain.com', 'i');

  validateRegoForm = function($f) {
    var $field, mail, pass;
    $field = $f.find("input[type='password']");
    pass = $field.val();
    if ((pass != null ? pass.length : void 0) < 8) {
      return $field;
    }
    $field = $f.find("input.email");
    mail = $field.val();
    if (!mail.match(approximateEmailRegExp)) {
      return $field;
    }
    return null;
  };

  setupRegoForm = function($f) {
    if (!($f != null ? $f.length : void 0)) {
      return;
    }
    $f.find('.regoitem input').focus(function() {
      $(this).removeClass('error');
      $(this).parent().find('i.icon-info-sign').fadeIn('slow');
      $(this).parent().find('p.desc').hide();
      return $(this).parent().find('div.desc').fadeIn();
    }).blur(function() {
      $(this).parent().find('i.icon-info-sign').hide();
      return $(this).parent().find('.desc').fadeOut();
    });
    $f.find('i.icon-info-sign').hover(function() {
      $(this).parent().find('div.desc').hide();
      return $(this).parent().find('p.desc').fadeIn();
    }, function() {
      $(this).parent().find('p.desc').hide();
      if ($(this).css('display') !== 'none') {
        return $(this).parent().find('div.desc').fadeIn();
      }
    });
    $f.find('input.cancel').click(function() {
      return justsayAJAJ('/deregister');
    });
    return $f.find("[type='submit']").click(function() {
      var $error;
      if ($error = validateRegoForm($f)) {
        $error.addClass('error');
      } else {
        justsayAJAJ($f.attr("action"), function(o) {
          return location.hash = "/reqcode/" + o.code;
        }, function() {
          return $f.find("input[type='password']").addClass('error');
        }, $f.serialize());
      }
      return false;
    });
  };

  callAfter = function(route) {
    if (!(route != null ? route.length : void 0)) {
      console.log('going to register because of no route');
      return location.hash = "/register";
    }
    $("a.logout").click(function() {
      return runWithAuth(null);
    });
    $("a.login").click(function() {
      if (runWithAuth()) {
        return runWithAuth(null);
      } else {
        return runWithAuth(runLoginAnim);
      }
    });
    $('div.rego input.handle').focus(function() {
      return $(this).removeClass('error');
    }).change(function() {
      $('div.rego div.errmsg').text('');
      return justsayAJAJ('/preregister', function(s) {
        return location.hash = '/registration';
      }, (function(_this) {
        return function(e) {
          $(_this).blur().addClass('error');
          return $('div.rego div.errmsg').text(e);
        };
      })(this), {
        handle: $(this).val()
      });
    });
    return setupRegoForm($('.registration form'));
  };

  runLoginAnim = function(o) {
    var _ref;
    if (o != null ? (_ref = o.handle) != null ? _ref.length : void 0 : void 0) {
      return location.hash = "/user/" + o.handle;
    }
    if (o != null ? o.handle : void 0) {
      return location.hash = "/registration";
    }
    return location.hash = "/register";
  };

  $(function() {
    runWithAuth(runLoginAnim, true);
    justsayUpdate(callAfter);
    return callAfter(location.hash);
  });

}).call(this);