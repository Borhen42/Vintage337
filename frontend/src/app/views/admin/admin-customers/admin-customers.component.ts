import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { AdminUserService, type AdminUserRow } from '../../../core/admin/admin-user.service';

@Component({
  selector: 'app-admin-customers',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './admin-customers.component.html',
  styleUrl: './admin-customers.component.scss',
})
export class AdminCustomersComponent implements OnInit {
  private readonly usersApi = inject(AdminUserService);

  readonly users = signal<AdminUserRow[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly busyId = signal<number | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.usersApi.list().subscribe({
      next: (rows) => {
        this.users.set(rows);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load users.');
        this.loading.set(false);
      },
    });
  }

  makeAdmin(u: AdminUserRow): void {
    this.patch(u.id, () => this.usersApi.setRole(u.id, 'ADMIN'));
  }

  makeCustomer(u: AdminUserRow): void {
    this.patch(u.id, () => this.usersApi.setRole(u.id, 'CUSTOMER'));
  }

  toggleBlock(u: AdminUserRow): void {
    this.patch(u.id, () => this.usersApi.setBlocked(u.id, !u.blocked));
  }

  remove(u: AdminUserRow): void {
    if (!window.confirm(`Delete account ${u.email}? This cannot be undone.`)) return;
    this.busyId.set(u.id);
    this.usersApi.delete(u.id).subscribe({
      next: () => {
        this.users.update((list) => list.filter((x) => x.id !== u.id));
        this.busyId.set(null);
      },
      error: (err: { error?: { message?: string } }) => {
        this.busyId.set(null);
        alert(err.error?.message ?? 'Could not delete user.');
      },
    });
  }

  private patch(id: number, req: () => Observable<AdminUserRow>): void {
    this.busyId.set(id);
    req().subscribe({
      next: (updated) => {
        this.users.update((list) => list.map((x) => (x.id === id ? updated : x)));
        this.busyId.set(null);
      },
      error: (err: { error?: { message?: string } }) => {
        this.busyId.set(null);
        alert(err.error?.message ?? 'Request failed.');
      },
    });
  }
}
