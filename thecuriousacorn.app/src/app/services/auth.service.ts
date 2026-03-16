import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { ApiErrorService } from './api-error.service';

interface AuthResponse {
  token: string;
  user: unknown;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiErrorService = inject(ApiErrorService);

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
  initGoogleAuth(googleAuthToken: string, returnUrl: string = '/dashboard') {
    this.isLoading.set(true);
    this.error.set(null);

    this.http.post(`${this.apiUrl}/google-login`, {
      token: googleAuthToken
    }).subscribe({
      next: (response: unknown) => {
        if (!this.isAuthResponse(response)) {
          this.error.set('Unexpected login response. Please try again.');
          this.isLoading.set(false);
          console.error('Invalid auth response payload', response);
          return;
        }

        this.setAuthData(response);
        this.isLoading.set(false);
        this.router.navigateByUrl(this.normalizeReturnUrl(returnUrl));
      },
      error: (error) => {
        this.error.set(
          this.apiErrorService.toUserMessage(error, {
            default: 'Login failed. Please try again.'
          })
        );
        this.isLoading.set(false);
        console.error('Login error:', error);
      }
    });
  }

  /**
   * Logout user
   */
  logout() {
    this.clearAuthState();
    this.router.navigate(['/login']);
  }

  clearAuthState() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    this.isLoggedIn.set(false);
    this.currentUser.set(null);
  }

  /**
   * Check if user is already logged in
   */
  private checkAuthStatus() {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('user');

    if (token && user) {
      try {
        this.currentUser.set(JSON.parse(user));
        this.isLoggedIn.set(true);
      } catch (error) {
        console.warn('Invalid persisted user payload. Clearing auth state.', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        this.isLoggedIn.set(false);
        this.currentUser.set(null);
      }
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

  private isAuthResponse(response: unknown): response is AuthResponse {
    if (!response || typeof response !== 'object') {
      return false;
    }

    const candidate = response as Partial<AuthResponse>;
    return typeof candidate.token === 'string' && candidate.token.length > 0 && candidate.user != null;
  }

  private normalizeReturnUrl(returnUrl: string): string {
    if (!returnUrl || !returnUrl.startsWith('/')) {
      return '/dashboard';
    }
    return returnUrl;
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