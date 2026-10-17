<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StatusConfig extends Model
{
    protected $table = 'StatusConfig';
    protected $fillable = ['nome'];
    public $timestamps = false; // Defina true se a tabela tiver created_at/updated_at
}
