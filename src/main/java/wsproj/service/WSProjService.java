package wsproj.service;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

import wsproj.sql.ConnManager;

public class WSProjService {

  private static WSProjService instance = new WSProjService();

  public static WSProjService getInstance() {
    return instance;
  }

  private WSProjService() {
  }

  public long getNextTaskId(Connection conn) throws Exception {
    return getNextValue(conn, "SEQ_TASK_ID");
  }

  protected long getNextValue(final Connection conn,
      final String seq) throws Exception {

    boolean exists = false;
    final long[] value = { 0 };

    {
      PreparedStatement stmt = conn.prepareStatement(
          "select SEQ_VAL from SEQUENCES where SEQ_ID=? for update");
      try {
        stmt.clearParameters();
        stmt.setString(1, seq);
        ResultSet rs = stmt.executeQuery();
        try {
          if (rs.next() ) {
            exists = true;
            value[0] = rs.getLong(1);
          }
        } finally {
         rs.close();
        }
      } finally {
        stmt.close();
      }
    }

    value[0] += 1;

    if (!exists) {
      PreparedStatement stmt = conn.prepareStatement(
          "insert into SEQUENCES (SEQ_ID,SEQ_VAL) values (?,?)");
      try {
        stmt.clearParameters();
        stmt.setString(1, seq);
        stmt.setLong(2, value[0]);
        stmt.executeUpdate();
      } finally {
        stmt.close();
      }
    } else {
      PreparedStatement stmt = conn.prepareStatement(
          "update SEQUENCES set SEQ_VAL=? where SEQ_ID=?");
      try {
        stmt.clearParameters();
        stmt.setLong(1, value[0]);
        stmt.setString(2, seq);
        stmt.executeUpdate();
      } finally {
        stmt.close();
      }
    }

    return value[0];
  }

  public String getUserData(String userId) throws Exception {
    Connection conn = ConnManager.getInstance().getConnection();
    try {
      PreparedStatement stmt = conn.prepareStatement(
          "select JSON_DATA from USERS" +
          " where USER_ID=?");
      try {
        stmt.clearParameters();
        stmt.setString(1, userId);
        ResultSet rs = stmt.executeQuery();
        try {
          if (!rs.next() ) {
            return null;
          }
          return rs.getString("JSON_DATA");
        } finally {
         rs.close();
        }
      } finally {
        stmt.close();
      }

    } finally {
      conn.close();
    }
  }

  public void putUserData(String userId, String userData)
  throws Exception {
    Connection conn = ConnManager.getInstance().getConnection();
    try {

      boolean exists = false;

      final PreparedStatement stmt = conn.prepareStatement(
          "select JSON_DATA from USERS" +
          " where USER_ID=?");
      try {
        stmt.clearParameters();
        stmt.setString(1, userId);
        ResultSet rs = stmt.executeQuery();
        try {
          if (rs.next() ) {
            exists = true;
          }
        } finally {
         rs.close();
        }
      } finally {
        stmt.close();
      }

      if (!exists) {
        insertUserData(conn, userId, userData);
      } else {
        updateUserData(conn, userId, userData);
      }
      conn.commit();

    } finally {
      conn.close();
    }
  }

  private void insertUserData(
    final Connection conn,
    final String userId,
    final String userData
  ) throws Exception {
    final PreparedStatement stmt = conn.prepareStatement(
        "insert into USERS (USER_ID,JSON_DATA) values (?,?)");
    try {
      stmt.clearParameters();
      stmt.setString(1, userId);
      stmt.setString(2, userData);
      stmt.executeUpdate();
    } finally {
      stmt.close();
    }
  }

  private void updateUserData(
    final Connection conn,
    final String userId,
    final String userData
  ) throws Exception {
    final PreparedStatement stmt = conn.prepareStatement(
        "update USERS set JSON_DATA=? where USER_ID=?");
    try {
      stmt.clearParameters();
      stmt.setString(1, userData);
      stmt.setString(2, userId);
      stmt.executeUpdate();
    } finally {
      stmt.close();
    }
  }
}
