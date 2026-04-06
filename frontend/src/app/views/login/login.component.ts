import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

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
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(1)]],
  });

  errorMessage = '';
  submitted = false;
  loading = false;

  submit(): void {
    this.submitted = true;
    this.errorMessage = '';
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { email, password } = this.form.getRawValue();
    this.loading = true;
    this.auth.login(email, password).subscribe({
      next: () => {
        this.loading = false;
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
        this.loading = false;
        this.errorMessage = err.message || 'Invalid email or password.';
      },
    });
  }
}
