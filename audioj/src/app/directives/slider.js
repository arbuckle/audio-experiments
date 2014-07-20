angular.module("audioj")

  .directive("slider", ["$document", function($document){
    return {
      restrict: "E",
      transclude: true,
      require: "ngModel",
      scope: {
        floor: "=floor",
        ceiling: "=ceiling",
        step: "=step",
        ngModel: "="
      },
      link: function(scope, element, attrs, ngModel) {

        var slider = angular.element(element[0].getElementsByTagName("slider-bar")[0]),
            knob = angular.element(element[0].getElementsByTagName("knob")[0]),
            sliderPos = slider[0].getBoundingClientRect(),
            knobPos = knob[0].getBoundingClientRect();



        slider.on("click", function(event) {
          knob.css({"margin-left": setPosition(event.x)});
        });

        knob.on("mousedown", function(event){
          event.preventDefault();

          $document.on("mousemove", mousemove);
          $document.on("mouseup", mouseup);
        });

        scope.$watch("ngModel", function(current, previous){
          if (current === previous) {
            return;
          }
          setPositionFromModel(current);
        });

        function setPositionFromModel (current) {

          // calculate % within range
          var perc = current / (scope.ceiling - scope.floor);

          // calculate offset
          var offset = (sliderPos.width - knobPos.width) * perc;

          // set margin
          knob.css("margin-left", offset + "px");
        }

        function setPosition (posX){
          /*
           * Accepts the X position of a click event relative to the window
           * and translates the position to a % of the value betwixt scope.floor
           * and scope.ceiling, rounded to the nearest value of scope.step.
           *
           * Sets ngModel to this value.
           *
           * returns a a margin value for the knob.
           */

          // Subtract sliderPos.left from click position.
          var clickX = posX - sliderPos.left,
              range = sliderPos.width - knobPos.width;

          clickX = (clickX >= range) ? range : clickX;
          clickX = (clickX <= 0) ? 0 : clickX;

          // Determine % of slider in which the click has occurred.
          var sliderPerc = clickX / range;

          // Translate percentage value to a abs alue between scope.floor and scope.ceiling
          //ngModel.$setViewValue( ((scope.ceiling - scope.floor) * sliderPerc) + scope.floor);
          scope.$apply(function(){
            scope.ngModel = ((scope.ceiling - scope.floor) * sliderPerc) + scope.floor;
          });

          // Round value to the nearest value of step.
          // later :)
          return clickX + "px";
        }

        function mousemove(event) {
          knob.css("margin-left", setPosition(event.x));
        }

        function mouseup() {
          $document.off("mousemove", mousemove);
          $document.off("mouseup", mouseup);
        }

        setPositionFromModel(scope.ngModel);

      },
      templateUrl: "directives/slider.tpl.html"
    };
  }])

;
