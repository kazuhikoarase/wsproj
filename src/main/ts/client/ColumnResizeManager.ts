'use strict';
namespace wsproj.client {

  var getMouseCount = function() {
    function getTime() {
      return +new Date();
    }
    var lastTime = getTime();
    var mouseCount = 0;
    return function() {
      var time = getTime();
      if (time - lastTime > 500) {
        mouseCount = 0;
        lastTime = time;
      }
      mouseCount += 1;
      return mouseCount;
    }
  }();

  function createColumnCursor(height : number, gap : number) {
    var w = (gap * 2 + 1);
    var $line = $('<div></div>').
        css('background-color', '#666666').
        css('cursor', 'col-resize').
        css('position', 'absolute').
        css('left', gap + 'px').
        css('top', '0px').
        css('width', '1px').
        css('height', height + 'px');
    var $base = $('<div></div>').
        css('background-color', '#cccccc').
        css('opacity', '0').
        css('cursor', 'col-resize').
        css('position', 'absolute').
        css('left', '0px').
        css('top', '0px').
        css('width', w + 'px').
        css('height', height + 'px');
    return $('<div></div>').
        css('position', 'absolute').
        css('width', w + 'px').
        css('height', height + 'px').
        append($('<div></div>').css('position', 'relative').
          append($base).append($line) );
  }

  export function createColumnResizeManager() : ColumnResizeManager {

    var widthMap : { [id : string] : number } = {};

    function getCss(id : string) : any {
      var width = widthMap[id];
      if (width) {
        return {'overflow': 'hidden', 'max-width': width + 'px'};
      } else {
        return {'overflow': '', 'max-width': ''};
      }
    }
    function setColumnWidth(id : string, width : number) {
      widthMap[id] = width;
    }
    function getColumnWidth(id : string) {
      return widthMap[id] || 0;
    }
    return {
      setColumnWidth : setColumnWidth,
      getColumnWidth : getColumnWidth,
      getCss : getCss
    }
  }

  export function setColumnResizable(
    columnResizeManager : ColumnResizeManager,
    $th : JQuery,
    colIndex : number,
    column : DataColumn
  ) {

    function setColumnWidth(width : number) {
      columnResizeManager.setColumnWidth(column.id, width);
      var css = columnResizeManager.getCss(column.id);
      $th.css(css);
      var $table = $th.closest('TABLE');
      $table.children('TBODY').children().each(function() {
        $($(this).children()[colIndex]).css(css);
      });
      $table.trigger('columnWidthChange');
    }

    var handleGap = 2;
    var cursorGap = 16;
    var minColumnWidth = 16;
    var $cursor : JQuery = null;
    var columnWidth : number = 0;
    var dragPoint : { x : number } = null;

/*
    function cached<T>(getter : () => T) : () => T {
      var cache : T = null;
      return function() {
        if (cache == null) {
          cache = getter();
        }
        return cache;
      }
    }
*/

    function getTable() {
      return $th.closest('TABLE');
    }

    function getTarget() {
      return getTable().parent();
    }

    function getOffset($cell : JQuery) {
      var o1 = $cell.offset();
      var o2 = getTarget().offset();
      o1.left -= o2.left;
      o1.top -= o2.top;
      return o1;
    }

    function moveCursor(event : JQueryEventObject) {
      var offset = getOffset($th).left - cursorGap +
        (styleConsts.cellPadding * 2 + 1);
      columnWidth = Math.max(minColumnWidth, Math.min(
        event.pageX - dragPoint.x - offset, 500) );
      $cursor.css('left', (columnWidth + offset) + 'px').
        css('top', getOffset(getTable() ).top + 'px');
      //$cursor.css('left', (event.pageX - dragPoint.x) + 'px');
    }

    function mouseDownHandler(event : JQueryEventObject) {
      event.preventDefault();
      if (getMouseCount() == 2) {
        // fake dblclick
        $(this).trigger('dblclick');
      }
      $cursor = createColumnCursor(getTable().outerHeight(), cursorGap);
      getTarget().append($cursor);
      var off = getOffset($th);
      dragPoint = { x : event.pageX -
        (off.left + $th.outerWidth() - cursorGap) };
      moveCursor(event);
      $(document).on('mousemove', mouseMoveHandler).
        on('mouseup', mouseUpHandler);
    }
    function mouseMoveHandler(event : JQueryEventObject) {
      moveCursor(event);
    }
    function mouseUpHandler(event : JQueryEventObject) {
      $(document).off('mousemove', mouseMoveHandler).
        off('mouseup', mouseUpHandler);
      $cursor.remove();
      setColumnWidth(columnWidth);
    }
    function createHandle() {
      return $('<div></div>').
        css('cursor', 'col-resize').
        css('position', 'absolute').
        css('opacity', '0').
        css('background-color', '#cccccc').
        css('width', (handleGap * 2 + 1) + 'px').
        css('height', '100px').
        on('mousedown', mouseDownHandler).
        on('dblclick', function(event) {
          setColumnWidth(0);
        });
    }

    var _top = 0;
    var _left = 0;
    var _height = 0;
    var $handle : JQuery = null;

    function updateHandle() {

      if ($handle == null) {
        $handle = createHandle();
        $th.data('wsproj-alive', true);
        getTarget().append($handle);
      }

      if (!$th.data('wsproj-alive') || getTarget().length == 0) {
        $handle.remove();
        return;
      }

      var off = getOffset($th);
      var left = off.left + $th.outerWidth();
      var top = getOffset(getTable() ).top;
      var height = $th.closest('THEAD').outerHeight();

      if (_left != left || _top != top || _height != height) {
        _left = left;
        _top = top;
        _height = height;
        $handle.css('left', (_left - handleGap) + 'px').
          css('top', _top + 'px').
          css('height', _height + 'px');
      }

      window.setTimeout(updateHandle, 100);
    }

    callLater(updateHandle);

    $th.on('mousedown', function(event) {
        event.preventDefault();
      }).data('controller', {
        setColumnWidth : setColumnWidth
      });
  }
}
