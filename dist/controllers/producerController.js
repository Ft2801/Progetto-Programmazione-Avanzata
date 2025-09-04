import { StatusCodes } from 'http-status-codes';
import { validationResult } from 'express-validator';
import { Producer } from '../models/Producer.js';
import { ProducerCapacity } from '../models/ProducerCapacity.js';
import { Reservation } from '../models/Reservation.js';
import dayjs from 'dayjs';
import { User } from '../models/User.js';
// Crea o aggiorna il profilo del produttore
export async function upsertProfile(req, res) {
    // Convalida input
    const errors = validationResult(req);
    if (!errors.isEmpty())
        return res.status(StatusCodes.BAD_REQUEST).json({ errors: errors.array() });
    // Identifica l'utente autenticato
    const userId = req.user.sub;
    // Dati del profilo produttore
    const { energyType, co2PerKwh, pricePerKwh, defaultMaxPerHourKwh } = req.body;
    // Crea se non esiste o aggiorna se esiste
    const [producer, created] = await Producer.findOrCreate({
        where: { userId },
        defaults: { userId, energyType, co2PerKwh, pricePerKwh: pricePerKwh ?? 0, defaultMaxPerHourKwh },
    });
    if (!created) {
        // Aggiornamento idempotente dei campi modificabili
        await producer.update({ energyType, co2PerKwh, pricePerKwh: pricePerKwh ?? producer.pricePerKwh, defaultMaxPerHourKwh });
    }
    return res.json({ id: producer.id });
}
// Imposta/aggiorna capacità per slot orari
export async function upsertCapacities(req, res) {
    // Convalida input
    const errors = validationResult(req);
    if (!errors.isEmpty())
        return res.status(StatusCodes.BAD_REQUEST).json({ errors: errors.array() });
    // Trova profilo del produttore
    const userId = req.user.sub;
    const producer = await Producer.findOne({ where: { userId } });
    if (!producer)
        return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Producer profile not found' });
    // Normalizza data e iterazione sugli slot richiesti
    const dateStr = dayjs(req.body.date).format('YYYY-MM-DD');
    const slots = req.body.slots;
    // Valida che maxCapacityKwh non superi il limite per ora del produttore
    for (const s of slots) {
        if (s.maxCapacityKwh > Number(producer.defaultMaxPerHourKwh)) {
            return res.status(StatusCodes.BAD_REQUEST).json({ error: `maxCapacityKwh exceeds producer defaultMaxPerHourKwh (${producer.defaultMaxPerHourKwh})` });
        }
    }
    const results = [];
    for (const s of slots) {
        // Crea o trova lo slot e aggiorna capacità/prezzo
        const [cap] = await ProducerCapacity.findOrCreate({
            where: { producerId: producer.id, date: dateStr, hour: s.hour },
            defaults: { producerId: producer.id, date: dateStr, hour: s.hour, maxCapacityKwh: s.maxCapacityKwh, pricePerKwh: s.pricePerKwh ?? producer.pricePerKwh },
        });
        await cap.update({ maxCapacityKwh: s.maxCapacityKwh, pricePerKwh: s.pricePerKwh ?? cap.pricePerKwh });
        results.push(cap.id);
    }
    return res.json({ capacities: results });
}
// Occupazione per un intervallo di ore in una data
export async function occupancy(req, res) {
    // Convalida input
    const errors = validationResult(req);
    if (!errors.isEmpty())
        return res.status(StatusCodes.BAD_REQUEST).json({ errors: errors.array() });
    // Trova produttore e normalizza input
    const userId = req.user.sub;
    const producer = await Producer.findOne({ where: { userId } });
    if (!producer)
        return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Producer profile not found' });
    const dateStr = dayjs(req.query.date).format('YYYY-MM-DD');
    const fromHour = req.query.fromHour ? Number(req.query.fromHour) : 0;
    const toHour = req.query.toHour ? Number(req.query.toHour) : 23;
    // Preleva capacità e prenotazioni del giorno
    const capacities = await ProducerCapacity.findAll({ where: { producerId: producer.id, date: dateStr } });
    const reservations = await Reservation.findAll({ where: { producerId: producer.id, date: dateStr, status: 'reserved' } });
    const result = [];
    for (let h = fromHour; h <= toHour; h++) {
        // Aggrega capacità e prenotazioni per ogni ora e calcola la percentuale
        const cap = capacities.find(c => c.hour === h);
        const capKwh = cap ? Number(cap.maxCapacityKwh) : 0;
        const resKwh = reservations.filter(r => r.hour === h).reduce((sum, r) => sum + Number(r.kwh), 0);
        const pct = capKwh === 0 ? 0 : Math.min(100, (resKwh / capKwh) * 100);
        result.push({ hour: h, capacity: capKwh.toFixed(3), reserved: resKwh.toFixed(3), occupancyPct: Math.round(pct * 100) / 100 });
    }
    return res.json({ date: dateStr, data: result });
}
// Aggiorna prezzi per slot
export async function updatePrices(req, res) {
    // Convalida input
    const errors = validationResult(req);
    if (!errors.isEmpty())
        return res.status(StatusCodes.BAD_REQUEST).json({ errors: errors.array() });
    // Trova profilo del produttore
    const userId = req.user.sub;
    const producer = await Producer.findOne({ where: { userId } });
    if (!producer)
        return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Producer profile not found' });
    const dateStr = dayjs(req.body.date).format('YYYY-MM-DD');
    const slots = req.body.slots;
    const updated = [];
    for (const s of slots) {
        // Crea o trova lo slot e aggiorna il prezzo unitario
        const [cap] = await ProducerCapacity.findOrCreate({
            where: { producerId: producer.id, date: dateStr, hour: s.hour },
            defaults: { producerId: producer.id, date: dateStr, hour: s.hour, maxCapacityKwh: 0, pricePerKwh: s.pricePerKwh },
        });
        await cap.update({ pricePerKwh: s.pricePerKwh });
        updated.push(cap.id);
    }
    return res.json({ capacities: updated });
}
// Ricavi totali in intervallo
export async function earnings(req, res) {
    // Convalida input
    const errors = validationResult(req);
    if (!errors.isEmpty())
        return res.status(StatusCodes.BAD_REQUEST).json({ errors: errors.array() });
    // Trova produttore e normalizza intervallo
    const userId = req.user.sub;
    const producer = await Producer.findOne({ where: { userId } });
    if (!producer)
        return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Producer profile not found' });
    const [start, end] = String(req.query.range).split('|');
    const startStr = dayjs(start).format('YYYY-MM-DD');
    const endStr = dayjs(end).format('YYYY-MM-DD');
    // Somma dei ricavi nello specifico intervallo
    const reservations = await Reservation.findAll({ where: { producerId: producer.id, status: 'reserved' } });
    const filtered = reservations.filter(r => r.date >= startStr && r.date <= endStr);
    const total = filtered.reduce((sum, r) => sum + Number(r.kwh) * Number(r.unitPrice), 0);
    return res.json({ total: Math.round(total * 10000) / 10000 });
}
// Accettazione proporzionale e rimborsi
export async function proportionalAccept(req, res) {
    // Convalida input
    const errors = validationResult(req);
    if (!errors.isEmpty())
        return res.status(StatusCodes.BAD_REQUEST).json({ errors: errors.array() });
    // Trova produttore e identifica slot
    const userId = req.user.sub;
    const producer = await Producer.findOne({ where: { userId } });
    if (!producer)
        return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Producer profile not found' });
    const dateStr = dayjs(req.body.date).format('YYYY-MM-DD');
    const hour = Number(req.body.hour);
    // Recupera capacità e prenotazioni per lo slot
    const cap = await ProducerCapacity.findOne({ where: { producerId: producer.id, date: dateStr, hour } });
    if (!cap)
        return res.status(StatusCodes.BAD_REQUEST).json({ error: 'No capacity for slot' });
    const reservations = await Reservation.findAll({ where: { producerId: producer.id, date: dateStr, hour, status: 'reserved' } });
    // Se la richiesta totale supera la capacità, ridistribuisce proporzionalmente e rimborsa
    const totalRequested = reservations.reduce((s, r) => s + Number(r.kwh), 0);
    const capacity = Number(cap.maxCapacityKwh);
    if (totalRequested <= capacity)
        return res.json({ adjusted: false, message: 'No need to adjust' });
    const ratio = capacity / totalRequested;
    for (const r of reservations) {
        const newKwh = Math.round(Number(r.kwh) * ratio * 1000) / 1000;
        if (newKwh < 0.1)
            continue;
        const diff = Number(r.kwh) - newKwh;
        if (diff > 0) {
            const refund = diff * Number(r.unitPrice);
            const consumer = await User.findByPk(r.consumerId);
            if (consumer) {
                const newCredit = Math.round((Number(consumer.credit) + refund) * 10000) / 10000;
                await consumer.update({ credit: newCredit });
            }
            await r.update({ kwh: newKwh });
        }
    }
    return res.json({ adjusted: true, ratio: Math.round(ratio * 1000) / 1000 });
}
