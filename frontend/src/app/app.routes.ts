import { Routes } from '@angular/router';
import { adminGuard, customerGuard, guestGuard } from './core/auth/auth.guard';
import { EditorialLandingComponent } from './views/editorial-landing/editorial-landing.component';
import { AdminLayoutComponent } from './views/admin/admin-layout.component';
import { AdminDashboardComponent } from './views/admin/admin-dashboard/admin-dashboard.component';
import { AdminProductFormComponent } from './views/admin/admin-product-form/admin-product-form.component';
import { AdminOrdersComponent } from './views/admin/admin-orders/admin-orders.component';
import { AdminCustomersComponent } from './views/admin/admin-customers/admin-customers.component';
import { AdminReclamationsComponent } from './views/admin/admin-reclamations/admin-reclamations.component';
import { ReclamationPageComponent } from './views/reclamation-page/reclamation-page.component';
import { LoginComponent } from './views/login/login.component';
import { RegisterComponent } from './views/register/register.component';
import { ArchivePageComponent } from './views/archive-page/archive-page.component';
import { CataloguePageComponent } from './views/catalogue-page/catalogue-page.component';
import { CollectionPageComponent } from './views/collection-page/collection-page.component';
import { ProductDetailPageComponent } from './views/product-detail-page/product-detail-page.component';
import { CartPageComponent } from './views/cart-page/cart-page.component';

export const routes: Routes = [
  { path: '', component: EditorialLandingComponent },
  { path: 'archive', component: ArchivePageComponent },
  { path: 'catalogue', component: CataloguePageComponent },
  { path: 'reclamation', component: ReclamationPageComponent },
  { path: 'collection', component: CollectionPageComponent },
  { path: 'product/:id', component: ProductDetailPageComponent },
  {
    path: 'cart',
    component: CartPageComponent,
    canActivate: [customerGuard],
  },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [guestGuard],
  },
  {
    path: 'register',
    component: RegisterComponent,
    canActivate: [guestGuard],
  },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [adminGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'orders', component: AdminOrdersComponent },
      { path: 'customers', component: AdminCustomersComponent },
      { path: 'reclamations', component: AdminReclamationsComponent },
      { path: 'products/new', component: AdminProductFormComponent },
      { path: 'products/:id/edit', component: AdminProductFormComponent },
    ],
  },
  { path: '**', redirectTo: '' },
];
