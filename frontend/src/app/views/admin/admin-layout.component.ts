import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Subscription, interval, startWith, switchMap } from 'rxjs';
import { AdminNotificationsService } from '../../core/admin/admin-notifications.service';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss',
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notifications = inject(AdminNotificationsService);
  private sub?: Subscription;
  private prevPending = 0;

  searchQuery = '';
  readonly pendingCount = signal(0);
  readonly bannerDismissed = signal(false);

  readonly displayName = computed(() => {
    const e = this.auth.email();
    if (!e) return 'Admin';
    const local = e.split('@')[0];
    return local ? local.charAt(0).toUpperCase() + local.slice(1) : 'Admin';
  });

  ngOnInit(): void {
    this.sub = interval(30_000)
      .pipe(
        startWith(0),
        switchMap(() => this.notifications.pendingOrderCount()),
      )
      .subscribe({
        next: (r) => {
          const n = Math.max(0, Math.floor(Number(r.count) || 0));
          if (n > this.prevPending && n > 0) {
            this.bannerDismissed.set(false);
          }
          this.prevPending = n;
          this.pendingCount.set(n);
        },
        error: () => {},
      });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  submitSearch(): void {
    const q = this.searchQuery.trim();
    void this.router.navigate(['/catalogue'], { queryParams: q ? { q } : {} });
  }

  dismissPendingBanner(): void {
    this.bannerDismissed.set(true);
  }

  goToOrders(): void {
    this.bannerDismissed.set(true);
    void this.router.navigate(['/admin', 'orders']);
  }

  signOut(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/login');
  }
}
