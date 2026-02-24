/**
 * Admin Dashboard UI Component
 * eBay-like admin panel for managing reports, users, and moderation
 */

import { authManager } from '../systems/AuthManager';

export interface AdminReport {
    id: string;
    reporterId: string;
    reportedUserId?: string;
    reportedListingId?: string;
    reason: string;
    details: string;
    status: 'pending' | 'reviewed' | 'resolved';
    createdAt: string;
}

export class AdminDashboardUI {
    private container: HTMLElement;
    private reports: AdminReport[] = [];
    
    constructor(containerId: string) {
        const container = document.getElementById(containerId);
        if (!container) {
            throw new Error(`Container ${containerId} not found`);
        }
        this.container = container;
    }
    
    /**
     * Check if current user is admin
     */
    async checkAdminAccess(): Promise<boolean> {
        const user = authManager.getCurrentUser();
        if (!user) return false;
        
        // Check admin role (would be in user metadata)
        // For now, check via API
        try {
            const response = await fetch('/.netlify/functions/api-get-user', {
                headers: {
                    'Authorization': `Bearer ${authManager.getToken()}`,
                },
            });
            const data = await response.json();
            return data.role === 'admin';
        } catch {
            return false;
        }
    }
    
    /**
     * Show admin dashboard
     */
    async show(): Promise<void> {
        const isAdmin = await this.checkAdminAccess();
        if (!isAdmin) {
            this.container.innerHTML = `
                <div class="admin-dashboard">
                    <div class="error-message">
                        <h2>🔒 Access Denied</h2>
                        <p>You must be an administrator to access this dashboard.</p>
                        <button class="btn-primary" onclick="window.adminDashboardUI.hide()">Go Back</button>
                    </div>
                </div>
            `;
            this.container.style.display = 'block';
            (window as any).adminDashboardUI = this;
            return;
        }
        
        await this.loadReports();
        this.render();
    }
    
    /**
     * Load reports from API
     */
    private async loadReports(): Promise<void> {
        try {
            const response = await fetch('/.netlify/functions/api-admin-get-reports', {
                headers: {
                    'Authorization': `Bearer ${authManager.getToken()}`,
                },
            });
            
            if (response.ok) {
                const data = await response.json();
                this.reports = data.reports || [];
            }
        } catch (error) {
            console.error('Error loading reports:', error);
            this.reports = [];
        }
    }
    
    /**
     * Render dashboard
     */
    private render(): void {
        const pendingReports = this.reports.filter(r => r.status === 'pending');
        const reviewedReports = this.reports.filter(r => r.status === 'reviewed');
        const resolvedReports = this.reports.filter(r => r.status === 'resolved');
        
        this.container.style.display = 'block';
        this.container.innerHTML = `
            <div class="admin-dashboard">
                <div class="admin-header">
                    <h1>🛡️ Admin Dashboard</h1>
                    <p class="subtitle">Moderation & Management Hub</p>
                    <button class="btn-secondary" onclick="window.adminDashboardUI.hide()">← Back</button>
                </div>
                
                <div class="admin-stats">
                    <div class="stat-card">
                        <div class="stat-icon">⚠️</div>
                        <div class="stat-value">${pendingReports.length}</div>
                        <div class="stat-label">Pending Reports</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">👀</div>
                        <div class="stat-value">${reviewedReports.length}</div>
                        <div class="stat-label">Under Review</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">✅</div>
                        <div class="stat-value">${resolvedReports.length}</div>
                        <div class="stat-label">Resolved</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">📊</div>
                        <div class="stat-value">${this.reports.length}</div>
                        <div class="stat-label">Total Reports</div>
                    </div>
                </div>
                
                <div class="admin-tabs">
                    <button class="tab-btn active" onclick="window.adminDashboardUI.showTab('pending')">
                        Pending (${pendingReports.length})
                    </button>
                    <button class="tab-btn" onclick="window.adminDashboardUI.showTab('reviewed')">
                        Under Review (${reviewedReports.length})
                    </button>
                    <button class="tab-btn" onclick="window.adminDashboardUI.showTab('resolved')">
                        Resolved (${resolvedReports.length})
                    </button>
                    <button class="tab-btn" onclick="window.adminDashboardUI.showTab('all')">
                        All Reports
                    </button>
                </div>
                
                <div id="admin-reports-content" class="admin-reports-list">
                    ${this.renderReports(pendingReports)}
                </div>
            </div>
        `;
        
        (window as any).adminDashboardUI = this;
        this.injectStyles();
    }
    
    /**
     * Render reports list
     */
    private renderReports(reports: AdminReport[]): string {
        if (reports.length === 0) {
            return '<p class="empty-state">No reports in this category.</p>';
        }
        
        return reports.map(report => `
            <div class="report-card" data-report-id="${report.id}">
                <div class="report-header">
                    <div class="report-id">Report #${report.id.slice(-8)}</div>
                    <div class="report-status ${report.status}">${report.status}</div>
                </div>
                <div class="report-body">
                    <div class="report-field">
                        <strong>Reason:</strong> ${report.reason}
                    </div>
                    <div class="report-field">
                        <strong>Details:</strong> ${report.details}
                    </div>
                    ${report.reportedUserId ? `
                        <div class="report-field">
                            <strong>Reported User:</strong> ${report.reportedUserId}
                        </div>
                    ` : ''}
                    ${report.reportedListingId ? `
                        <div class="report-field">
                            <strong>Reported Listing:</strong> ${report.reportedListingId}
                        </div>
                    ` : ''}
                    <div class="report-field">
                        <strong>Reporter:</strong> ${report.reporterId}
                    </div>
                    <div class="report-field">
                        <strong>Date:</strong> ${new Date(report.createdAt).toLocaleString()}
                    </div>
                </div>
                <div class="report-actions">
                    ${report.status === 'pending' ? `
                        <button class="btn-primary" onclick="window.adminDashboardUI.updateReport('${report.id}', 'reviewed')">
                            Mark as Reviewed
                        </button>
                        <button class="btn-success" onclick="window.adminDashboardUI.updateReport('${report.id}', 'resolved')">
                            Resolve
                        </button>
                    ` : ''}
                    ${report.status === 'reviewed' ? `
                        <button class="btn-success" onclick="window.adminDashboardUI.updateReport('${report.id}', 'resolved')">
                            Resolve
                        </button>
                    ` : ''}
                    <button class="btn-danger" onclick="window.adminDashboardUI.banUser('${report.reportedUserId || ''}')">
                        Ban User
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    /**
     * Show tab
     */
    showTab(tab: 'pending' | 'reviewed' | 'resolved' | 'all'): void {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        event?.target && (event.target as HTMLElement).classList.add('active');
        
        // Filter reports
        let filteredReports: AdminReport[] = [];
        if (tab === 'pending') filteredReports = this.reports.filter(r => r.status === 'pending');
        else if (tab === 'reviewed') filteredReports = this.reports.filter(r => r.status === 'reviewed');
        else if (tab === 'resolved') filteredReports = this.reports.filter(r => r.status === 'resolved');
        else filteredReports = this.reports;
        
        const contentDiv = document.getElementById('admin-reports-content');
        if (contentDiv) {
            contentDiv.innerHTML = this.renderReports(filteredReports);
        }
    }
    
    /**
     * Update report status
     */
    async updateReport(reportId: string, status: 'reviewed' | 'resolved'): Promise<void> {
        try {
            const response = await fetch('/.netlify/functions/api-admin-update-report', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authManager.getToken()}`,
                },
                body: JSON.stringify({
                    reportId,
                    status,
                }),
            });
            
            if (response.ok) {
                await this.loadReports();
                this.render();
                alert('✅ Report updated successfully!');
            } else {
                alert('❌ Failed to update report');
            }
        } catch (error) {
            console.error('Error updating report:', error);
            alert('❌ Error updating report');
        }
    }
    
    /**
     * Ban user
     */
    async banUser(userId: string): Promise<void> {
        if (!userId) {
            alert('No user ID provided');
            return;
        }
        
        const reason = prompt('Reason for ban:');
        if (!reason) return;
        
        const duration = prompt('Ban duration in days (leave empty for permanent):');
        const durationNum = duration ? parseInt(duration) : null;
        
        if (!confirm(`Are you sure you want to ban user ${userId}${durationNum ? ` for ${durationNum} days` : ' permanently'}?`)) {
            return;
        }
        
        try {
            const response = await fetch('/.netlify/functions/api-admin-ban-user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authManager.getToken()}`,
                },
                body: JSON.stringify({
                    userId,
                    reason,
                    duration: durationNum,
                }),
            });
            
            if (response.ok) {
                alert('✅ User banned successfully!');
                await this.loadReports();
                this.render();
            } else {
                const error = await response.json();
                alert(`❌ Failed to ban user: ${error.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error banning user:', error);
            alert('❌ Error banning user');
        }
    }
    
    /**
     * Hide dashboard
     */
    hide(): void {
        this.container.style.display = 'none';
    }
    
    /**
     * Inject admin dashboard styles
     */
    private injectStyles(): void {
        if (document.getElementById('admin-dashboard-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'admin-dashboard-styles';
        style.textContent = `
            .admin-dashboard {
                padding: 2rem;
                max-width: 1200px;
                margin: 0 auto;
                min-height: 100vh;
            }
            
            .admin-header {
                text-align: center;
                margin-bottom: 2rem;
            }
            
            .admin-header h1 {
                font-size: 2.5rem;
                color: #00d4ff;
                margin-bottom: 0.5rem;
            }
            
            .admin-stats {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 1.5rem;
                margin-bottom: 2rem;
            }
            
            .stat-card {
                background: rgba(0, 50, 100, 0.7);
                border: 3px solid #00d4ff;
                border-radius: 15px;
                padding: 1.5rem;
                text-align: center;
            }
            
            .stat-icon {
                font-size: 2.5rem;
                margin-bottom: 0.5rem;
            }
            
            .stat-value {
                font-size: 2rem;
                font-weight: bold;
                color: #00d4ff;
                margin-bottom: 0.5rem;
            }
            
            .stat-label {
                color: #88d0ff;
                font-size: 0.9rem;
            }
            
            .admin-tabs {
                display: flex;
                gap: 1rem;
                margin-bottom: 2rem;
                flex-wrap: wrap;
            }
            
            .tab-btn {
                padding: 0.75rem 1.5rem;
                background: rgba(0, 50, 100, 0.7);
                border: 2px solid #00d4ff;
                border-radius: 10px;
                color: #00d4ff;
                cursor: pointer;
                transition: all 0.3s;
            }
            
            .tab-btn:hover {
                background: rgba(0, 212, 255, 0.2);
            }
            
            .tab-btn.active {
                background: #00d4ff;
                color: #000;
                font-weight: bold;
            }
            
            .admin-reports-list {
                display: flex;
                flex-direction: column;
                gap: 1.5rem;
            }
            
            .report-card {
                background: rgba(0, 50, 100, 0.7);
                border: 3px solid #00d4ff;
                border-radius: 15px;
                padding: 1.5rem;
            }
            
            .report-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1rem;
            }
            
            .report-id {
                font-weight: bold;
                color: #00d4ff;
            }
            
            .report-status {
                padding: 0.5rem 1rem;
                border-radius: 8px;
                font-weight: bold;
                font-size: 0.9rem;
            }
            
            .report-status.pending {
                background: rgba(255, 193, 7, 0.3);
                color: #ffc107;
                border: 2px solid #ffc107;
            }
            
            .report-status.reviewed {
                background: rgba(0, 212, 255, 0.3);
                color: #00d4ff;
                border: 2px solid #00d4ff;
            }
            
            .report-status.resolved {
                background: rgba(76, 175, 80, 0.3);
                color: #4caf50;
                border: 2px solid #4caf50;
            }
            
            .report-body {
                margin-bottom: 1rem;
            }
            
            .report-field {
                margin-bottom: 0.75rem;
                color: #88d0ff;
            }
            
            .report-field strong {
                color: #00d4ff;
            }
            
            .report-actions {
                display: flex;
                gap: 1rem;
                flex-wrap: wrap;
            }
            
            .btn-success {
                background: linear-gradient(135deg, #4caf50 0%, #2e7d32 100%);
                border: 2px solid #4caf50;
                color: #fff;
            }
            
            .error-message {
                text-align: center;
                padding: 3rem;
                background: rgba(244, 67, 54, 0.2);
                border: 3px solid #f44336;
                border-radius: 20px;
            }
        `;
        document.head.appendChild(style);
    }
}
