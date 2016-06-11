'use strict';
namespace wsproj.client {

  export function createHeader<T>(
    $head : JQuery,
    tableModel : DataTableModel<T>,
    setupHeaderCell : ($th : JQuery, column : DataColumn) => void,
    columnResizeManager : ColumnResizeManager
  ) {

    var cells : { [id : string] : JQuery } = {};
    $head.data('cells', cells);
    function registerHeaderCell($th : JQuery) {
      cells[$th.attr('id')] = $th;
    }
    function eachColumn(fn : (i : number, column : DataColumn) => void) {
      var columns = tableModel.columns;
      for (var i = 0; i < columns.length; i += 1) {
        fn(i, columns[i]);
      }
    }

    var gr : number[] = [];
    var grouped = false;
    eachColumn(function(i : number, column : DataColumn) {
      gr.push(0);
    });
    eachColumn(function(i : number, column : DataColumn) {
      if (typeof column.groupLabel == 'string') {
        grouped = true;
        for (var g = 0; g < column.groupSize; g += 1) {
          gr[i + g] += 1;
        }
      }
      gr.push(0);
    });

    if (!grouped) {
      var $tr = $('<tr></tr>');
      eachColumn(function(i : number, column : DataColumn) {
        var $th = createHeaderCellInternal().attr('id', 'header-' + column.id);
        registerHeaderCell($th);
        setupHeaderCell($th, column);
        if (column.resizable) {
          setColumnResizable(columnResizeManager, $th, i, column);
        }
        $th.css(columnResizeManager.getCss(column.id) );
        $tr.append($th);
      });
      $head.append($tr);
    } else {
      var $tr1 = $('<tr></tr>');
      var $tr2 = $('<tr></tr>');
      eachColumn(function(i : number, column : DataColumn) {
        var $th = createHeaderCellInternal().attr('id', 'header-' + column.id);
        registerHeaderCell($th);
        setupHeaderCell($th, column);
        if (column.resizable) {
          setColumnResizable(columnResizeManager, $th, i, column);
        }
        $th.css(columnResizeManager.getCss(column.id) );
        var rowspan = 2 - gr[i];
        $th.attr('rowspan', rowspan);
        if (rowspan == 2) {
          $tr1.append($th);
        } else {
          $tr2.append($th);
        }
        if (typeof column.groupLabel == 'string') {
          $th = createHeaderCellInternal().
            attr('id', 'group-header-' + column.id).
            attr('colspan', column.groupSize).
            text(column.groupLabel);
          registerHeaderCell($th);
          $tr1.append($th);
        }
      });
      $head.children().remove();
      $head.append($tr1);
      $head.append($tr2);
    }
  }

  var headerCellCache : JQuery = null;

  function createHeaderCellInternal() {
    if (headerCellCache == null) {
      headerCellCache = $('<th></th>').
        css('padding-left', styleConsts.cellPadding + 'px').
        css('padding-right', styleConsts.cellPadding + 'px').
        css('vertical-align', 'bottom');
    }
    return headerCellCache.clone();
  }
}
