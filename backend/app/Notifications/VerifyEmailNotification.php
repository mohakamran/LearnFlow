<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\URL;

class VerifyEmailNotification extends Notification
{
    use Queueable;

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $verifyUrl = $this->buildVerificationUrl($notifiable);

        return (new MailMessage)
            ->subject('Verify your LearnFlow AI email')
            ->greeting("Hi {$notifiable->name}!")
            ->line('Please click the button below to verify your email address.')
            ->action('Verify Email', $verifyUrl)
            ->line('This link expires in 60 minutes.')
            ->line('If you did not create an account, no further action is required.');
    }

    protected function buildVerificationUrl(object $notifiable): string
    {
        $signedUrl = URL::temporarySignedRoute(
            'api.v1.auth.verify-email',
            Carbon::now()->addMinutes(60),
            [
                'id'   => $notifiable->getKey(),
                'hash' => sha1($notifiable->getEmailForVerification()),
            ]
        );

        // For SPA: redirect the user to the frontend, passing the full signed API URL
        // so the frontend can call it directly (e.g. an iframe-free redirect).
        // In dev, just return the backend URL so clicking it verifies immediately.
        return $signedUrl;
    }
}
