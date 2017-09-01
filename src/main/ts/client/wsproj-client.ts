'use strict';
namespace wsproj.client {

  function createDataTableConfig() : DataTableConfig {
    return {
      sortId: null,
      sortOrder: null,
      accepts: {},
      keywords: {}
    };
  }

  function updateTask(data : any) {

    fixWideStr(data, 'term', termFilter);
    fixWideStr(data, 'priority', priorityFilter);
    fixWideStr(data, 'origEst', hourFilter);
    fixWideStr(data, 'currEst', hourFilter);

    // TODO delete
    delete data.minTermRange;
    delete data.maxTermRange;

    // overwrite elapsed, currEst
    var elapsed = 0;
    var minAct : string = null;
    var maxAct : string = null;

    for (var id in data) {
      if (isActDate(id) ) {
        fixWideStr(data, id, hourFilter);
        elapsed += strToNum(data[id]);
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
    } else {
      delete data.minAct;
    }
    if (maxAct != null) {
      data.maxAct = maxAct;
    } else {
      delete data.maxAct;
    }

    if (elapsed == 0) {
      data.currEst = data.origEst;
    }

    if (elapsed != 0) {
      data.elapsed = hourToStr(elapsed);
    } else {
      delete data.elapsed;
    }

    if (data.origEst || data.currEst || data.elapsed) {
      data.remain = hourToStr(strToNum(data.currEst) - elapsed);
    } else {
      delete data.remain;
    }

    // cleanup empty data
    cleanupData(data);
  }

  function cleanupData(data : any) {
    var emptyIds : string[] = [];
    for (var id in data) {
      var val = data[id];
      if (val == null || (typeof val == 'string' && val.length == 0) ) {
        emptyIds.push(id);
      }
    }
    for (var i = 0; i < emptyIds.length; i += 1) {
      delete data[emptyIds[i]];
    }
  }

  function showEditing($table : JQuery, $cell : JQuery, data : any) {

    //var typing = data.typing;
    var $target = $table.parent();

    function getOffset($cell : JQuery) {
      var o1 = $cell.offset();
      var o2 = $target.offset();
      o1.left -= o2.left;
      o1.top -= o2.top;
      return o1;
    }

    var off = getOffset($cell);
    var $editing = $('<div></div>').
      addClass('wsproj-editing').
      css('background-color', styleConsts.editingColor).
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
      } else {
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

  function createButtonUI(label : string) {
    return $('<span></span>').addClass('wsproj-button').text(label).
      on('mousedown', function(event) { event.preventDefault() } );
  }

  //-------------------------------------------------------
  // create client
  //
  export function create(opts : any) {

    var sid : string = null;
    var loginUser : TaskUser = null;
    var actDataRangeConfig : ActDataRangeConfig = null;
    var onlineStatusUI : OnlineStatusUI = null;
    var taskAddUpConfigUI : TaskAddUpConfigUI = null;
    var dataTable : DataTable<TaskManager> = null;
    var messages : any = null;
    var decorator : ($target : JQuery) => void = opts.decorator || null;

    function applyDecoration($target : JQuery) {
      if (decorator) {
        decorator($target);
      }
    }

    var ws = createWS(opts.url);

    ws.actions.open = function(data : any) {
      ws.send({
        action: 'login',
        uid: opts.uid,
        lang: navigator.language
      });
    };

    ws.actions.close = function(data : any) {
      onlineStatusUI.setOnline(false);
    }

    ws.actions.login = function(data : any) {

      sid = data.sid;
      messages = data.messages;

      var initialized = (dataTable != null);
      if (!initialized) {
        loginUser = {userId : data.uid, userName : data.user};
        initDataTable();
        setupLabels(
          dataTable.$table.children('THEAD'),
          dataTable.tableModel.userData);
      }

      onlineStatusUI.setOnline(true);

      // projectGroups
      var projectGroups : any[] = [];
      !function() {
        var columnMap = dataTable.tableModel.userData.columnMap;
        columnMap['projectGroup'].dropdownModel.getItems = function(data : any) {
          return projectGroups;
        }
      }();

      $.ajax({
        method: 'POST',
        url: opts.servletUrl,
        data: { fn: 'getProjectGroups' }
      }).done(function(data) {
        projectGroups = data;
        getTasks();
      });

      function getTasks() {

        var projectIdList : string[] = [];
        $.each(projectGroups, function(i : number, projectGroup : any) {
          $.each(projectGroup.projects, function(i : number, project : any) {
            projectIdList.push(project.projectId);
          });
        });
  
        $.each(projectIdList, function(i : number, projectId : string) {
          ws.send({ action: 'watchTasks', projectId: projectId });
        });

        $.ajax({
          method: 'POST',
          url: opts.servletUrl,
          data: { projectId: projectIdList }
        }).done(function(tasks) {
          $.each(tasks, function(i, task) {
            dataTable.updateRow(task, true, false);
          });
          if (!initialized) {
            getUserData('dataTableConfig');
            getUserData('actDateRangeConfig');
            getUserData('columnWidthConfig');
            getUserData('taskAddUpConfig');
          } else {
            dataTable.$table.trigger('rowViewChange');
          }

          // clean...
          putUserData('test', null);
        });
      }
    };

    ws.actions.updateUserData = function(data : any) {
      if (data.key == 'dataTableConfig') {
        !function() {
          var config : DataTableConfig = data.value;
          if (!config) {
            config = createDefaultDataTableConfig();
          }
          dataTable.setConfig(config);
        }();
      } else if (data.key == 'actDateRangeConfig') {
        !function() {
          var config : ActDataRangeConfig = data.value;
          if (!config) {
            config = createDefaultActDataRangeConfig();
          }
          setActDataRangeConfig(config);
        }();
      } else if (data.key == 'columnWidthConfig') {
        !function() {
          var config : ColumnWidthConfig = data.value;
          if (!config) {
            config = { widthMap : {} };
          }
          dataTable.setColumnWidthConfig(config);
        }();
      } else if (data.key == 'taskAddUpConfig') {
        !function() {
          var config : TaskAddUpConfig = data.value;
          if (!config) {
            config = { beginOfWeek : '1', beginOfMonth : '1' };
          }
          taskAddUpConfigUI.setConfig(config);
        }();
      }
    }

    function createDefaultActDataRangeConfig() {
      return { minAct : '', maxAct : '', includeNoActs : true };
    }

    function getActDataRangeConfig() {
      return actDataRangeConfig || createDefaultActDataRangeConfig();
    }

    function setActDataRangeConfig(config : ActDataRangeConfig) {
      actDataRangeConfig = config;
      dataTable.tableModel.filter = (dataRow : DataRow) => {
        var minAct = dataRow.data.minAct;
        var maxAct = dataRow.data.maxAct;
        if ( (!minAct || !maxAct) && !config.includeNoActs) {
          return false;
        }
        if (config.minAct && maxAct && config.minAct > maxAct ||
            config.maxAct && minAct && config.maxAct < minAct) {
          return false;
        }
        return true;
      }
      // apply filter
      dataTable.setConfig(dataTable.getConfig() );
    }

    function putUserData(key : string, value : any) {
      ws.send({ action: 'putUserData', key: key, value: value });
    }

    function getUserData(key : string) {
      ws.send({ action: 'getUserData', key: key });
    }

    ws.actions.updateTask = function(data : any) {
      var created = (data.sid == sid && data.lastTaskId == 0);
      dataTable.updateRow(data.task, false, created);
      dataTable.$table.trigger('rowViewChange');
    };

    ws.actions.editing = function(data : any) {
      if (data.sid == sid) {
        return;
      }
      var $editingCell : JQuery = null;
      dataTable.$table.children('TBODY').children().each(function() {
        var $row = $(this);
        var dataRow : DataRow = $row.data('dataRow');
        if (dataRow && dataRow.data.id == data.rowId) {
          $row.children().each(function(i) {
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
      var config : DataTableConfig = createDataTableConfig();
      config.accepts['user'] = [loginUser.userName];
      config.accepts['term'] = [getDefaultTerm()];
      return config;
    }

    function initDataTable() {
      var tableModel = createTaskManagerTableModel(messages, 14, loginUser);
      if (opts.numPageRows) {
        tableModel.numPageRows = opts.numPageRows;
      }
      dataTable = createDataTable(tableModel, messages, applyDecoration);
      dataTable.$table.on('rowChange', function(event, data) {
          updateTask(data);
          if (!data.projectId) {
            return;
          }
          ws.send({action: 'putTask', task: data});
        }).on('rowDelete', function(event, data) {
          updateTask(data);
          data.deleted = true;
          ws.send({action: 'putTask', task: data});
        }).on('columnWidthChange', function(event, data) {
          putUserData('columnWidthConfig', dataTable.getColumnWidthConfig() );
        }).on('rowViewChange', function(event, data) {
          putUserData('dataTableConfig', dataTable.getConfig() );
          putUserData('taskAddUpConfig', taskAddUpConfigUI.getConfig() );
        }).on('keydown', function(event) {
          if (event.altKey) {
            if (event.keyCode == DOM_VK.UP) {
              event.preventDefault();
              $currWeek.trigger('click');
            } else if (event.keyCode == DOM_VK.DOWN) {
              event.preventDefault();
            } else if (event.keyCode == DOM_VK.PAGE_UP ||
                event.keyCode == DOM_VK.LEFT) {
              event.preventDefault();
              $prevWeek.trigger('click');
            } else if (event.keyCode == DOM_VK.PAGE_DOWN ||
                event.keyCode == DOM_VK.RIGHT) {
              event.preventDefault();
              $nextWeek.trigger('click');
            }
          }
          sendEditing($(event.target).parent(), true);
        }).on('beginEdit', function(event, data) {
          if (data.userOp) {
            sendEditing($(event.target), false);
          }
        });

      dataTable.$table.children('THEAD').on('contextmenu',
        head_contextMenuHandler);

      var $help = createButtonUI(messages.HELP).
        css('margin-right', '8px').
        on('click', function(event) {
          var $helpBody = $('<tbody></tbody>');
          $.each(messages.HELPS, function(i, help) {
            $helpBody.append($('<tr></tr>').
              append($('<td></td>').css('text-align', 'right').
                text(help[0]+ ':')).
              append($('<td></td>').text(help[1]) ) );
          });
          openWindow($('<table></table>').append($helpBody), '');
        });

      var $donwloadForm : JQuery = null;
      var $download = createButtonUI(messages.DOWNLOAD).
        css('margin-right', '8px').
        on('click', function(event) {

          if ($donwloadForm == null) {
            var createHidden = function(id : string) {
              return $('<input type="hidden" />').
                attr('id', id).attr('name', id);
            };
            $donwloadForm = $('<form></form>').
              attr('method', 'POST').
              attr('action', opts.servletUrl).
              css('display', 'none').
              append(createHidden('filename') ).
              append(createHidden('idList') ).
              append(createHidden('minAct') ).
              append(createHidden('maxAct') ).
              append(createHidden('includeNoActs') ).
              append(createHidden('fn').val('downloadTasks') );
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
          var config = getActDataRangeConfig();
          $donwloadForm.children('#filename').val('tasks_' +
            formatDate(getToday() ) + '.xml');
          $donwloadForm.children('#idList').val(idList);
          $donwloadForm.children('#minAct').val(config.minAct);
          $donwloadForm.children('#maxAct').val(config.maxAct);
          $donwloadForm.children('#includeNoActs').
            val(config.includeNoActs? 'true' : 'false');
          $donwloadForm.submit();
        });

      var $currWeek = createButtonUI(messages.CURR_WEEK).
        on('click', function(event) {
          var tm = dataTable.tableModel.userData;
          tm.baseDate = getDefaultBaseDate();
          refreshTable();
        });
      var $prevWeek = createButtonUI(messages.PREV_WEEK).
        on('click', function(event) {
          var tm = dataTable.tableModel.userData;
          tm.baseDate = rollDate(tm.baseDate, -7);
          refreshTable();
        });
      var $nextWeek = createButtonUI(messages.NEXT_WEEK).
        on('click', function(event) {
          var tm = dataTable.tableModel.userData;
          tm.baseDate = rollDate(tm.baseDate, 7);
          refreshTable();
        });

      onlineStatusUI = createOnlineStatusUI();

      taskAddUpConfigUI = createTaskAddUpConfigUI(dataTable, messages);
      $ui.append(taskAddUpConfigUI.$ui.css('float', 'left') );

      taskAddUpConfigUI.$ui.find('TR').prepend(
        $('<td></td>').css('vertical-align', 'middle').
        append(onlineStatusUI.$ui) );

      var $buttonPane = $('<div></div>').css('float', 'right').
        append($help).
        append($download).
        append($prevWeek).append($currWeek).append($nextWeek);
      $ui.append($buttonPane);
      $ui.append($('<br/>').css('clear', 'both') );

      $ui.append(dataTable.$ui);
    }

    function sendEditing($td : JQuery, typing : boolean) {
      var dataRow : DataRow = $td.parent().data('dataRow');
      if (dataRow) {
        var column = dataTable.tableModel.columns[$td.index()];
        ws.send({ action: 'editing',
         userId : loginUser.userId,
         userName : loginUser.userName,
         projectId : dataRow.data.projectId,
         rowId : dataRow.data.id,
         colId : dataTable.tableModel.getDataId(column.id),
         typing : typing });
      }
    }

    function refreshTable() {
      setupLabels(
        dataTable.$table.children('THEAD'),
        dataTable.tableModel.userData);
      dataTable.invalidate();
      dataTable.validate();
    }

    function head_contextMenuHandler(event : JQueryEventObject) {

      event.preventDefault();

      var $menu = createMenu([
          { label : messages.CLEAR_FILTER },
          { label : messages.APPLY_DEFAULT_FILTER },
          { label : messages.ACT_FILTER },
          { label : messages.OPEN_ADD_UP_VIEW}
        ]).
        css('left', event.pageX + 'px').
        css('top', event.pageY + 'px').
        on('menuItemSelected', function(event, item) {
          if (item.label == messages.CLEAR_FILTER) {
            dataTable.setConfig(createDataTableConfig() );
          } else if (item.label == messages.APPLY_DEFAULT_FILTER) {
            dataTable.setConfig(createDefaultDataTableConfig() );
          } else if (item.label == messages.ACT_FILTER) {
            openActFilterView();
          } else if (item.label == messages.OPEN_ADD_UP_VIEW) {
            openAddUpView();
          }
        });
    }

    function openActFilterView() {

      var parseDate = function(end : boolean, val : string) {
        var date = new Date();
        if (val.match(/^([0-9]+)$/) ) {
          var d = strToNum(RegExp.$1);
          date.setDate(d);
          return date;
        } else if (val.match(/^([0-9]+)[^0-9]([0-9]+)$/) ) {
          if (RegExp.$1.length == 4) {
            var y = strToNum(RegExp.$1);
            var m = strToNum(RegExp.$2);
            if (!end) {
              date.setFullYear(y);
              date.setMonth(m - 1);
              date.setDate(1);
            } else {
              date.setFullYear(y);
              date.setMonth(m);
              date.setDate(0);
            }
          } else {
            var m = strToNum(RegExp.$1);
            var d = strToNum(RegExp.$2);
            date.setMonth(m - 1);
            date.setDate(d);
            var min = new Date();
            min.setMonth(min.getMonth() - 6);
            var max = new Date();
            max.setMonth(max.getMonth() + 6);
            if (min.getTime() > date.getTime() ) {
              date.setFullYear(date.getFullYear() + 1);
            } else if (max.getTime() < date.getTime() ) {
              date.setFullYear(date.getFullYear() - 1);
            }
          }
          return date;
        } else if (val.match(/^([0-9]+)[^0-9]([0-9]+)[^0-9]([0-9]+)$/) ) {
          var y = strToNum(RegExp.$1);
          var m = strToNum(RegExp.$2);
          var d = strToNum(RegExp.$3);
          date.setFullYear(y < 100? y + 2000 : y);
          date.setMonth(m - 1);
          date.setDate(d);
          return date;
        }
        return null;
      };

      var createDateField = function(end : boolean) {
        var _date : Date = null;
        var $tx = $('<input type="text"/>').
          attr('maxlength', '10').css('width', '80px').on('change', function(event) {
            var val = toNarrowStr($(this).val() );
            setDate(parseDate(end, val) );
          });
        var setDate = function(date : Date) {
          _date = date;
          $tx.val(date != null? formatDate(date, '/') : '');
        }
        var setValue = function(value : string) {
          setDate(strToDate(value) );
        };
        var getValue = function() {
          return _date != null? formatDate(_date, '') : '';
        };
        return {
          $ui : $('<span></span>').css('display', 'inline-block').append($tx),
          setValue : setValue,
          getValue : getValue
        };
      }

      var config = getActDataRangeConfig();

      var minActUI = createDateField(false);
      var maxActUI = createDateField(true);
      minActUI.setValue(config.minAct);
      maxActUI.setValue(config.maxAct);
      var $range = $('<div></div>').append(minActUI.$ui).
        append($('<span></span>').text(' ~ ') ).
        append(maxActUI.$ui);

      var $chk = $('<input type="checkbox"/>').
        css('vertical-align', 'middle').
        prop('checked', config.includeNoActs);
      var $incNA = $('<div></div>').append($chk).append($('<span></span>').
        css('vertical-align', 'middle').
        text(messages.INCLUDE_NO_ACTS).on('mousedown', function(event) {
          event.preventDefault();
          $chk.trigger('click');
        }) );

      openDialog($('<div></div>').append($range).append($incNA),
          [messages.OK, messages.CANCEL], messages.ACT_FILTER).on('dispose',
        function(event : JQueryEventObject, data : any) {
          if (data.detail != messages.OK) {
            return;
          }
          setActDataRangeConfig({
            includeNoActs : $chk.prop('checked'),
            minAct : minActUI.getValue(),
            maxAct : maxActUI.getValue()
          });
        } );
    }

    function openAddUpView() {

      function rowViewChangeHandler(event : JQueryEventObject) {
        addUpTable.updateRowView();
      }

      var addUpTable = createTaskManagerAddUpTable(
        dataTable, messages, applyDecoration);
      addUpTable.updateRowView();
      dataTable.$table.on('rowViewChange', rowViewChangeHandler);

      openWindow(addUpTable.$ui, messages.ADD_UP).
        on('dispose', function(event) {
          dataTable.$table.off('rowViewChange', rowViewChangeHandler);
        });
    }

    ws.start();

    var $ui = $('<div></div>').css('text-align', 'left').addClass('wsproj');
    return $ui;
  }
}
