import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LeafService } from '../services/leaf-finder.service';
import { environment } from '../../environments/environment';
import { ApiErrorService } from '../services/api-error.service';

export interface LeafAnalysisResult {
  leafName: string;
  explanation: string;
  funFact: string;
  voiceUrl?: string; // optional URL to pre-generated audio
}

function isLeafAnalysisResult(value: unknown): value is LeafAnalysisResult {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<LeafAnalysisResult>;
  return (
    typeof candidate.leafName === 'string' &&
    typeof candidate.explanation === 'string' &&
    typeof candidate.funFact === 'string'
  );
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
  errorMessage = signal<string | null>(null);
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

  constructor(
    private leafService: LeafService,
    private apiErrorService: ApiErrorService
  ) {}

  private analyzeLeaf(base64Image: string): void {
    this.isLoading = true;

    this.leafService.analyzeLeaf(base64Image, this.selectedAgeGroup()).subscribe({
      next: (response: LeafAnalysisResult) => {
        if (!isLeafAnalysisResult(response)) {
          this.isLoading = false;
          this.screen.set('home');
          this.errorMessage.set('We received an unexpected result. Please try again.');
          console.error('Invalid leaf analysis response payload', response);
          return;
        }

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
        console.error('Leaf analysis request failed', err);
        this.isLoading = false;
        this.screen.set('home');
        this.errorMessage.set(
          this.apiErrorService.toUserMessage(err, {
            default: 'We could not analyze this leaf right now. Please try again.'
          })
        );
      }
    });
  }

  handleImageUpload() {
    if (!this.selectedImage()) {
      this.errorMessage.set("Please select an image first using the camera button.");
      return;
    }
    this.errorMessage.set(null);
    this.screen.set('loading');

    this.analyzeLeaf(this.base64Image);
    
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
          this.selectedImage.set(this.base64Image);
          this.errorMessage.set(null);
          console.log('Base64:', this.base64Image);

        };
        reader.readAsDataURL(file);
      }
    };

    input.click(); // triggers camera/file picker
  }

  backToHome() {
    this.screen.set('home');
    this.leafResult.set(null);
    this.selectedImage.set(null);
  }

  findAnotherLeaf() {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
    }
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
