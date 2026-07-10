import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/auth': 'http://localhost:8007',
      '/ai': 'http://localhost:8007',
      '/users': 'http://localhost:8007',
      '/inventory': 'http://localhost:8007',
      '/invoices': 'http://localhost:8007',
      '/contacts': 'http://localhost:8007',
      '/purchases': 'http://localhost:8007',
      '/sales': 'http://localhost:8007',
      '/approvals': 'http://localhost:8007',
      '/approval-hierarchies': 'http://localhost:8007',
      '/cash-registers': 'http://localhost:8007',
      '/branches': 'http://localhost:8007',
      '/admin': 'http://localhost:8007',
      '/pocket': 'http://localhost:8007',
      '/health': 'http://localhost:8007',
      '/hr': 'http://localhost:8007',
    },
  },
})
