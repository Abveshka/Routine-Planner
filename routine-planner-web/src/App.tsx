import { useState } from "react";
import LoginPage from "./pages/LoginPage";
import GoalsPage from "./pages/GoalsPage";

function App() {
    const [token, setToken] = useState<string | null>(localStorage.getItem("token"));

    if (token) {
        return <GoalsPage />;
    }

    return <LoginPage onLoginSuccess={(newToken) => setToken(newToken)} />;
}

export default App;