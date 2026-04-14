export default function AgreementDetails() {
    return (
        <section className="form-section" id="section-agreement">
            <div className="section-header">
                <div className="section-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                    </svg>
                </div>
                <div>
                    <p className="section-label">Part 3</p>
                    <h2 className="section-title">Agreement Details</h2>
                </div>
            </div>
            <div className="form-grid">
                <div className="form-group full-width">
                    <label className="form-label" htmlFor="package-type">Package Type <span className="req">*</span></label>
                    <select id="package-type" className="form-input" defaultValue="">
                        <option value="">— Select a Package —</option>
                        <option value="Beverage Pro">Beverage Pro</option>
                        <option value="Food Pro">Food Pro</option>
                        <option value="Food and Beverage Pro">Food and Beverage Pro</option>
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label" htmlFor="list-price">List Price <span className="req">*</span></label>
                    <div className="price-input-wrap">
                        <span className="sym">$</span>
                        <input type="number" id="list-price" className="form-input" placeholder="0.00" min="0" step="0.01" />
                    </div>
                </div>
                <div className="form-group">
                    <label className="form-label" htmlFor="agreement-value">Your Annual Price <span className="req">*</span></label>
                    <div className="price-input-wrap">
                        <span className="sym">$</span>
                        <input type="number" id="agreement-value" className="form-input" placeholder="0.00" min="0" step="0.01" />
                    </div>
                </div>
                <div className="form-group">
                    <label className="form-label" htmlFor="payment-terms">Payment Terms</label>
                    <select id="payment-terms" className="form-input" defaultValue="annual">
                        <option value="annual">Annually</option>
                        <option value="semi-annual">Semi-Annually</option>
                        <option value="quarterly">Quarterly</option>
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label" htmlFor="agreement-length">Subscription Length (Months)</label>
                    <input type="number" id="agreement-length" className="form-input" defaultValue="12" min="1" />
                </div>
                <div className="form-group full-width">
                    <label className="form-label" htmlFor="first-payment-date">Date of First Payment</label>
                    <input type="date" id="first-payment-date" className="form-input" />
                </div>
            </div>

            <div style={{marginTop:'18px',display:'flex',flexDirection:'column',gap:'10px'}}>
                <label className="toggle-row" id="multi-location-toggle">
                    <div>
                        <div className="toggle-row-text">Multiple Locations</div>
                        <div className="toggle-row-sub">Include multiple venue names in proposal</div>
                    </div>
                    <div className="toggle-switch"></div>
                </label>
                <input type="checkbox" id="is-multi-location" className="hidden-input" />
                <div className="expandable" id="multi-location-section">
                    <div className="expandable-inner">
                        <div className="form-group">
                            <label className="form-label" htmlFor="location-count">Number of Locations</label>
                            <input type="number" id="location-count" className="form-input" defaultValue="2" min="2" style={{maxWidth:'130px'}} />
                        </div>
                        <div className="location-grid" id="location-inputs-container"></div>
                    </div>
                </div>

                <label className="toggle-row" id="promo-toggle">
                    <div>
                        <div className="toggle-row-text">Apply Special Offer</div>
                        <div className="toggle-row-sub">Give extra months at no extra charge</div>
                    </div>
                    <div className="toggle-switch"></div>
                </label>
                <input type="checkbox" id="is-promo" className="hidden-input" />
                <div className="expandable" id="promo-section">
                    <div className="expandable-inner">
                        <div className="form-group">
                            <label className="form-label" htmlFor="promo-total-months">Total Service Months (client receives)</label>
                            <input type="number" id="promo-total-months" className="form-input" defaultValue="13" min="1" style={{maxWidth:'130px'}} />
                        </div>
                    </div>
                </div>

                <label className="toggle-row" id="discount-toggle">
                    <div>
                        <div className="toggle-row-text">Apply Discount</div>
                        <div className="toggle-row-sub">Add a discount line item to the proposal</div>
                    </div>
                    <div className="toggle-switch"></div>
                </label>
                <input type="checkbox" id="is-discount" className="hidden-input" />
                <div className="expandable" id="discount-section">
                    <div className="expandable-inner">
                        <div style={{display:'flex',gap:'15px',marginBottom:'15px'}}>
                            <div className="form-group" style={{flex:1}}>
                                <label className="form-label">Discount Type</label>
                                <div style={{display:'flex',gap:'8px',marginTop:'4px'}}>
                                    <label className="type-toggle-btn">
                                        <input type="radio" name="discount-type" value="amount" defaultChecked className="hidden-radio" />
                                        <div className="type-label">$</div>
                                    </label>
                                    <label className="type-toggle-btn">
                                        <input type="radio" name="discount-type" value="percentage" className="hidden-radio" />
                                        <div className="type-label">%</div>
                                    </label>
                                </div>
                            </div>
                            <div className="form-group" style={{flex:2}}>
                                <label className="form-label" htmlFor="discount-value">Discount Value <span className="req">*</span></label>
                                <div className="price-input-wrap">
                                    <span className="sym" id="discount-sym">$</span>
                                    <input type="number" id="discount-value" className="form-input" placeholder="0.00" min="0" step="0.01" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <label className="toggle-row" id="hub-spoke-toggle">
                    <div>
                        <div className="toggle-row-text">Hub & Spoke Pricing</div>
                        <div className="toggle-row-sub">Separate price for primary Hub and subsequent Spokes</div>
                    </div>
                    <div className="toggle-switch"></div>
                </label>
                <input type="checkbox" id="is-hub-spoke" className="hidden-input" />
                <div className="expandable" id="hub-spoke-section">
                    <div className="expandable-inner">
                        <div style={{display:'flex',gap:'15px',marginBottom:'15px'}}>
                            <div className="form-group" style={{flex:1}}>
                                <label className="form-label" htmlFor="hub-price">Hub Price <span className="req">*</span></label>
                                <div className="price-input-wrap">
                                    <span className="sym">$</span>
                                    <input type="number" id="hub-price" className="form-input" placeholder="0.00" min="0" step="0.01" />
                                </div>
                            </div>
                            <div className="form-group" style={{flex:1}}>
                                <label className="form-label" htmlFor="spoke-price">Spoke Price (per Spoke) <span className="req">*</span></label>
                                <div className="price-input-wrap">
                                    <span className="sym">$</span>
                                    <input type="number" id="spoke-price" className="form-input" placeholder="0.00" min="0" step="0.01" />
                                </div>
                            </div>
                        </div>
                        <div className="form-info-text">Total Price = Hub Price + (Spoke Price * (Locations - 1))</div>
                    </div>
                </div>
            </div>
        </section>
    );
}
