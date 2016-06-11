'use strict';
namespace wsproj.client {

  export var openWindow = function() {

    var windowManager = function() {

      var _$wins : JQuery[] = [];

      function append($win : JQuery) {
        _$wins.push($win);
        reZIndex();
      }

      function remove($win : JQuery) {
        var $wins : JQuery[] = [];
        for (var i = 0; i < _$wins.length; i += 1) {
          if (_$wins[i] != $win) {
            $wins.push(_$wins[i]);
          }
        }
        _$wins = $wins;
      }

      function toFront($win : JQuery) {

        var $wins : JQuery[] = [];
        for (var i = 0; i < _$wins.length; i += 1) {
          if (_$wins[i] != $win) {
            $wins.push(_$wins[i]);
          }
        }
        $wins.push($win);
        _$wins = $wins;
        reZIndex();
      }

      function reZIndex() {
        for (var i = 0; i < _$wins.length; i += 1) {
          _$wins[i].css('z-index', '' + (100 + i) );
        }
      }

      return {
        append : append,
        remove : remove,
        toFront : toFront
      }
    }();

    return function($content : JQuery, title : string) : JQuery {

      function dispose(detail : string) {
        if ($win != null) {
          $win.trigger('dispose', {detail : detail});
          windowManager.remove($win);
          $win.remove();
          $win = null;
        }
      }

      var dragPoint : { x : number, y : number } = null;

      function mouseDownHandler(event : JQueryEventObject) {

        if ($(event.target).closest('.wsproj-close-button').length != 0) {
          return;
        }

        event.preventDefault();

        windowManager.toFront($win);

        var off = $win.offset();
        dragPoint = {
          x: event.pageX - off.left,
          y: event.pageY - off.top };
        $(document).on('mousemove', mouseMoveHandler);
        $(document).on('mouseup', mouseUpHandler);
      }

      function mouseMoveHandler(event : JQueryEventObject) {
        moveTo(event.pageX - dragPoint.x, event.pageY - dragPoint.y);
      }

      function mouseUpHandler(event : JQueryEventObject) {
        $(document).off('mousemove', mouseMoveHandler);
        $(document).off('mouseup', mouseUpHandler);
      }

      var $closeButton = setSVGSize(createSVGElement('svg'), 14, 14).
        attr('class', 'wsproj-close-button').
        css('vertical-align', 'middle').
        css('float', 'right').
        css('margin', '2px').
        append(createSVGElement('rect').
          attr({x: 0, y: 0, width: 14, height: 14}).
          attr('stroke', 'none').
          attr('fill', '#cccccc') ).
        append(createSVGElement('path').
          attr('d', 'M 3 3 L 11 11').
          attr('stroke-width', '2').attr('stroke', '#333333').
          attr('fill', 'none') ).
        append(createSVGElement('path').
          attr('d', 'M 3 11 L 11 3').
          attr('stroke-width', '2').attr('stroke', '#333333').
          attr('fill', 'none') ).
          on('mousedown', function(event) {
            event.preventDefault();
          }).on('click', function(event) {
            dispose('close');
          });

      var $title = $('<div></div>').
        addClass('wsproj-win-title').
        css('white-space', 'nowrap').
        css('cursor', 'default').
        append($('<span></span>').
          css('display', 'inline-block').
          css('float', 'left').
          css('vertical-align', 'middle').
          text(title) ).
        append($closeButton).
        append($('<br/>').css('clear', 'both') ).
        on('mousedown', mouseDownHandler).
        on('dblclick', function(event) {
          //$closeButton.trigger('click');
        });

      var $win = $('<div></div>').
        addClass('wsproj-window').
        css('white-space', 'nowrap').
        css('position', 'absolute').
        data('controller', { dispose: dispose }).
        append($title).
        append($('<div></div>').
          addClass('wsproj-win-content').
          css({
            'max-width': Math.max(900, $(window).width() - 120) + 'px',
            'max-height': Math.max(600, $(window).height() - 160) + 'px' }).
          append($content) );

      function moveTo(x : number, y : number) {
        var w = $title.outerWidth();
        var h = $title.outerHeight();
        var o1 = $win.offset();
        var o2 = $title.offset();
        var cw = $(window).width();
        var ch = $(window).height();
        var minX = $(document).scrollLeft() - (o2.left - o1.left);
        var maxX = cw - w + minX;
        var minY = $(document).scrollTop() - (o2.top - o1.top);
        var maxY = ch - h + minY;
        var dw = Math.max(0, w - h);
        minX -= dw;
        maxX += dw;
        x = Math.max(minX, Math.min(x, maxX) );
        y = Math.max(minY, Math.min(y, maxY) );
        $win.css({left: x + 'px', top: y + 'px'});
      }

      function toCenter() {
        var w = $win.outerWidth();
        var h = $win.outerHeight();
        var cw = $(window).width();
        var ch = $(window).height();
        var x = (cw - w) / 2 + $(document).scrollLeft();
        var y = (ch - h) / 2 + $(document).scrollTop();
        moveTo(x, y);
      }

      windowManager.append($win);
      $('BODY').append($win);

      toCenter();

      return $win;
    };
  }();
}
