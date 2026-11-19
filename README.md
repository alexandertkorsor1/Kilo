# Kilo

A full-stack photography portfolio, gallery management, and client inquiry application.

## Tech Stack
* **Frontend:** React, TypeScript, Vite, Tailwind CSS
* **Backend:** Laravel (PHP)
* **Database & Auth:** Supabase / MySQL

## Getting Started

### 1. Frontend Setup
```bash
npm install
npm run dev
```

### 2. Backend Setup
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```
