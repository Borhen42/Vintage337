import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { emailFieldValidators } from '../../core/validation/email';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly route = inject(ActivatedRoute);

  readonly form = this.fb.nonNullable.group({
    email: ['', emailFieldValidators],
    password: ['', [Validators.required, Validators.minLength(1)]],
  });

  submitted = false;
  loading = false;
  /** When true, password is shown as plain text. */
  passwordVisible = false;

  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  submit(): void {
    this.submitted = true;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { email, password } = this.form.getRawValue();
    this.loading = true;
    this.auth
      .login(email, password)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
      next: () => {
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] as string | undefined;
        const safeReturn =
          returnUrl && returnUrl.startsWith('/') && !returnUrl.startsWith('//') ? returnUrl : undefined;
        if (this.auth.isAdmin()) {
          if (safeReturn?.startsWith('/admin')) {
            void this.router.navigateByUrl(safeReturn);
          } else {
            void this.router.navigateByUrl('/admin/dashboard');
          }
        } else {
          if (safeReturn) {
            void this.router.navigateByUrl(safeReturn);
          } else {
            void this.router.navigate(['/'], { fragment: 'heritage-series' });
          }
        }
      },
      error: (err: Error) => {
        const text = err.message || 'Invalid email or password.';
        const wrongCreds =
          /invalid email or password/i.test(text) || /invalid credentials/i.test(text);
        void Swal.fire({
          icon: 'error',
          title: wrongCreds ? 'Invalid email or password' : "Couldn't sign you in",
          text: wrongCreds
            ? 'Please check your email and password, then try again.'
            : text,
          confirmButtonText: 'Try again',
          confirmButtonColor: '#5c3d2e',
          focusConfirm: true,
        });
      },
    });
  }
}

