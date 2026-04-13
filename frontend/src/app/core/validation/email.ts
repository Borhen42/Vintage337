import { Validators } from '@angular/forms';

/**
 * Requires a conventional address: local@domain.tld (ASCII; at least one dot in the host).
 * Aligned with backend {@code EmailPattern.REGEX}.
 */
export const EMAIL_PATTERN =
  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

/** For reactive forms: required + pattern. */
export const emailFieldValidators = [Validators.required, Validators.pattern(EMAIL_PATTERN)];
