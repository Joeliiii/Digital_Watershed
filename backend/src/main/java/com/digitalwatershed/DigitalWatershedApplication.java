package com.digitalwatershed;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.boot.security.autoconfigure.UserDetailsServiceAutoConfiguration;

// Users come from MongoDB (Phase 2); never create Spring Boot's in-memory default user.
@SpringBootApplication(exclude = UserDetailsServiceAutoConfiguration.class)
@ConfigurationPropertiesScan
public class DigitalWatershedApplication {

	public static void main(String[] args) {
		SpringApplication.run(DigitalWatershedApplication.class, args);
	}

}
