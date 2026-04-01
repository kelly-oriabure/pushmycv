import type { Config } from 'tailwindcss';
const plugin = require('tailwindcss/plugin');

const config: Config = {
    darkMode: ['class'],
    content: [
        './app/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        container: {
            center: true,
            padding: '2rem',
            screens: {
                '2xl': '1400px'
            }
        },
        extend: {
            colors: {
                'brand-blue': '#3B82F6',
                'brand-light-blue': '#60A5FA',
                'brand-blue-hover': '#2563EB',
                'brand-green': '#10B981',
                'brand-green-button': '#059669',
                'brand-gray-50': '#F9FAFB',
                'brand-gray-100': '#F3F4F6',
                'brand-gray-200': '#E5E7EB',
                'brand-gray-400': '#9CA3AF',
                'brand-gray-600': '#4B5563',
                'brand-gray-800': '#1F2937',
                'brand-gray-900': '#111827',
                'brand-success': '#10B981',
                'brand-warning': '#F59E0B',
                'brand-error': '#EF4444',
                // Dashboard colors
                'dashboard-primary': '#13b6ec',
                'background-light': '#f6f8f8',
                'background-dark': '#101d22',
                primary: {
                    DEFAULT: '#3aab75',
                    foreground: '#ffffff',
                },
                secondary: {
                    DEFAULT: '#f3cf3e',
                    foreground: '#1f2937',
                },
                border: 'hsl(var(--border))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                destructive: {
                    DEFAULT: 'hsl(var(--destructive))',
                    foreground: 'hsl(var(--destructive-foreground))'
                },
                muted: {
                    DEFAULT: 'hsl(var(--muted))',
                    foreground: 'hsl(var(--muted-foreground))'
                },
                accent: {
                    DEFAULT: 'hsl(var(--accent))',
                    foreground: 'hsl(var(--accent-foreground))'
                },
                popover: {
                    DEFAULT: 'hsl(var(--popover))',
                    foreground: 'hsl(var(--popover-foreground))'
                },
                card: {
                    DEFAULT: 'hsl(var(--card))',
                    foreground: 'hsl(var(--card-foreground))'
                },
                sidebar: {
                    DEFAULT: 'hsl(var(--sidebar-background))',
                    foreground: 'hsl(var(--sidebar-foreground))',
                    primary: 'hsl(var(--sidebar-primary))',
                    'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
                    accent: 'hsl(var(--sidebar-accent))',
                    'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
                    border: 'hsl(var(--sidebar-border))',
                    ring: 'hsl(var(--sidebar-ring))'
                }
            },
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)'
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
                },
                'collapsible-down': {
                    from: {
                        height: '0'
                    },
                    to: {
                        height: 'var(--radix-collapsible-content-height)'
                    }
                },
                'collapsible-up': {
                    from: {
                        height: 'var(--radix-collapsible-content-height)'
                    },
                    to: {
                        height: '0'
                    }
                },
                'spin-slow': {
                    from: {
                        transform: 'rotate(0deg)'
                    },
                    to: {
                        transform: 'rotate(360deg)'
                    }
                }
            },
            animation: {
                'accordion-down': 'accordion-down 0.2s ease-out',
                'accordion-up': 'accordion-up 0.2s ease-out',
                'collapsible-down': 'collapsible-down 0.2s ease-out',
                'collapsible-up': 'collapsible-up 0.2s ease-out',
                'spin-slow': 'spin-slow 3s linear infinite'
            }
        }
    },
    plugins: [
        require('@tailwindcss/typography'),
        require('@tailwindcss/forms'),
        require('tailwindcss-animate'),
        plugin(function ({ addComponents }: { addComponents: (components: any) => void }) {
            addComponents({
                '.text-field': {
                    '@apply flex h-12 w-full rounded-lg border bg-[#f7f9fc] border-[#ebf1f4] px-4 py-2 text-sm shadow-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50':
                        {},
                },
            });
        }),
    ],
}

export default config;
