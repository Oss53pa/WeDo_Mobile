-- ============================================================
-- Wedo Tontine Digitale - Complete Supabase Migration
-- Schema + RLS + Storage + Triggers + RPC Functions
-- ============================================================

-- ============================================================
-- PART 1: ENUM TYPES
-- ============================================================

CREATE TYPE reputation_level AS ENUM ('Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond');
CREATE TYPE kyc_level AS ENUM ('0', '1', '2', '3');
CREATE TYPE mobile_money_operator AS ENUM ('M-Pesa', 'Orange Money', 'MTN Money', 'Moov Money', 'Wave', 'Airtel Money');
CREATE TYPE tontine_type AS ENUM ('ROSCA', 'ASCRA', 'Commercial');
CREATE TYPE tontine_status AS ENUM ('Open', 'Active', 'Completed', 'Cancelled');
CREATE TYPE tontine_category AS ENUM ('Family', 'Friends', 'Professional', 'Community');
CREATE TYPE frequency AS ENUM ('Daily', 'Weekly', 'BiWeekly', 'Monthly');
CREATE TYPE distribution_order AS ENUM ('Random', 'Fixed', 'Auction', 'Vote');
CREATE TYPE member_role AS ENUM ('Admin', 'Secretary', 'Treasurer', 'Member', 'Observer');
CREATE TYPE member_status AS ENUM ('Pending', 'Active', 'Suspended', 'Expelled');
CREATE TYPE contribution_status AS ENUM ('Pending', 'Paid', 'Late', 'Failed');
CREATE TYPE distribution_status AS ENUM ('Scheduled', 'Processing', 'Completed', 'Failed');
CREATE TYPE transaction_type AS ENUM ('Contribution', 'Distribution', 'Penalty', 'Refund', 'Deposit');
CREATE TYPE transaction_status AS ENUM ('Pending', 'Completed', 'Failed');
CREATE TYPE message_type AS ENUM ('Text', 'Image', 'Document', 'System');
CREATE TYPE notification_type AS ENUM (
  'PaymentDue', 'PaymentSuccess', 'PaymentLate',
  'DistributionUpcoming', 'DistributionReceived',
  'JoinRequest', 'JoinApproved', 'JoinRejected',
  'TontineCompleted', 'TontineStarted',
  'Message', 'VoteCreated', 'VoteClosed',
  'MemberJoined', 'MemberLeft', 'ReputationChange', 'System'
);
CREATE TYPE vote_type AS ENUM ('RuleChange', 'MemberExpulsion', 'OrderChange', 'ExtensionRequest', 'General');
CREATE TYPE vote_status AS ENUM ('Open', 'Closed');
CREATE TYPE vote_choice AS ENUM ('Yes', 'No', 'Abstain');
CREATE TYPE reputation_event_type AS ENUM (
  'OnTimePayment', 'LatePayment1to3Days', 'LatePayment4to7Days',
  'LatePaymentBeyond7Days', 'TontineCompleted', 'PositiveRating',
  'ReferralBonus', 'CommunityHelp'
);
CREATE TYPE invitation_status AS ENUM ('Pending', 'Accepted', 'Rejected');

-- ============================================================
-- PART 2: TABLES
-- ============================================================

-- Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  profile_photo_url TEXT,
  reputation_score INTEGER NOT NULL DEFAULT 0,
  reputation_level reputation_level NOT NULL DEFAULT 'Bronze',
  kyc_level INTEGER NOT NULL DEFAULT 0,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  city TEXT,
  region TEXT,
  date_of_birth DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User Statistics
CREATE TABLE user_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  tontines_completed INTEGER NOT NULL DEFAULT 0,
  active_tontines INTEGER NOT NULL DEFAULT 0,
  total_contributed BIGINT NOT NULL DEFAULT 0,
  total_received BIGINT NOT NULL DEFAULT 0,
  on_time_payment_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  late_payments_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Mobile Money Accounts
CREATE TABLE mobile_money_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  operator mobile_money_operator NOT NULL,
  account_number TEXT NOT NULL,
  account_name TEXT,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tontines
CREATE TABLE tontines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category tontine_category NOT NULL,
  type tontine_type NOT NULL,
  creator_id UUID NOT NULL REFERENCES profiles(id),
  contribution_amount BIGINT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'XOF',
  frequency frequency NOT NULL,
  total_members INTEGER NOT NULL,
  current_members INTEGER NOT NULL DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE,
  status tontine_status NOT NULL DEFAULT 'Open',
  distribution_order distribution_order NOT NULL,
  late_penalty_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  grace_period_days INTEGER NOT NULL DEFAULT 0,
  management_fee_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  min_reputation_required INTEGER NOT NULL DEFAULT 0,
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  deposit_amount BIGINT NOT NULL DEFAULT 0,
  photo_url TEXT,
  chat_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  voting_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  auto_approve BOOLEAN NOT NULL DEFAULT FALSE,
  allow_observers BOOLEAN NOT NULL DEFAULT FALSE,
  current_round INTEGER NOT NULL DEFAULT 0,
  total_rounds INTEGER NOT NULL DEFAULT 0,
  current_balance BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tontine Members
CREATE TABLE tontine_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tontine_id UUID NOT NULL REFERENCES tontines(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  role member_role NOT NULL DEFAULT 'Member',
  status member_status NOT NULL DEFAULT 'Pending',
  reception_order INTEGER,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total_contributed BIGINT NOT NULL DEFAULT 0,
  total_received BIGINT NOT NULL DEFAULT 0,
  late_payments_count INTEGER NOT NULL DEFAULT 0,
  is_current_beneficiary BOOLEAN NOT NULL DEFAULT FALSE,
  has_received BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE(tontine_id, user_id)
);

-- Tontine Invitations
CREATE TABLE tontine_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tontine_id UUID NOT NULL REFERENCES tontines(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES profiles(id),
  invitee_phone TEXT NOT NULL,
  status invitation_status NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days')
);

-- Contributions
CREATE TABLE contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tontine_id UUID NOT NULL REFERENCES tontines(id),
  member_id UUID NOT NULL REFERENCES tontine_members(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  amount BIGINT NOT NULL,
  penalty_amount BIGINT NOT NULL DEFAULT 0,
  round INTEGER NOT NULL,
  due_date DATE NOT NULL,
  paid_date TIMESTAMPTZ,
  status contribution_status NOT NULL DEFAULT 'Pending',
  payment_method TEXT,
  transaction_id UUID,
  receipt_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Distributions
CREATE TABLE distributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tontine_id UUID NOT NULL REFERENCES tontines(id),
  recipient_id UUID NOT NULL REFERENCES profiles(id),
  amount BIGINT NOT NULL,
  round INTEGER NOT NULL,
  scheduled_date DATE NOT NULL,
  distributed_date TIMESTAMPTZ,
  status distribution_status NOT NULL DEFAULT 'Scheduled',
  transaction_id UUID,
  receipt_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Transactions
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  tontine_id UUID NOT NULL REFERENCES tontines(id),
  type transaction_type NOT NULL,
  amount BIGINT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'XOF',
  status transaction_status NOT NULL DEFAULT 'Pending',
  description TEXT NOT NULL,
  reference_id UUID,
  external_transaction_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto Pay Configs
CREATE TABLE auto_pay_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  tontine_id UUID NOT NULL REFERENCES tontines(id),
  payment_method_id UUID NOT NULL REFERENCES mobile_money_accounts(id),
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  days_before INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, tontine_id)
);

-- Messages (Chat)
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tontine_id UUID NOT NULL REFERENCES tontines(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id),
  content TEXT NOT NULL,
  message_type message_type NOT NULL DEFAULT 'Text',
  attachment_url TEXT,
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Message Reads
CREATE TABLE message_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type notification_type NOT NULL,
  related_id UUID,
  related_data JSONB,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  action_url TEXT
);

-- Notification Settings
CREATE TABLE notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  push_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  sms_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  email_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  notification_preferences JSONB NOT NULL DEFAULT '{}',
  quiet_hours JSONB NOT NULL DEFAULT '{"enabled": false, "startTime": "22:00", "endTime": "08:00"}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Votes
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tontine_id UUID NOT NULL REFERENCES tontines(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  vote_type vote_type NOT NULL,
  status vote_status NOT NULL DEFAULT 'Open',
  required_majority NUMERIC(3,2) NOT NULL DEFAULT 0.50,
  end_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Vote Ballots
CREATE TABLE vote_ballots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vote_id UUID NOT NULL REFERENCES votes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  choice vote_choice NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(vote_id, user_id)
);

-- Ratings
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tontine_id UUID NOT NULL REFERENCES tontines(id),
  rater_id UUID NOT NULL REFERENCES profiles(id),
  rated_id UUID NOT NULL REFERENCES profiles(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  punctuality_score INTEGER NOT NULL CHECK (punctuality_score >= 1 AND punctuality_score <= 5),
  communication_score INTEGER NOT NULL CHECK (communication_score >= 1 AND communication_score <= 5),
  reliability_score INTEGER NOT NULL CHECK (reliability_score >= 1 AND reliability_score <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tontine_id, rater_id, rated_id)
);

-- Badges
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  icon_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User Badges
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id),
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- Reputation Events
CREATE TABLE reputation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tontine_id UUID REFERENCES tontines(id),
  event_type reputation_event_type NOT NULL,
  points_change INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Device Tokens (Push Notifications)
CREATE TABLE device_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  device_token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  device_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, device_id)
);

-- ============================================================
-- PART 3: INDEXES
-- ============================================================

CREATE INDEX idx_profiles_phone ON profiles(phone_number);
CREATE INDEX idx_mobile_money_user ON mobile_money_accounts(user_id);
CREATE INDEX idx_tontines_creator ON tontines(creator_id);
CREATE INDEX idx_tontines_status ON tontines(status);
CREATE INDEX idx_tontines_public ON tontines(is_public) WHERE is_public = TRUE;
CREATE INDEX idx_tontine_members_tontine ON tontine_members(tontine_id);
CREATE INDEX idx_tontine_members_user ON tontine_members(user_id);
CREATE INDEX idx_contributions_tontine ON contributions(tontine_id);
CREATE INDEX idx_contributions_user ON contributions(user_id);
CREATE INDEX idx_contributions_status ON contributions(status);
CREATE INDEX idx_distributions_tontine ON distributions(tontine_id);
CREATE INDEX idx_distributions_recipient ON distributions(recipient_id);
CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_tontine ON transactions(tontine_id);
CREATE INDEX idx_messages_tontine ON messages(tontine_id);
CREATE INDEX idx_messages_created ON messages(tontine_id, created_at DESC);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_votes_tontine ON votes(tontine_id);
CREATE INDEX idx_reputation_events_user ON reputation_events(user_id);

-- ============================================================
-- PART 4: TRIGGERS
-- ============================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER user_statistics_updated_at BEFORE UPDATE ON user_statistics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tontines_updated_at BEFORE UPDATE ON tontines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER auto_pay_configs_updated_at BEFORE UPDATE ON auto_pay_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER notification_settings_updated_at BEFORE UPDATE ON notification_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER device_tokens_updated_at BEFORE UPDATE ON device_tokens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, phone_number, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.phone, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.email, '')
  );

  INSERT INTO user_statistics (user_id) VALUES (NEW.id);
  INSERT INTO notification_settings (user_id) VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- PART 5: RPC FUNCTIONS
-- ============================================================

-- Increment member count
CREATE OR REPLACE FUNCTION increment_member_count(p_tontine_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE tontines SET current_members = current_members + 1
  WHERE id = p_tontine_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Decrement member count
CREATE OR REPLACE FUNCTION decrement_member_count(p_tontine_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE tontines SET current_members = GREATEST(current_members - 1, 0)
  WHERE id = p_tontine_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get tontine stats
CREATE OR REPLACE FUNCTION get_tontine_stats(p_tontine_id UUID)
RETURNS TABLE (
  total_contributions BIGINT,
  total_distributions BIGINT,
  current_balance BIGINT,
  average_punctuality NUMERIC,
  completion_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(c.amount) FILTER (WHERE c.status = 'Paid'), 0)::BIGINT AS total_contributions,
    COALESCE(SUM(d.amount) FILTER (WHERE d.status = 'Completed'), 0)::BIGINT AS total_distributions,
    t.current_balance,
    COALESCE(AVG(
      CASE WHEN c.status = 'Paid' AND c.paid_date <= c.due_date THEN 100.0 ELSE 0.0 END
    ), 0) AS average_punctuality,
    CASE WHEN t.total_rounds > 0
      THEN (t.current_round::NUMERIC / t.total_rounds::NUMERIC * 100)
      ELSE 0
    END AS completion_rate
  FROM tontines t
  LEFT JOIN contributions c ON c.tontine_id = t.id
  LEFT JOIN distributions d ON d.tontine_id = t.id
  WHERE t.id = p_tontine_id
  GROUP BY t.id, t.current_balance, t.current_round, t.total_rounds;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Search tontines (full text)
CREATE OR REPLACE FUNCTION search_tontines(query TEXT)
RETURNS SETOF tontines AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM tontines
  WHERE is_public = TRUE
    AND status IN ('Open', 'Active')
    AND (
      name ILIKE '%' || query || '%'
      OR description ILIKE '%' || query || '%'
    )
  ORDER BY current_members DESC, created_at DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- PART 6: ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE mobile_money_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tontines ENABLE ROW LEVEL SECURITY;
ALTER TABLE tontine_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tontine_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_pay_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vote_ballots ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE reputation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;

-- Helper: check if user is member of a tontine
CREATE OR REPLACE FUNCTION is_tontine_member(p_tontine_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM tontine_members
    WHERE tontine_id = p_tontine_id AND user_id = p_user_id AND status = 'Active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper: check if user is admin/treasurer of tontine
CREATE OR REPLACE FUNCTION is_tontine_admin(p_tontine_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM tontine_members
    WHERE tontine_id = p_tontine_id AND user_id = p_user_id
      AND role IN ('Admin', 'Treasurer') AND status = 'Active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PROFILES
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT USING (TRUE);
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- USER STATISTICS
CREATE POLICY "Stats viewable by owner"
  ON user_statistics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Stats updatable by system"
  ON user_statistics FOR UPDATE USING (auth.uid() = user_id);

-- MOBILE MONEY ACCOUNTS
CREATE POLICY "MoMo accounts viewable by owner"
  ON mobile_money_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "MoMo accounts insertable by owner"
  ON mobile_money_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "MoMo accounts updatable by owner"
  ON mobile_money_accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "MoMo accounts deletable by owner"
  ON mobile_money_accounts FOR DELETE USING (auth.uid() = user_id);

-- TONTINES
CREATE POLICY "Public tontines viewable by all"
  ON tontines FOR SELECT USING (
    is_public = TRUE
    OR creator_id = auth.uid()
    OR is_tontine_member(id, auth.uid())
  );
CREATE POLICY "Tontines insertable by authenticated"
  ON tontines FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Tontines updatable by admin"
  ON tontines FOR UPDATE USING (is_tontine_admin(id, auth.uid()));
CREATE POLICY "Tontines deletable by creator if open"
  ON tontines FOR DELETE USING (creator_id = auth.uid() AND status = 'Open');

-- TONTINE MEMBERS
CREATE POLICY "Members viewable by tontine members"
  ON tontine_members FOR SELECT USING (
    is_tontine_member(tontine_id, auth.uid())
    OR user_id = auth.uid()
  );
CREATE POLICY "Members insertable by self"
  ON tontine_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Members updatable by self or admin"
  ON tontine_members FOR UPDATE USING (
    user_id = auth.uid()
    OR is_tontine_admin(tontine_id, auth.uid())
  );

-- TONTINE INVITATIONS
CREATE POLICY "Invitations viewable by inviter or invitee"
  ON tontine_invitations FOR SELECT USING (
    inviter_id = auth.uid()
    OR is_tontine_member(tontine_id, auth.uid())
  );
CREATE POLICY "Invitations insertable by members"
  ON tontine_invitations FOR INSERT WITH CHECK (
    is_tontine_member(tontine_id, auth.uid())
  );
CREATE POLICY "Invitations updatable by inviter"
  ON tontine_invitations FOR UPDATE USING (inviter_id = auth.uid());

-- CONTRIBUTIONS
CREATE POLICY "Contributions viewable by tontine members"
  ON contributions FOR SELECT USING (
    is_tontine_member(tontine_id, auth.uid())
  );
CREATE POLICY "Contributions insertable by self"
  ON contributions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Contributions updatable by self"
  ON contributions FOR UPDATE USING (auth.uid() = user_id);

-- DISTRIBUTIONS
CREATE POLICY "Distributions viewable by tontine members"
  ON distributions FOR SELECT USING (
    is_tontine_member(tontine_id, auth.uid())
  );
CREATE POLICY "Distributions insertable by admin"
  ON distributions FOR INSERT WITH CHECK (
    is_tontine_admin(tontine_id, auth.uid())
  );

-- TRANSACTIONS
CREATE POLICY "Transactions viewable by owner"
  ON transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Transactions insertable by self"
  ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- AUTO PAY CONFIGS
CREATE POLICY "AutoPay viewable by owner"
  ON auto_pay_configs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "AutoPay insertable by owner"
  ON auto_pay_configs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "AutoPay updatable by owner"
  ON auto_pay_configs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "AutoPay deletable by owner"
  ON auto_pay_configs FOR DELETE USING (auth.uid() = user_id);

-- MESSAGES
CREATE POLICY "Messages viewable by tontine members"
  ON messages FOR SELECT USING (
    is_tontine_member(tontine_id, auth.uid())
  );
CREATE POLICY "Messages insertable by tontine members"
  ON messages FOR INSERT WITH CHECK (
    auth.uid() = sender_id
    AND is_tontine_member(tontine_id, auth.uid())
  );

-- MESSAGE READS
CREATE POLICY "Message reads viewable by self"
  ON message_reads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Message reads insertable by self"
  ON message_reads FOR INSERT WITH CHECK (auth.uid() = user_id);

-- NOTIFICATIONS
CREATE POLICY "Notifications viewable by owner"
  ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Notifications updatable by owner"
  ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Notifications deletable by owner"
  ON notifications FOR DELETE USING (auth.uid() = user_id);

-- NOTIFICATION SETTINGS
CREATE POLICY "NotifSettings viewable by owner"
  ON notification_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "NotifSettings updatable by owner"
  ON notification_settings FOR UPDATE USING (auth.uid() = user_id);

-- VOTES
CREATE POLICY "Votes viewable by tontine members"
  ON votes FOR SELECT USING (
    is_tontine_member(tontine_id, auth.uid())
  );
CREATE POLICY "Votes insertable by tontine members"
  ON votes FOR INSERT WITH CHECK (
    auth.uid() = created_by
    AND is_tontine_member(tontine_id, auth.uid())
  );
CREATE POLICY "Votes updatable by creator"
  ON votes FOR UPDATE USING (auth.uid() = created_by);

-- VOTE BALLOTS
CREATE POLICY "Ballots viewable by tontine members"
  ON vote_ballots FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM votes v
      WHERE v.id = vote_id
        AND is_tontine_member(v.tontine_id, auth.uid())
    )
  );
CREATE POLICY "Ballots insertable by self"
  ON vote_ballots FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RATINGS
CREATE POLICY "Ratings viewable by all authenticated"
  ON ratings FOR SELECT USING (TRUE);
CREATE POLICY "Ratings insertable by rater"
  ON ratings FOR INSERT WITH CHECK (auth.uid() = rater_id);

-- BADGES
CREATE POLICY "Badges viewable by all"
  ON badges FOR SELECT USING (TRUE);

-- USER BADGES
CREATE POLICY "User badges viewable by all"
  ON user_badges FOR SELECT USING (TRUE);

-- REPUTATION EVENTS
CREATE POLICY "Rep events viewable by owner"
  ON reputation_events FOR SELECT USING (auth.uid() = user_id);

-- DEVICE TOKENS
CREATE POLICY "Device tokens viewable by owner"
  ON device_tokens FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Device tokens insertable by owner"
  ON device_tokens FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Device tokens updatable by owner"
  ON device_tokens FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Device tokens deletable by owner"
  ON device_tokens FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- PART 7: STORAGE BUCKETS
-- ============================================================

INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', TRUE);
INSERT INTO storage.buckets (id, name, public) VALUES ('tontine-photos', 'tontine-photos', TRUE);
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-attachments', 'chat-attachments', FALSE);
INSERT INTO storage.buckets (id, name, public) VALUES ('kyc-documents', 'kyc-documents', FALSE);
INSERT INTO storage.buckets (id, name, public) VALUES ('receipts', 'receipts', FALSE);

-- Avatars: public read, owner write
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );
CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE USING (
    bucket_id = 'avatars' AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );
CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE USING (
    bucket_id = 'avatars' AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );

-- Tontine photos: public read, admin write
CREATE POLICY "Tontine photos are publicly accessible"
  ON storage.objects FOR SELECT USING (bucket_id = 'tontine-photos');
CREATE POLICY "Tontine admins can upload photos"
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'tontine-photos'
  );

-- Chat attachments: tontine members only
CREATE POLICY "Chat attachments readable by tontine members"
  ON storage.objects FOR SELECT USING (
    bucket_id = 'chat-attachments'
  );
CREATE POLICY "Chat attachments uploadable by tontine members"
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'chat-attachments'
  );

-- KYC documents: owner only
CREATE POLICY "KYC docs readable by owner"
  ON storage.objects FOR SELECT USING (
    bucket_id = 'kyc-documents' AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );
CREATE POLICY "KYC docs uploadable by owner"
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'kyc-documents' AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );

-- Receipts: owner only
CREATE POLICY "Receipts readable by owner"
  ON storage.objects FOR SELECT USING (
    bucket_id = 'receipts' AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );
CREATE POLICY "Receipts uploadable by owner"
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'receipts' AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );

-- ============================================================
-- PART 8: REALTIME
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE messages, notifications, contributions, distributions, tontine_members;
