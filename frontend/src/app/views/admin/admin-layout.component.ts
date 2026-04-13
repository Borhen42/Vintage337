import { DatePipe } from '@angular/common';
import {
  afterNextRender,
  Component,
  ElementRef,
  HostListener,
  Injector,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import gsap from 'gsap';
import { Subscription, interval, startWith, switchMap } from 'rxjs';
import type { NotificationFeed } from '../../core/admin/admin-notifications.service';
import { AdminNotificationsService } from '../../core/admin/admin-notifications.service';
import { AuthService } from '../../core/auth/auth.service';
import { LanguageSwitcherComponent } from '../../shared/language-switcher/language-switcher.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    FormsModule,
    DatePipe,
    LanguageSwitcherComponent,
    TranslatePipe,
  ],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss',
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notifications = inject(AdminNotificationsService);
  private readonly injector = inject(Injector);
  private readonly translate = inject(TranslateService);
  private sub?: Subscription;
  private prevOrders = 0;
  private prevReclams = 0;
  private firstPoll = true;

  private readonly bellBtn = viewChild<ElementRef<HTMLElement>>('bellBtn');
  private readonly notifPanelRef = viewChild<ElementRef<HTMLElement>>('notifPanel');
  private readonly attentionBannerRef = viewChild<ElementRef<HTMLElement>>('attentionBanner');

  searchQuery = '';
  readonly pendingOrders = signal(0);
  readonly pendingReclamations = signal(0);
  readonly bannerDismissed = signal(false);
  readonly notificationsOpen = signal(false);
  readonly notificationFeed = signal<NotificationFeed | null>(null);
  readonly notificationFeedLoading = signal(false);
  readonly notificationFeedError = signal(false);

  readonly attentionTotal = computed(() => this.pendingOrders() + this.pendingReclamations());

  readonly showAttentionBanner = computed(
    () => !this.bannerDismissed() && (this.pendingOrders() > 0 || this.pendingReclamations() > 0),
  );

  readonly displayName = computed(() => {
    const e = this.auth.email();
    if (!e) return 'Admin';
    const local = e.split('@')[0];
    return local ? local.charAt(0).toUpperCase() + local.slice(1) : 'Admin';
  });

  ngOnInit(): void {
    this.sub = interval(30_000)
      .pipe(startWith(0), switchMap(() => this.notifications.attentionSummary()))
      .subscribe({
        next: (r) => {
          const o = Math.max(0, Math.floor(Number(r.pendingOrders) || 0));
          const rec = Math.max(0, Math.floor(Number(r.pendingReclamations) || 0));
          if (!this.firstPoll) {
            const grew = (o > this.prevOrders && o > 0) || (rec > this.prevReclams && rec > 0);
            if (grew) {
              this.bannerDismissed.set(false);
              this.pulseBell();
            }
          }
          this.firstPoll = false;
          this.prevOrders = o;
          this.prevReclams = rec;
          this.pendingOrders.set(o);
          this.pendingReclamations.set(rec);
          if (this.notificationsOpen()) {
            this.refreshNotificationFeed();
          }
        },
        error: () => {},
      });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(ev: MouseEvent): void {
    if (!this.notificationsOpen()) return;
    const panel = this.notifPanelRef()?.nativeElement;
    const bell = this.bellBtn()?.nativeElement;
    const banner = this.attentionBannerRef()?.nativeElement;
    const t = ev.target as Node;
    if (bell?.contains(t) || panel?.contains(t) || banner?.contains(t)) return;
    this.notificationsOpen.set(false);
  }

  @HostListener('document:keydown.escape')
  onEscapeCloseNotif(): void {
    if (this.notificationsOpen()) {
      this.notificationsOpen.set(false);
    }
  }

  toggleNotificationsPanel(ev: Event): void {
    ev.stopPropagation();
    if (this.notificationsOpen()) {
      this.notificationsOpen.set(false);
    } else {
      this.openNotificationsPanel();
    }
  }

  openNotificationsPanel(): void {
    this.notificationsOpen.set(true);
    this.refreshNotificationFeed();
  }

  onBannerBackgroundClick(ev: MouseEvent): void {
    if ((ev.target as HTMLElement).closest('button')) return;
    ev.stopPropagation();
    this.openNotificationsPanel();
  }

  refreshNotificationFeed(): void {
    this.notificationFeedLoading.set(true);
    this.notificationFeedError.set(false);
    this.notifications.attentionFeed().subscribe({
      next: (f) => {
        this.notificationFeed.set(f);
        this.notificationFeedLoading.set(false);
      },
      error: () => {
        this.notificationFeedLoading.set(false);
        this.notificationFeedError.set(true);
      },
    });
  }

  closeNotificationsPanel(): void {
    this.notificationsOpen.set(false);
  }

  goToOrderFromFeed(): void {
    this.closeNotificationsPanel();
    void this.router.navigate(['/admin', 'orders']);
  }

  goToReclamationFromFeed(): void {
    this.closeNotificationsPanel();
    void this.router.navigate(['/admin', 'reclamations']);
  }

  notificationAriaLabel(): string {
    if (this.attentionTotal() > 0) {
      return `${this.attentionTotal()} ${this.translate.instant('adminLayout.openNotificationList')}`;
    }
    return this.translate.instant('adminLayout.openNotificationList');
  }

  pendingOrdersText(): string {
    return this.translate.instant('adminLayout.ordersAwaitingAcceptance', {
      count: this.pendingOrders(),
    });
  }

  pendingReclamationsText(): string {
    return this.translate.instant('adminLayout.reclamationsAwaitingReply', {
      count: this.pendingReclamations(),
    });
  }

  private pulseBell(): void {
    if (typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    afterNextRender(
      () => {
        const el = this.bellBtn()?.nativeElement;
        if (!el) return;
        gsap.killTweensOf(el);
        gsap.fromTo(
          el,
          { rotate: -11 },
          {
            rotate: 11,
            duration: 0.09,
            repeat: 5,
            yoyo: true,
            ease: 'power1.inOut',
            clearProps: 'transform',
          },
        );
      },
      { injector: this.injector },
    );
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  submitSearch(): void {
    const q = this.searchQuery.trim();
    void this.router.navigate(['/catalogue'], { queryParams: q ? { q } : {} });
  }

  dismissAttentionBanner(): void {
    this.bannerDismissed.set(true);
  }

  goToOrders(): void {
    this.bannerDismissed.set(true);
    void this.router.navigate(['/admin', 'orders']);
  }

  goToReclamations(): void {
    this.bannerDismissed.set(true);
    void this.router.navigate(['/admin', 'reclamations']);
  }

  signOut(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/login');
  }
}
