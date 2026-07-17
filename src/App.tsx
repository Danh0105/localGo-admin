import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import type { JSX } from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { AdminLayout } from './components/layout/AdminLayout';
import { AboutPage } from './pages/content/about/AboutPage';
import { AgricultureFormPage } from './pages/content/agriculture/AgricultureFormPage';
import { AgriculturePage } from './pages/content/agriculture/AgriculturePage';
import { ContactFormPage } from './pages/content/contacts/ContactFormPage';
import { ContactsPage } from './pages/content/contacts/ContactsPage';
import { CraftVillageFormPage } from './pages/content/craft-villages/CraftVillageFormPage';
import { CraftVillagesPage } from './pages/content/craft-villages/CraftVillagesPage';
import { CuisineFormPage } from './pages/content/cuisine/CuisineFormPage';
import { CuisinePage } from './pages/content/cuisine/CuisinePage';
import { ExperienceTourFormPage } from './pages/content/experience-tours/ExperienceTourFormPage';
import { ExperienceToursPage } from './pages/content/experience-tours/ExperienceToursPage';
import { FeedbackChannelFormPage } from './pages/content/feedback-channels/FeedbackChannelFormPage';
import { FeedbackChannelsPage } from './pages/content/feedback-channels/FeedbackChannelsPage';
import { FeedbackTicketDetailPage } from './pages/content/feedback-tickets/FeedbackTicketDetailPage';
import { FeedbackTicketsPage } from './pages/content/feedback-tickets/FeedbackTicketsPage';
import { FestivalFormPage } from './pages/content/festivals/FestivalFormPage';
import { FestivalsPage } from './pages/content/festivals/FestivalsPage';
import { HistoricalSiteFormPage } from './pages/content/historical-sites/HistoricalSiteFormPage';
import { HistoricalSitesPage } from './pages/content/historical-sites/HistoricalSitesPage';
import { MapPlaceFormPage } from './pages/content/map-places/MapPlaceFormPage';
import { MapPlacesPage } from './pages/content/map-places/MapPlacesPage';
import { NewsFormPage } from './pages/content/news/NewsFormPage';
import { NewsPage } from './pages/content/news/NewsPage';
import { OcopFormPage } from './pages/content/ocop/OcopFormPage';
import { OcopProductsPage } from './pages/content/ocop/OcopProductsPage';
import { SpecialtyFormPage } from './pages/content/specialties/SpecialtyFormPage';
import { SpecialtiesPage } from './pages/content/specialties/SpecialtiesPage';
import { TempleFormPage } from './pages/content/temples/TempleFormPage';
import { TemplesPage } from './pages/content/temples/TemplesPage';
import { LoginPage } from './pages/login/LoginPage';
import { TradePostsPage } from './pages/trade-posts/TradePostsPage';
import { UsersPage } from './pages/users/UsersPage';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { useAuthBootstrap } from './routes/useAuthBootstrap';
import './styles/content-forms.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppRoutes(): JSX.Element {
  useAuthBootstrap();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={<Navigate to="/trade-posts" replace />} />
          <Route path="/trade-posts" element={<TradePostsPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/content/about" element={<AboutPage />} />
          <Route path="/content/agriculture" element={<AgriculturePage />} />
          <Route path="/content/agriculture/new" element={<AgricultureFormPage />} />
          <Route path="/content/agriculture/:id" element={<AgricultureFormPage />} />
          <Route path="/content/contacts" element={<ContactsPage />} />
          <Route path="/content/contacts/new" element={<ContactFormPage />} />
          <Route path="/content/contacts/:id" element={<ContactFormPage />} />
          <Route path="/content/craft-villages" element={<CraftVillagesPage />} />
          <Route path="/content/craft-villages/new" element={<CraftVillageFormPage />} />
          <Route path="/content/craft-villages/:id" element={<CraftVillageFormPage />} />
          <Route path="/content/cuisine" element={<CuisinePage />} />
          <Route path="/content/cuisine/new" element={<CuisineFormPage />} />
          <Route path="/content/cuisine/:id" element={<CuisineFormPage />} />
          <Route path="/content/experience-tours" element={<ExperienceToursPage />} />
          <Route path="/content/experience-tours/new" element={<ExperienceTourFormPage />} />
          <Route path="/content/experience-tours/:id" element={<ExperienceTourFormPage />} />
          <Route path="/content/feedback-channels" element={<FeedbackChannelsPage />} />
          <Route path="/content/feedback-channels/new" element={<FeedbackChannelFormPage />} />
          <Route path="/content/feedback-channels/:id" element={<FeedbackChannelFormPage />} />
          <Route path="/content/feedback-tickets" element={<FeedbackTicketsPage />} />
          <Route path="/content/feedback-tickets/:id" element={<FeedbackTicketDetailPage />} />
          <Route path="/content/festivals" element={<FestivalsPage />} />
          <Route path="/content/festivals/new" element={<FestivalFormPage />} />
          <Route path="/content/festivals/:id" element={<FestivalFormPage />} />
          <Route path="/content/historical-sites" element={<HistoricalSitesPage />} />
          <Route path="/content/historical-sites/new" element={<HistoricalSiteFormPage />} />
          <Route path="/content/historical-sites/:id" element={<HistoricalSiteFormPage />} />
          <Route path="/content/map-places" element={<MapPlacesPage />} />
          <Route path="/content/map-places/new" element={<MapPlaceFormPage />} />
          <Route path="/content/map-places/:id" element={<MapPlaceFormPage />} />
          <Route path="/content/news" element={<NewsPage />} />
          <Route path="/content/news/new" element={<NewsFormPage />} />
          <Route path="/content/news/:id" element={<NewsFormPage />} />
          <Route path="/content/ocop" element={<OcopProductsPage />} />
          <Route path="/content/ocop/new" element={<OcopFormPage />} />
          <Route path="/content/ocop/:id" element={<OcopFormPage />} />
          <Route path="/content/temples" element={<TemplesPage />} />
          <Route path="/content/temples/new" element={<TempleFormPage />} />
          <Route path="/content/temples/:id" element={<TempleFormPage />} />
          <Route path="/content/specialties" element={<SpecialtiesPage />} />
          <Route path="/content/specialties/new" element={<SpecialtyFormPage />} />
          <Route path="/content/specialties/:id" element={<SpecialtyFormPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/trade-posts" replace />} />
    </Routes>
  );
}

function App(): JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider locale={viVN}>
        <Router>
          <AppRoutes />
        </Router>
      </ConfigProvider>
    </QueryClientProvider>
  );
}

export default App;
