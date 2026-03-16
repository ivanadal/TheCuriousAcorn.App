import {
  TestBed,
  fakeAsync,
  flushMicrotasks,
  tick
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

  it('loads config from backend and updates state', fakeAsync(() => {
    const remoteConfig: AppConfig = {
      googleClientId: 'google-client-id',
      eventLabsApiKey: 'event-labs-key',
      apiUrl: 'https://api.example.com',
      production: true
    };

    let result: AppConfig | undefined;
    service.loadConfig().then((value) => {
      result = value;
    });

    const req = httpMock.expectOne(endpoint);
    expect(req.request.method).toBe('GET');
    req.flush(remoteConfig);

    flushMicrotasks();

    expect(result).toEqual(remoteConfig);
    expect(service.isLoaded()).toBe(true);
    expect(service.getConfig()).toEqual(remoteConfig);
    expect(service.getGoogleClientId()).toBe('google-client-id');
    expect(service.getApiUrl()).toBe('https://api.example.com');
  }));

  it('falls back to safe defaults after retries are exhausted', fakeAsync(() => {
    let result: AppConfig | undefined;
    service.loadConfig().then((value) => {
      result = value;
    });

    const firstAttempt = httpMock.expectOne(endpoint);
    firstAttempt.flush('error', { status: 500, statusText: 'Server Error' });
    tick(700);

    const secondAttempt = httpMock.expectOne(endpoint);
    secondAttempt.flush('error', { status: 500, statusText: 'Server Error' });
    tick(700);

    const thirdAttempt = httpMock.expectOne(endpoint);
    thirdAttempt.flush('error', { status: 500, statusText: 'Server Error' });

    flushMicrotasks();

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
  }));
});
