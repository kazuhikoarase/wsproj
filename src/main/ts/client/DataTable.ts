'use strict';
namespace wsproj.client {

  export function createDataTable<T>(
    tableModel : DataTableModel<T>,
    messages : any,
    applyDecoration : ($target : JQuery) => void
  ) : DataTable<T> {

    var tm = createTimer();

    var numPageRows = tableModel.numPageRows;

    var selectedRowIndex = -1;
    var selectedColIndex = -1;

    var rowOffset = 0;

    var rowMap : { [rid : string] : DataRow } = {};
    var rowList : DataRow[] = [];
    var rowView : DataRow[] = [];

    var tmpNewRow : DataRow = null;
    var tmpNewRowIndex = -1;

    var userOp = false;

    function beginNewRow(newRow : any, index : number) {
      newRow.id = 0;
      tmpNewRow = { valid: false, data: newRow };
      tmpNewRowIndex = index;
      selectedRowIndex = index;
      invalidate();
    }

    function cancelNewRow() {
      if (tmpNewRowIndex != -1) {
        tmpNewRow = null;
        tmpNewRowIndex = -1;
        invalidate();
      }
    }

    function putRow(row : any, created : boolean) : void {
      if (row.deleted) {
        delete rowMap[row.id];
        rowList = deleteById(rowList, row.id);
        rowView = deleteById(rowView, row.id);
      } else {
        var dataRow : DataRow = rowMap[row.id];
        if (!dataRow) {
          dataRow = { data: null, valid: false };
          rowMap[row.id] = dataRow;
          if (created) {
            if (tmpNewRowIndex != -1) {
              var orgIndex = getIndexByIndex(rowView,
                tmpNewRowIndex + rowOffset, rowList);
              if (orgIndex != -1) {
                rowList = insertByIndex(rowList, dataRow, orgIndex)
              } else {
                rowList.push(dataRow);
              }
              rowView = insertByIndex(rowView,
                dataRow, tmpNewRowIndex + rowOffset);
            } else {
              rowList.push(dataRow);
              rowView.push(dataRow);
            }
          } else {
            rowList.push(dataRow);
            rowView.push(dataRow);
          }
        }
        dataRow.valid = false;
        dataRow.data = row;
      }
      if (created) {
        // new row
        tmpNewRow = null;
        tmpNewRowIndex = -1;
        //selectedRowId = row.id;
      }
      if (selectedRowIndex != -1) {
        selectedRowIndex = rowView.length > 0?
          Math.max(0, Math.min(selectedRowIndex,
            rowView.length - 1) ) : -1;
      }
    }

    function createRowFilter(columns : DataColumn[]) {
      var filters : { [id : string] : DataColumnFilter } = {};
      $.each(columns, function(i : number, column : DataColumn) {
        if (column.filter) {
          filters[column.id] = column.filter;
        }
      });
      return function(dataRow : DataRow) {
        for (var id in filters) {
          var val = dataRow.data[id];
          var accepted = false;
          var filter = filters[id];
          if (filter.accepts) {
            for (var accVal in filter.accepts) {
              if (accVal == '' && typeof val == 'undefined') {
                accepted = true;
                break;
              } else if (val == accVal) {
                accepted = true;
                break;
              }
            }
          } else {
            accepted = true;
          }
          if (accepted && filter.keyword) {
            accepted = contains(val || '', filter.keyword);
          }
          if (!accepted) {
            return false;
          }
        }
        return true;
      }
    }

    function createRowComparator(column : DataColumn) {
      function compareData(column : DataColumn,
          data1 : any, data2 : any) : number {
        var s1 = data1[column.id];
        var s2 = data2[column.id];
        var t1 = typeof s1;
        var t2 = typeof s2;
        if (t1 == 'undefined' && t2 == 'undefined') {
          return 0;
        } else if (t1 != 'undefined' && t2 == 'undefined') {
          return -1;
        } else if (t1 == 'undefined' && t2 != 'undefined') {
          return 1;
        } else {
          if (column.dataType == 'number') {
            return strToNum(s1) - strToNum(s2);
          } else {
            return s1 == s2? 0 : s1 < s2? -1 : 1;
          }
        }
      }
      var ord = tableModel.sortOrder == SortOrder.DESC? -1 : 1;
      var columns = tableModel.columns;
      var defaultSortColumns : DataColumn[] = [];
      for (var i = 0; i < columns.length; i += 1) {
        var sortable = columns[i].sortable;
        if (typeof sortable != 'undefined' && !sortable) {
          continue;
        }
        defaultSortColumns.push(columns[i]);
      }
      return function(row1 : DataRow, row2 : DataRow) {
        var cp = 0;
        cp = compareData(column, row1.data, row2.data);
        if (cp != 0) {
          return ord * cp;
        }
        for (var i = 0; i < defaultSortColumns.length; i += 1) {
          cp = compareData(defaultSortColumns[i], row1.data, row2.data);
          if (cp != 0) {
            return cp;
          }
        }
        return cp;
      }
    }

    function sortRows(rows : DataRow[]) {
      for (var i = 0; i < tableModel.columns.length; i += 1) {
        var column : DataColumn = tableModel.columns[i];
        if (column.id == tableModel.sortId) {
          rows.sort(createRowComparator(column) );
          return;
        }
      }
    }

    function filterRows(columns : DataColumn[], rows : DataRow[]) {
      var filter = createRowFilter(columns);
      var filteredRows : DataRow[] = [];
      for (var i = 0; i < rows.length; i += 1) {
        if (filter(rows[i]) ) {
          filteredRows.push(rows[i]);
        }
      }
      return filteredRows;
    }

    function applyFilter() {

      cancelNewRow();
      rowOffset = 0;
      selectedColIndex = -1;
      selectedRowIndex = -1;
      invalidate();

      sortRows(rowList);
      rowView = filterRows(tableModel.columns, rowList);

      $table.trigger('rowViewChange');
    }

    function getRowView() : DataRow[] {
      var rows : DataRow[] = [];
      for (var i = 0; i <= rowView.length; i += 1) {
        if (tmpNewRowIndex != -1 && tmpNewRowIndex + rowOffset == i) {
          rows.push(tmpNewRow);
        }
        if (i < rowView.length) {
          rows.push(rowView[i]);
        }
      }
      return rows;
    }

    function createRowUI() {
      var $row = $('<tr></tr>');
      $.each(tableModel.columns, function(i : number, column : DataColumn) {
        $row.append(createCell(column, applyDecoration).
          on('valueChange', function(event, data) {
            var dataRow : DataRow = $row.data('dataRow');
            if (!dataRow) {
              return;
            }
            var value = data.value;
            if (value.length > 0) {
              dataRow.data[tableModel.getDataId(column.id)] = value;
            } else {
              delete dataRow.data[tableModel.getDataId(column.id)];
            }
            $(this).addClass('wsproj-dirty');
            $table.trigger('rowChange', dataRow.data);
          }) );
      });
      return $row;
    }

    function validateRowUI(
      $row : JQuery,
      setDataRowStyle : (dataRow : DataRow, styles : CellStyles) => void
    ) {

      var dataRow : DataRow = $row.data('dataRow');

      // styles
      var styles : {[id:string]:CellStyle} = {};
      for (var i = 0; i < tableModel.columns.length; i += 1) {
        var column : DataColumn = tableModel.columns[i];
        styles[column.id] = {
          color : '', bgColor : '', readonly : false, title : ''
        };
      }

      if (dataRow) {
        setDataRowStyle(dataRow, styles);
      }

      var $cells : JQuery[] = $row.data('$cells');
      if (!$cells) {
        $cells = [];
        $row.children().each(function() {
          $cells.push($(this));
        });
        $row.data('$cells', $cells);
      }

      for (var i = 0; i < tableModel.columns.length; i += 1) {
        var column : DataColumn = tableModel.columns[i];

        var $cell = $cells[i];
        var ctrl = $cell.data('controller');

        if (dataRow) {
          var dataId = tableModel.getDataId(column.id);
          var value = dataRow.data[dataId];
          var comment = dataRow.data[dataId + CMT_SUFFIX];
          if (column.formatter) {
            value = column.formatter(value, dataRow.data);
          }
          ctrl.setValue(value);
          ctrl.setTitle(styles[column.id].title || value);
          ctrl.setComment(comment);
          ctrl.setReadonly(styles[column.id].readonly);
        } else {
          ctrl.setValue('');
          ctrl.setTitle('');
          ctrl.setComment('');
          ctrl.setReadonly(true);
          styles[column.id].bgColor = styleConsts.emptyBgColor;
        }

        ctrl.setCss('color', styles[column.id].color);
        ctrl.setCss('background-color', styles[column.id].bgColor);

        if (dataRow) {
          if (dataRow.data.id != 0) {
            $cell.removeClass('wsproj-dirty');
          }
        } else {
          $cell.removeClass('wsproj-dirty');
        }
      }
    }

    function getRowListForFilter(columnId : string) {
      var columns : DataColumn[] = [];
      for (var i = 0; i < tableModel.columns.length; i += 1) {
        var column = tableModel.columns[i];
        if (columnId != column.id) {
          columns.push(column);
        }
      }
      return filterRows(columns, rowList);
    }

    function createDefaultDropdownModel(
      column : DataColumn,
      filtered : boolean
    ) : DropdownModel {
      var rows = filtered? getRowView() : getRowListForFilter(column.id);
      var val : string;
      var valMap : { [val : string] : boolean} = {};
      var emptyItem = false;
      for (var i = 0; i < rows.length; i += 1) {
        var vals = tableModel.getDataValues(column.id, rows[i]);
        for (var v = 0; v < vals.length; v += 1) {
          val = vals[v];
          if (val.length > 0) {
            valMap[val] = true;
          } else {
            emptyItem = true;
          }
        }
      }
      var items : any[] = [];
      if (column.dataType == 'number') {
        for (val in valMap) {
          items.push({label : val, value : val, sortKey: strToNum(val) });
        }
      } else {
        for (val in valMap) {
          items.push({label : val, value : val, sortKey: val});
        }
      }
      items.sort(function(v1 : any, v2 : any) {
        return v1.sortKey < v2.sortKey? -1 : 1;
      });
      return {
        labelField : 'label',
        valueField : 'value',
        dataField : column.id,
        getItems : function(data : any) {
          return items;
        },
        emptyItem : emptyItem
      }
    }

    function createInputAssistUI(
      $target : JQuery,
      dropdownModel : DropdownModel
    ) {

      var _data = $target.closest('TR').data('dataRow').data;
      var _index = -1;
      var _items = dropdownModel.getItems(_data);

      var $dropdown = $('<div></div>').
        addClass('wsproj-dropdown').
        css('position', 'absolute').
        css('cursor', 'default').
        css('overflow-x', 'hidden').
        css('overflow-y', 'auto').
//        css('width', Math.max(100, $target.outerWidth() ) + 'px').
        css('max-height', '120px').
        on('mousedown', function(event) {
          event.preventDefault();
        });

      function setSelectedIndex(index : number, scrollIntoView = false) {
        _index = index;
        $dropdown.children().removeClass('wsproj-selected');
        if (_index != -1) {
          var e = $dropdown.children()[_index];
          $(e).addClass('wsproj-selected');
          if (scrollIntoView && e.scrollIntoView) {
            e.scrollIntoView();
          }
        }
      }

      function commitValue() {
        if (_index != -1) {
          var item : any = _items[_index];
          $target.val(item[dropdownModel.labelField]).select();
          _data[dropdownModel.dataField] =
            item[dropdownModel.valueField];
          if (dropdownModel.commitValue) {
            dropdownModel.commitValue(_data, item);
          }
        }
      }

      $.each(_items, function(i : number, item : any) {
        var label : string = item[dropdownModel.labelField];
        $dropdown.append($('<div></div>').
          attr('title', label).text(label || NBSP).
          addClass('wsproj-label').
          css('white-space', 'nowrap').
          css('padding', '0px 22px 0px 2px').
          on('mousedown', function(event) {
            event.preventDefault();
            setSelectedIndex($(this).index() );
            commitValue();
            dispose();
          }) );
      });

      function dispose() {
        if ($dropdown != null) {
          $('BODY').
            off('mousedown', mousedownHandler).
            off('keydown', keydownHandler);
          $dropdown.trigger('dispose');
          $dropdown.remove();
          $dropdown = null;
        }
      }

      function mousedownHandler(event : JQueryEventObject) {
        if ($(event.target).closest('.wsproj-dropdown').length == 0 &&
            $(event.target).closest('.wsproj-dropdown-button').length == 0) {
          dispose();
        }
      }

      function keydownHandler(event : JQueryEventObject) {
        if (event.keyCode == DOM_VK.RETURN) {
          event.preventDefault();
          commitValue();
          dispose();
        } else if (event.keyCode == DOM_VK.ESCAPE) {
          dispose();
        } else if (event.keyCode == DOM_VK.UP) {
          event.preventDefault();
          setSelectedIndex(Math.max(0, _index - 1), true);
        } else if (event.keyCode == DOM_VK.DOWN) {
          event.preventDefault();
          setSelectedIndex(Math.min(_items.length - 1,
            _index + 1), true);
        }
      }

      var off = $target.offset();
      $dropdown.css('left', off.left + 'px').
        css('top', (off.top + $target.outerHeight() ) + 'px');
      $('BODY').append($dropdown).
        on('mousedown', mousedownHandler).
        on('keydown', keydownHandler);

      var selected = false;
      var value = _data[dropdownModel.dataField];
      $.each(_items, function(i : number, item : any) {
        if (!selected && item[dropdownModel.valueField] == value) {
          setSelectedIndex(i, true);
          selected = true;
        }
      } );

      return $dropdown;
    }

    var $assist : JQuery = null;

    function doAssist($target : JQuery) {

      if ($assist != null) {
        return;
      }

      var $td = $target.parent();
      var $tr = $td.parent();
      var dataRow : DataRow = $tr.data('dataRow');
      if (!dataRow) {
        return;
      }

      var column : DataColumn = tableModel.columns[$td.index()];
      if (!column.textInputAssist) {
        return;
      }

      var dropdownModel = column.dropdownModel?
        column.dropdownModel : createDefaultDropdownModel(column, true);
      if (dropdownModel.getItems(dataRow.data).length == 0) {
        return;
      }

      $assist = createInputAssistUI($target, dropdownModel).
        on('dispose', function() {
          $assist = null;
        });
    }

    function table_keydownHandler(event : JQueryEventObject) {

      if (event.keyCode == DOM_VK.ESCAPE) {
        cancelNewRow();
        return;
      }

      var $target = $(event.target);
      if (!$target.hasClass('wsproj-editor') ) {
        return;
      }

      if (event.ctrlKey && event.keyCode == DOM_VK.SPACE) {
        event.preventDefault();
        doAssist($target);
        return;
      }

      if ($assist != null) {
        event.preventDefault();
        return;
      } else if (event.altKey || event.ctrlKey) {
        return;
      } else if (selectedRowIndex == -1) {
        return;
      }

      var $td = $target.parent();
      var $tr = $td.parent();
      var $rows = $tr.parent().children();
      var rows : DataRow[] = getRowView();
      var maxRowOffset = Math.max(0, rows.length - $rows.length);

      var newRowIndex = selectedRowIndex;
      var newColIndex = selectedColIndex;
      var newRowOffset = rowOffset;
      var validKey = false;

      if (event.keyCode == DOM_VK.RETURN) {
        validKey = true;
        if (event.shiftKey) {
          newRowIndex -= 1;
        } else {
          newRowIndex += 1;
        }
      } else if (event.keyCode == DOM_VK.TAB) {
        validKey = true;
        if (event.shiftKey) {
          newColIndex -= 1;
        } else {
          newColIndex += 1;
        }
      } else if (!event.shiftKey) {
        if (event.keyCode == DOM_VK.UP) {
          validKey = true;
          newRowIndex -= 1;
        } else if (event.keyCode == DOM_VK.DOWN) {
          validKey = true;
          newRowIndex += 1;
        } else if (event.keyCode == DOM_VK.LEFT) {
          validKey = true;
          newColIndex -= 1;
        } else if (event.keyCode == DOM_VK.RIGHT) {
          validKey = true;
          newColIndex += 1;
        } else if (event.keyCode == DOM_VK.PAGE_UP) {
          validKey = true;
          if (newRowIndex - numPageRows >= 0) {
            newRowIndex -= numPageRows;
            newRowOffset -= numPageRows;
            newRowOffset = Math.max(newRowOffset, 0);
          } else if (newRowOffset > 0) {
            newRowOffset = 0;
          }
          var pgUpRows = Math.min(numPageRows, newRowIndex);
        } else if (event.keyCode == DOM_VK.PAGE_DOWN) {
          validKey = true;
          if (newRowIndex + numPageRows < rows.length) {
            newRowIndex += numPageRows;
            newRowOffset += numPageRows;
            newRowOffset = Math.min(newRowOffset, maxRowOffset);
          } else if (newRowOffset < maxRowOffset) {
            newRowOffset = maxRowOffset;
          }
        }
      }

      if (validKey) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }

      if (newRowIndex != selectedRowIndex ||
          newColIndex != selectedColIndex ||
          newRowOffset != rowOffset) {

        //$td.data('controller').endEdit();
        editor.endEdit();
        userOp = true;

        var rowIndex = newRowIndex - newRowOffset;
        while (rowIndex < 0 && newRowOffset > 0) {
          rowIndex += 1;
          newRowOffset -= 1;
        }
        while (rowIndex >= $rows.length && newRowOffset < maxRowOffset) {
          rowIndex -= 1;
          newRowOffset += 1;
        }

        rowOffset = newRowOffset;
        selectedColIndex = Math.max(0, Math.min(newColIndex, tableModel.columns.length - 1) );
        selectedRowIndex = Math.max(0, Math.min(rowIndex + newRowOffset, rows.length - 1) );

        invalidate();
      }
    }

    function table_contextmenuHandler(event : JQueryEventObject) {

      if ($(event.target).closest('TBODY').length == 0) {
        return;
      }

      event.preventDefault();

      var $tr = $(event.target).closest('TR');
      var $td = $(event.target).closest('TD');
      var column = tableModel.columns[$td.index()];
      var dataRow : DataRow = $tr.data('dataRow');
      editor.beginEdit($td, false);
      if ($activeCell != null) {
        // 速やかに編集モードを解除
        editor.endEdit();
        $activeCell = null;
      }

      var menu : { label : string }[] = [];
      if (dataRow &&
          column.commentable && !$td.data('controller').isReadonly() ) {
        var currComment = function() {
          var id = tableModel.getDataId(column.id) + CMT_SUFFIX;
          return dataRow.data[id] || '';
        }();
        if (currComment) {
          menu.push({ label : messages.EDIT_COMMENT });
          menu.push({ label : messages.DEL_COMMENT });
        } else {
          menu.push({ label : messages.ADD_COMMENT });
        }
      }
      menu.push({ label : messages.ADD_ROW });
      if (dataRow) {
        menu.push({ label : messages.DUP_ROW });
        menu.push({ label : messages.DEL_ROW });
      }

      var $menu = createMenu(menu).
        css('left', event.pageX + 'px').
        css('top', event.pageY + 'px').
        on('menuItemSelected',
          function(event : JQueryEventObject, item : any) {
            if (item.label == messages.ADD_ROW) {
              beginNewRow({}, Math.max(0, $tr.index() ) );
            } else if (item.label == messages.DUP_ROW) {
              dupRow(dataRow);
            } else if (item.label == messages.DEL_ROW) {
              deleteRow(dataRow);
            } else if (item.label == messages.ADD_COMMENT) {
              editComment(dataRow, item.label);
            } else if (item.label == messages.EDIT_COMMENT) {
              editComment(dataRow, item.label);
            } else if (item.label == messages.DEL_COMMENT) {
              removeComment(dataRow);
            }
          });

      function dupRow(dataRow : DataRow) {
        var data : any = {};
        for (var i = 0; i < tableModel.dupColumns.length; i += 1) {
          var id = tableModel.dupColumns[i];
          data[id] = dataRow.data[id];
        }
        beginNewRow(data, Math.max(0, $tr.index() ) );
        $table.trigger('rowChange', data);
      }

      function deleteRow(dataRow : DataRow) {
        openDialog(messages.MSG_CONFIRM_DELETE,
            [messages.OK, messages.CANCEL]).on('dispose',
          function(event : JQueryEventObject, data : any) {
            if (data.detail != messages.OK) {
              return;
            }
            if (dataRow.data.id == 0) {
              cancelNewRow();
            } else {
              $table.trigger('rowDelete', dataRow.data);
            }
          } );
      }

      function editComment(dataRow : DataRow, label : string) {
        var id = tableModel.getDataId(column.id) + CMT_SUFFIX;
        var orgComment = dataRow.data[id] || '';
        var $textarea = $('<textarea></textarea>').
          addClass('wsproj-editor').css('overflow', 'hidden').
          css('width', '130px').css('height', '80px').
          css('background-color', styleConsts.commentBgColor).val(orgComment);
        var $dlg = openDialog($('<div></div>').
            append($('<span></span>').
              css('display', 'inline-block').
              css('border', '1px solid #cccccc').
              append($textarea) ), [], label).
            on('dispose', function(event : JQueryEventObject, data : any) {
              var comment = removeInvalidChars(trim($textarea.val() ) );
              if (comment.length > MAX_CELL_VALUE) {
                comment = comment.substring(0, MAX_CELL_VALUE);
              }
              if (orgComment != comment) {
                if (comment) {
                  dataRow.data[id] = comment;
                } else {
                  delete dataRow.data[id];
                }
                $table.trigger('rowChange', dataRow.data);
              }
            });
        $textarea.focus();
      }

      function removeComment(dataRow : DataRow) {
        var id = tableModel.getDataId(column.id) + CMT_SUFFIX;
        var orgComment = dataRow.data[id] || '';
        var comment = '';
        if (orgComment != comment) {
          if (comment) {
            dataRow.data[id] = comment;
          } else {
            delete dataRow.data[id];
          }
          $table.trigger('rowChange', dataRow.data);
        }
      }
    }

    var $head : JQuery = $('<thead></thead>');
    var $foot : JQuery = $('<tfoot></tfoot>');
    var $body : JQuery = $('<tbody></tbody>');

    var $activeCell : JQuery = null;

    var $table = $('<table></table>').addClass('wsproj-table').
      attr('cellspacing', '0').
      append($head).append($foot).append($body).
      on('keydown', table_keydownHandler).
      on('contextmenu', table_contextmenuHandler).
      on('columnWidthChange', function(event) {
        invalidate();
      }).
      /*on('mousedown', function(event) {
        if ($assist == null) {
          var $target = $(event.target).closest('.wsproj-editor');
          if ($target.length == 1) {
            callLater(function() {
              doAssist($target);
            });
          }
        }
      }).*/
      on('beginEdit', function(event) {
        var $td = $(event.target);
        if ($td.closest('TBODY').length == 0) {
          return;
        }
        var dataRow : DataRow = $td.parent().data('dataRow');
        selectedRowIndex = dataRow? ($td.parent().index() + rowOffset) : -1;
        selectedColIndex = $td.index();
        updateCursor($td);
        $activeCell = $td;
        //console.log('beginEdit:' + selectedRowIndex + ',' + selectedColIndex);
      }).
      on('endEdit', function(event) {
       // $editingCell = null;
      /*selectedRowIndex = -1;
        selectedColIndex = -1;
        updateCursor(null);*/
        //console.log('endEdit');
      });

    function updateCursor($cell : JQuery) {
      var dataRow : DataRow = $cell? $cell.parent().data('dataRow') : null;
      cursorManager.updateCursor($cell,
        tableModel.getCursorColor(dataRow) );
    }

    var editor = createTableEditor($table);
    var cursorManager = createCursorManager($table);

    $foot.append(createRowUI() );

    function createFilterUI($target : JQuery, column : DataColumn) {

      function createSortItem(label : string) {
        var $sel = createSelector().css('vertical-align', 'middle');
        return $('<div></div>').
          addClass('wsproj-label').
          css('white-space', 'nowrap').
          css('padding', '2px').
          append($sel).append($('<span></span>').
            css('margin', '0px 0px 0px 2px').
            css('vertical-align', 'middle').
            css('display', 'inline-block').
            css('white-space', 'nowrap').
            text(label) ).
          data('controller', $sel.data('controller') );
      }

      function setSort(order : string) {
        tableModel.sortId = !$(this).data('controller').
          isSelected()? column.id : null;
        tableModel.sortOrder = order;
        updateSortSel();
        $okBtn.trigger('click');
      }

      var $ascItem = createSortItem(messages.SORT_ASC).
        on('click', function(event) {
          setSort.call(this, SortOrder.ASC);
        } );
      var $descItem = createSortItem(messages.SORT_DESC).
        on('click', function(event) {
          setSort.call(this, SortOrder.DESC);
        } );

      var $sortPane = $('<div></div>').
        css('padding', '2px').append($ascItem).append($descItem);

      function updateSortSel() {
        $ascItem.data('controller').setSelected(
          tableModel.sortId == column.id &&
          tableModel.sortOrder == SortOrder.ASC);
        $descItem.data('controller').setSelected(
          tableModel.sortId == column.id &&
          tableModel.sortOrder == SortOrder.DESC);
      }
      updateSortSel();

      var $keywordField = $('<input type="text"/>').
          addClass('wsproj-editor').css('width', '100px').
          on('keydown', function(event) {
            if (event.keyCode == DOM_VK.RETURN) {
              $okBtn.trigger('click');
            }
          }).on('keyup', function(event) {
            updateItems();
          });
      if (column.filter.keyword) {
        $keywordField.val(column.filter.keyword);
      }

      var $keywordPane = $('<span></span>').
        css('display', 'inline-block').
        css('border', '1px solid #f0f0f0').
        css('margin', '2px 0px 2px 0px').
        append($keywordField);

      var $itemPane = $('<div></div>').
        addClass('wsproj-filter-item-pane').
        css('padding', '2px').
        css('overflow-x', 'hidden').
        css('overflow-y', 'auto').
//        css('width', Math.max(100, $target.outerWidth() ) + 'px').
        css('max-height', '200px');

      function createFilterItem(label : string) {
        return createCheckboxUI(label, applyDecoration).
          css('padding', '0px 22px 0px 2px');
      }

      function all_clickHandler(event : JQueryEventObject) {
        var ctrl = $(this).data('controller');
        ctrl.setChecked(!ctrl.isChecked() );
        ctrl.setColor();
        $itemPane.children().each(function(i) {
          if (i > 0) {
            $(this).data('controller').setChecked(ctrl.isChecked() );
          }
        });
      }

      function updateAllChk() {
        var $items = $itemPane.children();
        var chkCount = 0;
        var unchkCount = 0;
        $items.each(function(i) {
          if (i > 0) {
            if ($(this).data('controller').isChecked() ) {
              chkCount += 1;
            } else {
              unchkCount += 1;
            }
          }
        });
        var allCtrl = $all.data('controller');
        if (chkCount == $items.length - 1) {
          allCtrl.setChecked(true);
          allCtrl.setColor();
        } else if (unchkCount == $items.length - 1) {
          allCtrl.setChecked(false);
          allCtrl.setColor();
        } else {
          allCtrl.setChecked(true);
          allCtrl.setColor('#999999');
        }
      }

      function item_clickHandler(event : JQueryEventObject) {
        if ($(event.target).closest('A').length != 0) {
          return;
        }
        var ctrl = $(this).data('controller');
        ctrl.setChecked(!ctrl.isChecked() );
        updateAllChk();
      }

      var dropdownModel = createDefaultDropdownModel(column, false);

      var $all = createFilterItem(messages.SELECT_ALL).
        on('click', all_clickHandler);
      $itemPane.append($all);
      $.each(dropdownModel.getItems(null), function(i : number, item : any) {
        var label : string = item[dropdownModel.labelField];
        $itemPane.append(createFilterItem(label).
          data('filterValue', label).
          on('click', item_clickHandler) );
      });
      if (dropdownModel.emptyItem) {
        $itemPane.append(createFilterItem(messages.EMPTY_CELL).
          data('filterValue', '').
          on('click', item_clickHandler) );
      }

      $itemPane.children().each(function(i) {
        if (i > 0) {
          var $item = $(this);
          $item.data('controller').setChecked(
            !column.filter.accepts ||
            column.filter.accepts[$item.data('filterValue')]);
        }
      });
      updateAllChk();

      function updateItems() {
        $itemPane.children().each(function(i) {
          if (i > 0) {
            var $item = $(this);
            $item.css('display', '');
            var keyword = $keywordField.val();
            if (keyword && !contains($item.data('filterValue'), keyword) ) {
              $item.css('display', 'none');
            }
          }
        });
      }
      updateItems();

      var $okBtn = createButton(messages.OK).on('click', function(event) {

          var keyword = trim($keywordField.val() );
          column.filter.keyword = keyword.length > 0? keyword : null;

          var accepts : FilterItems = {};
          var rejected = false;
          $itemPane.children().each(function(i) {
            if (i > 0) {
              var $item = $(this);
              if ($item.data('controller').isChecked() ) {
                accepts[$item.data('filterValue')] = true;
              } else {
                rejected = true;
              }
            }
          });
          column.filter.accepts = rejected? accepts : null;

          applyFilter();
          updateFilterButton();
          dispose();
        });
      var $cancelBtn = createButton(messages.CANCEL).
            on('click', function(event) {
          dispose();
        });

      var $buttonPane = $('<div></div>').css('padding', '4px 0px 0px 0px').
        append($cancelBtn).append($okBtn);

      var $dropdown = $('<div></div>').
        addClass('wsproj-dropdown').
        css('padding', '4px').
        css('position', 'absolute').
        css('cursor', 'default').
        on('mousedown', function(event) {
//          event.preventDefault();
        }).append($sortPane).append($keywordPane).
        append($itemPane).append($buttonPane);

      function dispose() {
        if ($dropdown != null) {
          $('BODY').
            off('mousedown', mousedownHandler).
            off('keydown', keydownHandler);
          $dropdown.trigger('dispose');
          $dropdown.remove();
          $dropdown = null;
        }
      }

      function mousedownHandler(event : JQueryEventObject) {
        if ($(event.target).closest('.wsproj-dropdown').length == 0 &&
            $(event.target).closest('.wsproj-dropdown-button').length == 0) {
          dispose();
        }
      }

      function keydownHandler(event : JQueryEventObject) {
        if ($(event.target).closest('.wsproj-dropdown').length == 0 &&
            $(event.target).closest('.wsproj-dropdown-button').length == 0) {
          event.preventDefault();
          dispose();
        }
      }

      var off = $target.offset();
      $dropdown.css('left', off.left + 'px').
        css('top', (off.top + $target.outerHeight() ) + 'px');
      $('BODY').append($dropdown).
        on('mousedown', mousedownHandler).
        on('keydown', keydownHandler);

      return $dropdown;
    }

    function updateFilterButton() {
      $.each(tableModel.columns, function(i : number, column : DataColumn) {
        var ctrl = $head.find('#flt_' + column.id).data('controller');
        if (ctrl) {
          ctrl.setFiltered(column.filter.accepts != null ||
            column.filter.keyword != null);
          if (column.id == tableModel.sortId) {
            ctrl.setSortOrder(tableModel.sortOrder);
          } else {
            ctrl.setSortOrder(null);
          }
        }
      });
    }

    function setConfig(config : DataTableConfig) {
      tableModel.sortId = config.sortId;
      tableModel.sortOrder = config.sortOrder;
      $.each(tableModel.columns,
        function(i : number, column : DataColumn) {
          if (column.filter) {
            if (config.accepts) {
              var vals = config.accepts[column.id];
              if (vals) {
                var accepts : FilterItems = {};
                for (var v = 0; v < vals.length; v += 1) {
                  accepts[vals[v]] = true;
                }
                column.filter.accepts = accepts;
              } else {
                column.filter.accepts = null;
              }
            }
            if (config.keywords) {
              var keyword = config.keywords[column.id];
              if (keyword) {
                column.filter.keyword = keyword;
              } else {
                column.filter.keyword = null;
              }
            }
          }
      });
      applyFilter();
      updateFilterButton();
    }

    function getConfig() : DataTableConfig {
      var config : DataTableConfig = {
        sortId : tableModel.sortId,
        sortOrder : tableModel.sortOrder,
        accepts : {},
        keywords : {}
      };
      $.each(tableModel.columns,
        function(i : number, column : DataColumn) {
          if (column.filter) {
            if (column.filter.accepts) {
              var accepts : string[] = [];
              for (var val in column.filter.accepts) {
                accepts.push(val);
              }
              config.accepts[column.id] = accepts;
            }
            if (column.filter.keyword) {
              config.keywords[column.id] = column.filter.keyword;
            }
          }
      });
      return config;
    }

    var $filter : JQuery = null;

    function setupHeaderCell($th : JQuery, column : DataColumn) : void {
      var $filterButton : JQuery = null;
      if (column.labelOrientation == 'vertical') {
        $th.append(createVerticalLabel($('.wsproj'), column.label).
          css('margin-top', '6px') );
        if (column.filter) {
          $th.append($('<br/>') );
          $filterButton = createFilterButton().
            css('vertical-align', 'bottom');
          $th.append($filterButton);
        }
      } else {
        var $lh = $('<div></div>').
          css('white-space', 'nowrap').
          append($('<span></span>').
            css('display', 'inline-block').
            css('vertical-align', 'middle').
            text(column.label) );
        if (column.filter) {
          $filterButton = createFilterButton().
            css('vertical-align', 'middle');
          $lh.append($('<span></span>').css('display', 'inline-block').
            css('vertical-align', 'middle').
            css('width', '15px').css('height', '15px') );
          //filterButton);
          $th.css('position', 'relative');
          $filterButton.css('position', 'absolute').css('right', '2px').css('bottom', '0px');
          $th.append($filterButton);
        }
        $th.append($lh);
      }
      if (column.filter) {
        $filterButton.attr('id', 'flt_' + column.id).
            on('mousedown', function(event) {
          if ($filter != null) {
            $('BODY').trigger('mousedown');
            return;
          }
          if (event.which == 1) {
            event.preventDefault();
            $filter = createFilterUI($th, column).
            on('dispose', function() {
              $filter = null;
            });
          }
        });
      }
    }

    var columnResizeManager = createColumnResizeManager();
    createHeader($head, tableModel, setupHeaderCell, columnResizeManager);

    function setColumnWidthConfig(config : ColumnWidthConfig) {
      for (var id in config.widthMap) {
        var ctrl = $head.find('#header-' + id).data('controller');
        if (ctrl) {
          ctrl.setColumnWidth(config.widthMap[id]);
        }
      }
    }

    function getColumnWidthConfig() : ColumnWidthConfig {
      var config : ColumnWidthConfig = { widthMap : {} };
      for (var i = 0; i < tableModel.columns.length; i += 1) {
        var column = tableModel.columns[i];
        if (column.resizable) {
          var width = columnResizeManager.getColumnWidth(column.id);
          if (width) {
            config.widthMap[column.id] = width;
          }
        }
      }
      return config;
    }

    for (var i = 0; i < numPageRows; i += 1) {
      $body.append(createRowUI() );
    }

    function updateRow(row : any, lazy : boolean, created : boolean) {

      if (typeof row != 'object' || typeof row.id != 'number') {
        return;
      }

      putRow(row, created);

      invalidate();

      if (!lazy) {
        validate();
      }
    }

    var valid = false;
    var watchInterval = 100;

    function watchValid() {
      if (!valid) {
        validate();
      }
      window.setTimeout(watchValid, watchInterval);
    }

    window.setTimeout(watchValid, watchInterval);

    function invalidate() {
      valid = false;
    }

    function validate() {

      tm = createTimer();
      tm.start();

      var $currentCell : JQuery = null;
      var rows : DataRow[] = getRowView();
      var $rows = $body.children();
      $rows.each(function(i : number) {
        var $row = $(this);
        var rowIndex = rowOffset + i;
        var dataRow : DataRow = (0 <= rowIndex && rowIndex < rows.length)?
          rows[rowIndex] : null;
        $row.data('dataRow', dataRow);
        validateRowUI($row, tableModel.setDataRowStyle);
        if (dataRow && rowIndex == selectedRowIndex &&
            selectedColIndex != -1) {
          $currentCell = $($row.children()[selectedColIndex]);
        }
      });

      // update footer
      var $footRow = $foot.children().data('dataRow', {
        data : tableModel.getFootRow(rows),
        valid : false
      });
      validateRowUI($footRow, tableModel.setDataRowStyle);

      if ($activeCell != null && $currentCell != null) {
        editor.beginEdit($currentCell, userOp);
        userOp = false;
        //$currentCell.data('controller').beginEdit();
      }
      updateCursor($currentCell);

      tm.end();
      tm.log();

      // update scroll states
      var maxRowOffset = Math.max(0, rows.length - $rows.length);
      var ctrl = $scrollbar.data('controller');
      ctrl.setValues(rowOffset, 0, maxRowOffset, numPageRows);

      var $placeHolder = $main.parent().parent();
      var width = $placeHolder.parent().innerWidth();
      width -= ctrl.getBarWidth();
      $scrollPane.css('width', width + 'px');

      valid = true;
    }

    $(window).on('resize', function(event) {
      invalidate();
    });

    function createScrollbar() {

      var _barWidth = 16;
      var _barHeight = 16;
      var _sliderHeight = 0;
      var _sliderTop = 0;
      var _min = 0;
      var _max = 10;
      var _value = 1;
      var _bar = 10;
      var _page = 10;

      var dragPoint : { y : number} = null;

      function slider_mouseDownHandler(event : JQueryEventObject) {
        event.preventDefault();
        var off = $slider.offset();
        dragPoint = { y : event.pageY - _sliderTop };
        $(document).on('mousemove', slider_mouseMoveHandler);
        $(document).on('mouseup', slider_mouseUpHandler);
      }

      function slider_mouseMoveHandler(event : JQueryEventObject) {
        var y = event.pageY - dragPoint.y;
        _sliderTop = Math.max(0, Math.min(y, _barHeight - _sliderHeight - 1) );
        var value = ~~Math.max(_min, Math.min(
          y * (_max - _min + _bar) / _barHeight, _max) );
        $slider.css('margin-top', _sliderTop + 'px');
        if (_value != value) {
          _value = value;
          $scrollbar.trigger('valueChange', {value : _value});
        }
      }

      function slider_mouseUpHandler(event : JQueryEventObject) {
        $(document).off('mousemove', slider_mouseMoveHandler);
        $(document).off('mouseup', slider_mouseUpHandler);
      }

      var scroll = function(delta : number) {
        return function() {
          setValue(_value + delta);
        }
      }

      var _doScroll : () => void = null;

      var _doRepeat = function() {
        if (_doScroll) {
          _doScroll();
          window.setTimeout(_doRepeat, 100);
        }
      }

      function scrollbar_mouseDownHandler(event : JQueryEventObject) {
        if ($(event.target).hasClass('wsproj-scrollbar') ) {
          event.preventDefault();
          if (event.offsetY < _sliderTop) {
            _doScroll = scroll(-_page);
          } else if (event.offsetY > _sliderTop + _sliderHeight) {
            _doScroll = scroll(_page);
          } else {
            _doScroll = null;
          }
          if (_doScroll) {
            _doScroll();
            window.setTimeout(_doRepeat, 500);
          }
          $(document).on('mouseup', scrollbar_mouseUpHandler);
        }
      }

      function scrollbar_mouseUpHandler(event : JQueryEventObject) {
        _doScroll = null;
        $(document).off('mouseup', scrollbar_mouseUpHandler);
      }

      var $slider = $('<div></div>').addClass('wsproj-scrollbar-slider').
        on('mousedown', slider_mouseDownHandler);
      var $scrollbar = $('<div></div>').addClass('wsproj-scrollbar').
        css('float', 'left').append($slider).
        on('mousedown', scrollbar_mouseDownHandler);

      function getMinBar(size : number) {
        return ~~(size * (_max - _min) / (_barHeight - size) );
      }

      function updateScrollbar() {
        var top = $head.outerHeight();
        _barHeight = $body.outerHeight();

        $scrollbar.css('margin-top', top + 'px').
          css('width', _barWidth + 'px').
          css('height', _barHeight + 'px');
        if (_min < _max) {
          _bar = Math.max(getMinBar(16), _page);
          _sliderHeight = ~~(_barHeight * _bar / (_max - _min + _bar) );
          _sliderTop = ~~(_barHeight * _value / (_max - _min + _bar) );
          $slider.css('margin-top', _sliderTop + 'px').
            css('height', _sliderHeight + 'px');
          $slider.css('display', 'block');
        } else {
          $slider.css('display', 'none');
        }
      }

      var setValue = function(value : number) {
        var value = Math.max(_min, Math.min(value, _max) );
        if (_value != value) {
          setValues(value, _min, _max, _page);
          $scrollbar.trigger('valueChange', {value : _value});
        }
      }

      var getValue = function() {
        return _value;
      }

      function setValues(value : number,
          min : number, max : number, page : number) {

        var changed = _min != min ||
          _max != max ||
          _value != value ||
          _page != page;

        _min = min;
        _max = max;
        _value = value;
        _page = page;

        if (changed) {
          updateScrollbar();
        }
      }

      $scrollbar.data('controller', {
        getBarWidth : () => _barWidth,
        setValue : setValue,
        getValue : getValue,
        setValues : setValues
      });
      return $scrollbar;
    }

    var $scrollPane = $('<div></div>').
      css('float', 'left').
      css('overflow-x', 'auto').
      append($('<div></div>').css('position', 'relative').append($table) );

    var $scrollbar = createScrollbar().on('valueChange',
      function(event : JQueryEventObject, data : any) {
        rowOffset = data.value;
        invalidate();
      } );

    var setWheeled = function(delta : number) {
      editor.endEdit();
      var ctrl = $scrollbar.data('controller');
      ctrl.setValue(ctrl.getValue() + delta);
    };

    var $main = $('<div></div>').append($scrollPane).append($scrollbar).
      append($('<br/>').css('clear', 'both') ).
      on('mousedown', function(event) {
        var $target = $(event.target);
        if ($target.closest('TABLE').length == 0) {
          if ($activeCell != null) {
            //$activeCell.data('controller').endEdit();
            editor.endEdit();
            $activeCell = null;
          }
        }
      }).on('wheel', function(event : any) {
        if (event.originalEvent.deltaY < 0) {
          event.preventDefault();
          setWheeled(-1);
        } else if (event.originalEvent.deltaY > 0) {
          event.preventDefault();
          setWheeled(1);
        }
      });

    return {
      tableModel : tableModel,
      $ui : $main,
      $table : $table,
      invalidate : invalidate,
      validate : validate,
      updateRow : updateRow,
      getRowView : function() { return rowView; },
      applyFilter : function(columns : DataColumn[], rows : DataRow[]) {
        rows = filterRows(columns, rows);
        sortRows(rows);
        return rows;
      },
      setConfig : setConfig,
      getConfig : getConfig,
      setColumnWidthConfig : setColumnWidthConfig,
      getColumnWidthConfig : getColumnWidthConfig
    }
  }

  function deleteById(rows : DataRow[], id : string) {
    var newRows : DataRow[] = [];
    for (var i = 0; i < rows.length; i += 1) {
      var dataRow = rows[i];
      if (dataRow.data.id != id) {
        newRows.push(dataRow);
      }
    }
    return newRows;
  }

  function insertByIndex(rows : DataRow[],
      dataRow : DataRow, index : number) {
    var newRows : DataRow[] = [];
    for (var i = 0; i <= rows.length; i += 1) {
      if (i == index) {
        newRows.push(dataRow);
      }
      if (i < rows.length) {
        newRows.push(rows[i]);
      }
    }
    return newRows;
  }

  function getIndexByIndex(srcRows : DataRow[], index : number,
      dstRows : DataRow[]) {
    var srcRow : DataRow = srcRows[index];
    if (srcRow) {
      for (var i = 0; i < dstRows.length; i += 1) {
        if (dstRows[i].data.id == srcRow.data.id) {
          return i;
        }
      }
    }
    return -1;
  }
}
