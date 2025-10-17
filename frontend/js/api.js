/**
 * AI Prosthetic Optimizer - API Module
 * Handles all backend API calls
 */

/**
 * Run full optimization with user parameters
 */
async function runOptimization() {
    const load = parseFloat(document.getElementById('load-input').value);
    const material = document.getElementById('material-select').value;
    const popSize = parseInt(document.getElementById('pop-size').value);
    const generations = parseInt(document.getElementById('generations').value);

    console.log('Starting optimization:', { load, material, popSize, generations });

    // Show loading state
    document.getElementById('loading-state').classList.remove('hidden');
    document.getElementById('optimize-btn').disabled = true;
    document.getElementById('demo-btn').disabled = true;

    try {
        const response = await fetch(`${API_BASE_URL}/api/optimize`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                load: load,
                material: material,
                pop_size: popSize,
                n_gen: generations
            })
        });

        const data = await response.json();

        if (data.success) {
            console.log('✅ Optimization complete:', data.results);
            currentResults = data.results;

            // Calculate stats for toast
            const totalDesigns = popSize * generations;
            const paretoCount = data.results.pareto_front ? data.results.pareto_front.length : 0;

            // Show success toast
            showToast(
                `✅ Optimization complete — ${totalDesigns.toLocaleString()} designs explored, ${paretoCount} champions found.`,
                'success',
                6000
            );

            displayResults(data.results);
            displayMentorInsights(data.results);
        } else {
            showToast('Optimization failed: ' + data.error, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Failed to connect to API. Make sure Flask server is running on port 5000.', 'error');
    } finally {
        // Hide loading state
        document.getElementById('loading-state').classList.add('hidden');
        document.getElementById('optimize-btn').disabled = false;
        document.getElementById('demo-btn').disabled = false;
    }
}

/**
 * Load pre-computed demo results (fast)
 */
async function loadDemo() {
    console.log('Loading demo results...');

    document.getElementById('loading-state').classList.remove('hidden');
    document.getElementById('demo-btn').disabled = true;

    try {
        const response = await fetch(`${API_BASE_URL}/api/demo`);
        const data = await response.json();

        if (data.success) {
            console.log('✅ Demo loaded:', data.results);
            currentResults = data.results;

            // Show info toast for demo
            showToast('⚡ Demo results loaded instantly! Run optimization for custom designs.', 'info', 5000);

            displayResults(data.results);

            // Display mentor insights if available
            if (data.results.mentor_log || data.results.mentor_summary) {
                displayMentorInsights(data.results);
            }

            if (data.cached) {
                console.log('📦 Results were cached');
            }
        } else {
            showToast('Failed to load demo: ' + data.error, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Failed to connect to API. Make sure Flask server is running.', 'error');
    } finally {
        document.getElementById('loading-state').classList.add('hidden');
        document.getElementById('demo-btn').disabled = false;
    }
}

/**
 * Download manufacturing package for selected design
 */
async function downloadManufacturingPack(evt, designId) {
    if (designId === null || designId === undefined) {
        showToast('Please select a design first by clicking on a point in the Pareto chart.', 'info');
        return;
    }

    console.log(`📦 Downloading manufacturing pack for design ${designId}...`);

    try {
        // Show loading indicator
        const button = evt?.currentTarget || evt?.target;
        const originalText = button ? button.innerHTML : null;
        if (button) {
            button.innerHTML = '⏳ Preparing download...';
            button.disabled = true;
        }

        // Fetch the ZIP file
        const response = await fetch(`${API_BASE_URL}/api/download/${designId}`);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Download failed');
        }

        // Get the blob
        const blob = await response.blob();

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bracket_manufacturing_pack_${designId}.zip`;
        document.body.appendChild(a);
        a.click();

        // Cleanup
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        console.log('✅ Manufacturing pack downloaded successfully');

        // Reset button
        if (button) {
            button.innerHTML = originalText ?? '📦 Download Manufacturing Pack';
            button.disabled = false;
        }

        // Show success toast with engineering insight
        showToast(
            '📦 Manufacturing pack downloaded! Every gram saved reduces both cost and carbon — well engineered!',
            'success',
            6000
        );

    } catch (error) {
        console.error('Error downloading manufacturing pack:', error);
        showToast(`Failed to download manufacturing pack: ${error.message}`, 'error');

        // Reset button on error
        if (evt && evt.target) {
            evt.target.innerHTML = '📦 Download Manufacturing Pack';
            evt.target.disabled = false;
        }
    }
}

/**
 * Get material recommendation from AI advisor
 */
async function getMaterialAdvice() {
    const load = parseFloat(document.getElementById('advisor-load').value);
    const environment = document.getElementById('advisor-environment').value;
    const budget = document.getElementById('advisor-budget').value;

    console.log('Getting material advice:', { load, environment, budget });

    // Show loading
    document.getElementById('advisor-loading').classList.remove('hidden');
    document.getElementById('advisor-results').classList.add('hidden');

    try {
        const response = await fetch(`${API_BASE_URL}/api/material-advice`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                load: load,
                environment: environment,
                budget: budget
            })
        });

        const data = await response.json();

        if (data.success) {
            console.log('✅ Material recommendation received:', data.recommendation);
            currentRecommendation = data.recommendation;
            displayMaterialRecommendation(data.recommendation);
        } else {
            showToast('Failed to get recommendation: ' + data.error, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Failed to connect to material advisor API.', 'error');
    } finally {
        document.getElementById('advisor-loading').classList.add('hidden');
    }
}

// Expose API functions for inline handlers
window.runOptimization = runOptimization;
window.loadDemo = loadDemo;
window.downloadManufacturingPack = downloadManufacturingPack;
window.getMaterialAdvice = getMaterialAdvice;
