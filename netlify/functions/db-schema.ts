/**
 * Database Schema for Row-Trader
 * Run this to initialize tables in Neon DB
 */

import { neon } from '@neondatabase/serverless';

export interface DatabaseSchema {
    users: {
        id: string;
        email: string;
        username: string;
        role: 'parent' | 'child' | 'admin';
        parent_email?: string;
        rowbucks: number;
        favorite_games: string[];
        safety_quiz_completed: boolean;
        avatar_url?: string;
        avatar_pending_approval?: boolean;
        banned: boolean;
        banned_until?: Date;
        ban_reason?: string;
        created_at: Date;
        updated_at: Date;
    };
    listings: {
        id: string;
        user_id: string;
        game_id: string;
        item_name: string;
        item_description: string;
        item_type: 'block' | 'fish' | 'gem' | 'skin' | 'other';
        listing_type: 'sell' | 'swap' | 'open-to-offers';
        wants?: string;
        buy_now_price?: number;
        open_to_offers: boolean;
        examples?: string[];
        photo_urls?: string[]; // Array of image URLs
        status: 'active' | 'traded' | 'cancelled';
        average_rating?: number;
        review_count?: number;
        created_at: Date;
        updated_at: Date;
    };
    offers: {
        id: string;
        listing_id: string;
        from_user_id: string;
        to_user_id: string;
        offering: string;
        wanting: string;
        status: 'pending' | 'countered' | 'accepted' | 'declined' | 'transfer_pending' | 'completed';
        counter_offer_id?: string;
        transfer_code_from?: string; // Code from offerer
        transfer_code_to?: string; // Code from receiver
        transfer_confirmed_from?: boolean;
        transfer_confirmed_to?: boolean;
        transfer_expires_at?: Date;
        created_at: Date;
        updated_at: Date;
    };
    friends: {
        id: string;
        user_id: string;
        friend_id: string;
        status: 'pending' | 'accepted' | 'blocked';
        created_at: Date;
    };
    reviews: {
        id: string;
        trade_id: string;
        from_user_id: string;
        to_user_id: string;
        rating: number;
        comment: string;
        photo_url?: string; // Optional photo proof
        helpful_count: number;
        created_at: Date;
    };
    reports: {
        id: string;
        reporter_id: string;
        reported_user_id?: string;
        reported_listing_id?: string;
        reported_message_id?: string;
        reason: string;
        details: string;
        status: 'pending' | 'reviewed' | 'resolved';
        created_at: Date;
    };
    gifts: {
        id: string;
        from_user_id: string;
        to_user_id: string;
        item_name: string;
        item_description: string;
        game_id: string;
        rowbucks_bonus?: number;
        status: 'pending' | 'accepted' | 'declined';
        created_at: Date;
    };
    rowbucks_history: {
        id: string;
        user_id: string;
        type: 'earn' | 'spend' | 'gift';
        amount: number;
        reason: string;
        created_at: Date;
    };
}

/**
 * Initialize database schema
 * Run this once to create all tables
 */
export async function initializeSchema(sql: ReturnType<typeof neon>) {
    // Users table
    await sql`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            username TEXT NOT NULL,
            role TEXT NOT NULL CHECK (role IN ('parent', 'child', 'admin')),
            parent_email TEXT,
            rowbucks INTEGER DEFAULT 0,
            favorite_games TEXT[] DEFAULT '{}',
            safety_quiz_completed BOOLEAN DEFAULT FALSE,
            banned BOOLEAN DEFAULT FALSE,
            banned_until TIMESTAMP,
            ban_reason TEXT,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )
    `;

    // Listings table
    await sql`
        CREATE TABLE IF NOT EXISTS listings (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            game_id TEXT NOT NULL,
            item_name TEXT NOT NULL,
            item_description TEXT NOT NULL,
            item_type TEXT NOT NULL,
            listing_type TEXT NOT NULL,
            wants TEXT,
            buy_now_price INTEGER,
            open_to_offers BOOLEAN DEFAULT FALSE,
            examples TEXT[],
            photo_urls TEXT[] DEFAULT '{}',
            status TEXT NOT NULL DEFAULT 'active',
            average_rating NUMERIC(3,2),
            review_count INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )
    `;

    // Offers table
    await sql`
        CREATE TABLE IF NOT EXISTS offers (
            id TEXT PRIMARY KEY,
            listing_id TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
            from_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            to_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            offering TEXT NOT NULL,
            wanting TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            counter_offer_id TEXT REFERENCES offers(id),
            transfer_code_from TEXT,
            transfer_code_to TEXT,
            transfer_confirmed_from BOOLEAN DEFAULT FALSE,
            transfer_confirmed_to BOOLEAN DEFAULT FALSE,
            transfer_expires_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )
    `;

    // Friends table
    await sql`
        CREATE TABLE IF NOT EXISTS friends (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            friend_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            status TEXT NOT NULL DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(user_id, friend_id)
        )
    `;

    // Reviews table
    await sql`
        CREATE TABLE IF NOT EXISTS reviews (
            id TEXT PRIMARY KEY,
            trade_id TEXT NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
            from_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            to_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
            comment TEXT NOT NULL,
            photo_url TEXT,
            helpful_count INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT NOW()
        )
    `;

    // Reports table
    await sql`
        CREATE TABLE IF NOT EXISTS reports (
            id TEXT PRIMARY KEY,
            reporter_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            reported_user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
            reported_listing_id TEXT REFERENCES listings(id) ON DELETE CASCADE,
            reported_message_id TEXT,
            reason TEXT NOT NULL,
            details TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT NOW()
        )
    `;

    // Gifts table
    await sql`
        CREATE TABLE IF NOT EXISTS gifts (
            id TEXT PRIMARY KEY,
            from_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            to_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            item_name TEXT NOT NULL,
            item_description TEXT NOT NULL,
            game_id TEXT NOT NULL,
            rowbucks_bonus INTEGER DEFAULT 0,
            status TEXT NOT NULL DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT NOW()
        )
    `;

    // Rowbucks history table
    await sql`
        CREATE TABLE IF NOT EXISTS rowbucks_history (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            type TEXT NOT NULL CHECK (type IN ('earn', 'spend', 'gift')),
            amount INTEGER NOT NULL,
            reason TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT NOW()
        )
    `;

    // Admin actions table (for audit log)
    await sql`
        CREATE TABLE IF NOT EXISTS admin_actions (
            id TEXT PRIMARY KEY,
            admin_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            action_type TEXT NOT NULL,
            target_user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
            details JSONB,
            created_at TIMESTAMP DEFAULT NOW()
        )
    `;

    // Create indexes for performance
    await sql`CREATE INDEX IF NOT EXISTS idx_listings_user_id ON listings(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_listings_game_id ON listings(game_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_offers_listing_id ON offers(listing_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_offers_from_user ON offers(from_user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_offers_to_user ON offers(to_user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_friends_user_id ON friends(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON friends(friend_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_reviews_to_user ON reviews(to_user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_users_banned ON users(banned)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_id ON admin_actions(admin_id)`;

    console.log('✅ Database schema initialized');
}
