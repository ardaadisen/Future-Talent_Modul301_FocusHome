import { Component } from "react";
import { getStoredLanguage, translate } from "../i18n/translations.js";

export class HomePageErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    console.error("My Home page render error:", error);
  }

  render() {
    if (this.state.error) {
      const lang = getStoredLanguage();
      const t = (key, params) => translate(lang, key, params);

      return (
        <div className="page page-home">
          <div className="card home-error-fallback">
            <h1 className="section-title">{t("home.title")}</h1>
            <p className="section-lead">{t("home.loadError")}</p>
            <p className="text-danger">{this.state.error.message}</p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => this.setState({ error: null })}
            >
              {t("home.tryAgain")}
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
