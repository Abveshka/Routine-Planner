import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

// Описываем, что именно будет лежать в контексте.
// Любой компонент сможет получить эти три вещи: токен и две функции.
type AuthContextType = {
    token: string | null;
    login: (token: string) => void;
    logout: () => void;
};

// Создаём сам контекст. Это как «общее хранилище», к которому
// можно подключиться из любого места дерева компонентов.
// Начальное значение null: оно нужно, только если забыли обернуть в Provider.
const AuthContext = createContext<AuthContextType | null>(null);

// Provider: компонент-обёртка, который хранит состояние и раздаёт его вниз.
// children это всё, что мы внутрь него положим (у нас будет весь Router).
export function AuthProvider({ children }: { children: ReactNode }) {
    // Состояние токена. Начальное значение берём из localStorage,
    // чтобы после перезагрузки страницы пользователь оставался залогиненным.
    const [token, setToken] = useState<string | null>(
        localStorage.getItem("token")
    );

    const login = useCallback((newToken: string) => {
        localStorage.setItem("token", newToken);
        setToken(newToken);
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem("token");
        setToken(null);
    }, []);

    return (
        // value это то, что получат все компоненты внутри Provider.
        // Когда token меняется, все, кто использует useAuth(), перерисуются.
        <AuthContext.Provider value={{ token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    // Если ctx === null, значит компонент вызвали вне AuthProvider.
    // Лучше сразу получить понятную ошибку, чем странный баг позже.
    if (!ctx) throw new Error("useAuth нужно использовать внутри AuthProvider");
    return ctx;
}