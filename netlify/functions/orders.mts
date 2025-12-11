import type { Context, Config } from "@netlify/functions";
import { neon } from "@netlify/neon";

interface TokenPayload {
  userId: number;
  email: string;
  exp: number;
}

function parseToken(token: string): TokenPayload | null {
  try {
    const payload = JSON.parse(atob(token));
    if (payload.exp < Date.now()) {
      return null; // Token expirado
    }
    return payload;
  } catch {
    return null;
  }
}

interface OrderItem {
  productId: number;
  nombre: string;
  precio: number;
  cantidad: number;
}

export default async (req: Request, context: Context) => {
  const sql = neon();

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ message: "Método no permitido" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Verificar autenticación
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ message: "No autorizado" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const token = authHeader.substring(7);
    const payload = parseToken(token);

    if (!payload) {
      return new Response(
        JSON.stringify({ message: "Token inválido o expirado" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const body = await req.json();
    const { items } = body as { items: OrderItem[] };

    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(
        JSON.stringify({ message: "El pedido debe tener al menos un producto" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Calcular total
    const total = items.reduce((sum, item) => {
      return sum + (Number(item.precio) * (item.cantidad || 1));
    }, 0);

    // Crear pedido
    const pedidoResult = await sql`
      INSERT INTO pedidos (usuario_id, total, estado)
      VALUES (${payload.userId}, ${total}, 'pendiente')
      RETURNING id
    `;

    const pedidoId = pedidoResult[0].id;

    // Insertar items del pedido
    for (const item of items) {
      await sql`
        INSERT INTO pedido_items (pedido_id, producto_id, cantidad, precio_unitario)
        VALUES (${pedidoId}, ${item.productId}, ${item.cantidad || 1}, ${item.precio})
      `;
    }

    return new Response(
      JSON.stringify({
        message: "Pedido creado exitosamente",
        orderId: pedidoId,
        total: total.toFixed(2),
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error al crear pedido:", error);
    return new Response(
      JSON.stringify({ message: "Error al procesar el pedido" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

export const config: Config = {
  path: "/api/orders",
};
