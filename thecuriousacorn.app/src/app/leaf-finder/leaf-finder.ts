import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LeafLanguage, LeafService } from '../services/leaf-finder.service';
import { ApiErrorService } from '../services/api-error.service';
import { AuthService } from '../services/auth.service';

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
  selectedAgeGroup = signal('preschool');
  selectedLanguage = signal<LeafLanguage>('en');
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

  readonly languageOrder: LeafLanguage[] = ['en', 'sr', 'es'];
  readonly languageLabelByCode: Record<LeafLanguage, string> = {
    en: 'English',
    sr: 'Serbian',
    es: 'Spanish'
  };

  constructor(
    private leafService: LeafService,
    private apiErrorService: ApiErrorService,
    private authService: AuthService,
    private router: Router
  ) {}

  private analyzeLeaf(base64Image: string): void {
    this.isLoading = true;

    this.leafService.analyzeLeaf(base64Image, this.selectedAgeGroup(), this.selectedLanguage()).subscribe({
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
        if (this.isSpeechEnabled()) {
          this.speakText(this.lastSpeechText);
        }
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
    if (!this.authService.hasActiveSession()) {
      this.errorMessage.set('Your session expired. Please sign in again.');
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/dashboard' } });
      return;
    }

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
        reader.onload = async (e) => {
          const originalDataUrl = e.target?.result as string;
          const optimizedDataUrl = await this.optimizeImageForUpload(originalDataUrl);

          this.base64Image = optimizedDataUrl;
          this.selectedImage.set(optimizedDataUrl);
          this.errorMessage.set(null);

          this.screen.set('loading');
          this.analyzeLeaf(optimizedDataUrl);
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

  cycleLanguage(): void {
    const current = this.selectedLanguage();
    const currentIndex = this.languageOrder.indexOf(current);
    const nextIndex = (currentIndex + 1) % this.languageOrder.length;
    this.selectedLanguage.set(this.languageOrder[nextIndex]);
  }

  languageDisplayLabel(): string {
    return this.languageLabelByCode[this.selectedLanguage()];
  }

  languageIconPath(): string {
    const iconByLanguage: Record<LeafLanguage, string> = {
      en: 'lang-en-tree.svg',
      sr: 'lang-sr-tree.svg',
      es: 'lang-es-tree.svg'
    };

    return iconByLanguage[this.selectedLanguage()];
  }

  languageIconClass(): string {
    return 'language-toggle__img';
  }

  shouldShowReplayButton(): boolean {
    return this.canReplaySpeech && this.isSpeechEnabled();
  }

  replayAudio() {
    if (this.lastSpeechText && this.isSpeechEnabled()) {
      this.speakText(this.lastSpeechText);
    }
  }

  private buildSpeechText(result: LeafAnalysisResult): string {
    return `${result.leafName}. ${result.explanation} ${result.funFact}`;
  }

  private speakText(text: string): void {
    if (!this.canReplaySpeech) {
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = this.speechLangForSelection();
    utterance.rate = 0.95;
    utterance.pitch = 1;

    const voices = window.speechSynthesis.getVoices();
    const languagePrefix = this.selectedLanguage();
    const preferredVoice = voices.find(
      voice => voice.lang.toLowerCase().startsWith(languagePrefix)
    );

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    window.speechSynthesis.speak(utterance);
  }

  private speechLangForSelection(): string {
    const byLanguage: Record<LeafLanguage, string> = {
      en: 'en-US',
      es: 'es-ES',
      sr: 'sr-RS'
    };

    return byLanguage[this.selectedLanguage()];
  }

  private stopSpeech(): void {
    if (this.canReplaySpeech) {
      window.speechSynthesis.cancel();
    }
  }

  private optimizeImageForUpload(dataUrl: string): Promise<string> {
    return new Promise((resolve) => {
      const image = new Image();

      image.onload = () => {
        const maxDimension = 1280;
        const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
        const targetWidth = Math.max(1, Math.round(image.width * scale));
        const targetHeight = Math.max(1, Math.round(image.height * scale));

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const context = canvas.getContext('2d');
        if (!context) {
          resolve(dataUrl);
          return;
        }

        context.drawImage(image, 0, 0, targetWidth, targetHeight);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };

      image.onerror = () => resolve(dataUrl);
      image.src = dataUrl;
    });
  }

  private isSpeechEnabled(): boolean {
    return this.selectedLanguage() !== 'sr';
  }
}
