package com.digitalwatershed.common;

import java.time.Instant;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Error body returned by every failing API call.
 *
 * <p>{@code message} is the field the React app reads ({@code error.message} in
 * {@code services/api.ts}), so it must always be present and human-readable.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiError(
		int status,
		String error,
		String message,
		String path,
		Instant timestamp,
		Map<String, String> fieldErrors) {

	public static ApiError of(int status, String error, String message, String path) {
		return new ApiError(status, error, message, path, Instant.now(), null);
	}

	public static ApiError withFieldErrors(int status, String error, String message, String path,
			Map<String, String> fieldErrors) {
		return new ApiError(status, error, message, path, Instant.now(), fieldErrors);
	}

}
