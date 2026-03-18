import { Injectable } from '@angular/core';

export interface ApiErrorMessageOverrides {
  timeout?: string;
  offline?: string;
  unauthorized?: string;
  server?: string;
  default?: string;
}

const DEFAULT_MESSAGES: Required<ApiErrorMessageOverrides> = {
  timeout: 'The request took too long. If you are on mobile data, try again with a clearer photo or a stronger signal.',
  offline: 'We cannot reach the server right now. Check your connection and try again.',
  unauthorized: 'Your session expired. Please sign in again.',
  server: 'Our servers are busy right now. Please try again in a moment.',
  default: 'Something went wrong. Please try again.'
};

@Injectable({
  providedIn: 'root'
})
export class ApiErrorService {
  toUserMessage(error: unknown, overrides: ApiErrorMessageOverrides = {}): string {
    const messages = { ...DEFAULT_MESSAGES, ...overrides };

    if (this.isTimeoutError(error)) {
      return messages.timeout;
    }

    const status = this.getStatus(error);
    if (status === 0) {
      return messages.offline;
    }
    if (status === 401) {
      return messages.unauthorized;
    }
    if (status >= 500) {
      return messages.server;
    }

    return messages.default;
  }

  private getStatus(error: unknown): number {
    if (!error || typeof error !== 'object') {
      return 0;
    }

    if ('status' in error) {
      const status = Number((error as { status?: number }).status);
      if (!Number.isNaN(status)) {
        return status;
      }
    }

    return 0;
  }

  private isTimeoutError(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }

    const name = 'name' in error ? String((error as { name?: string }).name ?? '') : '';
    const message = 'message' in error ? String((error as { message?: string }).message ?? '') : '';

    return name === 'TimeoutError' || /timeout|timed out/i.test(message);
  }
}
