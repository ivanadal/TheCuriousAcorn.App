import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { HTTP_INTERCEPTORS, provideHttpClient } from '@angular/common/http';
import { AuthInterceptor } from './auth/auth.interceptor';
import { appInitializerProvider } from './services/app.initializer';


export const appConfig: ApplicationConfig = {
  providers: [
    // Router configuration
    provideRouter(routes),

    // HTTP client with interceptors
    provideHttpClient(),

    // Load config from backend before app starts
    appInitializerProvider,

    // Register auth interceptor (class-based)
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },

  ]
};