import { Component } from "react";
import { getStoredLanguage, translate } from "../i18n/translations.js";

export class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("App render error:", error, info);
  }

  render() {
    if (this.state.error) {
      const lang = getStoredLanguage();
      const t = (key, params) => translate(lang, key, params);

      return (
        <div className="page page-error-fallback">
          <div className="card home-error-fallback">
            <h1 className="section-title">{t("error.appTitle")}</h1>
            <p className="section-lead">{t("error.appLead")}</p>
            {import.meta.env.DEV && (
              <p className="text-danger" style={{ fontSize: "0.85rem" }}>
                {this.state.error.message}
              </p>
            )}
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => this.setState({ error: null })}
            >
              {t("error.tryAgain")}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
