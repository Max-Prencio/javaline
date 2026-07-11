import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/auth': 'http://localhost:8000',
      '/ai': 'http://localhost:8000',
      '/users': 'http://localhost:8000',
      '/inventory': 'http://localhost:8000',
      '/invoices': 'http://localhost:8000',
      '/contacts': 'http://localhost:8000',
      '/purchases': 'http://localhost:8000',
      '/sales': 'http://localhost:8000',
      '/approvals': 'http://localhost:8000',
      '/approval-hierarchies': 'http://localhost:8000',
      '/cash-registers': 'http://localhost:8000',
      '/branches': 'http://localhost:8000',
      '/admin': 'http://localhost:8000',
      '/pocket': 'http://localhost:8000',
      '/health': 'http://localhost:8000',
      '/hr': 'http://localhost:8000',
      '/duplicates': 'http://localhost:8000',
      '/business-context': 'http://localhost:8000',
    },
  },
})
