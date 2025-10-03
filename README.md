# Rich Text Editor

A modern, minimalist web-based text editor with rich formatting capabilities and a beautiful monospace design. Built with SUSE Mono font for a clean, professional writing experience.

![Editor Preview](rotate.png)

## ✨ Features

### 🎨 Modern Design
- **SUSE Mono Font**: Beautiful monospace typography from Google Fonts
- **Fixed Header & Toolbar**: Always-accessible controls that stay at the top
- **Card-based UI**: Clean, modern interface with subtle shadows
- **Custom Logo**: Branded interface with rotate.png logo
- **Responsive Layout**: Perfect on desktop, tablet, and mobile

### ✍️ Rich Text Formatting
- **Bold**, *Italic*, <u>Underline</u>, and ~~Strikethrough~~ text
- **Text & Background Colors**: Full color palette with color pickers
- **Smart Lists**: Properly formatted numbered and bullet lists
- **Text Alignment**: Left, center, and right alignment options

### 🛠️ Editor Controls
- **Undo/Redo**: Full editing history with keyboard shortcuts
- **Auto-save**: Instant saving to localStorage as you type
- **Smart Paste**: Clean paste that removes unwanted formatting
- **Cursor Positioning**: Auto-focus at document end on page load

### 📊 Smart Features
- **Real-time Statistics**: Live word and character count in toolbar
- **Save Status**: Visual feedback showing auto-save status
- **Custom Titles**: Editable document headers with persistence
- **Data Management**: One-click option to clear all stored data

### 💡 User Experience
- **Instant Loading**: No dependencies, lightning-fast startup
- **Keyboard Friendly**: Full keyboard navigation and shortcuts
- **Clean Interface**: Distraction-free writing environment
- **Smart Scrolling**: Auto-scroll to cursor position on load

## 🚀 Live Demo

Access the editor directly via GitHub Pages:
```
https://vasoyasagar.github.io/editor/
```

## 💻 Quick Start

1. **Online**: Visit the live demo link above - works instantly!
2. **Local**: 
   - Clone this repository
   - Open `index.html` in any modern browser
   - Start writing immediately!

## 🎯 Perfect For

- 📝 **Daily Note Taking**: Quick, formatted notes with instant save
- 📄 **Document Drafting**: Professional documents with proper formatting  
- ✏️ **Content Writing**: Blog posts, articles, and creative writing
- 🎓 **Education**: Teaching formatting concepts and writing skills
- 💼 **Professional Use**: Meeting notes, project documentation
- 🚀 **Quick Edits**: Fast text formatting without heavy applications
- 🔄 **Cross-Device**: Access your notes from any browser, anywhere

## 🛡️ Privacy & Storage

- **100% Local**: All data stays in your browser - nothing sent to servers
- **Instant Save**: Auto-saves as you type using localStorage
- **Persistent**: Your content survives browser restarts
- **Secure**: No accounts needed, no data collection
- **Portable**: Export your content anytime

## 🔧 Technical Architecture

### Core Technologies
- **HTML5**: Semantic structure with contenteditable API
- **CSS3**: Modern styling with flexbox and fixed positioning
- **Vanilla JavaScript**: Clean ES6+ code with class-based architecture
- **Google Fonts**: SUSE Mono typography integration

### Key Features
- **Zero Dependencies**: Completely self-contained, no external libraries
- **Offline First**: Works without internet after initial load
- **Progressive Enhancement**: Graceful degradation on older browsers
- **Memory Efficient**: Lightweight codebase under 15KB total
- **Real-time Performance**: Instant response with optimized DOM manipulation

### Browser Support
| Browser | Desktop | Mobile |
|---------|---------|--------|
| Chrome | ✅ v60+ | ✅ v60+ |
| Firefox | ✅ v55+ | ✅ v55+ |
| Safari | ✅ v12+ | ✅ v12+ |
| Edge | ✅ v79+ | ✅ v79+ |
| Opera | ✅ v47+ | ✅ v47+ |

## 🎨 Customization Options

### Easy Modifications
```css
/* Change theme colors */
:root {
  --primary-color: #007bff;
  --background-color: #f4f4f4;
  --card-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
}

/* Customize fonts */
.suse-mono-regular {
  font-weight: 400; /* Change to 300, 500, 600, 700, 800 */
  font-style: italic; /* Add italic styling */
}
```

### Advanced Customization
- **Logo**: Replace `rotate.png` with your brand logo
- **Colors**: Modify CSS custom properties for instant theme changes
- **Layout**: Adjust card positioning and spacing
- **Features**: Add/remove toolbar buttons as needed

## � Project Structure

```
editor/
├── index.html          # Main editor application
├── editor.html         # Alternative entry point  
├── rotate.png          # Logo and favicon image
├── README.md           # This documentation
└── LICENSE             # MIT License terms
```

## 🚀 Deployment

### GitHub Pages (Recommended)
1. Fork this repository
2. Go to Settings → Pages
3. Select "Deploy from branch: main"
4. Your editor will be live at `https://yourusername.github.io/editor/`

## 🤝 Contributing

We welcome contributions! Here's how:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature-name`
3. **Commit** your changes: `git commit -am 'Add feature'`
4. **Push** to branch: `git push origin feature-name`
5. **Submit** a Pull Request

### Ideas for Contributions
- 🌙 Dark mode theme
- 📱 PWA capabilities  
- 🔍 Find/replace functionality
- 📊 Export to PDF/Word
- 🎨 More themes and fonts
- ⌨️ Keyboard shortcuts panel

## �📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**✨ Created with care by [vasoyasagar](https://github.com/vasoyasagar) ✨**

[🌟 Star this repo](https://github.com/vasoyasagar/editor) | [🐛 Report Issues](https://github.com/vasoyasagar/editor/issues) | [💡 Request Features](https://github.com/vasoyasagar/editor/issues/new)

*Making beautiful, fast, and accessible text editing available to everyone*

</div>