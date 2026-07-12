<?php

return [
    /*
    |--------------------------------------------------------------------------
    | AI Provider
    |--------------------------------------------------------------------------
    | Supported: "openai", "anthropic", "gemini", "deepseek"
    */
    'provider' => env('AI_PROVIDER', 'openai'),

    'providers' => [
        'openai' => [
            'api_key' => env('OPENAI_API_KEY'),
            'organization' => env('OPENAI_ORGANIZATION'),
            'model' => env('OPENAI_MODEL', 'gpt-4o'),
            'max_tokens' => (int) env('OPENAI_MAX_TOKENS', 4096),
            'base_url' => 'https://api.openai.com/v1',
        ],

        'anthropic' => [
            'api_key' => env('ANTHROPIC_API_KEY'),
            'model' => env('ANTHROPIC_MODEL', 'claude-opus-4-8'),
            'max_tokens' => 4096,
            'base_url' => 'https://api.anthropic.com',
        ],

        'gemini' => [
            'api_key' => env('GEMINI_API_KEY'),
            'model' => env('GEMINI_MODEL', 'gemini-1.5-pro'),
            'base_url' => 'https://generativelanguage.googleapis.com',
        ],

        'deepseek' => [
            'api_key' => env('DEEPSEEK_API_KEY'),
            'model' => env('DEEPSEEK_MODEL', 'deepseek-chat'),
            'base_url' => 'https://api.deepseek.com',
        ],
    ],

    'rate_limits' => [
        'requests_per_minute' => (int) env('RATE_LIMIT_AI', 20),
        'max_tokens_per_request' => 4096,
        'max_prompt_length' => 2000,
    ],

    'features' => [
        'roadmap_generation' => true,
        'lesson_content' => true,
        'quiz_generation' => true,
        'code_review' => true,
        'project_review' => true,
        'chat_mentor' => true,
        'progress_analysis' => true,
    ],
];
