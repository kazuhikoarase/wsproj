'use strict';
namespace wsproj.client {

  export function trim(s : string) {
    return s.replace(/^[\s\u3000]+|[\s\u3000]+$/g, '');
  }

  export function removeInvalidChars(s : string) {
      //0~8,b,c,e~1f,7f
    return s.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '');
  }

  export function strToNum(s : string) {
    var n = +s;
    return isNaN(n)? 0 : n;
  }

  export function numToStr(n : number) {
    return '' + n;
  }

  export var toNarrowStr = function() {
    var NARROW_NUMS = '@_*+/,-.' +
      '----';
    var WIDE_NUMS = '\uff20\uff3f\uff0a\uff0b\uff0f\uff0c\uff0d\uff0e' +
      '\u2010\u2015\u2014\u30fc';
    if (NARROW_NUMS.length != WIDE_NUMS.length) {
      throw 'toNarrowNum:' + NARROW_NUMS.length +
        '!=' + WIDE_NUMS.length;
    }
    var map : { [key : string] : string } = {};
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
    return function(s : string) {
      var ns = '';
      for (var i = 0; i < s.length; i += 1) {
        var c = s.charAt(i);
        ns += (map[c] || c);
      }
      return ns;
    }
  }();

  export var messageFormat : any = function(msg : string) {
    for (var i = 1; i < arguments.length; i += 1) {
      var re = new RegExp('\\{' + (i - 1) + '\\}', 'g');
      msg = msg.replace(re, arguments[i]);
    }
    return msg;
  };

  export function formatNumber(n : number, digit : number) {
    var s = '' + n;
    while (s.length < digit) {
      s = '0' + s;
    }
    return s;
  }

  export function rollDate(date : Date, numDays : number) {
     return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate() + numDays);
  }

  export function formatDate(date : Date,
      separator : string = '') : string {
    return formatNumber(date.getFullYear(), 4) +
      separator + formatNumber(date.getMonth() + 1, 2) +
      separator + formatNumber(date.getDate(), 2);
  }

  export function strToDate(s : string) : Date {
    if (typeof s == 'string' && s.length == 8) {
      return new Date(
        +s.substring(0, 4),
        +s.substring(4, 6) - 1,
        +s.substring(6, 8) );
    }
    return null;
  }

  export var parseLine = function(text : string,
      handle : (line : string) => void) {
    var start = 0;
    var index = 0;
    while (index < text.length) {
      var c = text.charAt(index);
      if (c == '\u0020' || c == '\t' || c == '\n') {
        if (start < index) {
          handle(text.substring(start, index) );
        }
        handle(c);
        start = index + 1;
      }
      index += 1;
    }
    if (start < index) {
      handle(text.substring(start, index) );
    }
  };

  export function createTimer() {
    var _name = 'default';
    var _time = 0;
    var _lap = 0;
    var _count = 0;
    function start(name = 'default') {
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
    return { start: start, end: end, log: log};
  }

  export function callLater(fn : () => void) {
    window.setTimeout(fn, 0);
  }
}
