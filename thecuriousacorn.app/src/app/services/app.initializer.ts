import { APP_INITIALIZER } from '@angular/core';
import { ConfigService } from './config.service';


/**
 * Factory function to create the initializer
 */
export function initializeApp(configService: ConfigService) {
  return () => configService.loadConfig();
}

/**
 * Provider to add to app.config.ts
 */
export const appInitializerProvider = {
  provide: APP_INITIALIZER,
  useFactory: initializeApp,
  deps: [ConfigService],
  multi: true
};