import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminReclamationService } from '../../core/admin/admin-reclamation.service';
import { AuthService } from '../../core/auth/auth.service';
import { EditorialNavbarComponent } from '../editorial-landing/editorial-navbar/editorial-navbar.component';

@Component({
  selector: 'app-reclamation-page',
  standalone: true,
  imports: [EditorialNavbarComponent, ReactiveFormsModule, RouterLink],
  templateUrl: './reclamation-page.component.html',
  styleUrl: './reclamation-page.component.scss',
})
export class ReclamationPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(AdminReclamationService);
  private readonly auth = inject(AuthService);

  readonly form = this.fb.nonNullable.group({
    fullName: ['', [Validators.maxLength(120)]],
    email: ['', [Validators.required, Validators.email]],
    subject: ['', [Validators.required, Validators.maxLength(200)]],
    message: ['', [Validators.required, Validators.maxLength(8000)]],
  });

  submitting = false;
  success = false;
  errorMsg = '';

  ngOnInit(): void {
    const e = this.auth.email();
    if (e) {
      this.form.patchValue({ email: e });
    }
  }

  submit(): void {
    this.errorMsg = '';
    this.success = false;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting = true;
    const v = this.form.getRawValue();
    this.api
      .submit({
        email: v.email.trim(),
        fullName: v.fullName.trim() || undefined,
        subject: v.subject.trim(),
        message: v.message.trim(),
      })
      .subscribe({
        next: () => {
          this.submitting = false;
          this.success = true;
          this.form.reset({ email: this.auth.email() ?? '', fullName: '', subject: '', message: '' });
        },
        error: () => {
          this.submitting = false;
          this.errorMsg = 'We could not send your message. Please try again later.';
        },
      });
  }
}
