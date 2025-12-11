import type { Context, Config } from "@netlify/functions";
import { neon } from "@netlify/neon";

export default async (req: Request, context: Context) => {
  const sql = neon();

  try {
    // Solo permitir GET
    if (req.method !== "GET") {
      return new Response(JSON.stringify({ message: "Método no permitido" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Obtener parámetros de búsqueda
    const url = new URL(req.url);
    const categoria = url.searchParams.get("categoria");

    let productos;

    if (categoria) {
      productos = await sql`
        SELECT id, nombre as name, descripcion as description, precio as price, imagen as image, categoria, stock
        FROM productos
        WHERE activo = true AND categoria = ${categoria}
        ORDER BY nombre
      `;
    } else {
      productos = await sql`
        SELECT id, nombre as name, descripcion as description, precio as price, imagen as image, categoria, stock
        FROM productos
        WHERE activo = true
        ORDER BY nombre
      `;
    }

    return new Response(JSON.stringify(productos), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return new Response(
      JSON.stringify({ message: "Error al obtener productos" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

export const config: Config = {
  path: "/api/products",
};
