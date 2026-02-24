/**
 * Avatar UI Component
 * Customizable cartoon avatars with parent approval
 */

import { useTradingStoreExtended } from '../stores/TradingStoreExtended';
import { authManager } from '../systems/AuthManager';

export class AvatarUI {
    private container: HTMLElement;
    private store = useTradingStoreExtended;
    
    // Pre-made avatar templates (Rowblocks-themed)
    private templates = [
        { id: 'block-diver', name: 'Block Diver', emoji: '🧩', colors: ['#00d4ff', '#0088cc'] },
        { id: 'fish-helmet', name: 'Fish Helmet', emoji: '🐟', colors: ['#ffd700', '#ffaa00'] },
        { id: 'gem-crown', name: 'Gem Crown', emoji: '💎', colors: ['#00ffff', '#0088ff'] },
        { id: 'wave-rider', name: 'Wave Rider', emoji: '🌊', colors: ['#00d4ff', '#0066cc'] },
        { id: 'treasure-hunter', name: 'Treasure Hunter', emoji: '🗺️', colors: ['#ff6b35', '#ffaa00'] },
    ];
    
    constructor(containerId: string) {
        const container = document.getElementById(containerId);
        if (!container) {
            throw new Error(`Container ${containerId} not found`);
        }
        this.container = container;
    }
    
    /**
     * Show avatar selector/builder
     */
    show(): void {
        const currentAvatar = this.store.getState().avatar;
        const user = this.store.getState().currentUser;
        const isChild = user?.user_metadata?.role === 'child';
        
        this.container.style.display = 'block';
        this.container.innerHTML = `
            <div class="avatar-modal">
                <div class="avatar-content">
                    <div class="avatar-header">
                        <h2>🎨 Choose Your Avatar</h2>
                        <button class="btn-close" onclick="window.avatarUI.hide()">×</button>
                    </div>
                    
                    ${currentAvatar?.pendingApproval ? `
                        <div class="avatar-pending">
                            <p>⏳ Your avatar is pending parent approval</p>
                            <p class="subtitle">Your parent will review it soon!</p>
                        </div>
                    ` : ''}
                    
                    <div class="avatar-current">
                        ${currentAvatar ? `
                            <div class="current-avatar">
                                <img src="${currentAvatar.url}" alt="Current Avatar" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 100 100%27%3E%3Ccircle cx=%2750%27 cy=%2750%27 r=%2740%27 fill=%27%2300d4ff%27/%3E%3Ctext x=%2750%27 y=%2765%27 font-size=%2740%27 text-anchor=%27middle%27 fill=%27white%27%3E🧩%3C/text%3E%3C/svg%3E'">
                                <p>Current Avatar</p>
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="avatar-options">
                        <h3>Choose a Template</h3>
                        <div class="avatar-templates">
                            ${this.templates.map(template => `
                                <div class="avatar-template" onclick="window.avatarUI.selectTemplate('${template.id}')">
                                    <div class="template-preview" style="background: linear-gradient(135deg, ${template.colors[0]} 0%, ${template.colors[1]} 100%);">
                                        <span class="template-emoji">${template.emoji}</span>
                                    </div>
                                    <p>${template.name}</p>
                                </div>
                            `).join('')}
                        </div>
                        
                        <h3>Or Upload Custom (Cartoon Only)</h3>
                        <div class="avatar-upload">
                            <input type="file" id="avatar-upload" accept="image/*" style="display: none;" onchange="window.avatarUI.handleUpload(event)">
                            <button class="btn-primary" onclick="document.getElementById('avatar-upload').click()">
                                📷 Upload Avatar
                            </button>
                            <p class="upload-hint">Cartoon images only - no real photos!</p>
                        </div>
                    </div>
                    
                    ${isChild ? `
                        <div class="parent-notice">
                            <p>👨‍👩‍👧 Parent approval required for avatar changes</p>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
        
        (window as any).avatarUI = this;
        this.injectStyles();
    }
    
    /**
     * Select template avatar
     */
    async selectTemplate(templateId: string): Promise<void> {
        const template = this.templates.find(t => t.id === templateId);
        if (!template) return;
        
        // Generate SVG avatar from template
        const avatarUrl = this.generateTemplateAvatar(template);
        
        const user = this.store.getState().currentUser;
        const isChild = user?.user_metadata?.role === 'child';
        
        // Upload to Blobs (or use data URL for templates)
        try {
            if (isChild) {
                // Child account - needs parent approval
                this.store.getState().setAvatar(avatarUrl, true);
                await this.uploadAvatar(avatarUrl, true);
                alert('✅ Avatar submitted! Waiting for parent approval.');
            } else {
                // Parent/admin - immediate
                this.store.getState().setAvatar(avatarUrl, false);
                await this.uploadAvatar(avatarUrl, false);
                alert('✅ Avatar updated!');
            }
            this.hide();
        } catch (error) {
            console.error('Error setting avatar:', error);
            alert('❌ Failed to set avatar');
        }
    }
    
    /**
     * Handle file upload
     */
    async handleUpload(event: Event): Promise<void> {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('⚠️ Please upload an image file');
            return;
        }
        
        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            alert('⚠️ Image too large (max 2MB)');
            return;
        }
        
        // Safety check: Would use Function to validate it's cartoon-like
        // For now, just proceed with upload
        
        const user = this.store.getState().currentUser;
        const isChild = user?.user_metadata?.role === 'child';
        
        try {
            // Upload to Blobs
            const avatarUrl = await this.uploadAvatarFile(file);
            
            if (isChild) {
                this.store.getState().setAvatar(avatarUrl, true);
                alert('✅ Avatar uploaded! Waiting for parent approval.');
            } else {
                this.store.getState().setAvatar(avatarUrl, false);
                alert('✅ Avatar updated!');
            }
            this.hide();
        } catch (error) {
            console.error('Error uploading avatar:', error);
            alert('❌ Failed to upload avatar');
        }
    }
    
    /**
     * Generate template avatar (SVG)
     */
    private generateTemplateAvatar(template: typeof this.templates[0]): string {
        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                <defs>
                    <linearGradient id="grad-${template.id}" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:${template.colors[0]};stop-opacity:1" />
                        <stop offset="100%" style="stop-color:${template.colors[1]};stop-opacity:1" />
                    </linearGradient>
                </defs>
                <circle cx="50" cy="50" r="45" fill="url(#grad-${template.id})"/>
                <text x="50" y="65" font-size="50" text-anchor="middle">${template.emoji}</text>
            </svg>
        `;
        return 'data:image/svg+xml;base64,' + btoa(svg);
    }
    
    /**
     * Upload avatar file to Netlify Blobs
     */
    private async uploadAvatarFile(file: File): Promise<string> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'avatar');
        
        const response = await fetch('/.netlify/functions/api-upload-avatar', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authManager.getToken()}`,
            },
            body: formData,
        });
        
        if (!response.ok) {
            throw new Error('Upload failed');
        }
        
        const data = await response.json();
        return data.avatarUrl;
    }
    
    /**
     * Upload avatar URL (for templates)
     */
    private async uploadAvatar(avatarUrl: string, pendingApproval: boolean): Promise<void> {
        const response = await fetch('/.netlify/functions/api-upload-avatar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authManager.getToken()}`,
            },
            body: JSON.stringify({
                avatarUrl,
                pendingApproval,
            }),
        });
        
        if (!response.ok) {
            throw new Error('Upload failed');
        }
    }
    
    /**
     * Hide avatar UI
     */
    hide(): void {
        this.container.style.display = 'none';
    }
    
    /**
     * Inject styles
     */
    private injectStyles(): void {
        if (document.getElementById('avatar-ui-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'avatar-ui-styles';
        style.textContent = `
            .avatar-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 10, 30, 0.95);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
                backdrop-filter: blur(10px);
            }
            
            .avatar-content {
                background: linear-gradient(135deg, rgba(0, 30, 60, 0.95) 0%, rgba(0, 50, 100, 0.95) 100%);
                border: 3px solid #00d4ff;
                border-radius: 25px;
                padding: 2rem;
                max-width: 600px;
                width: 90%;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 0 50px rgba(0, 212, 255, 0.5);
            }
            
            .avatar-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1.5rem;
            }
            
            .avatar-header h2 {
                color: #00d4ff;
                font-size: 2rem;
            }
            
            .btn-close {
                background: none;
                border: none;
                color: #00d4ff;
                font-size: 2rem;
                cursor: pointer;
                padding: 0;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                transition: all 0.3s;
            }
            
            .btn-close:hover {
                background: rgba(0, 212, 255, 0.2);
            }
            
            .avatar-pending {
                background: rgba(255, 193, 7, 0.2);
                border: 2px solid #ffc107;
                border-radius: 15px;
                padding: 1rem;
                margin-bottom: 1.5rem;
                text-align: center;
            }
            
            .avatar-pending p {
                color: #ffc107;
                margin: 0.5rem 0;
            }
            
            .current-avatar {
                text-align: center;
                margin-bottom: 2rem;
            }
            
            .current-avatar img {
                width: 120px;
                height: 120px;
                border-radius: 50%;
                border: 3px solid #00d4ff;
                margin-bottom: 0.5rem;
            }
            
            .avatar-templates {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
                gap: 1rem;
                margin-bottom: 2rem;
            }
            
            .avatar-template {
                cursor: pointer;
                text-align: center;
                transition: all 0.3s;
            }
            
            .avatar-template:hover {
                transform: scale(1.1);
            }
            
            .template-preview {
                width: 100px;
                height: 100px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 0.5rem;
                border: 3px solid #00d4ff;
            }
            
            .template-emoji {
                font-size: 3rem;
            }
            
            .avatar-upload {
                text-align: center;
                margin-bottom: 1rem;
            }
            
            .upload-hint {
                color: #88d0ff;
                font-size: 0.9rem;
                margin-top: 0.5rem;
            }
            
            .parent-notice {
                background: rgba(0, 212, 255, 0.2);
                border: 2px solid #00d4ff;
                border-radius: 15px;
                padding: 1rem;
                text-align: center;
                margin-top: 1rem;
            }
            
            .parent-notice p {
                color: #00d4ff;
                margin: 0;
            }
        `;
        document.head.appendChild(style);
    }
}
