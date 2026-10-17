<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CategoriaConfig extends Model
{
    protected $table = 'CategoriaConfig';
    protected $fillable = ['nome'];
    public $timestamps = false;
}