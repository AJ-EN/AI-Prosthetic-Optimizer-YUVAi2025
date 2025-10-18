/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./*.html",
        "./js/**/*.js",
        "./app.js"
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                display: ['Poppins', 'sans-serif'],
                mono: ['Space Mono', 'monospace']
            },
            colors: {
                primary: {
                    DEFAULT: '#000000',
                    light: '#1A1A1A',
                    dark: '#0A0A0A'
                }
            },
            animation: {
                'fade-in': 'fadeIn 0.3s ease-in',
                'slide-up': 'slideUp 0.4s ease-out',
                'glow': 'glow 2s ease-in-out infinite'
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
                glow: {
                    '0%, 100%': { boxShadow: '0 0 20px rgba(255, 255, 255, 0.1)' },
                    '50%': { boxShadow: '0 0 30px rgba(255, 255, 255, 0.2)' }
                }
            }
        }
    },
    plugins: []
}
