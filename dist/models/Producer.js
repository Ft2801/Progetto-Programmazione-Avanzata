import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../shared/db.js';
import { User } from './User.js';
// Modello Sequelize per i produttori
export class Producer extends Model {
}
// Definizione campi e opzioni del modello Producer
Producer.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    energyType: {
        type: DataTypes.ENUM('Fossile', 'Eolico', 'Fotovoltaico'),
        allowNull: false,
    },
    co2PerKwh: { type: DataTypes.DECIMAL(10, 3), allowNull: false },
    pricePerKwh: { type: DataTypes.DECIMAL(10, 4), allowNull: false, defaultValue: 0 },
    defaultMaxPerHourKwh: { type: DataTypes.DECIMAL(10, 3), allowNull: false, defaultValue: 0 },
}, { sequelize, tableName: 'producers', modelName: 'Producer', timestamps: true, underscored: true });
// Associazioni: un utente ha un profilo produttore
User.hasOne(Producer, { foreignKey: 'userId', as: 'producer' });
Producer.belongsTo(User, { foreignKey: 'userId', as: 'user' });
