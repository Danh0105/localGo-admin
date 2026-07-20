import {
  ArrowRightOutlined,
  CheckCircleFilled,
  LockOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Form, Input, message } from "antd";
import type { JSX } from "react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { fetchCurrentUser, login } from "../../api/auth";
import { useAuthStore } from "../../store/auth-store";
import { ApiError } from "../../types/api";
import { ADMIN_ROLES } from "../../types/user";
import "./login-page.css";
import companyLogo from "./static/logo-cty.png";
import partyLogo from "./static/logo-dan.png";

const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginPage(): JSX.Element {
  const navigate = useNavigate();
  const setTokens = useAuthStore((s) => s.setTokens);
  const setUser = useAuthStore((s) => s.setUser);
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginFormValues): Promise<void> {
    setSubmitting(true);
    try {
      const tokens = await login(values.email, values.password);
      setTokens(tokens.accessToken, tokens.refreshToken);

      const user = await fetchCurrentUser();
      if (!ADMIN_ROLES.includes(user.role)) {
        useAuthStore.getState().clear();
        message.error("Tài khoản không có quyền truy cập trang quản trị");
        return;
      }

      setUser(user);
      navigate("/trade-posts", { replace: true });
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.code === "INVALID_CREDENTIALS") {
          message.error("Email hoặc mật khẩu không đúng");
        } else if (error.code === "ACCOUNT_BLOCKED") {
          message.error("Tài khoản đã bị khóa");
        } else {
          message.error(error.message || "Đăng nhập thất bại");
        }
      } else {
        message.error("Đăng nhập thất bại");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section
        className="login-showcase"
        aria-label="Giới thiệu hệ thống LocalGo"
      >
        <div className="login-showcase__orb login-showcase__orb--top" />
        <div className="login-showcase__orb login-showcase__orb--bottom" />

        <header className="login-brand" aria-label="Đơn vị vận hành">
          <div className="login-brand__logos">
            <div className="login-brand__logo login-brand__logo--party">
              <img src={partyLogo} alt="Biểu trưng Đảng Cộng sản Việt Nam" />
            </div>
            <span className="login-brand__divider" aria-hidden="true" />
            <div className="login-brand__company">
              <div className="login-brand__logo login-brand__logo--company">
                <img src={companyLogo} alt="Logo SkillTripX Travel" />
              </div>
              <span className="login-brand__company-name">
                CÔNG TY TNHH
                <strong>SKILLTRIPX</strong>
              </span>
            </div>
          </div>
          <div className="login-brand__copy">
            <span className="login-brand__name">LOCALGO</span>
            <span className="login-brand__tagline">
              Nền tảng quản trị địa phương
            </span>
          </div>
        </header>

        <div className="login-showcase__content">
          <div className="login-showcase__eyebrow">
            <span className="login-showcase__eyebrow-line" aria-hidden="true" />
            Cổng quản trị nội bộ
          </div>
          <h1>
            Quản trị tập trung.
            <span>Vận hành hiệu quả.</span>
          </h1>
          <p>
            Đồng hành cùng địa phương trong hành trình số hóa nội dung, kết nối
            cộng đồng và lan tỏa những giá trị bền vững.
          </p>

          <div
            className="login-showcase__highlights"
            aria-label="Lợi ích hệ thống"
          >
            <div className="login-showcase__highlight">
              <CheckCircleFilled />
              <span>Quản lý tập trung</span>
            </div>
            <div className="login-showcase__highlight">
              <CheckCircleFilled />
              <span>Dữ liệu bảo mật</span>
            </div>
            <div className="login-showcase__highlight">
              <CheckCircleFilled />
              <span>Vận hành minh bạch</span>
            </div>
          </div>
        </div>

        <div className="login-showcase__footer">
          <span>LOCALGO ADMIN PORTAL</span>
          <span className="login-showcase__status">
            <i aria-hidden="true" /> Hệ thống đang hoạt động
          </span>
        </div>
      </section>

      <section className="login-panel">
        <div className="login-panel__inner">
          <div className="login-form-card">
            <div className="login-form-heading">
              <div className="login-form-heading__icon" aria-hidden="true">
                <SafetyCertificateOutlined />
              </div>
              <span className="login-form-heading__eyebrow">
                TÀI KHOẢN QUẢN TRỊ
              </span>
              <h2>Chào mừng trở lại</h2>
              <p>Vui lòng đăng nhập để tiếp tục làm việc với LocalGo.</p>
            </div>

            <form
              className="login-form"
              onSubmit={(event) => void handleSubmit(onSubmit)(event)}
              noValidate
            >
              <Form.Item
                label="Email đăng nhập"
                validateStatus={errors.email ? "error" : ""}
                help={errors.email?.message}
              >
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      size="large"
                      prefix={<UserOutlined />}
                      placeholder="Nhập email đăng nhập"
                      autoComplete="username"
                      autoFocus
                      status={errors.email ? "error" : undefined}
                    />
                  )}
                />
              </Form.Item>
              <Form.Item
                label="Mật khẩu"
                validateStatus={errors.password ? "error" : ""}
                help={errors.password?.message}
              >
                <Controller
                  name="password"
                  control={control}
                  render={({ field }) => (
                    <Input.Password
                      {...field}
                      size="large"
                      prefix={<LockOutlined />}
                      placeholder="Nhập mật khẩu"
                      autoComplete="current-password"
                      status={errors.password ? "error" : undefined}
                    />
                  )}
                />
              </Form.Item>
              <Button
                className="login-submit"
                type="primary"
                htmlType="submit"
                size="large"
                block
                loading={submitting}
                iconPosition="end"
                icon={<ArrowRightOutlined />}
              >
                Đăng nhập
              </Button>
            </form>

            <div className="login-panel__support">
              <SafetyCertificateOutlined />
              <span>Chỉ dành cho tài khoản đã được cấp quyền truy cập</span>
            </div>
          </div>

          <div className="login-panel__footer">
            <span>© {new Date().getFullYear()} LocalGo</span>
            <span aria-hidden="true">•</span>
            <span>Bảo mật &amp; riêng tư</span>
          </div>
        </div>
      </section>
    </main>
  );
}
