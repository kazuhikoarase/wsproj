'use strict';

!function(global : any) {
  var console = global.console;
  global.console = {
    log: function(msg : string) {
      if (location.hostname == 'localhost') {
        console.log(msg);
      }
    }
  };
}(window);

namespace wsproj.client {

  var dataManager = function() {
    var buffer : { [ sid : string ] : string } = {};
    var maxLength = 8000;
    return {
      parse : function(msg : string) : any {
        var msgs = msg.match(/^;([^;]+)([;\$])(.*)$/);
        if (msgs) {
          var sid = msgs[1];
          var dlm = msgs[2];
          var dat = msgs[3];
          var data : any = null;
          if (dlm == '$') {
            data = JSON.parse(buffer[sid] || '{}');
            delete buffer[sid];
          } else {
            buffer[sid] = (buffer[sid] || '') + dat;
          }
          return data;
        } else {
          return JSON.parse(msg);
        }
      },
      send : function(send : (msg : string) => void,
          sid : string, msg : string) {
        var msgs : string[] = [];
        while (msg.length > maxLength) {
          msgs.push(msg.substring(0, maxLength) );
          msg = msg.substring(maxLength);
        }
        if (msgs.length == 0) {
          send(msg);
        } else {
          msgs.push(msg);
          for (var i = 0; i < msgs.length; i += 1) {
            send(';' + sid + ';' + msgs[i]);
          }
          send(';' + sid + '$');
        }
      }
    }
  }();

  //-------------------------------------------------------
  // create websocket
  //

  export function createWS(url : string) {

    var ws : WebSocket = null;
    var sid : string = null;

    var actions : any = {};

    var onopen = function(event : any) {
      console.log(event.type);
    };

    var onclose = function(event : any) {
      console.log(event.type);

      var data = {action: 'close'};
      var action = (<any>actions)[data.action];
      if (action) {
        action(data);
      }

      ws = null;
      sid = null;
      reopen();
    };

    var onmessage = function(event : any) {
      var data = dataManager.parse(event.data);
      if (data == null) {
        return;
      }
      if (data.action == 'open') {
        sid = data.sid;
      }
      console.log(JSON.stringify(data, null, 2) );
      var action = (<any>actions)[data.action];
      if (action) {
        action(data);
      }
    };

    var onerror = function(event : any) {
      console.log(event.type);
    };

    var initWS = function() {
      var ws = new WebSocket(url);
      ws.onopen = onopen;
      ws.onclose = onclose;
      ws.onmessage = onmessage;
      ws.onerror = onerror;
      return ws;
    };

    var reopen = function() {
      window.setTimeout(function() {
        if (navigator.onLine) {
          ws = initWS();
        } else {
          reopen();
        }
      }, 5000);
    };

    var send = function(data : any) {
      if (ws == null) {
        return;
      }
      dataManager.send(function(msg) { ws.send(msg); },
        sid, JSON.stringify(data) );
    };

    var start = function() {
      ws = initWS();
    }

    return {
      send: send,
      actions: actions,
      start: start
    }
  }
}
