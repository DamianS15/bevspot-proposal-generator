export default function TermsPreview() {
    return (
        <section className="form-section" id="section-terms">
            <div className="section-header">
                <div className="section-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
                    </svg>
                </div>
                <div>
                    <p className="section-label">Part 4</p>
                    <h2 className="section-title">Terms Preview</h2>
                </div>
            </div>
            <div className="form-group">
                <label className="form-label">Generated Terms of Service</label>
                <div className="tos-box" id="tos-preview-box" dangerouslySetInnerHTML={{__html: '<p><em>Fill in the fields above to preview the Terms of Service here…</em></p>'}}>
                </div>
            </div>
        </section>
    );
}
