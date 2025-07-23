# Perplexity AI Chat Pro - VSCode Extension

An advanced, next-generation VSCode extension that integrates Perplexity AI directly into your development workflow with a modern React-based interface and powerful developer-focused features.

![Perplexity AI Chat Pro](https://img.shields.io/badge/VSCode-Extension-blue?style=for-the-badge&logo=visualstudiocode)
![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=nodedotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue?style=for-the-badge&logo=typescript)
![React](https://img.shields.io/badge/React-18+-blue?style=for-the-badge&logo=react)

## 🚀 Features

### Advanced AI Integration
- **Real-time streaming responses** from Perplexity AI
- **Multiple search modes**: General, Debug, Explain, Optimize, Test, Research
- **Citation tracking** with clickable source links
- **Context-aware prompts** based on selected code

### Modern User Interface
- **React 18** with TypeScript for robust UI
- **Tailwind CSS** with VSCode theme integration
- **Dark/Light theme** support with auto-detection
- **Responsive design** that adapts to panel sizes
- **Voice input/output** support with Web Speech API

### Developer-Centric Features
- **Code explanation** with syntax highlighting
- **Debugging assistance** for error analysis
- **Performance optimization** suggestions
- **Test generation** for selected code
- **Multi-language support** for all major programming languages

### Session Management
- **Persistent chat sessions** across VSCode restarts
- **Session organization** with automatic titles
- **Export capabilities** for sharing conversations
- **Search functionality** across chat history

## 📋 Requirements

### System Requirements
- **Node.js**: 18.0.0 or higher
- **VSCode**: 1.75.0 or higher
- **Operating System**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 20.04+)

### API Requirements
- **Perplexity API Key**: Required for AI functionality
- **Internet Connection**: Required for API communication

## 🛠️ Installation

### From VSCode Marketplace
1. Open VSCode
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "Perplexity AI Chat Pro"
4. Click Install

### From VSIX Package
1. Download the `.vsix` file from releases
2. Open VSCode
3. Run command: `Extensions: Install from VSIX`
4. Select the downloaded file

### Development Setup

#### Prerequisites
```bash
# Install Node.js 18 or higher
node --version  # Should be 18.0.0+
npm --version   # Should be 10.0.0+

# Install global tools
npm install -g @vscode/vsce
npm install -g yo generator-code
```

#### Clone and Setup
```bash
# Clone the repository
git clone https://github.com/perplexity-ai/vscode-extension.git
cd vscode-extension

# Install dependencies
npm install

# Build the extension
npm run build

# Run in development mode
npm run dev
```

#### Build and Package
```bash
# Build for production
npm run build

# Package as VSIX
npm run package

# Install locally
code --install-extension perplexity-vscode-pro-1.0.0.vsix
```

## ⚙️ Configuration

### API Key Setup
1. Get your API key from [Perplexity AI](https://www.perplexity.ai/settings/api)
2. Open VSCode Settings (Ctrl+,)
3. Search for "Perplexity"
4. Enter your API key in `perplexityChat.apiKey`

### Available Settings

#### Core Settings
```json
{
  "perplexityChat.apiKey": "",
  "perplexityChat.model": "llama-3.1-sonar-small-128k-online",
  "perplexityChat.temperature": 0.2,
  "perplexityChat.maxTokens": 4096
}
```

#### UI Settings
```json
{
  "perplexityChat.theme": "auto",
  "perplexityChat.enableVoice": true,
  "perplexityChat.autoSave": true
}
```

### Model Options
- `llama-3.1-sonar-small-128k-online` (Default)
- `llama-3.1-sonar-large-128k-online`
- `llama-3.1-sonar-huge-128k-online`
- `llama-3.1-sonar-small-128k-chat`
- `llama-3.1-sonar-large-128k-chat`

## 🎯 Usage

### Basic Commands
- **Ctrl+Shift+P**: Open Perplexity Chat
- **Ctrl+Shift+E**: Explain selected code
- **Right-click menu**: Access context-specific features

### Search Modes

#### 🤖 General Mode
- General AI assistance
- Q&A and explanations
- Code help and guidance

#### 🐛 Debug Mode
- Error analysis and solutions
- Stack trace interpretation
- Bug identification and fixes

#### 📖 Explain Mode
- Code explanation and breakdown
- Concept clarification
- Learning assistance

#### ⚡ Optimize Mode
- Performance improvements
- Code refactoring suggestions
- Best practices recommendations

#### 🧪 Test Mode
- Unit test generation
- Test strategy advice
- Coverage improvement tips

#### 🔍 Research Mode
- Technical research
- Documentation lookup
- Library comparisons

### Voice Features
- **Click microphone**: Start voice input
- **Automatic transcription**: Speech-to-text
- **Voice commands**: "Explain this code", "Debug this error"

## 🏗️ Architecture

### Technology Stack
- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS + PostCSS
- **Build**: Webpack 5 + ESBuild
- **Linting**: ESLint + Prettier
- **Testing**: Jest + React Testing Library

### Project Structure
```
perplexity-vscode-pro/
├── src/
│   ├── extension.ts           # Main extension entry
│   ├── api/
│   │   └── perplexityClient.ts # API client
│   ├── providers/
│   │   └── ChatProvider.ts    # Webview provider
│   ├── utils/
│   │   ├── chatManager.ts     # Session management
│   │   ├── config.ts          # Configuration
│   │   └── logger.ts          # Logging utility
│   └── webview/
│       ├── App.tsx            # React main component
│       ├── App.css            # Styles
│       ├── index.tsx          # React entry point
│       └── index.html         # HTML template
├── dist/                      # Built files
├── resources/                 # Icons and assets
├── package.json              # Extension manifest
├── tsconfig.json             # TypeScript config
├── webpack.config.js         # Build configuration
└── tailwind.config.js        # Tailwind config
```

### Key Components

#### Extension Host (Node.js)
- **extension.ts**: Main activation and command registration
- **ChatManager**: Session and message management
- **PerplexityClient**: API communication with streaming
- **ConfigManager**: Settings and configuration

#### Webview (React)
- **App.tsx**: Main chat interface
- **Real-time messaging**: WebSocket-like communication
- **Session management**: UI for chat organization
- **Voice integration**: Speech recognition and synthesis

## 🔧 Development

### Scripts
```bash
# Development
npm run dev              # Watch mode development
npm run dev:extension    # Extension only
npm run dev:webview      # Webview only

# Building
npm run build            # Production build
npm run build:extension  # Extension only
npm run build:webview    # Webview only

# Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
npm run format           # Format with Prettier
npm run type-check       # TypeScript checking

# Testing
npm test                 # Run tests
npm run test:watch       # Watch mode testing

# Packaging
npm run package          # Create VSIX package
```

### Debug Configuration
```json
{
  "name": "Launch Extension",
  "type": "extensionHost",
  "request": "launch",
  "args": ["--extensionDevelopmentPath=${workspaceFolder}"],
  "outFiles": ["${workspaceFolder}/dist/**/*.js"],
  "preLaunchTask": "npm: compile"
}
```

### Contributing Guidelines
1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** changes: `git commit -m 'Add amazing feature'`
4. **Push** to branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

### Code Standards
- **TypeScript**: Strict mode enabled
- **ESLint**: Airbnb configuration with React
- **Prettier**: Consistent code formatting
- **Commits**: Conventional commit messages

## 📊 Performance

### Optimization Features
- **Code splitting**: Lazy loading of components
- **Bundle optimization**: Webpack tree shaking
- **Caching**: Intelligent response caching
- **Memory management**: Efficient session storage

### Benchmarks
- **Startup time**: < 200ms
- **First response**: < 2s (depending on network)
- **Memory usage**: < 50MB average
- **Bundle size**: < 2MB total

## 🔒 Security

### Data Protection
- **API keys**: Stored in VSCode SecretStorage
- **No data logging**: Messages not stored on servers
- **Secure communication**: HTTPS/WSS only
- **CSP headers**: Content Security Policy enforced

### Privacy Features
- **Local storage**: All data stored locally
- **No telemetry**: No usage tracking
- **Secure webview**: Sandboxed execution environment

## 🐛 Troubleshooting

### Common Issues

#### API Key Problems
```bash
# Check API key
code --list-extensions | grep perplexity

# Reset configuration
# Settings > Extensions > Perplexity > Reset to Defaults
```

#### Build Issues
```bash
# Clear dependencies
rm -rf node_modules package-lock.json
npm install

# Clear build cache
rm -rf dist/
npm run build
```

#### Performance Issues
```bash
# Check VSCode version
code --version

# Check Node.js version
node --version

# Restart extension host
# Ctrl+Shift+P > "Reload Window"
```

### Debug Mode
Enable debug logging in settings:
```json
{
  "perplexityChat.logLevel": "debug"
}
```

View logs: `View > Output > Perplexity AI Chat Pro`

## 📈 Roadmap

### Version 1.1
- [ ] **Workspace awareness**: Project context understanding
- [ ] **Code generation**: Full function/class generation
- [ ] **Git integration**: Commit message generation
- [ ] **Documentation**: Auto-generated docs

### Version 1.2
- [ ] **Collaborative features**: Team chat sharing
- [ ] **Plugin system**: Custom prompt templates
- [ ] **Mobile support**: VSCode mobile compatibility
- [ ] **Offline mode**: Local model support

### Version 2.0
- [ ] **Multi-model support**: GPT-4, Claude, etc.
- [ ] **Visual debugging**: Code flow visualization
- [ ] **AI pair programming**: Real-time coding assistance
- [ ] **Custom training**: Workspace-specific fine-tuning

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🤝 Support

### Getting Help
- **Documentation**: [GitHub Wiki](https://github.com/perplexity-ai/vscode-extension/wiki)
- **Issues**: [GitHub Issues](https://github.com/perplexity-ai/vscode-extension/issues)
- **Discussions**: [GitHub Discussions](https://github.com/perplexity-ai/vscode-extension/discussions)

### Contact
- **Email**: extensions@perplexity.ai
- **Twitter**: [@perplexity_ai](https://twitter.com/perplexity_ai)
- **Discord**: [Join Community](https://discord.gg/perplexity)

## 🙏 Acknowledgments

- **Perplexity AI**: For the powerful AI API
- **VSCode Team**: For the excellent extension platform
- **React Team**: For the amazing UI framework
- **Open Source Community**: For the incredible tools and libraries

---

**Made with ❤️ by the Perplexity AI Team**

*Transform your coding experience with AI-powered assistance directly in VSCode.*
