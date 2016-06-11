'use strict';
var wsproj;
(function (wsproj) {
    var server;
    (function (server) {
        function doLogin(data) {
            data.user = 'ユーザーA';
        }
        server.doLogin = doLogin;
        function getProjectGroups() {
            return [
                {
                    groupName: 'テストプロジェクトGrp1',
                    projects: [
                        {
                            projectId: '_test', projectName: 'テストプロジェクト1',
                            users: [
                                { userId: 'user1', userName: 'ユーザーA' },
                                { userId: 'user2', userName: 'ユーザーB' },
                                { userId: 'user3', userName: 'ユーザーC' },
                                { userId: 'user4', userName: 'ユーザーD' }
                            ]
                        },
                        {
                            projectId: '_test2', projectName: 'テストプロジェクト2',
                            users: [
                                { userId: 'user1', userName: 'ユーザー1' },
                                { userId: 'user2', userName: 'ユーザー2' },
                                { userId: 'user3', userName: 'ユーザー3' },
                                { userId: 'user4', userName: 'ユーザー4' }
                            ]
                        },
                        {
                            projectId: '_test3', projectName: 'テストプロジェクト3'
                        }
                    ]
                },
                {
                    groupName: 'テストプロジェクトGrp2',
                    projects: [
                        {
                            projectId: '_test', projectName: 'テストプロジェクト1',
                            users: [
                                { userId: 'user1', userName: 'ユーザーA' },
                                { userId: 'user2', userName: 'ユーザーB' }
                            ]
                        },
                        {
                            projectId: '_test3', projectName: 'テストプロジェクト3'
                        }
                    ]
                }
            ];
        }
        server.getProjectGroups = getProjectGroups;
    })(server = wsproj.server || (wsproj.server = {}));
})(wsproj || (wsproj = {}));
'use strict';
var wsproj;
(function (wsproj) {
    var server;
    (function (server) {
        var console = {
            log: function (msg) {
                $logger.info(msg);
            }
        };
        var loadStream = function (stream) {
            var bout = new java.io.ByteArrayOutputStream();
            try {
                var fin = new java.io.BufferedInputStream(stream);
                try {
                    var buf = java.lang.reflect.Array.newInstance(java.lang.Byte.TYPE, 4096);
                    var len;
                    while ((len = fin.read(buf)) != -1) {
                        bout.write(buf, 0, len);
                    }
                }
                finally {
                    fin.close();
                }
            }
            finally {
                bout.close();
            }
            return bout.toByteArray();
        };
        var loadMessage = function (lang) {
            var filename = context.getAttribute('javax.script.filename');
            var index = filename.lastIndexOf('/');
            if (index == -1) {
                throw 'bad filename:' + filename;
            }
            var getResIn = function (lang) {
                return $servletContext.getResourceAsStream(filename.substring(0, index + 1) +
                    'messages_' + lang + '.json');
            };
            var resIn = getResIn(lang);
            if (resIn == null && lang.indexOf('-') != -1) {
                resIn = getResIn(lang.replace(/\-.+$/, ''));
            }
            if (resIn == null) {
                resIn = getResIn('en');
            }
            return JSON.parse('' + new java.lang.String(loadStream(resIn), 'UTF-8'));
        };
        var $ = {
            each: function (it, f) {
                if (typeof it.splice == 'function') {
                    for (var i = 0; i < it.length; i += 1) {
                        f(i, it[i]);
                    }
                }
                else {
                    for (var k in it) {
                        f(k, it[k]);
                    }
                }
            }
        };
        function sync(lock, sync) {
            Packages.ws.ISync.sync.sync(lock, new Packages.ws.ISync({ sync: sync }));
        }
        function getWatchList() {
            $global.putIfAbsent('wsprojWatchList', {});
            return $global.get('wsprojWatchList');
        }
        function watch(watchName) {
            var watchList = getWatchList();
            if (!watchList[watchName]) {
                watchList[watchName] = {};
            }
            var sid = '' + $session.getId();
            watchList[watchName][sid] = sid;
        }
        function getWatchSidList(watchName) {
            var watchList = getWatchList();
            var sids = [];
            if (watchList[watchName]) {
                $.each(watchList[watchName], function (sid, sid_) {
                    sids.push(sid);
                });
            }
            return sids;
        }
        function unwatch(watchName, sid) {
            var watchList = getWatchList();
            if (watchList[watchName]) {
                delete watchList[watchName][sid];
            }
        }
        function createWS() {
            var actions = {};
            var send = function (data, watchName) {
                data.sid = '' + $session.getId();
                var msg = JSON.stringify(data);
                if (arguments.length == 1) {
                    sync($session, function () {
                        $session.getBasicRemote().sendText(msg);
                    });
                }
                else {
                    var sids = getWatchSidList(watchName);
                    var cleanups = [];
                    $.each(sids, function (i, sid) {
                        var context = $global.get('contextMap').get(sid);
                        if (context == null) {
                            cleanups.push(sid);
                            return;
                        }
                        var session = context.getSession();
                        sync(session, function () {
                            try {
                                session.getBasicRemote().sendText(msg);
                            }
                            catch (e) {
                                $global.get('contextMap').remove(sid);
                                cleanups.push(sid);
                            }
                        });
                    });
                    $.each(cleanups, function (i, sid) {
                        console.log('!session cleanup:' + sid);
                        unwatch(watchName, sid);
                    });
                }
            };
            var onopen = function (config) {
                console.log('open/sid=' + $session.getId());
                send({ 'action': 'open' });
            };
            var onclose = function (closeReason) {
                console.log('close/sid=' + $session.getId());
            };
            var onmessage = function (msg) {
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
        function tran(task) {
            var ConnManager = Packages.wsproj.sql.ConnManager;
            var conn = ConnManager.getInstance().getConnection();
            try {
                task(conn);
            }
            finally {
                conn.rollback();
                conn.close();
            }
        }
        function prepareStatement(conn, sql, params) {
            var stmt = conn.prepareStatement(sql);
            stmt.clearParameters();
            $.each(params, function (i, param) {
                var t = typeof param;
                if (t == 'string') {
                    stmt.setString(i + 1, param);
                }
                else if (t == 'number') {
                    stmt.setLong(i + 1, param);
                }
            });
            return stmt;
        }
        function executeQuery(conn, sql, params, resultHandler) {
            var stmt = prepareStatement(conn, sql, params);
            try {
                var rs = stmt.executeQuery();
                try {
                    var count = 0;
                    while (rs.next()) {
                        resultHandler(rs);
                        count += 1;
                    }
                    return count;
                }
                finally {
                    rs.close();
                }
            }
            finally {
                stmt.close();
            }
        }
        function executeUpdate(conn, sql, params) {
            var stmt = prepareStatement(conn, sql, params);
            try {
                return stmt.executeUpdate();
            }
            finally {
                stmt.close();
            }
        }
        function getNextId(conn) {
            var value = 0;
            var count = executeQuery(conn, 'select next value for SEQ_TASK_ID from DUAL', [], function (rs) {
                value = +rs.getLong(1);
            });
            if (count != 1) {
                throw 'count:' + count;
            }
            return value;
        }
        function putTask(task) {
            tran(function (conn) {
                if (task.id == 0) {
                    // new data
                    task.id = getNextId(conn);
                    executeUpdate(conn, 'insert into TASKS' +
                        ' (TASK_ID, PROJECT_ID, DEL_FLG, TERM,' +
                        ' USER_ID, MIN_ACT, MAX_ACT, JSON_DATA)' +
                        ' values (?, ?, ?, ?, ?, ?, ?, ?)', [task.id,
                        task.projectId || '',
                        '0',
                        task.term || '',
                        task.userId || '',
                        task.minAct || '',
                        task.maxAct || '',
                        JSON.stringify(task)]);
                }
                else if (task.deleted) {
                    // delete
                    executeUpdate(conn, 'update TASKS set DEL_FLG=?' +
                        ' where TASK_ID=?', ['1', task.id]);
                }
                else {
                    // update
                    executeUpdate(conn, 'update TASKS' +
                        ' set PROJECT_ID=?, TERM=?,' +
                        ' USER_ID=?, MIN_ACT=?, MAX_ACT=?, JSON_DATA=?' +
                        ' where TASK_ID=?', [
                        task.projectId || '',
                        task.term || '',
                        task.userId || '',
                        task.minAct || '',
                        task.maxAct || '',
                        JSON.stringify(task),
                        task.id]);
                }
                conn.commit();
            });
        }
        function service(fn) {
            if (fn == 'getProjectGroups') {
                $response.setContentType('application/json;charset=UTF-8');
                var out = $response.getWriter();
                try {
                    out.write(JSON.stringify(server.getProjectGroups()));
                }
                finally {
                    out.close();
                }
            }
            else if (fn == 'downloadTasks') {
                downloadTasks();
            }
            else {
                console.log('service::' + fn);
            }
        }
        server.service = service;
        function create() {
            var service = Packages.wsproj.service.WSProjService.getInstance();
            var user = null;
            var ws = createWS();
            ws.actions.login = function (data) {
                server.doLogin(data);
                if (service.getUserData(data.uid) == null) {
                    service.putUserData(data.uid, JSON.stringify({}));
                }
                user = { uid: data.uid };
                data.messages = loadMessage(data.lang || 'en');
                ws.send(data);
            };
            ws.actions.watchTasks = function (data) {
                watch(data.projectId);
            };
            ws.actions.putUserData = function (data) {
                var userData = JSON.parse(service.getUserData(user.uid));
                if (data.value) {
                    userData[data.key] = data.value;
                }
                else {
                    console.log('delete user data:' + data.key);
                    delete userData[data.key];
                }
                service.putUserData(user.uid, JSON.stringify(userData));
            };
            ws.actions.getUserData = function (data) {
                var userData = JSON.parse(service.getUserData(user.uid));
                ws.send({ action: 'updateUserData',
                    key: data.key, value: userData[data.key] });
            };
            ws.actions.putTask = function (data) {
                if (typeof data.task.id != 'number') {
                    return;
                }
                var lastTaskId = data.task.id;
                putTask(data.task);
                ws.send({ action: 'updateTask',
                    lastTaskId: lastTaskId,
                    task: data.task }, data.task.projectId);
            };
            ws.actions.editing = function (data) {
                ws.send(data, data.projectId);
            };
            return ws.endpoint;
        }
        server.create = create;
        function outputGzip(outputHandler) {
            var BufferedOutputStream = java.io.BufferedOutputStream;
            var GZIPOutputStream = java.util.zip.GZIPOutputStream;
            var acceptEncoding = $request.getHeader('accept-encoding');
            if (acceptEncoding != null) {
                if (acceptEncoding.indexOf('gzip') != -1) {
                    $response.setHeader('Content-Encoding', 'gzip');
                    var out = new GZIPOutputStream(new BufferedOutputStream($response.getOutputStream()));
                    try {
                        outputHandler(out);
                    }
                    finally {
                        out.close();
                    }
                    return;
                }
            }
            var out = new BufferedOutputStream($response.getOutputStream());
            try {
                outputHandler(out);
            }
            finally {
                out.close();
            }
        }
        function downloadTasks() {
            var filename = $request.getParameter('filename');
            $response.setContentType('application/octet-stream');
            $response.setHeader('Content-Disposition', 'attachment; filename="' + filename + '"');
            outputGzip(function (out) {
                var writer = new java.io.OutputStreamWriter(out, 'UTF-8');
                try {
                    outputXmlTasks(writer);
                }
                finally {
                    writer.flush();
                }
            });
        }
        function outputXmlTasks(out) {
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
            var isActDate = function () {
                var actRe = /^act[0-9]{8}$/;
                return function (id) {
                    return !!id.match(actRe);
                };
            }();
            function writeXml(s) {
                for (var i = 0; i < s.length; i += 1) {
                    var c = s.charAt(i);
                    if (c < '\u0020') {
                        out.write('&#');
                        out.write('' + c.charCodeAt(0));
                        out.write(';');
                    }
                    else if (c == '<') {
                        out.write('&lt;');
                    }
                    else if (c == '>') {
                        out.write('&gt;');
                    }
                    else if (c == '&') {
                        out.write('&amp;');
                    }
                    else if (c == '"') {
                        out.write('&quot;');
                    }
                    else {
                        out.write(c);
                    }
                }
            }
            var validProjects = function () {
                var validProjects = {};
                var projectGroups = server.getProjectGroups();
                for (var i = 0; i < projectGroups.length; i += 1) {
                    var projects = projectGroups[i].projects;
                    for (var p = 0; p < projects.length; p += 1) {
                        validProjects[projects[p].projectId] = true;
                    }
                }
                return validProjects;
            }();
            function doTask(data) {
                if (!validProjects[data.projectId]) {
                    return;
                }
                var id;
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
                var actIdList = [];
                for (id in data) {
                    if (isActDate(id)) {
                        actIdList.push(id);
                    }
                }
                actIdList.sort();
                for (var i = 0; i < actIdList.length; i += 1) {
                    id = actIdList[i];
                    out.write('<Act date="');
                    out.write(id.substring(3));
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
            tran(function (conn) {
                out.write('<?xml version="1.0" encoding="UTF-8"?>');
                out.write(CRLF);
                out.write('<Tasks>');
                out.write(CRLF);
                var idList = ('' + $request.getParameter('idList')).split(',');
                for (var i = 0; i < idList.length; i += 1) {
                    executeQuery(conn, 'select JSON_DATA from TASKS where TASK_ID=? and DEL_FLG=?', [+idList[i], '0'], function (rs) {
                        doTask(JSON.parse('' + rs.getString('JSON_DATA')));
                    });
                }
                out.write('</Tasks>');
                out.write(CRLF);
            });
        }
    })(server = wsproj.server || (wsproj.server = {}));
})(wsproj || (wsproj = {}));
