/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./src/webview/**/*.{js,jsx,ts,tsx}",
    "./dist/**/*.html"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        vscode: {
          background: 'var(--vscode-editor-background)',
          foreground: 'var(--vscode-editor-foreground)',
          selection: 'var(--vscode-editor-selectionBackground)',
          border: 'var(--vscode-panel-border)',
          hover: 'var(--vscode-list-hoverBackground)',
          active: 'var(--vscode-list-activeSelectionBackground)',
          button: 'var(--vscode-button-background)',
          buttonHover: 'var(--vscode-button-hoverBackground)',
          input: 'var(--vscode-input-background)',
          inputBorder: 'var(--vscode-input-border)',
        }
      },
      fontFamily: {
        mono: ['var(--vscode-editor-font-family)', 'Consolas', 'Monaco', 'monospace'],
        sans: ['var(--vscode-font-family)', 'system-ui', 'sans-serif']
      },
      fontSize: {
        vscode: 'var(--vscode-editor-font-size)'
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s infinite',
        'typing': 'typing 1.5s infinite'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' }
        },
        typing: {
          '0%, 50%': { opacity: '1' },
          '51%, 100%': { opacity: '0' }
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
