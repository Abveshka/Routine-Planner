import { useState } from "react";
import LoginPage from "./pages/LoginPage";
import GoalsPage from "./pages/GoalsPage";

function App() {
    const [token, setToken] = useState<string | null>(localStorage.getItem("token"));

    function handleLogout() {
        localStorage.removeItem("token");
        setToken(null);
    }

    if (token) {
        return <GoalsPage onUnauthorized={handleLogout} />;
    }

    return <LoginPage onLoginSuccess={(newToken) => setToken(newToken)} />;
}

export default App;