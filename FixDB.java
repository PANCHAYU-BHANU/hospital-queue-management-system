import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

public class FixDB {
    public static void main(String[] args) {
        String url = "jdbc:mysql://localhost:3306/hospital_queue_db";
        String user = "root";
        String password = "1234";

        try (Connection conn = DriverManager.getConnection(url, user, password);
             Statement stmt = conn.createStatement()) {
            
            System.out.println("Connected to the database!");
            try {
                stmt.executeUpdate("ALTER TABLE doctors ADD INDEX idx_user_id (user_id)");
                System.out.println("Added new non-unique index on user_id!");
            } catch (Exception e) {
                System.out.println("Index might already exist.");
            }

            stmt.executeUpdate("ALTER TABLE doctors DROP INDEX UKt1f6cueqyjwx5ghew9ar1exe3");
            System.out.println("Index dropped successfully!");
            
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
