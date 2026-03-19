/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        pending: { bg: '#fef3c7', text: '#92400e', border: '#f59e0b' },
        inprogress: { bg: '#dbeafe', text: '#1e40af', border: '#3b82f6' },
        completed: { bg: '#f1f5f9', text: '#64748b', border: '#cbd5e1' },
      }
    }
  },
  plugins: []
}
