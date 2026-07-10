import uuid
import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..middleware import get_current_user
from ..models.user import User
from ..models.ai_conversation import AiConversation
from ..services.ai_assistant import chat, run_alerts

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/chat")
def ai_chat(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user_message = data.get("message", "").strip()
    conversation_id = data.get("conversation_id")
    tenant_id = current_user.tenant_id or "default"

    if not user_message:
        raise HTTPException(400, "Mensaje requerido")

    conversation = None
    if conversation_id:
        conversation = db.query(AiConversation).filter(
            AiConversation.id == conversation_id,
            AiConversation.user_id == current_user.id,
        ).first()

    if not conversation:
        conversation = AiConversation(
            id=str(uuid.uuid4()),
            user_id=current_user.id,
            tenant_id=tenant_id,
            title=user_message[:80],
            messages="[]",
        )
        db.add(conversation)
        db.flush()

    history = json.loads(conversation.messages)
    result = chat(user_message, history, db, tenant_id)

    history.append({"role": "user", "content": user_message})
    history.append({"role": "assistant", "content": result["response"]})
    conversation.messages = json.dumps(history)
    conversation.updated_at = datetime.now(timezone.utc)
    if not conversation.title or conversation.title == user_message[:80]:
        conversation.title = user_message[:80]
    db.commit()

    return {
        "conversation_id": conversation.id,
        "response": result["response"],
        "sql": result.get("sql"),
        "data": result.get("data"),
        "alerts": result.get("alerts", []),
    }


@router.get("/alerts")
def get_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return run_alerts(current_user.tenant_id or "default", db)


@router.get("/conversations")
def list_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    convs = db.query(AiConversation).filter(
        AiConversation.user_id == current_user.id,
        AiConversation.active == True,
    ).order_by(AiConversation.updated_at.desc()).limit(50).all()
    return [{
        "id": c.id,
        "title": c.title,
        "message_count": len(json.loads(c.messages)) // 2 if c.messages else 0,
        "updated_at": c.updated_at.isoformat(),
    } for c in convs]


@router.get("/conversations/{conv_id}")
def get_conversation(
    conv_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conv = db.query(AiConversation).filter(
        AiConversation.id == conv_id,
        AiConversation.user_id == current_user.id,
    ).first()
    if not conv:
        raise HTTPException(404, "Conversación no encontrada")
    return {
        "id": conv.id,
        "title": conv.title,
        "messages": json.loads(conv.messages),
    }


@router.delete("/conversations/{conv_id}")
def delete_conversation(
    conv_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conv = db.query(AiConversation).filter(
        AiConversation.id == conv_id,
        AiConversation.user_id == current_user.id,
    ).first()
    if not conv:
        raise HTTPException(404, "Conversación no encontrada")
    conv.active = False
    db.commit()
    return {"message": "Conversación eliminada"}


@router.get("/config")
def ai_config():
    from ..config import OPENAI_API_KEY, OPENAI_MODEL
    return {"configured": bool(OPENAI_API_KEY), "model": OPENAI_MODEL if OPENAI_API_KEY else ""}
