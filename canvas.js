$(function(){
  var LOW = 16;
  var HIGH = 96;
  var FACTOR = 1;//8;
  var SIZE = 500;
  var MAX_DISTANCE = Math.sqrt(SIZE * SIZE);
  
  var gradientX = SIZE / 2;
  var gradientY = SIZE / 2;
  
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
      
      // Make bands more visible.
      c *= FACTOR;
      
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
    return result - c;
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
  
  
  var memory = {};
  
  var memoryTotalError = function(x, y, neighborhood){
    var total = 0;
    _.forEach(_.range(x - neighborhood, x + neighborhood + 1), function(dx){
      _.forEach(_.range(y - neighborhood, y + neighborhood + 1), function(dy){
        total += get(dx, dy) - color(x, y);
      });
    });
    
    var size = 2 * neighborhood + 1;
    return total / (size * size);
  };
  
  var clear = function(){
    memory = {};
  };
  
  var set = function(x, y, v){
    memory[y * SIZE + x] = v;
  };
  
  var get = function(x, y){
    var r = memory[y * SIZE + x];
    if(_.isUndefined(r)){
      return color(x, y);
    }
    return r;
  };
  
  var update = function(x, y, e, f){
    memory[y * SIZE + x] = get(x, y) + e * f;
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
    lessNoisyBiasedRandom: function(x, y){
      var c = color(x, y);
      var floorC = Math.floor(c);
      var rounding = c - floorC;
      if(Math.random() < rounding){
        floorC += 1;
      }
      floorC += 1 - Math.floor(Math.random() * 3);
      return floorC;
    },
    noisyBiasedRandom: function(x, y){
      var c = color(x, y);
      var floorC = Math.floor(c);
      var rounding = c - floorC;
      if(Math.random() < rounding){
        floorC += 1;
      }
      floorC += 2 - Math.floor(Math.random() * 5);
      return floorC;
    },
    lessNoisy: function(x, y){
      var c = color(x, y);
      c += 0.25 - 0.5 * Math.random();
      return Math.round(c);
    },
    noisy: function(x, y){
      var c = color(x, y);
      c += 0.5 - Math.random();
      return Math.round(c);
    },
    noisier: function(x, y){
      var c = color(x, y);
      c += 1 - 2 * Math.random();
      return Math.round(c);
    },
    noisiest: function(x, y){
      var c = color(x, y);
      c += 2 - 4 * Math.random();
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
        error(x - 2, y - 2) +
        error(x - 2, y + 2) +
        error(x + 2, y - 2) +
        error(x + 2, y + 2);
      
      var c = color(x, y);
      c = Math.floor(c);
      
      if(e <= 0){
        c += 1
      }
      
      return c;
    },
    neighborhood1: function(x, y){
      var n = 1;
      var e = totalError(x, y, n);
      var c = color(x, y);
      
      c -= e;
      
      return Math.round(c);
    },
    neighborhood2: function(x, y){
      var n = 2;
      var e = totalError(x, y, n);
      var c = color(x, y);
      
      c -= e;
      
      return Math.round(c);
    },
    neighborhood3: function(x, y){
      var n = 3;
      var e = totalError(x, y, n);
      var c = color(x, y);
      
      c -= e;
      
      return Math.round(c);
    },
    neighborhood4: function(x, y){
      var n = 4;
      var count = (2 * n + 1) * (2 * n + 1);
      var e = totalError(x, y, n);
      var c = color(x, y);
      
      c -= e;
      
      return Math.round(c);
    },
    memory2: function(x, y){
      var e = memoryTotalError(x, y, 2);
      var c = color(x, y);
      
      c -= e;
      
      var finalColor = Math.round(c);
      set(x, y, finalColor - c); 
      return finalColor;
    },
    memory3: function(x, y){
      var e = memoryTotalError(x, y, 3);
      var c = color(x, y);
      c -= e;
      
      var finalColor = Math.round(c);
      set(x, y, finalColor - c); 
      return finalColor;
    },
    floyd: function(x, y){
      var oldC = get(x, y);
      var c = Math.round(oldC);
      var e = oldC - c;
      update(x + 1, y, e, 7/16);
      update(x - 1, y + 1, e, 3/16);
      update(x, y + 1, e, 5/16);
      update(x + 1, y + 1, e, 1/16);
      return c;
    },
    jarvis: function(x, y){
      var oldC = get(x, y);
      var c = Math.round(oldC);
      var e = oldC - c;
      update(x + 1, y, e, 7/48);
      update(x + 2, y, e, 5/48);
      
      update(x - 2, y + 1, e, 3/48);
      update(x - 1, y + 1, e, 5/48);
      update(x, y + 1, e, 7/48);
      update(x + 1, y + 1, e, 5/48);
      update(x + 2, y + 1, e, 3/48);
      
      update(x - 2, y + 2, e, 1/48);
      update(x - 1, y + 2, e, 3/48);
      update(x, y + 2, e, 5/48);
      update(x + 1, y + 2, e, 3/48);
      update(x + 2, y + 2, e, 1/48);
      
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
      
      var $link = $('<a href="#">Save...</a>');
      $link.click(function(e){
        e.preventDefault();
        e.stopPropagation();
        var data = $canvas.getCanvasImage("png");
        var w = window.open('about:blank');
        w.document.write('<img src="' + data + '" />');
      });
      $test.append($link);
      
      $container.append($test);
    });
    $body.append($container)
  };
  
  var drawGradients = function(){
    _.forEach(methods, function(fn, name){
      var $canvas = $('.test.' + name + ' canvas');
      
      clear();
      
      $canvas.setPixels({
        each: gradient(fn)
      });
    });
  };
  
  addCanvases(['round', 'truncate']);
  addCanvases(['random', 'biasedRandom']);
  addCanvases(['noisy', 'noisier', 'noisiest']);
  addCanvases(['lessNoisyBiasedRandom', 'noisyBiasedRandom']);
  //addCanvases(['neighbors4', 'neighbors8']);
  //addCanvases(['neighborhood2', 'neighborhood3']);
  //addCanvases(['memory2', 'memory3']);
  //addCanvases(['floyd', 'jarvis']);
  
  drawGradients();

});
