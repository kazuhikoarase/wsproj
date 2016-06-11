'use strict';
var wsproj;
(function (wsproj) {
    var client;
    (function (client) {
        function createCell(column, applyDecoration) {
            return setupCell(createCellInternal(createCellStyle(column)), applyDecoration);
        }
        client.createCell = createCell;
        function setupCell($td, applyDecoration) {
            var _value = '';
            var _title = '';
            var _comment = '';
            var _readonly = false;
            var _eventEnabled = true;
            var _css = parseStyle($td.attr('style'));
            var _$commentSymbol = null;
            function setValue(value) {
                value = value || '';
                if (_value != value) {
                    _value = value;
                    _$label.text(_value || client.NBSP);
                    applyDecoration(_$label);
                    triggerCellStateChange();
                }
            }
            function getValue() {
                return _value;
            }
            function setTitle(title) {
                if (_title != title) {
                    _title = title;
                    _$label.attr('title', _title);
                }
            }
            function setComment(comment) {
                comment = comment || '';
                if (_comment != comment) {
                    _comment = comment;
                    showCommentSymbol(!!_comment);
                }
            }
            function showCommentSymbol(visible) {
                if (visible) {
                    if (_$commentSymbol == null) {
                        _$commentSymbol = createCommentSymbol();
                        _$td.append($('<div></div>').
                            css('float', 'right').
                            css('position', 'relative').
                            append(_$commentSymbol));
                    }
                    else {
                        _$commentSymbol.css('display', '');
                    }
                }
                else {
                    if (_$commentSymbol != null) {
                        _$commentSymbol.css('display', 'none');
                    }
                }
            }
            function getComment() {
                return _comment;
            }
            function setReadonly(readonly) {
                if (_readonly != readonly) {
                    _readonly = readonly;
                    triggerCellStateChange();
                }
            }
            function isReadonly() {
                return _readonly;
            }
            function getAlign() {
                return _css['text-align'];
            }
            function setCss(key, value) {
                value = value || '';
                _css[key] = _css[key] || '';
                if (_css[key] != value) {
                    _css[key] = value;
                    _$td.css(key, value);
                }
            }
            function setEventEnabled(eventEnabled) {
                _eventEnabled = eventEnabled;
            }
            function triggerCellStateChange() {
                if (_eventEnabled) {
                    _$td.trigger('cellStateChange');
                }
            }
            var _$td = $td.data('controller', {
                setValue: setValue,
                getValue: getValue,
                setTitle: setTitle,
                setEventEnabled: setEventEnabled,
                setComment: setComment,
                getComment: getComment,
                setReadonly: setReadonly,
                isReadonly: isReadonly,
                getAlign: getAlign,
                setCss: setCss
            });
            var _$label = $(_$td.children()[0]);
            return _$td;
        }
        client.setupCell = setupCell;
        function createCommentSymbol() {
            return client.setSVGSize(client.createSVGElement('svg'), 5, 5).
                css('position', 'absolute').css('right', -client.styleConsts.cellPadding + 'px').css('top', '0px').
                append(client.createSVGElement('path').
                attr('d', 'M 0 0 L 5 0 L 5 5 Z').
                attr('stroke', 'none').attr('fill', '#ff0000'));
        }
        var cellCache = {};
        function createCellInternal(style) {
            var $cellFactory = cellCache[style];
            if (!$cellFactory) {
                $cellFactory = $(createCellHTML(style));
                cellCache[style] = $cellFactory;
            }
            return $cellFactory.clone();
        }
        function createCellHTML(style) {
            return '<td style="' + style + '"><span class="wsproj-label">' +
                client.NBSP + '</span></td>';
        }
        client.createCellHTML = createCellHTML;
        function createCellStyle(column) {
            var align = column.dataType == 'number' ? 'right' : 'left';
            var style = '';
            style += 'padding-left:' + client.styleConsts.cellPadding + 'px;';
            style += 'padding-right:' + client.styleConsts.cellPadding + 'px;';
            style += 'text-align:' + align + ';';
            if (column.minWidth) {
                style += 'min-width:' + column.minWidth + 'px;';
            }
            return style;
        }
        client.createCellStyle = createCellStyle;
        function parseStyle(style) {
            var css = {};
            var kvs = style.split(/;/g);
            for (var i = 0; i < kvs.length; i += 1) {
                var kv = kvs[i].split(/[:\s]+/g);
                if (kv.length == 2 && kv[0] && kv[1]) {
                    css[kv[0]] = kv[1];
                }
            }
            return css;
        }
    })(client = wsproj.client || (wsproj.client = {}));
})(wsproj || (wsproj = {}));
'use strict';
var wsproj;
(function (wsproj) {
    var client;
    (function (client) {
        var getMouseCount = function () {
            function getTime() {
                return +new Date();
            }
            var lastTime = getTime();
            var mouseCount = 0;
            return function () {
                var time = getTime();
                if (time - lastTime > 500) {
                    mouseCount = 0;
                    lastTime = time;
                }
                mouseCount += 1;
                return mouseCount;
            };
        }();
        function createColumnCursor(height, gap) {
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
                append($base).append($line));
        }
        function createColumnResizeManager() {
            var widthMap = {};
            function getCss(id) {
                var width = widthMap[id];
                if (width) {
                    return { 'overflow': 'hidden', 'max-width': width + 'px' };
                }
                else {
                    return { 'overflow': '', 'max-width': '' };
                }
            }
            function setColumnWidth(id, width) {
                widthMap[id] = width;
            }
            function getColumnWidth(id) {
                return widthMap[id] || 0;
            }
            return {
                setColumnWidth: setColumnWidth,
                getColumnWidth: getColumnWidth,
                getCss: getCss
            };
        }
        client.createColumnResizeManager = createColumnResizeManager;
        function setColumnResizable(columnResizeManager, $th, colIndex, column) {
            function setColumnWidth(width) {
                columnResizeManager.setColumnWidth(column.id, width);
                var css = columnResizeManager.getCss(column.id);
                $th.css(css);
                var $table = $th.closest('TABLE');
                $table.children('TBODY').children().each(function () {
                    $($(this).children()[colIndex]).css(css);
                });
                $table.trigger('columnWidthChange');
            }
            var handleGap = 2;
            var cursorGap = 16;
            var minColumnWidth = 16;
            var $cursor = null;
            var columnWidth = 0;
            var dragPoint = null;
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
            function getOffset($cell) {
                var o1 = $cell.offset();
                var o2 = getTarget().offset();
                o1.left -= o2.left;
                o1.top -= o2.top;
                return o1;
            }
            function moveCursor(event) {
                var offset = getOffset($th).left - cursorGap +
                    (client.styleConsts.cellPadding * 2 + 1);
                columnWidth = Math.max(minColumnWidth, Math.min(event.pageX - dragPoint.x - offset, 500));
                $cursor.css('left', (columnWidth + offset) + 'px').
                    css('top', getOffset(getTable()).top + 'px');
                //$cursor.css('left', (event.pageX - dragPoint.x) + 'px');
            }
            function mouseDownHandler(event) {
                event.preventDefault();
                if (getMouseCount() == 2) {
                    // fake dblclick
                    $(this).trigger('dblclick');
                }
                $cursor = createColumnCursor(getTable().outerHeight(), cursorGap);
                getTarget().append($cursor);
                var off = getOffset($th);
                dragPoint = { x: event.pageX -
                        (off.left + $th.outerWidth() - cursorGap) };
                moveCursor(event);
                $(document).on('mousemove', mouseMoveHandler).
                    on('mouseup', mouseUpHandler);
            }
            function mouseMoveHandler(event) {
                moveCursor(event);
            }
            function mouseUpHandler(event) {
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
                    on('dblclick', function (event) {
                    setColumnWidth(0);
                });
            }
            var _top = 0;
            var _left = 0;
            var _height = 0;
            var $handle = null;
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
                var top = getOffset(getTable()).top;
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
            client.callLater(updateHandle);
            $th.on('mousedown', function (event) {
                event.preventDefault();
            }).data('controller', {
                setColumnWidth: setColumnWidth
            });
        }
        client.setColumnResizable = setColumnResizable;
    })(client = wsproj.client || (wsproj.client = {}));
})(wsproj || (wsproj = {}));
'use strict';
var wsproj;
(function (wsproj) {
    var client;
    (function (client) {
        client.NBSP = '\u00a0';
        client.CMT_SUFFIX = '$C';
        client.MAX_CELL_VALUE = 140;
        client.styleConsts = {
            errorColor: '#ff0000',
            holidayBgColor: '#ffeeee',
            addUpSumBgColor: '#ffcc66',
            todayBgColor: '#ddffdd',
            readonlyBgColor: '#f0f0f0',
            currentCellColor: '#0066ff',
            currentRowColor: '#0066ff',
            editingColor: '#ffdd99',
            emptyBgColor: '#cccccc',
            commentBgColor: '#ffffe0',
            cellPadding: 2,
            _: ''
        };
        client.DOM_VK = {
            TAB: 0x09,
            RETURN: 0x0d,
            ESCAPE: 0x1b,
            SPACE: 0x20,
            PAGE_UP: 0x21,
            PAGE_DOWN: 0x22,
            LEFT: 0x25,
            UP: 0x26,
            RIGHT: 0x27,
            DOWN: 0x28,
            F2: 0x71
        };
        client.SortOrder = {
            ASC: 'asc',
            DESC: 'desc'
        };
    })(client = wsproj.client || (wsproj.client = {}));
})(wsproj || (wsproj = {}));
'use strict';
var wsproj;
(function (wsproj) {
    var client;
    (function (client) {
        function createOpaBox(left, top, width, height) {
            return $('<div></div>').
                addClass('wsproj-current-cell').
                css('position', 'absolute').
                css('pointer-events', 'none').
                css('background-color', client.styleConsts.currentRowColor).
                css('opacity', 0.1).
                css('left', left + 'px').
                css('top', top + 'px').
                css('width', width + 'px').
                css('height', height + 'px');
        }
        function createCellBox(left, top, width, height) {
            return $('<div></div>').
                addClass('wsproj-current-cell').
                css('position', 'absolute').
                css('pointer-events', 'none').
                css('border-color', client.styleConsts.currentCellColor).
                css('border-style', 'solid').
                css('border-width', '2px').
                css('left', left + 'px').
                css('top', top + 'px').
                css('width', width + 'px').
                css('height', height + 'px');
        }
        function createCursorManager($table) {
            var $cursors = {};
            function updateCursor($cell) {
                var id;
                // remove all
                for (id in $cursors) {
                    $cursors[id].remove();
                }
                $cursors = {};
                if ($cell == null) {
                    return;
                }
                var $target = $table.parent();
                function getOffset($cell) {
                    var o1 = $cell.offset();
                    var o2 = $target.offset();
                    o1.left -= o2.left;
                    o1.top -= o2.top;
                    return o1;
                }
                var $tr = $cell.parent();
                var off = getOffset($tr);
                $cursors['row'] = createOpaBox(off.left, off.top, $tr.outerWidth(), $tr.outerHeight());
                var $rows = $tr.parent().children();
                var colIndex = $cell.index();
                var $upperCell = $($($rows[0]).children()[colIndex]);
                var $lowerCell = $($($rows[$rows.length - 1]).children()[colIndex]);
                var cellOff = getOffset($cell);
                var upperTop = getOffset($upperCell).top;
                var lowerTop = getOffset($lowerCell).top;
                var height;
                height = off.top - upperTop;
                if (height > 0) {
                    $cursors['upper'] = createOpaBox(cellOff.left, upperTop, $cell.outerWidth(), height);
                }
                var cellBottom = cellOff.top + $cell.outerHeight();
                height = lowerTop + $lowerCell.outerHeight() - cellBottom;
                if (height > 0) {
                    $cursors['lower'] = createOpaBox(cellOff.left, cellBottom, $cell.outerWidth(), height);
                }
                $cursors['cell'] = createCellBox(cellOff.left - 1, cellOff.top - 1, $cell.outerWidth() - 1, $cell.outerHeight() - 1);
                // append all
                for (id in $cursors) {
                    $target.append($cursors[id]);
                }
            }
            return {
                updateCursor: updateCursor
            };
        }
        client.createCursorManager = createCursorManager;
    })(client = wsproj.client || (wsproj.client = {}));
})(wsproj || (wsproj = {}));
'use strict';
var wsproj;
(function (wsproj) {
    var client;
    (function (client) {
        function createDataTable(tableModel, messages, applyDecoration) {
            var tm = client.createTimer();
            var numPageRows = tableModel.numPageRows;
            var selectedRowIndex = -1;
            var selectedColIndex = -1;
            var rowOffset = 0;
            var rowMap = {};
            var rowList = [];
            var rowView = [];
            var tmpNewRow = null;
            var tmpNewRowIndex = -1;
            var userOp = false;
            function beginNewRow(newRow, index) {
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
            function putRow(row, created) {
                if (row.deleted) {
                    delete rowMap[row.id];
                    rowList = deleteById(rowList, row.id);
                    rowView = deleteById(rowView, row.id);
                }
                else {
                    var dataRow = rowMap[row.id];
                    if (!dataRow) {
                        dataRow = { data: null, valid: false };
                        rowMap[row.id] = dataRow;
                        if (created) {
                            if (tmpNewRowIndex != -1) {
                                var orgIndex = getIndexByIndex(rowView, tmpNewRowIndex + rowOffset, rowList);
                                if (orgIndex != -1) {
                                    rowList = insertByIndex(rowList, dataRow, orgIndex);
                                }
                                else {
                                    rowList.push(dataRow);
                                }
                                rowView = insertByIndex(rowView, dataRow, tmpNewRowIndex + rowOffset);
                            }
                            else {
                                rowList.push(dataRow);
                                rowView.push(dataRow);
                            }
                        }
                        else {
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
                }
                if (selectedRowIndex != -1) {
                    selectedRowIndex = rowView.length > 0 ?
                        Math.max(0, Math.min(selectedRowIndex, rowView.length - 1)) : -1;
                }
            }
            function createRowFilter(columns) {
                var accepts = {};
                $.each(columns, function (i, column) {
                    if (column.filter) {
                        accepts[column.id] = column.filter.accepts;
                    }
                });
                return function (dataRow) {
                    for (var id in accepts) {
                        var val = dataRow.data[id];
                        var accepted = false;
                        if (accepts[id]) {
                            for (var accVal in accepts[id]) {
                                if (accVal == '' && typeof val == 'undefined') {
                                    accepted = true;
                                    break;
                                }
                                else if (val == accVal) {
                                    accepted = true;
                                    break;
                                }
                            }
                        }
                        else {
                            accepted = true;
                        }
                        if (!accepted) {
                            return false;
                        }
                    }
                    return true;
                };
            }
            function createRowComparator(column) {
                function compareData(column, data1, data2) {
                    var s1 = data1[column.id];
                    var s2 = data2[column.id];
                    var t1 = typeof s1;
                    var t2 = typeof s2;
                    if (t1 == 'undefined' && t2 == 'undefined') {
                        return 0;
                    }
                    else if (t1 != 'undefined' && t2 == 'undefined') {
                        return -1;
                    }
                    else if (t1 == 'undefined' && t2 != 'undefined') {
                        return 1;
                    }
                    else {
                        if (column.dataType == 'number') {
                            return client.strToNum(s1) - client.strToNum(s2);
                        }
                        else {
                            return s1 == s2 ? 0 : s1 < s2 ? -1 : 1;
                        }
                    }
                }
                var ord = tableModel.sortOrder == client.SortOrder.DESC ? -1 : 1;
                var columns = tableModel.columns;
                var defaultSortColumns = [];
                for (var i = 0; i < columns.length; i += 1) {
                    var sortable = columns[i].sortable;
                    if (typeof sortable != 'undefined' && !sortable) {
                        continue;
                    }
                    defaultSortColumns.push(columns[i]);
                }
                return function (row1, row2) {
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
                };
            }
            function sortRows(rows) {
                for (var i = 0; i < tableModel.columns.length; i += 1) {
                    var column = tableModel.columns[i];
                    if (column.id == tableModel.sortId) {
                        rows.sort(createRowComparator(column));
                        return;
                    }
                }
            }
            function filterRows(columns, rows) {
                var filter = createRowFilter(columns);
                var filteredRows = [];
                for (var i = 0; i < rows.length; i += 1) {
                    if (filter(rows[i])) {
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
            function getRowView() {
                var rows = [];
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
                $.each(tableModel.columns, function (i, column) {
                    $row.append(client.createCell(column, applyDecoration).
                        on('valueChange', function (event, data) {
                        var dataRow = $row.data('dataRow');
                        if (!dataRow) {
                            return;
                        }
                        var value = data.value;
                        if (value.length > 0) {
                            dataRow.data[tableModel.getDataId(column.id)] = value;
                        }
                        else {
                            delete dataRow.data[tableModel.getDataId(column.id)];
                        }
                        $(this).addClass('wsproj-dirty');
                        $table.trigger('rowChange', dataRow.data);
                    }));
                });
                return $row;
            }
            function validateRowUI($row, setDataRowStyle) {
                var dataRow = $row.data('dataRow');
                // styles
                var styles = {};
                for (var i = 0; i < tableModel.columns.length; i += 1) {
                    var column = tableModel.columns[i];
                    styles[column.id] = {
                        color: '', bgColor: '', readonly: false, title: ''
                    };
                }
                if (dataRow) {
                    setDataRowStyle(dataRow, styles);
                }
                var $cells = $row.data('$cells');
                if (!$cells) {
                    $cells = [];
                    $row.children().each(function () {
                        $cells.push($(this));
                    });
                    $row.data('$cells', $cells);
                }
                for (var i = 0; i < tableModel.columns.length; i += 1) {
                    var column = tableModel.columns[i];
                    var $cell = $cells[i];
                    var ctrl = $cell.data('controller');
                    if (dataRow) {
                        var dataId = tableModel.getDataId(column.id);
                        var value = dataRow.data[dataId];
                        var comment = dataRow.data[dataId + client.CMT_SUFFIX];
                        if (column.formatter) {
                            value = column.formatter(value, dataRow.data);
                        }
                        ctrl.setValue(value);
                        ctrl.setTitle(styles[column.id].title || value);
                        ctrl.setComment(comment);
                        ctrl.setReadonly(styles[column.id].readonly);
                    }
                    else {
                        ctrl.setValue('');
                        ctrl.setTitle('');
                        ctrl.setComment('');
                        ctrl.setReadonly(true);
                        styles[column.id].bgColor = client.styleConsts.emptyBgColor;
                    }
                    ctrl.setCss('color', styles[column.id].color);
                    ctrl.setCss('background-color', styles[column.id].bgColor);
                    if (dataRow) {
                        if (dataRow.data.id != 0) {
                            $cell.removeClass('wsproj-dirty');
                        }
                    }
                    else {
                        $cell.removeClass('wsproj-dirty');
                    }
                }
            }
            function createDefaultDropdownModel(column, filtered) {
                var rows = filtered ? getRowView() : rowList;
                var val;
                var valMap = {};
                var emptyItem = false;
                for (var i = 0; i < rows.length; i += 1) {
                    var vals = tableModel.getDataValues(column.id, rows[i]);
                    for (var v = 0; v < vals.length; v += 1) {
                        val = vals[v];
                        if (val.length > 0) {
                            valMap[val] = true;
                        }
                        else {
                            emptyItem = true;
                        }
                    }
                }
                var items = [];
                if (column.dataType == 'number') {
                    for (val in valMap) {
                        items.push({ label: val, value: val, sortKey: client.strToNum(val) });
                    }
                }
                else {
                    for (val in valMap) {
                        items.push({ label: val, value: val, sortKey: val });
                    }
                }
                items.sort(function (v1, v2) {
                    return v1.sortKey < v2.sortKey ? -1 : 1;
                });
                return {
                    labelField: 'label',
                    valueField: 'value',
                    dataField: column.id,
                    getItems: function (data) {
                        return items;
                    },
                    emptyItem: emptyItem
                };
            }
            function createInputAssistUI($target, dropdownModel) {
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
                    on('mousedown', function (event) {
                    event.preventDefault();
                });
                function setSelectedIndex(index, scrollIntoView) {
                    if (scrollIntoView === void 0) { scrollIntoView = false; }
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
                        var item = _items[_index];
                        $target.val(item[dropdownModel.labelField]).select();
                        _data[dropdownModel.dataField] =
                            item[dropdownModel.valueField];
                        if (dropdownModel.commitValue) {
                            dropdownModel.commitValue(_data, item);
                        }
                    }
                }
                $.each(_items, function (i, item) {
                    var label = item[dropdownModel.labelField];
                    $dropdown.append($('<div></div>').
                        attr('title', label).text(label || client.NBSP).
                        addClass('wsproj-label').
                        css('white-space', 'nowrap').
                        css('padding', '0px 22px 0px 2px').
                        on('mousedown', function (event) {
                        event.preventDefault();
                        setSelectedIndex($(this).index());
                        commitValue();
                        dispose();
                    }));
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
                function mousedownHandler(event) {
                    if ($(event.target).closest('.wsproj-dropdown').length == 0 &&
                        $(event.target).closest('.wsproj-dropdown-button').length == 0) {
                        dispose();
                    }
                }
                function keydownHandler(event) {
                    if (event.keyCode == client.DOM_VK.RETURN) {
                        event.preventDefault();
                        commitValue();
                        dispose();
                    }
                    else if (event.keyCode == client.DOM_VK.ESCAPE) {
                        dispose();
                    }
                    else if (event.keyCode == client.DOM_VK.UP) {
                        event.preventDefault();
                        setSelectedIndex(Math.max(0, _index - 1), true);
                    }
                    else if (event.keyCode == client.DOM_VK.DOWN) {
                        event.preventDefault();
                        setSelectedIndex(Math.min(_items.length - 1, _index + 1), true);
                    }
                }
                var off = $target.offset();
                $dropdown.css('left', off.left + 'px').
                    css('top', (off.top + $target.outerHeight()) + 'px');
                $('BODY').append($dropdown).
                    on('mousedown', mousedownHandler).
                    on('keydown', keydownHandler);
                var selected = false;
                var value = _data[dropdownModel.dataField];
                $.each(_items, function (i, item) {
                    if (!selected && item[dropdownModel.valueField] == value) {
                        setSelectedIndex(i, true);
                        selected = true;
                    }
                });
                return $dropdown;
            }
            var $assist = null;
            function doAssist($target) {
                if ($assist != null) {
                    return;
                }
                var $td = $target.parent();
                var $tr = $td.parent();
                var dataRow = $tr.data('dataRow');
                if (!dataRow) {
                    return;
                }
                var column = tableModel.columns[$td.index()];
                if (!column.textInputAssist) {
                    return;
                }
                var dropdownModel = column.dropdownModel ?
                    column.dropdownModel : createDefaultDropdownModel(column, true);
                if (dropdownModel.getItems(dataRow.data).length == 0) {
                    return;
                }
                $assist = createInputAssistUI($target, dropdownModel).
                    on('dispose', function () {
                    $assist = null;
                });
            }
            function table_keydownHandler(event) {
                if (event.keyCode == client.DOM_VK.ESCAPE) {
                    cancelNewRow();
                    return;
                }
                var $target = $(event.target);
                if (!$target.hasClass('wsproj-editor')) {
                    return;
                }
                if (event.ctrlKey && event.keyCode == client.DOM_VK.SPACE) {
                    event.preventDefault();
                    doAssist($target);
                    return;
                }
                if ($assist != null) {
                    event.preventDefault();
                    return;
                }
                else if (event.altKey || event.ctrlKey) {
                    return;
                }
                else if (selectedRowIndex == -1) {
                    return;
                }
                var $td = $target.parent();
                var $tr = $td.parent();
                var $rows = $tr.parent().children();
                var rows = getRowView();
                var maxRowOffset = Math.max(0, rows.length - $rows.length);
                var newRowIndex = selectedRowIndex;
                var newColIndex = selectedColIndex;
                var newRowOffset = rowOffset;
                var validKey = false;
                if (event.keyCode == client.DOM_VK.RETURN) {
                    validKey = true;
                    if (event.shiftKey) {
                        newRowIndex -= 1;
                    }
                    else {
                        newRowIndex += 1;
                    }
                }
                else if (event.keyCode == client.DOM_VK.TAB) {
                    validKey = true;
                    if (event.shiftKey) {
                        newColIndex -= 1;
                    }
                    else {
                        newColIndex += 1;
                    }
                }
                else if (!event.shiftKey) {
                    if (event.keyCode == client.DOM_VK.UP) {
                        validKey = true;
                        newRowIndex -= 1;
                    }
                    else if (event.keyCode == client.DOM_VK.DOWN) {
                        validKey = true;
                        newRowIndex += 1;
                    }
                    else if (event.keyCode == client.DOM_VK.LEFT) {
                        validKey = true;
                        newColIndex -= 1;
                    }
                    else if (event.keyCode == client.DOM_VK.RIGHT) {
                        validKey = true;
                        newColIndex += 1;
                    }
                    else if (event.keyCode == client.DOM_VK.PAGE_UP) {
                        validKey = true;
                        if (newRowIndex - numPageRows >= 0) {
                            newRowIndex -= numPageRows;
                            newRowOffset -= numPageRows;
                            newRowOffset = Math.max(newRowOffset, 0);
                        }
                        else if (newRowOffset > 0) {
                            newRowOffset = 0;
                        }
                        var pgUpRows = Math.min(numPageRows, newRowIndex);
                    }
                    else if (event.keyCode == client.DOM_VK.PAGE_DOWN) {
                        validKey = true;
                        if (newRowIndex + numPageRows < rows.length) {
                            newRowIndex += numPageRows;
                            newRowOffset += numPageRows;
                            newRowOffset = Math.min(newRowOffset, maxRowOffset);
                        }
                        else if (newRowOffset < maxRowOffset) {
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
                    selectedColIndex = Math.max(0, Math.min(newColIndex, tableModel.columns.length - 1));
                    selectedRowIndex = Math.max(0, Math.min(rowIndex + newRowOffset, rows.length - 1));
                    invalidate();
                }
            }
            function table_contextmenuHandler(event) {
                if ($(event.target).closest('TBODY').length == 0) {
                    return;
                }
                event.preventDefault();
                var $tr = $(event.target).closest('TR');
                var $td = $(event.target).closest('TD');
                var column = tableModel.columns[$td.index()];
                var dataRow = $tr.data('dataRow');
                editor.beginEdit($td, false);
                var menu = [];
                if (dataRow &&
                    column.commentable && !$td.data('controller').isReadonly()) {
                    var currComment = function () {
                        var id = tableModel.getDataId(column.id) + client.CMT_SUFFIX;
                        return dataRow.data[id] || '';
                    }();
                    if (currComment) {
                        menu.push({ label: messages.EDIT_COMMENT });
                        menu.push({ label: messages.DEL_COMMENT });
                    }
                    else {
                        menu.push({ label: messages.ADD_COMMENT });
                    }
                }
                menu.push({ label: messages.ADD_ROW });
                if (dataRow) {
                    menu.push({ label: messages.DUP_ROW });
                    menu.push({ label: messages.DEL_ROW });
                }
                var $menu = client.createMenu(menu).
                    css('left', event.pageX + 'px').
                    css('top', event.pageY + 'px').
                    on('menuItemSelected', function (event, item) {
                    if (item.label == messages.ADD_ROW) {
                        beginNewRow({}, Math.max(0, $tr.index()));
                    }
                    else if (item.label == messages.DUP_ROW) {
                        dupRow(dataRow);
                    }
                    else if (item.label == messages.DEL_ROW) {
                        deleteRow(dataRow);
                    }
                    else if (item.label == messages.ADD_COMMENT) {
                        editComment(dataRow, item.label);
                    }
                    else if (item.label == messages.EDIT_COMMENT) {
                        editComment(dataRow, item.label);
                    }
                    else if (item.label == messages.DEL_COMMENT) {
                        removeComment(dataRow);
                    }
                });
                function dupRow(dataRow) {
                    var data = {};
                    for (var i = 0; i < tableModel.dupColumns.length; i += 1) {
                        var id = tableModel.dupColumns[i];
                        data[id] = dataRow.data[id];
                    }
                    beginNewRow(data, Math.max(0, $tr.index()));
                    $table.trigger('rowChange', data);
                }
                function deleteRow(dataRow) {
                    client.openDialog(messages.MSG_CONFIRM_DELETE, [messages.OK, messages.CANCEL]).on('dispose', function (event, data) {
                        if (data.detail != messages.OK) {
                            return;
                        }
                        if (dataRow.data.id == 0) {
                            cancelNewRow();
                        }
                        else {
                            $table.trigger('rowDelete', dataRow.data);
                        }
                    });
                }
                function editComment(dataRow, label) {
                    var id = tableModel.getDataId(column.id) + client.CMT_SUFFIX;
                    var orgComment = dataRow.data[id] || '';
                    var $textarea = $('<textarea></textarea>').
                        addClass('wsproj-editor').css('overflow', 'hidden').
                        css('width', '130px').css('height', '80px').
                        css('background-color', client.styleConsts.commentBgColor).val(orgComment);
                    var $dlg = client.openDialog($('<div></div>').
                        append($('<span></span>').
                        css('display', 'inline-block').
                        css('border', '1px solid #cccccc').
                        append($textarea)), [], label).
                        on('dispose', function (event, data) {
                        var comment = client.removeInvalidChars(client.trim($textarea.val()));
                        if (comment.length > client.MAX_CELL_VALUE) {
                            comment = comment.substring(0, client.MAX_CELL_VALUE);
                        }
                        if (orgComment != comment) {
                            if (comment) {
                                dataRow.data[id] = comment;
                            }
                            else {
                                delete dataRow.data[id];
                            }
                            $table.trigger('rowChange', dataRow.data);
                        }
                    });
                    $textarea.focus();
                }
                function removeComment(dataRow) {
                    var id = tableModel.getDataId(column.id) + client.CMT_SUFFIX;
                    var orgComment = dataRow.data[id] || '';
                    var comment = '';
                    if (orgComment != comment) {
                        if (comment) {
                            dataRow.data[id] = comment;
                        }
                        else {
                            delete dataRow.data[id];
                        }
                        $table.trigger('rowChange', dataRow.data);
                    }
                }
            }
            var $head = $('<thead></thead>');
            var $foot = $('<tfoot></tfoot>');
            var $body = $('<tbody></tbody>');
            var $activeCell = null;
            var $table = $('<table></table>').addClass('wsproj-table').
                append($head).append($foot).append($body).
                on('keydown', table_keydownHandler).
                on('contextmenu', table_contextmenuHandler).
                on('columnWidthChange', function (event) {
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
                on('beginEdit', function (event) {
                var $td = $(event.target);
                if ($td.closest('TBODY').length == 0) {
                    return;
                }
                var dataRow = $td.parent().data('dataRow');
                selectedRowIndex = dataRow ? ($td.parent().index() + rowOffset) : -1;
                selectedColIndex = $td.index();
                cursorManager.updateCursor($td);
                $activeCell = $td;
                //console.log('beginEdit:' + selectedRowIndex + ',' + selectedColIndex);
            }).
                on('endEdit', function (event) {
                // $editingCell = null;
                /*selectedRowIndex = -1;
                  selectedColIndex = -1;
                  updateCursor(null);*/
                //console.log('endEdit');
            });
            var editor = client.createTableEditor($table);
            var cursorManager = client.createCursorManager($table);
            $foot.append(createRowUI());
            function createFilterUI($target, column) {
                function createSortItem(label) {
                    var $sel = client.createSelector().css('vertical-align', 'middle');
                    return $('<div></div>').
                        addClass('wsproj-label').
                        css('white-space', 'nowrap').
                        css('padding', '2px').
                        append($sel).append($('<span></span>').
                        css('margin', '0px 0px 0px 2px').
                        css('vertical-align', 'middle').
                        css('display', 'inline-block').
                        css('white-space', 'nowrap').
                        text(label)).
                        data('controller', $sel.data('controller'));
                }
                function setSort(order) {
                    tableModel.sortId = !$(this).data('controller').
                        isSelected() ? column.id : null;
                    tableModel.sortOrder = order;
                    updateSortSel();
                    $okBtn.trigger('click');
                }
                var $ascItem = createSortItem(messages.SORT_ASC).
                    on('click', function (event) {
                    setSort.call(this, client.SortOrder.ASC);
                });
                var $descItem = createSortItem(messages.SORT_DESC).
                    on('click', function (event) {
                    setSort.call(this, client.SortOrder.DESC);
                });
                var $sortPane = $('<div></div>').
                    css('padding', '2px').append($ascItem).append($descItem);
                function updateSortSel() {
                    $ascItem.data('controller').setSelected(tableModel.sortId == column.id &&
                        tableModel.sortOrder == client.SortOrder.ASC);
                    $descItem.data('controller').setSelected(tableModel.sortId == column.id &&
                        tableModel.sortOrder == client.SortOrder.DESC);
                }
                updateSortSel();
                var $itemPane = $('<div></div>').
                    addClass('wsproj-filter-item-pane').
                    css('padding', '2px').
                    css('overflow-x', 'hidden').
                    css('overflow-y', 'auto').
                    //        css('width', Math.max(100, $target.outerWidth() ) + 'px').
                    css('max-height', '200px');
                function createFilterItem(label) {
                    return client.createCheckboxUI(label, applyDecoration).
                        css('padding', '0px 22px 0px 2px');
                }
                function all_clickHandler(event) {
                    var ctrl = $(this).data('controller');
                    ctrl.setChecked(!ctrl.isChecked());
                    ctrl.setColor();
                    $itemPane.children().each(function (i) {
                        if (i > 0) {
                            $(this).data('controller').setChecked(ctrl.isChecked());
                        }
                    });
                }
                function updateAllChk() {
                    var $items = $itemPane.children();
                    var chkCount = 0;
                    var unchkCount = 0;
                    $items.each(function (i) {
                        if (i > 0) {
                            if ($(this).data('controller').isChecked()) {
                                chkCount += 1;
                            }
                            else {
                                unchkCount += 1;
                            }
                        }
                    });
                    var allCtrl = $all.data('controller');
                    if (chkCount == $items.length - 1) {
                        allCtrl.setChecked(true);
                        allCtrl.setColor();
                    }
                    else if (unchkCount == $items.length - 1) {
                        allCtrl.setChecked(false);
                        allCtrl.setColor();
                    }
                    else {
                        allCtrl.setChecked(true);
                        allCtrl.setColor('#999999');
                    }
                }
                function item_clickHandler(event) {
                    if ($(event.target).closest('A').length != 0) {
                        return;
                    }
                    var ctrl = $(this).data('controller');
                    ctrl.setChecked(!ctrl.isChecked());
                    updateAllChk();
                }
                var dropdownModel = createDefaultDropdownModel(column, false);
                var $all = createFilterItem(messages.SELECT_ALL).
                    on('click', all_clickHandler);
                $itemPane.append($all);
                $.each(dropdownModel.getItems(null), function (i, item) {
                    var label = item[dropdownModel.labelField];
                    $itemPane.append(createFilterItem(label).
                        data('filterValue', label).
                        on('click', item_clickHandler));
                });
                if (dropdownModel.emptyItem) {
                    $itemPane.append(createFilterItem(messages.EMPTY_CELL).
                        data('filterValue', '').
                        on('click', item_clickHandler));
                }
                $itemPane.children().each(function (i) {
                    if (i > 0) {
                        var $item = $(this);
                        $item.data('controller').setChecked(!column.filter.accepts ||
                            column.filter.accepts[$item.data('filterValue')]);
                    }
                });
                updateAllChk();
                var $okBtn = client.createButton(messages.OK).on('click', function (event) {
                    var accepts = {};
                    var rejected = false;
                    $itemPane.children().each(function (i) {
                        if (i > 0) {
                            var $item = $(this);
                            if ($item.data('controller').isChecked()) {
                                accepts[$item.data('filterValue')] = true;
                            }
                            else {
                                rejected = true;
                            }
                        }
                    });
                    column.filter.accepts = rejected ? accepts : null;
                    applyFilter();
                    updateFilterButton();
                    dispose();
                });
                var $cancelBtn = client.createButton(messages.CANCEL).
                    on('click', function (event) {
                    dispose();
                });
                var $buttonPane = $('<div></div>').css('padding', '4px 0px 0px 0px').
                    append($cancelBtn).append($okBtn);
                var $dropdown = $('<div></div>').
                    addClass('wsproj-dropdown').
                    css('padding', '4px').
                    css('position', 'absolute').
                    css('cursor', 'default').
                    on('mousedown', function (event) {
                    event.preventDefault();
                }).append($sortPane).append($itemPane).append($buttonPane);
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
                function mousedownHandler(event) {
                    if ($(event.target).closest('.wsproj-dropdown').length == 0 &&
                        $(event.target).closest('.wsproj-dropdown-button').length == 0) {
                        dispose();
                    }
                }
                function keydownHandler(event) {
                    event.preventDefault();
                    dispose();
                }
                var off = $target.offset();
                $dropdown.css('left', off.left + 'px').
                    css('top', (off.top + $target.outerHeight()) + 'px');
                $('BODY').append($dropdown).
                    on('mousedown', mousedownHandler).
                    on('keydown', keydownHandler);
                return $dropdown;
            }
            function updateFilterButton() {
                $.each(tableModel.columns, function (i, column) {
                    var ctrl = $head.find('#flt_' + column.id).data('controller');
                    if (ctrl) {
                        ctrl.setFiltered(column.filter.accepts != null);
                        if (column.id == tableModel.sortId) {
                            ctrl.setSortOrder(tableModel.sortOrder);
                        }
                        else {
                            ctrl.setSortOrder(null);
                        }
                    }
                });
            }
            function setConfig(config) {
                tableModel.sortId = config.sortId;
                tableModel.sortOrder = config.sortOrder;
                $.each(tableModel.columns, function (i, column) {
                    if (column.filter && config.accepts) {
                        var vals = config.accepts[column.id];
                        if (vals) {
                            var accepts = {};
                            for (var v = 0; v < vals.length; v += 1) {
                                accepts[vals[v]] = true;
                            }
                            column.filter.accepts = accepts;
                        }
                        else {
                            column.filter.accepts = null;
                        }
                    }
                });
                applyFilter();
                updateFilterButton();
            }
            function getConfig() {
                var config = {
                    sortId: tableModel.sortId,
                    sortOrder: tableModel.sortOrder,
                    accepts: {}
                };
                $.each(tableModel.columns, function (i, column) {
                    if (column.filter && column.filter.accepts) {
                        var accepts = [];
                        for (var val in column.filter.accepts) {
                            accepts.push(val);
                        }
                        config.accepts[column.id] = accepts;
                    }
                });
                return config;
            }
            var $filter = null;
            function setupHeaderCell($th, column) {
                var $filterButton = null;
                if (column.labelOrientation == 'vertical') {
                    $th.append(client.createVerticalLabel($('.wsproj'), column.label).
                        css('margin-top', '6px'));
                    if (column.filter) {
                        $th.append($('<br/>'));
                        $filterButton = client.createFilterButton().
                            css('vertical-align', 'bottom');
                        $th.append($filterButton);
                    }
                }
                else {
                    var $lh = $('<div></div>').
                        css('white-space', 'nowrap').
                        append($('<span></span>').
                        css('display', 'inline-block').
                        css('vertical-align', 'middle').
                        text(column.label));
                    if (column.filter) {
                        $filterButton = client.createFilterButton().
                            css('vertical-align', 'middle');
                        $lh.append($filterButton);
                    }
                    $th.append($lh);
                }
                if (column.filter) {
                    $filterButton.attr('id', 'flt_' + column.id).
                        on('mousedown', function (event) {
                        if ($filter != null) {
                            $('BODY').trigger('mousedown');
                            return;
                        }
                        if (event.which == 1) {
                            event.preventDefault();
                            $filter = createFilterUI($th, column).
                                on('dispose', function () {
                                $filter = null;
                            });
                        }
                    });
                }
            }
            var columnResizeManager = client.createColumnResizeManager();
            client.createHeader($head, tableModel, setupHeaderCell, columnResizeManager);
            function setColumnWidthConfig(config) {
                for (var id in config.widthMap) {
                    var ctrl = $head.find('#header-' + id).data('controller');
                    if (ctrl) {
                        ctrl.setColumnWidth(config.widthMap[id]);
                    }
                }
            }
            function getColumnWidthConfig() {
                var config = { widthMap: {} };
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
                $body.append(createRowUI());
            }
            function updateRow(row, lazy, created) {
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
                tm = client.createTimer();
                tm.start();
                var $currentCell = null;
                var rows = getRowView();
                var $rows = $body.children();
                $rows.each(function (i) {
                    var $row = $(this);
                    var rowIndex = rowOffset + i;
                    var dataRow = (0 <= rowIndex && rowIndex < rows.length) ?
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
                    data: tableModel.getFootRow(rows),
                    valid: false
                });
                validateRowUI($footRow, tableModel.setDataRowStyle);
                if ($activeCell != null && $currentCell != null) {
                    editor.beginEdit($currentCell, userOp);
                    userOp = false;
                }
                cursorManager.updateCursor($currentCell);
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
            $(window).on('resize', function (event) {
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
                var dragPoint = null;
                function slider_mouseDownHandler(event) {
                    event.preventDefault();
                    var off = $slider.offset();
                    dragPoint = { y: event.pageY - _sliderTop };
                    $(document).on('mousemove', slider_mouseMoveHandler);
                    $(document).on('mouseup', slider_mouseUpHandler);
                }
                function slider_mouseMoveHandler(event) {
                    var y = event.pageY - dragPoint.y;
                    _sliderTop = Math.max(0, Math.min(y, _barHeight - _sliderHeight - 1));
                    var value = ~~Math.max(_min, Math.min(y * (_max - _min + _bar) / _barHeight, _max));
                    $slider.css('margin-top', _sliderTop + 'px');
                    if (_value != value) {
                        _value = value;
                        $scrollbar.trigger('valueChange', { value: _value });
                    }
                }
                function slider_mouseUpHandler(event) {
                    $(document).off('mousemove', slider_mouseMoveHandler);
                    $(document).off('mouseup', slider_mouseUpHandler);
                }
                var scroll = function (delta) {
                    return function () {
                        setValue(_value + delta);
                    };
                };
                var _doScroll = null;
                var _doRepeat = function () {
                    if (_doScroll) {
                        _doScroll();
                        window.setTimeout(_doRepeat, 100);
                    }
                };
                function scrollbar_mouseDownHandler(event) {
                    if ($(event.target).hasClass('wsproj-scrollbar')) {
                        event.preventDefault();
                        if (event.offsetY < _sliderTop) {
                            _doScroll = scroll(-_page);
                        }
                        else if (event.offsetY > _sliderTop + _sliderHeight) {
                            _doScroll = scroll(_page);
                        }
                        else {
                            _doScroll = null;
                        }
                        if (_doScroll) {
                            _doScroll();
                            window.setTimeout(_doRepeat, 500);
                        }
                        $(document).on('mouseup', scrollbar_mouseUpHandler);
                    }
                }
                function scrollbar_mouseUpHandler(event) {
                    _doScroll = null;
                    $(document).off('mouseup', scrollbar_mouseUpHandler);
                }
                var $slider = $('<div></div>').addClass('wsproj-scrollbar-slider').
                    on('mousedown', slider_mouseDownHandler);
                var $scrollbar = $('<div></div>').addClass('wsproj-scrollbar').
                    css('float', 'left').append($slider).
                    on('mousedown', scrollbar_mouseDownHandler);
                function getMinBar(size) {
                    return ~~(size * (_max - _min) / (_barHeight - size));
                }
                function updateScrollbar() {
                    var top = $head.outerHeight();
                    _barHeight = $body.outerHeight();
                    $scrollbar.css('margin-top', top + 'px').
                        css('width', _barWidth + 'px').
                        css('height', _barHeight + 'px');
                    if (_min < _max) {
                        _bar = Math.max(getMinBar(16), _page);
                        _sliderHeight = ~~(_barHeight * _bar / (_max - _min + _bar));
                        _sliderTop = ~~(_barHeight * _value / (_max - _min + _bar));
                        $slider.css('margin-top', _sliderTop + 'px').
                            css('height', _sliderHeight + 'px');
                        $slider.css('display', 'block');
                    }
                    else {
                        $slider.css('display', 'none');
                    }
                }
                var setValue = function (value) {
                    var value = Math.max(_min, Math.min(value, _max));
                    if (_value != value) {
                        setValues(value, _min, _max, _page);
                        $scrollbar.trigger('valueChange', { value: _value });
                    }
                };
                var getValue = function () {
                    return _value;
                };
                function setValues(value, min, max, page) {
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
                    getBarWidth: function () { return _barWidth; },
                    setValue: setValue,
                    getValue: getValue,
                    setValues: setValues
                });
                return $scrollbar;
            }
            var $scrollPane = $('<div></div>').
                css('float', 'left').
                css('overflow-x', 'auto').
                append($('<div></div>').css('position', 'relative').append($table));
            var $scrollbar = createScrollbar().on('valueChange', function (event, data) {
                rowOffset = data.value;
                invalidate();
            });
            var setWheeled = function (delta) {
                editor.endEdit();
                var ctrl = $scrollbar.data('controller');
                ctrl.setValue(ctrl.getValue() + delta);
            };
            var $main = $('<div></div>').append($scrollPane).append($scrollbar).
                append($('<br/>').css('clear', 'both')).
                on('mousedown', function (event) {
                var $target = $(event.target);
                if ($target.closest('TABLE').length == 0) {
                    if ($activeCell != null) {
                        //$activeCell.data('controller').endEdit();
                        editor.endEdit();
                        $activeCell = null;
                    }
                }
            }).on('wheel', function (event) {
                if (event.originalEvent.deltaY < 0) {
                    event.preventDefault();
                    setWheeled(-1);
                }
                else if (event.originalEvent.deltaY > 0) {
                    event.preventDefault();
                    setWheeled(1);
                }
            });
            return {
                tableModel: tableModel,
                $ui: $main,
                $table: $table,
                invalidate: invalidate,
                validate: validate,
                updateRow: updateRow,
                getRowView: function () { return rowView; },
                applyFilter: function (columns, rows) {
                    rows = filterRows(columns, rows);
                    sortRows(rows);
                    return rows;
                },
                setConfig: setConfig,
                getConfig: getConfig,
                setColumnWidthConfig: setColumnWidthConfig,
                getColumnWidthConfig: getColumnWidthConfig
            };
        }
        client.createDataTable = createDataTable;
        function deleteById(rows, id) {
            var newRows = [];
            for (var i = 0; i < rows.length; i += 1) {
                var dataRow = rows[i];
                if (dataRow.data.id != id) {
                    newRows.push(dataRow);
                }
            }
            return newRows;
        }
        function insertByIndex(rows, dataRow, index) {
            var newRows = [];
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
        function getIndexByIndex(srcRows, index, dstRows) {
            var srcRow = srcRows[index];
            if (srcRow) {
                for (var i = 0; i < dstRows.length; i += 1) {
                    if (dstRows[i].data.id == srcRow.data.id) {
                        return i;
                    }
                }
            }
            return -1;
        }
    })(client = wsproj.client || (wsproj.client = {}));
})(wsproj || (wsproj = {}));
'use strict';
var wsproj;
(function (wsproj) {
    var client;
    (function (client) {
        client.openDialog = function ($content, buttons, title) {
            if (title === void 0) { title = ''; }
            if (typeof $content == 'string') {
                $content = $('<div></div>').css('margin', '4px 0px 8px 0px').
                    text($content);
            }
            var $contentPane = $('<div></div>').append($content);
            if (buttons.length > 0) {
                var $buttonPane = $('<div></div>');
                var appendButton = function (label) {
                    $buttonPane.append(client.createButton(label).on('click', function (event) {
                        $win.data('controller').dispose(label);
                    }));
                };
                for (var i = 0; i < buttons.length; i += 1) {
                    appendButton(buttons[buttons.length - 1 - i]);
                }
                $contentPane.append($buttonPane);
            }
            function mouseDownHandler(event) {
                if ($(event.target).closest('.wsproj-window').length == 0) {
                    $win.data('controller').dispose('');
                }
            }
            var $win = client.openWindow($contentPane, title).on('dispose', function (event) {
                $(document).off('mousedown', mouseDownHandler);
            });
            client.callLater(function () {
                $(document).on('mousedown', mouseDownHandler);
            });
            return $win;
        };
    })(client = wsproj.client || (wsproj.client = {}));
})(wsproj || (wsproj = {}));
'use strict';
var wsproj;
(function (wsproj) {
    var client;
    (function (client) {
        function createHeader($head, tableModel, setupHeaderCell, columnResizeManager) {
            var cells = {};
            $head.data('cells', cells);
            function registerHeaderCell($th) {
                cells[$th.attr('id')] = $th;
            }
            function eachColumn(fn) {
                var columns = tableModel.columns;
                for (var i = 0; i < columns.length; i += 1) {
                    fn(i, columns[i]);
                }
            }
            var gr = [];
            var grouped = false;
            eachColumn(function (i, column) {
                gr.push(0);
            });
            eachColumn(function (i, column) {
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
                eachColumn(function (i, column) {
                    var $th = createHeaderCellInternal().attr('id', 'header-' + column.id);
                    registerHeaderCell($th);
                    setupHeaderCell($th, column);
                    if (column.resizable) {
                        client.setColumnResizable(columnResizeManager, $th, i, column);
                    }
                    $th.css(columnResizeManager.getCss(column.id));
                    $tr.append($th);
                });
                $head.append($tr);
            }
            else {
                var $tr1 = $('<tr></tr>');
                var $tr2 = $('<tr></tr>');
                eachColumn(function (i, column) {
                    var $th = createHeaderCellInternal().attr('id', 'header-' + column.id);
                    registerHeaderCell($th);
                    setupHeaderCell($th, column);
                    if (column.resizable) {
                        client.setColumnResizable(columnResizeManager, $th, i, column);
                    }
                    $th.css(columnResizeManager.getCss(column.id));
                    var rowspan = 2 - gr[i];
                    $th.attr('rowspan', rowspan);
                    if (rowspan == 2) {
                        $tr1.append($th);
                    }
                    else {
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
        client.createHeader = createHeader;
        var headerCellCache = null;
        function createHeaderCellInternal() {
            if (headerCellCache == null) {
                headerCellCache = $('<th></th>').
                    css('padding-left', client.styleConsts.cellPadding + 'px').
                    css('padding-right', client.styleConsts.cellPadding + 'px').
                    css('vertical-align', 'bottom');
            }
            return headerCellCache.clone();
        }
    })(client = wsproj.client || (wsproj.client = {}));
})(wsproj || (wsproj = {}));
'use strict';
var wsproj;
(function (wsproj) {
    var client;
    (function (client) {
        function createOnlineStatusUI() {
            var s = 12;
            var r = 5;
            var $ui = client.setSVGSize(client.createSVGElement('svg'), s, s);
            var $cir = client.createSVGElement('circle').attr({
                cx: s / 2, cy: s / 2, r: r, stroke: 'none' });
            $ui.append($cir);
            function setOnline(online) {
                $cir.attr('fill', online ? '#00ff00' : '#cccccc');
            }
            setOnline(false);
            return {
                $ui: $ui,
                setOnline: setOnline
            };
        }
        client.createOnlineStatusUI = createOnlineStatusUI;
    })(client = wsproj.client || (wsproj.client = {}));
})(wsproj || (wsproj = {}));
'use strict';
var wsproj;
(function (wsproj) {
    var client;
    (function (client) {
        var weekDays = 'SU,MO,TU,WE,TH,FR,SA'.split(',');
        function parseDate(date) {
            if (date.match(/^(\d{4})(\d{2})(\d{2})$/) ||
                date.match(/^(\d+)\D+(\d+)\D+(\d+)$/)) {
                return new Date(+RegExp.$1, +RegExp.$2 - 1, +RegExp.$3).getTime();
            }
            else {
                return null;
            }
        }
        var termFuncCache = {};
        function getTermFunc(term) {
            var fn = termFuncCache[term];
            if (!fn) {
                fn = getTermFuncImpl(term);
                termFuncCache[term] = fn;
            }
            return fn;
        }
        function getTermFuncImpl(term) {
            for (var i = 0; i < weekDays.length; i += 1) {
                if (term.indexOf(weekDays[i]) == 0) {
                    var day = i;
                    return function (date) { return date.getDay() == day; };
                }
            }
            var dateFrom;
            var dateTo;
            var index = term.indexOf('~');
            if (index == -1) {
                dateFrom = parseDate(term);
                if (dateFrom != null) {
                    return function (date) { return date.getTime() == dateFrom; };
                }
            }
            else if (index == 0) {
                dateTo = parseDate(term.substring(index + 1));
                if (dateTo != null) {
                    return function (date) { return date.getTime() <= dateTo; };
                }
            }
            else if (index == term.length - 1) {
                dateFrom = parseDate(term.substring(0, index));
                if (dateFrom != null) {
                    return function (date) { return dateFrom <= date.getTime(); };
                }
            }
            else {
                dateFrom = parseDate(term.substring(0, index));
                dateTo = parseDate(term.substring(index + 1));
                if (dateFrom != null && dateTo != null) {
                    return function (date) { return dateFrom <= date.getTime() &&
                        date.getTime() <= dateTo; };
                }
            }
            return null;
        }
        function parseResourceLine(line) {
            var index = line.indexOf('#');
            if (index != -1) {
                line = line.substring(0, index);
            }
            line = client.trim(line);
            if (line.length == 0) {
                return null;
            }
            var items = line.split(/\:/g);
            if (items.length != 3) {
                return null;
            }
            var terms = items[0].toUpperCase().split(/,/g);
            if (terms.length == 0) {
                return null;
            }
            var hours = +items[1];
            if (isNaN(hours)) {
                return null;
            }
            var users = items[2].split(/,/g);
            if (users.length == 0) {
                return null;
            }
            var termFuncs = [];
            for (var i = 0; i < terms.length; i += 1) {
                var fn = getTermFunc(terms[i]);
                if (fn) {
                    termFuncs.push(fn);
                }
            }
            var acceptAllUsers = false;
            for (var i = 0; i < users.length; i += 1) {
                if (users[i] == '*') {
                    acceptAllUsers = true;
                    break;
                }
            }
            var userFunc = acceptAllUsers ?
                function (user) { return true; } :
                function (user) {
                    for (var i = 0; i < users.length; i += 1) {
                        if (users[i] == user) {
                            return true;
                        }
                    }
                    return false;
                };
            return function (date, user) {
                var termMatch = false;
                for (var i = 0; i < termFuncs.length; i += 1) {
                    if (termFuncs[i](date)) {
                        termMatch = true;
                        break;
                    }
                }
                return termMatch && userFunc(user) ? hours : null;
            };
        }
        function parseResource(data) {
            var funcs = [];
            var lines = data.split(/\n/g);
            for (var i = 0; i < lines.length; i += 1) {
                var fn = parseResourceLine(lines[i]);
                if (fn) {
                    funcs.push(fn);
                }
            }
            return function (date, user) {
                for (var i = 0; i < funcs.length; i += 1) {
                    var hours = funcs[i](date, user);
                    if (hours != null) {
                        return hours;
                    }
                }
                return null;
            };
        }
        client.parseResource = parseResource;
    })(client = wsproj.client || (wsproj.client = {}));
})(wsproj || (wsproj = {}));
'use strict';
var wsproj;
(function (wsproj) {
    var client;
    (function (client) {
        function setVisible($ui, visible) {
            $ui.css('display', visible ? 'inline-block' : 'none');
        }
        function createTableEditor($table) {
            var _editing = false;
            var _enterField = false;
            var _$td = null;
            var _$textField = null;
            var _orgValue = '';
            var _readonly = false;
            var _$popup = null;
            function controller($td) {
                return $td.data('controller');
            }
            function showComment($cell, comment) {
                var $target = $table.parent();
                function getOffset($cell) {
                    var o1 = $cell.offset();
                    var o2 = $target.offset();
                    o1.left -= o2.left;
                    o1.top -= o2.top;
                    return o1;
                }
                var off = getOffset($cell);
                var toff = getOffset($table);
                function createPopup(left, top) {
                    var $label = $('<span></span>').
                        addClass('wsproj-popup-label').
                        css('position', 'absolute').
                        css('padding', '0px 2px 0px 2px').
                        css('display', 'inline-block').
                        css('white-space', 'nowrap').
                        css('background-color', client.styleConsts.commentBgColor).
                        css('border', '1px solid #000000');
                    client.parseLine(comment, function (line) {
                        if (line == '\u0020') {
                            $label.append('&#160;');
                        }
                        else if (line == '\t') {
                            $label.append('&#160;&#160;&#160;&#160;');
                        }
                        else if (line == '\n') {
                            $label.append($('<br/>'));
                        }
                        else {
                            var $line = $('<span></span>').text(line);
                            $label.append($line);
                        }
                    });
                    var $line = client.setSVGSize(client.createSVGElement('svg'), left < 0 ? -left : left, top).
                        css('position', 'absolute').append(client.createSVGElement('path').
                        attr('d', left < 0 ?
                        'M 0 0 L ' + -left + ' ' + top :
                        'M 0 ' + top + ' L ' + left + ' 0').
                        attr('fill', 'none').attr('stroke', '#000000'));
                    if (_$popup != null) {
                        _$popup.remove();
                    }
                    _$popup = $('<div></div>').
                        css('position', 'absolute').
                        css('left', (off.left + $cell.outerWidth()) + 'px').
                        css('top', off.top + 'px').
                        append($('<div></div>').css('position', 'relative').
                        append($line).append($label));
                    $target.append(_$popup);
                    if (left < 0) {
                        $line.css('top', -top + 'px').css('left', left + 'px');
                        $label.css('top', -top + 'px').
                            css('left', (-$label.outerWidth() + left + 1) + 'px');
                    }
                    else {
                        $line.css('top', -top + 'px').css('left', '0px');
                        $label.css('top', -top + 'px').
                            css('left', (left - 1) + 'px');
                    }
                }
                var dx = 14;
                var dy = 10;
                createPopup(dx, dy);
                var maxWidth = $target.parent().scrollLeft() +
                    $target.parent().outerWidth();
                //var maxWidth = toff.left + $table.outerWidth();
                var $label = _$popup.find('.wsproj-popup-label');
                var d = maxWidth - (off.left + $cell.outerWidth() +
                    dx + $label.outerWidth());
                if (d < 0) {
                    createPopup(-dx, $label.outerHeight() + dy);
                }
            }
            $table.on('mousedown', function (event) {
                var $target = $(event.target);
                var $td = $target.closest('TD');
                if ($td.length == 1 &&
                    $target.closest('INPUT').length == 0 &&
                    $target.closest('A').length == 0 &&
                    event.which == 1) {
                    event.preventDefault();
                    beginEdit($td, true);
                }
            }).on('mouseover', function (event) {
                var $td = $(event.target).closest('TD');
                if ($td.length == 1) {
                    var comment = controller($td).getComment();
                    if (comment) {
                        showComment($td, comment);
                    }
                }
            }).on('mouseout', function (event) {
                var $td = $(event.target).closest('TD');
                if ($td.length == 1) {
                    if (_$popup != null) {
                        _$popup.remove();
                        _$popup = null;
                    }
                }
            });
            function cellStateChangeHandler(event) {
                var ctrl = controller(_$td);
                _orgValue = ctrl.getValue();
                _readonly = ctrl.isReadonly();
                _$textField.val(_orgValue).prop('readonly', _readonly);
            }
            /*
                function getCellPos($td : JQuery) {
                  return {
                    rowIndex : $td.parent().index(),
                    colIndex : $td.index()
                  };
                }
            */
            function beginEdit($td, userOp) {
                if (_editing) {
                    /*
                            var curPos = getCellPos(_$td);
                            var newPos = getCellPos($td);
                            if (curPos.rowIndex == newPos.rowIndex &&
                                curPos.colIndex == newPos.colIndex) {
                              console.log('remain...');
                              return;
                            }
                    */
                    endEdit();
                }
                if (_$td != null) {
                    _$td.off('cellStateChange', cellStateChangeHandler);
                    _$textField.remove();
                }
                _$td = $td;
                _$textField = createTextField();
                _$td.append(_$textField);
                _$td.on('cellStateChange', cellStateChangeHandler);
                var width = _$td.outerWidth() - client.styleConsts.cellPadding * 2 - 1;
                setEditing(true);
                _$td.trigger('cellStateChange');
                _$textField.css('text-align', controller(_$td).getAlign()).
                    css('width', width + 'px').
                    focus().select();
                $td.trigger('beginEdit', { userOp: userOp });
            }
            function endEdit() {
                if (!_editing) {
                    return;
                }
                setEditing(false);
                var value = client.removeInvalidChars(client.trim(_$textField.val()));
                if (value.length > client.MAX_CELL_VALUE) {
                    value = value.substring(0, client.MAX_CELL_VALUE);
                    _$textField.val(value);
                }
                if (_orgValue != value) {
                    controller(_$td).setValue(value);
                    _$td.trigger('valueChange', { value: value });
                }
                _$td.trigger('endEdit');
            }
            function setEditing(editing) {
                _editing = editing;
                _enterField = false;
                setVisible(_$textField, _editing);
                setVisible(_$td.children('.wsproj-label'), !_editing);
            }
            function createTextField() {
                return $('<input type="text"/>').
                    addClass('wsproj-editor').
                    css('display', 'none').
                    on('blur change', function (event) {
                    endEdit();
                }).on('mousedown', function (event) {
                    if (_readonly) {
                        return;
                    }
                    if (_editing) {
                        _enterField = true;
                    }
                }).on('keydown', function (event) {
                    if (_readonly) {
                        return;
                    }
                    if (!_editing) {
                        return;
                    }
                    if (event.keyCode == client.DOM_VK.ESCAPE) {
                        event.preventDefault();
                        $(this).val(_orgValue).select();
                        _enterField = false;
                    }
                    if (_enterField) {
                        if (event.keyCode == client.DOM_VK.UP ||
                            event.keyCode == client.DOM_VK.DOWN ||
                            event.keyCode == client.DOM_VK.LEFT ||
                            event.keyCode == client.DOM_VK.RIGHT) {
                            event.stopPropagation();
                        }
                    }
                    else {
                        if (event.keyCode == client.DOM_VK.F2) {
                            event.preventDefault();
                            event.stopPropagation();
                            var val = $(this).val();
                            $(this).val('').val(val);
                            _enterField = true;
                        }
                    }
                });
            }
            return {
                beginEdit: beginEdit,
                endEdit: endEdit
            };
        }
        client.createTableEditor = createTableEditor;
    })(client = wsproj.client || (wsproj.client = {}));
})(wsproj || (wsproj = {}));
'use strict';
var wsproj;
(function (wsproj) {
    var client;
    (function (client) {
        function createTaskAddUpConfigUI(dataTable, messages) {
            function triggerRowViewChange() {
                dataTable.tableModel.userData.taskAddUpConfig = getConfig();
                dataTable.$table.trigger('rowViewChange');
            }
            function setConfig(config) {
                $weekSelect.val(config.beginOfWeek || '1');
                $monthSelect.val(config.beginOfMonth || '1');
                triggerRowViewChange();
            }
            function getConfig() {
                return {
                    beginOfWeek: $weekSelect.val(),
                    beginOfMonth: $monthSelect.val()
                };
            }
            var $opt;
            var $weekSelect = $('<select></select>').
                addClass('wsproj-select').on('change', function (event) {
                triggerRowViewChange();
            });
            for (var i = 0; i < 7; i += 1) {
                var day = (i + 1) % 7;
                $weekSelect.append($('<option></option>').
                    val('' + day).text(messages.DAY_OF_WEEK[day]));
            }
            var $monthSelect = $('<select></select>').
                addClass('wsproj-select').on('change', function (event) {
                triggerRowViewChange();
            });
            for (var i = 0; i < 28; i += 1) {
                var date = i + 1;
                $monthSelect.append($('<option></option>').
                    val('' + date).text(client.formatNumber(date, 2)));
            }
            var dayLabel = messages.DAY_OF_WEEK.substring(0, 1);
            var $settingTable = $('<table></table>');
            var $tbody = $('<tbody></tbody>');
            $settingTable.append($tbody);
            $tbody.append($('<tr></tr>').
                append($('<td></td>').text(messages.BEGIN_OF_WEEK)).
                append($('<td></td>').append($weekSelect)).
                append($('<td></td>').text(messages.BEGIN_OF_MONTH)).
                append($('<td></td>').append($monthSelect).append($('<span></span>').text(dayLabel))));
            return {
                $ui: $settingTable,
                setConfig: setConfig,
                getConfig: getConfig
            };
        }
        client.createTaskAddUpConfigUI = createTaskAddUpConfigUI;
    })(client = wsproj.client || (wsproj.client = {}));
})(wsproj || (wsproj = {}));
'use strict';
var wsproj;
(function (wsproj) {
    var client;
    (function (client) {
        function createTaskManagerAddUpTable(dataTable, messages, applyDecoration) {
            var defaultTableModel = client.createTaskManagerTableModel(messages, 0, null);
            var tableModel = null;
            var _rowView = null;
            var _groupedRowView = null;
            var _minDate = null;
            var _maxDate = null;
            var _divideActToTerm = true;
            var _selectedRowIndex = -1;
            var _selectedColIndex = -1;
            var _$head = $('<thead></thead>');
            var _$foot = $('<tfoot></tfoot>');
            var _$body = $('<tbody></tbody>');
            var _$table = $('<table></table>').addClass('wsproj-table').
                append(_$head).append(_$foot).append(_$body);
            var editor = client.createTableEditor(_$table);
            var cursorManager = client.createCursorManager(_$table);
            _$body.on('mousedown', function (event) {
                var $cell = $(event.target).closest('TD');
                if ($cell.length == 1) {
                    _selectedColIndex = $cell.index();
                    _selectedRowIndex = $cell.parent().index();
                    updateCursor();
                }
            });
            _$table.on('keydown', function (event) {
                var selectedRowIndex = _selectedRowIndex;
                var selectedColIndex = _selectedColIndex;
                var validKey = false;
                if (event.keyCode == client.DOM_VK.UP) {
                    validKey = true;
                    selectedRowIndex -= 1;
                }
                else if (event.keyCode == client.DOM_VK.DOWN) {
                    validKey = true;
                    selectedRowIndex += 1;
                }
                else if (event.keyCode == client.DOM_VK.LEFT) {
                    validKey = true;
                    selectedColIndex -= 1;
                }
                else if (event.keyCode == client.DOM_VK.RIGHT) {
                    validKey = true;
                    selectedColIndex += 1;
                }
                if (validKey) {
                    event.preventDefault();
                }
                var maxRowIndex = _$body.children().length - 1;
                var maxColIndex = tableModel.columns.length - 1;
                selectedRowIndex = Math.max(0, Math.min(selectedRowIndex, maxRowIndex));
                selectedColIndex = Math.max(0, Math.min(selectedColIndex, maxColIndex));
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
            }).on('columnWidthChange', function (event) {
                updateCursor();
            });
            function getCurrentCell() {
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
            var groupIds = {};
            var groupState = {};
            var grouped = null;
            $.each(groupColumns, function (i, id) {
                groupIds[id] = true;
                groupState[id] = false;
            });
            function setupHeaderCell($th, column) {
                var group = groupIds[column.id];
                var $groupCheckButton = null;
                if (column.labelOrientation == 'vertical') {
                    $th.append(client.createVerticalLabel($('.wsproj'), column.label).
                        css('margin-top', '6px'));
                    if (group) {
                        $th.append($('<br/>'));
                        $groupCheckButton = client.createCheckbox().
                            css('vertical-align', 'bottom');
                        $th.append($groupCheckButton);
                    }
                }
                else {
                    var $lh = $('<div></div>').
                        css('white-space', 'nowrap');
                    if (group) {
                        $groupCheckButton = client.createCheckbox().
                            css('vertical-align', 'middle');
                        $lh.append($groupCheckButton);
                    }
                    $lh.append($('<span></span>').
                        css('display', 'inline-block').
                        css('vertical-align', 'middle').
                        text(column.label));
                    $th.append($lh);
                }
                if (group) {
                    var ctrl = $groupCheckButton.data('controller');
                    ctrl.setChecked(groupState[column.id]);
                    $groupCheckButton.attr('id', 'grp_' + column.id).
                        addClass('wsproj-checkbox');
                    $th.children().css('cursor', 'default').
                        on('mousedown', function (event) {
                        event.preventDefault();
                        ctrl.setChecked(!ctrl.isChecked());
                        groupState[column.id] = ctrl.isChecked();
                        grouped = null;
                        validate();
                    });
                }
            }
            var columnResizeManager = client.createColumnResizeManager();
            function getGrouped() {
                if (grouped == null) {
                    grouped = [];
                    for (var i = 0; i < defaultTableModel.columns.length; i += 1) {
                        var column = defaultTableModel.columns[i];
                        if (groupState[column.id]) {
                            grouped.push(column.id);
                        }
                    }
                }
                return grouped;
            }
            function createGroupKey(data) {
                var key = '';
                var grouped = getGrouped();
                for (var i = 0; i < grouped.length; i += 1) {
                    var id = grouped[i];
                    key += id + '=' + data[id] + ';';
                }
                return key;
            }
            function cloneObj(src) {
                var dst = {};
                for (var k in src) {
                    dst[k] = src[k];
                }
                return dst;
            }
            function cloneGroupData(src) {
                var dst = {};
                for (var i = 0; i < groupColumns.length; i += 1) {
                    var k = groupColumns[i];
                    if (typeof src[k] != 'undefined') {
                        dst[k] = src[k];
                    }
                }
                return dst;
            }
            function divideRows(rows) {
                var beginOfMonth = +dataTable.tableModel.
                    userData.taskAddUpConfig.beginOfMonth;
                var termCache = {};
                function getTerm(date) {
                    var term = termCache[date];
                    if (!term) {
                        term = client.getTermByDate(date, beginOfMonth);
                        termCache[date] = term;
                    }
                    return term;
                }
                var dividedRows = [];
                function divideRow(dataRow) {
                    // divide
                    var data = cloneObj(dataRow.data);
                    var subDataMap = {};
                    var actIds = [];
                    var term;
                    for (var id in data) {
                        if (client.isActDate(id)) {
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
                            }
                            else if (date < subData.minAct) {
                                subData.minAct = date;
                            }
                            else if (date > subData.maxAct) {
                                subData.maxAct = date;
                            }
                            var act = data[id];
                            subData[id] = act;
                            subData.elapsed += client.strToNum(act);
                            actIds.push(id);
                        }
                    }
                    // cleanup act data
                    for (var i = 0; i < actIds.length; i += 1) {
                        delete data[actIds[i]];
                    }
                    delete data.minAct;
                    delete data.maxAct;
                    dividedRows.push({ valid: false, data: data });
                    var hasOrigEst = typeof data.origEst != 'undefined';
                    var elapsed = 0;
                    for (term in subDataMap) {
                        var subData = subDataMap[term];
                        elapsed += subData.elapsed;
                        subData.elapsed = client.hourToStr(subData.elapsed);
                        if (hasOrigEst) {
                            subData.origEst = subData.elapsed;
                        }
                        subData.currEst = subData.elapsed;
                        subData.remain = client.hourToStr(0);
                        dividedRows.push({ valid: false, data: subData });
                    }
                    // overwrite currEst and elapsed.
                    if (hasOrigEst) {
                        data.origEst = client.hourToStr(client.strToNum(data.origEst) - elapsed);
                    }
                    data.currEst = client.hourToStr(client.strToNum(data.currEst) - elapsed);
                    data.elapsed = client.hourToStr(client.strToNum(data.elapsed) - elapsed);
                }
                for (var i = 0; i < rows.length; i += 1) {
                    var dataRow = rows[i];
                    if (!dataRow.data.term && dataRow.data.minAct) {
                        divideRow(dataRow);
                    }
                    else {
                        dividedRows.push(rows[i]);
                    }
                }
                return dividedRows;
            }
            function updateRowView() {
                if (_divideActToTerm) {
                    var columns = [dataTable.tableModel.userData.columnMap['term']];
                    var rowView = divideRows(dataTable.getRowView());
                    _rowView = dataTable.applyFilter(columns, rowView);
                }
                else {
                    _rowView = dataTable.getRowView();
                }
                validate();
            }
            function validate() {
                var sumIds = client.getTaskSumIds();
                var grouped = getGrouped();
                function createGroupRow(src) {
                    var data = {};
                    for (var i = 0; i < grouped.length; i += 1) {
                        var id = grouped[i];
                        data[id] = src.data[id];
                    }
                    data.sum = {};
                    return { valid: false, data: data };
                }
                _groupedRowView = [];
                var minAct = null;
                var maxAct = null;
                var groupMap = {};
                var sumOp = client.addUpOp(client.strToNum, function (a, b) { return a + b; });
                var minOp = client.addUpOp(function (s) { return s; }, function (a, b) { return a < b ? a : b; });
                var maxOp = client.addUpOp(function (s) { return s; }, function (a, b) { return a > b ? a : b; });
                // create group rows
                var id;
                for (var i = 0; i < _rowView.length; i += 1) {
                    var src = _rowView[i];
                    var key = createGroupKey(src.data);
                    var dst = groupMap[key];
                    if (!dst) {
                        dst = createGroupRow(src);
                        dst.data.id = client.NBSP;
                        groupMap[key] = dst;
                        _groupedRowView.push(dst);
                    }
                    for (var s = 0; s < sumIds.length; s += 1) {
                        sumOp(src.data, dst.data.sum, sumIds[s]);
                    }
                    for (id in src.data) {
                        if (client.isActDate(id)) {
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
                    var sum = data.sum;
                    for (id in sum) {
                        if (id == 'minAct' || id == 'maxAct') {
                            data[id] = sum[id];
                        }
                        else {
                            data[id] = client.hourToStr(sum[id]);
                        }
                    }
                    delete data.sum;
                }
                var baseDate = null;
                var numWeeks;
                if (minAct != null) {
                    _minDate = client.strToDate(minAct.substring(3));
                    _maxDate = client.strToDate(maxAct.substring(3));
                    baseDate = client.getMonday(_minDate);
                    numWeeks = 1;
                    var date = baseDate;
                    while (date < client.getMonday(_maxDate)) {
                        numWeeks += 1;
                        date = client.rollDate(date, 7);
                    }
                }
                else {
                    numWeeks = 0;
                }
                tableModel = client.createTaskManagerTableModel(messages, numWeeks * 7, null);
                tableModel.userData.baseDate = baseDate;
                if (_$head.data('numWeeks') != numWeeks) {
                    client.createHeader(_$head, tableModel, setupHeaderCell, columnResizeManager);
                    _$head.data('numWeeks', numWeeks);
                }
                client.setupLabels(_$head, tableModel.userData);
                validateCells(_$body, _groupedRowView);
                var footRow = tableModel.getFootRow(_groupedRowView);
                ;
                var config = dataTable.tableModel.userData.taskAddUpConfig;
                var addUpWeek = {
                    data: { footer: true, addUpSumIds: {},
                        projectGroup: messages.ADD_UP_WEEK },
                    hours: 0, begin: +config.beginOfWeek };
                var addUpMonth = {
                    data: { footer: true, addUpSumIds: {},
                        projectGroup: messages.ADD_UP_MONTH },
                    hours: 0, begin: +config.beginOfMonth };
                for (var i = 0; i < tableModel.userData.numDays; i += 1) {
                    var date = client.rollDate(tableModel.userData.baseDate, i);
                    if (_minDate <= date && date <= _maxDate) {
                        if (date.getDay() == addUpWeek.begin) {
                            addUpWeek.hours = 0;
                        }
                        if (date.getDate() == addUpMonth.begin) {
                            addUpMonth.hours = 0;
                        }
                        var nextDate = client.rollDate(date, 1);
                        if (nextDate.getDay() == addUpWeek.begin) {
                            addUpWeek.data.addUpSumIds['d' + i] = true;
                        }
                        if (nextDate.getDate() == addUpMonth.begin) {
                            addUpMonth.data.addUpSumIds['d' + i] = true;
                        }
                        var id = 'act' + client.formatDate(date);
                        var hours = client.strToNum(footRow[id]);
                        addUpWeek.hours += hours;
                        addUpMonth.hours += hours;
                        if (hours != 0 || addUpWeek.data.addUpSumIds['d' + i]) {
                            addUpWeek.data[id] = client.hourToStr(addUpWeek.hours);
                        }
                        if (hours != 0 || addUpMonth.data.addUpSumIds['d' + i]) {
                            addUpMonth.data[id] = client.hourToStr(addUpMonth.hours);
                        }
                    }
                }
                validateCells(_$foot, [
                    { valid: false, data: footRow },
                    { valid: false, data: addUpWeek.data },
                    { valid: false, data: addUpMonth.data }
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
            function createCachedCells() {
                return { numColumns: tableModel.columns.length, rows: [] };
            }
            function createCellStyles() {
                var styles = {};
                for (var i = 0; i < tableModel.columns.length; i += 1) {
                    styles[tableModel.columns[i].id] = {
                        color: '', bgColor: '', readonly: false, title: ''
                    };
                }
                return styles;
            }
            function updateCell(dataRow, styles, column, $cell) {
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
            function createRowsHTML(rows) {
                var html = '';
                for (var r = 0; r < rows.length; r += 1) {
                    var dataRow = rows[r];
                    var styles = createCellStyles();
                    tableModel.setDataRowStyle(dataRow, styles);
                    html += '<tr>';
                    for (var c = 0; c < tableModel.columns.length; c += 1) {
                        var column = tableModel.columns[c];
                        var style = styles[column.id];
                        html += client.createCellHTML(client.createCellStyle(column) +
                            (style.color ? 'color:' + style.color + ';' : '') +
                            (style.bgColor ? 'background-color:' + style.bgColor + ';' : ''));
                    }
                    html += '</tr>';
                }
                return html;
            }
            function createCellCache($target, rows) {
                $target.html(createRowsHTML(rows));
                var cache = createCachedCells();
                var $rows = $target.children();
                for (var r = 0; r < rows.length; r += 1) {
                    var $cells = $($rows[r]).children();
                    var rowCache = [];
                    for (var c = 0; c < tableModel.columns.length; c += 1) {
                        var $cell = $($cells[c]);
                        client.setupCell($cell, applyDecoration);
                        rowCache.push($cell);
                    }
                    cache.rows.push(rowCache);
                }
                return cache;
            }
            function validateCells($target, rows) {
                var cache = $target.data('cache');
                var validCache = !!(cache && cache.rows.length == rows.length &&
                    cache.numColumns == tableModel.columns.length);
                if (!validCache) {
                    cache = createCellCache($target, rows);
                    $target.data('cache', cache);
                }
                for (var r = 0; r < rows.length; r += 1) {
                    var dataRow = rows[r];
                    var styles = createCellStyles();
                    tableModel.setDataRowStyle(dataRow, styles);
                    var rowCache = cache.rows[r];
                    for (var c = 0; c < tableModel.columns.length; c += 1) {
                        var column = tableModel.columns[c];
                        updateCell(dataRow, styles, column, rowCache[c]);
                    }
                }
            }
            var $chk = client.createCheckboxUI(messages.DIVIDE_ACT_TO_TERM, applyDecoration).
                css('cursor', 'default').
                css('display', 'inline-block').on('mousedown', function (event) {
                event.preventDefault();
                _divideActToTerm = !_divideActToTerm;
                $chk.data('controller').setChecked(_divideActToTerm);
                updateRowView();
            });
            $chk.data('controller').setChecked(_divideActToTerm);
            return {
                $ui: $('<div></div>').css('position', 'relative').
                    append($chk).append(_$table),
                updateRowView: updateRowView
            };
        }
        client.createTaskManagerAddUpTable = createTaskManagerAddUpTable;
    })(client = wsproj.client || (wsproj.client = {}));
})(wsproj || (wsproj = {}));
'use strict';
var wsproj;
(function (wsproj) {
    var client;
    (function (client) {
        function createTaskManagerTableModel(messages, numDays, loginUser) {
            function getProjectGroups(data) {
                return columnMap['projectGroup'].dropdownModel.getItems(data);
            }
            function getProjects(data) {
                var model = columnMap['projectGroup'].dropdownModel;
                var projectGroups = getProjectGroups(data);
                var projects = null;
                for (var i = 0; i < projectGroups.length; i += 1) {
                    var projectGroup = projectGroups[i];
                    if (projectGroup[model.valueField] == data[model.dataField]) {
                        projects = projectGroup.projects;
                    }
                }
                return projects || [];
            }
            function getUsers(data) {
                var model = columnMap['project'].dropdownModel;
                var projects = getProjects(data);
                var users = null;
                for (var i = 0; i < projects.length; i += 1) {
                    var project = projects[i];
                    if (project[model.valueField] == data[model.dataField]) {
                        users = project.users;
                    }
                }
                return users || [];
            }
            var columns = [
                { id: 'id', label: 'ID', dataType: 'number', sortable: false },
                { id: 'projectGroup', label: messages.COL_LABEL_PROJECT_GROUP,
                    textInputAssist: true,
                    resizable: true,
                    dropdownModel: {
                        valueField: 'groupName',
                        labelField: 'groupName',
                        dataField: 'projectGroup',
                        getItems: function (data) { return []; },
                        commitValue: function (data, item) {
                            delete data.project;
                            delete data.projectId;
                            delete data.user;
                            delete data.userId;
                        }
                    },
                    filter: { accepts: null }
                },
                { id: 'project', label: messages.COL_LABEL_PROJECT,
                    textInputAssist: true,
                    resizable: true,
                    dropdownModel: {
                        valueField: 'projectId',
                        labelField: 'projectName',
                        dataField: 'projectId',
                        getItems: function (data) { return getProjects(data); },
                        commitValue: function (data, item) {
                            delete data.user;
                            delete data.userId;
                        }
                    },
                    filter: { accepts: null }
                },
                { id: 'term', label: messages.COL_LABEL_TERM, textInputAssist: true,
                    resizable: true,
                    filter: { accepts: null }
                },
                { id: 'user', label: messages.COL_LABEL_USER, textInputAssist: true,
                    resizable: true,
                    filter: { accepts: null },
                    dropdownModel: {
                        valueField: 'userId',
                        labelField: 'userName',
                        dataField: 'userId',
                        getItems: function (data) {
                            var users = [{ userId: '', userName: '' }];
                            if (loginUser) {
                                users.push(loginUser);
                            }
                            return users.concat(getUsers(data));
                        },
                        commitValue: function (data, item) {
                            if (!data.userId) {
                                delete data.userId;
                            }
                        }
                    }
                },
                { id: 'comment', label: messages.COL_LABEL_COMMENT,
                    resizable: true,
                    filter: { accepts: null },
                    sortable: false
                },
                { id: 'taskType1', label: messages.COL_LABEL_TASK_TYPE1,
                    textInputAssist: true,
                    resizable: true,
                    filter: { accepts: null },
                    groupLabel: messages.COL_LABEL_TASK_TYPE, groupSize: 4
                },
                { id: 'taskType2', label: messages.COL_LABEL_TASK_TYPE2,
                    textInputAssist: true,
                    resizable: true,
                    filter: { accepts: null }
                },
                { id: 'taskType3', label: messages.COL_LABEL_TASK_TYPE3,
                    textInputAssist: true,
                    resizable: true,
                    filter: { accepts: null }
                },
                { id: 'taskType4', label: messages.COL_LABEL_TASK_TYPE4,
                    textInputAssist: true,
                    resizable: true,
                    filter: { accepts: null }
                },
                /*
                      { id: 'pmanId', label: 'ppppID',
                        filter: {accepts : null} },
                      { id: 'externalId', label: 'ppppID',
                        filter: {accepts : null} },
                */
                { id: 'priority', label: messages.COL_LABEL_PRIORITY, dataType: 'number',
                    labelOrientation: 'vertical',
                    minWidth: 20,
                    filter: { accepts: null } },
                { id: 'origEst', label: messages.COL_LABEL_ORIG_EST, dataType: 'number',
                    labelOrientation: 'vertical',
                    minWidth: 20,
                    filter: { accepts: null } },
                { id: 'currEst', label: messages.COL_LABEL_CURR_EST, dataType: 'number',
                    labelOrientation: 'vertical',
                    minWidth: 20,
                    filter: { accepts: null } },
                { id: 'elapsed', label: messages.COL_LABEL_ELAPSED, dataType: 'number',
                    labelOrientation: 'vertical',
                    minWidth: 20,
                    filter: { accepts: null } },
                { id: 'remain', label: messages.COL_LABEL_REMAIN, dataType: 'number',
                    labelOrientation: 'vertical',
                    minWidth: 20,
                    filter: { accepts: null } },
            ];
            function formatStrDate(date) {
                return (typeof date == 'string' && date.length == 8) ?
                    date.substring(0, 4) + '/' +
                        date.substring(4, 6) + '/' +
                        date.substring(6, 8) : date;
            }
            for (var i = 0; i < numDays; i += 1) {
                var column = {
                    id: 'd' + i, label: '', dataType: 'number',
                    minWidth: 28
                };
                if (i % 7 == 0) {
                    column.groupLabel = '';
                    column.groupSize = 7;
                }
                column.commentable = true;
                columns.push(column);
            }
            var columnMap = {};
            columnMap = {};
            $.each(columns, function (i, column) {
                columnMap[column.id] = column;
            });
            var actIdRe = /^d[0-9]+$/;
            var tableModel = {
                userData: {
                    baseDate: client.getDefaultBaseDate(),
                    numDays: numDays,
                    columnMap: columnMap,
                    taskAddUpConfig: {
                        beginOfWeek: '1',
                        beginOfMonth: '1'
                    }
                },
                numPageRows: 25,
                columns: columns,
                sortId: null,
                sortOrder: null,
                getDataId: function (id) {
                    if (id.match(actIdRe)) {
                        return 'act' + client.formatDate(client.rollDate(tableModel.userData.baseDate, +id.substring(1)));
                    }
                    return id;
                },
                getDataValues: function (id, dataRow) {
                    var vals = [];
                    var val = dataRow.data[id];
                    if (typeof val == 'string' && val.length > 0) {
                        vals.push(val);
                    }
                    else {
                        vals.push('');
                    }
                    if (id == 'term' && !dataRow.data.term && dataRow.data.minAct) {
                        var beginOfMonth = +tableModel.userData.taskAddUpConfig.beginOfMonth;
                        for (id in dataRow.data) {
                            if (client.isActDate(id)) {
                                vals.push(client.getTermByDate(id.substring(3), beginOfMonth));
                            }
                        }
                    }
                    return vals;
                },
                getFootRow: function (rows) {
                    var sumIds = client.getTaskSumIds();
                    var sumOp = client.addUpOp(client.strToNum, function (a, b) { return a + b; });
                    var minOp = client.addUpOp(function (s) { return s; }, function (a, b) { return a < b ? a : b; });
                    var maxOp = client.addUpOp(function (s) { return s; }, function (a, b) { return a > b ? a : b; });
                    var sum = {};
                    var id;
                    for (var i = 0; i < rows.length; i += 1) {
                        var dataRow = rows[i];
                        for (var s = 0; s < sumIds.length; s += 1) {
                            sumOp(dataRow.data, sum, sumIds[s]);
                        }
                        for (id in dataRow.data) {
                            if (client.isActDate(id)) {
                                sumOp(dataRow.data, sum, id);
                            }
                        }
                        minOp(dataRow.data, sum, 'minAct');
                        maxOp(dataRow.data, sum, 'maxAct');
                    }
                    var data = { footer: true };
                    for (id in sum) {
                        if (id == 'minAct' || id == 'maxAct') {
                            data[id] = sum[id];
                        }
                        else {
                            data[id] = client.hourToStr(sum[id]);
                        }
                    }
                    // show record count
                    data.projectGroup = client.messageFormat(messages.RECORDS, rows.length);
                    return data;
                },
                setDataRowStyle: function (dataRow, styles) {
                    var data = dataRow.data;
                    var today = client.formatDate(client.getToday());
                    //var limitDate = formatDate(rollDate(getToday(), 7) );
                    for (var i = 0; i < tableModel.userData.numDays; i += 1) {
                        var style = styles['d' + i];
                        var day = i % 7;
                        if (day == 5 || day == 6) {
                            style.bgColor = client.styleConsts.holidayBgColor;
                        }
                        var date = client.formatDate(client.rollDate(tableModel.userData.baseDate, i));
                        if (date == today) {
                            style.bgColor = client.styleConsts.todayBgColor;
                        }
                        if (!data.footer) {
                            if (date > today) {
                                if (data['act' + date]) {
                                    style.color = client.styleConsts.errorColor;
                                    style.title = messages.MSG_WARN_FUTURE_ACT;
                                }
                                else {
                                    style.readonly = true;
                                }
                            }
                        }
                    }
                    if (data.addUpSumIds) {
                        for (var id in data.addUpSumIds) {
                            if (typeof data[tableModel.getDataId(id)] != 'undefined') {
                                styles[id].bgColor = client.styleConsts.addUpSumBgColor;
                            }
                        }
                    }
                    if (data.footer) {
                        $.each(styles, function (id, style) {
                            style.readonly = true;
                        });
                        return;
                    }
                    // readonly, dropdown selectable
                    styles['projectGroup'].readonly = true;
                    styles['project'].readonly = true;
                    styles['user'].readonly = true;
                    function setReadonly(id) {
                        styles[id].readonly = true;
                        styles[id].bgColor = client.styleConsts.readonlyBgColor;
                    }
                    setReadonly('id');
                    setReadonly('elapsed');
                    setReadonly('remain');
                    //setReadonly('minAct');
                    //setReadonly('maxAct');
                    var elapsed = client.strToNum(data.elapsed);
                    var remain = client.strToNum(data.remain);
                    if (elapsed == 0) {
                        setReadonly('currEst');
                    }
                    else {
                        setReadonly('origEst');
                    }
                    if (remain < 0) {
                        styles['currEst'].color = client.styleConsts.errorColor;
                        styles['currEst'].title = messages.MSG_WARN_CURR_EST;
                        styles['remain'].color = client.styleConsts.errorColor;
                        styles['remain'].title = messages.MSG_WARN_CURR_EST;
                    }
                },
                dupColumns: [
                    'projectGroup',
                    'projectId',
                    'project',
                    'term',
                    'userId',
                    'user',
                    'taskType1',
                    'taskType2',
                    'taskType3',
                    'taskType4',
                    'comment'
                ]
            };
            return tableModel;
        }
        client.createTaskManagerTableModel = createTaskManagerTableModel;
        function setupLabels($head, tm) {
            var cells = $head.data('cells');
            var $cell = null;
            for (var i = 0; i < tm.numDays; i += 1) {
                var date = client.rollDate(tm.baseDate, i);
                if (i % 7 == 0) {
                    $cell = cells['group-header-d' + i];
                    $cell.css('padding', '0px 0px 0px 4px').
                        css('text-align', 'left');
                    setText($cell, client.formatDate(date, '/'));
                }
                $cell = cells['header-d' + i];
                setText($cell, client.formatNumber(date.getDate(), 2));
            }
        }
        client.setupLabels = setupLabels;
        function setText($cell, text) {
            if ($cell.text() != text) {
                $cell.text(text);
            }
        }
    })(client = wsproj.client || (wsproj.client = {}));
})(wsproj || (wsproj = {}));
'use strict';
var wsproj;
(function (wsproj) {
    var client;
    (function (client) {
        client.isActDate = function () {
            var actRe = /^act[0-9]{8}$/;
            return function (id) {
                return !!id.match(actRe);
            };
        }();
        function getTaskSumIds() {
            return ['origEst', 'currEst', 'elapsed', 'remain'];
        }
        client.getTaskSumIds = getTaskSumIds;
        function getDefaultTerm() {
            var date = getToday();
            return client.formatNumber(date.getFullYear(), 4) + '/' +
                client.formatNumber(date.getMonth() + 1, 2);
        }
        client.getDefaultTerm = getDefaultTerm;
        function addUpOp(conv, op) {
            return function (src, dst, id) {
                if (typeof src[id] != 'undefined') {
                    var val = conv(src[id]);
                    if (typeof dst[id] == 'undefined') {
                        dst[id] = val;
                    }
                    else {
                        dst[id] = op(dst[id], val);
                    }
                }
            };
        }
        client.addUpOp = addUpOp;
        function fixWideStr(data, id, filter) {
            if (typeof data[id] == 'string') {
                var val = data[id];
                val = client.toNarrowStr(val);
                if (filter) {
                    val = filter(val);
                }
                data[id] = val;
            }
        }
        client.fixWideStr = fixWideStr;
        function priorityFilter(s) {
            if (s.length == 0) {
                return s;
            }
            var n = Math.max(0, Math.min(~~client.strToNum(s), 9999));
            if (n == 0) {
                return '';
            }
            return client.numToStr(n);
        }
        client.priorityFilter = priorityFilter;
        /*  function getDefaultYear(month : number) : number {
              var date = getToday();
              var dm = strToNum(s) - date.getMonth() - 1;
              while (dm >= 6) {
                dm -= 12;
              }
              date.setMonth(date.getMonth() + dm);
              return date.getFullYear();
          }
        */
        function getToday() {
            return new Date();
        }
        client.getToday = getToday;
        function getNearestDateByMonth(month) {
            var today = getToday();
            var date = new Date(today.getFullYear(), today.getMonth(), 1);
            var dm = month - date.getMonth() - 1;
            while (dm >= 6) {
                dm -= 12;
            }
            date.setMonth(date.getMonth() + dm);
            return date;
        }
        client.getNearestDateByMonth = getNearestDateByMonth;
        function termFilter(s) {
            if (s.length == 0) {
                return s;
            }
            else if (s.match(/^(\d+)\D+(\d+)$/)) {
                var y = client.strToNum(RegExp.$1);
                if (y < 100) {
                    y += 2000;
                }
                var m = client.strToNum(RegExp.$2);
                m = Math.max(1, Math.min(m, 12));
                return client.formatNumber(y, 4) + '/' + client.formatNumber(m, 2);
            }
            else if (s.match(/^\d+$/)) {
                var date = getNearestDateByMonth(client.strToNum(s));
                return client.formatNumber(date.getFullYear(), 4) + '/' +
                    client.formatNumber(date.getMonth() + 1, 2);
            }
            else {
                return getDefaultTerm();
            }
        }
        client.termFilter = termFilter;
        function hourFilter(s) {
            if (s.length == 0) {
                return s;
            }
            var n = client.strToNum(s);
            if (n <= 0) {
                return '';
            }
            return hourToStr(Math.max(0, Math.min(n, 9999)));
        }
        client.hourFilter = hourFilter;
        function hourToStr(n) {
            n = ~~(n * 4) * 25;
            var sign = '';
            if (n < 0) {
                sign = '-';
                n = -n;
            }
            return sign + client.formatNumber(~~(n / 100), 0) +
                '.' + client.formatNumber(n % 100, 2);
        }
        client.hourToStr = hourToStr;
        function getMonday(date) {
            //   0 -6
            //   1  0
            //   2 -1
            //   6 -5
            return new Date(date.getFullYear(), date.getMonth(), date.getDate() - (date.getDay() + 6) % 7);
        }
        client.getMonday = getMonday;
        function getDefaultBaseDate() {
            var today = getToday();
            var baseDate = getMonday(today);
            if (1 <= today.getDay() && today.getDay() <= 5) {
                // mon - fri
                baseDate = client.rollDate(baseDate, -7);
            }
            return baseDate;
        }
        client.getDefaultBaseDate = getDefaultBaseDate;
        function getTermByDate(date, beginOfMonth) {
            if (+date.substring(6, 8) < beginOfMonth) {
                var tmpDate = client.strToDate(date);
                tmpDate.setMonth(tmpDate.getMonth() - 1);
                return client.formatDate(tmpDate, '/').substring(0, 7);
            }
            else {
                return date.substring(0, 4) + '/' + date.substring(4, 6);
            }
        }
        client.getTermByDate = getTermByDate;
        function rollTerm(term, numMonths) {
            var date = new Date(+term.substring(0, 4), +term.substring(5, 7) - 1, 1);
            date.setMonth(date.getMonth() + numMonths);
            return client.formatDate(date, '/').substring(0, 7);
        }
        client.rollTerm = rollTerm;
        function formatHour(hour) {
            var neg = false;
            if (hour < 0) {
                neg = true;
                hour = -hour;
            }
            var month = 0;
            var day = 0;
            while (hour > 160) {
                month += 1;
                hour -= 160;
            }
            while (hour > 8) {
                day += 1;
                hour -= 8;
            }
            var s = '';
            if (month > 0) {
                s += month + 'm';
            }
            if (day > 0) {
                s += day + 'd';
            }
            if (hour > 0 || s.length == 0) {
                s += hour + 'h';
            }
            if (neg) {
                s = '-' + s;
            }
            return s;
        }
        client.formatHour = formatHour;
    })(client = wsproj.client || (wsproj.client = {}));
})(wsproj || (wsproj = {}));
'use strict';
var wsproj;
(function (wsproj) {
    var client;
    (function (client) {
        function createSVGElement(tagName) {
            return $(document.createElementNS('http:/' + '/www.w3.org/2000/svg', tagName));
        }
        client.createSVGElement = createSVGElement;
        function setSVGSize(svg, width, height) {
            return svg.attr({
                version: '1.1',
                width: width, height: height,
                viewBox: '0 0 ' + width + ' ' + height
            });
        }
        client.setSVGSize = setSVGSize;
        function createVerticalLabel($target, text) {
            var svg = createSVGElement('svg');
            var $text = createSVGElement('text').text(text);
            svg.append($text);
            $target.append(svg);
            var bbox = $text[0].getBBox();
            svg.remove();
            $text.attr('transform', 'translate(' + -bbox.y + ',' + (bbox.width - bbox.x) + ')' +
                ' rotate(-90)');
            var w = bbox.height;
            var h = bbox.width;
            return setSVGSize(svg, w, h);
        }
        client.createVerticalLabel = createVerticalLabel;
        function createButton(label) {
            return $('<span></span>').
                addClass('wsproj-button').
                css('margin', '0px 0px 0px 4px').
                css('display', 'inline-block').
                css('float', 'right').
                text(label);
        }
        client.createButton = createButton;
        function createFilterButton() {
            var defaultColor = '#333333';
            var _filtered = false;
            var _sortOrder = null;
            var $path = createSVGElement('path').
                attr('stroke', 'none').attr('fill', defaultColor).
                attr('d', 'M 1 1 L 6 10 L 11 1 Z');
            function setFiltered(filtered) {
                _filtered = filtered;
                update();
            }
            function setSortOrder(sortOrder) {
                _sortOrder = sortOrder;
                update();
            }
            function update() {
                $btn.children().remove();
                if (_filtered) {
                    $btn.append(createSVGElement('path').
                        attr('stroke', 'none').attr('fill', defaultColor).
                        attr('d', 'M 5 4 L 8 7 L 8 12 L 11 12 L 11 7 L 14 4 Z'));
                    if (_sortOrder == null) {
                        $btn.append(createSVGElement('path').
                            attr('stroke', 'none').attr('fill', defaultColor).
                            attr('d', 'M 0 8 L 3 12 L 6 8 Z'));
                    }
                }
                else if (_sortOrder == null) {
                    $btn.append(createSVGElement('path').
                        attr('stroke', 'none').attr('fill', defaultColor).
                        attr('d', 'M 1 4 L 7 11 L 13 4 Z'));
                }
                else {
                    $btn.append(createSVGElement('path').
                        attr('stroke', 'none').attr('fill', defaultColor).
                        attr('d', 'M 4 5 L 9 11 L 14 5 Z'));
                }
                if (_sortOrder != null) {
                    $btn.append(createSVGElement('path').
                        attr('stroke', defaultColor).attr('fill', 'none').
                        attr('d', 'M 3 2 L 3 12'));
                    if (_sortOrder == client.SortOrder.ASC) {
                        $btn.append(createSVGElement('path').
                            attr('stroke', defaultColor).attr('fill', 'none').
                            attr('d', 'M 1 5 L 3 2 L 5 5'));
                    }
                    else {
                        $btn.append(createSVGElement('path').
                            attr('stroke', defaultColor).attr('fill', 'none').
                            attr('d', 'M 1 9 L 3 12 L 5 9'));
                    }
                }
            }
            var $btn = setSVGSize(createSVGElement('svg'), 15, 15).
                attr('class', 'wsproj-dropdown-button').
                data('controller', {
                setFiltered: setFiltered,
                setSortOrder: setSortOrder
            });
            update();
            return $btn;
        }
        client.createFilterButton = createFilterButton;
        function createSelector() {
            var $rect = createSVGElement('rect').
                attr({ x: 0, y: 0, width: 12, height: 12 }).
                attr('stroke-width', '1').attr('stroke', '#333333').
                attr('fill', 'none');
            var _selected = false;
            function setSelected(selected) {
                _selected = selected;
                $rect.attr('fill', _selected ? '#999999' : 'none');
            }
            function isSelected() {
                return _selected;
            }
            return setSVGSize(createSVGElement('svg'), 12, 12).
                attr('class', 'wsproj-selector').
                append($rect).
                data('controller', {
                setSelected: setSelected,
                isSelected: isSelected
            });
        }
        client.createSelector = createSelector;
        function createCheckbox() {
            var defaultColor = '#333333';
            var $path = createSVGElement('path').
                attr('d', 'M 2 5 L 5 9 L 10 3').
                attr('stroke-width', '2').attr('stroke', defaultColor).
                attr('fill', 'none');
            var _checked = true;
            function setColor(color) {
                $path.attr('stroke', color || defaultColor);
            }
            function setChecked(checked) {
                _checked = checked;
                $path.css('display', _checked ? '' : 'none');
            }
            function isChecked() {
                return _checked;
            }
            return setSVGSize(createSVGElement('svg'), 12, 12).
                attr('class', 'wsproj-checkbox').
                append($path).
                append(createSVGElement('rect').
                attr({ x: 0, y: 0, width: 12, height: 12 }).
                attr('stroke-width', '1').attr('stroke', '#333333').
                attr('fill', 'none')).
                data('controller', {
                setColor: setColor,
                setChecked: setChecked,
                isChecked: isChecked
            });
        }
        client.createCheckbox = createCheckbox;
        function createMenu(items) {
            var $menu = $('<div></div>').
                addClass('wsproj-dropdown').
                css('position', 'absolute').
                css('cursor', 'default');
            $.each(items, function (i, item) {
                $menu.append($('<div></div>').
                    text(item.label).
                    addClass('wsproj-label').
                    css('white-space', 'nowrap').
                    css('padding', '2px 4px 2px 4px').
                    on('mousedown', function (event) {
                    event.preventDefault();
                    $menu.trigger('menuItemSelected', item);
                    dispose();
                }));
            });
            function dispose() {
                if ($menu != null) {
                    $('BODY').
                        off('keydown', keydownHandler).
                        off('mousedown', mousedownHandler);
                    $menu.remove();
                    $menu = null;
                }
            }
            function keydownHandler() {
                dispose();
            }
            function mousedownHandler() {
                dispose();
            }
            $('BODY').append($menu).
                on('keydown', keydownHandler).
                on('mousedown', mousedownHandler);
            return $menu;
        }
        client.createMenu = createMenu;
        function createCheckboxUI(label, applyDecoration) {
            var $chk = createCheckbox().css('vertical-align', 'middle');
            var $label = $('<span></span>').
                css('margin', '0px 0px 0px 2px').
                css('vertical-align', 'middle').
                css('display', 'inline-block').
                css('white-space', 'nowrap').
                attr('title', label).
                text(label);
            applyDecoration($label);
            return $('<div></div>').
                addClass('wsproj-label').
                css('padding', '0px 2px 0px 2px').
                css('white-space', 'nowrap').
                append($chk).append($label).
                data('controller', $chk.data('controller'));
        }
        client.createCheckboxUI = createCheckboxUI;
    })(client = wsproj.client || (wsproj.client = {}));
})(wsproj || (wsproj = {}));
'use strict';
var wsproj;
(function (wsproj) {
    var client;
    (function (client) {
        function trim(s) {
            return s.replace(/^[\s\u3000]+|[\s\u3000]+$/g, '');
        }
        client.trim = trim;
        function removeInvalidChars(s) {
            //0~8,b,c,e~1f,7f
            return s.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '');
        }
        client.removeInvalidChars = removeInvalidChars;
        function strToNum(s) {
            var n = +s;
            return isNaN(n) ? 0 : n;
        }
        client.strToNum = strToNum;
        function numToStr(n) {
            return '' + n;
        }
        client.numToStr = numToStr;
        client.toNarrowStr = function () {
            var NARROW_NUMS = '@_*+/,-.' +
                '----';
            var WIDE_NUMS = '\uff20\uff3f\uff0a\uff0b\uff0f\uff0c\uff0d\uff0e' +
                '\u2010\u2015\u2014\u30fc';
            if (NARROW_NUMS.length != WIDE_NUMS.length) {
                throw 'toNarrowNum:' + NARROW_NUMS.length +
                    '!=' + WIDE_NUMS.length;
            }
            var map = {};
            for (var i = 0; i < WIDE_NUMS.length; i += 1) {
                map[WIDE_NUMS[i]] = NARROW_NUMS[i];
            }
            for (var i = 0; i < 10; i += 1) {
                map[String.fromCharCode(i + '\uff10'.charCodeAt(0))] =
                    String.fromCharCode(i + '0'.charCodeAt(0));
            }
            for (var i = 0; i < 26; i += 1) {
                map[String.fromCharCode(i + '\uff21'.charCodeAt(0))] =
                    String.fromCharCode(i + 'A'.charCodeAt(0));
                map[String.fromCharCode(i + '\uff41'.charCodeAt(0))] =
                    String.fromCharCode(i + 'a'.charCodeAt(0));
            }
            return function (s) {
                var ns = '';
                for (var i = 0; i < s.length; i += 1) {
                    var c = s.charAt(i);
                    ns += (map[c] || c);
                }
                return ns;
            };
        }();
        client.messageFormat = function (msg) {
            for (var i = 1; i < arguments.length; i += 1) {
                var re = new RegExp('\\{' + (i - 1) + '\\}', 'g');
                msg = msg.replace(re, arguments[i]);
            }
            return msg;
        };
        function formatNumber(n, digit) {
            var s = '' + n;
            while (s.length < digit) {
                s = '0' + s;
            }
            return s;
        }
        client.formatNumber = formatNumber;
        function rollDate(date, numDays) {
            return new Date(date.getFullYear(), date.getMonth(), date.getDate() + numDays);
        }
        client.rollDate = rollDate;
        function formatDate(date, separator) {
            if (separator === void 0) { separator = ''; }
            return formatNumber(date.getFullYear(), 4) +
                separator + formatNumber(date.getMonth() + 1, 2) +
                separator + formatNumber(date.getDate(), 2);
        }
        client.formatDate = formatDate;
        function strToDate(s) {
            if (typeof s == 'string' && s.length == 8) {
                return new Date(+s.substring(0, 4), +s.substring(4, 6) - 1, +s.substring(6, 8));
            }
            return null;
        }
        client.strToDate = strToDate;
        client.parseLine = function (text, handle) {
            var start = 0;
            var index = 0;
            while (index < text.length) {
                var c = text.charAt(index);
                if (c == '\u0020' || c == '\t' || c == '\n') {
                    if (start < index) {
                        handle(text.substring(start, index));
                    }
                    handle(c);
                    start = index + 1;
                }
                index += 1;
            }
            if (start < index) {
                handle(text.substring(start, index));
            }
        };
        function createTimer() {
            var _name = 'default';
            var _time = 0;
            var _lap = 0;
            var _count = 0;
            function start(name) {
                if (name === void 0) { name = 'default'; }
                _name = name;
                _lap = new Date().getTime();
            }
            function end() {
                _time += (new Date().getTime() - _lap);
                _count += 1;
            }
            function log() {
                console.log(_name + '/' + _time + 'ms' + '/' + _count);
            }
            return { start: start, end: end, log: log };
        }
        client.createTimer = createTimer;
        function callLater(fn) {
            window.setTimeout(fn, 0);
        }
        client.callLater = callLater;
    })(client = wsproj.client || (wsproj.client = {}));
})(wsproj || (wsproj = {}));
'use strict';
!function (global) {
    var console = global.console;
    global.console = {
        log: function (msg) {
            if (location.hostname == 'localhost') {
                console.log(msg);
            }
        }
    };
}(window);
var wsproj;
(function (wsproj) {
    var client;
    (function (client) {
        //-------------------------------------------------------
        // create websocket
        //
        function createWS(url) {
            var ws = null;
            var actions = {};
            var onopen = function (event) {
                console.log(event.type);
            };
            var onclose = function (event) {
                console.log(event.type);
                var data = { action: 'close' };
                var action = actions[data.action];
                if (action) {
                    action(data);
                }
                ws = null;
                reopen();
            };
            var onmessage = function (event) {
                var data = JSON.parse(event.data);
                console.log(JSON.stringify(data, null, 2));
                var action = actions[data.action];
                if (action) {
                    action(data);
                }
            };
            var onerror = function (event) {
                console.log(event.type);
            };
            var initWS = function () {
                var ws = new WebSocket(url);
                ws.onopen = onopen;
                ws.onclose = onclose;
                ws.onmessage = onmessage;
                ws.onerror = onerror;
                return ws;
            };
            var reopen = function () {
                window.setTimeout(function () {
                    if (navigator.onLine) {
                        ws = initWS();
                    }
                    else {
                        reopen();
                    }
                }, 5000);
            };
            var send = function (data) {
                if (ws == null) {
                    return;
                }
                ws.send(JSON.stringify(data));
            };
            var start = function () {
                ws = initWS();
            };
            return {
                send: send,
                actions: actions,
                start: start
            };
        }
        client.createWS = createWS;
    })(client = wsproj.client || (wsproj.client = {}));
})(wsproj || (wsproj = {}));
'use strict';
var wsproj;
(function (wsproj) {
    var client;
    (function (client) {
        client.openWindow = function () {
            var windowManager = function () {
                var _$wins = [];
                function append($win) {
                    _$wins.push($win);
                    reZIndex();
                }
                function remove($win) {
                    var $wins = [];
                    for (var i = 0; i < _$wins.length; i += 1) {
                        if (_$wins[i] != $win) {
                            $wins.push(_$wins[i]);
                        }
                    }
                    _$wins = $wins;
                }
                function toFront($win) {
                    var $wins = [];
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
                        _$wins[i].css('z-index', '' + (100 + i));
                    }
                }
                return {
                    append: append,
                    remove: remove,
                    toFront: toFront
                };
            }();
            return function ($content, title) {
                function dispose(detail) {
                    if ($win != null) {
                        $win.trigger('dispose', { detail: detail });
                        windowManager.remove($win);
                        $win.remove();
                        $win = null;
                    }
                }
                var dragPoint = null;
                function mouseDownHandler(event) {
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
                function mouseMoveHandler(event) {
                    moveTo(event.pageX - dragPoint.x, event.pageY - dragPoint.y);
                }
                function mouseUpHandler(event) {
                    $(document).off('mousemove', mouseMoveHandler);
                    $(document).off('mouseup', mouseUpHandler);
                }
                var $closeButton = client.setSVGSize(client.createSVGElement('svg'), 14, 14).
                    attr('class', 'wsproj-close-button').
                    css('vertical-align', 'middle').
                    css('float', 'right').
                    css('margin', '2px').
                    append(client.createSVGElement('rect').
                    attr({ x: 0, y: 0, width: 14, height: 14 }).
                    attr('stroke', 'none').
                    attr('fill', '#cccccc')).
                    append(client.createSVGElement('path').
                    attr('d', 'M 3 3 L 11 11').
                    attr('stroke-width', '2').attr('stroke', '#333333').
                    attr('fill', 'none')).
                    append(client.createSVGElement('path').
                    attr('d', 'M 3 11 L 11 3').
                    attr('stroke-width', '2').attr('stroke', '#333333').
                    attr('fill', 'none')).
                    on('mousedown', function (event) {
                    event.preventDefault();
                }).on('click', function (event) {
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
                    text(title)).
                    append($closeButton).
                    append($('<br/>').css('clear', 'both')).
                    on('mousedown', mouseDownHandler).
                    on('dblclick', function (event) {
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
                    append($content));
                function moveTo(x, y) {
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
                    x = Math.max(minX, Math.min(x, maxX));
                    y = Math.max(minY, Math.min(y, maxY));
                    $win.css({ left: x + 'px', top: y + 'px' });
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
    })(client = wsproj.client || (wsproj.client = {}));
})(wsproj || (wsproj = {}));
'use strict';
var wsproj;
(function (wsproj) {
    var client;
    (function (client) {
        function createDataTableConfig() {
            return {
                sortId: null,
                sortOrder: null,
                accepts: {}
            };
        }
        function updateTask(data) {
            client.fixWideStr(data, 'term', client.termFilter);
            client.fixWideStr(data, 'priority', client.priorityFilter);
            client.fixWideStr(data, 'origEst', client.hourFilter);
            client.fixWideStr(data, 'currEst', client.hourFilter);
            // TODO delete
            delete data.minTermRange;
            delete data.maxTermRange;
            // overwrite elapsed, currEst
            var elapsed = 0;
            var minAct = null;
            var maxAct = null;
            for (var id in data) {
                if (client.isActDate(id)) {
                    client.fixWideStr(data, id, client.hourFilter);
                    elapsed += client.strToNum(data[id]);
                    var date = id.substring(3);
                    if (minAct == null || minAct > date) {
                        minAct = date;
                    }
                    if (maxAct == null || maxAct < date) {
                        maxAct = date;
                    }
                }
            }
            if (minAct != null) {
                data.minAct = minAct;
            }
            else {
                delete data.minAct;
            }
            if (maxAct != null) {
                data.maxAct = maxAct;
            }
            else {
                delete data.maxAct;
            }
            if (elapsed == 0) {
                data.currEst = data.origEst;
            }
            if (elapsed != 0) {
                data.elapsed = client.hourToStr(elapsed);
            }
            else {
                delete data.elapsed;
            }
            if (data.origEst || data.currEst || data.elapsed) {
                data.remain = client.hourToStr(client.strToNum(data.currEst) - elapsed);
            }
            else {
                delete data.remain;
            }
            // cleanup empty data
            cleanupData(data);
        }
        function cleanupData(data) {
            var emptyIds = [];
            for (var id in data) {
                var val = data[id];
                if (val == null || (typeof val == 'string' && val.length == 0)) {
                    emptyIds.push(id);
                }
            }
            for (var i = 0; i < emptyIds.length; i += 1) {
                delete data[emptyIds[i]];
            }
        }
        function showEditing($table, $cell, data) {
            //var typing = data.typing;
            var $target = $table.parent();
            function getOffset($cell) {
                var o1 = $cell.offset();
                var o2 = $target.offset();
                o1.left -= o2.left;
                o1.top -= o2.top;
                return o1;
            }
            var off = getOffset($cell);
            var $editing = $('<div></div>').
                addClass('wsproj-editing').
                css('background-color', client.styleConsts.editingColor).
                css('position', 'absolute').
                css('pointer-events', 'none').
                css('left', off.left + 'px').
                css('top', off.top + 'px').
                css('width', $cell.outerWidth() + 'px').
                css('height', $cell.outerHeight() + 'px');
            /*
                if (data.userName) {
                  $editing.append($('<span></span>').css('position', 'relative').
                    append($('<span></span>').
                      css('position', 'absolute').
                      css('white-space', 'nowrap').
                      css('left', '0px').css('top', '0px').text(data.userName) ) );
                }
            */
            $target.append($editing);
            var step = 10;
            function fade() {
                if (step < 0) {
                    $editing.remove();
                }
                else {
                    $editing.css('opacity', 0.05 * step);
                    /*
                              if (typing) {
                                var gap = 0.5 * (10 - step);
                                $editing.css('left', (off.left - gap) + 'px').
                                  css('top', (off.top - gap) + 'px').
                                  css('width', ($cell.outerWidth() + gap * 2) + 'px').
                                  css('height', ($cell.outerHeight() + gap * 2) + 'px');
                              }
                    */
                    step -= 1;
                    window.setTimeout(fade, 100);
                }
            }
            fade();
        }
        function createButtonUI(label) {
            return $('<span></span>').addClass('wsproj-button').text(label).
                on('mousedown', function (event) { event.preventDefault(); });
        }
        //-------------------------------------------------------
        // create client
        //
        function create(opts) {
            var sid = null;
            var loginUser = null;
            var onlineStatusUI = null;
            var taskAddUpConfigUI = null;
            var dataTable = null;
            var messages = null;
            var decorator = opts.decorator || null;
            function applyDecoration($target) {
                if (decorator) {
                    decorator($target);
                }
            }
            var ws = client.createWS(opts.url);
            ws.actions.open = function (data) {
                ws.send({
                    action: 'login',
                    uid: opts.uid,
                    lang: navigator.language
                });
            };
            ws.actions.close = function (data) {
                onlineStatusUI.setOnline(false);
            };
            ws.actions.login = function (data) {
                sid = data.sid;
                messages = data.messages;
                var initialized = (dataTable != null);
                if (!initialized) {
                    loginUser = { userId: data.uid, userName: data.user };
                    initDataTable();
                    client.setupLabels(dataTable.$table.children('THEAD'), dataTable.tableModel.userData);
                }
                onlineStatusUI.setOnline(true);
                // projectGroups
                var projectGroups = [];
                !function () {
                    var columnMap = dataTable.tableModel.userData.columnMap;
                    columnMap['projectGroup'].dropdownModel.getItems = function (data) {
                        return projectGroups;
                    };
                }();
                $.ajax({
                    type: 'POST',
                    url: opts.servletUrl,
                    data: { fn: 'getProjectGroups' }
                }).done(function (data) {
                    projectGroups = data;
                    getTasks();
                });
                function getTasks() {
                    var projectIdList = [];
                    $.each(projectGroups, function (i, projectGroup) {
                        $.each(projectGroup.projects, function (i, project) {
                            projectIdList.push(project.projectId);
                        });
                    });
                    $.each(projectIdList, function (i, projectId) {
                        ws.send({ action: 'watchTasks', projectId: projectId });
                    });
                    $.ajax({
                        type: 'POST',
                        url: opts.servletUrl,
                        data: { projectId: projectIdList }
                    }).done(function (tasks) {
                        $.each(tasks, function (i, task) {
                            dataTable.updateRow(task, true, false);
                        });
                        if (!initialized) {
                            getUserData('dataTableConfig');
                            getUserData('columnWidthConfig');
                            getUserData('taskAddUpConfig');
                        }
                        else {
                            dataTable.$table.trigger('rowViewChange');
                        }
                        // clean...
                        putUserData('test', null);
                    });
                }
            };
            ws.actions.updateUserData = function (data) {
                if (data.key == 'dataTableConfig') {
                    !function () {
                        var config = data.value;
                        if (!config) {
                            config = createDefaultDataTableConfig();
                        }
                        dataTable.setConfig(config);
                    }();
                }
                else if (data.key == 'columnWidthConfig') {
                    !function () {
                        var config = data.value;
                        if (!config) {
                            config = { widthMap: {} };
                        }
                        dataTable.setColumnWidthConfig(config);
                    }();
                }
                else if (data.key == 'taskAddUpConfig') {
                    !function () {
                        var config = data.value;
                        if (!config) {
                            config = { beginOfWeek: '1', beginOfMonth: '1' };
                        }
                        taskAddUpConfigUI.setConfig(config);
                    }();
                }
            };
            function putUserData(key, value) {
                ws.send({ action: 'putUserData', key: key, value: value });
            }
            function getUserData(key) {
                ws.send({ action: 'getUserData', key: key });
            }
            ws.actions.updateTask = function (data) {
                var created = (data.sid == sid && data.lastTaskId == 0);
                dataTable.updateRow(data.task, false, created);
                dataTable.$table.trigger('rowViewChange');
            };
            ws.actions.editing = function (data) {
                if (data.sid == sid) {
                    return;
                }
                var $editingCell = null;
                dataTable.$table.children('TBODY').children().each(function () {
                    var $row = $(this);
                    var dataRow = $row.data('dataRow');
                    if (dataRow && dataRow.data.id == data.rowId) {
                        $row.children().each(function (i) {
                            var column = dataTable.tableModel.columns[i];
                            if (dataTable.tableModel.getDataId(column.id) == data.colId) {
                                $editingCell = $(this);
                            }
                        });
                    }
                });
                if ($editingCell != null) {
                    showEditing(dataTable.$table, $editingCell, data);
                }
            };
            function createDefaultDataTableConfig() {
                var config = createDataTableConfig();
                config.accepts['user'] = [loginUser.userName];
                config.accepts['term'] = [client.getDefaultTerm()];
                return config;
            }
            function initDataTable() {
                var tableModel = client.createTaskManagerTableModel(messages, 14, loginUser);
                if (opts.numPageRows) {
                    tableModel.numPageRows = opts.numPageRows;
                }
                dataTable = client.createDataTable(tableModel, messages, applyDecoration);
                dataTable.$table.on('rowChange', function (event, data) {
                    updateTask(data);
                    if (!data.projectId) {
                        return;
                    }
                    ws.send({ action: 'putTask', task: data });
                }).on('rowDelete', function (event, data) {
                    updateTask(data);
                    data.deleted = true;
                    ws.send({ action: 'putTask', task: data });
                }).on('columnWidthChange', function (event, data) {
                    putUserData('columnWidthConfig', dataTable.getColumnWidthConfig());
                }).on('rowViewChange', function (event, data) {
                    putUserData('dataTableConfig', dataTable.getConfig());
                    putUserData('taskAddUpConfig', taskAddUpConfigUI.getConfig());
                }).on('keydown', function (event) {
                    if (event.altKey) {
                        if (event.keyCode == client.DOM_VK.UP) {
                            event.preventDefault();
                            $currWeek.trigger('click');
                        }
                        else if (event.keyCode == client.DOM_VK.DOWN) {
                            event.preventDefault();
                        }
                        else if (event.keyCode == client.DOM_VK.PAGE_UP ||
                            event.keyCode == client.DOM_VK.LEFT) {
                            event.preventDefault();
                            $prevWeek.trigger('click');
                        }
                        else if (event.keyCode == client.DOM_VK.PAGE_DOWN ||
                            event.keyCode == client.DOM_VK.RIGHT) {
                            event.preventDefault();
                            $nextWeek.trigger('click');
                        }
                    }
                    sendEditing($(event.target).parent(), true);
                }).on('beginEdit', function (event, data) {
                    if (data.userOp) {
                        sendEditing($(event.target), false);
                    }
                });
                dataTable.$table.children('THEAD').on('contextmenu', head_contextMenuHandler);
                var $help = createButtonUI(messages.HELP).
                    css('margin-right', '8px').
                    on('click', function (event) {
                    var $helpBody = $('<tbody></tbody>');
                    $.each(messages.HELPS, function (i, help) {
                        $helpBody.append($('<tr></tr>').
                            append($('<td></td>').css('text-align', 'right').
                            text(help[0] + ':')).
                            append($('<td></td>').text(help[1])));
                    });
                    client.openWindow($('<table></table>').append($helpBody), '');
                });
                var $donwloadForm = null;
                var $download = createButtonUI(messages.DOWNLOAD).
                    css('margin-right', '8px').
                    on('click', function (event) {
                    if ($donwloadForm == null) {
                        var createHidden = function (id) {
                            return $('<input type="hidden" />').
                                attr('id', id).attr('name', id);
                        };
                        $donwloadForm = $('<form></form>').
                            attr('method', 'POST').
                            attr('action', opts.servletUrl).
                            css('display', 'none').
                            append(createHidden('filename')).
                            append(createHidden('idList')).
                            append(createHidden('fn').val('downloadTasks'));
                        $('BODY').append($donwloadForm);
                    }
                    var rows = dataTable.getRowView();
                    var idList = '';
                    for (var i = 0; i < rows.length; i += 1) {
                        if (i > 0) {
                            idList += ',';
                        }
                        idList += '' + rows[i].data.id;
                    }
                    $donwloadForm.children('#filename').val('tasks_' +
                        client.formatDate(client.getToday()) + '.xml');
                    $donwloadForm.children('#idList').val(idList);
                    $donwloadForm.submit();
                });
                var $currWeek = createButtonUI(messages.CURR_WEEK).
                    on('click', function (event) {
                    var tm = dataTable.tableModel.userData;
                    tm.baseDate = client.getDefaultBaseDate();
                    refreshTable();
                });
                var $prevWeek = createButtonUI(messages.PREV_WEEK).
                    on('click', function (event) {
                    var tm = dataTable.tableModel.userData;
                    tm.baseDate = client.rollDate(tm.baseDate, -7);
                    refreshTable();
                });
                var $nextWeek = createButtonUI(messages.NEXT_WEEK).
                    on('click', function (event) {
                    var tm = dataTable.tableModel.userData;
                    tm.baseDate = client.rollDate(tm.baseDate, 7);
                    refreshTable();
                });
                onlineStatusUI = client.createOnlineStatusUI();
                taskAddUpConfigUI = client.createTaskAddUpConfigUI(dataTable, messages);
                $ui.append(taskAddUpConfigUI.$ui.css('float', 'left'));
                taskAddUpConfigUI.$ui.find('TR').prepend($('<td></td>').css('vertical-align', 'middle').
                    append(onlineStatusUI.$ui));
                var $buttonPane = $('<div></div>').css('float', 'right').
                    append($help).
                    append($download).
                    append($prevWeek).append($currWeek).append($nextWeek);
                $ui.append($buttonPane);
                $ui.append($('<br/>').css('clear', 'both'));
                $ui.append(dataTable.$ui);
            }
            function sendEditing($td, typing) {
                var dataRow = $td.parent().data('dataRow');
                if (dataRow) {
                    var column = dataTable.tableModel.columns[$td.index()];
                    ws.send({ action: 'editing',
                        userId: loginUser.userId,
                        userName: loginUser.userName,
                        projectId: dataRow.data.projectId,
                        rowId: dataRow.data.id,
                        colId: dataTable.tableModel.getDataId(column.id),
                        typing: typing });
                }
            }
            function refreshTable() {
                client.setupLabels(dataTable.$table.children('THEAD'), dataTable.tableModel.userData);
                dataTable.invalidate();
                dataTable.validate();
            }
            function head_contextMenuHandler(event) {
                event.preventDefault();
                var $menu = client.createMenu([
                    { label: messages.CLEAR_FILTER },
                    { label: messages.APPLY_DEFAULT_FILTER },
                    { label: messages.OPEN_ADD_UP_VIEW }
                ]).
                    css('left', event.pageX + 'px').
                    css('top', event.pageY + 'px').
                    on('menuItemSelected', function (event, item) {
                    if (item.label == messages.CLEAR_FILTER) {
                        dataTable.setConfig(createDataTableConfig());
                    }
                    else if (item.label == messages.APPLY_DEFAULT_FILTER) {
                        dataTable.setConfig(createDefaultDataTableConfig());
                    }
                    else if (item.label == messages.OPEN_ADD_UP_VIEW) {
                        openAddUpView();
                    }
                });
            }
            function openAddUpView() {
                function rowViewChangeHandler(event) {
                    addUpTable.updateRowView();
                }
                var addUpTable = client.createTaskManagerAddUpTable(dataTable, messages, applyDecoration);
                addUpTable.updateRowView();
                dataTable.$table.on('rowViewChange', rowViewChangeHandler);
                client.openWindow(addUpTable.$ui, messages.ADD_UP).
                    on('dispose', function (event) {
                    dataTable.$table.off('rowViewChange', rowViewChangeHandler);
                });
            }
            ws.start();
            var $ui = $('<div></div>').css('text-align', 'left').addClass('wsproj');
            return $ui;
        }
        client.create = create;
    })(client = wsproj.client || (wsproj.client = {}));
})(wsproj || (wsproj = {}));
