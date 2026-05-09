import { ThemeProvider } from './context/ThemeContext'
import { SocketProvider } from './context/SocketContext'
import GroupChat from './pages/GroupChat'

export default function App() {
  return (
    <ThemeProvider>
      <SocketProvider>
        <GroupChat />
      </SocketProvider>
    </ThemeProvider>
  )
}
