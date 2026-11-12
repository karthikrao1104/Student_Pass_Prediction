import axios from "axios";

const api = axios.create({
    baseURL: "http://127.0.0.1:8000/api/",
    headers: {
        "Content-Type": "application/json",
    },
});

// Automatically attach access token
api.interceptors.request.use(
    (config) => {

        const token = localStorage.getItem("access");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    }
);

// Handle expired access tokens
api.interceptors.response.use(
    (response) => response,

    async (error) => {

        const originalRequest = error.config;

        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            !originalRequest.url.includes("accounts/login/") &&
            !originalRequest.url.includes("accounts/token/refresh/")
        ) {

            originalRequest._retry = true;

            const refreshToken = localStorage.getItem("refresh");

            if (!refreshToken) {
                localStorage.clear();
                window.location.href = "/#/login";
                return Promise.reject(error);
            }

            try {

                const response = await axios.post(
                    "http://127.0.0.1:8000/api/accounts/token/refresh/",
                    {
                        refresh: refreshToken
                    }
                );

                const newAccessToken = response.data.access;

                localStorage.setItem("access", newAccessToken);

                originalRequest.headers.Authorization =
                    `Bearer ${newAccessToken}`;

                return api(originalRequest);

            } catch (refreshError) {

                localStorage.clear();

                window.location.href = "/#/login";

                return Promise.reject(refreshError);

            }
        }

        return Promise.reject(error);
    }
);

export default api;