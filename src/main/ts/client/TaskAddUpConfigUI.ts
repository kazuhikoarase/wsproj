'use strict';
namespace wsproj.client {

  export function createTaskAddUpConfigUI(
    dataTable : DataTable<TaskManager>,
    messages : any
  ) : TaskAddUpConfigUI {
    function triggerRowViewChange() {
      dataTable.tableModel.userData.taskAddUpConfig = getConfig();
      dataTable.$table.trigger('rowViewChange');
    }
    function setConfig(config : TaskAddUpConfig) {
      $weekSelect.val(config.beginOfWeek || '1');
      $monthSelect.val(config.beginOfMonth || '1');
      triggerRowViewChange();
    }
    function getConfig() : TaskAddUpConfig {
      return {
        beginOfWeek : $weekSelect.val(),
        beginOfMonth : $monthSelect.val()
      };
    }
    var $opt : JQuery;
    var $weekSelect = $('<select></select>').
      addClass('wsproj-select').on('change', function(event) {
        triggerRowViewChange();
      });
    for (var i = 0; i < 7; i += 1) {
      var day = (i + 1) % 7;
      $weekSelect.append($('<option></option>').
        val('' + day).text(messages.DAY_OF_WEEK[day]) );
    }
    var $monthSelect = $('<select></select>').
      addClass('wsproj-select').on('change', function(event) {
        triggerRowViewChange();
      });
    for (var i = 0; i < 28; i += 1) {
      var date = i + 1;
      $monthSelect.append($('<option></option>').
        val('' + date).text(formatNumber(date, 2) ) );
    }
    var dayLabel = messages.DAY_OF_WEEK.substring(0, 1);
    var $settingTable = $('<table></table>');
    var $tbody = $('<tbody></tbody>');
    $settingTable.append($tbody);
    $tbody.append($('<tr></tr>').
      append($('<td></td>').text(messages.BEGIN_OF_WEEK) ).
      append($('<td></td>').append($weekSelect) ).
      append($('<td></td>').text(messages.BEGIN_OF_MONTH) ).
      append($('<td></td>').append($monthSelect).append(
        $('<span></span>').text(dayLabel) ) ) );
    return {
      $ui: $settingTable,
      setConfig : setConfig,
      getConfig : getConfig
    };
  }
}
