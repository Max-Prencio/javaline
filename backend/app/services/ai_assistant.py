import json
import re
from datetime import date
from sqlalchemy import text
from openai import OpenAI
from ..config import OPENAI_API_KEY, OPENAI_MODEL
from ..models.business_context import BusinessContext

_client = None

def _get_client():
    global _client
    if _client is None:
        if not OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY no configurada")
        _client = OpenAI(api_key=OPENAI_API_KEY)
    return _client

DB_SCHEMA = """
Tablas disponibles:

1. contacts - Contactos/clientes
   - id, name, company, rnc, email, phone, type (client|proveedor), address, notes, active, created_at

2. inventory - Productos
   - id, name, sku, category, stock, min_stock, price, cost, unit, batch (lote), expiry_date (vencimiento YYYY-MM-DD),
     shelf (estante), row (fila), box (caja), location, active, created_at

3. sales - Ventas
   - id, product_id, quantity, unit_price, total, payment_method, status (paid|pending|cancelled), created_at
   - Relación: product_id -> inventory.id

4. purchase_orders - Órdenes de compra
   - id, product_id, quantity, unit_price, total, status (pending|approved|rejected|received), notes, created_at

5. invoices - Facturas
   - id, number, client_name, rnc, items (JSON), subtotal, itbis, total, status (draft|issued|cancelled), created_at

6. users - Usuarios
   - id, name, email, role (admin|manager|employee), phone, position, status, created_at

7. stock_movements - Movimientos de inventario
   - id, product_id, type (in|out), quantity, reason, notes, created_at

8. cash_registers - Caja chica
   - id, description, amount, type (in|out), category, receipt_number, notes, created_at

9. branches - Sucursales
   - id, name, code, address, phone, active, created_at

10. business_context - Contexto de negocio (información personalizada del cliente)
    - id, title, content, category, active, created_at
"""

def _load_context(tenant_id, db):
    entries = db.query(BusinessContext).filter(
        BusinessContext.tenant_id == tenant_id,
        BusinessContext.active == True,
    ).all()
    if not entries:
        return ""
    parts = ["\n=== CONTEXTO DEL NEGOCIO (proporcionado por el cliente) ==="]
    for e in entries:
        parts.append(f"[{e.category}] {e.title}: {e.content}")
    return "\n".join(parts)


def _build_system_prompt(context_block):
    return f"""Eres un asistente de negocios inteligente para Javaline. Tu personalidad es proactiva, analítica y siempre alerta.

{DB_SCHEMA}

{context_block}

=== REGLAS DE COMPORTAMIENTO ===
1. Siempre responde en español, claro y amigable.
2. Puedes consultar la BD con SQL (SELECT solamente) usando la herramienta query_database.
3. Antes de responder, piensa si debes consultar la BD para dar una respuesta precisa.
4. SIEMPRE que te pregunten por un producto, indica su ubicación exacta (shelf/row/box).
5. ALERTAS PROACTIVAS: Al inicio de cada respuesta, si encuentras situaciones críticas, menciónalas:
   - Stock bajo: productos donde stock < min_stock
   - Próximos a vencer: productos con expiry_date dentro de los próximos 30 días
   - Productos ya vencidos: expiry_date ya pasó
6. Usa COUNT, SUM, AVG, GROUP BY para resúmenes.
7. Las fechas están en TIMESTAMP (usa DATE() para convertir).
8. Los montos monetarios están en DOP.
9. business_context contiene información personalizada que el cliente agregó sobre su negocio.
"""


def _execute_query(sql: str, db):
    try:
        result = db.execute(text(sql))
        if result.returns_rows:
            rows = [dict(r._mapping) for r in result]
            return rows
        return []
    except Exception as e:
        return {"error": str(e)}


def run_alerts(tenant_id, db):
    today = date.today().isoformat()
    alerts = []

    low = _execute_query(
        "SELECT name, sku, stock, min_stock FROM inventory WHERE stock < min_stock AND active = True ORDER BY stock ASC LIMIT 10",
        db
    )
    if isinstance(low, list) and low:
        alerts.append({"type": "low_stock", "title": "Stock bajo", "items": low})

    expiring = _execute_query(
        f"SELECT name, sku, expiry_date, shelf, row, box FROM inventory WHERE expiry_date != '' AND expiry_date <= '{today}' AND expiry_date != '' AND active = True ORDER BY expiry_date ASC LIMIT 10",
        db
    )
    if isinstance(expiring, list) and expiring:
        alerts.append({"type": "expired", "title": "Productos vencidos", "items": expiring})

    soon = _execute_query(
        f"SELECT name, sku, expiry_date, shelf, row, box FROM inventory WHERE expiry_date != '' AND expiry_date > '{today}' AND expiry_date <= '{today}' AND active = True ORDER BY expiry_date ASC LIMIT 10",
        db
    )
    if isinstance(soon, list) and soon:
        alerts.append({"type": "expiring_soon", "title": "Próximos a vencer (30 días)", "items": soon})

    return alerts


def chat(user_message: str, history: list, db, tenant_id="default"):
    context_block = _load_context(tenant_id, db)
    system_prompt = _build_system_prompt(context_block)

    messages = [{"role": "system", "content": system_prompt}]
    for h in history[-10:]:
        messages.append({"role": h["role"], "content": h["content"]})
    messages.append({"role": "user", "content": user_message})

    tools = [{
        "type": "function",
        "function": {
            "name": "query_database",
            "description": "Ejecuta una consulta SQL SELECT en la base de datos. Usa LIMIT para acotar resultados.",
            "parameters": {
                "type": "object",
                "properties": {
                    "sql": {"type": "string", "description": "Consulta SQL SELECT"}
                },
                "required": ["sql"]
            }
        }
    }]

    response = _get_client().chat.completions.create(
        model=OPENAI_MODEL,
        messages=messages,
        tools=tools,
        tool_choice="auto",
        temperature=0.3,
    )

    msg = response.choices[0].message

    if msg.tool_calls:
        for tc in msg.tool_calls:
            if tc.function.name == "query_database":
                args = json.loads(tc.function.arguments)
                sql = args["sql"]
                sql_clean = re.sub(r'(?i)\b(DROP|DELETE|INSERT|UPDATE|ALTER|CREATE|TRUNCATE|GRANT|REVOKE)\b', '', sql)
                if not sql_clean.strip().upper().startswith("SELECT"):
                    return {"response": "Solo permito consultas SELECT.", "sql": None, "data": None, "alerts": run_alerts(tenant_id, db)}

                result = _execute_query(sql_clean, db)

                if isinstance(result, dict) and "error" in result:
                    correction_msg = {
                        "role": "system",
                        "content": f"Error SQL: {result['error']}. Corrígelo."
                    }
                    messages.append(msg)
                    messages.append({"role": "tool", "tool_call_id": tc.id, "content": json.dumps({"error": result["error"]})})
                    messages.append(correction_msg)
                    response2 = _get_client().chat.completions.create(
                        model=OPENAI_MODEL, messages=messages, tools=tools, tool_choice="auto", temperature=0.3,
                    )
                    msg2 = response2.choices[0].message
                    if msg2.tool_calls:
                        for tc2 in msg2.tool_calls:
                            args2 = json.loads(tc2.function.arguments)
                            sql2 = args2["sql"]
                            sql2_clean = re.sub(r'(?i)\b(DROP|DELETE|INSERT|UPDATE|ALTER|CREATE|TRUNCATE|GRANT|REVOKE)\b', '', sql2)
                            result = _execute_query(sql2_clean, db)
                            if isinstance(result, dict) and "error" in result:
                                return {"response": f"Error: {result['error']}", "sql": sql2_clean, "data": None, "alerts": run_alerts(tenant_id, db)}
                            final_messages = messages + [msg2, {"role": "tool", "tool_call_id": tc2.id, "content": json.dumps(result[:20] if isinstance(result, list) else result)}, {"role": "user", "content": "Resume en español de forma clara."}]
                            final = _get_client().chat.completions.create(model=OPENAI_MODEL, messages=final_messages, temperature=0.3)
                            return {"response": final.choices[0].message.content, "sql": sql2_clean, "data": result, "alerts": run_alerts(tenant_id, db)}
                    return {"response": msg2.content or "No pude generar consulta.", "sql": None, "data": None, "alerts": run_alerts(tenant_id, db)}

                messages.append(msg)
                messages.append({"role": "tool", "tool_call_id": tc.id, "content": json.dumps(result[:20] if isinstance(result, list) else result)})
                messages.append({"role": "user", "content": "Resume en español de forma clara. Si hay ubicaciones (shelf/row/box), menciónalas. Si hay fechas de vencimiento, menciónalas."})
                final = _get_client().chat.completions.create(model=OPENAI_MODEL, messages=messages, temperature=0.3)
                return {"response": final.choices[0].message.content, "sql": sql_clean, "data": result, "alerts": run_alerts(tenant_id, db)}

    return {"response": msg.content or "No entendí.", "sql": None, "data": None, "alerts": run_alerts(tenant_id, db)}
