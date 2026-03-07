import { Routes } from '@angular/router';
import { LoginComponent } from './login/login';
import { LeafFinderComponent } from './leaf-finder/leaf-finder';
import { authGuard } from './auth/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: LeafFinderComponent, canActivate: [authGuard] },
  { path: '', redirectTo: '/login', pathMatch: 'full' },  // ← Default to login
  { path: '**', redirectTo: '/login' }  // ← Unknown routes → login
];
