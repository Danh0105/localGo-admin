import {
  FileTextOutlined,
  BankOutlined,
  CoffeeOutlined,
  CommentOutlined,
  CompassOutlined,
  CalendarOutlined,
  ContactsOutlined,
  EnvironmentOutlined,
  ExperimentOutlined,
  GiftOutlined,
  InboxOutlined,
  StarOutlined,
  HistoryOutlined,
  LogoutOutlined,
  MessageOutlined,
  ReadOutlined,
  ShopOutlined,
  TeamOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import { Avatar, Dropdown, Layout, Menu, Modal, Space, Typography, message } from 'antd';
import type { JSX } from 'react';
import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { logoutAll } from '../../api/auth';
import { useAuthStore } from '../../store/auth-store';
import { useUnsavedChangesStore } from '../../store/unsaved-changes-store';

const { Header, Sider, Content } = Layout;

const MENU_ITEMS = [
  { key: '/trade-posts', icon: <ShopOutlined />, label: 'Tin giao thương' },
  { key: '/users', icon: <TeamOutlined />, label: 'Người dùng & Business' },
  {
    key: 'content',
    icon: <FileTextOutlined />,
    label: 'Nội dung',
    children: [
      { key: '/content/about', label: 'Giới thiệu' },
      { key: '/content/temples', icon: <BankOutlined />, label: 'Đền - Chùa - Miếu' },
      { key: '/content/specialties', icon: <GiftOutlined />, label: 'Đặc sản' },
      { key: '/content/historical-sites', icon: <HistoryOutlined />, label: 'Di tích lịch sử' },
      { key: '/content/agriculture', icon: <ExperimentOutlined />, label: 'Nông nghiệp' },
      { key: '/content/contacts', icon: <ContactsOutlined />, label: 'Liên hệ' },
      { key: '/content/ocop', icon: <StarOutlined />, label: 'OCOP' },
      { key: '/content/craft-villages', icon: <ToolOutlined />, label: 'Làng nghề' },
      { key: '/content/cuisine', icon: <CoffeeOutlined />, label: 'Ẩm thực' },
      { key: '/content/experience-tours', icon: <CompassOutlined />, label: 'Tour trải nghiệm' },
      { key: '/content/map-places', icon: <EnvironmentOutlined />, label: 'Bản đồ' },
      { key: '/content/news', icon: <ReadOutlined />, label: 'Tin tức' },
      { key: '/content/festivals', icon: <CalendarOutlined />, label: 'Lễ hội' },
    ],
  },
  {
    key: 'feedback',
    icon: <MessageOutlined />,
    label: 'Phản hồi',
    children: [
      { key: '/content/feedback-channels', icon: <CommentOutlined />, label: 'Kênh phản hồi' },
      { key: '/content/feedback-tickets', icon: <InboxOutlined />, label: 'Hộp thư phản hồi' },
    ],
  },
];

/** Kept in sync with MENU_ITEMS' leaf routes — decoupled from antd's Menu item typing to avoid fighting its union type. */
const ROUTE_KEYS = [
  '/trade-posts',
  '/users',
  '/content/about',
  '/content/temples',
  '/content/specialties',
  '/content/historical-sites',
  '/content/agriculture',
  '/content/contacts',
  '/content/ocop',
  '/content/craft-villages',
  '/content/cuisine',
  '/content/experience-tours',
  '/content/map-places',
  '/content/news',
  '/content/festivals',
  '/content/feedback-channels',
  '/content/feedback-tickets',
];

export function AdminLayout(): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);

  const selectedKey = ROUTE_KEYS.find((key) => location.pathname.startsWith(key)) ?? '/trade-posts';

  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent): void {
      if (!useUnsavedChangesStore.getState().isDirty) return;
      event.preventDefault();
      event.returnValue = '';
    }
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  function handleMenuNavigate(key: string): void {
    if (key === location.pathname) return;
    const { isDirty, message: dirtyMessage, setDirty } = useUnsavedChangesStore.getState();
    if (!isDirty) {
      navigate(key);
      return;
    }
    Modal.confirm({
      title: 'Rời khỏi trang?',
      content: dirtyMessage,
      okText: 'Rời trang',
      cancelText: 'Ở lại',
      okButtonProps: { danger: true },
      onOk: () => {
        setDirty(false);
        navigate(key);
      },
    });
  }

  async function handleLogout(): Promise<void> {
    try {
      await logoutAll();
    } catch {
      // Best-effort: even if the network call fails, still clear local session.
    } finally {
      clear();
      message.success('Đã đăng xuất');
      navigate('/login', { replace: true });
    }
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="dark" width={220} breakpoint="lg" collapsedWidth={72}>
        <div
          style={{
            height: 48,
            margin: 16,
            overflow: 'hidden',
            color: '#fff',
            fontWeight: 700,
            fontSize: 18,
            textAlign: 'center',
            whiteSpace: 'nowrap',
          }}
        >
          LocalGo Admin
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          defaultOpenKeys={['content']}
          items={MENU_ITEMS}
          onClick={({ key }) => handleMenuNavigate(key)}
        />
      </Sider>
      <Layout style={{ minWidth: 0 }}>
        <Header
          style={{
            background: '#fff',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            paddingInline: 24,
          }}
        >
          <Dropdown
            menu={{
              items: [
                {
                  key: 'logout',
                  icon: <LogoutOutlined />,
                  label: 'Đăng xuất',
                  onClick: () => void handleLogout(),
                },
              ],
            }}
          >
            <Space style={{ cursor: 'pointer' }}>
              <Avatar>{user?.displayName?.charAt(0).toUpperCase()}</Avatar>
              <Typography.Text>{user?.displayName}</Typography.Text>
              <Typography.Text type="secondary">({user?.role})</Typography.Text>
            </Space>
          </Dropdown>
        </Header>
        <Content className="admin-content" style={{ margin: 24, minWidth: 0 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
