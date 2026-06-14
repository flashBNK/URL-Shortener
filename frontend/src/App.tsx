import { Route, Routes } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import Layout from "./components/layout/Layout";
import AccountPage from "./pages/AccountPage";
import CheckLinkPage from "./pages/CheckLinkPage";
import DashboardPage from "./pages/DashboardPage";
import HomePage from "./pages/HomePage";
import LinkDetailsPage from "./pages/LinkDetailsPage";
import LoginPage from "./pages/LoginPage";
import NotFoundPage from "./pages/NotFoundPage";
import PublicLinksPage from "./pages/PublicLinksPage";
import RegisterPage from "./pages/RegisterPage";

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/check" element={<CheckLinkPage />} />
          <Route path="/public" element={<PublicLinksPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/links/:shortUrl" element={<LinkDetailsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}
