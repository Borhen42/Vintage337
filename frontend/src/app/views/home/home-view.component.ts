import { Component, OnInit, inject, signal } from '@angular/core';
import { ApiController } from '../../controllers/api.controller';
import { SceneThreeComponent } from '../scene-three/scene-three.component';

@Component({
  selector: 'app-home-view',
  standalone: true,
  imports: [SceneThreeComponent],
  templateUrl: './home-view.component.html',
  styleUrl: './home-view.component.scss',
})
export class HomeViewComponent implements OnInit {
  private readonly api = inject(ApiController);

  readonly backendStatus = signal<string>('Checking API…');

  ngOnInit(): void {
    this.api.health().subscribe({
      next: (h) => this.backendStatus.set(`${h.service}: ${h.status}`),
      error: () =>
        this.backendStatus.set(
          'API unreachable (start Spring Boot on port 8080 and use ng serve).',
        ),
    });
  }
}
