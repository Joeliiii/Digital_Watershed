package com.digitalwatershed.common;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

class GlobalExceptionHandlerTest {

	private MockMvc mockMvc;

	@BeforeEach
	void setUp() {
		mockMvc = MockMvcBuilders.standaloneSetup(new ThrowingController())
			.setControllerAdvice(new GlobalExceptionHandler())
			.build();
	}

	@Test
	void notFoundMapsTo404WithMessage() throws Exception {
		mockMvc.perform(get("/test/not-found"))
			.andExpect(status().isNotFound())
			.andExpect(jsonPath("$.status").value(404))
			.andExpect(jsonPath("$.message").value("Item not found"))
			.andExpect(jsonPath("$.path").value("/test/not-found"))
			.andExpect(jsonPath("$.timestamp").exists())
			.andExpect(jsonPath("$.fieldErrors").doesNotExist());
	}

	@Test
	void badRequestMapsTo400WithMessage() throws Exception {
		mockMvc.perform(get("/test/bad-request"))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.message").value("A tag cannot be related to itself"));
	}

	@Test
	void validationFailureListsFieldErrors() throws Exception {
		mockMvc.perform(post("/test/validated").contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"\"}"))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.message").value("Validation failed"))
			.andExpect(jsonPath("$.fieldErrors.name").value("name is required"));
	}

	@Test
	void malformedJsonMapsTo400() throws Exception {
		mockMvc.perform(post("/test/validated").contentType(MediaType.APPLICATION_JSON).content("{not json"))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.message").value("Malformed request body"));
	}

	@Test
	void typeMismatchNamesTheParameter() throws Exception {
		mockMvc.perform(get("/test/number/abc"))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.message").value("Invalid value for parameter 'n'"));
	}

	@Test
	void accessDeniedMapsTo403() throws Exception {
		mockMvc.perform(get("/test/forbidden"))
			.andExpect(status().isForbidden())
			.andExpect(jsonPath("$.message").value("Access denied"));
	}

	@Test
	void unexpectedExceptionDoesNotLeakDetails() throws Exception {
		mockMvc.perform(get("/test/boom"))
			.andExpect(status().isInternalServerError())
			.andExpect(jsonPath("$.message").value("An unexpected error occurred"));
	}

	record NameRequest(@NotBlank(message = "name is required") String name) {
	}

	@RestController
	static class ThrowingController {

		@GetMapping("/test/not-found")
		String notFound() {
			throw new ResourceNotFoundException("Item not found");
		}

		@GetMapping("/test/bad-request")
		String badRequest() {
			throw new BadRequestException("A tag cannot be related to itself");
		}

		@PostMapping("/test/validated")
		String validated(@Valid @RequestBody NameRequest request) {
			return request.name();
		}

		@GetMapping("/test/number/{n}")
		int number(@PathVariable int n) {
			return n;
		}

		@GetMapping("/test/forbidden")
		String forbidden() {
			throw new AccessDeniedException("nope");
		}

		@GetMapping("/test/boom")
		String boom() {
			throw new IllegalStateException("secret internal detail");
		}

	}

}
