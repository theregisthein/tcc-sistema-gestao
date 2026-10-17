<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CanalConfig extends Model
{
    protected $table = 'CanalConfig';
    protected $fillable = ['nome'];
    public $timestamps = false;
}
