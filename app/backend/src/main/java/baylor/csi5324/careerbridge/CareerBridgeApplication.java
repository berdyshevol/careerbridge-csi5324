
package baylor.csi5324.careerbridge;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class CareerBridgeApplication {

    public static void main(String[] args) {
        SpringApplication.run(CareerBridgeApplication.class, args);
    }

}
