import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { SocketProvider } from './context/SocketContext'
import Visitor from './pages/Visitor'
import Admin from './pages/Admin'

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/admin" element={
            <SocketProvider role="admin">
              <Admin />
            </SocketProvider>
          } />
          <Route path="*" element={
            <SocketProvider role="visitor">
              <Visitor />
            </SocketProvider>
          } />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}
