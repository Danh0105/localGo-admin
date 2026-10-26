import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App as AntdApp } from "antd";

import App from "./App.tsx";
import { apiClient } from "./api/client";
import { configureFeedbackChatTransport } from "./api/feedback-chat";

import "antd/dist/reset.css";
import "./index.css";

// Khởi tạo HTTP transport cho Feedback Chat
configureFeedbackChatTransport(
  async <T,>(config: {
    method: "GET" | "POST";
    url: string;
    data?: unknown;
    signal?: AbortSignal;
  }): Promise<T> => {
    const response = await apiClient.request({
      method: config.method,
      url: config.url,
      data: config.data,
      signal: config.signal,
    });

    // Giữ nguyên dữ liệu mà API trả về nếu không có envelope
    return (response.data?.data ?? response.data) as T;
  },
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AntdApp>
      <App />
    </AntdApp>
  </StrictMode>,
);
