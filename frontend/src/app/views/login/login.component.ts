import {
  AfterViewInit,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  QueryList,
  ViewChild,
  ViewChildren,
  inject,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { finalize } from 'rxjs';
import gsap from 'gsap';
import { AuthService } from '../../core/auth/auth.service';
import { emailFieldValidators } from '../../core/validation/email';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements AfterViewInit, OnDestroy {
  private readonly fb     = inject(FormBuilder);
  private readonly auth   = inject(AuthService);
  private readonly router = inject(Router);
  private readonly zone   = inject(NgZone);
  readonly route          = inject(ActivatedRoute);

  @ViewChild('visual')    visual!:    ElementRef<HTMLElement>;
  @ViewChild('formSide')  formSide!:  ElementRef<HTMLElement>;
  @ViewChild('formWrap')  formWrap!:  ElementRef<HTMLElement>;
  @ViewChild('submitBtn') submitBtn!: ElementRef<HTMLButtonElement>;
  @ViewChildren('orb')    orbs!:      QueryList<ElementRef<HTMLElement>>;

  readonly form = this.fb.nonNullable.group({
    email:      [this.savedEmail(), emailFieldValidators],
    password:   ['', [Validators.required, Validators.minLength(1)]],
    rememberMe: [this.savedEmail() !== ''],
  });

  submitted        = false;
  loading          = false;
  passwordVisible  = false;

  private gsapCtx!: gsap.Context;

  private savedEmail(): string {
    try { return localStorage.getItem('v337_saved_email') ?? ''; } catch { return ''; }
  }

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      this.gsapCtx = gsap.context(() => {
        this.runEntrance();
        this.runOrbs();
        this.initMagneticBtn();
      });
    });
  }

  ngOnDestroy(): void {
    this.gsapCtx?.revert();
  }

  private runEntrance(): void {
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.from(this.visual.nativeElement,   { xPercent: -6, opacity: 0, duration: 1.3 })
      .from(this.formSide.nativeElement, { xPercent:  5, opacity: 0, duration: 1.1 }, '-=1.1')
      .from(
        this.formWrap.nativeElement.querySelectorAll('.lp-anim'),
        { opacity: 0, y: 26, stagger: 0.09, duration: 0.65, ease: 'power3.out' },
        '-=0.75',
      );
  }

  private runOrbs(): void {
    const configs = [
      { y: -48, x:  10, duration: 4.4 },
      { y:  32, x: -16, duration: 5.9, delay: 0.8 },
      { y: -24, x:  22, duration: 6.8, delay: 1.6 },
      { y:  38, x:  -6, duration: 3.7, delay: 0.3 },
    ];
    this.orbs.toArray().forEach((ref, i) => {
      const c = configs[i] ?? configs[0];
      gsap.to(ref.nativeElement, { ...c, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    });
  }

  private initMagneticBtn(): void {
    const btn = this.submitBtn?.nativeElement;
    if (!btn) return;
    btn.addEventListener('mousemove', (e: MouseEvent) => {
      const r  = btn.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width  / 2)) * 0.28;
      const dy = (e.clientY - (r.top  + r.height / 2)) * 0.32;
      gsap.to(btn, { x: dx, y: dy, duration: 0.3, ease: 'power2.out' });
    });
    btn.addEventListener('mouseleave', () => {
      gsap.to(btn, { x: 0, y: 0, duration: 0.75, ease: 'elastic.out(1, 0.38)' });
    });
  }

  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  submit(): void {
    this.submitted = true;
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    const { email, password, rememberMe } = this.form.getRawValue();
    try {
      rememberMe
        ? localStorage.setItem('v337_saved_email', email)
        : localStorage.removeItem('v337_saved_email');
    } catch { /* ignore */ }

    this.loading = true;
    this.auth
      .login(email, password)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => {
          const returnUrl  = this.route.snapshot.queryParams['returnUrl'] as string | undefined;
          const safeReturn = returnUrl?.startsWith('/') && !returnUrl.startsWith('//') ? returnUrl : undefined;
          if (this.auth.isAdmin()) {
            void this.router.navigateByUrl(safeReturn?.startsWith('/admin') ? safeReturn : '/admin/dashboard');
          } else {
            void (safeReturn
              ? this.router.navigateByUrl(safeReturn)
              : this.router.navigate(['/'], { fragment: 'heritage-series' }));
          }
        },
        error: (err: Error) => {
          const text       = err.message || 'Invalid email or password.';
          const wrongCreds = /invalid email or password/i.test(text) || /invalid credentials/i.test(text);
          void Swal.fire({
            icon: 'error',
            title: wrongCreds ? 'Invalid email or password' : "Couldn't sign you in",
            text:  wrongCreds ? 'Please check your email and password, then try again.' : text,
            confirmButtonText:  'Try again',
            confirmButtonColor: '#994703',
            focusConfirm: true,
          });
        },
      });
  }
}
