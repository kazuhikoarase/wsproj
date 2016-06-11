package wsproj.sql;

import java.sql.Connection;

import javax.naming.Context;
import javax.naming.InitialContext;
import javax.sql.DataSource;

/**
 * ConnManager
 * @author Kazuhiko Arase
 */
public class ConnManager {

    private static ConnManager instance = null;

    public static ConnManager getInstance() {
        if (instance == null) {
            instance = new ConnManager();
        }
        return instance;
    }

    private final DataSource dataSource;

    private ConnManager() {
        try {
            Context context = new InitialContext();
            dataSource = (DataSource)context.lookup("java:comp/env/jdbc/JSPROJ_DS");
        } catch(Exception e) {
            throw new RuntimeException(e);
        }
    }

    public Connection getConnection() throws Exception {
        Connection conn = dataSource.getConnection();
        conn.setTransactionIsolation(Connection.TRANSACTION_READ_COMMITTED);
        conn.setAutoCommit(false);
        return conn;
    }
}
