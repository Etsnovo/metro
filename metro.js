'use strict';

angular.module('metro', [])
  .controller('metroCtrl', ['$scope', '$window', function($scope, $window) {
    $scope.canvasHeight = 800;
    $scope.canvasWidth = 600;
    $scope.mode = "none";
    $scope.startDraw = false;
    $scope.elements = ( localStorage.getItem("elements") !== null ? JSON.parse(localStorage.getItem("elements")) : []);
    $scope.elementsColorsAlready = {};
    for(var i in $scope.elements) {
      $scope.elementsColorsAlready[$scope.elements[i].color] = true;
    }
    $scope.colors = [
      { name: 'Сокольническая', rgb: [239, 49, 37] },
      { name: 'Замоскворецкая', rgb: [76,185,96] },
      { name: 'Арбатско-Покровская', rgb: [0, 121, 194] },
      { name: 'Филёвская', rgb: [3,194,243] },
      { name: 'Колцевая', rgb: [140, 80, 54] },
      { name: 'Калужско-Рижская', rgb: [242,129,49] },
      { name: 'Таганско-Краснопресненская', rgb: [136,62,147] },
      { name: 'Калининская', rgb: [252,206,51] },
      { name: 'Серпуховско-Тимирязевская', rgb: [161,162,164] },
      { name: 'Люблинская', rgb: [181,213,70] },
      { name: 'Каховская', rgb: [120,201,204] },
      { name: 'Бутовская', rgb: [172,191,223] },
      { name: 'Тимирязевская-Ул.Сергея Эйзенштейна', rgb: [172,191,223] }
    ];
    $scope.color = $scope.colors[0].rgb.join();
    $scope.config = {
      backgroundColor: [250,250,250],
      notHoverColor: [201,201,201],
      queuePeriod: 100, // msecond
      queueBenchmarkDetector: true, // output to $scope.queueBenchmarkDetector ( > 100% = overload )
      debug: true // console.log enabled
    };
    
    $scope.deletePoint = function(index) {
      var p = $scope.elements[$scope.selectorPosition].points;
      $scope.elements[$scope.selectorPosition].points = p.slice(0, index).concat(p.slice(index+1));
      $scope.queue.push(['update']);
      $scope.$emit('storageUpdate');
    }
    
    $scope.deleteItem = function(index) {
      if (window.confirm('delete?')) {
        $scope.elements = $scope.elements.slice(0, index).concat($scope.elements.slice(index+1));
        $scope.$emit('storageUpdate');
        $scope.queue.push(['update']);
      }
    }
    
    $scope.queue = [ ['start'] ];
    if ($scope.config.queueBenchmarkDetector) {
      $scope.queueBenchmarkDetector = 0;
    }
    
    $scope.$on('storageUpdate', function() {
      if(typeof(Storage) !== "undefined") {
        localStorage.setItem("elements", JSON.stringify($scope.elements));
        $scope.queue.push(['update']);
      }
    });
    
    setInterval(function() { // NO $interval!!! NO automatic $scope.$apply!!!
      var counterQueueStampStart; // for benchmark
      if ($scope.config.queueBenchmarkDetector) { // benchmark start timestamp
        counterQueueStampStart = new Date();
      } // end IF benchmark start timestamp
      var draw = false;
      while ($scope.queue.length > 0) { //queue
        var current = $scope.queue.shift();
        while ($scope.queue.length > 0 && $scope.queue[0][0] === current[0]) { // cascade events
          current = $scope.queue.shift();
        }
        if(current[0] === 'mousedown') {
          if ($scope.selectedColor !== undefined) {
            if ($scope.figure === 'station') {
              $scope.draw = true;
              $scope.elements.push({ figure: $scope.figure, lineWidth: 5, color: $scope.selectedColor, points: [ { x: current[1], y: current[2] } ], title: {x: current[1] + 6, y: current[2] + 3, name: 'insert here' }, checked: false });
            } else {
              var lineChecked = true;
              for(var i in $scope.elements) {
                var el = $scope.elements[i];
                if (el.figure === 'station' && el.color === $scope.selectedColor) {
                  var length = Math.sqrt ( Math.pow(el.points[0].x - current[1], 2) + Math.pow(el.points[0].y - current[2], 2) );
                  if(length <= el.lineWidth) {
                    el.checked = !el.checked;
                    lineChecked = false;
                    break;
                  }
                }
              }
              if (lineChecked) {
                for(var i in $scope.elements) {
                  var el = $scope.elements[i];
                  if (el.figure === 'station' && el.color === $scope.selectedColor) {
                    el.checked = !el.checked;
                  }
                }
              }
            }
          } else if ($scope.figure !== 'station' && $scope.figure !== 'none') {
            $scope.draw = true;
            $scope.elements.push({ figure: $scope.figure, lineWidth: 5, color: $scope.color, points: [ { x: current[1], y: current[2] }, { x: current[1], y: current[2] } ] });
            $scope.elementsColorsAlready[$scope.color] = true;
          }
        } else if(current[0] === 'mouseup') {
          draw = true;
          $scope.draw = false;
          $scope.$emit('storageUpdate');
        } else if(current[0] === 'ctrlDown') {
          var index = $scope.elements.length - 1;
          if (index >= 0 && $scope.elements[index].figure === 'line') {
            $scope.elements[index].points.push( $scope.lastMousePosition );
            $scope.ctrl = true;
          }
        } else if(current[0] === 'ctrlUp') {
          $scope.ctrl = false;
          $scope.$emit('storageUpdate');
        } else if(current[0] === 'mousemove') {
          $scope.lastMousePosition = { x: current[1], y: current[2] };
          if ($scope.draw || $scope.ctrl) {
            var index = $scope.elements.length - 1,
              point = $scope.elements[index].points[ $scope.elements[index].points.length - 1 ];
            point.x = current[1];
            point.y = current[2];
            draw = true;
          } else {
            var color = current.slice(3),
              colorJoin = color.join();
            if (colorJoin !== $scope.config.backgroundColor.join() && colorJoin !== $scope.config.notHoverColor.join()
              && $scope.elementsColorsAlready[colorJoin] !== undefined)
            {
              $scope.selectedColor = colorJoin;
              draw = true;
            } else if (colorJoin !== $scope.config.backgroundColor.join()) {
              $scope.selectedColor = undefined;
              draw = true;
            } else if ($scope.selectedColor !== undefined && colorJoin === $scope.config.backgroundColor.join() ) {
              $scope.selectedColor = undefined;
              draw = true;
            }
          }
        } else {
          if ($scope.config.debug) {
            console.log('unknown: ', current[0])
          }
          draw = true;
        }
        
      } //end while queue
      
      if (draw) {
        var planeId = ($scope.cC === 0 ? 1 : 0),
          ctx = $scope.ctx[planeId];
        ctx.fillStyle = 'rgb(' + $scope.config.backgroundColor.join(',') + ')';
        ctx.fillRect(0, 0, $scope.canvas[planeId].ctrl.width, $scope.canvas[planeId].ctrl.height);
        var elements = $scope.elements.slice(0),
          eLastIndex = elements.length - 1;
        for(var i=0; i < elements.length; i++) {
          ctx.beginPath();
          var el = elements[i];
          ctx.lineWidth = el.lineWidth || 10;
          if ($scope.selectedColor !== undefined && $scope.selectedColor !== el.color) {
            ctx.strokeStyle = 'rgb(' + $scope.config.notHoverColor.join() + ')';
          } else if ($scope.selectedColor !== undefined && $scope.selectedColor === el.color && i <= eLastIndex) {
            elements.push(elements[i]);
            ctx.stroke();
            continue;
          } else {
            ctx.strokeStyle = 'rgb(' + el.color + ')';
          }
          if (el.figure === 'circle') {
            var radius = Math.sqrt( Math.pow(el.points[0].x - el.points[1].x, 2) + Math.pow(el.points[0].y - el.points[1].y, 2) );
            ctx.arc(el.points[0].x, el.points[0].y, radius, 0, 2 * Math.PI);
          } else if (el.figure === 'line') {
            ctx.moveTo(el.points[0].x, el.points[0].y);
            ctx.lineCap = 'round';
            for(var x=1; x<el.points.length; x++) {
              ctx.lineTo(el.points[x].x, el.points[x].y);
            }
          } else if (el.figure === 'station') {
            ctx.lineWidth = 1;
            var tmpColor = ctx.strokeStyle;
            ctx.strokeStyle = 'rgb(' + $scope.config.backgroundColor.join() + ')';
            ctx.arc(el.points[0].x, el.points[0].y, el.lineWidth, 0, 2 * Math.PI);
            ctx.fillStyle = tmpColor;
            ctx.fill();
            ctx.font = "8px verdana";
            if (tmpColor === '#' + $scope.config.notHoverColor[0].toString(16) + $scope.config.notHoverColor[1].toString(16) + $scope.config.notHoverColor[1].toString(16)) {
              ctx.fillStyle = tmpColor;
            } else {
              ctx.fillStyle = 'black';
            }
            ctx.fillText(el.title.name, el.title.x, el.title.y);
            var img = document.getElementById('dawToCanvas');
            if (el.checked) {
              ctx.drawImage(img, el.points[0].x-20, el.points[0].y-12);
            }
          }
          ctx.stroke();
        }
        $scope.canvas[$scope.cC].element.css({zIndex: 1});
        $scope.canvas[planeId].element.css({zIndex: 2});
        $scope.cC = planeId;

        planeId = ($scope.cC === 0 ? 1 : 0);
        ctx = $scope.ctx[planeId];
        ctx.fillStyle = 'rgb(' + $scope.config.backgroundColor.join(',') + ')';
        ctx.fillRect(0, 0, $scope.canvas[planeId].ctrl.width, $scope.canvas[planeId].ctrl.height);

      }
      
      if ($scope.config.queueBenchmarkDetector) { // benchmark calculate
        var newQueueBenchmarkDetector = ($scope.queue.length > 0 ? counterQueueStampStart/$scope.queue.length : 1),
          counterStampEnd = new Date(),
          counterStampDiff = counterStampEnd - counterQueueStampStart,
          result = parseInt(counterStampDiff * 100 / $scope.config.queuePeriod);
        if (counterStampDiff > $scope.config.queuePeriod || $scope.queueBenchmarkDetector !== result) {
          $scope.queueBenchmarkDetector = result;
          $scope.$apply();
        }
      } // end IF benchmark calculate
    }, $scope.config.queuePeriod);

    $scope.$watch('opacityVisibility', function(status) {
      if (status) {
        $('.canvas canvas').css({opacity: 1});
      } else {
        $('.canvas canvas').css({opacity: 0.55});
      }
    })
  }])
  .directive('metro', function() {
    return {
      restrict: 'C',
      templateUrl: 'template/canvas.html',
      link: function($scope, $element, $attrs) {
        var canvasElement = $element.find('.canvas:eq(0)'),
          canvas1 = canvasElement.find('canvas:eq(0)').get(0),
          canvas2 = canvasElement.find('canvas:eq(1)').get(0);
        if (canvas1.getContext) {
          var ctx1 = canvas1.getContext('2d'),
            ctx2 = canvas2.getContext('2d');
          var offset = $(canvas1).offset();
          $scope.cC = 0;
          $scope.canvas = [
             {
              ctrl: canvas1,
              element: canvasElement.find('canvas:eq(0)')
             },
             {
              ctrl: canvas2,
              element: canvasElement.find('canvas:eq(1)')
             }
          ];
          $scope.ctx = [ ctx1, ctx2 ];
          $(canvasElement)
            .on('mousedown', function(e) {
              var x = e.pageX - offset.left,
                y = e.pageY - offset.top,
                color = $scope.ctx[$scope.cC].getImageData(x-1, y-1, 1, 1).data;
              $scope.queue.push(['mousedown', x, y, color[0], color[1], color[2] ]);
            })
            .on('mouseup', function(e) {
              var x = e.pageX - offset.left,
                y = e.pageY - offset.top;
              $scope.queue.push(['mouseup', x, y]);
            })
            .on('mousemove', function(e) {
              var x = e.pageX - offset.left,
                y = e.pageY - offset.top,
                color = $scope.ctx[$scope.cC].getImageData(x-1, y-1, 1, 1).data;
              $scope.queue.push(['mousemove', x, y, color[0], color[1], color[2] ]);
            });
          canvasElement.find('canvas').css({backgroundColor: 'rgb(' + $scope.config.backgroundColor.join(',') + ')'});
          $(window).on('keydown', function(e) { 
            if (e.ctrlKey) {              
              $scope.olderKeyCtrlDown = true;
              $scope.queue.push(['ctrlDown']);
            }
          })
          .on('keyup', function(e) { 
            if (!e.ctrlKey && $scope.olderKeyCtrlDown) {
              $scope.olderKeyCtrlDown = false;
              $scope.queue.push(['ctrlUp']);
            }
          });
        } else {
          console.log('canvas.getContext not found, canvas not supported');
        }
      }
    }
  })