import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
// export default defineConfig(({ mode }) => {
export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
  //   server: {
  //   host: "0.0.0.0",  
  // },
    
    // server: mode === 'development' ? {
    //   proxy: {
    //     '/api': {  
    //       target: 'https://microfinance-demo.shadvalpay.co.in',
    //       changeOrigin: true,
    //       secure: true,
    //       rewrite: (path) => path.replace(/^\/api/, '/api')
    //     }
    //   }
    // } : undefined
  }
  
})
