import { Injectable, inject } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private authService = inject(AuthService);
  private router = inject(Router);
  private isRedirecting = false;

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = this.authService.getAuthToken();

    if (token) {
      // Clone the request and add the authorization header
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(request).pipe(
      catchError((error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 401) {
          this.authService.clearAuthState();
          this.redirectToLogin();
        }

        return throwError(() => error);
      })
    );
  }

  private redirectToLogin(): void {
    if (this.isRedirecting) {
      return;
    }

    const currentUrl = this.router.url && this.router.url !== '/login' ? this.router.url : '/dashboard';
    this.isRedirecting = true;
    this.router
      .navigate(['/login'], { queryParams: { returnUrl: currentUrl } })
      .finally(() => {
        this.isRedirecting = false;
      });
  }
}