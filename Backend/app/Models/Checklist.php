<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Checklist extends Model
{
    use HasFactory;

    protected $table = 'checklist';

    protected $fillable = [
        'nome',
        'implantacao_id',
    ];

    public function implantacao()
    {
        return $this->belongsTo(NovaImplantacao::class, 'implantacao_id');
    }

    public function itens()
    {
        return $this->hasMany(ChecklistItem::class, 'checklist_id')->orderBy('ordem');
    }
}