# React + Vite + Tailwind + Supabase

This is a starter template for a React application using Vite, Tailwind CSS, and Supabase.

## Features

- React 19 with TypeScript
- Vite for fast development and building
- Tailwind CSS for styling
- Supabase for backend functionality

## Getting Started

### Prerequisites

- Node.js (version 18 or later recommended)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   # or
   yarn
   ```

### Supabase Configuration

1. Create a Supabase project at https://supabase.com
2. Create a `.env.local` file in the project root with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### Development

Start the development server:

```bash
npm run dev
# or
yarn dev
```

### Building for Production

```bash
npm run build
# or
yarn build
```

## Project Structure

- `/src` - Source files
  - `/src/supabaseClient.ts` - Supabase client configuration
  - `/src/App.tsx` - Main application component
  - `/src/main.tsx` - Application entry point

## Learn More

- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Supabase Documentation](https://supabase.com/docs)
