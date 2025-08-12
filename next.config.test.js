describe('Next.js Configuration', () => {
  let nextConfig;

  beforeAll(async () => {
    // Dynamically import the next.config.js file
    nextConfig = await import('../next.config.js');
  });

  test('should have a valid configuration object', () => {
    expect(nextConfig).toBeDefined();
    expect(typeof nextConfig).toBe('object');
  });

  describe('allowedDevOrigins', () => {
    test('should be an array', () => {
      expect(Array.isArray(nextConfig.allowedDevOrigins)).toBe(true);
    });

    test('should include common local development origins', () => {
      expect(nextConfig.allowedDevOrigins).toContain('http://localhost:3000');
      expect(nextConfig.allowedDevOrigins).toContain('http://127.0.0.1:3000');
    });
  });

  describe('images.remotePatterns', () => {
    test('should be an array', () => {
      expect(Array.isArray(nextConfig.images.remotePatterns)).toBe(true);
    });

    test('should include the YouTube image pattern', () => {
      const youtubePattern = nextConfig.images.remotePatterns.find(
        (pattern) => pattern.hostname === 'img.youtube.com'
      );
      expect(youtubePattern).toBeDefined();
      expect(youtubePattern.protocol).toBe('https');
      expect(youtubePattern.pathname).toBe('/vi/**');
    });

    test('should include the Google User Content pattern', () => {
      const googleUserContentPattern = nextConfig.images.remotePatterns.find(
        (pattern) => pattern.hostname === 'lh3.googleusercontent.com'
      );
      expect(googleUserContentPattern).toBeDefined();
      expect(googleUserContentPattern.protocol).toBe('https');
      expect(googleUserContentPattern.pathname).toBe('/**');
    });
  });

  describe('env', () => {
    test('should have environment variables defined', () => {
      expect(nextConfig.env).toBeDefined();
      expect(typeof nextConfig.env).toBe('object');
    });

    test('should have FIREBASE_API_KEY defined', () => {
      expect(nextConfig.env.FIREBASE_API_KEY).toBeDefined();
      expect(typeof nextConfig.env.FIREBASE_API_KEY).toBe('string');
    });

    test('should have FIREBASE_AUTH_DOMAIN defined', () => {
      expect(nextConfig.env.FIREBASE_AUTH_DOMAIN).toBeDefined();
      expect(typeof nextConfig.env.FIREBASE_AUTH_DOMAIN).toBe('string');
    });

    test('should have FIREBASE_PROJECT_ID defined', () => {
      expect(nextConfig.env.FIREBASE_PROJECT_ID).toBeDefined();
      expect(typeof nextConfig.env.FIREBASE_PROJECT_ID).toBe('string');
    });

    test('should have FIREBASE_STORAGE_BUCKET defined', () => {
      expect(nextConfig.env.FIREBASE_STORAGE_BUCKET).toBeDefined();
      expect(typeof nextConfig.env.FIREBASE_STORAGE_BUCKET).toBe('string');
    });

    test('should have FIREBASE_MESSAGING_SENDER_ID defined', () => {
      expect(nextConfig.env.FIREBASE_MESSAGING_SENDER_ID).toBeDefined();
      expect(typeof nextConfig.env.FIREBASE_MESSAGING_SENDER_ID).toBe('string');
    });

    test('should have FIREBASE_APP_ID defined', () => {
      expect(nextConfig.env.FIREBASE_APP_ID).toBeDefined();
      expect(typeof nextConfig.env.FIREBASE_APP_ID).toBe('string');
    });

    test('should have FIREBASE_MEASUREMENT_ID defined', () => {
      expect(nextConfig.env.FIREBASE_MEASUREMENT_ID).toBeDefined();
      expect(typeof nextConfig.env.FIREBASE_MEASUREMENT_ID).toBe('string');
    });

    test('should have FIREBASE_PRIVATE_KEY defined', () => {
      expect(nextConfig.env.FIREBASE_PRIVATE_KEY).toBeDefined();
      expect(typeof nextConfig.env.FIREBASE_PRIVATE_KEY).toBe('string');
    });

    test('should have FIREBASE_CLIENT_EMAIL defined', () => {
      expect(nextConfig.env.FIREBASE_CLIENT_EMAIL).toBeDefined();
      expect(typeof nextConfig.env.FIREBASE_CLIENT_EMAIL).toBe('string');
    });
  });
});