'use strict';
namespace wsproj.client {

  export var NBSP = '\u00a0';
  export var CMT_SUFFIX = '$C';
  export var MAX_CELL_VALUE = 140;

  export var styleConsts = {
    errorColor: '#ff0000',
    holidayBgColor: '#ffeeee',
    addUpSumBgColor: '#ffcc66',
    todayBgColor: '#ddffdd',
    readonlyBgColor: '#f0f0f0',
    currentCellColor: '#0066ff',
    currentRowColor: '#0066ff',
    editingColor:'#ffdd99',
    emptyBgColor: '#cccccc',
    commentBgColor: '#ffffe0',
    cellPadding: 2,
    _: ''
  };

  export var DOM_VK = {
    TAB : 0x09,
    RETURN : 0x0d,
    ESCAPE : 0x1b,
    SPACE : 0x20,
    PAGE_UP : 0x21,
    PAGE_DOWN : 0x22,
    LEFT : 0x25,
    UP : 0x26,
    RIGHT : 0x27,
    DOWN : 0x28,
    F2 : 0x71
  };

  export var SortOrder = {
    ASC : 'asc',
    DESC : 'desc'
  };
}
