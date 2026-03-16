import { TestBed } from '@angular/core/testing';
import { ApiErrorService } from './api-error.service';

describe('ApiErrorService', () => {
  let service: ApiErrorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ApiErrorService);
  });

  it('returns timeout message for TimeoutError name', () => {
    const message = service.toUserMessage({ name: 'TimeoutError' });
    expect(message).toBe('The request took too long. Please try again.');
  });

  it('returns offline message for status 0', () => {
    const message = service.toUserMessage({ status: 0 });
    expect(message).toBe('We cannot reach the server right now. Check your connection and try again.');
  });

  it('returns unauthorized message for status 401', () => {
    const message = service.toUserMessage({ status: 401 });
    expect(message).toBe('Your session expired. Please sign in again.');
  });

  it('returns server message for 5xx status', () => {
    const message = service.toUserMessage({ status: 503 });
    expect(message).toBe('Our servers are busy right now. Please try again in a moment.');
  });

  it('returns default message for non-mapped status', () => {
    const message = service.toUserMessage({ status: 400 });
    expect(message).toBe('Something went wrong. Please try again.');
  });

  it('returns timeout message when error message mentions timeout', () => {
    const message = service.toUserMessage({ message: 'Request timed out after 15000ms' });
    expect(message).toBe('The request took too long. Please try again.');
  });

  it('uses override messages when provided', () => {
    const message = service.toUserMessage(
      { status: 401 },
      { unauthorized: 'Please log in again to continue.' }
    );
    expect(message).toBe('Please log in again to continue.');
  });
});
