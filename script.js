document.addEventListener('DOMContentLoaded', () => {
    // Initialize date pickers
    flatpickr("#campaign-start", {
        dateFormat: "d-M-Y"
    });
    flatpickr("#campaign-end", {
        dateFormat: "d-M-Y"
    });

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
        for(let i=0; i<=6; i++) {
            const span = document.createElement('span');
            span.innerText = `${i * step} people`;
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
            <div>Month #${data.month}</div>
            <div>Prospects: ${data.prospects}</div>
            <div>Leads: ${data.leads}</div>
            <div>Customers: ${data.customers}</div>
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