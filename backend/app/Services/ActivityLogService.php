<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ActivityLogService
{
    public function log(User $user, string $action, ?string $entityType = null, ?string $entityId = null, array $metadata = []): void
    {
        try {
            ActivityLog::create([
                'user_id' => $user->id,
                'action' => $action,
                'entity_type' => $entityType,
                'entity_id' => $entityId,
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
                'metadata' => $metadata ?: null,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to create activity log', ['error' => $e->getMessage()]);
        }
    }

    public function logWithDiff(User $user, string $action, string $entityType, string $entityId, array $oldValues, array $newValues): void
    {
        try {
            ActivityLog::create([
                'user_id' => $user->id,
                'action' => $action,
                'entity_type' => $entityType,
                'entity_id' => $entityId,
                'old_values' => $oldValues,
                'new_values' => $newValues,
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to create activity log', ['error' => $e->getMessage()]);
        }
    }
}
