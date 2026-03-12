
// src/app/services/config.service.ts
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AppConfig {
  googleClientId: string;
  eventLabsApiKey : string;
  apiUrl: string;
  production: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private http = inject(HttpClient);

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
        this.http.get<AppConfig>(`${apiUrl}/auth/config`)
      );

      this.config.set(config);
      this.isLoaded.set(true);

      console.log('Config loaded successfully', config);
      return config;
    } catch (error) {
      console.error('Failed to load config:', error);
      throw error;
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

   getEventLabsApiKey(): string {
    return this.config()?.eventLabsApiKey || environment.apiUrl;
  }
}