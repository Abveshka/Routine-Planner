import { Plus, LayoutList, CalendarDays, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Sidebar.css";

function Sidebar() {
    const navigate = useNavigate();
    const { pathname } = useLocation();

    return (
        <aside className="sidebar">
            <button
                className={`sidebar-icon ${pathname === "/creategoal" ? "sidebar-icon-active" : ""}`}
                onClick={() => navigate("/creategoal")}
                aria-label="Добавить цель"
            >
                <Plus size={20} />
            </button>

            <div className="sidebar-divider" />

            <button
                className={`sidebar-icon ${pathname.startsWith("/goals") ? "sidebar-icon-active" : ""}`}
                onClick={() => navigate("/goals")}
                aria-label="Режим списка"
            >
                <LayoutList size={20} />
            </button>
            <button
                className={`sidebar-icon ${pathname === "/calendar" ? "sidebar-icon-active" : ""}`}
                onClick={() => navigate("/calendar")}
                aria-label="Режим календаря"
            >
                <CalendarDays size={20} />
            </button>

            <div className="sidebar-spacer" />

            <button 
                className={`sidebar-icon ${pathname === "/profile" ? "sidebar-icon-active" : ""}`}
                aria-label="Профиль"
            >
                <User size={20} />
            </button>
        </aside>
    );
}

export default Sidebar;