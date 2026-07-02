package com.example.billscalculatorbackend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class BillscalculatorbackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(BillscalculatorbackendApplication.class, args);
    }

}
