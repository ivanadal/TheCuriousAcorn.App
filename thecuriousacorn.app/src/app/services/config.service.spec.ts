import {
  TestBed
} from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';

import { ConfigService, AppConfig } from './config.service';
import { environment } from '../../environments/environment';

describe('ConfigService', () => {
  let service: ConfigService;
  let httpMock: HttpTestingController;

  const endpoint = `${environment.apiUrl}/auth/config`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });

    service = TestBed.inject(ConfigService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('loads config from backend and updates state', async () => {
    const remoteConfig: AppConfig = {
      googleClientId: 'google-client-id',
      eventLabsApiKey: 'event-labs-key',
      apiUrl: 'https://api.example.com',
      production: true
    };

    const resultPromise = service.loadConfig();

    const req = httpMock.expectOne(endpoint);
    expect(req.request.method).toBe('GET');
    req.flush(remoteConfig);

    const result = await resultPromise;

    expect(result).toEqual(remoteConfig);
    expect(service.isLoaded()).toBe(true);
    expect(service.getConfig()).toEqual(remoteConfig);
    expect(service.getGoogleClientId()).toBe('google-client-id');
    expect(service.getApiUrl()).toBe('https://api.example.com');
  });

  it('falls back to safe defaults after retries are exhausted', async () => {
    const resultPromise = service.loadConfig();

    const firstAttempt = httpMock.expectOne(endpoint);
    firstAttempt.flush('error', { status: 500, statusText: 'Server Error' });
    await new Promise((resolve) => setTimeout(resolve, 750));

    const secondAttempt = httpMock.expectOne(endpoint);
    secondAttempt.flush('error', { status: 500, statusText: 'Server Error' });
    await new Promise((resolve) => setTimeout(resolve, 750));

    const thirdAttempt = httpMock.expectOne(endpoint);
    thirdAttempt.flush('error', { status: 500, statusText: 'Server Error' });

    const result = await resultPromise;

    const fallbackConfig: AppConfig = {
      googleClientId: '',
      eventLabsApiKey: '',
      apiUrl: environment.apiUrl,
      production: environment.production
    };

    expect(result).toEqual(fallbackConfig);
    expect(service.isLoaded()).toBe(true);
    expect(service.getConfig()).toEqual(fallbackConfig);
    expect(service.getGoogleClientId()).toBe('');
    expect(service.getApiUrl()).toBe(environment.apiUrl);
  });
});
