import { useEffect } from "react";
import "./ConfirmDialog.css";

type Props = {
    title: string;
    message: string;
    confirmText?: string;
    isLoading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
};

function ConfirmDialog({
                           title,
                           message,
                           confirmText = "Удалить",
                           isLoading = false,
                           onConfirm,
                           onCancel,
                       }: Props) {
    // Закрытие по клавише Escape
    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") onCancel();
        }
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [onCancel]);

    return (
        <div className="confirm-overlay" onClick={onCancel}>
            <div className="confirm-card" onClick={(e) => e.stopPropagation()}>
                <h3 className="confirm-title">{title}</h3>
                <p className="confirm-message">{message}</p>
                <div className="confirm-actions">
                    <button
                        className="confirm-btn confirm-btn-secondary"
                        onClick={onCancel}
                        disabled={isLoading}
                    >
                        Отмена
                    </button>
                    <button
                        className="confirm-btn confirm-btn-danger"
                        onClick={onConfirm}
                        disabled={isLoading}
                    >
                        {isLoading ? "Удаление..." : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmDialog;