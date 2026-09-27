/**
 * Fire-and-forget call to the Notification service. Failures are logged, never
 * thrown — a student missing a push notification must never block or fail the
 * underlying business operation (resolving a complaint, approving a visitor, etc).
 */
export async function notifyUser(userId: string, title: string, message: string): Promise<void> {
    const baseUrl = process.env.NOTIFICATION_SERVICE_URL ?? 'http://notification:4004';
    try {
        await fetch(`${baseUrl}/notifications`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, title, message }),
        });
    } catch (err) {
        console.error(`Failed to notify user ${userId}:`, err instanceof Error ? err.message : err);
    }
}
