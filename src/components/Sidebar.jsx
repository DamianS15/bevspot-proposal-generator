export default function Sidebar() {
    return (
        <aside className="sidebar">
            <div className="sidebar-title">Configuration</div>
            <ul className="nav-steps">
                <li className="nav-step active">
                    <div className="step-num">1</div>
                    Company Details
                </li>
                <li className="nav-step">
                    <div className="step-num">2</div>
                    Client Details
                </li>
                <li className="nav-step">
                    <div className="step-num">3</div>
                    Agreement Details
                </li>
                <li className="nav-step">
                    <div className="step-num">4</div>
                    Terms Preview
                </li>
            </ul>

            <div className="sidebar-divider"></div>
            
            <div className="sidebar-preview-label">Current Configuration</div>
            <div className="preview-pill" id="preview-package">
                Selected Plan:<br /><strong>Not Selected</strong>
            </div>
            <div className="sidebar-divider"></div>
            <div className="sidebar-preview-label">Your Annual Price</div>
            <div className="preview-pill" id="preview-price">
                <strong>$0.00</strong>
            </div>

            <div className="sidebar-divider"></div>
            <div className="sidebar-title">Saved Proposals</div>
            <div className="saved-proposals-container" id="saved-proposals-list">
                <div className="empty-state">No saved proposals yet</div>
            </div>
        </aside>
    );
}
