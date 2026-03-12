import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LeafService } from '../services/leaf-finder.service';
import { environment } from '../../environments/environment';

export interface LeafAnalysisResult {
  leafName: string;
  explanation: string;
  funFact: string;
  voiceUrl?: string; // optional URL to pre-generated audio
}

@Component({
  selector: 'leaf-finder',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './leaf-finder.html',
  styleUrl: './leaf-finder.css'
})

export class LeafFinderComponent {
  screen = signal<'home' | 'loading' | 'result'>('home');
  selectedAgeGroup = signal('early');
  leafResult = signal<LeafAnalysisResult | null>(null);
  selectedImage = signal<string | null>(null);
  isLoading = false;
  result: LeafAnalysisResult | null = null;
  base64Image: string = '';
  lastAudioUrl: string | null = null;
  private audioElement: HTMLAudioElement | null = null;

  ageGroups = [
    { id: 'preschool', label: '4-6 years', emoji: '🌱' },
    { id: 'early', label: '7-9 years', emoji: '🌿' },
    { id: 'middle', label: '10-12 years', emoji: '🌳' },
    { id: 'teen', label: '13+ years', emoji: '🌲' }
  ];

  constructor(private leafService: LeafService) {}

  handleImageUpload() {
    this.screen.set('loading');

    this.analyzeLeaf(this.base64Image);
    
    // // Simulate file upload
    // setTimeout(() => {
    //   const response = this.mockResponses[this.selectedAgeGroup() as keyof typeof this.mockResponses];
    //   this.leafResult.set(response);
    //   this.selectedImage.set('https://images.unsplash.com/photo-1511656828935-0cb5233d976d?w=400&h=300&fit=crop');
    //   this.screen.set('result');
    // }, 2000);
  }

openCamera(): void {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.capture = 'environment'; // rear camera
  
  input.onchange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files[0]) {
      const file = target.files[0];
      console.log('Selected file:', file);

      const reader = new FileReader();
      reader.onload = (e) => {
        this.base64Image = e.target?.result as string;
        console.log('Base64:', this.base64Image);

      };
      reader.readAsDataURL(file);
    }
  };

  input.click(); // triggers camera/file picker
}

 private analyzeLeaf(base64Image: string): void {
    this.isLoading = true;

    this.leafService.analyzeLeaf(base64Image, this.selectedAgeGroup()).subscribe({
      next: (response: LeafAnalysisResult) => {
        this.result = response;
        this.isLoading = false;
        this.leafResult.set(response);
        this.screen.set('result');
        console.log('Analysis result:', response);

        if (response.voiceUrl) {
          // prepend the backend base URL so relative paths work
          const url = `${environment.apiBaseUrl}${response.voiceUrl}`;
          this.lastAudioUrl = url;
          this.audioElement = new Audio(url);
          this.audioElement.play().catch(err => console.error('Audio play error:', err, url));
        } 
      },

      error: (err) => {
        console.error('Error:', err);
        this.isLoading = false;
      }
    });
  }

  backToHome() {
    this.screen.set('home');
    this.leafResult.set(null);
    this.selectedImage.set(null);
  }

  findAnotherLeaf() {
    this.screen.set('home');
    this.leafResult.set(null);
    this.selectedImage.set(null);
  }

  selectAgeGroup(ageId: string) {
    this.selectedAgeGroup.set(ageId);
  }

  replayAudio() {
    if (this.lastAudioUrl) {
      if (this.audioElement) {
        this.audioElement.currentTime = 0;
        this.audioElement.play().catch(err => console.error('Replay error', err));
      } else {
        const audio = new Audio(this.lastAudioUrl);
        audio.play().catch(err => console.error('Replay error', err));
        this.audioElement = audio;
      }
    }
  }
}
