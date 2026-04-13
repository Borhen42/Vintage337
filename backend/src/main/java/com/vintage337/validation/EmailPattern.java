package com.vintage337.validation;

/** Shared with Angular {@code EMAIL_PATTERN} in {@code frontend/src/app/core/validation/email.ts}. */
public final class EmailPattern {

  /**
   * Conventional email: local@host.tld (ASCII). Rejects missing TLD and most typos; matches
   * multi-label domains (e.g. name@mail.example.co.uk).
   */
  public static final String REGEX =
      "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\\.[a-zA-Z]{2,}$";

  private EmailPattern() {}
}
