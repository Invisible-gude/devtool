<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/index.html', fn () => response()->file(base_path('index.html')));
Route::get('/register', fn () => response()->file(base_path('register.html')))->name('register');
Route::get('/register.html', fn () => response()->file(base_path('register.html')));
Route::get('/register.js', fn () => response()->file(base_path('register.js'), [
    'Content-Type' => 'text/javascript; charset=utf-8',
]));
