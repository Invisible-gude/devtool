# Drop-off Station

Laravel 12 application for PHP 8.2 or newer. The existing Drop-off and registration pages are served by Laravel. Registration posts to `/api/register` and saves users through `App\Models\User` with hashed passwords.

## Local setup

```sh
composer install
cp .env.example .env # Only when .env does not already exist
php artisan key:generate
# Configure DB_* in .env for your database before migrating.
php artisan migrate
npm install
npm run build
php artisan serve
```

Open <http://127.0.0.1:8000> or, with this folder parked in Laravel Herd, <http://devtool.test>. The registration page is available at `/register` and `/register.html`.

The installed application's `.env` retains the existing PostgreSQL settings. Laravel migrations need a working connection to that database. Fresh installations using the example SQLite configuration should first create `database/database.sqlite`.

## Development and checks

`composer dev` runs Laravel, Vite, the queue worker, and logs. `composer test` runs PHP tests using a separate in-memory SQLite database. `npm test` and `npm run typecheck` check the existing Netlify functions. `npm run build` builds Laravel's frontend assets.

The existing Netlify functions and Drizzle migrations remain available for the Netlify runtime; Laravel uses `database/migrations` and the database configured in `.env`.
