
// src/app/services/config.service.ts
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, retry, timeout } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiErrorService } from './api-error.service';

export interface AppConfig {
  googleClientId: string;
  apiUrl: string;
  production: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private http = inject(HttpClient);
  private apiErrorService = inject(ApiErrorService);

  config = signal<AppConfig | null>(null);
  isLoaded = signal(false);

  /**
   * Load configuration from backend
   * Uses apiUrl from environment.ts
   */
  async loadConfig(): Promise<AppConfig> {
    try {
      // Use API URL from environment
      const apiUrl = environment.apiUrl;
      console.log(`Loading config from: ${apiUrl}/auth/config`);

      const config = await firstValueFrom(
        this.http.get<AppConfig>(`${apiUrl}/auth/config`).pipe(
          timeout(6000),
          retry({ count: 2, delay: 700 })
        )
      );

      this.config.set(config);
      this.isLoaded.set(true);

      console.log('Config loaded successfully', config);
      return config;
    } catch (error) {
      const userMessage = this.apiErrorService.toUserMessage(error, {
        default: 'Unable to load remote config. Using safe defaults.'
      });
      console.error('Failed to load config after retries:', {
        endpoint: `${environment.apiUrl}/auth/config`,
        userMessage,
        error
      });
      const fallbackConfig: AppConfig = {
        googleClientId: '',
        apiUrl: environment.apiUrl,
        production: environment.production
      };

      // Keep app booting in local/offline scenarios while using safe defaults.
      this.config.set(fallbackConfig);
      this.isLoaded.set(true);
      return fallbackConfig;
    }
  }

  /**
   * Get current config
   */
  getConfig(): AppConfig | null {
    return this.config();
  }

  /**
   * Get Google Client ID
   */
  getGoogleClientId(): string {
    return this.config()?.googleClientId || '';
  }

  /**
   * Get API URL
   */
  getApiUrl(): string {
    return this.config()?.apiUrl || environment.apiUrl;
  }

}