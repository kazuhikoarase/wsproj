declare module wsproj.client {

  interface TaskUser {
    userId : string,
    userName : string
  }

  interface TaskManager {
    baseDate : Date,
    numDays : number,
    taskAddUpConfig : TaskAddUpConfig,
    columnMap : { [id : string] : DataColumn }
  }

  interface OnlineStatusUI {
    $ui : JQuery,
    setOnline : (online : boolean) => void
  }

  interface TaskAddUpConfigUI {
    $ui : JQuery,
    setConfig : (config : TaskAddUpConfig) => void,
    getConfig : () => TaskAddUpConfig
  }

  interface TaskAddUpConfig {
    beginOfWeek : string,
    beginOfMonth : string
  }

  interface TaskManagerAddUpTable {
    $ui : JQuery,
    updateRowView : () => void
  }
}
