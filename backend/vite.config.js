import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import { bunny } from 'laravel-vite-plugin/fonts';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    base: '/Kilo/',
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'], // change to .js if not using TypeScript
            refresh: true,
            fonts: [
                bunny('Instrument Sans', {
                    weights:,
                }),
            ],
        }),
        react(),
        tailwindcss(),
    ],
    server: {
        watch: {
            ignored: ['**/storage/framework/views/**'],
        },
    },
});