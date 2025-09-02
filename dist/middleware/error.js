// Errore HTTP applicativo con status code e dettagli opzionali
export class HttpError extends Error {
    constructor(status, message, details) {
        super(message);
        this.status = status;
        this.details = details;
    }
}
// Middleware 404 per risorse non trovate
export function notFound(_req, res) {
    res.status(404).json({ error: 'Not Found' });
}
// Handler globale degli errori: logga e risponde con 500 se non è un HttpError
export function errorHandler(err, _req, res, _next) {
    if (err instanceof HttpError) {
        return res.status(err.status).json({ error: err.message, details: err.details });
    }
    // eslint-disable-next-line no-console
    console.error('Unhandled error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
}
