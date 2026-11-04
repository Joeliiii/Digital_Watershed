package com.digitalwatershed.common;

/**
 * Thrown by services when a request is well-formed but violates a business rule
 * (for example, relating a tag to itself). Mapped to HTTP 400.
 */
public class BadRequestException extends RuntimeException {

	public BadRequestException(String message) {
		super(message);
	}

}
