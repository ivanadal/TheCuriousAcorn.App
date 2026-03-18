import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LeafService } from '../services/leaf-finder.service';
import { ApiErrorService } from '../services/api-error.service';

export interface LeafAnalysisResult {
  leafName: string;
  explanation: string;
  funFact: string;
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
  backgroundImageUrl = 'forest-background.png';
  screen = signal<'home' | 'loading' | 'result'>('home');
  selectedAgeGroup = signal('early');
  leafResult = signal<LeafAnalysisResult | null>(null);
  selectedImage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);
  isLoading = false;
  result: LeafAnalysisResult | null = null;
  base64Image: string = '';
  canReplaySpeech =
    typeof window !== 'undefined' &&
    typeof window.speechSynthesis !== 'undefined' &&
    typeof SpeechSynthesisUtterance !== 'undefined';
  private lastSpeechText: string | null = null;

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

        this.lastSpeechText = this.buildSpeechText(response);
        this.speakText(this.lastSpeechText);
      },

      error: (err) => {
        console.error('Leaf analysis request failed', err);
        this.isLoading = false;
        this.screen.set('home');
        const apiMessage =
          err &&
          typeof err === 'object' &&
          'error' in err &&
          (err as { error?: unknown }).error &&
          typeof (err as { error?: { message?: unknown } }).error?.message === 'string'
            ? (err as { error: { message: string } }).error.message
            : null;

        this.errorMessage.set(
          apiMessage ??
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
    this.stopSpeech();
    this.screen.set('home');
    this.leafResult.set(null);
    this.selectedImage.set(null);
  }

  findAnotherLeaf() {
    this.stopSpeech();
    this.screen.set('home');
    this.leafResult.set(null);
    this.selectedImage.set(null);
  }

  selectAgeGroup(ageId: string) {
    this.selectedAgeGroup.set(ageId);
  }

  replayAudio() {
    if (this.lastSpeechText) {
      this.speakText(this.lastSpeechText);
    }
  }

  private buildSpeechText(result: LeafAnalysisResult): string {
    return `${result.leafName}. ${result.explanation} Fun fact: ${result.funFact}`;
  }

  private speakText(text: string): void {
    if (!this.canReplaySpeech) {
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.95;
    utterance.pitch = 1;

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      voice => voice.lang.toLowerCase().startsWith('en') && /female|samantha|zira|google us english/i.test(voice.name)
    );

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    window.speechSynthesis.speak(utterance);
  }

  private stopSpeech(): void {
    if (this.canReplaySpeech) {
      window.speechSynthesis.cancel();
    }
  }
}
