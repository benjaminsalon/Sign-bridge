// SignWritingService.ts
// Handles loading fonts and normalizing FSW strings for drawing on a static canvas.

const SignWritingService = {
  fontModulePromise: null as Promise<any> | null,
  fontsLoaded: false,

  getFontModule() {
    if (!this.fontModulePromise) {
      this.fontModulePromise = import('@sutton-signwriting/font-ttf/font/font.min');
    }
    return this.fontModulePromise;
  },

  async loadFonts() {
    if (this.fontsLoaded) return;
    this.fontsLoaded = true;

    try {
      const fontModule = await this.getFontModule();
      fontModule.cssAppend('/fonts/');
      return new Promise<void>(resolve => fontModule.cssLoaded(resolve));
    } catch (e) {
      console.error('Failed to load SignWriting fonts:', e);
      return Promise.reject(e);
    }
  },

  async normalizeFSW(fswToken: string | null) {
    if (!fswToken || typeof fswToken !== 'string') return null;
    try {
      const { signNormalize } = await import('@sutton-signwriting/font-ttf/fsw/fsw');
      return signNormalize(fswToken);
    } catch (e) {
      console.error(`Failed to normalize FSW token for canvas: "${fswToken}"`, e);
      return null;
    }
  }
};

export default SignWritingService;
