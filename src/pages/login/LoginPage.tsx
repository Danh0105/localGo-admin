import {
  ArrowRightOutlined,
  EnvironmentOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Form, Input, message } from 'antd';
import type { JSX } from 'react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { fetchCurrentUser, login } from '../../api/auth';
import { useAuthStore } from '../../store/auth-store';
import { ApiError } from '../../types/api';
import { ADMIN_ROLES } from '../../types/user';
import './login-page.css';

const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự'),
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
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(values: LoginFormValues): Promise<void> {
    setSubmitting(true);
    try {
      const tokens = await login(values.email, values.password);
      setTokens(tokens.accessToken, tokens.refreshToken);

      const user = await fetchCurrentUser();
      if (!ADMIN_ROLES.includes(user.role)) {
        useAuthStore.getState().clear();
        message.error('Tài khoản không có quyền truy cập trang quản trị');
        return;
      }

      setUser(user);
      navigate('/trade-posts', { replace: true });
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.code === 'INVALID_CREDENTIALS') {
          message.error('Email hoặc mật khẩu không đúng');
        } else if (error.code === 'ACCOUNT_BLOCKED') {
          message.error('Tài khoản đã bị khóa');
        } else {
          message.error(error.message || 'Đăng nhập thất bại');
        }
      } else {
        message.error('Đăng nhập thất bại');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-showcase" aria-label="Giới thiệu LocalGo">
        <div className="login-showcase__glow login-showcase__glow--top" />
        <div className="login-showcase__glow login-showcase__glow--bottom" />

        <div className="login-brand">
          <div className="login-brand__mark" aria-hidden="true">
            <EnvironmentOutlined />
          </div>
          <div>
            <span className="login-brand__name">LOCALGO</span>
            <span className="login-brand__tagline">Khám phá giá trị địa phương</span>
          </div>
        </div>

        <div className="login-showcase__content">
          <div className="login-showcase__badge">
            <SafetyCertificateOutlined />
            <span>Cổng quản trị nội bộ</span>
          </div>
          <h1>Quản trị nội dung<br />địa phương dễ dàng hơn.</h1>
          <p>
            Kiểm duyệt bài đăng, quản lý danh mục và xây dựng một cộng đồng
            LocalGo an toàn, đáng tin cậy.
          </p>
        </div>

        <div className="login-showcase__footer">
          <span>LOCALGO ADMIN PORTAL</span>
          <p>Đồng hành cùng cộng đồng trong từng hành trình.</p>
        </div>
      </section>

      <section className="login-panel">
        <div className="login-form-wrap">
          <div className="login-form-heading">
            <span className="login-form-heading__eyebrow">QUẢN TRỊ VIÊN</span>
            <h2>Chào mừng trở lại</h2>
            <p>Đăng nhập để tiếp tục quản lý hệ thống LocalGo.</p>
          </div>

          <form
            className="login-form"
            onSubmit={(e) => void handleSubmit(onSubmit)(e)}
            noValidate
          >
            <Form.Item
              label="Email đăng nhập"
              validateStatus={errors.email ? 'error' : ''}
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
                    status={errors.email ? 'error' : undefined}
                  />
                )}
              />
            </Form.Item>
            <Form.Item
              label="Mật khẩu"
              validateStatus={errors.password ? 'error' : ''}
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
                    status={errors.password ? 'error' : undefined}
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
            <span>Đăng nhập an toàn dành cho tài khoản đã được cấp quyền</span>
          </div>
        </div>
      </section>
    </main>
  );
}
