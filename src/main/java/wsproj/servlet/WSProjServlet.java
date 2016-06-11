package wsproj.servlet;

import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.PrintWriter;
import java.io.Reader;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.logging.Logger;

import javax.script.ScriptEngine;
import javax.servlet.ServletConfig;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import ws.util.ScriptUtil;
import wsproj.sql.ConnManager;

@SuppressWarnings("serial")
public class WSProjServlet extends HttpServlet {

    protected static final Logger logger =
            Logger.getLogger(WSProjServlet.class.getName() );

    private String scriptPath;
    private String entryPoint;

    @Override
    public void init(ServletConfig config) throws ServletException {
        super.init(config);
        scriptPath = config.getInitParameter("scriptPath");
        entryPoint = config.getInitParameter("entryPoint");
    }

    @Override
    protected void doPost(
       HttpServletRequest request,
       HttpServletResponse response
    ) throws ServletException, IOException {

        String fn = request.getParameter("fn");
        if (fn != null) {
            doScript(fn, request, response);
            return;
        }

        try {
            response.setContentType("application/json;charset=UTF-8");
            PrintWriter out = response.getWriter();
            try {
                Connection conn = ConnManager.getInstance().getConnection();
                try {
                    out.write('[');
                    int[] count = { 0 };
                    String[] projectIdList =
                            request.getParameterValues("projectId[]");
                    if (projectIdList != null) {
                        for (String projectId : projectIdList) {
                            doProject(conn, out, projectId, count);
                        }
                    }
                    out.write(']');
                } finally {
                    conn.close();
                }
            } finally {
                out.close();
            }
        } catch(RuntimeException e) {
            throw e;
        } catch(Exception e) {
            throw new ServletException(e);
        }
    }

    private void doProject(
        final Connection conn,
        final PrintWriter out,
        final String projectId,
        final int[] count
    ) throws Exception {
        PreparedStatement stmt = conn.prepareStatement(
                "select JSON_DATA from TASKS" +
                " where PROJECT_ID=? and DEL_FLG='0' order by TASK_ID");
        try {
            stmt.clearParameters();
            stmt.setString(1, projectId);
            ResultSet rs = stmt.executeQuery();
            try {
                while (rs.next() ) {
                    if (count[0] > 0) {
                        out.write(',');
                    }
                    out.write(rs.getString("JSON_DATA") );
                    count[0] += 1;
                }
            } finally {
              rs.close();
            }
        } finally {
            stmt.close();
        }
    }

    protected void doScript(
        String fn,
        HttpServletRequest request,
        HttpServletResponse response
    ) throws ServletException, IOException {
        try {

            ScriptEngine se = ScriptUtil.newScriptEngine();
            se.put("$logger", logger);
            se.put("$servletContext", getServletContext() );
            se.put("$request", request);
            se.put("$response", response);

            Reader in = new InputStreamReader(
                    new FileInputStream(getServletContext().
                            getRealPath(scriptPath)), "UTF-8");
            try {
                se.eval(in);
            } finally {
                in.close();
            }

            fn = fn.replaceAll("[^a-zA-Z0-9]", "");
            se.eval(entryPoint + "('" + fn + "');" );

        } catch(Exception e) {
            e.printStackTrace();
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }
}
