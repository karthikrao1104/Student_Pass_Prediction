import { createContext, useContext, useState } from "react";
import api from "../services/api";

// Create Context
const AuthContext = createContext();

// Provider component
export function AuthProvider({ children }) {

    const [user, setUser] = useState(null);
    const [accessToken, setAccessToken] = useState(
        localStorage.getItem("access")
    );

    // Login function
    const login = async (username, password) => {

        const response = await api.post("accounts/login/", {
            username,
            password,
        });

        const { access, refresh } = response.data;

        localStorage.setItem("access", access);
        localStorage.setItem("refresh", refresh);

        setAccessToken(access);
        setUser({ username });

    };

    // Logout function
    const logout = () => {

        localStorage.removeItem("access");
        localStorage.removeItem("refresh");

        setAccessToken(null);
        setUser(null);

    };

    return (
        <AuthContext.Provider
            value={{
                user,
                accessToken,
                login,
                logout,
                isAuthenticated: Boolean(accessToken),
            }}
        >
            {children}
        </AuthContext.Provider>
    );

}

// Custom hook
export function useAuth() {
    return useContext(AuthContext);
}