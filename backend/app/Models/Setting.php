<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

class Setting extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = ['key', 'value', 'type', 'group', 'description', 'is_public'];

    protected function casts(): array
    {
        return ['is_public' => 'boolean'];
    }

    public static function get(string $key, mixed $default = null): mixed
    {
        $setting = static::where('key', $key)->first();

        if (!$setting) return $default;

        return $setting->getCastedValue();
    }

    public static function set(string $key, mixed $value, string $type = 'string'): void
    {
        $storeValue = $type === 'encrypted' ? Crypt::encryptString((string) $value) : (string) $value;

        if ($type === 'json' && !is_string($value)) {
            $storeValue = json_encode($value);
        }

        static::updateOrCreate(
            ['key' => $key],
            ['value' => $storeValue, 'type' => $type]
        );
    }

    public function getCastedValue(): mixed
    {
        return match ($this->type) {
            'integer' => (int) $this->value,
            'boolean' => (bool) $this->value,
            'json' => json_decode($this->value, true),
            'encrypted' => $this->value ? Crypt::decryptString($this->value) : null,
            default => $this->value,
        };
    }
}
