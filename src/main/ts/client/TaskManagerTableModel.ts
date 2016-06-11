'use strict';
namespace wsproj.client {

  export function createTaskManagerTableModel(
    messages : any,
    numDays : number,
    loginUser : TaskUser
  ) {

    function getProjectGroups(data : any) {
      return columnMap['projectGroup'].dropdownModel.getItems(data);
    }

    function getProjects(data : any) : any[] {
      var model = columnMap['projectGroup'].dropdownModel;
      var projectGroups = getProjectGroups(data);
      var projects : any[] = null;
      for (var i = 0; i < projectGroups.length; i += 1) {
        var projectGroup = projectGroups[i];
        if (projectGroup[model.valueField] == data[model.dataField]) {
          projects = projectGroup.projects;
        }
      }
      return projects || [];
    }

    function getUsers(data : any) : any[] {
      var model = columnMap['project'].dropdownModel;
      var projects = getProjects(data);
      var users : any[] = null;
      for (var i = 0; i < projects.length; i += 1) {
        var project = projects[i];
        if (project[model.valueField] == data[model.dataField]) {
          users = project.users;
        }
      }
      return users || [];
    }

    var columns : DataColumn[] = [

      { id: 'id', label: 'ID', dataType: 'number', sortable: false },

      { id: 'projectGroup', label: messages.COL_LABEL_PROJECT_GROUP,
        textInputAssist: true,
        resizable: true,
        dropdownModel : {
          valueField : 'groupName',
          labelField : 'groupName',
          dataField : 'projectGroup',
          getItems : function(data : any) { return []; },
          commitValue : function(data : any, item : any) {
            delete data.project;
            delete data.projectId;
            delete data.user;
            delete data.userId;
          }
        },
        filter: {accepts : null}
      },
      { id: 'project', label: messages.COL_LABEL_PROJECT,
        textInputAssist: true,
        resizable: true,
        dropdownModel : {
          valueField : 'projectId',
          labelField : 'projectName',
          dataField : 'projectId',
          getItems : function(data : any) { return getProjects(data); },
          commitValue : function(data : any, item : any) {
            delete data.user;
            delete data.userId;
          }
        },
        filter: {accepts : null}
      },
      { id: 'term', label: messages.COL_LABEL_TERM, textInputAssist: true,
        resizable: true,
        filter: {accepts : null}
      },
      { id: 'user', label: messages.COL_LABEL_USER, textInputAssist: true,
        resizable: true,
        filter: {accepts : null},
        dropdownModel : {
          valueField : 'userId',
          labelField : 'userName',
          dataField : 'userId',
          getItems : function(data : any) {
            var users : any[] = [{userId:'',userName:''}];
            if (loginUser) {
              users.push(loginUser);
            }
            return users.concat(getUsers(data) ); },
          commitValue : function(data : any, item : any) {
            if (!data.userId) {
              delete data.userId;
            }
          }
        }
      },
      { id: 'comment', label: messages.COL_LABEL_COMMENT,
        resizable: true,
        filter: {accepts : null},
        sortable: false
      },
      { id: 'taskType1', label: messages.COL_LABEL_TASK_TYPE1,
        textInputAssist: true,
        resizable: true,
        filter: {accepts : null},
        groupLabel: messages.COL_LABEL_TASK_TYPE, groupSize: 4
      },
      { id: 'taskType2', label: messages.COL_LABEL_TASK_TYPE2,
        textInputAssist: true,
        resizable: true,
        filter: {accepts : null}
      },
      { id: 'taskType3', label: messages.COL_LABEL_TASK_TYPE3,
        textInputAssist: true,
        resizable: true,
        filter: {accepts : null}
      },
      { id: 'taskType4', label: messages.COL_LABEL_TASK_TYPE4,
        textInputAssist: true,
        resizable: true,
        filter: {accepts : null}
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
        filter: {accepts : null} },
      { id: 'origEst', label: messages.COL_LABEL_ORIG_EST, dataType: 'number',
        labelOrientation: 'vertical',
        minWidth: 20,
        filter: {accepts : null} },
      { id: 'currEst', label: messages.COL_LABEL_CURR_EST, dataType: 'number',
        labelOrientation: 'vertical',
        minWidth: 20,
        filter: {accepts : null} },
      { id: 'elapsed', label: messages.COL_LABEL_ELAPSED, dataType: 'number',
        labelOrientation: 'vertical',
        minWidth: 20,
        filter: {accepts : null} },
      { id: 'remain', label: messages.COL_LABEL_REMAIN, dataType: 'number',
        labelOrientation: 'vertical',
        minWidth: 20,
        filter: {accepts : null} },
      /*
      { id: 'minAct', label: messages.COL_LABEL_MIN_ACT_DATE,
        resizable: true,
        formatter : (value, data) => formatStrDate(value)
      },
      { id: 'maxAct', label: messages.COL_LABEL_MAX_ACT_DATE,
        resizable: true,
        formatter : (value, data) => formatStrDate(value)
      },
      */
    ];

    function formatStrDate(date : string) {
      return (typeof date == 'string' && date.length == 8)?
        date.substring(0, 4) + '/' +
        date.substring(4, 6) + '/' +
        date.substring(6, 8) : date;
    }

    for (var i = 0; i < numDays; i += 1) {
      var column : DataColumn = {
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

    var columnMap : { [id : string] : DataColumn } = {};
    columnMap = {};
    $.each(columns, function(i : number, column : DataColumn) {
      columnMap[column.id] = column;
    });

    var actIdRe = /^d[0-9]+$/;

    var tableModel : DataTableModel<TaskManager> = {
      userData : {
        baseDate : getDefaultBaseDate(),
        numDays : numDays,
        columnMap : columnMap,
        taskAddUpConfig : {
          beginOfWeek : '1',
          beginOfMonth : '1'
        }
      },
      numPageRows : 25,
      columns : columns,
      sortId : null,
      sortOrder : null,
      getDataId : (id : string) => {
        if (id.match(actIdRe) ) {
          return 'act' + formatDate(rollDate(
            tableModel.userData.baseDate,
            +id.substring(1) ) );
        }
        return id;
      },
      getDataValues : (id : string, dataRow : DataRow) => {

        var vals : string[] = [];
        var val = dataRow.data[id];
        if (typeof val == 'string' && val.length > 0) {
          vals.push(val);
        } else {
          vals.push('');
        }
        if (id == 'term' && !dataRow.data.term && dataRow.data.minAct) {
          var beginOfMonth = +tableModel.userData.taskAddUpConfig.beginOfMonth;
          for (id in dataRow.data) {
            if (isActDate(id) ) {
              vals.push(getTermByDate(id.substring(3), beginOfMonth) );
            }
          }
        }
        return vals;
      },
      getFootRow(rows : DataRow[]) {

        var sumIds = getTaskSumIds();

        var sumOp = addUpOp(strToNum, (a, b) => a + b);
        var minOp = addUpOp( (s) => s, (a, b) => a < b? a : b);
        var maxOp = addUpOp( (s) => s, (a, b) => a > b? a : b);

        var sum : any = {};
        var id : string;
        for (var i = 0; i < rows.length; i += 1) {
          var dataRow : DataRow = rows[i];
          for (var s = 0; s < sumIds.length; s += 1) {
            sumOp(dataRow.data, sum, sumIds[s]);
          }
          for (id in dataRow.data) {
            if (isActDate(id) ) {
              sumOp(dataRow.data, sum, id);
            }
          }
          minOp(dataRow.data, sum, 'minAct');
          maxOp(dataRow.data, sum, 'maxAct');
        }

        var data : any = { footer: true };
        for (id in sum) {
          if (id == 'minAct' || id == 'maxAct') {
            data[id] = sum[id];
          } else {
            data[id] = hourToStr(sum[id]);
          }
        }

        // show record count
        data.projectGroup = messageFormat(messages.RECORDS, rows.length);

        return data;
      },
      setDataRowStyle : (dataRow, styles) => {

        var data = dataRow.data;
        var today = formatDate(getToday() );
        //var limitDate = formatDate(rollDate(getToday(), 7) );

        for (var i = 0; i < tableModel.userData.numDays; i += 1) {
          var style = styles['d' + i];
          var day = i % 7;
          if (day == 5 || day == 6) {
            style.bgColor = styleConsts.holidayBgColor;
          }
          var date = formatDate(rollDate(tableModel.userData.baseDate, i) );
          if (date == today) {
            style.bgColor = styleConsts.todayBgColor;
          }
          if (!data.footer) {
            if (date > today) {
              if (data['act' + date]) {
                style.color = styleConsts.errorColor;
                style.title = messages.MSG_WARN_FUTURE_ACT;
              } else {
                style.readonly = true;
              }
            }
          }
        }

        if (data.addUpSumIds) {
          for (var id in data.addUpSumIds) {
            if (typeof data[tableModel.getDataId(id)] != 'undefined') {
              styles[id].bgColor = styleConsts.addUpSumBgColor;
            }
          }
        }

        if (data.footer) {
          $.each(styles, function(id : string, style : CellStyle) {
            style.readonly = true;
          });
          return;
        }

        // readonly, dropdown selectable
        styles['projectGroup'].readonly = true;
        styles['project'].readonly = true;
        styles['user'].readonly = true;

        function setReadonly(id : string) {
          styles[id].readonly = true;
          styles[id].bgColor = styleConsts.readonlyBgColor;
        }

        setReadonly('id');
        setReadonly('elapsed');
        setReadonly('remain');

        //setReadonly('minAct');
        //setReadonly('maxAct');

        var elapsed = strToNum(data.elapsed);
        var remain = strToNum(data.remain);

        if (elapsed == 0) {
          setReadonly('currEst');
        } else {
          setReadonly('origEst');
        }

        if (remain < 0) {
          styles['currEst'].color = styleConsts.errorColor;
          styles['currEst'].title = messages.MSG_WARN_CURR_EST;
          styles['remain'].color = styleConsts.errorColor;
          styles['remain'].title = messages.MSG_WARN_CURR_EST;
        }
      },
      dupColumns : [
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

  export function setupLabels($head : JQuery, tm : TaskManager) {
    var cells = $head.data('cells');
    var $cell : JQuery = null;
    for (var i = 0; i < tm.numDays; i += 1) {
      var date = rollDate(tm.baseDate, i);
      if (i % 7 == 0) {
        $cell = cells['group-header-d' + i];
        $cell.css('padding', '0px 0px 0px 4px').
          css('text-align', 'left');
        setText($cell, formatDate(date, '/') );
      }
      $cell = cells['header-d' + i];
      setText($cell, formatNumber(date.getDate(), 2) );
    }
  }

  function setText($cell : JQuery, text : string) {
    if ($cell.text() != text) {
      $cell.text(text);
    }
  }
}
