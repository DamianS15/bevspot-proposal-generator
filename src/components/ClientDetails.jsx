export default function ClientDetails() {
    return (
        <section className="form-section" id="section-client">
            <div className="section-header">
                <div className="section-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                </div>
                <div>
                    <p className="section-label">Part 2</p>
                    <h2 className="section-title">Client Details</h2>
                </div>
            </div>
            <div className="form-grid">
                <div className="form-group full-width">
                    <label className="form-label" htmlFor="client-name">Client Name <span className="req">*</span></label>
                    <input type="text" id="client-name" className="form-input" placeholder="e.g., Jane Smith" />
                </div>
                <div className="form-group">
                    <label className="form-label" htmlFor="client-email">Email Address</label>
                    <input type="email" id="client-email" className="form-input" placeholder="jane@grandoak.com" />
                </div>
                <div className="form-group">
                    <label className="form-label" htmlFor="client-phone">Contact Number</label>
                    <input type="tel" id="client-phone" className="form-input" placeholder="(555) 123-4567" />
                </div>
            </div>
        </section>
    );
}
