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

  //-------------------------------------------------------
  // create websocket
  //

  export function createWS(url : string) {

    var ws : WebSocket = null;

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
      reopen();
    };

    var onmessage = function(event : any) {
      var data = JSON.parse(event.data);
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
      ws.send(JSON.stringify(data) );
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
