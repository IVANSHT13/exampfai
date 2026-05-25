document.addEventListener('DOMContentLoaded', () => {
    // Initialize date pickers
    flatpickr("#campaign-start", {
        dateFormat: "d-M-Y"
    });
    flatpickr("#campaign-end", {
        dateFormat: "d-M-Y"
    });

    // Translations dictionary
    const translations = {
        en: {
            language: "Language",
            currency: "Currency",
            campaign_start: "Campaign Start",
            campaign_end: "Campaign End",
            total_revenue: "Total Revenue",
            avg_order_value: "Avg. Order Value",
            months: "Months",
            prospects: "Prospects",
            leads: "Leads",
            customers: "Customers",
            lead_response_rate: "Lead Response Rate",
            prospect_response_rate: "Prospect Response Rate",
            people: "people",
            month: "Month"
        },
        bg: {
            language: "Език",
            currency: "Валута",
            campaign_start: "Начало на кампания",
            campaign_end: "Край на кампания",
            total_revenue: "Общ приход",
            avg_order_value: "Средна стойност поръчка",
            months: "Месеци",
            prospects: "Контакти",
            leads: "Потенциални клиенти",
            customers: "Клиенти",
            lead_response_rate: "Процент отговори (потенциални)",
            prospect_response_rate: "Процент отговори (контакти)",
            people: "души",
            month: "Месец"
        }
    };

    let currentLang = 'en';

    function setLanguage(lang) {
        currentLang = lang;
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (translations[lang][key]) {
                el.innerText = translations[lang][key];
            }
        });
        updateCalculations(); // Re-render text on chart
    }

    const languageSelect = document.getElementById('language-select');
    if (languageSelect) {
        languageSelect.addEventListener('change', (e) => {
            setLanguage(e.target.value);
        });
    }

    const totalRevenueInput = document.getElementById('total-revenue');
    const avgOrderValueInput = document.getElementById('avg-order-value');
    
    const leadResponseSlider = document.getElementById('lead-response');
    const prospectResponseSlider = document.getElementById('prospect-response');
    
    const valProspects = document.getElementById('val-prospects');
    const valLeads = document.getElementById('val-leads');
    const valCustomers = document.getElementById('val-customers');
    const valCustomerRate = document.getElementById('val-customer-rate');
    const barCustomers = document.getElementById('bar-customers');
    
    const valLeadResponseText = document.getElementById('val-lead-response');
    const valProspectResponseText = document.getElementById('val-prospect-response');
    
    const leadHighlight = document.getElementById('lead-highlight');
    const prospectHighlight = document.getElementById('prospect-highlight');

    const chartArea = document.getElementById('chart-area');
    const xAxisLabels = document.getElementById('x-axis-labels');

    let tooltip = null;

    function formatNumber(num) {
        return Math.floor(num).toString();
    }

    function updateCalculations() {
        const revenue = parseFloat(totalRevenueInput.value) || 0;
        const aov = parseFloat(avgOrderValueInput.value) || 1;
        
        const leadResponseRate = parseFloat(leadResponseSlider.value);
        const prospectResponseRate = parseFloat(prospectResponseSlider.value);

        // Visual updates for sliders
        valLeadResponseText.innerText = `${leadResponseSlider.value}.00%`;
        valProspectResponseText.innerText = `${prospectResponseSlider.value}.00%`;
        leadHighlight.style.width = `${leadResponseSlider.value}%`;
        prospectHighlight.style.width = `${prospectResponseSlider.value}%`;

        // Calculations
        const customers = Math.round(revenue / aov);
        const leads = Math.round(customers * 100 / (leadResponseRate || 1)); 
        const prospects = Math.round(leads * 100 / (prospectResponseRate || 1));

        // Update Text
        valProspects.innerText = formatNumber(prospects);
        valLeads.innerText = formatNumber(leads);
        valCustomers.innerText = formatNumber(customers);
        
        const customerRate = prospects > 0 ? (customers / prospects) * 100 : 0;
        valCustomerRate.innerText = `${Math.round(customerRate)}%`;
        barCustomers.style.width = `${Math.round(customerRate)}%`;

        renderChart(prospects, leads, customers);
    }

    function renderChart(totalProspects, totalLeads, totalCustomers) {
        // Clear previous rows (except grid-lines)
        const gridLines = chartArea.querySelector('.grid-lines');
        chartArea.innerHTML = '';
        chartArea.appendChild(gridLines);

        // Calculate max value for X-axis dynamically
        let maxX = totalProspects > 0 ? totalProspects : 100;
        // round to nearest nice number
        const step = Math.ceil(maxX / 6 / 10) * 10 || 20;
        maxX = step * 6;

        // Render X Axis
        xAxisLabels.innerHTML = '';
        const peopleText = translations[currentLang].people;
        for(let i=0; i<=6; i++) {
            const span = document.createElement('span');
            span.innerText = `${i * step} ${peopleText}`;
            xAxisLabels.appendChild(span);
        }

        // Generate 6 months of data (linear cumulative for demo)
        const monthsData = [];
        for(let i=1; i<=6; i++) {
            const factor = i / 6;
            // Introduce a slight curve to match typical charts
            const dataFactor = Math.pow(factor, 0.8); 
            
            monthsData.push({
                month: i,
                prospects: Math.round(totalProspects * dataFactor),
                leads: Math.round(totalLeads * dataFactor),
                customers: Math.round(totalCustomers * dataFactor)
            });
        }

        // Render Bars
        monthsData.forEach(data => {
            const row = document.createElement('div');
            row.className = 'chart-row';
            
            const pWidth = (data.prospects / maxX) * 100;
            const lWidth = (data.leads / maxX) * 100;
            const cWidth = (data.customers / maxX) * 100;

            row.innerHTML = `
                <div class="bar bar-prospects" style="width: ${pWidth}%"></div>
                <div class="bar bar-leads" style="width: ${lWidth}%"></div>
                <div class="bar bar-customers" style="width: ${cWidth}%"></div>
            `;
            
            row.addEventListener('mouseenter', (e) => showTooltip(e, data));
            row.addEventListener('mouseleave', hideTooltip);
            row.addEventListener('mousemove', moveTooltip);

            chartArea.appendChild(row);
        });
    }

    function showTooltip(e, data) {
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.className = 'chart-tooltip';
            document.body.appendChild(tooltip);
        }
        tooltip.innerHTML = `
            <div>${translations[currentLang].month} #${data.month}</div>
            <div>${translations[currentLang].prospects}: ${data.prospects}</div>
            <div>${translations[currentLang].leads}: ${data.leads}</div>
            <div>${translations[currentLang].customers}: ${data.customers}</div>
        `;
        tooltip.style.display = 'block';
        moveTooltip(e);
    }

    function moveTooltip(e) {
        if (tooltip) {
            tooltip.style.left = e.pageX + 15 + 'px';
            tooltip.style.top = e.pageY - 15 + 'px';
        }
    }

    function hideTooltip() {
        if (tooltip) {
            tooltip.style.display = 'none';
        }
    }

    // Event Listeners
    [totalRevenueInput, avgOrderValueInput, leadResponseSlider, prospectResponseSlider].forEach(el => {
        el.addEventListener('input', updateCalculations);
    });

    // Initial render
    updateCalculations();
});