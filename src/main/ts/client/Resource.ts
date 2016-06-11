'use strict';
namespace wsproj.client {

  var weekDays = 'SU,MO,TU,WE,TH,FR,SA'.split(',');

  function parseDate(date : string) {
    if (date.match(/^(\d{4})(\d{2})(\d{2})$/) ||
        date.match(/^(\d+)\D+(\d+)\D+(\d+)$/) ) {
      return new Date(+RegExp.$1, +RegExp.$2 - 1, +RegExp.$3).getTime();
    } else {
      return null;
    }
  }

  var termFuncCache : { [term : string] : ( (date : Date) => boolean) } = {}

  function getTermFunc(term : string) : ( (date : Date) => boolean) {
    var fn = termFuncCache[term];
    if (!fn) {
      fn = getTermFuncImpl(term);
      termFuncCache[term] = fn;
    }
    return fn;
  }

  function getTermFuncImpl(term : string) : ( (date : Date) => boolean) {
    for (var i = 0; i < weekDays.length; i += 1) {
      if (term.indexOf(weekDays[i]) == 0) {
        var day = i;
        return (date) => date.getDay() == day;
      }
    }
    var dateFrom : number;
    var dateTo : number;
    var index = term.indexOf('~');
    if (index == -1) {
      dateFrom = parseDate(term);
      if (dateFrom != null) {
        return (date) => date.getTime() == dateFrom;
      }
    } else if (index == 0) {
      dateTo = parseDate(term.substring(index + 1) );
      if (dateTo != null) {
      return (date) => date.getTime() <= dateTo;
      }
    } else if (index == term.length - 1) {
      dateFrom = parseDate(term.substring(0, index) );
      if (dateFrom != null) {
        return (date) => dateFrom <= date.getTime();
      }
    } else {
      dateFrom = parseDate(term.substring(0, index) );
      dateTo = parseDate(term.substring(index + 1) );
      if (dateFrom != null && dateTo != null) {
        return (date) => dateFrom <= date.getTime() &&
          date.getTime() <= dateTo;
      }
    }
    return null;
  }

  function parseResourceLine(line : string) :
      ( (date : Date, user : string) => number) {
    var index = line.indexOf('#');
    if (index != -1) {
      line = line.substring(0, index);
    }
    line = trim(line);
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
    if (isNaN(hours) ) {
      return null;
    }
    var users = items[2].split(/,/g);
    if (users.length == 0) {
      return null;
    }
    var termFuncs : ((date : Date) => boolean)[] = [];
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
    var userFunc = acceptAllUsers?
      (user : string) => true :
      (user : string) => {
        for (var i = 0; i < users.length; i += 1) {
          if (users[i] == user) {
            return true;
          }
        }
        return false;
      };
    return (date : Date, user : string) => {
      var termMatch = false;
      for (var i = 0; i < termFuncs.length; i += 1) {
        if (termFuncs[i](date) ) {
          termMatch = true;
          break;
        }
      }
      return termMatch && userFunc(user)? hours : null;
    }
  }

  export function parseResource(data : string) {
    var funcs : ( (date : Date, user : string) => number)[] = [];
    var lines = data.split(/\n/g);
    for (var i = 0; i < lines.length; i += 1) {
      var fn = parseResourceLine(lines[i]);
      if (fn) {
        funcs.push(fn);
      }
    }
    return (date : Date, user : string) => {
      for (var i = 0; i < funcs.length; i+= 1) {
        var hours = funcs[i](date, user);
        if (hours != null) {
          return hours
        }
      }
      return null;
    };
  }
}
