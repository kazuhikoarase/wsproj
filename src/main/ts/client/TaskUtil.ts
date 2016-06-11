'use strict';
namespace wsproj.client {

  export var isActDate = function() {
    var actRe = /^act[0-9]{8}$/;
    return function(id : string) {
      return !!id.match(actRe);
    }
  }();

  export function getTaskSumIds() {
    return [ 'origEst', 'currEst', 'elapsed', 'remain' ];
  }

  export function getDefaultTerm() {
    var date = getToday();
    return formatNumber(date.getFullYear(), 4) + '/' +
      formatNumber(date.getMonth() + 1, 2)
  }

  export function addUpOp<T>(conv : (val : string) => T, op : (a : T, b : T) => T) {
    return function(src : any, dst : any, id : string) {
      if (typeof src[id] != 'undefined') {
        var val = conv(src[id]);
        if (typeof dst[id] == 'undefined') {
          dst[id] = val;
        } else {
          dst[id] = op(dst[id], val);
        }
      }
    };
  }

  export function fixWideStr(data : any, id : string,
      filter : (s : string) => string) {
    if (typeof data[id] == 'string') {
      var val = data[id];
      val = toNarrowStr(val);
      if (filter) {
        val = filter(val);
      }
      data[id] = val;
    }
  }

  export function priorityFilter(s : string) {
    if (s.length == 0) {
      return s;
    }
    var n = Math.max(0, Math.min(~~strToNum(s), 9999) );
    if (n == 0) {
      return '';
    }
    return numToStr(n);
  }

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
  export function getToday() {
    return new Date();
  }

  export function getNearestDateByMonth(month : number) {
      var today = getToday();
      var date = new Date(today.getFullYear(), today.getMonth(), 1);
      var dm = month - date.getMonth() - 1;
      while (dm >= 6) {
        dm -= 12;
      }
      date.setMonth(date.getMonth() + dm);
      return date;
  }

  export function termFilter(s : string) {
    if (s.length == 0) {
      return s;
    } else if (s.match(/^(\d+)\D+(\d+)$/) ) {
      var y = strToNum(RegExp.$1);
      if (y < 100) {
        y += 2000;
      }
      var m = strToNum(RegExp.$2);
      m = Math.max(1, Math.min(m, 12) );
      return formatNumber(y, 4) + '/' + formatNumber(m, 2);
    } else if (s.match(/^\d+$/) ) {
      var date = getNearestDateByMonth(strToNum(s) );
      return formatNumber(date.getFullYear(), 4) + '/' +
        formatNumber(date.getMonth() + 1, 2)
    } else {
      return getDefaultTerm();
    }
  }

  export function hourFilter(s : string) {
    if (s.length == 0) {
      return s;
    }
    var n = strToNum(s);
    if (n <= 0) {
      return '';
    }
    return hourToStr(Math.max(0, Math.min(n, 9999) ) );
  }

  export function hourToStr(n : number) {
    n = ~~(n * 4) * 25;
    var sign = '';
    if (n < 0) {
      sign = '-';
      n = -n;
    }
    return sign + formatNumber(~~(n / 100), 0) +
      '.' + formatNumber(n % 100, 2);
  }

  export function getMonday(date : Date) {
    //   0 -6
    //   1  0
    //   2 -1
    //   6 -5
    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate() - (date.getDay() + 6) % 7);
  }

  export function getDefaultBaseDate() : Date {
    var today = getToday();
    var baseDate = getMonday(today);
    if (1 <= today.getDay() && today.getDay() <= 5) {
      // mon - fri
      baseDate = rollDate(baseDate, -7);
    }
    return baseDate;
  }

  export function getTermByDate(date : string, beginOfMonth : number) {
    if (+date.substring(6, 8) < beginOfMonth) {
      var tmpDate = strToDate(date);
      tmpDate.setMonth(tmpDate.getMonth() - 1);
      return formatDate(tmpDate, '/').substring(0, 7);
    } else {
      return date.substring(0, 4) + '/' + date.substring(4, 6);
    }
  }

  export function rollTerm(term : string, numMonths : number) {
    var date = new Date(
      +term.substring(0, 4),
      +term.substring(5, 7) - 1, 1);
    date.setMonth(date.getMonth() + numMonths);
    return formatDate(date, '/').substring(0, 7);
  }

  export function formatHour(hour : number) {
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
}
