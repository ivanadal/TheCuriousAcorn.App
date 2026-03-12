import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class LeafService {
  constructor(private http: HttpClient) {}

  analyzeLeaf(base64Image: string) {
    return this.http.post(`${environment.apiUrl}/leafanalysis/analyze`, {
      imageBase64: base64Image,
      ageGroup: 'early' // you can make this dynamic based on user selection'
    });
  }
}