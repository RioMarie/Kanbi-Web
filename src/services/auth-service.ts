import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import api from "./api";

interface TokenPayload {
  sub: string;
  email: string;
  user_id: number;
  exp: number;
}

export function getTokenPayload(): TokenPayload | null {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
}

interface LoginPayload {
  email: string;
  password: string;
}

interface LoginResponse {
  access_token: string;
}

interface RegisterPayload {
  email: string;
  password: string;
}

const authApi = {
  login: (payload: LoginPayload) =>
    api.post<LoginResponse>("/auth/login", payload).then((r) => r.data),
  register: (payload: RegisterPayload) =>
    api.post("/users", payload).then((r) => r.data),
};

interface UseLoginOptions {
  onSuccess?: () => void;
}

export function useLogin(options?: UseLoginOptions) {
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: ({ access_token }) => {
      localStorage.setItem("token", access_token);
      options?.onSuccess?.();
    },
  });
}

export function useRegister(options?: UseLoginOptions) {
  return useMutation({
    mutationFn: authApi.register,
    onSuccess: () => options?.onSuccess?.(),
  });
}

export function useLogout() {
  const navigate = useNavigate();
  return () => {
    localStorage.removeItem("token");
    navigate("/login", { replace: true });
  };
}
