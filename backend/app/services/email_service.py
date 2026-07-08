from datetime import datetime, timezone


def send_approval_request(purchase_order: dict, approver_email: str):
    log_entry = (
        f"[EMAIL SIMULADO] {datetime.now(timezone.utc).isoformat()}\n"
        f"  Para: {approver_email}\n"
        f"  Asunto: Solicitud de aprobación - {purchase_order['id']}\n"
        f"  Cuerpo: Se requiere tu aprobación para la orden de compra "
        f"{purchase_order['id']} de {purchase_order['supplier']} "
        f"por ${purchase_order['total']:,.2f} {purchase_order['currency']}.\n"
    )
    with open("backend/email_log.txt", "a", encoding="utf-8") as f:
        f.write(log_entry)
    print(log_entry)


def send_approval_notification(purchase_order: dict, approved: bool, approver_name: str):
    status_text = "APROBADA" if approved else "RECHAZADA"
    log_entry = (
        f"[EMAIL SIMULADO] {datetime.now(timezone.utc).isoformat()}\n"
        f"  Para: {purchase_order.get('creator_email', 'solicitante@javaline.com')}\n"
        f"  Asunto: OC {purchase_order['id']} {status_text}\n"
        f"  Cuerpo: Tu orden de compra {purchase_order['id']} ha sido "
        f"{status_text} por {approver_name}.\n"
    )
    with open("backend/email_log.txt", "a", encoding="utf-8") as f:
        f.write(log_entry)
    print(log_entry)
