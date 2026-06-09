import { useI18n } from "../../i18n/I18nProvider";

export default function Footer() {
  const { t } = useI18n();

  return (
    <footer className="site-footer">
      <div>
        <strong>{t("footer.author")}</strong>
        <span>
          {t("footer.contact")}{" "}
          <a href="mailto:lolmaks23@gmail.com">lolmaks23@gmail.com</a>
        </span>
        <span>
          {t("footer.telegram")} <a href="https://t.me/flashBNK">@flashBNK</a>
        </span>
      </div>
    </footer>
  );
}
