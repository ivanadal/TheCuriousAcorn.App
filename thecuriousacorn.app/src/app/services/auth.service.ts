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
  private sessionExpiryTimeoutId: ReturnType<typeof setTimeout> | null = null;

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

  hasActiveSession(): boolean {
    const token = this.getAuthToken();
    if (!token) {
      this.clearAuthState();
      return false;
    }

    if (this.isTokenExpired(token)) {
      this.clearAuthState();
      return false;
    }

    return this.isLoggedIn();
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
        const normalized = this.normalizeAuthResponse(response);
        if (!normalized) {
          this.error.set('Unexpected login response. Please try again.');
          this.isLoading.set(false);
          console.error('Invalid auth response payload', response);
          return;
        }

        this.setAuthData(normalized);
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
    this.clearSessionExpiryTimer();
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
        if (this.isTokenExpired(token)) {
          this.clearAuthState();
          return;
        }

        this.currentUser.set(JSON.parse(user));
        this.isLoggedIn.set(true);
        this.scheduleAutoLogout(token);
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
  private setAuthData(response: AuthResponse) {
    localStorage.setItem('authToken', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    this.isLoggedIn.set(true);
    this.currentUser.set(response.user);
    this.scheduleAutoLogout(response.token);
  }

  private isAuthResponse(response: unknown): response is AuthResponse {
    if (!response || typeof response !== 'object') {
      return false;
    }

    const candidate = response as Partial<AuthResponse>;
    return typeof candidate.token === 'string' && candidate.token.length > 0 && candidate.user != null;
  }

  private normalizeAuthResponse(response: unknown): AuthResponse | null {
    if (!response || typeof response !== 'object') {
      return null;
    }

    const root = response as Record<string, unknown>;
    const nested = root['data'] && typeof root['data'] === 'object' ? (root['data'] as Record<string, unknown>) : null;
    const rootTokens = root['tokens'] && typeof root['tokens'] === 'object' ? (root['tokens'] as Record<string, unknown>) : null;
    const nestedTokens = nested?.['tokens'] && typeof nested['tokens'] === 'object' ? (nested['tokens'] as Record<string, unknown>) : null;

    const token = this.getFirstString(
      root['token'],
      root['accessToken'],
      root['authToken'],
      root['idToken'],
      root['refreshToken'],
      rootTokens?.['token'],
      rootTokens?.['accessToken'],
      rootTokens?.['authToken'],
      rootTokens?.['idToken'],
      rootTokens?.['refreshToken'],
      root['jwt'],
      nested?.['token'],
      nested?.['accessToken'],
      nested?.['authToken'],
      nested?.['idToken'],
      nested?.['refreshToken'],
      nestedTokens?.['token'],
      nestedTokens?.['accessToken'],
      nestedTokens?.['authToken'],
      nestedTokens?.['idToken'],
      nestedTokens?.['refreshToken'],
      nested?.['jwt']
    );

    const user =
      root['user'] ??
      root['profile'] ??
      root['me'] ??
      nested?.['user'] ??
      nested?.['profile'] ??
      nested?.['me'];

    if (typeof token !== 'string' || token.length === 0 || user == null) {
      return null;
    }

    return { token, user };
  }

  private getFirstString(...values: unknown[]): string | null {
    for (const value of values) {
      if (typeof value === 'string' && value.length > 0) {
        return value;
      }
    }
    return null;
  }

  private normalizeReturnUrl(returnUrl: string): string {
    if (!returnUrl || !returnUrl.startsWith('/')) {
      return '/dashboard';
    }
    return returnUrl;
  }

  private isTokenExpired(token: string): boolean {
    const expiryMs = this.getTokenExpiryMs(token);
    if (expiryMs == null) {
      return false;
    }

    return expiryMs <= Date.now();
  }

  private getTokenExpiryMs(token: string): number | null {
    const payload = this.parseJwtPayload(token);
    const expiry = payload?.['exp'];

    if (typeof expiry !== 'number') {
      return null;
    }

    return Math.floor(expiry * 1000);
  }

  private scheduleAutoLogout(token: string): void {
    this.clearSessionExpiryTimer();

    const expiryMs = this.getTokenExpiryMs(token);
    if (expiryMs == null) {
      return;
    }

    const remainingMs = Math.max(expiryMs - Date.now(), 0);
    this.sessionExpiryTimeoutId = setTimeout(() => {
      this.clearAuthState();
      this.redirectToLoginAfterExpiry();
    }, remainingMs);
  }

  private clearSessionExpiryTimer(): void {
    if (this.sessionExpiryTimeoutId != null) {
      clearTimeout(this.sessionExpiryTimeoutId);
      this.sessionExpiryTimeoutId = null;
    }
  }

  private redirectToLoginAfterExpiry(): void {
    const currentUrl = this.router.url;
    if (currentUrl === '/login') {
      return;
    }

    this.router.navigate(['/login'], {
      queryParams: {
        returnUrl: currentUrl && currentUrl !== '/' ? currentUrl : '/dashboard'
      }
    });
  }

  private parseJwtPayload(token: string): Record<string, unknown> | null {
    const parts = token.split('.');
    if (parts.length < 2) {
      return null;
    }

    try {
      const normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
      const decoded = atob(padded);
      return JSON.parse(decoded) as Record<string, unknown>;
    } catch {
      return null;
    }
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