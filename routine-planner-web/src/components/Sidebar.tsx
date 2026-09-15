import { Plus, LayoutList, CalendarDays, User } from "lucide-react";
import "./Sidebar.css";

interface SidebarProps {
    onAddGoal: () => void;
}

function Sidebar({ onAddGoal }: SidebarProps) {
    return (
        <aside className="sidebar">
            <button className="sidebar-icon" onClick={onAddGoal} aria-label="Добавить цель">
                <Plus size={20} />
            </button>

            <div className="sidebar-divider" />

            <button className="sidebar-icon sidebar-icon-active" aria-label="Режим списка">
                <LayoutList size={20} />
            </button>
            <button className="sidebar-icon" aria-label="Режим календаря">
                <CalendarDays size={20} />
            </button>

            <div className="sidebar-spacer" />

            <button className="sidebar-icon" aria-label="Профиль">
                <User size={20} />
            </button>
        </aside>
    );
}

export default Sidebar;