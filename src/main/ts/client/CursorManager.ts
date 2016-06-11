'use strict';
namespace wsproj.client {

  function createOpaBox(
    left : number, top : number, width : number, height : number
  ) {
    return $('<div></div>').
      addClass('wsproj-current-cell').
      css('position', 'absolute').
      css('pointer-events', 'none').
      css('background-color', styleConsts.currentRowColor).
      css('opacity', 0.1).
      css('left', left + 'px').
      css('top', top + 'px').
      css('width', width + 'px').
      css('height', height + 'px');
  }

  function createCellBox(
    left : number, top : number, width : number, height : number
  ) {
  
    return $('<div></div>').
      addClass('wsproj-current-cell').
      css('position', 'absolute').
      css('pointer-events', 'none').
      css('border-color', styleConsts.currentCellColor).
      css('border-style', 'solid').
      css('border-width', '2px').
      css('left', left + 'px').
      css('top', top + 'px').
      css('width', width + 'px').
      css('height', height + 'px');
  }

  export function createCursorManager($table : JQuery) {

    var $cursors : { [id : string] : JQuery } = {};

    function updateCursor($cell : JQuery)  {

      var id : string;

      // remove all
      for (id in $cursors) {
        $cursors[id].remove();
      }
      $cursors = {};

      if ($cell == null) {
        return;
      }

      var $target = $table.parent();

      function getOffset($cell : JQuery) {
        var o1 = $cell.offset();
        var o2 = $target.offset();
        o1.left -= o2.left;
        o1.top -= o2.top;
        return o1;
      }

      var $tr = $cell.parent();
      var off = getOffset($tr);

      $cursors['row'] = createOpaBox(
        off.left, off.top, $tr.outerWidth(), $tr.outerHeight() );

      var $rows = $tr.parent().children();
      var colIndex = $cell.index();
      var $upperCell = $($($rows[0]).children()[colIndex]);
      var $lowerCell = $($($rows[$rows.length - 1]).children()[colIndex]);

      var cellOff = getOffset($cell);
      var upperTop = getOffset($upperCell).top;
      var lowerTop = getOffset($lowerCell).top;

      var height : number;

      height = off.top - upperTop;
      if (height > 0) {
        $cursors['upper'] = createOpaBox(
          cellOff.left, upperTop, $cell.outerWidth(), height);
      }

      var cellBottom = cellOff.top + $cell.outerHeight();
      height = lowerTop + $lowerCell.outerHeight() - cellBottom;
      if (height > 0) {
        $cursors['lower'] = createOpaBox(
          cellOff.left, cellBottom, $cell.outerWidth(), height);
      }

      $cursors['cell'] = createCellBox(
          cellOff.left - 1, cellOff.top - 1,
          $cell.outerWidth() - 1, $cell.outerHeight() - 1);

      // append all
      for (id in $cursors) {
        $target.append($cursors[id]);
      }
    }

    return {
      updateCursor : updateCursor
    };
  }
}
