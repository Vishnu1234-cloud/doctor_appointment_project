/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
        extend: {
                borderRadius: {
                        lg: '1rem',
                        md: '0.75rem',
                        sm: '0.5rem'
                },
                colors: {
                        background: 'hsl(0 0% 100%)',
                        foreground: 'hsl(215 28% 17%)',
                        card: {
                                DEFAULT: 'hsl(0 0% 100%)',
                                foreground: 'hsl(215 28% 17%)'
                        },
                        popover: {
                                DEFAULT: 'hsl(0 0% 100%)',
                                foreground: 'hsl(215 28% 17%)'
                        },
                        primary: {
                                DEFAULT: 'hsl(175 77% 26%)',
                                foreground: 'hsl(0 0% 100%)'
                        },
                        secondary: {
                                DEFAULT: 'hsl(14 100% 70%)',
                                foreground: 'hsl(0 0% 100%)'
                        },
                        muted: {
                                DEFAULT: 'hsl(210 40% 96.1%)',
                                foreground: 'hsl(215 16% 47%)'
                        },
                        accent: {
                                DEFAULT: 'hsl(168 84% 89%)',
                                foreground: 'hsl(175 77% 26%)'
                        },
                        destructive: {
                                DEFAULT: 'hsl(0 84.2% 60.2%)',
                                foreground: 'hsl(0 0% 98%)'
                        },
                        border: 'hsl(214.3 31.8% 91.4%)',
                        input: 'hsl(214.3 31.8% 91.4%)',
                        ring: 'hsl(175 77% 26%)',
                        chart: {
                                '1': 'hsl(175 77% 26%)',
                                '2': 'hsl(14 100% 70%)',
                                '3': 'hsl(168 84% 89%)',
                                '4': 'hsl(210 40% 96.1%)',
                                '5': 'hsl(215 16% 47%)'
                        }
                },
                fontFamily: {
                        sans: ['Manrope', 'sans-serif'],
                        serif: ['Playfair Display', 'serif']
                },
                keyframes: {
                        'accordion-down': {
                                from: {
                                        height: '0'
                                },
                                to: {
                                        height: 'var(--radix-accordion-content-height)'
                                }
                        },
                        'accordion-up': {
                                from: {
                                        height: 'var(--radix-accordion-content-height)'
                                },
                                to: {
                                        height: '0'
                                }
                        }
                },
                animation: {
                        'accordion-down': 'accordion-down 0.2s ease-out',
                        'accordion-up': 'accordion-up 0.2s ease-out'
                }
        }
  },
  plugins: [require("tailwindcss-animate")],
};