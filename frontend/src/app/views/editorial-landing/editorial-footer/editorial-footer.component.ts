import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-editorial-footer',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './editorial-footer.component.html',
  styleUrl: './editorial-footer.component.scss',
})
export class EditorialFooterComponent {}
