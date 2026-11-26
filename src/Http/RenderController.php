<?php

declare(strict_types=1);

namespace Wuemv\InertiaLivewire\Http;

use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Crypt;
use Livewire\Livewire;

/**
 * Renders a lazy component. The route checks the signature and expiry first;
 * here the payload must decrypt and belong to the user asking for it.
 */
final class RenderController
{
    public function __invoke(Request $request): Response
    {
        try {
            $payload = json_decode(Crypt::decryptString((string) $request->query('c')), true, 512, JSON_THROW_ON_ERROR);
        } catch (DecryptException|\JsonException) {
            abort(403);
        }
        abort_unless(is_array($payload) && is_string($payload['component'] ?? null), 403);
        abort_unless(($payload['user'] ?? null) === Auth::id(), 403);

        $params = is_array($payload['params'] ?? null) ? $payload['params'] : [];

        return response((string) Livewire::mount($payload['component'], $params))
            ->header('Content-Type', 'text/html; charset=UTF-8')
            ->header('Cache-Control', 'no-store, private');
    }
}
