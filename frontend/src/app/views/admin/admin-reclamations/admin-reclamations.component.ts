import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminReclamationService, type ReclamationRow } from '../../../core/admin/admin-reclamation.service';

@Component({
  selector: 'app-admin-reclamations',
  standalone: true,
  imports: [RouterLink, DatePipe, FormsModule],
  templateUrl: './admin-reclamations.component.html',
  styleUrl: './admin-reclamations.component.scss',
})
export class AdminReclamationsComponent implements OnInit {
  private readonly api = inject(AdminReclamationService);

  readonly rows = signal<ReclamationRow[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly replyDraft = signal<Record<number, string>>({});
  readonly busyId = signal<number | null>(null);

  ngOnInit(): void {
    this.load();
  }

  hasReply(r: ReclamationRow): boolean {
    return !!(r.adminReply && r.adminReply.trim());
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.api.list().subscribe({
      next: (list) => {
        this.rows.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load reclamations.');
        this.loading.set(false);
      },
    });
  }

  draft(r: ReclamationRow): string {
    return this.replyDraft()[r.id] ?? '';
  }

  setDraft(r: ReclamationRow, v: string): void {
    this.replyDraft.update((m) => ({ ...m, [r.id]: v }));
  }

  submitReply(r: ReclamationRow): void {
    const text = (this.replyDraft()[r.id] ?? '').trim();
    if (!text.length) {
      alert('Enter a reply message.');
      return;
    }
    this.busyId.set(r.id);
    this.api.reply(r.id, text).subscribe({
      next: (updated) => {
        this.rows.update((list) => list.map((x) => (x.id === r.id ? updated : x)));
        this.replyDraft.update((m) => {
          const next = { ...m };
          delete next[r.id];
          return next;
        });
        this.busyId.set(null);
        this.openMailto(updated.email, updated.subject, text);
      },
      error: () => {
        this.busyId.set(null);
        alert('Could not save reply.');
      },
    });
  }

  openMailtoOnly(r: ReclamationRow): void {
    const text = (r.adminReply ?? '').trim();
    if (!text) {
      alert('No saved reply yet. Submit a reply first.');
      return;
    }
    this.openMailto(r.email, r.subject, text);
  }

  private openMailto(email: string, subject: string, body: string): void {
    const q =
      'mailto:' +
      encodeURIComponent(email) +
      '?subject=' +
      encodeURIComponent('Re: ' + subject) +
      '&body=' +
      encodeURIComponent(body);
    window.location.href = q;
  }
}
