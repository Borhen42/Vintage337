import { Component, inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { emailFieldValidators } from '../../core/validation/email';

const passwordsMatchValidator: ValidatorFn = (
  group: AbstractControl,
): ValidationErrors | null => {
  const p = group.get('password')?.value as string | undefined;
  const c = group.get('confirmPassword')?.value as string | undefined;
  if (p === undefined || c === undefined || c === '') return null;
  return p === c ? null : { passwordMismatch: true };
};

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly form = this.fb.nonNullable.group(
    {
      fullName: ['', [Validators.required, Validators.maxLength(120)]],
      email: ['', emailFieldValidators],
      password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(128)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordsMatchValidator },
  );

  errorMessage = '';
  submitted = false;
  loading = false;

  submit(): void {
    this.submitted = true;
    this.errorMessage = '';
    if (this.form.invalid || this.form.hasError('passwordMismatch')) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.loading = true;
    this.auth
      .register({
        fullName: v.fullName,
        email: v.email,
        password: v.password,
      })
      .subscribe({
        next: () => {
          this.loading = false;
          const returnUrl = this.route.snapshot.queryParams['returnUrl'] as string | undefined;
          const safeReturn =
            returnUrl && returnUrl.startsWith('/') && !returnUrl.startsWith('//') ? returnUrl : undefined;
          if (safeReturn) {
            void this.router.navigateByUrl(safeReturn);
          } else {
            void this.router.navigate(['/'], { fragment: 'heritage-series' });
          }
        },
        error: (err: Error) => {
          this.loading = false;
          this.errorMessage = err.message || 'Could not create your account.';
        },
      });
  }
}
