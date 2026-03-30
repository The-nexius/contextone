-- Context One Database Schema
-- Run this in Supabase SQL Editor

-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    color TEXT DEFAULT '#3b82f6',
    icon TEXT DEFAULT '📁'
);

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    ai_tool TEXT NOT NULL, -- 'chatgpt', 'claude', 'gemini', 'perplexity', 'grok'
    title TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    message_count INTEGER DEFAULT 0,
    encrypted_data TEXT, -- AES-256-GCM encrypted blob (Pro users)
    embedding VECTOR(1536) -- for semantic search (pgvector)
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL, -- 'user' or 'assistant'
    content TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    token_count INTEGER,
    embedding VECTOR(1536) -- for semantic search
);

-- Key decisions extracted from conversations
CREATE TABLE IF NOT EXISTS key_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    decision TEXT NOT NULL,
    context TEXT, -- why this decision was made
    source_conversation_id UUID REFERENCES conversations(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    embedding VECTOR(1536)
);

-- Code snippets extracted
CREATE TABLE IF NOT EXISTS code_snippets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    language TEXT,
    code TEXT NOT NULL,
    description TEXT,
    source_conversation_id UUID REFERENCES conversations(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Injection logs (for analytics, not content)
CREATE TABLE IF NOT EXISTS injection_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    ai_tool TEXT,
    context_items_injected INTEGER,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE key_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_snippets ENABLE ROW LEVEL SECURITY;
ALTER TABLE injection_logs ENABLE ROW LEVEL SECURITY;

-- Projects: Users can only see their own projects
CREATE POLICY "Users can view own projects" ON projects
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects" ON projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON projects
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON projects
    FOR DELETE USING (auth.uid() = user_id);

-- Conversations: Users can only see their own conversations
CREATE POLICY "Users can view own conversations" ON conversations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations" ON conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations" ON conversations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations" ON conversations
    FOR DELETE USING (auth.uid() = user_id);

-- Messages: Users can only see their own messages
CREATE POLICY "Users can view own messages" ON messages
    FOR SELECT USING (
        auth.uid() IN (SELECT user_id FROM conversations WHERE id = messages.conversation_id)
    );

CREATE POLICY "Users can insert own messages" ON messages
    FOR INSERT WITH CHECK (
        auth.uid() IN (SELECT user_id FROM conversations WHERE id = messages.conversation_id)
    );

CREATE POLICY "Users can delete own messages" ON messages
    FOR DELETE USING (
        auth.uid() IN (SELECT user_id FROM conversations WHERE id = messages.conversation_id)
    );

-- Key decisions: Users can only see their own
CREATE POLICY "Users can view own key_decisions" ON key_decisions
    FOR SELECT USING (auth.uid() IN (SELECT user_id FROM projects WHERE id = key_decisions.project_id));

CREATE POLICY "Users can insert own key_decisions" ON key_decisions
    FOR INSERT WITH CHECK (auth.uid() IN (SELECT user_id FROM projects WHERE id = key_decisions.project_id));

CREATE POLICY "Users can delete own key_decisions" ON key_decisions
    FOR DELETE USING (auth.uid() IN (SELECT user_id FROM projects WHERE id = key_decisions.project_id));

-- Code snippets: Users can only see their own
CREATE POLICY "Users can view own code_snippets" ON code_snippets
    FOR SELECT USING (auth.uid() IN (SELECT user_id FROM projects WHERE id = code_snippets.project_id));

CREATE POLICY "Users can insert own code_snippets" ON code_snippets
    FOR INSERT WITH CHECK (auth.uid() IN (SELECT user_id FROM projects WHERE id = code_snippets.project_id));

CREATE POLICY "Users can delete own code_snippets" ON code_snippets
    FOR DELETE USING (auth.uid() IN (SELECT user_id FROM projects WHERE id = code_snippets.project_id));

-- Injection logs: Users can only see their own
CREATE POLICY "Users can view own injection_logs" ON injection_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own injection_logs" ON injection_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_project_id ON conversations(project_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_key_decisions_project_id ON key_decisions(project_id);
CREATE INDEX IF NOT EXISTS idx_code_snippets_project_id ON code_snippets(project_id);
CREATE INDEX IF NOT EXISTS idx_injection_logs_user_id ON injection_logs(user_id);

-- Create index for vector similarity search
CREATE INDEX IF NOT EXISTS idx_messages_embedding ON messages USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_conversations_embedding ON conversations USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_key_decisions_embedding ON key_decisions USING ivfflat (embedding vector_cosine_ops);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at on projects
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to auto-update last_message_at on conversations
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations 
    SET last_message_at = NOW(), 
        message_count = message_count + 1 
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_conversation_message_time AFTER INSERT ON messages
    FOR EACH ROW EXECUTE FUNCTION update_conversation_timestamp();

-- Enable Realtime for conversations table
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;