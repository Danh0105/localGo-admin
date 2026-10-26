import {
  CheckOutlined,
  PaperClipOutlined,
  SendOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Button,
  Empty,
  Image,
  Input,
  Tag,
  Tooltip,
  Typography,
  message as toast,
} from "antd";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { fetchFeedbackTicket } from "../../../api/feedback-tickets";
import {
  getFeedbackRealtimeAccess,
  getFeedbackUnread,
  markFeedbackRead,
  replyFeedbackTicket,
} from "../../../api/feedback-chat";
import type {
  FeedbackTicketDetail,
  FeedbackTicketMessage,
} from "../../../types/feedback-ticket";
import { describeFeedbackTicketError } from "./feedback-ticket-errors";

/** Upload must reuse the project's authenticated /media/images flow. Returns the new media id. */
export type ChatImageUploader = (file: File) => Promise<string>;
export interface FeedbackChatProps {
  ticket: FeedbackTicketDetail;
  uploadImage?: ChatImageUploader;
  socketOrigin?: string;
}

export function FeedbackChat({
  ticket,
  uploadImage,
  socketOrigin,
}: FeedbackChatProps) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");
  const [uploads, setUploads] = useState<{ id: string; name: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [peerReadAt, setPeerReadAt] = useState<string | null>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const id = ticket.id;
  const key = useMemo(() => ["admin-feedback-ticket", id], [id]);
  const unreadQuery = useQuery({
    queryKey: ["admin-feedback-unread", id],
    queryFn: () => getFeedbackUnread(id),
    retry: false,
  });
  const readAll = useCallback(async () => {
    try {
      await markFeedbackRead(id);
      void queryClient.invalidateQueries({
        queryKey: ["admin-feedback-unread", id],
      });
      void queryClient.invalidateQueries({
        queryKey: ["admin-feedback-tickets"],
      });
    } catch {
      /* The chat remains usable when read-state service is unavailable. */
    }
  }, [id, queryClient]);
  const refresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: key });
    void queryClient.invalidateQueries({
      queryKey: ["admin-feedback-unread", id],
    });
    void queryClient.invalidateQueries({
      queryKey: ["admin-feedback-tickets"],
    });
  }, [id, key, queryClient]);

  useEffect(() => {
    let disposed = false;
    let socket: Socket | undefined;
    const connect = async () => {
      try {
        const access = await getFeedbackRealtimeAccess(id);
        if (disposed) return;
        socket = io(`${socketOrigin ?? window.location.origin}/feedback`, {
          transports: ["websocket"],
          autoConnect: false,
          reconnection: true,
        });
        const s = socket;
        const join = async () => {
          try {
            // Always request a fresh, short-lived grant on reconnect.
            const grant = await getFeedbackRealtimeAccess(id);
            if (!disposed && s.connected)
              s.emit(
                "ticket:join",
                { token: grant.token },
                (ack: { ok?: boolean }) => {
                  setConnected(Boolean(ack?.ok));
                  if (ack?.ok) {
                    refresh();
                    void readAll();
                  }
                },
              );
          } catch {
            setConnected(false);
          }
        };
        s.on("connect", () => void join());
        s.on("disconnect", () => setConnected(false));
        s.on(
          "message:new",
          (event: { ticketId: string; message: FeedbackTicketMessage }) => {
            if (event.ticketId !== id) return;
            // Refetch after commit to avoid duplicate insertion and stale ordering.
            refresh();
            if (event.message.senderRole === "user") void readAll();
          },
        );
        s.on("ticket:status", (event: { ticketId: string }) => {
          if (event.ticketId === id) refresh();
        });
        s.on("ticket:unread", (event: { ticketId: string }) => {
          if (event.ticketId === id) refresh();
        });
        s.on(
          "ticket:read",
          (event: { ticketId: string; reader: string; readAt: string }) => {
            if (event.ticketId === id && event.reader === "user")
              setPeerReadAt(event.readAt);
          },
        );
        if (!access.token) return;
        s.connect();
      } catch {
        setConnected(false);
      }
    };
    void connect();
    return () => {
      disposed = true;
      socket?.removeAllListeners();
      socket?.disconnect();
      setConnected(false);
    };
  }, [id, socketOrigin, refresh, readAll]);

  const messages = useMemo(
    () =>
      [...(ticket.messages ?? [])].sort(
        (a, b) =>
          Date.parse(a.createdAt) - Date.parse(b.createdAt) ||
          a.id.localeCompare(b.id),
      ),
    [ticket.messages],
  );
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);
  useEffect(() => {
    void readAll();
  }, [readAll]);
  const send = useMutation({
    mutationFn: () =>
      replyFeedbackTicket(id, {
        content: draft.trim(),
        mediaIds: uploads.map((x) => x.id),
      }),
    onSuccess: () => {
      setDraft("");
      setUploads([]);
      refresh();
      toast.success("Đã gửi tin nhắn");
    },
    onError: (error) => toast.error(describeFeedbackTicketError(error)),
  });
  const addImages = async (files: FileList | null) => {
    if (!files?.length || !uploadImage) return;
    const available = Math.max(0, 5 - uploads.length);
    if (files.length > available) {
      toast.warning("Mỗi tin nhắn tối đa 5 ảnh");
      return;
    }
    setUploading(true);
    try {
      const next: { id: string; name: string }[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/"))
          throw new Error("Chỉ chấp nhận tệp ảnh");
        next.push({ id: await uploadImage(file), name: file.name });
      }
      setUploads((previous) => [...previous, ...next]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tải ảnh");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };
  const closed = ticket.status === "closed";
  const count =
    unreadQuery.data?.unreadCount ??
    unreadQuery.data?.count ??
    unreadQuery.data?.unread ??
    0;
  return (
    <section className="feedback-chat" aria-label="Hội thoại phản hồi">
      <div className="feedback-chat__heading">
        <div>
          <Typography.Title level={5}>
            Hội thoại với {ticket.fullName}
          </Typography.Title>
          <Typography.Text type="secondary">
            {messages.length} tin nhắn · Mã {ticket.ticketCode}
          </Typography.Text>
        </div>
        <div className="feedback-chat__heading-right">
          {count > 0 && <Tag color="red">{count} chưa đọc</Tag>}
          <Tooltip
            title={
              connected
                ? "Đang kết nối thời gian thực"
                : "Ngoại tuyến · dùng làm mới thủ công"
            }
          >
            <Tag color={connected ? "success" : "default"}>
              {connected ? "Trực tuyến" : "Chưa kết nối"}
            </Tag>
          </Tooltip>
          <Button
            aria-label="Làm mới hội thoại"
            icon={<SyncOutlined />}
            onClick={refresh}
          />
        </div>
      </div>
      <div className="feedback-chat__messages" role="log" aria-live="polite">
        {!messages.length && (
          <Empty description="Chưa có tin nhắn trong hội thoại" />
        )}
        {messages.map((item) => (
          <div
            className={`feedback-chat__message feedback-chat__message--${item.senderRole}`}
            key={item.id}
          >
            <div className="feedback-chat__bubble">
              <div className="feedback-chat__sender">
                {item.senderRole === "admin"
                  ? item.senderName || "Quản trị viên"
                  : item.senderName || ticket.fullName}
              </div>
              {!!item.content && (
                <div className="feedback-chat__text">{item.content}</div>
              )}
              {!!item.attachments?.length && (
                <Image.PreviewGroup>
                  <div className="feedback-chat__media">
                    {item.attachments.map((a) =>
                      a.mimeType?.startsWith("image/") ? (
                        <Image
                          key={a.id}
                          src={a.url}
                          alt={a.name || "Ảnh đính kèm"}
                          width={120}
                        />
                      ) : (
                        <a
                          key={a.id}
                          href={a.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {a.name || "Tệp đính kèm"}
                        </a>
                      ),
                    )}
                  </div>
                </Image.PreviewGroup>
              )}
              <div className="feedback-chat__time">
                {new Date(item.createdAt).toLocaleString("vi-VN")}
                {item.senderRole === "admin" &&
                  peerReadAt &&
                  Date.parse(peerReadAt) >= Date.parse(item.createdAt) && (
                    <span title="Người dân đã xem">
                      {" "}
                      · <CheckOutlined /> Đã xem
                    </span>
                  )}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottom} />
      </div>
      {closed ? (
        <Alert
          type="info"
          message="Hội thoại đã đóng, không thể gửi tin nhắn mới."
          showIcon
        />
      ) : (
        <div className="feedback-chat__composer">
          {uploads.length > 0 && (
            <div className="feedback-chat__uploads">
              {uploads.map((x) => (
                <Tag
                  key={x.id}
                  closable={!send.isPending}
                  onClose={() =>
                    setUploads((old) => old.filter((y) => y.id !== x.id))
                  }
                >
                  {x.name}
                </Tag>
              ))}
            </div>
          )}
          <div className="feedback-chat__write">
            <input
              ref={fileInput}
              hidden
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => void addImages(e.target.files)}
            />
            <Button
              icon={<PaperClipOutlined />}
              disabled={
                !uploadImage ||
                uploading ||
                send.isPending ||
                uploads.length >= 5
              }
              loading={uploading}
              title={uploadImage ? "Đính kèm ảnh" : "Cần cấu hình hàm tải ảnh"}
              onClick={() => fileInput.current?.click()}
            />
            <Input.TextArea
              value={draft}
              maxLength={2000}
              autoSize={{ minRows: 1, maxRows: 4 }}
              placeholder="Nhập tin nhắn trả lời người dân..."
              onChange={(e) => setDraft(e.target.value)}
              onPressEnter={(e) => {
                if (!e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  if (
                    !send.isPending &&
                    !uploading &&
                    (draft.trim() || uploads.length)
                  )
                    send.mutate();
                }
              }}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              loading={send.isPending}
              disabled={uploading || (!draft.trim() && uploads.length === 0)}
              onClick={() => send.mutate()}
            >
              Gửi
            </Button>
          </div>
          <Typography.Text type="secondary" className="feedback-chat__hint">
            Enter để gửi · Shift + Enter để xuống dòng · Tối đa 5 ảnh
          </Typography.Text>
        </div>
      )}
    </section>
  );
}
