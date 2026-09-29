import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import GoalsPage from "./pages/GoalsPage";
import CreateGoalPage from "./pages/CreateGoalPage";
import Calendar from "./pages/Calendar";
import GoalDetailsModal from "./components/GoalDetailsModal";

function ProtectedRoute() {
    const { token } = useAuth();
    return token ? <Outlet /> : <Navigate to="/login" replace />;
}

function App() {
    return (
        // AuthProvider снаружи: токен доступен всему приложению, включая роутер
        <AuthProvider>
            {/* Router включает работу адресной строки. Всё, что внутри,
          может использовать useNavigate и другие хуки роутера */}
            <Router>
                {/* Routes выбирает ОДИН подходящий маршрут по текущему адресу */}
                <Routes>
                    {/* Открытая страница: доступна без токена */}
                    <Route path="/login" element={<LoginPage />} />

                    {/* Маршрут без path, только с element: это группа-обёртка.
              Все Route внутри проходят через ProtectedRoute */}
                    <Route element={<ProtectedRoute />}>
                        <Route path="/goals" element={<GoalsPage />}>
                            <Route path=":id" element={<GoalDetailsModal />} />
                        </Route>
                        <Route path="/creategoal" element={<CreateGoalPage />} />
                        <Route path="/calendar" element={<Calendar />} />
                    </Route>

                    {/* path="*" ловит любой неизвестный адрес и перекидывает на /goals.
              Если не залогинен, ProtectedRoute отправит дальше на /login */}
                    <Route path="*" element={<Navigate to="/goals" replace />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;