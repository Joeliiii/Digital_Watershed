package com.digitalwatershed.common;

/**
 * Thrown by services when a requested resource does not exist or is not visible to the caller.
 * Mapped to HTTP 404.
 */
public class ResourceNotFoundException extends RuntimeException {

	public ResourceNotFoundException(String message) {
		super(message);
	}

}
