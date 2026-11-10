<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Ticket;
use App\Models\Cliente;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function stats(Request $request)
    {
        $periodo = $request->query('periodo', 'mes');

        // 1. Definição do filtro de data
        $queryTickets = Ticket::query();

        if ($periodo === 'hoje') {
            $queryTickets->whereDate('dataCriacao', Carbon::today());
        } elseif ($periodo === 'semana') {
            $queryTickets->where('dataCriacao', '>=', Carbon::now()->subDays(7));
        } elseif ($periodo === 'mes') {
            $queryTickets->whereMonth('dataCriacao', Carbon::now()->month)
                         ->whereYear('dataCriacao', Carbon::now()->year);
        }

        // 2. KPIs de Suporte (baseados no nome do status)
        $totalTickets = (clone $queryTickets)->count();

        $abertos = (clone $queryTickets)->whereHas('status', function ($q) {
            $q->where('nome', 'like', '%aberto%');
        })->count();

        $afazer = (clone $queryTickets)->whereHas('status', function ($q) {
            $q->where('nome', 'like', '%fazer%')
              ->orWhere('nome', 'like', '%triagem%');
        })->count();

        $pendentes = (clone $queryTickets)->whereHas('status', function ($q) {
            $q->where('nome', 'like', '%pendente%');
        })->count();

        $vencidos = (clone $queryTickets)->whereHas('status', function ($q) {
            $q->where('nome', 'like', '%vencido%');
        })->count();

        // 3. Volumetria por Tipo de Ocorrência (Categorias)
        $chartData = DB::table('ticket')
            ->join('categoria_config', 'ticket.categoria_id', '=', 'categoria_config.id')
            ->select('categoria_config.nome as label', DB::raw('count(ticket.id) as value'))
            ->groupBy('categoria_config.id', 'categoria_config.nome')
            ->orderByDesc('value')
            ->limit(4)
            ->get();

        $coresCategorias = ['#0066CC', '#F26522', '#F59E0B', '#E11D48'];
        $chartFormatado = $chartData->map(function ($item, $index) use ($coresCategorias) {
            return [
                'label' => $item->label,
                'value' => (int) $item->value,
                'color' => $coresCategorias[$index % count($coresCategorias)],
            ];
        });

        // 4. Top 5 Clientes por Volume de Chamados
        $topClientes = DB::table('ticket')
            ->join('cliente', 'ticket.cliente_id', '=', 'cliente.id')
            ->select('cliente.nomeFantasia as name', DB::raw('count(ticket.id) as tickets'))
            ->groupBy('cliente.id', 'cliente.nomeFantasia')
            ->orderByDesc('tickets')
            ->limit(5)
            ->get();

        // 5. KPIs e Tabela de Implantação (dados dos clientes)
        $clientesEmImpl = Cliente::whereNotNull('dataIniImpl')
            ->whereNull('dataFinImpl')
            ->count();

        $clientesFinalizados = Cliente::whereNotNull('dataFinImpl')->count();

        // Clientes com término de implantação / Go-Live nos próximos dias
        $proximosGoLive = Cliente::with(['plano', 'contatos'])
            ->whereNotNull('dataFinImpl')
            ->where('dataFinImpl', '>=', Carbon::today())
            ->where('dataFinImpl', '<=', Carbon::today()->addDays(8))
            ->orderBy('dataFinImpl', 'asc')
            ->get()
            ->map(function ($c) {
                $diasRestantes = Carbon::today()->diffInDays(Carbon::parse($c->dataFinImpl), false);
                return [
                    'id'            => 'IMP-' . str_pad($c->id, 3, '0', STR_PAD_LEFT),
                    'client'        => $c->nomeFantasia,
                    'plan'          => $c->plano?->nome ?? '—',
                    'assignee'      => $c->contatos->first()?->nome ?? 'Equipe Frete',
                    'goLiveDate'    => Carbon::parse($c->dataFinImpl)->format('d/m/Y'),
                    'daysRemaining' => (int) $diasRestantes,
                    'tasksDone'     => 4,
                    'tasksTotal'    => 5,
                ];
            });

        return response()->json([
            'kpis' => [
                'total'       => $totalTickets,
                'abertos'     => $abertos,
                'afazer'      => $afazer,
                'pendentes'   => $pendentes,
                'vencidos'    => $vencidos,
                'emAndamento' => $clientesEmImpl,
                'finalizadas' => $clientesFinalizados,
            ],
            'chartData'      => $chartFormatado,
            'topClients'     => $topClientes,
            'proximosGoLive' => $proximosGoLive,
        ]);
    }
}