$(function(){
  // Default to a square gradient of the following size.
  var SIZE = 250;
  var MAX_DISTANCE = Math.sqrt(SIZE * SIZE);
  
  // Move these around to position the center (darkest part)
  // of the radial gradient.
  var gradientX = SIZE / 2;
  var gradientY = SIZE / 2;
  
  // Make these closer together to limit the number of colors available
  // to the gradient.
  var LOW = 8;
  var HIGH = 24;
  
  // Make this larger to make the available shades more visibly distinct.
  var FACTOR = 10;
  
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
  
  // Converts a gradient function expecting a point (`x` and `y` coordinates) and
  // returning a gray value (1 - 255) into a callback suitable for use with jCanvas's
  // `setPixles` `each` argument. 
  var gradient = function(f){
    var x = 0;
    var y = 0;
    return function(px){
      var c = f(x, y);
      
      // Make banding more visible.
      c *= FACTOR;
      
      // Treat as a neutral gray.
      px.r = c;
      px.g = c;
      px.b = c;
      px.a = 255;
      
      // Keep track of position, since jCanvas doesn't.
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
  
  var averageError = function(x, y, neighborhood){
    var total = 0;
    _.forEach(_.range(x - neighborhood, x + neighborhood + 1), function(dx){
      _.forEach(_.range(y - neighborhood, y + neighborhood + 1), function(dy){
        total += error(dx, dy)
      });
    });
    var size = 2 * neighborhood + 1;
    return total / (size * size);
  };
  
  var memoryAverageError = function(x, y, neighborhood){
    var total = 0;
    _.forEach(_.range(x - neighborhood, x + neighborhood + 1), function(dx){
      _.forEach(_.range(y - neighborhood, y + neighborhood + 1), function(dy){
        total += get(dx, dy) - color(x, y);
      });
    });
    
    var size = 2 * neighborhood + 1;
    return total / (size * size);
  };
  
  var memory = {};
  
  var loc = function(x, y){
    return y * SIZE + x;
  };
  
  var clear = function(){
    memory = {};
  };
  
  var get = function(x, y){
    var r = memory[loc(x, y)];
    if(_.isUndefined(r)){
      return color(x, y);
    }
    return r;
  };
  
  var set = function(x, y, v){
    memory[loc(x, y)] = v;
  };
  
  var add = function(x, y, e){
    memory[loc(x, y)] = get(x, y) + e;
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
    noisyBiasedRandom: function(x, y){
      var c = color(x, y);
      var floorC = Math.floor(c);
      var rounding = c - floorC;
      if(Math.random() < rounding){
        floorC += 1;
      }
      if(Math.random() < 0.1){
        floorC += 1 - Math.floor(Math.random() * 3);
      }
      return floorC;
    },
    noisiestBiasedRandom: function(x, y){
      var c = color(x, y);
      var floorC = Math.floor(c);
      var rounding = c - floorC;
      if(Math.random() < rounding){
        floorC += 1;
      }
      if(Math.random() < 0.1){
        floorC += 2 - Math.floor(Math.random() * 5);
      }
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
      var e = averageError(x, y, 1);
      var c = color(x, y);
      
      c = Math.floor(c);
      if(e <= 0){
        c += 1;
      }
      
      return c;
    },
    neighborhood2: function(x, y){
      var e = averageError(x, y, 2);
      var c = color(x, y);
      
      c = Math.floor(c);
      if(e <= 0){
        c += 1;
      }
      
      return c;
    },
    neighborhood3: function(x, y){
      var e = averageError(x, y, 3);
      var c = color(x, y);
      
      c = Math.floor(c);
      if(e <= 0){
        c += 1;
      }
      
      return c;
    },
    neighborhood4: function(x, y){
      var e = averageError(x, y, 4);
      var c = color(x, y);
      
      c = Math.floor(c);
      if(e <= 0){
        c += 1;
      }
      
      return c;
    },
    
    memory2: function(x, y){
      var e = memoryAverageError(x, y, 2);
      var c = color(x, y);
      
      var finalColor = Math.floor(c);
      if(e <= 0){
        finalColor += 1;
      }
      
      var finalColor = Math.round(c - e);
      set(x, y, finalColor - c);
      return finalColor;
    },
    memory3: function(x, y){
      var e = memoryAverageError(x, y, 3);
      var c = color(x, y);
      
      var finalColor = Math.round(c - e);
      set(x, y, finalColor - c);
      return finalColor;
    },
    
    floyd: function(x, y){
      var oldC = get(x, y);
      var c = Math.round(oldC);
      var e = oldC - c;
      
      add(x + 1, y, e * 7/16);
      add(x - 1, y + 1, e * 3/16);
      add(x, y + 1, e * 5/16);
      add(x + 1, y + 1, e * 1/16);
      
      return c;
    },
    jjn: function(x, y){
      var oldC = get(x, y);
      var c = Math.round(oldC);
      var e = oldC - c;
      
      add(x + 1, y, e * 7/48);
      add(x + 2, y, e * 5/48);
      add(x - 2, y + 1, e * 3/48);
      add(x - 1, y + 1, e * 5/48);
      add(x, y + 1, e * 7/48);
      add(x + 1, y + 1, e * 5/48);
      add(x + 2, y + 1, e * 3/48);
      add(x - 2, y + 2, e * 1/48);
      add(x - 1, y + 2, e * 3/48);
      add(x, y + 2, e * 5/48);
      add(x + 1, y + 2, e * 3/48);
      add(x + 2, y + 2, e * 1/48);
      
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
  addCanvases(['lessNoisy', 'noisy', 'noisier', 'noisiest']);
  addCanvases(['noisyBiasedRandom', 'noisiestBiasedRandom']);
  
  // These are slow and ugly.
  addCanvases(['neighbors4', 'neighbors8']);
  addCanvases(['neighborhood2', 'neighborhood3']);
  addCanvases(['memory2', 'memory3']);
  
  addCanvases(['floyd', 'jjn']);
  
  drawGradients();
});
