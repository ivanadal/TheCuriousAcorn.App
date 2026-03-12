import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  // Signals
  isLoggedIn = signal(false);
  currentUser = signal<any>(null);
  isLoading = signal(false);
  error = signal<string | null>(null);

  //private apiUrl = 'http://localhost:5002/api/auth';
  private apiUrl = environment.apiUrl+ "/auth"; 

  constructor() {
    this.checkAuthStatus();
  }

  /**
   * Initialize Google OAuth
   */
  initGoogleAuth(googleAuthToken: string) {
    this.isLoading.set(true);
    this.error.set(null);

    this.http.post(`${this.apiUrl}/google-login`, {
      token: googleAuthToken
    }).subscribe({
      next: (response: any) => {
        this.setAuthData(response);
        this.isLoading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.error.set('Login failed. Please try again.');
        this.isLoading.set(false);
        console.error('Login error:', error);
      }
    });
  }

  /**
   * Logout user
   */
  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    this.isLoggedIn.set(false);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  /**
   * Check if user is already logged in
   */
  private checkAuthStatus() {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('user');

    if (token && user) {
      this.isLoggedIn.set(true);
      this.currentUser.set(JSON.parse(user));
    }
  }

  /**
   * Set auth data after successful login
   */
  private setAuthData(response: any) {
    localStorage.setItem('authToken', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    this.isLoggedIn.set(true);
    this.currentUser.set(response.user);
  }

  /**
   * Get auth token
   */
  getAuthToken(): string | null {
    return localStorage.getItem('authToken');
  }

  /**
   * Get current user
   */
  getCurrentUser(): any {
    return this.currentUser();
  }

  /**
   * Check if user has premium subscription
   */
  isPremium(): boolean {
    return this.currentUser()?.isPremium || false;
  }
}