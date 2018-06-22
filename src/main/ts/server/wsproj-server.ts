'use strict';

namespace wsproj.server {

  declare var Java : any;

  declare var context : any;
  declare var $global : any;
  declare var $servletContext : any;
  declare var $request : any;
  declare var $response : any;
  declare var $session : any;
  declare var $logger : any;

  
  var console = {
    log: function(msg : any) {
      $logger.info(msg);
    }
  };

  var getTime = () => +Java.type('java.lang.System').currentTimeMillis();

  var loadStream = function(stream : any) {
    var bout = new (Java.type('java.io.ByteArrayOutputStream'))();
    try {
      var fin = new (Java.type('java.io.BufferedInputStream'))(stream);
      try {
        var buf = Java.type('java.lang.reflect.Array').newInstance(
              Java.type('java.lang.Byte').TYPE, 4096);
        var len : number;
        while ( (len = fin.read(buf) ) != -1) {
          bout.write(buf, 0, len);
        }
      } finally {
        fin.close();
      }
    } finally {
      bout.close();
    }
    return bout.toByteArray();
  };

  var loadMessage = function(lang : string) {
    var filename = context.getAttribute('javax.script.filename');
    var index = filename.lastIndexOf('/');
    if (index == -1) {
      throw 'bad filename:' + filename;
    }
    var getResIn = function(lang : string) {
      return $servletContext.getResourceAsStream(
          filename.substring(0, index + 1) +
          'messages_' + lang + '.json');
    };
    var resIn = getResIn(lang);
    if (resIn == null && lang.indexOf('-') != -1) {
      resIn = getResIn(lang.replace(/\-.+$/, '') );
    }
    if (resIn == null) {
      resIn = getResIn('en');
    }
    return JSON.parse('' + new (Java.type('java.lang.String'))(
        loadStream(resIn), 'UTF-8') );
  };

  var $ = {
    each: function(it : any, f : any) {
      if (typeof it.splice == 'function') {
        for (var i = 0; i < it.length; i += 1) {
          f(i, it[i]);
        }
      } else {
        for (var k in it) {
          f(k, it[k]);
        }
      }
    }
  };

  function sync(lock : any, sync : () => void) {
    Java.type('ws.ISync').sync.sync(lock,
        new (Java.type('ws.ISync'))({ sync: sync } ) );
  }

  function getWatchList() {
    $global.putIfAbsent('wsprojWatchList', {});
    return $global.get('wsprojWatchList');
  }

  function watch(watchName : string) {
    var watchList = getWatchList();
    if (!watchList[watchName]) {
      watchList[watchName] = {};
    }
    var sid = '' + $session.getId();
    watchList[watchName][sid] = sid;
  }

  function getWatchSidList(watchName : string) : string[] {
    var watchList = getWatchList();
    var sids : string[] = [];
    if (watchList[watchName]) {
      $.each(watchList[watchName], function(sid : string, sid_ : string) {
        sids.push(sid);
      });
    }
    return sids;
  }

  function unwatch(watchName : string, sid : string) : void {
    var watchList = getWatchList();
    if (watchList[watchName]) {
      delete watchList[watchName][sid];
    }
  }

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
          sync(buffer, function() {
            if (dlm == '$') {
              data = JSON.parse(buffer[sid] || '{}');
              delete buffer[sid];
            } else {
              buffer[sid] = (buffer[sid] || '') + dat;
            }
          });
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

  function createWS() {

    var actions : any = {};

    var send = function(data : any, watchName? : string) {
      data.sid = '' + $session.getId();
      var msg = JSON.stringify(data);
      if (arguments.length == 1) {
        sync($session, function() {
          dataManager.send(function(msg) {
            $session.getBasicRemote().sendText(msg); },
            data.sid, msg);
        } );
      } else {
        var sids = getWatchSidList(watchName);
        var cleanups : string[] = [];
        $.each(sids, function(i : number, sid : string) {
          var context = $global.get('contextMap').get(sid);
          if (context == null) {
            cleanups.push(sid);
            return;
          }
          var session = context.getSession();
          sync(session, function() {
            try {
              dataManager.send(function(msg) {
                session.getBasicRemote().sendText(msg); },
                data.sid, msg);
            } catch(e) {
              $global.get('contextMap').remove(sid);
              cleanups.push(sid);
            }
          });
        });
        $.each(cleanups, function(i : number, sid : string) {
          console.log('!session cleanup:' + sid);
          unwatch(watchName, sid);
        });
      }
    };

    var onopen = function(config : any) {
      console.log('open/sid=' + $session.getId() );
      send({'action': 'open'});
    };
  
    var onclose = function(closeReason : any) {
      console.log('close/sid=' + $session.getId() );
    };
  
    var onmessage = function(msg : any) {
      msg = '' + msg;
      if (msg.length == 0) {
        return;
      }
      var data = dataManager.parse(msg);
      if (data == null) {
        return;
      }
      //console.log(JSON.stringify(data, null, 2) );
      var action = actions[data.action];
      if (action) {
        action(data);
      }
    };

    var endpoint = new (Java.type('ws.IEndpoint'))({
      onOpen: onopen, onClose: onclose, onMessage: onmessage
    });

    return {
      send: send,
      actions: actions,
      endpoint: endpoint
    };
  }

  function tran(task : (conn : any) => void) {
    var ConnManager = Java.type('wsproj.sql.ConnManager');
    var conn = ConnManager.getInstance().getConnection();
    try {
      task(conn);
    } finally {
      conn.rollback();
      conn.close();
    }
  }

  function prepareStatement(conn : any, sql : string, params : any[]) {
    var stmt = conn.prepareStatement(sql);
    stmt.clearParameters();
    $.each(params, function(i : number, param : any) {
      var t = typeof param;
      if (t == 'string') {
        stmt.setString(i + 1, param);
      } else if (t == 'number') {
        stmt.setLong(i + 1, param);
      }
    });
    return stmt;
  }

  function executeQuery(conn : any,
      sql : string, params : any[],
      resultHandler : (rs : any) => void) : number {
    var stmt = prepareStatement(conn, sql, params);
    try {
      var rs = stmt.executeQuery();
      try {
        var count = 0;
        while (rs.next() ) {
          resultHandler(rs);
          count += 1;
        }
        return count;
      } finally {
        rs.close();
      }
    } finally {
      stmt.close();
    }
  }

  function executeUpdate(conn : any,
      sql : string, params : any[]) : number {
    var stmt = prepareStatement(conn, sql, params);
    try {
      return stmt.executeUpdate();
    } finally {
      stmt.close();
    }
  }

  function putTask(service : any, task : any) {

    tran(function(conn) {

      if (task.id == 0) {

        // new data
        task.id = +service.getNextTaskId(conn);
        executeUpdate(conn, 'insert into TASKS' +
          ' (TASK_ID, PROJECT_ID, DEL_FLG, TERM,' +
          ' USER_ID, MIN_ACT, MAX_ACT, JSON_DATA)' +
          ' values (?, ?, ?, ?, ?, ?, ?, ?)',
          [ task.id,
          task.projectId || '',
          '0',
          task.term || '',
          task.userId || '',
          task.minAct || '',
          task.maxAct || '',
          JSON.stringify(task) ]);

      } else if (task.deleted) {

        // delete
        executeUpdate(conn, 'update TASKS set DEL_FLG=?' +
          ' where TASK_ID=?',
          ['1', task.id ]);

      } else {
 
        // update
        executeUpdate(conn, 'update TASKS' +
          ' set PROJECT_ID=?, TERM=?,' +
          ' USER_ID=?, MIN_ACT=?, MAX_ACT=?, JSON_DATA=?' +
          ' where TASK_ID=?',
          [
          task.projectId || '',
          task.term || '',
          task.userId || '',
          task.minAct || '',
          task.maxAct || '',
          JSON.stringify(task),
          task.id ]);

      }
      conn.commit();
    });
  }

  export function service(fn : string) {
    if (fn == 'getProjectGroups') {
      $response.setContentType('application/json;charset=UTF-8');
      var out = $response.getWriter();
      try {
        out.write(JSON.stringify(getProjectGroups() ) );
      } finally {
        out.close();
      }
    } else if (fn == 'downloadTasks') {
      downloadTasks();
    } else {
      console.log('service::' + fn);
    }
  }

  export function create() {

    var service = Java.type('wsproj.service.WSProjService').getInstance();

    var user : any = null;

    var ws = createWS();

    ws.actions.login = function(data : any) {

      doLogin(data);

      if (service.getUserData(data.uid) == null) {
        service.putUserData(data.uid, JSON.stringify({}) );
      }

      user = { uid: data.uid };

      data.messages = loadMessage(data.lang || 'en');

      ws.send(data);
    };

    ws.actions.alive = function(data : any) {
      ws.send(data);
    };

    ws.actions.watchTasks = function(data : any) {
      watch(data.projectId);
    };

    ws.actions.putUserData = function(data : any) {
      var userData = JSON.parse(service.getUserData(user.uid) );
      if (data.value) {
        userData[data.key] = data.value;
      } else {
        delete userData[data.key];
      }
      service.putUserData(user.uid, JSON.stringify(userData) );
    }

    ws.actions.getUserData = function(data : any) {
      var userData = JSON.parse(service.getUserData(user.uid) );
      ws.send({action: 'updateUserData',
        key: data.key, value: userData[data.key]});
    }

    ws.actions.putTask = function(data : any) {

      if (typeof data.task.id != 'number') {
        return;
      }

      var lastTaskId = data.task.id;

      var time = getTime();
      if (data.task.id == 0) {
        data.task.crtUser = user.uid;
        data.task.crtDate = time;
      }
      data.task.updUser = user.uid;
      data.task.updDate = time;

      putTask(service, data.task);
      ws.send({action: 'updateTask',
        lastTaskId: lastTaskId,
        task: data.task},
        data.task.projectId);
    };

    ws.actions.editing = function(data : any) {
      ws.send(data, data.projectId);
    };

    return ws.endpoint;
  }

  function outputGzip(outputHandler : (out : any) => void) {

    var BufferedOutputStream = Java.type('java.io.BufferedOutputStream');
    var GZIPOutputStream = Java.type('java.util.zip.GZIPOutputStream');

    var acceptEncoding = $request.getHeader('accept-encoding');

    if (acceptEncoding != null) {
      if (acceptEncoding.indexOf('gzip') != -1) {
        $response.setHeader('Content-Encoding', 'gzip');
        var out = new GZIPOutputStream(new BufferedOutputStream(
              $response.getOutputStream() ) );
          try {
            outputHandler(out);
          } finally {
            out.close();
          }
        return;
      }
    }

    var out = new BufferedOutputStream($response.getOutputStream() );
    try {
      outputHandler(out);
    } finally {
      out.close();
    }
  }

  function downloadTasks() {

    var filename = $request.getParameter('filename');
    $response.setContentType('application/octet-stream');
    $response.setHeader('Content-Disposition',
      'attachment; filename="' + filename + '"');

    outputGzip(function(out) {
      var writer = new (Java.type('java.io.OutputStreamWriter'))(out, 'UTF-8');
      try {
        outputXmlTasks(writer);
      } finally {
        writer.flush();
      }
    });
  }

  function outputXmlTasks(out : any) {

    var minAct = $request.getParameter('minAct');
    var maxAct = $request.getParameter('maxAct');
    var includeNoActs = $request.getParameter('includeNoActs');
    minAct = minAct != null? '' + minAct : '';
    maxAct = maxAct != null? '' + maxAct : '';
    includeNoActs = includeNoActs != null? '' + includeNoActs : 'true';

    var CRLF = new (Java.type('java.lang.String'))('\r\n');

    var CMT_SUFFIX = '$C';

    var cols = [
      'id',
      'projectGroup',
      'projectId',
      'project',
      'term',
      'userId',
      'user',
      'comment',
      'taskType1',
      'taskType2',
      'taskType3',
      'taskType4',
      'priority',
      'origEst',
      'currEst',
      'elapsed',
      'remain',
      'minAct',
      'maxAct'
    ];

    var isActDate = function() {
      var actRe = /^act[0-9]{8}$/;
      return function(id : string) {
        return !!id.match(actRe);
      }
    }();

    function escapeXml(s : string) {
      var buf = '';
      for (var i = 0; i < s.length; i += 1) {
        var c = s.charAt(i);
        if (c < '\u0020') {
          buf += '&#';
          buf +=  ('' + c.charCodeAt(0) ).substring(0);
          buf += ';';
        } else if (c == '<') {
          buf += '&lt;';
        } else if (c == '>') {
          buf += '&gt;';
        } else if (c == '&') {
          buf += '&amp;';
        } else if (c == '"') {
          buf += '&quot;';
        } else {
          buf += c;
        }
      }
      return buf;
    }

    var validProjects = function() {
      var validProjects : { [projectId : string] : boolean } = {};
      var projectGroups = getProjectGroups();
      for (var i = 0; i < projectGroups.length; i += 1) {
        var projects = projectGroups[i].projects;
        for (var p = 0; p < projects.length; p += 1) {
          validProjects[projects[p].projectId] = true;
        }
      }
      return validProjects;
    }();

    function doTask(data : any) {

      if (!validProjects[data.projectId]) {
        return;
      }

      var id : string;

      var actIdList : string[] = [];
      for (id in data) {
        if (isActDate(id) ) {
          actIdList.push(id);
        }
      }
      actIdList.sort();

      var buf = '';
      for (var i = 0; i < actIdList.length; i += 1) {
        id = actIdList[i];

        var date = id.substring(3);
        if (minAct && minAct > date || maxAct && maxAct < date) {
          continue;
        }

        buf += '<Act date="';
        buf += date;
        buf += '" hours="';
        buf += data[id];
        buf += '"';

        var cmt = data[id + CMT_SUFFIX];
        if (typeof cmt != 'undefined') {
          buf += ' comment="';
          buf += escapeXml('' + cmt);
          buf += '"';
        }

        buf += '/>';
      }

      if (includeNoActs == 'false' && buf.length == 0) {
        return;
      }

      out.write('<Task');
      for (var i = 0; i < cols.length; i += 1) {
        id = cols[i];
        var val = data[id];
        if (typeof val != 'undefined') {
          out.write(' ');
          out.write(id);
          out.write('="');
          out.write(escapeXml('' + val) );
          out.write('"');
        }
      }
      out.write('>');
      out.write(buf);
      out.write('</Task>');
      out.write(CRLF);
    }

    tran(function(conn) {

      out.write('<?xml version="1.0" encoding="UTF-8"?>');
      out.write(CRLF);
      out.write('<Tasks>');
      out.write(CRLF);

      var idList = ('' + $request.getParameter('idList') ).split(',');
      for (var i = 0; i < idList.length; i += 1) {
        executeQuery(conn, 
          'select JSON_DATA from TASKS where TASK_ID=? and DEL_FLG=?',
          [+idList[i], '0'],
          function(rs) {
            doTask(JSON.parse('' + rs.getString('JSON_DATA') ) );
          });
      }

      out.write('</Tasks>');
      out.write(CRLF);
    });
  }
}
