import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",         // Blue primary (now)
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        neon: ["'Orbitron'", "ui-sans-serif", "system-ui"],
      },
      boxShadow: {
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
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        wave: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-20deg)' },
          '75%': { transform: 'rotate(20deg)' }
        },
        'float-up': {
          '0%': { transform: 'translateY(0)', opacity: '0' },
          '50%': { opacity: '1' },
          '100%': { transform: 'translateY(-20px)', opacity: '0' }
        },
        "fly-across": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(200%)" }
        },
        "swing": {
          "0%, 100%": { transform: "rotate(-10deg)" },
          "50%": { transform: "rotate(10deg)" }
        },
        "fly-path": {
          "0%": { transform: "translate(-50%, -50%) rotate(0deg) translateY(-150px) rotate(0deg)" },
          "25%": { transform: "translate(-50%, -50%) rotate(90deg) translateY(-150px) rotate(-90deg)" },
          "50%": { transform: "translate(-50%, -50%) rotate(180deg) translateY(-150px) rotate(-180deg)" },
          "75%": { transform: "translate(-50%, -50%) rotate(270deg) translateY(-150px) rotate(-270deg)" },
          "100%": { transform: "translate(-50%, -50%) rotate(360deg) translateY(-150px) rotate(-360deg)" }
        },
        "plane-tilt": {
          "0%, 25%, 50%, 75%, 100%": { transform: "rotate(0deg)" },
          "12.5%, 37.5%, 62.5%, 87.5%": { transform: "rotate(-15deg)" }
        },
        "float": {
          "0%": { transform: "translateY(0px) rotate(0deg)", opacity: "0.3" },
          "50%": { transform: "translateY(-20px) rotate(180deg)", opacity: "0.6" },
          "100%": { transform: "translateY(-40px) rotate(360deg)", opacity: "0" }
        },
        "fly-footer": {
          "0%": { left: "-10%" },
          "100%": { left: "110%" }
        },
        "astronaut-swing": {
          "0%, 100%": { transform: "rotate(-10deg)" },
          "50%": { transform: "rotate(10deg)" }
        },
        'fly-smooth-path': {
          '0%': { left: '-10%', bottom: '0%' },
          '20%': { left: '10%', bottom: '10%' },
          '40%': { left: '40%', bottom: '30%' },
          '60%': { left: '70%', bottom: '10%' },
          '80%': { left: '90%', bottom: '20%' },
          '100%': { left: '110%', bottom: '0%' }
        },
        'fly-smooth-path-trail': {
          '0%': { opacity: '0', left: '-10%' },
          '10%': { opacity: '0.5' },
          '30%': { opacity: '1' },
          '80%': { opacity: '0.7' },
          '100%': { opacity: '0', left: '110%' }
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        "fade-in": "fade-in 0.3s ease-out",
        wave: 'wave 2s ease-in-out infinite',
        'float-up-1': 'float-up 2s ease-out infinite',
        'float-up-2': 'float-up 2s ease-out infinite 0.5s',
        'float-up-3': 'float-up 2s ease-out infinite 1s',
        "fly-across": "fly-across 15s linear infinite",
        "swing": "swing 2s ease-in-out infinite",
        "fly-path": "fly-path 20s linear infinite",
        "plane-tilt": "plane-tilt 20s linear infinite",
        "float": "float 4s ease-in infinite",
        "fly-footer": "fly-footer 12s linear infinite",
        "astronaut-swing": "astronaut-swing 3s ease-in-out infinite",
        "fly-smooth-path": "fly-smooth-path 12s cubic-bezier(0.77,0,0.175,1) infinite",
        "fly-smooth-path-trail": "fly-smooth-path-trail 12s cubic-bezier(0.77,0,0.175,1) infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

