/**
 * Script de migración para crear las tablas en Netlify DB (PostgreSQL)
 *
 * Ejecutar con: npm run migrate
 * Asegúrate de tener NETLIFY_DATABASE_URL configurado (ejecutar netlify dev primero)
 */

import postgres from 'postgres';

const connectionString = process.env.NETLIFY_DATABASE_URL;

if (!connectionString) {
  console.error('Error: NETLIFY_DATABASE_URL no está definido.');
  console.error('Ejecuta "netlify dev" primero para obtener la URL de la base de datos.');
  process.exit(1);
}

const sql = postgres(connectionString, { ssl: 'require' });

async function migrate() {
  console.log('Iniciando migración de base de datos...\n');

  try {
    // Tabla de usuarios
    console.log('Creando tabla usuarios...');
    await sql`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✓ Tabla usuarios creada');

    // Tabla de productos
    console.log('Creando tabla productos...');
    await sql`
      CREATE TABLE IF NOT EXISTS productos (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        descripcion TEXT,
        precio DECIMAL(10, 2) NOT NULL,
        imagen VARCHAR(500),
        categoria VARCHAR(100),
        stock INTEGER DEFAULT 0,
        activo BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✓ Tabla productos creada');

    // Tabla de pedidos
    console.log('Creando tabla pedidos...');
    await sql`
      CREATE TABLE IF NOT EXISTS pedidos (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER REFERENCES usuarios(id),
        total DECIMAL(10, 2) NOT NULL,
        estado VARCHAR(50) DEFAULT 'pendiente',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✓ Tabla pedidos creada');

    // Tabla de items de pedido
    console.log('Creando tabla pedido_items...');
    await sql`
      CREATE TABLE IF NOT EXISTS pedido_items (
        id SERIAL PRIMARY KEY,
        pedido_id INTEGER REFERENCES pedidos(id),
        producto_id INTEGER REFERENCES productos(id),
        cantidad INTEGER NOT NULL,
        precio_unitario DECIMAL(10, 2) NOT NULL
      )
    `;
    console.log('✓ Tabla pedido_items creada');

    // Insertar productos de ejemplo
    console.log('\nInsertando productos de ejemplo...');

    const productosExistentes = await sql`SELECT COUNT(*) as count FROM productos`;

    if (Number(productosExistentes[0].count) === 0) {
      await sql`
        INSERT INTO productos (nombre, descripcion, precio, imagen, categoria, stock) VALUES
        ('Golosinas Variadas', 'Caramelos, chicles, chocolates y más dulces.', 2.50, 'golosinas.jpg', 'golosinas', 100),
        ('Bebidas Energéticas', 'Variedad de marcas: Red Bull, Monster, Volt.', 8.00, 'bebidas.jpg', 'bebidas', 50),
        ('Artículos de Oficina', 'Resmas, lapiceros, folders, cuadernos.', 10.00, 'oficina.jpg', 'libreria', 200),
        ('Galletas Surtidas', 'Pack de galletas de diferentes sabores.', 5.00, 'galletas.jpg', 'golosinas', 80),
        ('Agua Mineral', 'Botella de 500ml, sin gas.', 2.00, 'agua.jpg', 'bebidas', 150),
        ('Cuaderno A4', 'Cuaderno de 100 hojas cuadriculado.', 6.50, 'cuaderno.jpg', 'libreria', 120),
        ('Jabón Líquido', 'Jabón antibacterial 250ml.', 8.50, 'jabon.jpg', 'limpieza', 60),
        ('Detergente', 'Bolsa de detergente 500g.', 12.00, 'detergente.jpg', 'limpieza', 40),
        ('Arroz Extra', 'Arroz de 1kg de alta calidad.', 4.50, 'arroz.jpg', 'abarrotes', 100),
        ('Aceite Vegetal', 'Botella de aceite de 1 litro.', 9.00, 'aceite.jpg', 'abarrotes', 70)
      `;
      console.log('✓ 10 productos de ejemplo insertados');
    } else {
      console.log('✓ Ya existen productos en la base de datos');
    }

    console.log('\n✅ Migración completada exitosamente!');

  } catch (error) {
    console.error('Error durante la migración:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

migrate();
