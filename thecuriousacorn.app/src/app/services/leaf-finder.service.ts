import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, retry, timeout } from 'rxjs';
import { environment } from '../../environments/environment';

export interface LeafAnalysisResult {
  leafName: string;
  explanation: string;
  funFact: string;
}

export type LeafLanguage = 'en' | 'es' | 'sr';

@Injectable({ providedIn: 'root' })
export class LeafService {
  constructor(private http: HttpClient) {}

  analyzeLeaf(base64Image: string, ageGroup: string, language: LeafLanguage = 'en'): Observable<LeafAnalysisResult> {
    const endpointByLanguage: Record<LeafLanguage, string> = {
      en: `${environment.apiUrl}/leafanalysis/analyze`,
      es: `${environment.apiUrl}/leafanalysis/analyze/es`,
      sr: `${environment.apiUrl}/leafanalysis/analyze/sr`
    };

    return this.http
      .post<LeafAnalysisResult>(endpointByLanguage[language], {
        imageBase64: base64Image,
        ageGroup: ageGroup
      })
      .pipe(
        timeout(15000),
        retry({ count: 1, delay: 600 })
      );
  }
}