import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
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
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import gsap from 'gsap';
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
export class RegisterComponent implements AfterViewInit, OnDestroy {
  private readonly fb    = inject(FormBuilder);
  private readonly auth  = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route  = inject(ActivatedRoute);
  private readonly zone   = inject(NgZone);

  @ViewChild('visual')    visual!:    ElementRef<HTMLElement>;
  @ViewChild('formSide')  formSide!:  ElementRef<HTMLElement>;
  @ViewChild('formWrap')  formWrap!:  ElementRef<HTMLElement>;
  @ViewChild('submitBtn') submitBtn!: ElementRef<HTMLButtonElement>;
  @ViewChildren('orb')    orbs!:      QueryList<ElementRef<HTMLElement>>;

  readonly form = this.fb.nonNullable.group(
    {
      fullName:        ['', [Validators.required, Validators.maxLength(120)]],
      email:           ['', emailFieldValidators],
      password:        ['', [Validators.required, Validators.minLength(8), Validators.maxLength(128)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordsMatchValidator },
  );

  errorMessage    = '';
  submitted       = false;
  loading         = false;
  pwdVisible      = false;
  confirmVisible  = false;

  private gsapCtx!: gsap.Context;

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

  submit(): void {
    this.submitted    = true;
    this.errorMessage = '';
    if (this.form.invalid || this.form.hasError('passwordMismatch')) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.loading = true;
    this.auth
      .register({ fullName: v.fullName, email: v.email, password: v.password })
      .subscribe({
        next: () => {
          this.loading = false;
          const returnUrl  = this.route.snapshot.queryParams['returnUrl'] as string | undefined;
          const safeReturn = returnUrl?.startsWith('/') && !returnUrl.startsWith('//') ? returnUrl : undefined;
          void (safeReturn
            ? this.router.navigateByUrl(safeReturn)
            : this.router.navigate(['/'], { fragment: 'heritage-series' }));
        },
        error: (err: Error) => {
          this.loading      = false;
          this.errorMessage = err.message || 'Could not create your account.';
        },
      });
  }
}
