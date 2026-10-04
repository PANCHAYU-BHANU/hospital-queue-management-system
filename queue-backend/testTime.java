import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.util.Locale;

public class testTime {
    public static void main(String[] args) {
        DateTimeFormatter formatter = new DateTimeFormatterBuilder()
                        .parseCaseInsensitive()
                        .appendPattern("h:mm a")
                        .toFormatter(Locale.ENGLISH);
        try {
            LocalTime startTime = LocalTime.parse("12:00 AM", formatter);
            LocalTime endTime = LocalTime.parse("06:00 PM", formatter);
            LocalTime now = LocalTime.now();
            System.out.println("Parsed startTime: " + startTime);
            System.out.println("Parsed endTime: " + endTime);
            System.out.println("Now: " + now);
            
            if (endTime.isBefore(startTime) || endTime.equals(LocalTime.MIDNIGHT)) {
                System.out.println("Shift crosses midnight");
                System.out.println("Is active? " + (!now.isBefore(startTime) || now.isBefore(endTime)));
            } else {
                System.out.println("Normal shift");
                System.out.println("Is active? " + (!now.isBefore(startTime) && now.isBefore(endTime)));
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
