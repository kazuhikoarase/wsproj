package wsproj.servlet;

import java.io.BufferedOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.util.zip.GZIPOutputStream;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/**
 * Util
 * @author Kazuhiko Arase
 */
class Util {

  private Util() {
  }

  public interface OutputHandler {
    void handle(OutputStream out) throws Exception;
  }

  public static void outputGZIP(
    final HttpServletRequest request,
    final HttpServletResponse response,
    final OutputHandler outputHandler
  ) throws IOException {

    final String acceptEncoding =
        request.getHeader("accept-encoding");

    if (acceptEncoding != null &&
        acceptEncoding.indexOf("gzip") != -1) {
      // gzip output
      response.setHeader("Content-Encoding", "gzip");
      final OutputStream out = 
          new GZIPOutputStream(new BufferedOutputStream(
          response.getOutputStream() ) );
      try {
        outputHandler.handle(out);
      } catch(IOException e) {
        throw e;
      } catch(Exception e) {
        throw new IOException(e);
      } finally {
        out.close();
      }

    } else {

      // normal output
      final OutputStream out =
          new BufferedOutputStream(response.getOutputStream() );
      try {
        outputHandler.handle(out);
      } catch(IOException e) {
        throw e;
      } catch(Exception e) {
        throw new IOException(e);
      } finally {
        out.close();
      }
    }
  }
}
