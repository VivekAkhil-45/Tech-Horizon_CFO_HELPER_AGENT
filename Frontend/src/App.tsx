import React, { useState } from 'react';

// --- TypeScript Interfaces ---
// These match the Pydantic models in your FastAPI backend
interface ScenarioParameters {
    initial_budget: number;
    time_horizon: number;
    sales_volume: number;
    avg_price_per_unit: number;
    staff_count: number;
    average_salary: number;
    marketing_spend: number;
    operational_expenses: number;
    pricing_adjustment: number;
}

interface ResultData {
    monthly_net_flow: number;
    runway_months: number | null;
    projected_balance_after_horizon: number;
}

interface APIResult {
    summary: string;
    data: ResultData;
    scenario_count: number;
}

interface ReportResult {
    message: string;
    short_summary: string;
    report_count: number;
}

// --- Helper Components & Icons ---

const SaveIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>;
const ShareIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>;
const ReportIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>;

const Header: React.FC = () => (
    <header className="py-6 mb-8 text-center border-b border-gray-700">
        <h1 className="text-4xl font-bold text-gray-100">CFO Helper</h1>
        <p className="text-lg text-gray-400 mt-1">AI-Powered Budget Scenario Simulator</p>
    </header>
);

// --- Main Application Component ---

const App: React.FC = () => {
    const API_BASE_URL = "http://127.0.0.1:8000";

    // State to hold the user's inputs from the form
    const [params, setParams] = useState<ScenarioParameters>({
        initial_budget: 0, time_horizon: 0, sales_volume: 0,
        avg_price_per_unit: 0, staff_count: 0, average_salary: 0,
        marketing_spend: 0, operational_expenses: 0, pricing_adjustment: 0
    });

    // State to hold the results from the backend
    const [result, setResult] = useState<APIResult | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    // Handler for form input changes
    const handleParamChange = (key: keyof ScenarioParameters, value: number) => {
        setParams(prev => ({ ...prev, [key]: value }));
    };
    
    // Function to call the /stimulate endpoint
    const handleRunSimulation = async () => {
        setLoading(true);
        setResult(null); // Clear previous results
        try {
            const response = await fetch(`${API_BASE_URL}/stimulate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(params)
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data: APIResult = await response.json();
            setResult(data);
        } catch (error) {
            console.error("Error running simulation:", error);
            alert("Failed to get a simulation result. Please check the console for details.");
        } finally {
            setLoading(false);
        }
    };
    
    // Function to call the /export-report endpoint
    const handleExportReport = async () => {
        if (!result) {
            alert("Please run a simulation first to generate a report.");
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/export-report`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(params)
            });
             if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const reportData: ReportResult = await response.json();
            alert(`Report Generated!\n\nHeadline: ${reportData.short_summary}\n\n(Total reports generated: ${reportData.report_count})`);
        } catch (error) {
             console.error("Error exporting report:", error);
            alert("Failed to export the report. Please check the console for details.");
        }
    };

    const handleReset = () => {
        // Resets the form to its initial blank state
        setParams({
            initial_budget: 0, time_horizon: 0, sales_volume: 0,
            avg_price_per_unit: 0, staff_count: 0, average_salary: 0,
            marketing_spend: 0, operational_expenses: 0, pricing_adjustment: 0
        });
        setResult(null);
    };

    const renderSummary = (summaryText: string | undefined): React.ReactNode => {
        if (!summaryText) return null;
        return summaryText.split('\n\n').map((paragraph, index) => (
            <div key={index} className="mb-4">
                {paragraph.split('\n').map((line, lineIndex) => {
                     if (line.startsWith('**') && line.endsWith('**')) {
                        return <h4 key={lineIndex} className="font-semibold text-gray-200 mb-2">{line.replaceAll('**', '')}</h4>
                     }
                     return <p key={lineIndex} className="text-sm text-gray-300">{line}</p>
                })}
            </div>
        ));
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-300 font-sans p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <Header />
                <main className="flex flex-col gap-8">
                    {/* --- CONTROL PANEL --- */}
                    <div className="bg-gray-800 rounded-lg border border-gray-700 p-5">
                        <h3 className="text-lg font-semibold text-gray-200 mb-4">Scenario Parameters</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {(Object.keys(params) as Array<keyof ScenarioParameters>).map(key => (
                                <div key={key}>
                                    <label className="text-sm text-gray-400 capitalize block mb-1">{key.replace(/_/g, ' ')}</label>
                                    <input
                                        type="number"
                                        value={params[key]}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleParamChange(key, parseFloat(e.target.value) || 0)}
                                        className="w-full bg-gray-700 text-white rounded-md p-2 border border-gray-600 focus:ring-2 focus:ring-teal-400 focus:outline-none"
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 flex flex-wrap gap-4">
                            <button onClick={handleRunSimulation} disabled={loading} className="bg-teal-500 text-white font-semibold px-6 py-2 rounded-md hover:bg-teal-600 transition-colors disabled:bg-gray-500">
                                {loading ? 'Simulating...' : 'Run Simulation'}
                            </button>
                             <button onClick={handleReset} className="bg-gray-600 text-white font-semibold px-6 py-2 rounded-md hover:bg-gray-700 transition-colors">
                                Reset
                            </button>
                        </div>
                    </div>

                    {/* --- RESULTS SECTION --- */}
                    <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-1 bg-gray-800 rounded-lg border border-gray-700 p-5">
                            <h3 className="text-lg font-semibold text-gray-200 mb-4">Key Metrics</h3>
                            {result ? (
                                <div className="space-y-3">
                                    <p><strong>Monthly Net Flow:</strong> {result.data.monthly_net_flow.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</p>
                                    <p><strong>Runway:</strong> {result.data.runway_months?.toFixed(1) || 'N/A'} months</p>
                                    <p><strong>Projected Balance:</strong> {result.data.projected_balance_after_horizon.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</p>
                                    <p className="pt-2 text-teal-400">Scenarios Tested: {result.scenario_count}</p>
                                </div>
                            ) : (
                                <p className="text-gray-400">{loading ? 'Calculating...' : 'Enter your data and run a simulation to see key metrics.'}</p>
                            )}
                        </div>
                        <div className="lg:col-span-2 bg-gray-800 rounded-lg border border-gray-700 p-5">
                            <h3 className="text-lg font-semibold text-gray-200 mb-4">AI Scenario Analysis</h3>
                             {loading && <p className="text-gray-400">🧠 Generating AI analysis...</p>}
                            {result && !loading && <div>{renderSummary(result.summary)}</div>}
                            {!result && !loading && <p className="text-gray-400">Results from your AI-powered analysis will appear here.</p>}
                        </div>
                    </section>
                    
                    {/* --- EXPORT SECTION --- */}
                    <div className="bg-gray-800 rounded-lg border border-gray-700 p-5">
                         <h3 className="text-lg font-semibold text-gray-200 mb-4">Export & Share</h3>
                         <div className="flex flex-wrap gap-4">
                             <button onClick={handleExportReport} className="flex items-center gap-2 bg-gray-700 text-gray-300 px-5 py-2 rounded-md hover:bg-gray-600 transition-colors">
                                <ReportIcon /> Generate Report
                            </button>
                            <button onClick={() => alert('Share functionality to be implemented!')} className="flex items-center gap-2 bg-gray-700 text-gray-300 px-5 py-2 rounded-md hover:bg-gray-600 transition-colors">
                                <ShareIcon /> Share Scenario
                            </button>
                            <button onClick={() => alert('Save functionality to be implemented!')} className="flex items-center gap-2 bg-gray-700 text-gray-300 px-5 py-2 rounded-md hover:bg-gray-600 transition-colors">
                                <SaveIcon /> Save Scenario
                            </button>
                         </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default App;

