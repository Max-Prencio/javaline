import { useState } from 'react'
import { motion } from 'framer-motion'
import { FiSearch, FiSend, FiUser, FiCheck, FiCircle } from 'react-icons/fi'
import { CHATS } from '../data/seed'

export default function Chat() {
  const [chats] = useState(CHATS)
  const [activeChat, setActiveChat] = useState(chats[0])
  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')

  const filtered = chats.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  const sendMessage = () => {
    if (!message.trim()) return
    setMessage('')
  }

  const ChatBubble = ({ msg }) => (
    <div className={`flex ${msg.from === 'me' ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${msg.from === 'me'
        ? 'rounded-br-md'
        : 'rounded-bl-md'}`}
        style={{
          background: msg.from === 'me' ? 'var(--accent-gradient)' : 'var(--bg-card)',
          color: msg.from === 'me' ? '#fff' : 'var(--text-primary)',
          border: msg.from !== 'me' ? '1px solid var(--border)' : 'none',
        }}>
        <p>{msg.text}</p>
        <p className="text-[10px] mt-1 opacity-60 text-right">{msg.time}</p>
      </div>
    </div>
  )

  return (
    <div className="flex h-[calc(100vh-7rem)] gap-4">
      <div className="w-72 flex-shrink-0 rounded-xl overflow-hidden flex flex-col"
        style={{background: 'var(--bg-card)', border: '1px solid var(--border)'}}>
        <div className="p-3" style={{borderBottom: '1px solid var(--border)'}}>
          <h2 className="text-sm font-semibold mb-2" style={{color: 'var(--text-primary)'}}>
            Conversaciones
          </h2>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
            style={{background: 'var(--bg-secondary)', border: '1px solid var(--border)'}}>
            <FiSearch size={12} style={{color: 'var(--text-muted)'}} />
            <input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)}
              className="bg-transparent outline-none flex-1 text-xs"
              style={{color: 'var(--text-primary)'}} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.map(chat => (
            <button key={chat.id} onClick={() => setActiveChat(chat)}
              className="w-full text-left p-3 flex items-center gap-3 transition-all hover:bg-white/[0.03]"
              style={{
                background: activeChat?.id === chat.id ? 'var(--accent-subtle)' : 'transparent',
                borderBottom: '1px solid var(--border)',
              }}>
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{background: 'var(--accent-subtle)'}}>
                  <FiUser size={16} style={{color: 'var(--accent)'}} />
                </div>
                {chat.online && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2"
                  style={{background: 'var(--success)', borderColor: 'var(--bg-card)'}} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium truncate" style={{color: 'var(--text-primary)'}}>{chat.name}</span>
                  <span className="text-[10px] flex-shrink-0" style={{color: 'var(--text-muted)'}}>{chat.time}</span>
                </div>
                <p className="text-xs truncate mt-0.5" style={{color: 'var(--text-muted)'}}>{chat.lastMessage}</p>
              </div>
              {chat.unread > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                  style={{background: 'var(--accent)', color: '#fff'}}>{chat.unread}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 rounded-xl overflow-hidden flex flex-col"
        style={{background: 'var(--bg-card)', border: '1px solid var(--border)'}}>
        {activeChat ? (
          <>
            <div className="p-3 flex items-center gap-3"
              style={{borderBottom: '1px solid var(--border)'}}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{background: 'var(--accent-subtle)'}}>
                <FiUser size={14} style={{color: 'var(--accent)'}} />
              </div>
              <div>
                <p className="text-sm font-medium" style={{color: 'var(--text-primary)'}}>{activeChat.name}</p>
                <p className="text-[10px]" style={{color: activeChat.online ? 'var(--success)' : 'var(--text-muted)'}}>
                  {activeChat.online ? 'En línea' : 'Desconectado'}
                </p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {activeChat.messages.map((msg, i) => (
                <ChatBubble key={i} msg={msg} />
              ))}
            </div>
            <div className="p-3" style={{borderTop: '1px solid var(--border)'}}>
              <div className="flex items-center gap-2">
                <input value={message} onChange={e => setMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  placeholder="Escribe un mensaje..."
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)'}} />
                <button onClick={sendMessage}
                  className="p-2.5 rounded-xl transition-all hover:scale-105"
                  style={{background: 'var(--accent-gradient)', color: '#fff'}}>
                  <FiSend size={16} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p style={{color: 'var(--text-muted)'}}>Selecciona una conversación</p>
          </div>
        )}
      </div>
    </div>
  )
}
