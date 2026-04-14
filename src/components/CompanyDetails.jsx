import { bevspotLogo } from "../assets/images";

export default function CompanyDetails() {
    return (
        <section className="form-section" id="section-company">
            <div className="section-header">
                <div className="section-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11m16-11v11M8 14v4m4-4v4m4-4v4"/>
                    </svg>
                </div>
                <div>
                    <p className="section-label">Part 1</p>
                    <h2 className="section-title">Company Details</h2>
                </div>
            </div>

            <div className="logos-row">
                <label className="logo-upload-box">
                    <input type="file" id="client-logo-upload" accept="image/*" />
                    <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4m14-7l-5-5-5 5m5-5v12"/>
                    </svg>
                    <div className="upload-label" id="upload-label-text">Upload Client Logo</div>
                    <div className="upload-hint">PNG or JPG (Max 2MB)</div>
                </label>
                <div className="logo-vs">VS</div>
                <div className="bevspot-logo-box">
                    <img id="bevspot-logo-img" src={bevspotLogo} alt="BevSpot" />
                </div>
            </div>

            <div className="form-grid">
                <div className="form-group full-width">
                    <label className="form-label" htmlFor="location-name">Location Name (Primary) <span className="req">*</span></label>
                    <input type="text" id="location-name" className="form-input" placeholder="e.g., The Grand Oak Tavern" />
                </div>
                <div className="form-group">
                    <label className="form-label" htmlFor="proposal-date">Proposal Date</label>
                    <input type="date" id="proposal-date" className="form-input" />
                </div>
                <div className="form-group">
                    <label className="form-label">&nbsp;</label>
                    <label className="toggle-row" id="revised-toggle">
                        <div>
                            <div className="toggle-row-text">Revised Proposal</div>
                            <div className="toggle-row-sub">Adds "(Revised)" to filename</div>
                        </div>
                        <div className="toggle-switch"></div>
                    </label>
                    <input type="checkbox" id="is-revised" className="hidden-input" />
                </div>
            </div>
        </section>
    );
}
