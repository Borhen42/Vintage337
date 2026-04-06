package com.vintage337.exception;

public class EmailTakenException extends RuntimeException {

  public EmailTakenException() {
    super("This email is already registered.");
  }
}
