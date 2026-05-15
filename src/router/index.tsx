import { createBrowserRouter } from 'react-router-dom'
import LoginPage from '../pages/LoginPage'
import RegisterPage from '../pages/RegisterPage'
import BoardsPage from '../pages/BoardsPage'
import BoardDetailPage from '../pages/BoardDetailPage'
import ProtectedRoute from './ProtectedRoute'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/', element: <BoardsPage /> },
      { path: '/boards/:id', element: <BoardDetailPage /> },
    ],
  },
])
