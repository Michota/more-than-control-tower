/**
 * Ky-based HTTP adapter for Kubb generated code.
 *
 * Kubb's generated clients/hooks import this module and call the default
 * export for every API request. The three exported types (RequestConfig,
 * ResponseConfig, ResponseErrorConfig) are part of Kubb's client contract.
 */
import ky from "ky";

export type RequestConfig<TData = unknown> = {
    url?: string;
    method: "GET" | "PUT" | "PATCH" | "POST" | "DELETE";
    params?: object;
    data?: TData | FormData;
    headers?: HeadersInit;
    signal?: AbortSignal;
};

export type ResponseConfig<TData = unknown> = {
    data: TData;
    status: number;
    statusText: string;
};

export type ResponseErrorConfig<TError = unknown> = TError;

export type Client = typeof client;

const api = ky.create({
    prefixUrl: "/api",
    credentials: "include",
    hooks: {
        afterResponse: [
            async (request, _options, response) => {
                if (response.status !== 401) {
                    return response;
                }

                // Don't retry refresh/login/logout to avoid infinite loops
                const url = new URL(request.url);
                if (url.pathname.match(/\/auth\/(refresh|login|logout)/)) {
                    return response;
                }

                // Attempt silent token refresh
                try {
                    const refreshResponse = await ky.post("auth/refresh", {
                        prefixUrl: "/api",
                        credentials: "include",
                    });

                    if (refreshResponse.ok) {
                        // Retry original request with new cookies
                        return ky(request, { credentials: "include", retry: 0 });
                    }
                } catch {
                    // Refresh failed — fall through to return the 401.
                    // Ky will throw HTTPError for non-2xx, so React Query
                    // sees an error. Auth state is managed reactively via
                    // session query; route guards handle redirect to login.
                }

                return response;
            },
        ],
    },
});

export const client = async <TData, TError = unknown, TVariables = unknown>(
    config: RequestConfig<TVariables>,
): Promise<ResponseConfig<TData>> => {
    const url = (config.url ?? "").replace(/^\//, "");
    const response = await api(url, {
        method: config.method,
        headers: config.headers,
        signal: config.signal,
        json: config.data instanceof FormData ? undefined : (config.data ?? undefined),
        body: config.data instanceof FormData ? config.data : undefined,
        searchParams: config.params as Record<string, string | number | boolean> | undefined,
        retry: 0,
    });

    const hasBody = response.status !== 204 && response.headers.get("content-length") !== "0";
    const data = hasBody ? await response.json<TData>() : (null as TData);
    return { data, status: response.status, statusText: response.statusText };
};

export default client;
