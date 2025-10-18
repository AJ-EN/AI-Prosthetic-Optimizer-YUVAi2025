# Frontend Setup

## Tailwind CSS Production Setup

This project uses Tailwind CSS as a PostCSS plugin for production-ready styling.

### Initial Setup

```bash
cd frontend
npm install
```

### Development

To watch for changes and rebuild CSS automatically:

```bash
npm run watch:css
```

Or use the shorthand:

```bash
npm run dev
```

### Production Build

To build minified CSS for production:

```bash
npm run build:css
```

The output will be generated at `css/output.css` which is already linked in `index.html`.

### Files

- `tailwind.config.js` - Tailwind configuration
- `css/input.css` - Source CSS with Tailwind directives
- `css/output.css` - Compiled and minified CSS (generated)
- `css/styles.css` - Custom component styles
- `css/animations.css` - Animation definitions

### Note

The CDN version of Tailwind (`<script src="https://cdn.tailwindcss.com"></script>`) has been removed and replaced with the compiled version to eliminate the production warning.
