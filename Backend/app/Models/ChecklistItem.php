<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ChecklistItem extends Model
{
    use HasFactory;

    protected $table = 'checklist_item';

    protected $fillable = [
        'checklist_id',
        'descricao',
        'concluido',
        'ordem',
    ];

    protected $casts = [
        'concluido' => 'boolean',
        'ordem'     => 'integer',
    ];

    public function checklist()
    {
        return $this->belongsTo(Checklist::class, 'checklist_id');
    }
}