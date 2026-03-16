import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ConfigService } from '../services/config.service';


declare global {
  interface Window {
    google: any;
  }
}

@Component({
  selector: 'login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private configService = inject(ConfigService);
  private returnUrl = '/dashboard';

  isLoading = this.authService.isLoading;
  error = this.authService.error;
  showDemoLogin = signal(false);

  ngOnInit() {
    const requestedReturnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/dashboard';
    this.returnUrl = requestedReturnUrl.startsWith('/') ? requestedReturnUrl : '/dashboard';

    // Redirect if already logged in
    if (this.authService.isLoggedIn()) {
      this.router.navigateByUrl(this.returnUrl);
      return;
    }

    // Initialize Google Sign-In
    this.initializeGoogleSignIn();
  }

  ngOnDestroy() {
    // Cleanup if needed
  }

  /**
   * Initialize Google Sign-In
   */
  private initializeGoogleSignIn() {
    // Load Google API script if not already loaded
    if (window.google) {
      this.renderGoogleButton();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      this.renderGoogleButton();
    };

    script.onerror = () => {
      console.error('Failed to load Google Sign-In script');
      this.error.set('Failed to load Google Sign-In. Please refresh the page.');
    };

    document.head.appendChild(script);
  }

  /**
   * Render the Google Sign-In button
   */
  private renderGoogleButton() {
    try {
      console.log('Attempting to render Google button...');

      // Get Client ID from ConfigService (loaded from backend)
      const googleClientId = this.configService.getGoogleClientId();
      console.log('Google Client ID:', googleClientId ? 'Set' : 'Not set');

      if (!googleClientId) {
        console.error('Google Client ID not configured');
        this.error.set('Google Sign-In is not configured. Please contact support.');
        return;
      }

      console.log('Initializing Google Sign-In with Client ID');

      window.google.accounts.id.initialize({
        client_id: googleClientId,  // ← Dynamically loaded from backend
        callback: this.handleGoogleResponse.bind(this),
        auto_select: false,
        cancel_on_tap_outside: true
      });

      const buttonContainer = document.getElementById('googleSignInButton');
      console.log('Button container found:', !!buttonContainer);

      if (buttonContainer) {
        window.google.accounts.id.renderButton(
          buttonContainer,
          {
            theme: 'outline',
            size: 'large',
            width: '300',
            text: 'signin_with'
          }
        );
        console.log('Google button rendered');
      } else {
        console.error('Google button container not found');
        this.error.set('Sign-in button container not found.');
      }
    } catch (error) {
      console.error('Error initializing Google Sign-In:', error);
      this.error.set('Failed to initialize Google Sign-In.');
    }
  }

  /**
   * Handle Google Sign-In response
   * This is called when user clicks the Google Sign-In button
   */
  private handleGoogleResponse(response: any) {
    console.log('Google response received:', response);

    if (response && response.credential) {
      // Send the credential token to backend
      this.authService.initGoogleAuth(response.credential, this.returnUrl);
    } else {
      this.error.set('Failed to get Google credentials. Please try again.');
    }
  }

  /**
   * Trigger Google Sign-In prompt
   */
  signInWithGoogle() {
    if (window.google && window.google.accounts && window.google.accounts.id) {
      window.google.accounts.id.prompt();
    } else {
      this.error.set('Google Sign-In not ready. Please refresh the page.');
    }
  }

  /**
   * Demo login (for testing without Google account)
   */
  loginAsDemo() {
    this.isLoading.set(true);
    this.error.set(null);

    // Simulate a demo token
    const demoToken = 'demo-token-' + Date.now();
    
    setTimeout(() => {
      // Send demo token to backend for validation
      this.authService.initGoogleAuth(demoToken, this.returnUrl);
    }, 1000);
  }
}