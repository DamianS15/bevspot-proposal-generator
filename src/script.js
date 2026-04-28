import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
// Import logo as inline base64 at build time — avoids any runtime fetch/CORS hang
import bsLogoDataURL from "./assets/bevspot-logo.png?inline";

export function initGenerator() {

    const paymentTerms    = document.getElementById('payment-terms');
    const agreementLength = document.getElementById('agreement-length');
    const agreementValue  = document.getElementById('agreement-value');
    const listPriceInput  = document.getElementById('list-price');
    const packageType     = document.getElementById('package-type');
    const firstPayDate    = document.getElementById('first-payment-date');
    const tosBox          = document.getElementById('tos-preview-box');
    const genBtn          = document.getElementById('generate-pdf');
    const locName         = document.getElementById('location-name');
    const clientName      = document.getElementById('client-name');
    const clientLogoUp    = document.getElementById('client-logo-upload');
    const isRevised       = document.getElementById('is-revised');
    const isMultiLoc      = document.getElementById('is-multi-location');
    const locCount        = document.getElementById('location-count');
    const locInputsCont   = document.getElementById('location-inputs-container');
    const isPromo         = document.getElementById('is-promo');
    const promoMonths     = document.getElementById('promo-total-months');
    const isDiscount      = document.getElementById('is-discount');
    const discountAmt     = document.getElementById('discount-value');
    const discountSym     = document.getElementById('discount-sym');
    const discountTypes   = document.getElementsByName('discount-type');
    const isHubSpoke      = document.getElementById('is-hub-spoke');
    const hubPriceInput   = document.getElementById('hub-price');
    const spokePriceInput = document.getElementById('spoke-price');
    // bsLogoImg DOM lookup removed — logo is now a pre-built data URL (bsLogoDataURL)
    let clientLogoData    = null;
    let currentProposalId = null;

    if (!genBtn) return () => {}; // Prevent runs before DOM is ready

    // TOGGLE SETUP
    function setupToggle(toggleId, checkboxId, expandableId) {
        const t = document.getElementById(toggleId);
        const c = document.getElementById(checkboxId);
        const e = expandableId ? document.getElementById(expandableId) : null;
        if (!t || !c) return;
        t.addEventListener('click', () => {
            c.checked = !c.checked;
            t.classList.toggle('checked', c.checked);
            if (e) e.classList.toggle('open', c.checked);
            updateTOS(); updatePreview();
            if (checkboxId === 'is-multi-location' && c.checked) genLocInputs();
        });
    }
    setupToggle('revised-toggle', 'is-revised', null);
    setupToggle('multi-location-toggle', 'is-multi-location', 'multi-location-section');
    setupToggle('promo-toggle', 'is-promo', 'promo-section');
    setupToggle('discount-toggle', 'is-discount', 'discount-section');
    setupToggle('hub-spoke-toggle', 'is-hub-spoke', 'hub-spoke-section');

    // HELPERS
    function fmt$(n) {
        const v = parseFloat(n);
        return isNaN(v) ? '$0.00' : v.toLocaleString('en-US',{style:'currency',currency:'USD',minimumFractionDigits:2});
    }
    function fmtDate(d) {
        if (!d) return '[Date]';
        // Parse as local midnight to avoid timezone-based day shifts
        const [year, month, day] = d.split('-').map(Number);
        return `${String(month).padStart(2,'0')}/${String(day).padStart(2,'0')}/${year}`;
    }
    function addMonths(ds, m) {
        if (!ds) return '[Date]';
        const [year, month, day] = ds.split('-').map(Number);
        const d = new Date(year, month - 1 + m, day);
        return `${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}/${d.getFullYear()}`;
    }

    // TOS UPDATE
    function updateTOS() {
        const terms = paymentTerms.value;
        const len   = parseInt(agreementLength.value) || 12;
        // Bug 5 fix: clamp prices to 0 so negatives can't produce nonsensical output
        const rawPrice    = isHubSpoke && isHubSpoke.checked 
            ? (parseFloat(hubPriceInput.value) || 0) + ((parseInt(locCount.value) || 1) - 1) * (parseFloat(spokePriceInput.value) || 0)
            : Math.max(0, parseFloat(agreementValue.value) || 0);
        // Bug 1 fix: subtract discount from effective price used in terms preview
        const isPercent   = Array.from(discountTypes).find(r => r.checked)?.value === 'percentage';
        const discountVal = (isDiscount.checked ? Math.max(0, parseFloat(discountAmt.value) || 0) : 0);
        let discountDollars = 0;
        if (isDiscount.checked) {
            discountDollars = isPercent ? (rawPrice * (discountVal / 100)) : discountVal;
        }
        const price       = Math.max(0, rawPrice - discountDollars);
        const fd          = firstPayDate.value;
        let h = `<p>1. BevSpot Inc's agreement begins upon activation of accounts. BevSpot Inc's agreement length is for <strong>${len} Months</strong> from the date of activation of accounts.</p>`;
        if (isPromo.checked) {
            const tm = promoMonths.value || len;
            h += `<p><strong>SPECIAL OFFER:</strong> Customer will receive <strong>${tm} months</strong> of service for the price of <strong>${len} months</strong>.</p>`;
        }
        if (discountDollars > 0) {
            const disp = isPercent ? `${discountVal}%` : fmt$(discountVal);
            h += `<p><strong>Discount Applied:</strong> ${disp} off annual price (effective price: <strong>${fmt$(price)}</strong>).</p>`;
        }
        if (terms === 'annual') {
            h += `<p>2. By agreeing to an <strong>Annual</strong> payment structure, I am authorizing BevSpot Inc, to collect payment of <strong>${fmt$(price)}</strong> on or before <strong>${fmtDate(fd)}</strong>.</p>`;
        } else if (terms === 'semi-annual') {
            // Bug 4 fix: calculate actual number of semi-annual payments from subscription length
            const numPayments = Math.ceil(len / 6);
            const amt = numPayments > 0 ? price / numPayments : price / 2;
            let payItems = '';
            for (let i = 0; i < numPayments; i++) {
                const dateStr = i === 0 ? fmtDate(fd) : addMonths(fd, i * 6);
                payItems += `<li>Payment ${i+1}: <strong>${fmt$(amt)}</strong> on or before <strong>${dateStr}</strong></li>`;
            }
            h += `<p>2. By agreeing to a <strong>Semi-Annual</strong> payment structure, I am authorizing BevSpot Inc, to collect payments as scheduled below:</p><ul>${payItems}</ul><p><strong>Signature:</strong> _________________________</p>`;
        } else if (terms === 'quarterly') {
            // Bug 4 fix: calculate actual number of quarterly payments from subscription length
            const numPayments = Math.ceil(len / 3);
            const amt = numPayments > 0 ? price / numPayments : price / 4;
            let payItems = '';
            for (let i = 0; i < numPayments; i++) {
                const dateStr = i === 0 ? fmtDate(fd) : addMonths(fd, i * 3);
                payItems += `<li>Payment ${i+1}: <strong>${fmt$(amt)}</strong> on or before <strong>${dateStr}</strong></li>`;
            }
            h += `<p>2. By agreeing to a <strong>Quarterly</strong> payment structure, I am authorizing BevSpot Inc, to collect payments as scheduled below:</p><ul>${payItems}</ul><p><strong>Signature:</strong> _________________________</p>`;
        }
        h += `<p>3. I have read and accepted <a href="https://bevspot.com/terms-conditions/" target="_blank">BevSpot's terms and conditions</a>. Customer hereby accepts the terms and conditions outlined here and orders from BevSpot the Services described in this Order Form.</p>`;
        tosBox.innerHTML = h;
    }

    // LOCATION INPUTS
    function genLocInputs() {
        const count = parseInt(locCount.value) || 0;
        locInputsCont.innerHTML = '';
        for (let i = 0; i < count; i++) {
            const g = document.createElement('div'); g.className = 'form-group';
            const l = document.createElement('label'); l.className = 'form-label'; l.textContent = `Location ${i+1}`;
            const inp = document.createElement('input'); inp.type = 'text'; inp.className = 'form-input location-name-input'; inp.placeholder = 'Enter location name';
            g.appendChild(l); g.appendChild(inp); locInputsCont.appendChild(g);
        }
    }

    // SIDEBAR PREVIEW
    function updatePreview() {
        // Bug 6 fix: removed dead comma-expression (c.value, l.value were never used)
        const pkg = packageType.value;
        // Bug 5 fix: clamp to 0; Bug 2 fix: subtract discount from displayed price
        const rawVal      = isHubSpoke && isHubSpoke.checked 
            ? (parseFloat(hubPriceInput.value) || 0) + ((parseInt(locCount.value) || 1) - 1) * (parseFloat(spokePriceInput.value) || 0)
            : Math.max(0, parseFloat(agreementValue.value) || 0);
        const isPercent   = Array.from(discountTypes).find(r => r.checked)?.value === 'percentage';
        const discountVal = (isDiscount.checked ? Math.max(0, parseFloat(discountAmt.value) || 0) : 0);
        const discountDollars = isPercent ? (rawVal * (discountVal / 100)) : discountVal;
        const effectiveVal = Math.max(0, rawVal - discountDollars);
        const prevPkg = document.getElementById('preview-package');
        const prevPrice = document.getElementById('preview-price');
        if(prevPkg) prevPkg.innerHTML = `Selected Plan:<br /><strong>${pkg || 'Not Selected'}</strong>`;
        const suffix = isDiscount.checked ? ' (Discount Applied)' : '';
        if(prevPrice) prevPrice.innerHTML = `Your Annual Price${suffix}:<br /><strong>${fmt$(effectiveVal)}</strong>`;
    }

    // EVENTS
    [paymentTerms, agreementLength, agreementValue, firstPayDate,
     locName, document.getElementById('proposal-date'), clientName,
     document.getElementById('client-email'), document.getElementById('client-phone'),
     packageType, promoMonths, listPriceInput, discountAmt, hubPriceInput, spokePriceInput, locCount
    ].forEach(el => {
        if (!el) return;
        const ev = (el.type === 'checkbox' || el.tagName === 'SELECT') ? 'change' : 'input';
        el.addEventListener(ev, () => { updateTOS(); updatePreview(); });
    });
    locCount.addEventListener('input', genLocInputs);
    discountTypes.forEach(r => r.addEventListener('change', () => {
        if (discountSym) discountSym.textContent = r.value === 'percentage' ? '%' : '$';
        updateTOS(); updatePreview();
    }));

    // DATABASE LOGIC
    async function fetchProposals() {
        const list = document.getElementById('saved-proposals-list');
        if (!list) return;
        try {
            const res = await fetch('/api/proposals');
            const result = await res.json();
            if (result.message === 'success' && result.data.length > 0) {
                list.innerHTML = result.data.map(p => `
                    <div class="saved-proposal-item" data-id="${p.id}">
                        <div class="item-name">${p.locationName || 'Unnamed Proposal'}</div>
                        <div class="item-meta">${p.clientName || 'No Client'} • ${new Date(p.createdAt).toLocaleDateString()}</div>
                        <button class="delete-btn" data-id="${p.id}" title="Delete Proposal">&times;</button>
                    </div>
                `).join('');
                list.querySelectorAll('.saved-proposal-item').forEach(item => {
                    item.addEventListener('click', (e) => {
                        if (e.target.classList.contains('delete-btn')) {
                            e.stopPropagation();
                            deleteProposal(e.target.dataset.id);
                        } else {
                            loadProposal(item.dataset.id);
                        }
                    });
                });
            } else {
                list.innerHTML = '<div class="empty-state">No saved proposals yet</div>';
            }
        } catch (err) {
            console.error('Failed to fetch proposals:', err);
        }
    }

    async function deleteProposal(id) {
        if (!confirm('Are you sure you want to delete this proposal?')) return;
        try {
            const res = await fetch(`/api/proposals/${id}`, { method: 'DELETE' });
            const result = await res.json();
            if (result.message === 'success') {
                if (currentProposalId === id) {
                    newProposal();
                }
                fetchProposals();
            }
        } catch (err) {
            console.error('Failed to delete proposal:', err);
            alert('Error deleting proposal');
        }
    }

    async function saveProposal() {
        const saveBtn = document.getElementById('save-proposal');
        saveBtn.classList.add('loading');
        
        const locInputs = document.querySelectorAll('.location-name-input');
        const locations = Array.from(locInputs).map(i => i.value);

        const data = {
            locationName: locName.value,
            clientName: clientName.value,
            clientEmail: document.getElementById('client-email').value,
            clientPhone: document.getElementById('client-phone').value,
            packageType: packageType.value,
            listPrice: parseFloat(listPriceInput.value) || 0,
            agreementValue: parseFloat(agreementValue.value) || 0,
            agreementLength: parseInt(agreementLength.value) || 12,
            paymentTerms: paymentTerms.value,
            firstPaymentDate: firstPayDate.value,
            isRevised: document.getElementById('is-revised').checked,
            isMultiLocation: isMultiLoc.checked,
            locationCount: parseInt(locCount.value) || 0,
            isPromo: isPromo.checked,
            promoMonths: parseInt(promoMonths.value) || 0,
            isDiscount: isDiscount.checked,
            discountAmt: parseFloat(discountAmt.value) || 0,
            discountType: Array.from(discountTypes).find(r => r.checked)?.value || 'amount',
            isHubAndSpoke: isHubSpoke.checked,
            hubPrice: parseFloat(hubPriceInput.value) || 0,
            spokePrice: parseFloat(spokePriceInput.value) || 0,
            proposalDate: document.getElementById('proposal-date').value,
            locations: locations
        };

        try {
            const method = currentProposalId ? 'PUT' : 'POST';
            const url = currentProposalId ? `/api/proposals/${currentProposalId}` : '/api/proposals';
            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await res.json();
            if (result.message === 'success') {
                alert('Proposal saved successfully!');
                if (!currentProposalId && result.data && result.data.id) {
                    currentProposalId = result.data.id;
                }
                fetchProposals();
            }
        } catch (err) {
            console.error('Failed to save proposal:', err);
            alert('Error saving proposal');
        } finally {
            saveBtn.classList.remove('loading');
        }
    }

    async function loadProposal(id) {
        try {
            const res = await fetch(`/api/proposals/${id}`);
            const result = await res.json();
            if (result.message === 'success') {
                const p = result.data;
                currentProposalId = p.id;
                
                // Fill basic details
                locName.value = p.locationName || '';
                clientName.value = p.clientName || '';
                document.getElementById('client-email').value = p.clientEmail || '';
                document.getElementById('client-phone').value = p.clientPhone || '';
                packageType.value = p.packageType || '';
                listPriceInput.value = p.listPrice || 0;
                agreementValue.value = p.agreementValue || 0;
                agreementLength.value = p.agreementLength || 12;
                paymentTerms.value = p.paymentTerms || 'annual';
                firstPayDate.value = p.firstPaymentDate || '';
                document.getElementById('proposal-date').value = p.proposalDate || '';

                // Toggles
                const setToggle = (checkId, toggleId, expandId, val) => {
                    const c = document.getElementById(checkId);
                    const t = document.getElementById(toggleId);
                    const e = document.getElementById(expandId);
                    if (c) {
                        c.checked = !!val;
                        if (t) t.classList.toggle('checked', c.checked);
                        if (e) e.classList.toggle('open', c.checked);
                    }
                };
                
                setToggle('is-revised', 'revised-toggle', null, p.isRevised);
                setToggle('is-multi-location', 'multi-location-toggle', 'multi-location-section', p.isMultiLocation);
                setToggle('is-promo', 'promo-toggle', 'promo-section', p.isPromo);
                setToggle('is-discount', 'discount-toggle', 'discount-section', p.isDiscount);
                setToggle('is-hub-spoke', 'hub-spoke-toggle', 'hub-spoke-section', p.isHubAndSpoke);

                locCount.value = p.locationCount || 2;
                promoMonths.value = p.promoMonths || 0;
                discountAmt.value = p.discountAmt || 0;
                hubPriceInput.value = p.hubPrice || 0;
                spokePriceInput.value = p.spokePrice || 0;

                // Discount type radio
                discountTypes.forEach(r => {
                    r.checked = (r.value === p.discountType);
                });
                if (discountSym) discountSym.textContent = p.discountType === 'percentage' ? '%' : '$';

                // Regenerate location inputs if needed
                if (p.isMultiLocation) {
                    genLocInputs();
                    setTimeout(() => {
                        const inputs = document.querySelectorAll('.location-name-input');
                        if (p.locations) {
                            p.locations.forEach((name, i) => {
                                if (inputs[i]) inputs[i].value = name;
                            });
                        }
                    }, 0);
                }

                updateTOS();
                updatePreview();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } catch (err) {
            console.error('Failed to load proposal:', err);
        }
    }

    function newProposal() {
        currentProposalId = null;
        
        // Reset inputs
        locName.value = '';
        clientName.value = '';
        document.getElementById('client-email').value = '';
        document.getElementById('client-phone').value = '';
        packageType.value = '';
        listPriceInput.value = '';
        agreementValue.value = '';
        agreementLength.value = 12;
        paymentTerms.value = 'annual';
        firstPayDate.value = '';
        document.getElementById('proposal-date').value = new Date().toISOString().split('T')[0];

        // Toggles
        const setToggle = (checkId, toggleId, expandId, val) => {
            const c = document.getElementById(checkId);
            const t = document.getElementById(toggleId);
            const e = document.getElementById(expandId);
            if (c) {
                c.checked = !!val;
                if (t) t.classList.toggle('checked', c.checked);
                if (e) e.classList.toggle('open', c.checked);
            }
        };
        
        setToggle('is-revised', 'revised-toggle', null, false);
        setToggle('is-multi-location', 'multi-location-toggle', 'multi-location-section', false);
        setToggle('is-promo', 'promo-toggle', 'promo-section', false);
        setToggle('is-discount', 'discount-toggle', 'discount-section', false);
        setToggle('is-hub-spoke', 'hub-spoke-toggle', 'hub-spoke-section', false);

        locCount.value = 2;
        promoMonths.value = '';
        discountAmt.value = '';
        hubPriceInput.value = '';
        spokePriceInput.value = '';

        discountTypes[0].checked = true;
        if (discountSym) discountSym.textContent = discountTypes[0].value === 'percentage' ? '%' : '$';

        genLocInputs();
        updateTOS();
        updatePreview();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    document.getElementById('new-proposal')?.addEventListener('click', newProposal);
    document.getElementById('save-proposal')?.addEventListener('click', saveProposal);
    document.getElementById('sync-form')?.addEventListener('click', syncToForm);
    document.getElementById('send-signing')?.addEventListener('click', sendToSign);
    fetchProposals();

    // --- GOOGLE FORM CONFIGURATION ---
    // User: Replace FORM_ID with your form's ID, and the values in ENTRY_IDS with your real entry.XXXX numbers
    const GOOGLE_FORM_CONFIG = {
        FORM_ID: 'YOUR_GOOGLE_FORM_ID_HERE', 
        ENTRY_IDS: {
            locationName: 'entry.1000001',
            clientName: 'entry.1000002',
            clientEmail: 'entry.1000003',
            clientPhone: 'entry.1000004',
            packageType: 'entry.1000005',
            agreementValue: 'entry.1000006',
            paymentTerms: 'entry.1000007',
            locationCount: 'entry.1000008',
            effectivePrice: 'entry.1000009',
        }
    };

    function syncToForm() {
        if (GOOGLE_FORM_CONFIG.FORM_ID === 'YOUR_GOOGLE_FORM_ID_HERE') {
            alert('Please configure your Google Form ID and Entry IDs in src/script.js (around line 330) before syncing.');
            return;
        }

        const rawVal = isHubSpoke && isHubSpoke.checked 
            ? (parseFloat(hubPriceInput.value) || 0) + ((parseInt(locCount.value) || 1) - 1) * (parseFloat(spokePriceInput.value) || 0)
            : Math.max(0, parseFloat(agreementValue.value) || 0);
        const isPercent = isDiscount.checked && Array.from(discountTypes).find(r => r.checked)?.value === 'percentage';
        const discountVal = (isDiscount.checked ? Math.max(0, parseFloat(discountAmt.value) || 0) : 0);
        const discountDollars = isPercent ? (rawVal * (discountVal / 100)) : discountVal;
        const effectiveVal = Math.max(0, rawVal - discountDollars);

        const params = new URLSearchParams([['usp', 'pp_url']]);
        
        const map = {
            [GOOGLE_FORM_CONFIG.ENTRY_IDS.locationName]: locName.value,
            [GOOGLE_FORM_CONFIG.ENTRY_IDS.clientName]: clientName.value,
            [GOOGLE_FORM_CONFIG.ENTRY_IDS.clientEmail]: document.getElementById('client-email').value,
            [GOOGLE_FORM_CONFIG.ENTRY_IDS.clientPhone]: document.getElementById('client-phone').value,
            [GOOGLE_FORM_CONFIG.ENTRY_IDS.packageType]: packageType.value,
            [GOOGLE_FORM_CONFIG.ENTRY_IDS.agreementValue]: parseFloat(agreementValue.value) || 0,
            [GOOGLE_FORM_CONFIG.ENTRY_IDS.paymentTerms]: paymentTerms.value,
            [GOOGLE_FORM_CONFIG.ENTRY_IDS.locationCount]: parseInt(locCount.value) || 1,
            [GOOGLE_FORM_CONFIG.ENTRY_IDS.effectivePrice]: effectiveVal.toFixed(2),
        };

        for (const [key, val] of Object.entries(map)) {
            if (val !== undefined && val !== '') {
                params.append(key, val);
            }
        }

        const url = `https://docs.google.com/forms/d/e/${GOOGLE_FORM_CONFIG.FORM_ID}/viewform?${params.toString()}`;
        window.open(url, '_blank');
    }

    async function sendToSign() {
        const signBtn = document.getElementById('send-signing');
        signBtn.classList.add('loading');
        try {
            // Re-use logic to generate PDF as blob
            const doc = await generatePDFBlob(); 
            const blob = doc.output('blob');
            
            const formData = new FormData();
            formData.append('file', blob, 'proposal.pdf');
            formData.append('clientName', clientName.value);
            formData.append('clientEmail', document.getElementById('client-email').value);
            formData.append('title', `${locName.value || 'BevSpot'} Proposal`);

            const res = await fetch('/api/sign', {
                method: 'POST',
                body: formData
            });
            const result = await res.json();
            if (result.message === 'success' && result.data.unclaimed_draft?.claim_url) {
                alert('Draft created! Opening your Dropbox Sign dashboard to finalize...');
                window.open(result.data.unclaimed_draft.claim_url, '_blank');
            } else if (result.message === 'success') {
                alert('Signature request/draft created successfully!');
            } else {
                alert('Error: ' + (result.error || 'Unknown error'));
            }
        } catch (err) {
            console.error('Failed to send for signature:', err);
            alert('Error sending for signature');
        } finally {
            signBtn.classList.remove('loading');
        }
    }

    async function generatePDFDoc() {
        // Ensure bsLogoDataURL is converted to base64 if Vite emitted it as a URL path
        let b64Logo = bsLogoDataURL;
        if (b64Logo && !b64Logo.startsWith('data:')) {
            try {
                const response = await fetch(b64Logo);
                const blob = await response.blob();
                b64Logo = await new Promise((res, rej) => {
                    const reader = new FileReader();
                    reader.onload = () => res(reader.result);
                    reader.onerror = rej;
                    reader.readAsDataURL(blob);
                });
            } catch (err) {
                console.warn('Failed to fetch the logo for PDF:', err);
                b64Logo = null;
            }
        }

        const doc = new jsPDF('p','pt','a4');
        const margin = 40, pw = doc.internal.pageSize.getWidth(), cw = pw - margin*2;
        const orange = [242,107,58], gray = [248,249,250];
        let y = margin;

        if (clientLogoData) {
            if (b64Logo) doc.addImage(b64Logo, 'PNG', margin, margin, 150, 48);
            doc.addImage(clientLogoData, 'PNG', margin + 180, margin, 150, 48);
        } else {
            if (b64Logo) doc.addImage(b64Logo, 'PNG', margin, margin, 150, 48);
        }
        y += 70;

        doc.setFontSize(22); doc.setFont('helvetica','bold'); doc.text('BevSpot Proposal',margin,y); y += 30;
        doc.setFontSize(12); doc.setFont('helvetica','normal');
        doc.text(`Date: ${fmtDate(document.getElementById('proposal-date').value)}`,margin,y); y+=20;
        doc.text(`Location: ${locName.value||'[Location Name]'}`,margin,y); y+=20;
        doc.text(`Prepared for: ${clientName.value||'[Client Name]'}`,margin,y); y+=40;

        doc.setFillColor(orange[0], orange[1], orange[2]); doc.roundedRect(margin,y,cw,30,5,5,'F');
        doc.setFontSize(16); doc.setFont('helvetica','bold'); doc.setTextColor(255,255,255);
        doc.text('Agreement Details',margin+10,y+20); doc.setTextColor(0,0,0); y+=45;
        doc.setFontSize(12); doc.setFont('helvetica','normal');

        // Calculate effective price for PDF
        const rawVal = isHubSpoke && isHubSpoke.checked 
            ? (parseFloat(hubPriceInput.value) || 0) + ((parseInt(locCount.value) || 1) - 1) * (parseFloat(spokePriceInput.value) || 0)
            : Math.max(0, parseFloat(agreementValue.value) || 0);
        const isPercent = isDiscount.checked && Array.from(discountTypes).find(r => r.checked)?.value === 'percentage';
        const discountVal = (isDiscount.checked ? Math.max(0, parseFloat(discountAmt.value) || 0) : 0);
        const discountDollars = isPercent ? (rawVal * (discountVal / 100)) : discountVal;
        const effectiveVal = Math.max(0, rawVal - discountDollars);

        const details = [
            ['Package:', packageType.value||'—'],
            ['List Price:', fmt$(listPriceInput.value)],
            [`Your Annual Price${isDiscount.checked ? ' (Discount Applied)' : ''}:`, fmt$(effectiveVal)],
            ['Subscription Length:', `${agreementLength.value} Months`],
            ['Payment Terms:', paymentTerms.options[paymentTerms.selectedIndex].text]
        ];
        if (isHubSpoke && isHubSpoke.checked) {
            details.splice(details.findIndex(d => d[0].includes('Your Annual Price')), 0, 
                ['Hub Price:', fmt$(hubPriceInput.value)],
                ['Spoke Price:', fmt$(spokePriceInput.value)]
            );
        }
        if (isDiscount.checked) {
            const isPercentRadio = Array.from(discountTypes).find(r => r.checked)?.value === 'percentage';
            const disp = isPercentRadio ? `${discountAmt.value}%` : fmt$(discountAmt.value);
            details.push(['Discount:', disp]);
        }
        if (isPromo.checked) details.push(['Special Offer:', `Get ${promoMonths.value} months for the price of ${agreementLength.value}`]);
        details.forEach(d => { 
            doc.setFont('helvetica','bold'); 
            doc.text(d[0],margin,y); 
            doc.setFont('helvetica','normal'); 
            doc.text(d[1],margin+220,y); 
            y+=20; 
        });

        if (isMultiLoc.checked) {
            y += 10;
            const locInputs = document.querySelectorAll('.location-name-input');
            const locsData = [];
            locInputs.forEach(i => locsData.push([i.value || 'N/A']));
            
            autoTable(doc, {
                startY: y,
                head: [['Included Locations']],
                body: locsData,
                theme: 'grid',
                headStyles: { fillColor: orange, textColor: [255, 255, 255] },
                margin: { left: margin, right: margin }
            });
            
            y = doc.lastAutoTable.finalY + 20;
        } else {
            y += 20;
        }

        doc.setFontSize(16); doc.setFont('helvetica','bold'); doc.text('Terms of Service',pw/2,y,{align:'center'}); y+=25;

        // Render TOS as native PDF text
        const tosNode = document.getElementById('tos-preview-box');
        doc.setFontSize(10.5); doc.setFont('helvetica','normal'); doc.setTextColor(30,30,30);
        const pageH = doc.internal.pageSize.getHeight();
        function addPageIfNeeded(lineH) {
            if (y + lineH > pageH - margin) { doc.addPage(); y = margin; }
        }
        
        const nodes = tosNode.childNodes;
        nodes.forEach(node => {
            if (node.nodeName === 'P') {
                const segments = [];
                node.childNodes.forEach(child => {
                    if (child.nodeName === 'STRONG') {
                        segments.push({ text: child.textContent, bold: true });
                    } else if (child.nodeName === 'A') {
                        segments.push({ text: child.textContent, link: child.href });
                    } else {
                        segments.push({ text: child.textContent, bold: false });
                    }
                });

                let curX = margin;
                addPageIfNeeded(14);
                
                segments.forEach(seg => {
                    doc.setFont('helvetica', seg.bold ? 'bold' : 'normal');
                    if (seg.link) doc.setTextColor(14, 100, 200);
                    else doc.setTextColor(30, 30, 30);

                    const words = seg.text.split(' ');
                    words.forEach((word, idx) => {
                        const wordPlusSpace = word + (idx < words.length - 1 ? ' ' : '');
                        const wordW = doc.getTextWidth(wordPlusSpace);
                        if (curX + wordW > margin + cw) {
                            y += 14;
                            addPageIfNeeded(14);
                            curX = margin;
                        }
                        doc.text(wordPlusSpace, curX, y);
                        if (seg.link) {
                            doc.link(curX, y - 9, doc.getTextWidth(word), 12, { url: seg.link });
                        }
                        curX += wordW;
                    });
                });
                y += 18; // paragraph gap
            } else if (node.nodeName === 'UL') {
                node.querySelectorAll('li').forEach(li => {
                    const liText = '• ' + li.textContent;
                    const lines = doc.splitTextToSize(liText, cw - 10);
                    lines.forEach(line => {
                        addPageIfNeeded(14);
                        doc.text(line, margin + 10, y);
                        y += 14;
                    });
                });
                y += 4;
            }
        });
        
        y += 10;
        addPageIfNeeded(130);
        doc.setFillColor(gray[0], gray[1], gray[2]); doc.roundedRect(margin,y,cw,120,5,5,'F');
        let ay = y+15; const am = margin+10;
        doc.setFontSize(12); doc.setFont('helvetica','normal'); doc.setTextColor(0,0,0);
        doc.text('Customer hereby accepts the terms and conditions outlined here and orders from',am,ay); ay+=15;
        doc.text('BevSpot the Services described in this Order Form.',am,ay); ay+=40;
        doc.text('Customer Signature:',am,ay); doc.line(am+110,ay,am+310,ay); ay+=20;
        doc.text('Printed Name:',am,ay); doc.line(am+110,ay,am+310,ay); ay+=20;
        doc.text('Date:',am,ay); doc.line(am+110,ay,am+310,ay);
        
        return doc;
    }

    // PDF Button listener
    genBtn.addEventListener('click', async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        genBtn.classList.add('loading');
        try {
            const doc = await generatePDFDoc();
            const rev = isRevised && isRevised.checked ? '-(Revised)' : '';
            const filename = `${locName.value || 'BevSpot'}-Proposal${rev}.pdf`;
            doc.save(filename);
        } catch (outerErr) {
            console.error('PDF generation error:', outerErr);
        } finally {
            genBtn.classList.remove('loading');
        }
    });

    async function generatePDFBlob() {
        return await generatePDFDoc();
    }

    clientLogoUp.addEventListener('change', e => {
        const f = e.target.files[0];
        if (f) { const r = new FileReader(); r.onload = ev => { clientLogoData = ev.target.result; document.getElementById('upload-label-text').textContent = f.name; }; r.readAsDataURL(f); }
    });

    // Set today
    document.getElementById('proposal-date').value = new Date().toISOString().split('T')[0];

    // Scroll nav
    const sectionIds = ['section-company','section-client','section-agreement','section-terms'];
    window.scrollToSection = id => document.getElementById(id)?.scrollIntoView({behavior:'smooth',block:'start'});
    const sectionMap = {'section-company':0,'section-client':1,'section-agreement':2,'section-terms':3};

    // Wire sidebar nav-step clicks
    document.querySelectorAll('.nav-step').forEach((s, i) => {
        if (sectionIds[i]) {
            s.style.cursor = 'pointer';
            s.addEventListener('click', () => window.scrollToSection(sectionIds[i]));
        }
    });

    const observer = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                const idx = sectionMap[e.target.id];
                if (idx !== undefined) document.querySelectorAll('.nav-step').forEach((s, i) => s.classList.toggle('active', i === idx));
            }
        });
    }, {threshold: 0.3});
    Object.keys(sectionMap).forEach(id => { const el = document.getElementById(id); if (el) observer.observe(el); });

    // Defer initial update so React's defaultValue is reconciled in the DOM
    setTimeout(() => { updateTOS(); updatePreview(); }, 0);
    genLocInputs();

    // Return cleanup so React can tear down listeners on unmount/HMR
    return () => {
        delete window.__bevspot_initialized;
    };
}
