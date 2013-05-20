$(function(){
  var LOW = 64;
  var HIGH = 96;
  var SIZE = 500;
  var MAX_DISTANCE = Math.sqrt(SIZE * SIZE);
  
  var gradientX = 0; //SIZE / 2;
  var gradientY = 0; //SIZE / 2;
  
  // Distance of the given point from the center of the gradient.
  var distance = function(x, y){
    var dx = x - gradientX;
    var dy = y - gradientY;
    return Math.sqrt(dx * dx + dy * dy);
  };
  
  var interpolate = function(distance){
    var ratio = distance / MAX_DISTANCE;
    return LOW + (ratio * (HIGH - LOW));
  };
  
  var color = function(x, y){
    return interpolate(distance(x, y));
  };
  
  // Convert an `each` callback to one that also receives
  // the `x` and `y` coordinates of the pixel being set.
  var gradient = function(f){
    var x = 0;
    var y = 0;
    return function(px){
      var c = f(x, y);
      
      px.r = c;
      px.g = c;
      px.b = c;
      px.a = 255;
      
      x += 1;
      if(x >= SIZE){
        x = 0;
        y += 1;
        if(y >= SIZE){
          x = 0;
          y = 0;
        }
      }
    };
  };

  var error = function(x, y){
    var c = color(x, y);
    var result = Math.round(c);
    return c - result;
  };
  
  var totalError = function(x, y, neighborhood){
    var total = 0;
    _.forEach(_.range(x - neighborhood, x + neighborhood + 1), function(dx){
      _.forEach(_.range(y - neighborhood, y + neighborhood + 1), function(dy){
        total += error(dx, dy)
      });
    });
    return total;
  };
    
  var methods = {
    round: function(x, y){
      var c = color(x, y);
      return Math.round(c);
    },
    truncate: function(x, y){
      var c = color(x, y);
      return Math.floor(c);
    },
    
    random: function(x, y){
      var c = color(x, y);
    
      c = Math.floor(c);
      if(Math.random() >= 0.5){
        c += 1;
      }
      return c;
    },
    biasedRandom: function(x, y){
      var c = color(x, y);
      var floorC = Math.floor(c);
      var rounding = c - floorC;
      if(Math.random() < rounding){
        floorC += 1;
      }
      return floorC;
    },
    
    noisy: function(x, y){
      var c = color(x, y);
      c += 1 - 2 * Math.random();
      return Math.round(c);
    },
    noisier: function(x, y){
      var c = color(x, y);
      c += 2 - 4 * Math.random();
      return Math.round(c);
    },
    noisiest: function(x, y){
      var c = color(x, y);
      c += 4 - 8 * Math.random();
      return Math.round(c);
    },
    
    neighbors4: function(x, y){
      var e =
        error(x - 1, y) +
        error(x + 1, y) +
        error(x, y - 1) +
        error(x, y + 1);
      
      var c = color(x, y);
      c = Math.floor(c);
      
      if(e <= 0){
        c += 1
      }
      
      return c;
    },
    neighbors8: function(x, y){
      var e =
        error(x - 1, y) +
        error(x + 1, y) +
        error(x, y - 1) +
        error(x, y + 1) +
        error(x - 1, y - 1) +
        error(x - 1, y + 1) +
        error(x + 1, y - 1) +
        error(x + 1, y + 1);
      
      var c = color(x, y);
      c = Math.floor(c);
      
      if(e <= 0){
        c += 1
      }
      
      return c;
    },
    neighborhood2: function(x, y){
      var e = totalError(x, y, 2);
      var c = color(x, y);
      c = Math.floor(c);
      
      if(e < 0){
        c += 1
      }
      
      return c;
    },
    neighborhood3: function(x, y){
      var e = totalError(x, y, 3);
      var c = color(x, y);
      c = Math.floor(c);
      
      if(e < 0){
        c += 1
      }
      
      return c;
    },
    neighborhood4: function(x, y){
      var e = totalError(x, y, 4);
      var c = color(x, y);
      c = Math.floor(c);
      
      if(e < 0){
        c += 1
      }
      
      return c;
    }
  };
  
  var addCanvases = function(names){
    var $body = $('body');
    var $container = $('<div class="container"></div>');
    _.forEach(names, function(name){
      var $test = $('<div class="test ' + name + '"></div>');
      
      var $canvas = $('<canvas width="' + SIZE + '" height="' + SIZE + '"></canvas>');
      $test.append('<h1>' + name + '</h1>');
      $test.append($canvas);
      $container.append($test);
    });
    $body.append($container)
  };
  
  var drawGradients = function(){
    _.forEach(methods, function(fn, name){
      var $canvas = $('.test.' + name + ' canvas');
      $canvas.setPixels({
        each: gradient(fn)
      });
    });
  };
  
  addCanvases(['round', 'truncate']);
  addCanvases(['random', 'biasedRandom']);
  addCanvases(['noisy', 'noisier', 'noisiest']);
  addCanvases(['neighbors4', 'neighbors8']);
  //addGradients(['neighborhood2', 'neighborhood3', 'neighborhood4']);
  
  drawGradients();

});
