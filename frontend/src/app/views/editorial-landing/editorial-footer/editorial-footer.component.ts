import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-editorial-footer',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  templateUrl: './editorial-footer.component.html',
  styleUrl: './editorial-footer.component.scss',
})
export class EditorialFooterComponent {}
