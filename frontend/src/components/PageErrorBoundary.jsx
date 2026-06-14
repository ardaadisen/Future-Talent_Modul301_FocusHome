import { Component } from "react";
import { getStoredLanguage, translate } from "../i18n/translations.js";

export class PageErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    const pageName = this.props.pageName || "Page";
    console.error(`${pageName} render error:`, error, info);
  }

  handleRetry = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      const lang = getStoredLanguage();
      const t = (key, params) => translate(lang, key, params);
      const title = this.props.titleKey ? t(this.props.titleKey) : t("error.appTitle");
      const lead = this.props.leadKey ? t(this.props.leadKey) : t("error.appLead");

      return (
        <div className="page page-error-fallback">
          <div className="card home-error-fallback">
            <h1 className="section-title">{title}</h1>
            <p className="section-lead">{lead}</p>
            <p className="text-danger">{this.state.error.message}</p>
            <button type="button" className="btn btn-primary" onClick={this.handleRetry}>
              {t("error.tryAgain")}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
