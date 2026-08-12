import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

public class UpdateDB {
    public static void main(String[] args) {
        String url = "jdbc:mysql://localhost:3306/hospital_queue_db?serverTimezone=UTC";
        String user = "root";
        String pass = "1234";

        try (Connection conn = DriverManager.getConnection(url, user, pass);
             Statement stmt = conn.createStatement()) {
            String sql = "ALTER TABLE doctor_assignments ADD COLUMN assigned_date DATE DEFAULT (CURRENT_DATE)";
            stmt.executeUpdate(sql);
            System.out.println("Column added successfully!");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
