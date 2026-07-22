import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/auth': 'http://localhost:5001',
      '/ai': 'http://localhost:5001',
      '/users': 'http://localhost:5001',
      '/inventory': 'http://localhost:5001',
      '/invoices': 'http://localhost:5001',
      '/contacts': 'http://localhost:5001',
      '/purchases': 'http://localhost:5001',
      '/purchase-orders': 'http://localhost:5001',
      '/sales': 'http://localhost:5001',
      '/approvals': 'http://localhost:5001',
      '/approval-hierarchies': 'http://localhost:5001',
      '/cash-registers': 'http://localhost:5001',
      '/branches': 'http://localhost:5001',
      '/admin': 'http://localhost:5001',
      '/pocket': 'http://localhost:5001',
      '/health': 'http://localhost:5001',
      '/hr': 'http://localhost:5001',
      '/surveys': 'http://localhost:5001',
      '/reports': 'http://localhost:5001',
      '/duplicates': 'http://localhost:5001',
      '/business-context': 'http://localhost:5001',
      '/accounting': 'http://localhost:5001',
    },
  },
})
