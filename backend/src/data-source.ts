import dotenv from 'dotenv';
import { join } from 'path';
import 'reflect-metadata';
import { DataSource } from 'typeorm';

dotenv.config({ path: join(__dirname, '../../.env') });

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: false,
  logging: false,
  entities: [join(__dirname, 'database/entities/*.entity.{ts,js}')],
  migrations: [join(__dirname, 'database/migrations/*.{ts,js}')],
  subscribers: [],
});
