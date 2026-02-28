import { useQueryClient } from "@tanstack/react-query";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";
import type { AuthUser, LoginRequest, LoginResponse, UserRole } from "#/types";
import api from "./api";

function getRoleFromToken(
	token: string,
): { role: UserRole; role_level: number } | null {
	try {
		const payload = JSON.parse(atob(token.split(".")[1]));
		if (payload.exp && payload.exp * 1000 < Date.now()) {
			return null;
		}
		if (payload.role) {
			return { role: payload.role, role_level: payload.role_level };
		}
	} catch {
		/* invalid token */
	}
	return null;
}

interface AuthContextType {
	user: AuthUser | null;
	token: string | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	login: (data: LoginRequest) => Promise<void>;
	logout: () => Promise<void>;
	refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<AuthUser | null>(() => {
		const stored = localStorage.getItem("user");
		return stored ? JSON.parse(stored) : null;
	});
	const [token, setToken] = useState<string | null>(() =>
		localStorage.getItem("access_token"),
	);
	const [isLoading, setIsLoading] = useState(true);
	const queryClient = useQueryClient();

	useEffect(() => {
		if (token) {
			const roleInfo = getRoleFromToken(token);
			if (!roleInfo) {
				try {
					const payload = JSON.parse(atob(token.split(".")[1]));
					if (payload.exp && payload.exp * 1000 < Date.now()) {
						setToken(null);
						setUser(null);
						localStorage.removeItem("access_token");
						localStorage.removeItem("user");
						setIsLoading(false);
						return;
					}
				} catch {
					// Invalid token format, let API call handle it
				}
			}
			api
				.get<AuthUser>("/auth/profile")
				.then((res) => {
					const merged: AuthUser = {
						...res.data,
						role: res.data.role || roleInfo?.role || "Pegawai",
						role_level: res.data.role_level || roleInfo?.role_level || 4,
					};
					setUser(merged);
					localStorage.setItem("user", JSON.stringify(merged));
				})
				.catch(() => {
					setToken(null);
					setUser(null);
					localStorage.removeItem("access_token");
					localStorage.removeItem("user");
				})
				.finally(() => setIsLoading(false));
		} else {
			setIsLoading(false);
		}
	}, [token]);

	const login = useCallback(async (data: LoginRequest) => {
		const res = await api.post<LoginResponse>("/auth/login", data);
		const { access_token, user: userData } = res.data;
		const roleInfo = getRoleFromToken(access_token);
		const merged: AuthUser = {
			...userData,
			role: userData.role || roleInfo?.role || "Pegawai",
			role_level: userData.role_level || roleInfo?.role_level || 4,
		};
		localStorage.setItem("access_token", access_token);
		localStorage.setItem("user", JSON.stringify(merged));
		setToken(access_token);
		setUser(merged);
	}, []);

	const logout = useCallback(async () => {
		try {
			await api.post("/auth/logout");
		} finally {
			localStorage.removeItem("access_token");
			localStorage.removeItem("user");
			setToken(null);
			setUser(null);
			queryClient.clear();
		}
	}, [queryClient]);

	const refreshProfile = useCallback(async () => {
		const res = await api.get<AuthUser>("/auth/profile");
		setUser(res.data);
		localStorage.setItem("user", JSON.stringify(res.data));
	}, []);

	return (
		<AuthContext.Provider
			value={{
				user,
				token,
				isAuthenticated: !!token && !!user,
				isLoading,
				login,
				logout,
				refreshProfile,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
}
