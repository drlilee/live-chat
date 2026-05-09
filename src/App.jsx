import { ThemeProvider } from './context/ThemeContext'
import { SocketProvider } from './context/SocketContext'
import GroupChat from './pages/GroupChat'
import Admin from './pages/Admin'

function Router() {
  const isAdmin = window.location.pathname === '/admin'
  if (isAdmin) {
    return <Admin />
  }
  return (
    <SocketProvider>
      <GroupChat />
    </SocketProvider>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <Router />
    </ThemeProvider>
  )
}
