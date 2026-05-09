import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { SocketProvider } from './context/SocketContext'
import GroupChat from './pages/GroupChat'
import Admin from './pages/Admin'

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={
            <SocketProvider>
              <GroupChat />
            </SocketProvider>
          } />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}
