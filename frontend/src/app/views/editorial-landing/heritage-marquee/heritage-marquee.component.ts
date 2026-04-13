import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-heritage-marquee',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './heritage-marquee.component.html',
  styleUrl: './heritage-marquee.component.scss',
})
export class HeritageMarqueeComponent {}
