import { Injectable, signal, effect } from '@angular/core';

const STORAGE_KEY = 'cac-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  /** true = modo oscuro activo */
  readonly dark = signal(false);

  constructor() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'dark') {
      this.dark.set(true);
    } else if (stored === 'light') {
      this.dark.set(false);
    } else {
      this.dark.set(window.matchMedia('(prefers-color-scheme: dark)').matches);
    }

    effect(() => {
      const d = this.dark();
      document.documentElement.setAttribute('data-theme', d ? 'dark' : 'light');
      document.documentElement.style.colorScheme = d ? 'dark' : 'light';
      localStorage.setItem(STORAGE_KEY, d ? 'dark' : 'light');
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) {
        meta.setAttribute('content', d ? '#152019' : '#1a472a');
      }
    });
  }

  toggle(): void {
    this.dark.update((v) => !v);
  }
}
