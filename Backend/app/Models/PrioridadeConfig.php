<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PrioridadeConfig extends Model
{
    protected $table = 'PrioridadeConfig';
    protected $fillable = ['nome', 'prazo'];
    public $timestamps = false;
}