import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const isProduction = mode === 'production';

    return {
      define: {
        // Environment variables for build-time configuration
        'process.env.GEMINI_MODEL': JSON.stringify(env.GEMINI_MODEL || 'gemini-2.5-flash'),
        'process.env.GEMINI_TEMPERATURE': JSON.stringify(env.GEMINI_TEMPERATURE || '0.3')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        // Optimize chunk splitting for better caching and loading
        rollupOptions: {
          output: {
            manualChunks: {
              // Vendor chunks for better caching
              'react-vendor': ['react', 'react-dom'],
              'router-vendor': ['react-router-dom'],
              'chart-vendor': ['recharts', 'd3-shape'],
              'i18n-vendor': ['react-i18next', 'i18next'],
              'ai-vendor': ['@google/genai']
            },
            // Optimize asset naming for better caching
            assetFileNames: (assetInfo) => {
              const info = assetInfo.names?.[0]?.split('.') || [];
              const ext = info[info.length - 1];
              if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
                return `assets/images/[name]-[hash][extname]`;
              }
              if (/css/i.test(ext)) {
                return `assets/css/[name]-[hash][extname]`;
              }
              return `assets/[name]-[hash][extname]`;
            },
            chunkFileNames: 'assets/js/[name]-[hash].js',
            entryFileNames: 'assets/js/[name]-[hash].js'
          }
        },
        // Reduce chunk size warning limit to encourage smaller chunks
        chunkSizeWarningLimit: 500,
        // Enable minification with terser for better compression
        minify: isProduction ? 'terser' : false,
        terserOptions: isProduction ? {
          compress: {
            drop_console: true, // Remove console.log in production
            drop_debugger: true,
            pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn']
          },
          mangle: true,
          format: {
            comments: false
          }
        } : {},
        // Generate source maps only in development
        sourcemap: !isProduction,
        // Optimize CSS
        cssMinify: isProduction,
        // Enable asset inlining for small files
        assetsInlineLimit: 4096,
        // Target modern browsers for better optimization
        target: 'es2020',
        // Enable CSS code splitting
        cssCodeSplit: true,
        // Optimize module preload
        modulePreload: {
          polyfill: false
        }
      },
      // Optimize dependencies
      optimizeDeps: {
        include: [
          'react',
          'react-dom',
          'react-router-dom',
          'react-i18next',
          'i18next'
        ]
      },
      // Enable experimental features for better performance
      esbuild: isProduction ? {
        drop: ['console', 'debugger']
      } : undefined
    };
});
