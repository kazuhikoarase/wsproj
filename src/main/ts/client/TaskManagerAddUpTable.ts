'use strict';
namespace wsproj.client {

  export function createTaskManagerAddUpTable(
    dataTable : DataTable<TaskManager>,
    messages : any,
    applyDecoration : ($target : JQuery) => void
  ) : TaskManagerAddUpTable {

    var defaultTableModel = createTaskManagerTableModel(messages, 0, null);
    var tableModel : DataTableModel<TaskManager> = null;

    var _rowView : DataRow[] = null;
    var _groupedRowView : DataRow[] = null;
    var _minDate : Date = null;
    var _maxDate : Date = null;
    var _divideActToTerm = true;

    var _selectedRowIndex = -1;
    var _selectedColIndex = -1;

    var _$head : JQuery = $('<thead></thead>');
    var _$foot : JQuery = $('<tfoot></tfoot>');
    var _$body : JQuery = $('<tbody></tbody>');
    var _$table = $('<table></table>').addClass('wsproj-table').
      attr('cellspacing', '0').
      append(_$head).append(_$foot).append(_$body);

    var editor = createTableEditor(_$table);
    var cursorManager = createCursorManager(_$table);

    _$body.on('mousedown', function(event) {
        var $cell = $(event.target).closest('TD');
        if ($cell.length == 1) {
          _selectedColIndex = $cell.index();
          _selectedRowIndex = $cell.parent().index();
          updateCursor();
        }
      });

    _$table.on('keydown', function(event) {

      var selectedRowIndex = _selectedRowIndex;
      var selectedColIndex = _selectedColIndex;
      var validKey = false;

      if (event.keyCode == DOM_VK.UP) {
        validKey = true;
        selectedRowIndex -= 1;
      } else if (event.keyCode == DOM_VK.DOWN) {
        validKey = true;
        selectedRowIndex += 1;
      } else if (event.keyCode == DOM_VK.LEFT) {
        validKey = true;
        selectedColIndex -= 1;
      } else if (event.keyCode == DOM_VK.RIGHT) {
        validKey = true;
        selectedColIndex += 1;
      }

      if (validKey) {
        event.preventDefault();
      }

      var maxRowIndex = _$body.children().length - 1;
      var maxColIndex = tableModel.columns.length - 1;
      selectedRowIndex = Math.max(0, Math.min(selectedRowIndex, maxRowIndex) );
      selectedColIndex = Math.max(0, Math.min(selectedColIndex, maxColIndex) );

      if (_selectedRowIndex != selectedRowIndex ||
          _selectedColIndex != selectedColIndex) {

        _selectedRowIndex = selectedRowIndex;
        _selectedColIndex = selectedColIndex;

        var $currentCell = getCurrentCell();
        if ($currentCell != null) {
          editor.beginEdit($currentCell, true);
        }

        updateCursor();
      }
    }).on('columnWidthChange', function(event) {
      updateCursor();
    });

    function getCurrentCell() : JQuery {
      var $rows = _$body.children();
      if (0 <= _selectedRowIndex && _selectedRowIndex < $rows.length) {
        var $cols = $($rows[_selectedRowIndex]).children();
        if (0 <= _selectedColIndex && _selectedColIndex < $cols.length) {
          return $($cols[_selectedColIndex]);
        }
      }
      return null;
    }

    function updateCursor() {
      var $currentCell = getCurrentCell();
      cursorManager.updateCursor($currentCell);
    }

    var groupColumns = ['projectGroup', 'project', 'term', 'user',
      'taskType1', 'taskType2', 'taskType3', 'taskType4'];
    var groupIds : { [id : string] : boolean } = {};
    var groupState : { [id : string] : boolean } = {};
    var grouped : string[] = null;

    $.each(groupColumns, function(i : number, id : string) {
      groupIds[id] = true;
      groupState[id] = false;
    });

    function setupHeaderCell($th : JQuery, column : DataColumn) : void {
      var group = groupIds[column.id];
      var $groupCheckButton : JQuery = null;
      if (column.labelOrientation == 'vertical') {
        $th.append(createVerticalLabel($('.wsproj'), column.label).
          css('margin-top', '6px') );
        if (group) {
          $th.append($('<br/>') );
          $groupCheckButton = createCheckbox().
            css('vertical-align', 'bottom');
          $th.append($groupCheckButton);
        }
      } else {
        var $lh = $('<div></div>').
          css('white-space', 'nowrap');
        if (group) {
          $groupCheckButton = createCheckbox().
            css('vertical-align', 'middle');
          $lh.append($groupCheckButton);
        }
        $lh.append($('<span></span>').
          css('display', 'inline-block').
          css('vertical-align', 'middle').
          text(column.label) );
        $th.append($lh);
      }
      if (group) {
        var ctrl = $groupCheckButton.data('controller');
        ctrl.setChecked(groupState[column.id]);
        $groupCheckButton.attr('id', 'grp_' + column.id).
          addClass('wsproj-checkbox');
        $th.children().css('cursor', 'default').
          on('mousedown', function(event) {
            event.preventDefault();
            ctrl.setChecked(!ctrl.isChecked() );
            groupState[column.id] = ctrl.isChecked();
            grouped = null;
            validate();
          });
      }
    }

    var columnResizeManager = createColumnResizeManager();

    function getGrouped() : string[] {
      if (grouped == null) {
        grouped = [];
        for (var i = 0; i < defaultTableModel.columns.length; i += 1) {
          var column : DataColumn = defaultTableModel.columns[i];
          if (groupState[column.id]) {
            grouped.push(column.id);
          }
        }
      }
      return grouped;
    }

    function createGroupKey(data : any) : string {
      var key = '';
      var grouped = getGrouped();
      for (var i = 0; i < grouped.length; i += 1) {
        var id = grouped[i];
        key += id + '=' + data[id] + ';'
      }
      return key;
    }

    function cloneObj(src : any) {
      var dst : any = {};
      for (var k in src) {
        dst[k] = src[k];
      }
      return dst;
    }

    function cloneGroupData(src : any) {
      var dst : any = {};
      for (var i = 0; i < groupColumns.length;  i += 1) {
        var k = groupColumns[i];
        if (typeof src[k] != 'undefined') {
          dst[k] = src[k];
        }
      }
      return dst;
    }

    function divideRows(rows : DataRow[]) {

      var beginOfMonth = +dataTable.tableModel.
        userData.taskAddUpConfig.beginOfMonth;
      var termCache : { [date : string] : string } = {};
      function getTerm(date : string) : string {
        var term = termCache[date];
        if (!term) {
          term = getTermByDate(date, beginOfMonth);
          termCache[date] = term;
        }
        return term;
      }

      var dividedRows : DataRow[] = [];

      function divideRow(dataRow : DataRow) {

        // divide

        var data = cloneObj(dataRow.data);
        var subDataMap : { [term : string] : any } = {};
        var actIds : string[] = [];
        var term : string;

        for (var id in data) {
          if (isActDate(id) ) {

            var date = id.substring(3);
            term = getTerm(date);

            var subData = subDataMap[term];
            if (!subData) {
              subData = cloneGroupData(data);
              subData.term = term;
              subData.elapsed = 0;
              subDataMap[term] = subData;
            }

            if (typeof subData.minAct == 'undefined') {
              subData.minAct = date;
              subData.maxAct = date;
            } else if (date < subData.minAct) {
              subData.minAct = date;
            } else if (date > subData.maxAct) {
              subData.maxAct = date;
            }

            var act : string = data[id];
            subData[id] = act;
            subData.elapsed += strToNum(act);
            actIds.push(id);
          }
        }

        // cleanup act data
        for (var i = 0; i < actIds.length; i += 1) {
          delete data[actIds[i]];
        }
        delete data.minAct;
        delete data.maxAct;

        dividedRows.push({valid: false, data: data});

        var hasOrigEst = typeof data.origEst != 'undefined';
        var elapsed = 0;
        for (term in subDataMap) {
          var subData = subDataMap[term];
          elapsed += subData.elapsed;
          subData.elapsed = hourToStr(subData.elapsed);
          if (hasOrigEst) {
            subData.origEst = subData.elapsed;
          }
          subData.currEst = subData.elapsed;
          subData.remain = hourToStr(0);
          dividedRows.push({valid: false, data: subData});
        }

        // overwrite currEst and elapsed.
        if (hasOrigEst) {
          data.origEst = hourToStr(strToNum(data.origEst) - elapsed);
        }
        data.currEst = hourToStr(strToNum(data.currEst) - elapsed);
        data.elapsed = hourToStr(strToNum(data.elapsed) - elapsed);
      }

      for (var i = 0; i < rows.length; i += 1) {
        var dataRow = rows[i];
        if (!dataRow.data.term && dataRow.data.minAct) {
          divideRow(dataRow);
        } else {
          dividedRows.push(rows[i]);
        }
      }
      return dividedRows;
    }

    function updateRowView() {

      if (_divideActToTerm) {
        var columns = [ dataTable.tableModel.userData.columnMap['term'] ];
        var rowView = divideRows(dataTable.getRowView() );
        _rowView = dataTable.applyFilter(columns, rowView);
      } else {
        _rowView = dataTable.getRowView();
      }

      validate();
    }

    function validate() {

      var sumIds = getTaskSumIds();
      var grouped = getGrouped();

      function createGroupRow(src : DataRow) : DataRow {
        var data : any = {};
        for (var i = 0; i < grouped.length; i += 1) {
          var id = grouped[i];
          data[id] = src.data[id];
        }
        data.sum = {};
        return { valid : false, data : data };
      }

      _groupedRowView = [];

      var minAct : string = null;
      var maxAct : string = null;
      var groupMap : { [groupKey : string] : DataRow } = {};

      var sumOp = addUpOp(strToNum, (a, b) => a + b);
      var minOp = addUpOp( (s) => s, (a, b) => a < b? a : b);
      var maxOp = addUpOp( (s) => s, (a, b) => a > b? a : b);

      // create group rows
      var id : string;
      for (var i = 0; i < _rowView.length; i += 1) {
        var src : DataRow = _rowView[i];
        var key = createGroupKey(src.data);
        var dst : DataRow = groupMap[key];
        if (!dst) {
          dst = createGroupRow(src);
          dst.data.id = NBSP;
          groupMap[key] = dst;
          _groupedRowView.push(dst);
        }
        for (var s = 0; s < sumIds.length; s += 1) {
          sumOp(src.data, dst.data.sum, sumIds[s]);
        }
        for (id in src.data) {
          var actDate = id.substring(3);
          if (isActDate(id) && dataTable.tableModel.filter(
              <any>{ data : { minAct : actDate, maxAct : actDate } }) ) {
            sumOp(src.data, dst.data.sum, id);
            if (minAct == null || minAct > id) {
              minAct = id;
            }
            if (maxAct == null || maxAct < id) {
              maxAct = id;
            }
          }
        }
        minOp(src.data, dst.data.sum, 'minAct');
        maxOp(src.data, dst.data.sum, 'maxAct');
      }

      // format
      for (var i = 0; i < _groupedRowView.length; i += 1) {
        var data = _groupedRowView[i].data;
        var sum : { [id : string] : any } = data.sum;
        for (id in sum) {
          if (id == 'minAct' || id == 'maxAct') {
            data[id] = sum[id];
          } else {
            data[id] = hourToStr(sum[id]);
          }
        }
        
        delete data.sum;
      }

      var baseDate : Date = null;
      var numWeeks : number;
      if (minAct != null) {
        _minDate = strToDate(minAct.substring(3) );
        _maxDate = strToDate(maxAct.substring(3) );
        baseDate = getMonday(_minDate);
        numWeeks = 1;
        var date = baseDate;
        while (date < getMonday(_maxDate) ) {
          numWeeks += 1;
          date = rollDate(date, 7);
        }
      } else {
        numWeeks = 0;
      }

      tableModel = createTaskManagerTableModel(messages, numWeeks * 7, null);
      /*tableModel.columns.push({
        id: 'addUpAct',
        label: messages.COL_LABEL_ADD_UP
      });*/
      tableModel.userData.baseDate = baseDate;
      if (_$head.data('numWeeks') != numWeeks) {
        createHeader(_$head, tableModel, setupHeaderCell, columnResizeManager);
        _$head.data('numWeeks', numWeeks);
      }
      setupLabels(_$head, tableModel.userData);

      validateCells(_$body, _groupedRowView);

      var footRow = tableModel.getFootRow(_groupedRowView);

      interface AddUpData { data : any, hours : number, begin : number };

      var config = dataTable.tableModel.userData.taskAddUpConfig;
      var addUpWeek : AddUpData = {
        data : { footer : true, addUpSumIds : {},
          projectGroup : messages.ADD_UP_WEEK },
        hours : 0, begin : +config.beginOfWeek };
      var addUpMonth : AddUpData = {
        data : { footer : true, addUpSumIds : {},
          projectGroup : messages.ADD_UP_MONTH },
        hours : 0, begin : +config.beginOfMonth };

      for (var i = 0; i < tableModel.userData.numDays; i += 1) {

        var date = rollDate(tableModel.userData.baseDate, i);

        if (_minDate <= date && date <= _maxDate) {

          if (date.getDay() == addUpWeek.begin) {
            addUpWeek.hours = 0;
          }
          if (date.getDate() == addUpMonth.begin) {
            addUpMonth.hours = 0;
          }

          var nextDate = rollDate(date, 1);
          if (nextDate.getDay() == addUpWeek.begin) {
            addUpWeek.data.addUpSumIds['d' + i] = true;
          }
          if (nextDate.getDate() == addUpMonth.begin) {
            addUpMonth.data.addUpSumIds['d' + i] = true;
          }

          var id = 'act' + formatDate(date);
          var hours = strToNum(footRow[id]);
          addUpWeek.hours += hours;
          addUpMonth.hours += hours;

          if (hours != 0 || addUpWeek.data.addUpSumIds['d' + i]) {
            addUpWeek.data[id] = hourToStr(addUpWeek.hours);
          }
          if (hours != 0 || addUpMonth.data.addUpSumIds['d' + i]) {
            addUpMonth.data[id] = hourToStr(addUpMonth.hours);
          }
        }
      }

      validateCells(_$foot, [
        { valid : false, data : footRow },
        { valid : false, data : addUpWeek.data },
        { valid : false, data : addUpMonth.data }
      ]);

      updateCursor();

/*
      $body.children().remove();
      for (var i = 0; i < _groupedRowView.length; i += 1) {
        $body.append(createRowUI(_groupedRowView[i]) );
      }

      $foot.children().remove();
      $foot.append(createRowUI({valid : false,
        data : tableModel.getFootRow(_groupedRowView)}) );
    */
    }

    interface CachedCells {
      numColumns : number,
      rows : JQuery[][]
    }

    function createCachedCells() : CachedCells {
      return { numColumns : tableModel.columns.length, rows : [] };
    }

    function createCellStyles() {
      var styles : CellStyles = {};
      for (var i = 0; i < tableModel.columns.length; i += 1) {
        styles[tableModel.columns[i].id] = {
          color: '', bgColor: '', readonly: false, title : ''
        };
      }
      return styles;
    }

    function updateCell(
      dataRow : DataRow,
      styles : CellStyles,
      column : DataColumn,
      $cell : JQuery
    ) {
      var dataId = tableModel.getDataId(column.id);
      var value = dataRow.data[dataId];
      var style = styles[column.id];
      var ctrl = $cell.data('controller');
      if (column.formatter) {
        value = column.formatter(value, dataRow.data);
      }

      ctrl.setEventEnabled(false);
      ctrl.setValue(value);
      ctrl.setTitle(value);
      ctrl.setReadonly(true);
      ctrl.setEventEnabled(true);

      ctrl.setCss('color', style.color);
      ctrl.setCss('background-color', style.bgColor);
      if (column.minWidth) {
        ctrl.setCss('min-width', column.minWidth + 'px');
      }
      if (column.resizable) {
        var css = columnResizeManager.getCss(column.id);
        for (var k in css) {
          ctrl.setCss(k, css[k]);
        }
      }
    }

    function createRowsHTML(rows : DataRow[]) {
      var html = '';
      for (var r = 0; r < rows.length; r += 1) {
        var dataRow = rows[r];
        var styles : CellStyles = createCellStyles();
        tableModel.setDataRowStyle(dataRow, styles);
        html += '<tr>';
        for (var c = 0; c < tableModel.columns.length; c += 1) {
          var column : DataColumn = tableModel.columns[c];
          var style = styles[column.id];
          html += createCellHTML(createCellStyle(column) +
            (style.color? 'color:' + style.color + ';' : '') + 
            (style.bgColor? 'background-color:' + style.bgColor + ';' : '') );
        }
        html += '</tr>';
      }
      return html;
    }

    function createCellCache($target : JQuery, rows : DataRow[]) {

      $target.html(createRowsHTML(rows) );

      var cache = createCachedCells();
      var $rows = $target.children();
      for (var r = 0; r < rows.length; r += 1) {
        var $cells = $($rows[r]).children();
        var rowCache : JQuery[] = [];
        for (var c = 0; c < tableModel.columns.length; c += 1) {
          var $cell = $($cells[c]);
          setupCell($cell, applyDecoration);
          rowCache.push($cell);
        }
        cache.rows.push(rowCache);
      }

      return cache;
    }

    function validateCells($target : JQuery, rows : DataRow[]) {

      var cache : CachedCells = $target.data('cache');
      var validCache = !!(cache && cache.rows.length == rows.length &&
          cache.numColumns == tableModel.columns.length);

      if (!validCache) {
        cache = createCellCache($target, rows);
        $target.data('cache', cache);
      }

      for (var r = 0; r < rows.length; r += 1) {
        var dataRow = rows[r];
        var styles : CellStyles = createCellStyles();
        tableModel.setDataRowStyle(dataRow, styles);
        var rowCache = cache.rows[r];
        for (var c = 0; c < tableModel.columns.length; c += 1) {
          var column : DataColumn = tableModel.columns[c];
          updateCell(dataRow, styles, column, rowCache[c]);
        }
      }
    }

    var $chk = createCheckboxUI(messages.DIVIDE_ACT_TO_TERM, applyDecoration).
      css('cursor', 'default').
      css('display', 'inline-block').on('mousedown', function(event) {
        event.preventDefault();
        _divideActToTerm = !_divideActToTerm;
        $chk.data('controller').setChecked(_divideActToTerm);
        updateRowView();
      });
    $chk.data('controller').setChecked(_divideActToTerm);

    return {
      $ui : $('<div></div>').css('position', 'relative').
        append($chk).append(_$table),
      updateRowView : updateRowView
    }
  }
}
