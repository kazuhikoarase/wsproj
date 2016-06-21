
'use strict';
namespace wsproj.server {

  declare var context : any;
  declare var java : any;
  declare var Packages : any;
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

  var getTime = () => +java.lang.System.currentTimeMillis();

  var loadStream = function(stream : any) {
    var bout = new java.io.ByteArrayOutputStream();
    try {
      var fin = new java.io.BufferedInputStream(stream);
      try {
        var buf = java.lang.reflect.Array.newInstance(
              java.lang.Byte.TYPE, 4096);
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
    return JSON.parse('' + new java.lang.String(
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
    Packages.ws.ISync.sync.sync(lock,
        new Packages.ws.ISync({ sync: sync } ) );
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

  function createWS() {

    var actions : any = {};

    var send = function(data : any, watchName? : string) {
      data.sid = '' + $session.getId();
      var msg = JSON.stringify(data);
      if (arguments.length == 1) {
        sync($session, function() {
          $session.getBasicRemote().sendText(msg);
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
              session.getBasicRemote().sendText(msg);
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
      var data = JSON.parse(msg);
      //console.log(JSON.stringify(data, null, 2) );
      var action = actions[data.action];
      if (action) {
        action(data);
      }
    };

    var endpoint = new Packages.ws.IEndpoint({
      onOpen: onopen, onClose: onclose, onMessage: onmessage
    });

    return {
      send: send,
      actions: actions,
      endpoint: endpoint
    };
  }

  function tran(task : (conn : any) => void) {
    var ConnManager = Packages.wsproj.sql.ConnManager;
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

  function getNextId(conn : any) {
    var value = 0;
    var count = executeQuery(conn, 
      'select next value for SEQ_TASK_ID from DUAL', [], function(rs) {
        value = +rs.getLong(1);
        });
    if (count != 1) {
      throw 'count:' + count;
    }
    return value;
  }

  function putTask(task : any) {

    tran(function(conn) {

      if (task.id == 0) {

        // new data
        task.id = getNextId(conn);
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

    var service = Packages.wsproj.service.WSProjService.getInstance();

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

      putTask(data.task);
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

    var BufferedOutputStream = java.io.BufferedOutputStream;
    var GZIPOutputStream = java.util.zip.GZIPOutputStream;

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
      var writer = new java.io.OutputStreamWriter(out, 'UTF-8');
      try {
        outputXmlTasks(writer);
      } finally {
        writer.flush();
      }
    });
  }

  function outputXmlTasks(out : any) {

    var CRLF = new java.lang.String('\r\n');

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

    function writeXml(s : string) {
      for (var i = 0; i < s.length; i += 1) {
        var c = s.charAt(i);
        if (c < '\u0020') {
          out.write('&#');
          out.write('' + c.charCodeAt(0) );
          out.write(';');
        } else if (c == '<') {
          out.write('&lt;');
        } else if (c == '>') {
          out.write('&gt;');
        } else if (c == '&') {
          out.write('&amp;');
        } else if (c == '"') {
          out.write('&quot;');
        } else {
          out.write(c);
        }
      }
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

      out.write('<Task');
      for (var i = 0; i < cols.length; i += 1) {
        id = cols[i];
        var val = data[id];
        if (typeof val != 'undefined') {
          out.write(' ');
          out.write(id);
          out.write('="');
          writeXml('' + val);
          out.write('"');
        }
      }
      out.write('>');

      var actIdList : string[] = [];
      for (id in data) {
        if (isActDate(id) ) {
          actIdList.push(id);
        }
      }
      actIdList.sort();

      for (var i = 0; i < actIdList.length; i += 1) {
        id = actIdList[i];

        out.write('<Act date="');
        out.write(id.substring(3) );
        out.write('" hours="');
        out.write(data[id]);
        out.write('"');

        var cmt = data[id + CMT_SUFFIX];
        if (typeof cmt != 'undefined') {
          out.write(' comment="');
          writeXml('' + cmt);
          out.write('"');
        }

        out.write('/>');
      }

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
