export default function GenerateArea() {
    return (
        <div className="generate-area">
            <div className="generate-info">
                <h3>Ready to generate?</h3>
                <p>Review your terms above, then click to download your branded PDF proposal.</p>
            </div>
            <button className="generate-btn" id="generate-pdf">
                <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                <div className="spinner"></div>
                Download PDF
            </button>
        </div>
    );
}
