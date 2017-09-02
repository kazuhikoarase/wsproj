declare module wsproj.client {

  interface DataTable<T> {
    tableModel : DataTableModel<T>;
    $ui : JQuery;
    $table : JQuery;
    invalidate : () => void;
    validate : () => void;
    updateRow : (row : any, lazy : boolean, created : boolean) => void;
    getRowView : () => DataRow[];
    applyFilter : (columns : DataColumn[], rows : DataRow[]) => DataRow[];
    setConfig : (config : DataTableConfig) => void;
    getConfig : () => DataTableConfig;
    setColumnWidthConfig : (config : ColumnWidthConfig) => void;
    getColumnWidthConfig : () => ColumnWidthConfig;
  }

  interface DataRow {
    data : any;
    valid : boolean;
  }

  interface DataColumn {
    id : string;
    dataType? : string
    label : string;
    labelOrientation? : string;
    groupLabel? : string;
    groupSize? : number;
    textInputAssist? : boolean;
    filter? : DataColumnFilter;
    sortable? : boolean;
    resizable? : boolean;
    commentable? : boolean;
    dropdownModel? : DropdownModel;
    minWidth? : number;
    formatter? : (value : string, data : any) => string;
    unformatter? : (value : string, data : any) => string;
  }

  interface DataColumnFilter {
    accepts : FilterItems;
    keyword : string;
  }

  interface FilterItems {
    [val : string] : boolean;
  }

  interface DataTableConfig {
    rowFilterConfig : any;
    sortId : string;
    sortOrder : string;
    accepts : { [id : string]: string[] };
    keywords? : { [id : string]: string };
  }

  interface ColumnWidthConfig {
    widthMap: { [id : string]: number };
  }

  interface DataTableModel<T> {
    userData : T;
    numPageRows : number;
    columns : DataColumn[];
    rowFilterConfig : any;
    sortId : string;
    sortOrder: string;
    getDataId : (id : string) => string;
    getDataValues : (id : string, dataRow : DataRow) => string[];
    setDataRowStyle : (dataRow : DataRow, styles : CellStyles) => void;
    filter : (dataRow : DataRow) => boolean;
    getCursorColor : (dataRow : DataRow) => string;
    getFootRow : (rows : DataRow[]) => any;
    dupColumns : string[];
  }

  interface CellStyle {
    color : string;
    bgColor : string;
    readonly : boolean;
    title : string;
  }

  interface CellStyles {
    [id:string] : CellStyle;
  }

  interface DropdownModel {
    labelField : string;
    valueField : string;
    dataField : string;
    getItems : (data : any) => any[];
    emptyItem? : boolean;
    commitValue? : (data : any, item : any) => void;
  }

  interface ColumnResizeManager {
    setColumnWidth : (id : string, width : number) => void;
    getColumnWidth : (id : string) => number;
    getCss : (id : string) => any;
  }
}
