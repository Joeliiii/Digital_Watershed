package com.digitalwatershed.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Boots the full application context without a database. MongoDB points at an
 * unreachable port with short timeouts, so health reports DOWN instead of hanging.
 */
@SpringBootTest(properties = {
		"spring.mongodb.uri=mongodb://localhost:1/dw_test?serverSelectionTimeoutMS=200&connectTimeoutMS=200",
		"app.cors.allowed-origins=http://localhost:5173" })
@AutoConfigureMockMvc
class SecurityConfigIntegrationTest {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private PasswordEncoder passwordEncoder;

	@Test
	void healthIsPublicAndReportsStatus() throws Exception {
		mockMvc.perform(get("/api/health"))
			.andExpect(status().isServiceUnavailable())
			.andExpect(jsonPath("$.status").value("DOWN"))
			.andExpect(jsonPath("$.components").doesNotExist());
	}

	@Test
	void unknownApiRouteRequiresAuthenticationWithJsonError() throws Exception {
		mockMvc.perform(get("/api/items"))
			.andExpect(status().isUnauthorized())
			.andExpect(jsonPath("$.status").value(401))
			.andExpect(jsonPath("$.message").value("Authentication required"));
	}

	@Test
	void corsPreflightFromReactDevServerIsAllowed() throws Exception {
		mockMvc.perform(options("/api/items")
				.header(HttpHeaders.ORIGIN, "http://localhost:5173")
				.header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "POST")
				.header(HttpHeaders.ACCESS_CONTROL_REQUEST_HEADERS, "Authorization,Content-Type"))
			.andExpect(status().isOk())
			.andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "http://localhost:5173"));
	}

	@Test
	void corsPreflightFromUnknownOriginIsRejected() throws Exception {
		mockMvc.perform(options("/api/items")
				.header(HttpHeaders.ORIGIN, "http://evil.example")
				.header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "GET"))
			.andExpect(status().isForbidden())
			.andExpect(header().doesNotExist(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN));
	}

	@Test
	void passwordEncoderVerifiesHashesProducedByBcryptjs() {
		// Generated with bcryptjs 3.0.3 (the Node backend's library): hashSync("password", 10).
		String bcryptjsHash = "$2b$10$o6a5Yvpb8ZXv7o0A7UfTWe.8bcf0sxFBn0psOf4M9qXsgS.StJpQ2";
		assertThat(passwordEncoder.matches("password", bcryptjsHash)).isTrue();
		assertThat(passwordEncoder.matches("wrong", bcryptjsHash)).isFalse();
	}

}
