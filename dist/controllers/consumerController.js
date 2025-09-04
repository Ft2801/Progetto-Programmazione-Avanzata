import { StatusCodes } from 'http-status-codes';
import { validationResult } from 'express-validator';
import { User } from '../models/User.js';
import { Producer } from '../models/Producer.js';
import { ProducerCapacity } from '../models/ProducerCapacity.js';
import { Reservation } from '../models/Reservation.js';
import dayjs from 'dayjs';
import { Op } from 'sequelize';
// Prenota uno slot orario per il giorno successivo
export async function reserve(req, res) {
    // Convalida input della richiesta
    const errors = validationResult(req);
    if (!errors.isEmpty())
        return res.status(StatusCodes.BAD_REQUEST).json({ errors: errors.array() });
    // Identità del consumer dall'auth middleware
    const consumerId = req.user.sub;
    // Parametri principali della prenotazione
    const { producerId } = req.body;
    const dateStr = dayjs(req.body.date).format('YYYY-MM-DD');
    const hour = Number(req.body.hour);
    const kwh = Number(req.body.kwh);
    // Genera timestamp dello slot e impone cutoff 24h
    const slotTime = dayjs(`${dateStr} ${String(hour).padStart(2, '0')}:00:00`);
    if (slotTime.diff(dayjs(), 'hour') <= 24)
        return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Reservation cutoff passed (24h before)' });
    // Verifica esistenza produttore e capacità per lo slot
    const producer = await Producer.findByPk(producerId);
    if (!producer)
        return res.status(StatusCodes.NOT_FOUND).json({ error: 'Producer not found' });
    const cap = await ProducerCapacity.findOne({ where: { producerId, date: dateStr, hour } });
    if (!cap)
        return res.status(StatusCodes.BAD_REQUEST).json({ error: 'No capacity set for that slot' });
    // Controlla somma prenotazioni esistenti per non superare la capacità
    const existing = await Reservation.findAll({ where: { producerId, date: dateStr, hour, status: 'reserved' } });
    const existingSum = existing.reduce((s, r) => s + Number(r.kwh), 0);
    if (existingSum + kwh > Number(cap.maxCapacityKwh))
        return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Capacity exceeded' });
    // Limita il consumer a un solo produttore per ora
    const consumerExisting = await Reservation.findOne({ where: { consumerId, date: dateStr, hour, status: 'reserved' } });
    if (consumerExisting && consumerExisting.producerId !== producerId)
        return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Only one producer per hour per consumer' });
    // Calcola prezzo unitario per lo slot e costo totale
    const unitPrice = Number(cap.pricePerKwh || producer.pricePerKwh);
    const cost = unitPrice * kwh;
    // Verifica e addebita credito del consumer
    const consumer = await User.findByPk(consumerId);
    if (!consumer)
        return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Consumer not found' });
    if (Number(consumer.credit) < cost)
        return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Insufficient credit' });
    const newCreditAfterCharge = Math.round((Number(consumer.credit) - cost) * 10000) / 10000;
    await consumer.update({ credit: newCreditAfterCharge });
    // Crea prenotazione in stato "reserved"
    const resv = await Reservation.create({ consumerId, producerId, date: dateStr, hour, kwh, unitPrice, status: 'reserved' });
    return res.status(StatusCodes.CREATED).json({ id: resv.id });
}
// Modifica prenotazione o cancella (kwh=0)
export async function modify(req, res) {
    // Convalida input della richiesta
    const errors = validationResult(req);
    if (!errors.isEmpty())
        return res.status(StatusCodes.BAD_REQUEST).json({ errors: errors.array() });
    // Recupera prenotazione e verifica proprietà del consumer
    const consumerId = req.user.sub;
    const reservation = await Reservation.findByPk(Number(req.body.reservationId));
    if (!reservation || reservation.consumerId !== consumerId)
        return res.status(StatusCodes.NOT_FOUND).json({ error: 'Reservation not found' });
    const newKwh = Number(req.body.kwh);
    // Calcola cutoff per eventuale rimborso
    const slotTime = dayjs(`${reservation.date} ${String(reservation.hour).padStart(2, '0')}:00:00`);
    const consumer = await User.findByPk(consumerId);
    if (!consumer)
        return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Consumer not found' });
    if (newKwh === 0) {
        // Annullamento: rimborsa solo se oltre 24h in anticipo
        const refundAllowed = slotTime.diff(dayjs(), 'hour') > 24;
        if (refundAllowed) {
            const refund = Number(reservation.unitPrice) * Number(reservation.kwh);
            const newCreditAfterRefund = Math.round((Number(consumer.credit) + refund) * 10000) / 10000;
            await consumer.update({ credit: newCreditAfterRefund });
        }
        await reservation.update({ status: 'cancelled', kwh: 0 });
        return res.json({ cancelled: true, refunded: slotTime.diff(dayjs(), 'hour') > 24 });
    }
    // Vincolo kwh minimo
    if (newKwh < 0.1)
        return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Minimum 0.1 kWh' });
    const producerId = reservation.producerId;
    // Controlla capacità residua per lo slot tenendo fuori la prenotazione corrente
    const cap = await ProducerCapacity.findOne({ where: { producerId, date: reservation.date, hour: reservation.hour } });
    if (!cap)
        return res.status(StatusCodes.BAD_REQUEST).json({ error: 'No capacity for slot' });
    const existing = await Reservation.findAll({ where: { producerId, date: reservation.date, hour: reservation.hour, status: 'reserved' } });
    const othersSum = existing.filter(r => r.id !== reservation.id).reduce((s, r) => s + Number(r.kwh), 0);
    if (othersSum + newKwh > Number(cap.maxCapacityKwh))
        return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Capacity exceeded' });
    // Calcola differenza economica e aggiorna credito
    const diffKwh = newKwh - Number(reservation.kwh);
    const diffCost = diffKwh * Number(reservation.unitPrice);
    const newCredit = Math.round((Number(consumer.credit) - diffCost) * 10000) / 10000;
    await consumer.update({ credit: newCredit });
    // Salva nuova quantità
    await reservation.update({ kwh: newKwh });
    return res.json({ id: reservation.id, kwh: reservation.kwh });
}
// Elenco acquisti con filtri opzionali
export async function purchases(req, res) {
    // Identità del consumer
    const consumerId = req.user.sub;
    // Costruisce dinamicamente i filtri
    const where = { consumerId, status: 'reserved' };
    if (req.query.producerId)
        where.producerId = Number(req.query.producerId);
    if (req.query.range) {
        const [start, end] = String(req.query.range).split('|');
        where.date = { [Op.between]: [dayjs(start).format('YYYY-MM-DD'), dayjs(end).format('YYYY-MM-DD')] };
    }
    // Include il produttore per filtrare su attributi come energyType
    const reservations = await Reservation.findAll({ where, include: [{ model: Producer, as: 'producer' }] });
    let filtered = reservations;
    if (req.query.energyType) {
        filtered = reservations.filter(r => r.producer?.energyType === req.query.energyType);
    }
    return res.json(filtered);
}
// Calcolo dell'impronta di carbonio in un intervallo
export async function carbon(req, res) {
    // Intervallo temporale e normalizzazione date
    const consumerId = req.user.sub;
    const [start, end] = String(req.query.range).split('|');
    const startStr = dayjs(start).format('YYYY-MM-DD');
    const endStr = dayjs(end).format('YYYY-MM-DD');
    // Recupera prenotazioni con join al produttore per ottenere co2PerKwh
    const reservations = await Reservation.findAll({
        where: { consumerId, status: 'reserved' },
        include: [{ model: Producer, as: 'producer' }],
    });
    // Filtra per intervallo e calcola grammi CO2 totali
    const filtered = reservations.filter(r => r.date >= startStr && r.date <= endStr);
    const totalGrams = filtered.reduce((sum, r) => sum + Number(r.kwh) * Number(r.producer?.co2PerKwh ?? 0), 0);
    return res.json({ gramsCO2: Math.round(totalGrams * 1000) / 1000 });
}
