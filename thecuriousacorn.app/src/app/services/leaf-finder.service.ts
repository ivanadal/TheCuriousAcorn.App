import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, retry, timeout } from 'rxjs';
import { environment } from '../../environments/environment';

export interface LeafAnalysisResult {
  leafName: string;
  explanation: string;
  funFact: string;
}

@Injectable({ providedIn: 'root' })
export class LeafService {
  constructor(private http: HttpClient) {}

  analyzeLeaf(base64Image: string, ageGroup: string): Observable<LeafAnalysisResult> {
    return this.http
      .post<LeafAnalysisResult>(`${environment.apiUrl}/leafanalysis/analyze`, {
        imageBase64: base64Image,
        ageGroup: ageGroup
      })
      .pipe(
        timeout(15000),
        retry({ count: 1, delay: 600 })
      );
  }
}